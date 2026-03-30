"""Nodes market use cases."""

from modules.nodes_market.application.dto import NodeDefinitionDTO
from modules.nodes_market.domain.repositories import NodeDefinitionRepository


class ListNodeDefinitionsUseCase:
    """Expose available node definitions to the frontend."""

    def __init__(self, repository: NodeDefinitionRepository) -> None:
        self._repository = repository

    def execute(self) -> list[NodeDefinitionDTO]:
        definitions = self._repository.list_all()
        return [NodeDefinitionDTO.from_entity(item) for item in definitions]

