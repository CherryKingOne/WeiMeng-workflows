"""In-memory runtime log repository."""

from __future__ import annotations

from collections import deque
from threading import Lock

from modules.runtime_logs.domain.entities import RuntimeLogEntry
from modules.runtime_logs.domain.repositories import RuntimeLogRepository


class InMemoryRuntimeLogRepository(RuntimeLogRepository):
    """Store runtime logs in memory for the current desktop session."""

    def __init__(self, max_entries: int = 1000) -> None:
        self._entries: deque[RuntimeLogEntry] = deque(maxlen=max_entries)
        self._lock = Lock()

    def append(self, entry: RuntimeLogEntry) -> RuntimeLogEntry:
        with self._lock:
            self._entries.append(entry)
        return entry

    def list_entries(
        self,
        *,
        limit: int | None = None,
        visible_only: bool = True,
    ) -> list[RuntimeLogEntry]:
        with self._lock:
            entries = list(self._entries)

        if visible_only:
            entries = [entry for entry in entries if entry.display]

        if limit is not None and limit > 0:
            entries = entries[-limit:]

        return entries

    def clear(self) -> int:
        with self._lock:
            cleared_count = len(self._entries)
            self._entries.clear()
        return cleared_count
