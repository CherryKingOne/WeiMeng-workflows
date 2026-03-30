"""Workflow engine use cases."""

from uuid import uuid4

from modules.workflow_engine.application.dto import (
    CreateWorkflowCommand,
    UpdateWorkflowCommand,
    WorkflowDTO,
)
from modules.workflow_engine.domain.entities import Workflow
from modules.workflow_engine.domain.repositories import WorkflowRepository


class CreateWorkflowUseCase:
    """Create a new workflow aggregate."""

    def __init__(self, workflow_repository: WorkflowRepository) -> None:
        self._workflow_repository = workflow_repository

    def execute(self, command: CreateWorkflowCommand) -> WorkflowDTO:
        workflow = Workflow(
            workflow_id=str(uuid4()),
            name=command.name.strip(),
        )
        self._workflow_repository.save(workflow)
        return WorkflowDTO.from_entity(workflow)


class ListWorkflowsUseCase:
    """List all existing workflows."""

    def __init__(self, workflow_repository: WorkflowRepository) -> None:
        self._workflow_repository = workflow_repository

    def execute(self) -> list[WorkflowDTO]:
        workflows = self._workflow_repository.list_all()
        return [WorkflowDTO.from_entity(item) for item in workflows]


class GetWorkflowUseCase:
    """Get a workflow by its identifier."""

    def __init__(self, workflow_repository: WorkflowRepository) -> None:
        self._workflow_repository = workflow_repository

    def execute(self, workflow_id: str) -> WorkflowDTO | None:
        workflow = self._workflow_repository.get_by_id(workflow_id)
        if workflow is None:
            return None
        return WorkflowDTO.from_entity(workflow)


class DeleteWorkflowUseCase:
    """Delete a workflow by its identifier."""

    def __init__(self, workflow_repository: WorkflowRepository) -> None:
        self._workflow_repository = workflow_repository

    def execute(self, workflow_id: str) -> bool:
        """Delete the workflow and return True if it existed."""
        workflow = self._workflow_repository.get_by_id(workflow_id)
        if workflow is None:
            return False
        self._workflow_repository.delete(workflow_id)
        return True


class UpdateWorkflowUseCase:
    """Update a workflow's properties."""

    def __init__(self, workflow_repository: WorkflowRepository) -> None:
        self._workflow_repository = workflow_repository

    def execute(self, command: UpdateWorkflowCommand) -> WorkflowDTO | None:
        workflow = self._workflow_repository.get_by_id(command.workflow_id)
        if workflow is None:
            return None
        if command.name is not None:
            workflow.name = command.name.strip()
        self._workflow_repository.save(workflow)
        return WorkflowDTO.from_entity(workflow)

