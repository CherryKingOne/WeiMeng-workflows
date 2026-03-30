"""Nodes market IPC handlers."""

from core.container import ApplicationContainer
from core.ipc_router import IPCRouter
from modules.nodes_market.application.use_cases import ListNodeDefinitionsUseCase


def register_handlers(router: IPCRouter, container: ApplicationContainer) -> None:
    """Register nodes market IPC handlers."""

    def handle_list_nodes_market(payload: dict[str, object]) -> dict[str, object]:
        _ = payload
        use_case = ListNodeDefinitionsUseCase(container.node_market_repository)
        result = [item.to_dict() for item in use_case.execute()]
        return {"status": "success", "data": result}

    router.register("nodes_market.list", handle_list_nodes_market)

