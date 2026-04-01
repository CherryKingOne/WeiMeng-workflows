"""Repository contracts for runtime logs."""

from __future__ import annotations

from abc import ABC, abstractmethod

from modules.runtime_logs.domain.entities import RuntimeLogEntry


class RuntimeLogRepository(ABC):
    """Persistence contract for session-scoped runtime logs."""

    @abstractmethod
    def append(self, entry: RuntimeLogEntry) -> RuntimeLogEntry:
        """Persist a runtime log entry."""

    @abstractmethod
    def list_entries(
        self,
        *,
        limit: int | None = None,
        visible_only: bool = True,
    ) -> list[RuntimeLogEntry]:
        """Return runtime log entries sorted by creation time ascending."""

    @abstractmethod
    def clear(self) -> int:
        """Remove all runtime log entries and return the cleared count."""
