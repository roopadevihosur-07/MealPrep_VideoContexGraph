# Meal Prep - Video Agent Context Graph

**Video is evidence.** Point it at raw video and this app builds a live Neo4j
knowledge graph of what is *shown, said, and written* — then lets an
OpenAI-brained agent answer questions over it, with a live graph visualization.

> Uses all four: **TwelveLabs** (Marengo + Pegasus video understanding) ·
> **OpenAI** (agent brain + entity canonicalization) · **AWS Strands** (agent +
> tool orchestration) · **Neo4j** (context graph + vector index + NVL viz).

The thesis: the same entity seen across many independent videos MERGEs to **one**
node — so the graph grows richer instead of duplicating.

## Architecture

```
video-context-graph/
├── backend/          FastAPI + Strands (OpenAI) agent, TwelveLabs ingestion
│   ├── app/twelvelabs_client.py   Marengo embed/search + Pegasus analyze
│   ├── app/agent.py               OpenAI agent + graph tools (SSE streaming)
│   ├── app/vector_client.py       Neo4j vector search over segment embeddings
│   ├── app/routes.py              FastAPI endpoints
│   └── scripts/ingest.py          video -> Pegasus -> OpenAI -> Neo4j pipeline
├── frontend/         Next.js + Chakra UI + NVL (chat | graph | video inspector | meal-prep dashboard)
├── cypher/schema.cypher           constraints + vector index
├── data/ontology.yaml             Video/Segment/Entity/Topic ontology
└── .env                           credentials (not committed)
```

### Meal prep dashboard

On top of the generic video-context-graph pipeline, this app adds a meal-prep
domain layer: video extraction is enriched with ingredients, cooking
techniques, nutrition, allergens, and yield/serving info, aggregated per video
in `GET /api/meal-prep/{video_id}/details` and rendered as a dedicated
dashboard (`frontend/components/MealPrepDashboard.tsx`). See
[SEGMENT_GUIDE.md](SEGMENT_GUIDE.md) for the full segment schema and how it's
captured.

> Numeric nutrition fields (calories, protein/carbs/fat, servings) are only
> populated when the video actually states them — the extraction prompt
> reports what's shown/said rather than estimating, so a video with no
> on-screen nutrition facts will show `0` there while ingredients/techniques/
> allergens still populate normally.

### Graph model

```
(:Video)-[:HAS_SEGMENT]->(:Segment {embedding})   // vector index on Segment.embedding
(:Segment)-[:NEXT]->(:Segment)                     // temporal order
(:Segment)-[:MENTIONS]->(:Entity)                  // MERGE'd across videos (key = normalized name)
(:Segment)-[:ABOUT]->(:Topic)                      // MERGE'd across videos (key = normalized name)
```

`Entity` and `Topic` nodes are keyed by their **normalized name**, so the same
person/place/object appearing in two different videos collapses to one node —
that shared node is the whole point.

## Prerequisites

- **[uv](https://docs.astral.sh/uv/)** (Python 3.10–3.13) — backend
- **Node.js 18+** / npm — frontend
- **Neo4j 2025.x+** — Aura free (`neo4j+s://…`) or local Docker (`make docker-up`).
  A vector index is required, which modern Neo4j provides out of the box.
- **API keys**: [OpenAI](https://platform.openai.com/) and
  [TwelveLabs](https://playground.twelvelabs.io/) (a free tier works).

## Quick start

```bash
cp .env.example .env      # fill in NEO4J_*, OPENAI_API_KEY, TWELVE_LABS_API_KEY
make install              # backend (uv sync) + frontend (npm install)
make seed                 # ingest the vendored sample clip -> build the graph
make start                # backend :8000 + frontend :3000
```

- **Frontend:** http://localhost:3000 — chat, live NVL graph, video inspector
- **Backend:** http://localhost:8000 — `GET /health`, `/api/...`

Open the frontend, ask *"What videos do we have and what are they about?"*, and
watch the graph light up.

---

## Loading videos

All ingestion goes through `backend/scripts/ingest.py`. `make seed` is a thin
wrapper around it. There are **three ways** to add a video, and you can mix them.

### Zero config: `make seed` with no arguments

Running `make seed` with **no arguments** ingests every `.mp4` in
`data/videos/` (not committed — see below), falling back to
`SAMPLE_VIDEO_URLS` in `.env` (a small Big Buck Bunny clip) if that directory
is empty:

```bash
make seed
```

Drop your own `.mp4` files into `data/videos/` and they'll be picked up the
same way. Video files aren't tracked in git — bring your own media rather than
relying on a bundled sample (see [Sample video & attribution](#sample-video--attribution)).

### 1. Public MP4 URL (simplest)

TwelveLabs downloads the file server-side, so the URL must be **directly and
publicly fetchable**.

```bash
# via make (uses the same index as everything else)
make seed VIDEOS="https://example.com/a.mp4 https://example.com/b.mp4"

# or call the script directly
cd backend && uv run python scripts/ingest.py https://example.com/a.mp4
```

### 2. Local `.mp4` file

The file is uploaded into your TwelveLabs index. After indexing, the app stores
the HLS URL TwelveLabs returns so the clip still plays back in the UI.

```bash
cd backend && uv run python scripts/ingest.py /path/to/clip.mp4
```

### 3. A video already indexed in your TwelveLabs account (no re-upload)

If you already indexed a video in TwelveLabs, ingest it straight into the graph
by id — this skips upload/indexing and goes right to analyze → embed → write.

```bash
cd backend && uv run python scripts/ingest.py \
    --index-id=<TL_INDEX_ID> --video-id=<TL_VIDEO_ID>
```

> The `index_id`/`video_id` **must belong to the account behind
> `TWELVE_LABS_API_KEY`** in your `.env`. Ids from a different account return
> `403 read_not_allowed`.

### What ingestion does (per video)

1. **Index** the video with TwelveLabs (Marengo + Pegasus) — `tasks.create` +
   `wait_for_done` (skipped for method 3).
2. **Analyze** with **Pegasus** → a rich, time-coded description.
3. **Structure** that prose with **OpenAI Structured Outputs** → schema-validated
   segments, each with a summary, on-screen text, transcript, canonicalized
   entities, and topics.
4. **Embed** each segment with **Marengo** (512-dim) for the Neo4j vector index.
5. **Write** to Neo4j: `Video`/`Segment` created, `Entity`/`Topic` **MERGE**'d
   across videos, a temporal `NEXT` chain, and the vector index ensured.

Indexing a short clip takes ~1–2 minutes; longer videos take proportionally more.

### Video requirements

- **Format/access:** direct MP4 over http(s). YouTube/Drive/S3-signed **share**
  links do **not** work — TwelveLabs must be able to `GET` the raw file.
  (The old `commondatastorage.googleapis.com/gtv-videos-bucket/*` samples now
  return 403; `https://test-videos.co.uk/...` clips are known-good.)
- **Resolution:** use **360p or higher** — very small frames are rejected.
- **Duration:** at least ~4 seconds.
- See [TwelveLabs' limits](https://docs.twelvelabs.io/) for exact size/duration bounds.

### Re-ingesting is safe (idempotent)

Re-running ingestion for the same video **replaces** that video's old segments
(and their embeddings) and re-MERGEs shared entities/topics — no duplicate
`Video`/`Segment` nodes. So you can tweak the pipeline and re-seed freely.

### See the cross-video merge

Ingest **two different clips that share a subject** (e.g. both feature the same
person, place, or object). Their shared `Entity`/`Topic` nodes become a single
node connected to both videos — visible as a hub in the graph.

👉 **[HOWTO.md](HOWTO.md)** is a step-by-step walkthrough of adding a first
video, then a second, and exactly how/why the entities and topics merge.

### Reset the graph

```bash
make reset        # ⚠️ DETACH DELETE every node in the Neo4j database
make schema       # re-apply constraints + indexes only (no data)
```

`make reset` wipes the **entire** database, not just this domain — don't run it
against a Neo4j instance you share with other data.

---

## Configuration (`.env`)

| Variable | Default | Purpose |
|---|---|---|
| `NEO4J_URI` | `neo4j://localhost:7687` | Bolt URI (Aura: `neo4j+s://…`) |
| `NEO4J_USERNAME` / `NEO4J_PASSWORD` | `neo4j` / — | Neo4j auth |
| `NEO4J_DATABASE` | `neo4j` | Target database |
| `OPENAI_API_KEY` | — | Agent reasoning + structured video extraction |
| `OPENAI_MODEL` | `gpt-5.6` | Strands agent reasoning and graph tools |
| `OPENAI_EXTRACTION_MODEL` | `gpt-5.6-terra` | Schema-validated video and entity extraction |
| `OPENAI_REASONING_EFFORT` | `low` | Keeps agent and extraction responses fast; also accepts `none` |
| `TWELVE_LABS_API_KEY` | — | Read by the TwelveLabs SDK |
| `TL_INDEX_ID` | *(empty)* | Reuse a specific index; else created/found by name |
| `TL_INDEX_NAME` | `video-context-graph` | Index name when creating |
| `MARENGO_MODEL` | `marengo3.0` | Index + search model |
| `PEGASUS_MODEL` | `pegasus1.2` | Analyze model (index-creatable) |
| `MARENGO_EMBED_MODEL` | `marengo3.0` | Segment embeddings (512-dim) |
| `SAMPLE_VIDEO_URLS` | a Big Buck Bunny clip | Default clip(s) for `make seed` |
| `DOMAIN_ID` | `video-context-graph` | Tags all nodes; keep consistent across ingest + app |
| `BACKEND_PORT` / `FRONTEND_PORT` | `8000` / `3000` | Ports |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated allowed origins |

### Models — why these versions

| Role | Value | Note |
|---|---|---|
| Index + search | `marengo3.0` | multimodal (visual + audio + transcription) |
| Analyze | `pegasus1.2` | the Pegasus version an index accepts at creation |
| Segment embeddings | `marengo3.0` | 512-dim text embeddings → Neo4j vector index |
| Agent brain | `gpt-5.6` | via Strands `OpenAIResponsesModel`, with low reasoning |
| Video extraction | `gpt-5.6-terra` | OpenAI Structured Outputs with a typed segment schema |

> Note: TwelveLabs accepts `pegasus1.2` when **creating** an index but
> `pegasus1.5` is analyze-only. The embedding dimension (512 for `marengo3.0`)
> is auto-detected at ingest time and the vector index is created to match.

---

## Make targets

| Target | What it does |
|---|---|
| `make install` | Install backend (uv) + frontend (npm) deps |
| `make seed [VIDEOS="..."]` | Ingest videos (env sample, or the given URLs/paths) |
| `make schema` | Apply Neo4j constraints + indexes only |
| `make start` | Run backend + frontend together |
| `make dev-backend` / `dev-frontend` | Run one side |
| `make reset` | ⚠️ Delete all nodes in Neo4j |
| `make test-connection` | Verify Neo4j connectivity |
| `make docker-up` / `docker-down` | Local Neo4j via Docker |
| `make test` | Backend unit tests, frontend type-check, and end-to-end test discovery |
| `make test-e2e` | Run end-to-end tests against the running, seeded application |
| `make lint` | Linters |

## API endpoints

| Method + path | Purpose |
|---|---|
| `GET /health` | Backend + Neo4j status |
| `POST /api/chat` | One-shot agent turn |
| `POST /api/chat/stream` | Streaming agent turn (SSE) |
| `GET /api/videos` | List ingested videos + segment counts |
| `GET /api/videos/{id}/segments` | A video's segments in order, with meal-prep context (ingredients, techniques, nutrition, allergens) |
| `GET /api/meal-prep/{id}/details` | Aggregated meal-prep breakdown for a video: total/per-serving nutrition, ingredients, techniques, allergens, health claims |
| `POST /api/search` | Live multimodal search via TwelveLabs |
| `GET /api/schema` · `GET /api/schema/visualization` | Graph schema |
| `POST /api/expand` | Neighbors of a node (graph drill-down) |
| `POST /api/cypher` | Run a read Cypher query |

## The agent's tools

- `search_video_moments` — embed the query with Marengo, vector-search Segments (find-the-moment)
- `explore_graph` — traverse everything involving an entity/topic/video across all videos
- `twelvelabs_search` — live multimodal Marengo search straight from TwelveLabs
- `run_cypher` / `get_graph_schema` — arbitrary read-only graph access

---

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `media_url_not_accessible` on ingest | The URL isn't directly fetchable by TwelveLabs. Use a raw MP4 link (not a share/streaming page). |
| `403 read_not_allowed` with `--video-id` | That video/index belongs to a different TwelveLabs account than `TWELVE_LABS_API_KEY`. Use the matching key, or re-upload the file. |
| `parameter_invalid ... model_name` | Index creation only accepts `marengo3.0` + `pegasus1.2`. Check `MARENGO_MODEL`/`PEGASUS_MODEL`. |
| Ingest succeeds but 0 segments / empty entities | The clip has little to describe (e.g. a static cartoon frame). Try a richer/longer clip. |
| Health shows `degraded`, `neo4j:false` | Neo4j unreachable — check `NEO4J_URI/USERNAME/PASSWORD`; `make test-connection`. |
| Nodes tagged with the wrong `domain` | `DOMAIN_ID` in `.env` differs from when you ingested. Keep it consistent; re-seed or re-tag. |
| Vector search returns nothing | Vector index not built (no embeddings were produced). Re-run `make seed`. |
| Meal-prep dashboard shows all `0`s | Either the video predates the meal-prep extraction schema (re-run `uv run python scripts/ingest.py --video-id=<TL_VIDEO_ID>` to re-extract with the current schema — safe/idempotent, see above), or the video simply never states explicit calories/macros/servings. |

---

## Sample video & attribution

`data/videos/` is **not** tracked in git (video files are large binaries and
often carry redistribution restrictions), so a fresh clone starts with an
empty directory. Zero-config `make seed` still works via the
`SAMPLE_VIDEO_URLS` fallback in `.env` — a small Creative Commons
(CC-BY 3.0) _Big Buck Bunny_ clip fetched from a public test-video host at
seed time, rather than a bundled file.

**Bring your own media responsibly.** Any video you add to `data/videos/` (e.g.
`meal_prep_youtube.mp4` used for local testing/demoing) is your responsibility —
ensure you hold the rights or a license that permits your use, and don't commit
it to a public repo without confirming you're allowed to redistribute it. This
project makes no representation about third-party clips you choose to ingest.
See [`data/videos/ATTRIBUTION.md`](data/videos/ATTRIBUTION.md).

---

> started from
> [create-context-graph](https://github.com/neo4j-labs/create-context-graph),
> repointed to video. Maintained by the community; not officially supported.
