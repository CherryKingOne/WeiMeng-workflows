"""Runtime logs DTOs."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from modules.runtime_logs.domain.entities import RuntimeLogEntry


@dataclass(slots=True)
class RecordRuntimeLogCommand:
    """Input payload used to create a runtime log entry."""

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


@dataclass(slots=True)
class RuntimeLogEntryDTO:
    """Serializable runtime log entry returned to the desktop renderer."""

    log_id: str
    created_at: str
    category: str
    event_type: str
    level: str
    message: str
    workflow_id: str | None
    card_id: str | None
    card_name: str | None
    request_id: str | None
    request_type: str | None
    model_name: str | None
    display: bool
    details: dict[str, Any]

    @classmethod
    def from_entity(cls, entry: RuntimeLogEntry) -> "RuntimeLogEntryDTO":
        return cls(
            log_id=entry.log_id,
            created_at=entry.created_at.isoformat(),
            category=entry.category,
            event_type=entry.event_type,
            level=entry.level,
            message=entry.message,
            workflow_id=entry.workflow_id,
            card_id=entry.card_id,
            card_name=entry.card_name,
            request_id=entry.request_id,
            request_type=entry.request_type,
            model_name=entry.model_name,
            display=entry.display,
            details=dict(entry.details),
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "log_id": self.log_id,
            "created_at": self.created_at,
            "category": self.category,
            "event_type": self.event_type,
            "level": self.level,
            "message": self.message,
            "workflow_id": self.workflow_id,
            "card_id": self.card_id,
            "card_name": self.card_name,
            "request_id": self.request_id,
            "request_type": self.request_type,
            "model_name": self.model_name,
            "display": self.display,
            "details": self.details,
        }
