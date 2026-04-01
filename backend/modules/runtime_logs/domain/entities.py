"""Runtime logs entities."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4


@dataclass(slots=True)
class RuntimeLogEntry:
    """A single runtime log entry stored for the current desktop session."""

    category: str
    event_type: str
    level: str
    message: str
    workflow_id: str | None = None
    card_id: str | None = None
    card_name: str | None = None
    request_id: str | None = None
    request_type: str | None = None
    model_name: str | None = None
    display: bool = True
    details: dict[str, Any] = field(default_factory=dict)
    log_id: str = field(default_factory=lambda: str(uuid4()))
    created_at: datetime = field(default_factory=lambda: datetime.now(tz=timezone.utc))
