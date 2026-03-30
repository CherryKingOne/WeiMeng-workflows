"""Workflow engine use cases."""

from uuid import uuid4

from modules.workflow_engine.application.dto import (
    CreateWorkflowCommand,
    UpdateWorkflowCommand,
    WorkflowDTO,
    NodeDTO,
    EdgeDTO,
)
from modules.workflow_engine.domain.entities import Workflow, WorkflowNode, WorkflowEdge
from modules.workflow_engine.domain.repositories import WorkflowRepository
from modules.workflow_engine.domain.value_objects import NodeCoordinates


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

    def execute(self, workflow_id: str, include_details: bool = False) -> WorkflowDTO | None:
        workflow = self._workflow_repository.get_by_id(workflow_id)
        if workflow is None:
            return None
        return WorkflowDTO.from_entity(workflow, include_details=include_details)


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
    """Update a workflow's properties including nodes and edges."""

    def __init__(self, workflow_repository: WorkflowRepository) -> None:
        self._workflow_repository = workflow_repository

    def execute(self, command: UpdateWorkflowCommand) -> WorkflowDTO | None:
        workflow = self._workflow_repository.get_by_id(command.workflow_id)
        if workflow is None:
            return None
        
        # 更新名称
        if command.name is not None:
            workflow.name = command.name.strip()
        
        # 更新节点
        if command.nodes is not None:
            # 清除现有节点和边
            workflow.nodes = []
            workflow.edges = []
            
            # 添加新节点
            for node_dto in command.nodes:
                node = node_dto.to_entity()
                workflow.nodes.append(node)
        
        # 更新边
        if command.edges is not None:
            workflow.edges = []
            for edge_dto in command.edges:
                edge = edge_dto.to_entity()
                workflow.edges.append(edge)
        
        self._workflow_repository.save(workflow)
        return WorkflowDTO.from_entity(workflow, include_details=True)
