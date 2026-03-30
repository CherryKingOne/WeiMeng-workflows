"""Workflow engine persistence adapters."""

from modules.workflow_engine.domain.entities import Workflow
from modules.workflow_engine.domain.repositories import WorkflowRepository


class WorkflowSqliteRepository(WorkflowRepository):
    """Bootstrap repository using in-memory storage before SQLite is wired in."""

    def __init__(self) -> None:
        self._items: dict[str, Workflow] = {}

    def save(self, workflow: Workflow) -> None:
        self._items[workflow.workflow_id] = workflow

    def get_by_id(self, workflow_id: str) -> Workflow | None:
        return self._items.get(workflow_id)

    def list_all(self) -> list[Workflow]:
        return list(self._items.values())

    def delete(self, workflow_id: str) -> None:
        self._items.pop(workflow_id, None)

