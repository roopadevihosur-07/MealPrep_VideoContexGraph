"""Video Agent Context Graph — FastAPI application."""

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.context_graph_client import connect_neo4j, close_neo4j, is_connected
from app.routes import router

logger = logging.getLogger(__name__)

_neo4j_available = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Connect to Neo4j on startup; degrade gracefully if it's unavailable."""
    global _neo4j_available
    try:
        await connect_neo4j()
        _neo4j_available = True
        logger.info("Neo4j connected successfully")
    except Exception as e:
        _neo4j_available = False
        logger.warning("Neo4j unavailable — starting in degraded mode: %s", e)

    yield

    if _neo4j_available:
        await close_neo4j()


app = FastAPI(
    title="Video Agent Context Graph",
    description="Video understanding as a Neo4j knowledge graph, powered by TwelveLabs + OpenAI + Strands.",
    version="0.1.0",
    lifespan=lifespan,
)

CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    f"http://localhost:{settings.frontend_port}",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

# Serve video files statically
videos_path = Path(__file__).parent.parent.parent / "data" / "videos"
if videos_path.exists():
    app.mount("/videos", StaticFiles(directory=str(videos_path)), name="videos")


@app.get("/health")
async def health():
    """Health check with Neo4j connectivity status."""
    neo4j_ok = is_connected()
    return {
        "status": "ok" if neo4j_ok else "degraded",
        "neo4j": neo4j_ok,
        "domain": settings.domain_id,
        "version": "0.1.0",
    }
