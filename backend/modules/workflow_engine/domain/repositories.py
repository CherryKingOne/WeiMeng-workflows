"""Workflow engine repository contracts."""

from abc import ABC, abstractmethod

from .entities import Workflow


class WorkflowRepository(ABC):
    """Persistence contract for workflow aggregates."""

    @abstractmethod
    def save(self, workflow: Workflow) -> None:
        """Persist a workflow aggregate."""

    @abstractmethod
    def get_by_id(self, workflow_id: str) -> Workflow | None:
        """Return a workflow by its identifier."""

    @abstractmethod
    def list_all(self) -> list[Workflow]:
        """Return all persisted workflows."""

    @abstractmethod
    def delete(self, workflow_id: str) -> None:
        """Delete a workflow by its identifier."""

