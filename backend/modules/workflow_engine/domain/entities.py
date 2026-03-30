"""Workflow engine entities."""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

from .value_objects import NodeCoordinates


def utc_now() -> datetime:
    """Return a timezone-aware UTC timestamp."""
    return datetime.now(tz=timezone.utc)


@dataclass(slots=True)
class WorkflowNode:
    """A single node placed on the workflow canvas."""

    node_id: str
    node_type: str
    position: NodeCoordinates
    data: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class WorkflowEdge:
    """A directional connection between two workflow nodes."""

    source_node_id: str
    target_node_id: str


@dataclass(slots=True)
class Workflow:
    """Aggregate root for a workflow definition."""

    workflow_id: str
    name: str
    nodes: list[WorkflowNode] = field(default_factory=list)
    edges: list[WorkflowEdge] = field(default_factory=list)
    created_at: datetime = field(default_factory=utc_now)

    def add_node(self, node: WorkflowNode) -> None:
        """Add a node to the workflow, ensuring unique node_id."""
        if any(n.node_id == node.node_id for n in self.nodes):
            raise ValueError(f"Node with id {node.node_id} already exists")
        self.nodes.append(node)

    def remove_node(self, node_id: str) -> None:
        """Remove a node and all its connected edges."""
        self.nodes = [n for n in self.nodes if n.node_id != node_id]
        self.edges = [
            e for e in self.edges
            if e.source_node_id != node_id and e.target_node_id != node_id
        ]

    def add_edge(self, edge: WorkflowEdge) -> None:
        """Add an edge between existing nodes."""
        source_exists = any(n.node_id == edge.source_node_id for n in self.nodes)
        target_exists = any(n.node_id == edge.target_node_id for n in self.nodes)
        if not source_exists or not target_exists:
            raise ValueError("Source or target node does not exist")
        # Check for duplicate edge
        if any(e.source_node_id == edge.source_node_id and e.target_node_id == edge.target_node_id
               for e in self.edges):
            raise ValueError("Edge already exists")
        self.edges.append(edge)

    def remove_edge(self, source_node_id: str, target_node_id: str) -> None:
        """Remove an edge between nodes."""
        self.edges = [
            e for e in self.edges
            if not (e.source_node_id == source_node_id and e.target_node_id == target_node_id)
        ]
