"""Nodes market data transfer objects."""

from dataclasses import asdict, dataclass

from modules.nodes_market.domain.entities import NodeDefinition


@dataclass(slots=True)
class NodeDefinitionDTO:
    """Serializable node definition returned to the frontend."""

    node_type: str
    display_name: str
    category: str

    @classmethod
    def from_entity(cls, node_definition: NodeDefinition) -> "NodeDefinitionDTO":
        return cls(
            node_type=node_definition.node_type,
            display_name=node_definition.display_name,
            category=node_definition.category.value,
        )

    def to_dict(self) -> dict[str, str]:
        return asdict(self)

