# HOWTO: Build a cross-video graph and watch entities merge

A hands-on walkthrough: ingest one video, ingest a second, and see how the same
real-world thing appearing in both collapses into a **single shared node**. This
is the core idea of the project — *the graph grows richer instead of duplicating.*

> Setup (deps, `.env`, Neo4j) is covered in the [README](README.md). This guide
> assumes `make install` is done and your `.env` has working `NEO4J_*`,
> `OPENAI_API_KEY`, and `TWELVE_LABS_API_KEY`.

All commands run from the repo root unless noted. Start from a clean graph:

```bash
make reset      # ⚠️ deletes ALL nodes in the Neo4j database
```

---

## Step 1 — Add the first video

We'll use the vendored sample (an 85-second _Big Buck Bunny_ excerpt in
`data/videos/`). With no arguments, `make seed` ingests every `.mp4` there:

```bash
make seed
```

What happens, in order (all from `backend/scripts/ingest.py`):

1. **TwelveLabs** indexes the clip (Marengo + Pegasus).
2. **Pegasus** analyzes it into a time-coded description.
3. **OpenAI** structures that prose into segments, each with a summary,
   on-screen text, transcript, and **canonicalized** entities + topics.
4. **Marengo** embeds each segment (512-dim) for the Neo4j vector index.
5. **Neo4j** stores the graph.

You'll see it finish with something like `Wrote video '...' (10 segments)`.

### Inspect what got created

Ask in the app's chat (`make start`) *"What videos do we have and what are they
about?"*, or run Cypher directly (Neo4j Browser, or chat → `run_cypher`):

```cypher
MATCH (v:Video)-[:HAS_SEGMENT]->(:Segment)-[:MENTIONS]->(e:Entity)
RETURN v.title AS video, collect(DISTINCT e.name) AS entities
```

For the sample clip this yields one `Video`, **10 `Segment`s**, and entities like:

```
Rabbit (animal) ×9   Tree (object) ×5   Butterfly (animal) ×4
Grass ×2   Sky ×2   Apple ×2   Flower   Cloud   Meadow   Vegetation
```

At this point there's nothing to merge yet — it's one video's worth of nodes.

---

## Step 2 — Add a second video

Now add a **different** clip. For a guaranteed overlap we use a second _Big Buck
Bunny_ excerpt — the 10-second opening (its main subject is the same tree):

```bash
# a public MP4 URL (TwelveLabs fetches it server-side)
make seed VIDEOS="https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_5MB.mp4"
```

> Any of the three loading methods works here — public URL, a local file in
> `data/videos/`, or an already-indexed `--video-id`. See the README's
> "Loading videos" section.

This second clip produces its **own** `Video` and `Segment` nodes, and its own
entities — including one named **"Tree"**.

---

## Step 3 — See the merge

The second clip's "Tree" did **not** become a new node. It merged into the
existing one. Find every entity that now spans more than one video:

```cypher
MATCH (v:Video)-[:HAS_SEGMENT]->(:Segment)-[:MENTIONS]->(e:Entity)
WITH e, collect(DISTINCT v.title) AS videos, count(DISTINCT v) AS n
WHERE n > 1
RETURN e.name AS entity, e.type AS type, videos ORDER BY n DESC
```

Result:

```
entity   type      videos
Tree     object    [Big_Buck_Bunny_720_10s_5MB, bbb_1080p_30fps_normal_85sec]
```

One `Tree` node, both videos. Look at its connections:

```cypher
MATCH (v:Video)-[:HAS_SEGMENT]->(s:Segment)-[:MENTIONS]->(e:Entity {key:'tree'})
RETURN v.title AS video, s.start_sec AS start, s.end_sec AS end
ORDER BY video, start
```

```
video                        start  end
Big_Buck_Bunny_720_10s_5MB     0     10      ← from video A
bbb_1080p_30fps_normal_85sec   0     10      ┐
bbb_1080p_30fps_normal_85sec  10     22      │
bbb_1080p_30fps_normal_85sec  22     31      ├─ from video B
bbb_1080p_30fps_normal_85sec  55     65      │
bbb_1080p_30fps_normal_85sec  65     73      ┘
```

`Tree` is now a **hub** with 6 `MENTIONS` edges reaching into both videos:

```
                    ┌─ 0–10s   ── Big_Buck_Bunny_720_10s   (video A)
   (Tree)           │
   one node ◄─MENTIONS┼─ 0–10s   ┐
                    ├─ 10–22s   ├─ bbb_..._85sec            (video B)
                    ├─ 22–31s   │
                    ├─ 55–65s   │
                    └─ 65–73s   ┘
```

**In the app:** ask *"Show me everything involving Tree"* — the agent calls its
`explore_graph` tool and the graph view lights up the Tree hub linked to
segments of both videos.

---

## How the merge works

The magic is one line in `backend/scripts/ingest.py`. Each entity is written with
`MERGE` on a **normalized key**, not `CREATE`:

```cypher
MERGE (e:Entity {key: ent.key})        // ent.key = " ".join(name.lower().split())
SET   e.name = ent.name, e.type = ent.type, e.domain = $domain
MERGE (s)-[:MENTIONS]->(e)
```

- `MERGE` means *"match if it exists, otherwise create."* So the first "Tree"
  creates the node; every later "Tree" (from any video) matches the same one.
- The match key is `key`, the **normalized name** (lowercased, whitespace-folded),
  guarded by a uniqueness constraint (`cypher/schema.cypher`). "Tree", "tree",
  and " Tree " all resolve to key `tree` → one node.
- `Topic` nodes work identically (`MERGE (t:Topic {key: top.key})`).
- `Video` and `Segment` nodes are **never** merged across videos — they're the
  per-video facts. Entities and Topics are the shared connective tissue that
  ties videos together.

Because entity names come from an LLM, consistent naming matters — that's why
step 3 of ingestion asks OpenAI to **canonicalize** names (Title Case, singular,
no dupes) so "bunnies", "a bunny", and "Bunny" don't fragment into three nodes.

### Re-running is safe

Ingesting the same video again is **idempotent**: its old segments are deleted
and rewritten, while shared entities/topics stay `MERGE`'d. Tweak the pipeline
and re-seed without piling up duplicates.

---

## Tips for a good merge demo

- **Pick clips that share a subject** — the same person, place, object, or brand.
  Shared entities are what create the hubs; clips with nothing in common produce
  two disconnected islands (e.g. a snowy-mountain clip shares nothing with a
  forest clip).
- **Richer/longer clips → more hubs.** The 10-second opening only had "Tree" to
  share; a fuller clip would also merge Rabbit, Butterfly, Apple, and more.
- **Watch topics too** — the same `WHERE n > 1` query works for `Topic` if you
  swap `MENTIONS`→`ABOUT` and `Entity`→`Topic`.
- **Start clean** with `make reset` when you want a fresh graph for a demo.
