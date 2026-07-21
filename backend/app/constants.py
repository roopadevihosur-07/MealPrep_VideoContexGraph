"""Constants for the Video Context Graph."""

# ---------------------------------------------------------------------------
# Vector index configuration — semantic search over video segments.
# The dimension is authoritatively set from the Marengo embedding at ingest
# time (see scripts/ingest.py); this is the default/hint used before ingest.
# ---------------------------------------------------------------------------
SEGMENT_VECTOR_INDEX = "segment_embeddings"
SEGMENT_VECTOR_LABEL = "Segment"
SEGMENT_VECTOR_PROPERTY = "embedding"
DEFAULT_EMBEDDING_DIMENSIONS = 512

# ---------------------------------------------------------------------------
# Query defaults
# ---------------------------------------------------------------------------
DEFAULT_SEARCH_LIMIT = 20
DEFAULT_QUERY_TIMEOUT = 30.0
