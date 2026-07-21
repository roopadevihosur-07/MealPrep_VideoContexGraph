"""Vector search over video segments (Neo4j vector index)."""

from __future__ import annotations

import logging

from app.constants import (
    SEGMENT_VECTOR_INDEX,
    SEGMENT_VECTOR_LABEL,
    SEGMENT_VECTOR_PROPERTY,
)
from app.context_graph_client import execute_cypher

logger = logging.getLogger(__name__)


async def ensure_segment_vector_index(dimensions: int, index_name: str = SEGMENT_VECTOR_INDEX) -> None:
    """Create the segment embedding vector index if it doesn't exist.

    Called from the ingestion script with the true Marengo dimension so the
    index matches the stored vectors exactly.
    """
    await execute_cypher(
        f"""
        CREATE VECTOR INDEX {index_name} IF NOT EXISTS
        FOR (n:{SEGMENT_VECTOR_LABEL})
        ON (n.{SEGMENT_VECTOR_PROPERTY})
        OPTIONS {{ indexConfig: {{
            `vector.dimensions`: {int(dimensions)},
            `vector.similarity_function`: 'cosine'
        }} }}
        """,
        collect=False,
    )
    logger.info("Vector index '%s' ready (dim=%d)", index_name, dimensions)


async def segment_vector_search(
    query_embedding: list[float],
    top_k: int = 8,
    index_name: str = SEGMENT_VECTOR_INDEX,
) -> list[dict]:
    """Find the video segments most similar to a query embedding.

    Returns each matching segment with its parent video and mentioned entities,
    so the agent can cite a timecoded moment and the graph view can light up.
    """
    return await execute_cypher(
        f"""
        CALL db.index.vector.queryNodes($index, $topK, $embedding)
        YIELD node AS s, score
        MATCH (v:Video)-[:HAS_SEGMENT]->(s)
        OPTIONAL MATCH (s)-[:MENTIONS]->(e:Entity)
        OPTIONAL MATCH (s)-[:ABOUT]->(t:Topic)
        RETURN v, s, score,
               collect(DISTINCT e) AS entities,
               collect(DISTINCT t) AS topics
        ORDER BY score DESC
        """,
        {"index": index_name, "topK": top_k, "embedding": query_embedding},
        tool_name="search_video_moments",
    )
