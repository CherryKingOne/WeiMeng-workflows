"""Workflow engine data transfer objects."""

from dataclasses import asdict, dataclass, field
from typing import Any

from modules.workflow_engine.domain.entities import Workflow, WorkflowNode, WorkflowEdge
from modules.workflow_engine.domain.value_objects import NodeCoordinates


@dataclass(slots=True)
class CreateWorkflowCommand:
    """Input payload for creating a workflow."""

    name: str


@dataclass(slots=True)
class NodeDTO:
    """Serializable node representation."""
    
    node_id: str
    node_type: str
    position_x: float
    position_y: float
    data: dict[str, Any] = field(default_factory=dict)
    
    @classmethod
    def from_entity(cls, node: WorkflowNode) -> "NodeDTO":
        return cls(
            node_id=node.node_id,
            node_type=node.node_type,
            position_x=node.position.x,
            position_y=node.position.y,
            data=node.data,
        )
    
    def to_entity(self) -> WorkflowNode:
        return WorkflowNode(
            node_id=self.node_id,
            node_type=self.node_type,
            position=NodeCoordinates(x=self.position_x, y=self.position_y),
            data=self.data,
        )
    
    def to_dict(self) -> dict:
        return asdict(self)


@dataclass(slots=True)
class EdgeDTO:
    """Serializable edge representation."""
    
    source_node_id: str
    target_node_id: str
    
    @classmethod
    def from_entity(cls, edge: WorkflowEdge) -> "EdgeDTO":
        return cls(
            source_node_id=edge.source_node_id,
            target_node_id=edge.target_node_id,
        )
    
    def to_entity(self) -> WorkflowEdge:
        return WorkflowEdge(
            source_node_id=self.source_node_id,
            target_node_id=self.target_node_id,
        )
    
    def to_dict(self) -> dict:
        return asdict(self)


@dataclass(slots=True)
class UpdateWorkflowCommand:
    """Input payload for updating a workflow."""

    workflow_id: str
    name: str | None = None
    nodes: list[NodeDTO] | None = None
    edges: list[EdgeDTO] | None = None


@dataclass(slots=True)
class WorkflowDTO:
    """Serializable workflow representation exposed to the presentation layer."""

    workflow_id: str
    name: str
    node_count: int
    edge_count: int
    nodes: list[NodeDTO] = None  # type: ignore
    edges: list[EdgeDTO] = None  # type: ignore

    def __post_init__(self):
        if self.nodes is None:
            self.nodes = []
        if self.edges is None:
            self.edges = []

    @classmethod
    def from_entity(cls, workflow: Workflow, include_details: bool = False) -> "WorkflowDTO":
        nodes_dto = [NodeDTO.from_entity(n) for n in workflow.nodes] if include_details else []
        edges_dto = [EdgeDTO.from_entity(e) for e in workflow.edges] if include_details else []
        
        return cls(
            workflow_id=workflow.workflow_id,
            name=workflow.name,
            node_count=len(workflow.nodes),
            edge_count=len(workflow.edges),
            nodes=nodes_dto,
            edges=edges_dto,
        )

    def to_dict(self) -> dict:
        result = {
            "workflow_id": self.workflow_id,
            "name": self.name,
            "node_count": self.node_count,
            "edge_count": self.edge_count,
        }
        # 只有在有详细数据时才包含 nodes 和 edges
        if self.nodes:
            result["nodes"] = [n.to_dict() for n in self.nodes]
        if self.edges:
            result["edges"] = [e.to_dict() for e in self.edges]
        return result
