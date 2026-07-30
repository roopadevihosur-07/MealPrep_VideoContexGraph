// Schema for the Video Agent Context Graph
// TwelveLabs (Marengo + Pegasus) -> Neo4j context graph
//
// Thesis: video is evidence. Each Video is broken into time-coded Segments;
// Pegasus/OpenAI extract Entities and Topics per segment; Entities and Topics
// are MERGE'd by normalized name so the SAME entity across many independent
// videos collapses to ONE node — the graph grows richer, not more duplicated.

// --- Core video domain -----------------------------------------------------
CREATE CONSTRAINT video_id_unique IF NOT EXISTS FOR (n:Video) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT segment_id_unique IF NOT EXISTS FOR (n:Segment) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT entity_key_unique IF NOT EXISTS FOR (n:Entity) REQUIRE n.key IS UNIQUE;
CREATE CONSTRAINT topic_key_unique IF NOT EXISTS FOR (n:Topic) REQUIRE n.key IS UNIQUE;

CREATE INDEX video_title IF NOT EXISTS FOR (n:Video) ON (n.title);
CREATE INDEX segment_video_id IF NOT EXISTS FOR (n:Segment) ON (n.video_id);
CREATE INDEX entity_name IF NOT EXISTS FOR (n:Entity) ON (n.name);
CREATE INDEX entity_type IF NOT EXISTS FOR (n:Entity) ON (n.type);
CREATE INDEX topic_name IF NOT EXISTS FOR (n:Topic) ON (n.name);

// Domain scoping (all queries filter by n.domain to support multi-domain reuse)
CREATE INDEX video_domain IF NOT EXISTS FOR (n:Video) ON (n.domain);
CREATE INDEX entity_domain IF NOT EXISTS FOR (n:Entity) ON (n.domain);

// Full-text over human-readable text for keyword fallback / hybrid search
CREATE FULLTEXT INDEX segment_fulltext IF NOT EXISTS
FOR (n:Segment) ON EACH [n.summary, n.on_screen_text, n.transcript];

// --- Claim nodes (nutritional facts extracted per segment) ------------------
CREATE CONSTRAINT claim_id_unique IF NOT EXISTS FOR (n:Claim) REQUIRE n.id IS UNIQUE;
CREATE INDEX claim_text IF NOT EXISTS FOR (n:Claim) ON (n.text);
CREATE INDEX claim_domain IF NOT EXISTS FOR (n:Claim) ON (n.domain);

// --- Vector index for semantic segment search ------------------------------
// Created programmatically by scripts/ingest.py once the true Marengo embedding
// dimension is known (it varies by Marengo version). Template shown for reference:
//
// CREATE VECTOR INDEX segment_embeddings IF NOT EXISTS
// FOR (n:Segment) ON (n.embedding)
// OPTIONS { indexConfig: {
//   `vector.dimensions`: <DIM>, `vector.similarity_function`: 'cosine' } };
