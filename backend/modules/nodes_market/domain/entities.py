"""Nodes market entities."""

from dataclasses import dataclass

from .value_objects import NodeCategory


@dataclass(slots=True)
class NodeDefinition:
    """Represents a reusable node that can be inserted into workflows."""

    node_type: str
    display_name: str
    category: NodeCategory

