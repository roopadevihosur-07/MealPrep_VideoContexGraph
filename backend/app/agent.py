"""Video Context Graph agent — Strands + OpenAI brain, video graph tools."""

from __future__ import annotations

import asyncio
import json
import os

from strands import Agent
from strands.models.openai import OpenAIModel
from strands.tools import tool

from app.config import settings
from app.context_graph_client import execute_cypher, get_schema
from app.memory import store_message, get_context, resolve_session_id
from app.vector_client import segment_vector_search

# Ensure OPENAI_API_KEY is on the environment for the OpenAI client.
if not os.environ.get("OPENAI_API_KEY") and settings.openai_api_key:
    os.environ["OPENAI_API_KEY"] = settings.openai_api_key


_main_loop: asyncio.AbstractEventLoop | None = None


def _capture_loop():
    global _main_loop
    _main_loop = asyncio.get_running_loop()


def _run_sync(coro):
    """Run an async coroutine from a synchronous worker thread on the main loop."""
    loop = _main_loop
    if loop is not None and loop.is_running():
        future = asyncio.run_coroutine_threadsafe(coro, loop)
        return future.result(timeout=30)
    return asyncio.run(coro)


SYSTEM_PROMPT = """You are a video intelligence assistant. You answer questions over a Neo4j
knowledge graph built from videos analyzed by TwelveLabs. The graph contains:
- Video nodes (id, title, url, duration_sec, summary)
- Segment nodes (time-coded: start_sec, end_sec, summary, on_screen_text, transcript)
- Entity and Topic nodes that are SHARED across videos (the same entity in two videos is ONE node)
Relationships: (Video)-[:HAS_SEGMENT]->(Segment), (Segment)-[:NEXT]->(Segment),
(Segment)-[:MENTIONS]->(Entity), (Segment)-[:ABOUT]->(Topic).

Tool selection:
- "find the moment where..." / semantic recall -> search_video_moments
- "what involves / connects X", "which entities span videos" -> explore_graph or run_cypher
- fresh multimodal recall straight from TwelveLabs -> twelvelabs_search
- schema questions -> get_graph_schema; anything custom -> run_cypher (read-only)

ALWAYS ground answers in tool results — never invent videos, entities, or timecodes.
When you cite a moment, give the video title and the segment start/end times so the
user can jump to it.

THE GRAPH PANEL IS DRIVEN BY YOUR TOOL CALLS: it re-renders to display the nodes your
tools return. So whenever the user asks to see, show, highlight, find, or explore a
specific segment, moment, entity, topic, or video — including one you already
discussed earlier — you MUST call a graph tool (search_video_moments, explore_graph,
or run_cypher) to surface those nodes, even if you already know the answer from the
conversation. Do not answer such requests from memory alone. When you use run_cypher
for this, return whole nodes (e.g. `RETURN v, s, e`) rather than scalar properties so
they render in the graph. To show a specific segment, match it by video + start time,
e.g. MATCH (v:Video)-[:HAS_SEGMENT]->(s:Segment) WHERE s.start_sec = 65 OPTIONAL MATCH
(s)-[:MENTIONS]->(e) RETURN v, s, e.

CRITICAL: Call tools DIRECTLY without preamble. Do NOT say "I'll search..." first —
just call the tool. Only write prose AFTER you have tool results."""


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

@tool
def search_video_moments(query: str) -> str:
    """Semantic search for the video moments (segments) most relevant to a natural-language query. Use for "find the moment where..." questions."""
    from app.twelvelabs_client import embed_text
    try:
        vec = embed_text(query)
    except Exception as e:
        return json.dumps({"error": f"embedding failed: {e}"})
    results = _run_sync(segment_vector_search(vec, top_k=8))
    return json.dumps(results, default=str)


@tool
def explore_graph(name: str) -> str:
    """Explore everything involving an entity, topic, or video by name — across all videos. Returns the connected subgraph."""
    cypher = """
    MATCH (n)
    WHERE (n:Entity OR n:Topic OR n:Video)
      AND toLower(coalesce(n.name, n.title)) CONTAINS toLower($name)
    OPTIONAL MATCH (n)-[r]-(m)
    RETURN n, r, m
    LIMIT 60
    """
    results = _run_sync(execute_cypher(cypher, {"name": name}, tool_name="explore_graph"))
    return json.dumps(results, default=str)


@tool
def twelvelabs_search(query: str) -> str:
    """Search the raw videos directly via TwelveLabs (multimodal Marengo search) for the freshest clip matches. Use when the graph may be missing detail."""
    from app.twelvelabs_client import ensure_index, search
    try:
        index_id = ensure_index()
        hits = search(index_id, query, limit=8)
    except Exception as e:
        return json.dumps({"error": f"twelvelabs search failed: {e}"})
    # Light up the matched videos in the graph view.
    vids = [h["video_id"] for h in hits if h.get("video_id")]
    if vids:
        _run_sync(execute_cypher(
            """
            MATCH (v:Video) WHERE v.id IN $vids
            OPTIONAL MATCH (v)-[r:HAS_SEGMENT]->(s:Segment)
            RETURN v, r, s
            """,
            {"vids": vids}, tool_name="twelvelabs_search",
        ))
    return json.dumps({"clips": hits}, default=str)


@tool
def run_cypher(query: str, parameters: str = "{}") -> str:
    """Execute a read-only Cypher query against the video knowledge graph."""
    try:
        params = json.loads(parameters) if parameters else {}
    except json.JSONDecodeError:
        return json.dumps({"error": "Invalid JSON parameters"})
    try:
        result = _run_sync(execute_cypher(query, params, tool_name="run_cypher"))
        return json.dumps(result, default=str)
    except Exception as e:
        return json.dumps({"error": f"Cypher query failed: {e}"})


@tool
def get_graph_schema() -> str:
    """Get the knowledge graph schema (node labels and relationship types)."""
    result = _run_sync(get_schema())
    return json.dumps(result, default=str)


model = OpenAIModel(
    client_args={"api_key": os.environ.get("OPENAI_API_KEY", settings.openai_api_key)},
    model_id=settings.openai_model,
    params={"temperature": 0.2, "max_tokens": 2000},
)

agent = Agent(
    model=model,
    system_prompt=SYSTEM_PROMPT,
    tools=[
        search_video_moments,
        explore_graph,
        twelvelabs_search,
        run_cypher,
        get_graph_schema,
    ],
)


def _extract_text(result) -> str:
    if hasattr(result, "text"):
        return str(result.text)
    if hasattr(result, "message"):
        msg = result.message
        if hasattr(msg, "content"):
            parts = []
            for block in (msg.content if isinstance(msg.content, list) else [msg.content]):
                if hasattr(block, "text"):
                    parts.append(block.text)
                elif isinstance(block, str):
                    parts.append(block)
            if parts:
                return "\n".join(parts)
    try:
        return str(result)
    except Exception:
        return "I processed your request but couldn't format the response."


def _build_input(message: str, history: list[dict]) -> str:
    if history:
        history_block = "\n\n".join(
            f"[{m['role'].upper()}]\n{m['content']}" for m in history
        )
        return (
            f"<conversation_history>\n{history_block}\n</conversation_history>\n\n"
            f"[USER]\n{message}"
        )
    return message


async def handle_message(message: str, session_id: str | None = None) -> dict:
    """Handle an incoming chat message (non-streaming)."""
    session_id = resolve_session_id(session_id)
    await store_message(session_id, "user", message)
    context = await get_context(session_id, query=message)
    input_message = _build_input(message, context.get("messages", []))

    _capture_loop()
    try:
        result = await asyncio.wait_for(asyncio.to_thread(agent, input_message), timeout=90.0)
        response_text = _extract_text(result)
    except asyncio.TimeoutError:
        response_text = "The request timed out after 90 seconds. Please try a simpler question."
    except Exception as e:
        import logging
        logging.getLogger(__name__).error("Agent error: %s", e, exc_info=True)
        response_text = f"An error occurred: {e}"

    await store_message(session_id, "assistant", response_text)
    return {"response": response_text, "session_id": session_id, "graph_data": None}


async def handle_message_stream(message: str, session_id: str | None = None) -> dict:
    """Stream a chat response token-by-token via the SSE collector."""
    from app.context_graph_client import get_collector

    session_id = resolve_session_id(session_id)
    collector = get_collector()

    await store_message(session_id, "user", message)
    context = await get_context(session_id, query=message)
    input_message = _build_input(message, context.get("messages", []))

    _capture_loop()

    full_text_parts: list[str] = []
    try:
        async for event in agent.stream_async(input_message):
            if isinstance(event, dict):
                chunk = event.get("data")
                if chunk:
                    text_chunk = str(chunk)
                    collector.emit_text_delta(text_chunk)
                    full_text_parts.append(text_chunk)
        response_text = "".join(full_text_parts).strip()
    except Exception as e:
        import logging
        logging.getLogger(__name__).error("Agent streaming error: %s", e, exc_info=True)
        response_text = "".join(full_text_parts).strip()
        if not response_text:
            response_text = f"An error occurred: {e}"

    if not response_text.strip():
        response_text = "I searched the graph but couldn't find relevant results. Could you rephrase?"

    await store_message(session_id, "assistant", response_text)
    collector.emit_done(response_text, session_id)
    return {"response": response_text, "session_id": session_id, "graph_data": None}
