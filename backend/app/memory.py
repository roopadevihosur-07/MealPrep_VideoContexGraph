"""Lightweight in-process chat context.

The generated scaffold used `neo4j-agent-memory` (NAMS) for conversation
storage, entity extraction, and preference detection — the "agent memory
trappings". The thin Video Context Graph doesn't need any of that: the graph
is the memory. This module keeps the same public surface the rest of the app
imports, but backs it with a simple bounded in-process dict of recent messages
so the agent still has short-term conversational context.
"""

from __future__ import annotations

import uuid
from collections import defaultdict, deque

# session_id -> recent {role, content} messages (bounded)
_SESSIONS: dict[str, deque] = defaultdict(lambda: deque(maxlen=20))


# --- lifecycle (no-ops; kept so callers don't need to change) --------------
async def connect_memory() -> None:  # noqa: D401
    return None


async def close_memory() -> None:
    _SESSIONS.clear()


def get_client():
    return None


def get_error_category() -> str | None:
    return None


def get_error_message() -> str | None:
    return None


def get_error_detail() -> str | None:
    return None


# --- message store ----------------------------------------------------------
async def store_message(session_id: str, role: str, content: str) -> dict | None:
    """Append a message to the session's short-term history.

    Returns an empty extraction result to keep the /chat contract stable
    (the thin build does no entity/preference extraction here — the ingestion
    pipeline builds the graph instead).
    """
    _SESSIONS[session_id].append({"role": role, "content": content})
    return {"entities": [], "preferences": []}


async def get_context(session_id: str, query: str | None = None, max_items: int = 10) -> dict:
    """Return recent messages for the session (excluding the just-stored one)."""
    msgs = list(_SESSIONS.get(session_id, []))
    # Drop the final message — it's the current user turn the agent already has.
    history = msgs[:-1][-max_items:]
    return {"messages": history, "entities": [], "preferences": [], "traces": []}


def resolve_session_id(hint: str | None = None) -> str:
    return hint or str(uuid.uuid4())
