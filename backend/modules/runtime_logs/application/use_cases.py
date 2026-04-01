"""Runtime logs use cases."""

from __future__ import annotations

from core.event_bus import EventBus
from modules.runtime_logs.application.dto import (
    RecordRuntimeLogCommand,
    RuntimeLogEntryDTO,
)
from modules.runtime_logs.domain.entities import RuntimeLogEntry
from modules.runtime_logs.domain.repositories import RuntimeLogRepository


class RecordRuntimeLogUseCase:
    """Record a runtime log entry and publish append notifications."""

    def __init__(
        self,
        repository: RuntimeLogRepository,
        event_bus: EventBus,
    ) -> None:
        self._repository = repository
        self._event_bus = event_bus

    def execute(self, command: RecordRuntimeLogCommand) -> RuntimeLogEntryDTO:
        entry = RuntimeLogEntry(
            category=command.category,
            event_type=command.event_type,
            level=command.level,
            message=command.message,
            workflow_id=command.workflow_id,
            card_id=command.card_id,
            card_name=command.card_name,
            request_id=command.request_id,
            request_type=command.request_type,
            model_name=command.model_name,
            display=command.display,
            details=dict(command.details),
        )
        saved_entry = self._repository.append(entry)
        dto = RuntimeLogEntryDTO.from_entity(saved_entry)
        self._event_bus.publish("runtime_logs.appended", {"entry": dto.to_dict()})
        return dto


class ListRuntimeLogsUseCase:
    """Return current session runtime logs."""

    def __init__(self, repository: RuntimeLogRepository) -> None:
        self._repository = repository

    def execute(
        self,
        *,
        limit: int | None = None,
        visible_only: bool = True,
    ) -> list[RuntimeLogEntryDTO]:
        return [
            RuntimeLogEntryDTO.from_entity(entry)
            for entry in self._repository.list_entries(
                limit=limit,
                visible_only=visible_only,
            )
        ]


class ClearRuntimeLogsUseCase:
    """Clear current session runtime logs."""

    def __init__(
        self,
        repository: RuntimeLogRepository,
        event_bus: EventBus,
    ) -> None:
        self._repository = repository
        self._event_bus = event_bus

    def execute(self) -> int:
        cleared_count = self._repository.clear()
        self._event_bus.publish(
            "runtime_logs.cleared",
            {"cleared_count": cleared_count},
        )
        return cleared_count
