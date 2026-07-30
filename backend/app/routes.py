"""API routes for the Video Agent Context Graph."""

from __future__ import annotations

import asyncio
import json
import uuid as _uuid

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from starlette.responses import StreamingResponse

from app.agent import handle_message, handle_message_stream
from app.context_graph_client import (
    execute_cypher, get_schema, get_schema_visualization, expand_node,
    get_collector, is_connected,
)

router = APIRouter()


def _require_neo4j():
    if not is_connected():
        raise HTTPException(
            status_code=503,
            detail="Neo4j is unavailable. Check your connection and restart the server.",
        )


class ChatRequest(BaseModel):
    message: str = Field(..., max_length=4000)
    session_id: str | None = None


class ChatResponse(BaseModel):
    response: str
    session_id: str
    graph_data: dict | None = None
    tool_calls: list[dict] | None = None


class CypherRequest(BaseModel):
    query: str
    parameters: dict | None = None


class ExpandRequest(BaseModel):
    element_id: str


class SearchRequest(BaseModel):
    query: str = Field(..., max_length=2000)
    limit: int = 8


# ---------------------------------------------------------------------------
# Chat
# ---------------------------------------------------------------------------

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    _require_neo4j()
    try:
        collector = get_collector()
        collector.drain()
        collector.drain_tool_calls()
        result = await handle_message(request.message, request.session_id)
        if result.get("graph_data") is None:
            collected = collector.drain()
            if collected:
                result["graph_data"] = {"results": collected}
        tool_calls = collector.drain_tool_calls()
        if tool_calls:
            result["tool_calls"] = tool_calls
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """Streaming SSE chat. Events: session_id, tool_start, tool_end, text_delta, done, error."""
    _require_neo4j()
    session_id = request.session_id or str(_uuid.uuid4())
    collector = get_collector()
    collector.drain()
    collector.drain_tool_calls()

    event_queue: asyncio.Queue = asyncio.Queue()
    collector.set_event_queue(event_queue)

    async def run_agent():
        try:
            await handle_message_stream(request.message, session_id)
        except Exception as e:
            try:
                event_queue.put_nowait({"event": "error", "data": {"detail": str(e)}})
            except Exception:
                pass
        finally:
            await asyncio.sleep(0.1)
            collector.clear_event_queue()

    async def event_generator():
        task = asyncio.create_task(run_agent())
        yield f"event: session_id\ndata: {json.dumps({'session_id': session_id})}\n\n"
        idle_timeout = 120.0
        overall_timeout = 300.0
        loop = asyncio.get_event_loop()
        start_time = loop.time()
        try:
            while True:
                if loop.time() - start_time > overall_timeout:
                    yield f"event: error\ndata: {json.dumps({'detail': 'Request exceeded maximum duration'})}\n\n"
                    break
                try:
                    event = await asyncio.wait_for(event_queue.get(), timeout=idle_timeout)
                except asyncio.TimeoutError:
                    yield f"event: error\ndata: {json.dumps({'detail': 'Request timed out'})}\n\n"
                    break
                event_type = event["event"]
                event_data = json.dumps(event["data"], default=str)
                yield f"event: {event_type}\ndata: {event_data}\n\n"
                if event_type in ("done", "error"):
                    break
        finally:
            if not task.done():
                task.cancel()
                try:
                    await task
                except (asyncio.CancelledError, Exception):
                    pass

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ---------------------------------------------------------------------------
# Graph / schema
# ---------------------------------------------------------------------------

@router.get("/schema")
async def schema():
    _require_neo4j()
    return await get_schema()


@router.get("/schema/visualization")
async def schema_visualization():
    _require_neo4j()
    return await get_schema_visualization()


@router.post("/expand")
async def expand(request: ExpandRequest):
    _require_neo4j()
    return await expand_node(request.element_id)


@router.post("/cypher")
async def cypher(request: CypherRequest):
    _require_neo4j()
    try:
        results = await execute_cypher(request.query, dict(request.parameters or {}))
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ---------------------------------------------------------------------------
# Video-specific
# ---------------------------------------------------------------------------

@router.get("/videos")
async def list_videos():
    """List indexed videos with their segment counts."""
    _require_neo4j()
    results = await execute_cypher(
        """
        MATCH (v:Video)
        OPTIONAL MATCH (v)-[:HAS_SEGMENT]->(s:Segment)
        RETURN v.id AS id, v.title AS title, v.url AS url,
               v.duration_sec AS duration_sec, v.summary AS summary,
               count(s) AS segment_count
        ORDER BY v.title
        """,
        collect=False,
    )
    return {"videos": results}


@router.get("/videos/{video_id}/segments")
async def video_segments(video_id: str):
    """Return a video's segments in temporal order with meal prep context."""
    _require_neo4j()
    results = await execute_cypher(
        """
        MATCH (v:Video {id: $vid})-[:HAS_SEGMENT]->(s:Segment)
        OPTIONAL MATCH (s)-[:MENTIONS]->(e:Entity)
        OPTIONAL MATCH (s)-[:USES]->(i:Ingredient)
        OPTIONAL MATCH (s)-[:APPLIES]->(t:Technique)
        RETURN s.id AS id, s.start_sec AS start_sec, s.end_sec AS end_sec,
               s.summary AS summary, s.on_screen_text AS on_screen_text,
               s.segment_type AS segment_type,
               s.ingredients AS ingredients,
               collect(DISTINCT e.name) AS entities,
               collect(DISTINCT i.name) AS ingredient_entities,
               collect(DISTINCT t.name) AS techniques,
               s.cooking_temp AS cooking_temp,
               s.cooking_time_min AS cooking_time_min,
               s.cooking_time_sec AS cooking_time_sec,
               s.calories AS calories,
               s.protein_g AS protein_g,
               s.carbs_g AS carbs_g,
               s.fat_g AS fat_g,
               s.fiber_g AS fiber_g,
               s.allergens AS allergens,
               s.yield_servings AS yield_servings,
               s.storage_method AS storage_method,
               s.storage_duration AS storage_duration,
               s.nutritional_claim AS nutritional_claim
        ORDER BY s.start_sec
        """,
        {"vid": video_id},
        collect=False,
    )
    return {"video_id": video_id, "segments": results}


@router.post("/search")
async def search(request: SearchRequest):
    """Live multimodal search over the raw videos via TwelveLabs (Marengo)."""
    from app.twelvelabs_client import ensure_index
    from app.twelvelabs_client import search as tl_search
    try:
        index_id = await asyncio.to_thread(ensure_index)
        hits = await asyncio.to_thread(tl_search, index_id, request.query, None, "clip", request.limit)
        return {"results": hits}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"TwelveLabs search failed: {e}")


@router.get("/video/{video_id}/stream")
async def stream_video(video_id: str):
    """Stream a video file if available locally."""
    from pathlib import Path
    import os

    _require_neo4j()

    # Query database for the filename
    results = await execute_cypher(
        "MATCH (v:Video {id: $vid}) RETURN v.filename AS filename",
        {"vid": video_id},
        collect=True,
    )

    filename = None
    if results and len(results) > 0:
        filename = results[0].get("filename")

    # Try multiple possible paths for the video directory
    possible_dirs = [
        Path("/Users/roopakeerthiraj/Documents/MealPrep/video-context-graph/data/videos"),
        Path.cwd().parent / "data" / "videos",
        Path(__file__).parent.parent.parent / "data" / "videos",
    ]

    # If we have a filename from the database, try that first
    if filename:
        for video_dir in possible_dirs:
            video_path = video_dir / filename
            if video_path.exists():
                return StreamingResponse(
                    open(video_path, "rb"),
                    media_type="video/mp4",
                    headers={"Content-Disposition": f"inline; filename={filename}"},
                )

    # Fallback: try video_id with extensions
    for video_dir in possible_dirs:
        for ext in [".mp4", ".webm", ".mov", ".avi"]:
            video_path = video_dir / f"{video_id}{ext}"
            if video_path.exists():
                return StreamingResponse(
                    open(video_path, "rb"),
                    media_type="video/mp4",
                    headers={"Content-Disposition": f"inline; filename={video_id}{ext}"},
                )

    raise HTTPException(status_code=404, detail=f"Video file not found: {video_id}")


@router.get("/meal-prep/{video_id}/details")
async def meal_prep_details(video_id: str):
    """Get aggregated meal prep details with nutritional breakdown."""
    _require_neo4j()

    # Get video info
    video_res = await execute_cypher(
        "MATCH (v:Video {id: $vid}) RETURN v.title AS title, v.summary AS summary",
        {"vid": video_id},
        collect=True,
    )

    if not video_res:
        raise HTTPException(status_code=404, detail="Video not found")

    video = video_res[0]

    # Get all segments with nutritional info
    segments_res = await execute_cypher(
        """
        MATCH (v:Video {id: $vid})-[:HAS_SEGMENT]->(s:Segment)
        WITH s
        OPTIONAL MATCH (s)-[:USES]->(i:Ingredient)
        OPTIONAL MATCH (s)-[:APPLIES]->(t:Technique)
        RETURN
          s.id AS segment_id,
          s.summary AS summary,
          s.segment_type AS segment_type,
          s.ingredients AS ingredients,
          s.techniques AS techniques,
          s.calories AS calories,
          s.protein_g AS protein_g,
          s.carbs_g AS carbs_g,
          s.fat_g AS fat_g,
          s.fiber_g AS fiber_g,
          s.allergens AS allergens,
          s.nutritional_claim AS nutritional_claim,
          s.cooking_temp AS cooking_temp,
          s.cooking_time_min AS cooking_time_min,
          s.cooking_time_sec AS cooking_time_sec,
          s.yield_servings AS yield_servings,
          s.start_sec AS start_sec,
          collect(DISTINCT i.name) AS ingredient_nodes,
          collect(DISTINCT t.name) AS technique_nodes
        ORDER BY start_sec
        """,
        {"vid": video_id},
        collect=False,
    )

    # Aggregate nutritional info
    total_calories = 0
    total_protein = 0
    total_carbs = 0
    total_fat = 0
    total_fiber = 0
    all_ingredients = set()
    all_techniques = set()
    all_allergens = set()
    all_claims = []
    total_servings = 0

    for seg in segments_res:
        if seg.get("calories"):
            total_calories += seg["calories"]
        if seg.get("protein_g"):
            total_protein += seg["protein_g"]
        if seg.get("carbs_g"):
            total_carbs += seg["carbs_g"]
        if seg.get("fat_g"):
            total_fat += seg["fat_g"]
        if seg.get("fiber_g"):
            total_fiber += seg["fiber_g"]

        if seg.get("ingredient_nodes"):
            all_ingredients.update(seg["ingredient_nodes"])
        if seg.get("technique_nodes"):
            all_techniques.update(seg["technique_nodes"])
        if seg.get("allergens"):
            all_allergens.update(seg["allergens"])
        if seg.get("nutritional_claim"):
            all_claims.append(seg["nutritional_claim"])
        if seg.get("yield_servings"):
            total_servings = seg["yield_servings"]

    # Calculate per gram/serving
    per_gram_protein = total_protein / total_calories * 4 if total_calories > 0 else 0
    per_gram_carbs = total_carbs / total_calories * 4 if total_calories > 0 else 0
    per_gram_fat = total_fat / total_calories * 9 if total_calories > 0 else 0

    per_serving_calories = total_calories / total_servings if total_servings > 0 else 0
    per_serving_protein = total_protein / total_servings if total_servings > 0 else 0
    per_serving_carbs = total_carbs / total_servings if total_servings > 0 else 0
    per_serving_fat = total_fat / total_servings if total_servings > 0 else 0

    return {
        "video": video,
        "total_segments": len(segments_res),
        "segments": segments_res,
        "nutrition_summary": {
            "total_calories": round(total_calories, 1),
            "total_protein_g": round(total_protein, 1),
            "total_carbs_g": round(total_carbs, 1),
            "total_fat_g": round(total_fat, 1),
            "total_fiber_g": round(total_fiber, 1),
        },
        "per_serving": {
            "calories": round(per_serving_calories, 1),
            "protein_g": round(per_serving_protein, 1),
            "carbs_g": round(per_serving_carbs, 1),
            "fat_g": round(per_serving_fat, 1),
        },
        "macro_percentages": {
            "protein_percent": round((total_protein * 4 / total_calories * 100), 1) if total_calories > 0 else 0,
            "carbs_percent": round((total_carbs * 4 / total_calories * 100), 1) if total_calories > 0 else 0,
            "fat_percent": round((total_fat * 9 / total_calories * 100), 1) if total_calories > 0 else 0,
        },
        "ingredients": sorted(list(all_ingredients)),
        "techniques": sorted(list(all_techniques)),
        "allergens": sorted(list(all_allergens)),
        "health_claims": list(set(all_claims)),
        "total_servings": total_servings,
    }


@router.get("/scenarios")
async def scenarios():
    """Demo prompts for the frontend."""
    return {
        "domain": "Video Context Graph",
        "scenarios": [
            {"name": "Meal Prep Overview", "prompts": [
                "What's in this meal prep video and what are the main recipes?",
                "What are the key ingredients used in the meal prep?",
            ]},
            {"name": "Find Techniques", "prompts": [
                "Find the moment where vegetables are chopped or prepared",
                "Show me the steps for seasoning the ingredients",
            ]},
            {"name": "Healthy Meal Prep", "prompts": [
                "What are the health benefits mentioned for these meals?",
                "What are the meal preparation tips for staying healthy?",
            ]},
        ],
    }
