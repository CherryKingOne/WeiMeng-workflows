"""Nodes market persistence adapters."""

from modules.nodes_market.domain.entities import NodeDefinition
from modules.nodes_market.domain.repositories import NodeDefinitionRepository
from modules.nodes_market.domain.value_objects import NodeCategory


class NodeMarketSqliteRepository(NodeDefinitionRepository):
    """Bootstrap repository with seed data before SQLite is implemented."""

    def __init__(self) -> None:
        self._items = {
            "manual_input": NodeDefinition(
                node_type="manual_input",
                display_name="Manual Input",
                category=NodeCategory.INPUT,
            ),
            "transform_text": NodeDefinition(
                node_type="transform_text",
                display_name="Transform Text",
                category=NodeCategory.TRANSFORM,
            ),
            "file_output": NodeDefinition(
                node_type="file_output",
                display_name="File Output",
                category=NodeCategory.OUTPUT,
            ),
        }

    def list_all(self) -> list[NodeDefinition]:
        return list(self._items.values())

    def get_by_type(self, node_type: str) -> NodeDefinition | None:
        return self._items.get(node_type)

