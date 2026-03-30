"""Backend bootstrap entrypoint."""

from core.container import ApplicationContainer, build_container
from core.ipc_router import IPCRouter
from modules.nodes_market.presentation.ipc_handlers import (
    register_handlers as register_nodes_market_handlers,
)
from modules.settings.presentation.ipc_handlers import (
    register_handlers as register_settings_handlers,
)
from modules.workflow_engine.presentation.ipc_handlers import (
    register_handlers as register_workflow_handlers,
)


def create_application() -> tuple[ApplicationContainer, IPCRouter]:
    """Create and wire the backend container and IPC router."""
    container = build_container()
    router = IPCRouter()

    register_workflow_handlers(router, container)
    register_nodes_market_handlers(router, container)
    register_settings_handlers(router, container)

    return container, router


def main() -> None:
    """Start the backend bootstrap and print the registered routes."""
    _, router = create_application()

    print("Workflows backend bootstrap ready.")
    for route_name in router.list_routes():
        print(f"- {route_name}")


if __name__ == "__main__":
    main()

