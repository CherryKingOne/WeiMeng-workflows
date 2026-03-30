"""Nodes market repository contracts."""

from abc import ABC, abstractmethod

from .entities import NodeDefinition


class NodeDefinitionRepository(ABC):
    """Persistence contract for node definitions."""

    @abstractmethod
    def list_all(self) -> list[NodeDefinition]:
        """Return all available node definitions."""

    @abstractmethod
    def get_by_type(self, node_type: str) -> NodeDefinition | None:
        """Return a node definition by its technical type."""

