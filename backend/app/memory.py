"""Short-term conversation context — a small in-process buffer.

The agent is stateless at the API level; to give it short-term memory we keep
the last few messages per session in RAM and replay them into each prompt. This
is not persisted (it's lost on restart) and is unrelated to the Neo4j knowledge
graph, which is the app's durable store.
"""

from __future__ import annotations

import uuid
from collections import defaultdict, deque

# session_id -> recent {role, content} messages (bounded)
_SESSIONS: dict[str, deque] = defaultdict(lambda: deque(maxlen=20))


async def store_message(session_id: str, role: str, content: str) -> None:
    """Append a message to the session's short-term history."""
    _SESSIONS[session_id].append({"role": role, "content": content})


async def get_context(session_id: str, query: str | None = None, max_items: int = 10) -> dict:
    """Return recent messages for the session (excluding the current user turn)."""
    msgs = list(_SESSIONS.get(session_id, []))
    return {"messages": msgs[:-1][-max_items:]}


def resolve_session_id(hint: str | None = None) -> str:
    return hint or str(uuid.uuid4())
