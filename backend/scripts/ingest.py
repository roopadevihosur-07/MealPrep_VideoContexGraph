"""Ingest videos into the Neo4j Video Context Graph.

Pipeline (uses all four sponsor tools):
  1. TwelveLabs Marengo+Pegasus index the video (client.tasks.create).
  2. Pegasus analyzes it into a rich, time-coded description.
  3. OpenAI structures that description into segments + canonicalized
     entities/topics (JSON mode).
  4. Marengo embeds each segment summary -> Neo4j vector index.
  5. Neo4j stores Video/Segment/Entity/Topic, MERGE'ing entities & topics by
     normalized key so the same thing across videos collapses to one node.

Run:  uv run python scripts/ingest.py [VIDEO_URL | FILE.mp4 ...]
With no args it ingests the vendored sample(s) in data/videos/*.mp4, falling
back to SAMPLE_VIDEO_URLS from .env if that directory is empty.
"""

from __future__ import annotations

import asyncio
import json
import logging
import sys
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("ingest")

sys.path.insert(0, ".")

from app.config import settings  # noqa: E402
from app.context_graph_client import connect_neo4j, close_neo4j, execute_cypher  # noqa: E402
from app.vector_client import ensure_segment_vector_index  # noqa: E402
from app import twelvelabs_client as tl  # noqa: E402


PEGASUS_PROMPT = (
    "Analyze this video and break it into its distinct segments in chronological "
    "order. For each segment give: the approximate start and end time in seconds, "
    "a one-sentence description of what is happening (who/what is visible), any "
    "visible on-screen text, and any spoken words. Also name the overall topics. "
    "Be concrete and specific about people, organizations, places, objects, and brands."
)

STRUCTURE_SYSTEM = (
    "You convert a video analysis into strict JSON. Output ONLY a JSON object of the form:\n"
    '{"video_summary": str, "segments": [{"start_sec": number, "end_sec": number, '
    '"summary": str, "on_screen_text": str, "transcript": str, '
    '"entities": [{"name": str, "type": one of '
    '["person","organization","location","object","product","brand","event","concept"]}], '
    '"topics": [str]}]}\n'
    "Canonicalize entity and topic names (Title Case, singular, no duplicates within a segment). "
    "Use the SAME canonical name for the same real-world thing so it can be merged across videos."
)


def _norm_key(name: str) -> str:
    return " ".join(name.strip().lower().split())


def _vendored_samples() -> list[str]:
    """Return vendored sample clips shipped in the repo's data/videos/ dir."""
    vids = Path(__file__).resolve().parents[2] / "data" / "videos"
    return sorted(str(p) for p in vids.glob("*.mp4")) if vids.is_dir() else []


def structure_with_openai(pegasus_text: str) -> dict:
    """Turn Pegasus prose into a strict segments JSON via OpenAI."""
    from openai import OpenAI

    client = OpenAI(api_key=settings.openai_api_key or None)
    resp = client.chat.completions.create(
        model=settings.openai_model,
        response_format={"type": "json_object"},
        temperature=0.1,
        messages=[
            {"role": "system", "content": STRUCTURE_SYSTEM},
            {"role": "user", "content": f"Video analysis:\n\n{pegasus_text}"},
        ],
    )
    return json.loads(resp.choices[0].message.content)


async def apply_schema() -> None:
    """Run the constraint/index statements from cypher/schema.cypher."""
    with open("../cypher/schema.cypher", "r") as f:
        body = f.read()
    # Strip //-comment lines FIRST so a ';' inside a comment can't split a statement.
    code = "\n".join(ln for ln in body.splitlines() if not ln.strip().startswith("//"))
    for stmt in [s.strip() for s in code.split(";") if s.strip()]:
        try:
            await execute_cypher(stmt, collect=False)
        except Exception as e:
            log.warning("schema stmt skipped: %s (%s)", stmt[:60], e)


async def write_video(video: dict, segments: list[dict]) -> None:
    """Write one video and its segments/entities/topics to Neo4j."""
    domain = settings.domain_id
    await execute_cypher(
        """
        MERGE (v:Video {id: $id})
        SET v.title = $title, v.url = $url, v.duration_sec = $duration_sec,
            v.summary = $summary, v.tl_index_id = $tl_index_id, v.domain = $domain
        """,
        {**video, "domain": domain},
        collect=False,
    )

    # Idempotent re-ingest: drop this video's old segments (entities/topics are
    # shared and stay MERGE'd) so re-running seed can't violate the unique
    # constraint on Segment.id or leave stale segments behind.
    await execute_cypher(
        "MATCH (:Video {id: $vid})-[:HAS_SEGMENT]->(s:Segment) DETACH DELETE s",
        {"vid": video["id"]},
        collect=False,
    )

    seg_rows = []
    for i, s in enumerate(segments):
        seg_rows.append({
            "id": f"{video['id']}#{i}",
            "idx": i,
            "video_id": video["id"],
            "start_sec": s.get("start_sec"),
            "end_sec": s.get("end_sec"),
            "summary": s.get("summary", ""),
            "on_screen_text": s.get("on_screen_text", ""),
            "transcript": s.get("transcript", ""),
            "embedding": s.get("embedding"),
            "entities": [{"key": _norm_key(e["name"]), "name": e["name"].strip(),
                          "type": e.get("type", "concept")}
                         for e in s.get("entities", []) if e.get("name")],
            "topics": [{"key": _norm_key(t), "name": t.strip()}
                       for t in s.get("topics", []) if t],
        })

    await execute_cypher(
        """
        MATCH (v:Video {id: $vid})
        UNWIND $rows AS row
          CREATE (s:Segment {id: row.id})
          SET s.video_id = row.video_id, s.start_sec = row.start_sec,
              s.end_sec = row.end_sec, s.summary = row.summary,
              s.on_screen_text = row.on_screen_text, s.transcript = row.transcript,
              s.embedding = row.embedding, s.domain = $domain, s.idx = row.idx
          MERGE (v)-[:HAS_SEGMENT]->(s)
          FOREACH (ent IN row.entities |
            MERGE (e:Entity {key: ent.key})
            SET e.name = ent.name, e.type = ent.type, e.domain = $domain
            MERGE (s)-[:MENTIONS]->(e))
          FOREACH (top IN row.topics |
            MERGE (t:Topic {key: top.key})
            SET t.name = top.name, t.domain = $domain
            MERGE (s)-[:ABOUT]->(t))
        """,
        {"vid": video["id"], "rows": seg_rows, "domain": domain},
        collect=False,
    )

    # temporal NEXT chain
    await execute_cypher(
        """
        MATCH (v:Video {id: $vid})-[:HAS_SEGMENT]->(s:Segment)
        WITH s ORDER BY s.idx
        WITH collect(s) AS segs
        UNWIND range(0, size(segs)-2) AS i
          WITH segs[i] AS a, segs[i+1] AS b
          MERGE (a)-[:NEXT]->(b)
        """,
        {"vid": video["id"]},
        collect=False,
    )


async def _analyze_embed_write(index_id: str, video_id: str, url: str | None,
                               title: str, duration_sec) -> int:
    """Shared tail: Pegasus analyze -> OpenAI structure -> Marengo embed -> Neo4j."""
    log.info("Analyzing video_id=%s with Pegasus ...", video_id)
    pegasus_text = tl.analyze_video(video_id, PEGASUS_PROMPT)
    structured = structure_with_openai(pegasus_text)
    segments = structured.get("segments", [])
    log.info("Structured into %d segments. Embedding ...", len(segments))

    dim = 0
    for s in segments:
        basis = " ".join(filter(None, [s.get("summary"), s.get("on_screen_text"), s.get("transcript")]))
        try:
            vec = tl.embed_text(basis or s.get("summary", ""))
            s["embedding"] = vec
            dim = dim or len(vec)
        except Exception as e:
            log.warning("  embed failed for a segment: %s", e)
            s["embedding"] = None

    video = {
        "id": video_id,
        "title": title,
        "url": url,
        "duration_sec": duration_sec,
        "summary": structured.get("video_summary", ""),
        "tl_index_id": index_id,
    }
    await write_video(video, segments)
    log.info("Wrote video '%s' (%d segments) to Neo4j", title, len(segments))
    return dim


async def ingest_new(index_id: str, source: str) -> int:
    """Ingest a NEW video from a public URL or a local file path."""
    is_file = not source.lower().startswith(("http://", "https://"))
    log.info("Indexing %s: %s ...", "file" if is_file else "url", source)
    cb = lambda st: log.info("  status: %s", st)  # noqa: E731
    if is_file:
        info = tl.ingest_video(index_id, video_file=source, on_update=cb)
    else:
        info = tl.ingest_video(index_id, video_url=source, on_update=cb)

    video_id = info.get("video_id")
    if not video_id:
        log.error("No video_id returned for %s — skipping", source)
        return 0

    title = (info.get("filename") or source.rsplit("/", 1)[-1]).rsplit(".", 1)[0]
    # A local upload has no public URL for playback — pull the HLS URL from TL.
    url = None if is_file else source
    if is_file:
        try:
            url = tl.get_video_meta(index_id, video_id).get("url")
        except Exception:
            pass
    return await _analyze_embed_write(index_id, video_id, url, title, info.get("duration_sec"))


async def ingest_existing(index_id: str, video_id: str) -> int:
    """Ingest a video ALREADY indexed in TwelveLabs, by (index_id, video_id)."""
    log.info("Ingesting existing video %s from index %s ...", video_id, index_id)
    try:
        meta = tl.get_video_meta(index_id, video_id)
    except Exception as e:
        log.error("Cannot read video %s in index %s (wrong index/key?): %s", video_id, index_id, e)
        return 0
    title = (meta.get("filename") or video_id).rsplit(".", 1)[0]
    return await _analyze_embed_write(index_id, video_id, meta.get("url"),
                                      title, meta.get("duration_sec"))


async def main() -> None:
    args = sys.argv[1:]
    schema_only = "--schema-only" in args
    index_override: str | None = None
    video_ids: list[str] = []
    sources: list[str] = []
    for a in args:
        if a == "--schema-only":
            continue
        if a.startswith("--index-id="):
            index_override = a.split("=", 1)[1]
        elif a.startswith("--video-id="):
            video_ids.append(a.split("=", 1)[1])
        elif a.startswith("--"):
            log.warning("unknown flag %s", a)
        else:
            sources.append(a)
    if not sources and not video_ids and not schema_only:
        sources = _vendored_samples() or settings.sample_video_url_list
        if sources:
            log.info("No inputs given — using vendored sample(s): %s", ", ".join(sources))

    if schema_only:
        await connect_neo4j()
        try:
            await apply_schema()
            log.info("Schema applied.")
        finally:
            await close_neo4j()
        return

    if not sources and not video_ids:
        log.error("Nothing to ingest. Pass URLs / file paths / --video-id=..., or set SAMPLE_VIDEO_URLS.")
        return

    await connect_neo4j()
    try:
        await apply_schema()
        # For existing-video ingestion the index is provided; otherwise create/reuse ours.
        if index_override:
            index_id = index_override
        elif settings.tl_index_id:
            index_id = settings.tl_index_id
        else:
            index_id = await asyncio.to_thread(tl.ensure_index)
        log.info("Using TwelveLabs index %s", index_id)

        dim = 0
        for vid in video_ids:
            try:
                d = await ingest_existing(index_id, vid)
                dim = dim or d
            except Exception as e:
                log.exception("Failed to ingest existing video %s: %s", vid, e)
        for src in sources:
            try:
                d = await ingest_new(index_id, src)
                dim = dim or d
            except Exception as e:
                log.exception("Failed to ingest %s: %s", src, e)

        if dim:
            await ensure_segment_vector_index(dim)
            log.info("Vector index ready (dim=%d)", dim)
        else:
            log.warning("No embeddings produced — vector index not created.")
    finally:
        await close_neo4j()


if __name__ == "__main__":
    asyncio.run(main())
