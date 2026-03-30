"""Workflow engine data transfer objects."""

from dataclasses import asdict, dataclass

from modules.workflow_engine.domain.entities import Workflow


@dataclass(slots=True)
class CreateWorkflowCommand:
    """Input payload for creating a workflow."""

    name: str


@dataclass(slots=True)
class UpdateWorkflowCommand:
    """Input payload for updating a workflow."""

    workflow_id: str
    name: str | None = None


@dataclass(slots=True)
class WorkflowDTO:
    """Serializable workflow representation exposed to the presentation layer."""

    workflow_id: str
    name: str
    node_count: int
    edge_count: int

    @classmethod
    def from_entity(cls, workflow: Workflow) -> "WorkflowDTO":
        return cls(
            workflow_id=workflow.workflow_id,
            name=workflow.name,
            node_count=len(workflow.nodes),
            edge_count=len(workflow.edges),
        )

    def to_dict(self) -> dict[str, str | int]:
        return asdict(self)

