"""IPC router abstractions."""

from typing import Any, Callable

IPCHandler = Callable[[dict[str, Any]], dict[str, Any]]


class IPCRouteNotFoundError(LookupError):
    """Raised when a route cannot be found in the IPC router."""


class IPCRouteAlreadyRegisteredError(ValueError):
    """Raised when the same IPC route is registered more than once."""


class IPCRouter:
    """Minimal IPC command router for desktop bridge calls."""

    def __init__(self) -> None:
        self._routes: dict[str, IPCHandler] = {}

    def register(
        self,
        command_name: str,
        handler: IPCHandler | None = None,
    ) -> IPCHandler | Callable[[IPCHandler], IPCHandler]:
        """Register a handler directly or by decorator."""
        if handler is None:
            def decorator(inner_handler: IPCHandler) -> IPCHandler:
                self.register(command_name, inner_handler)
                return inner_handler

            return decorator

        if command_name in self._routes:
            raise IPCRouteAlreadyRegisteredError(
                f"IPC route already registered: {command_name}"
            )

        self._routes[command_name] = handler
        return handler

    def handle_message(
        self,
        command_name: str,
        payload: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Execute a registered handler and return its response payload."""
        if command_name not in self._routes:
            raise IPCRouteNotFoundError(f"IPC route not found: {command_name}")

        safe_payload = payload or {}
        return self._routes[command_name](safe_payload)

    def list_routes(self) -> tuple[str, ...]:
        """Return the currently registered command names."""
        return tuple(sorted(self._routes))

