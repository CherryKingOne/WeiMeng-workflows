"""Runtime logs IPC handlers."""

from __future__ import annotations

from core.container import ApplicationContainer
from core.ipc_router import IPCRouter
from modules.runtime_logs.application.dto import RecordRuntimeLogCommand
from modules.runtime_logs.application.use_cases import (
    ClearRuntimeLogsUseCase,
    ListRuntimeLogsUseCase,
    RecordRuntimeLogUseCase,
)


def register_handlers(router: IPCRouter, container: ApplicationContainer) -> None:
    """Register runtime log handlers for the desktop bridge."""

    def handle_list_runtime_logs(payload: dict[str, object]) -> dict[str, object]:
        raw_limit = payload.get("limit")
        limit = int(raw_limit) if isinstance(raw_limit, (int, float)) else None
        visible_only = bool(payload.get("visible_only", True))

        use_case = ListRuntimeLogsUseCase(container.runtime_log_repository)
        result = [
            entry.to_dict()
            for entry in use_case.execute(limit=limit, visible_only=visible_only)
        ]
        return {"status": "success", "data": result}

    def handle_record_runtime_log(payload: dict[str, object]) -> dict[str, object]:
        message = str(payload.get("message", "")).strip()
        if not message:
            return {"status": "error", "message": "Missing message"}

        details = payload.get("details", {})
        safe_details = details if isinstance(details, dict) else {}

        command = RecordRuntimeLogCommand(
            category=str(payload.get("category", "system")).strip() or "system",
            event_type=str(payload.get("event_type", "generic")).strip() or "generic",
            level=str(payload.get("level", "info")).strip() or "info",
            message=message,
            workflow_id=str(payload.get("workflow_id", "")).strip() or None,
            card_id=str(payload.get("card_id", "")).strip() or None,
            card_name=str(payload.get("card_name", "")).strip() or None,
            request_id=str(payload.get("request_id", "")).strip() or None,
            request_type=str(payload.get("request_type", "")).strip() or None,
            model_name=str(payload.get("model_name", "")).strip() or None,
            display=bool(payload.get("display", True)),
            details=safe_details,
        )

        use_case = RecordRuntimeLogUseCase(
            container.runtime_log_repository,
            container.event_bus,
        )
        result = use_case.execute(command)
        return {"status": "success", "data": result.to_dict()}

    def handle_clear_runtime_logs(payload: dict[str, object]) -> dict[str, object]:
        _ = payload
        use_case = ClearRuntimeLogsUseCase(
            container.runtime_log_repository,
            container.event_bus,
        )
        cleared_count = use_case.execute()
        return {
            "status": "success",
            "data": {"cleared_count": cleared_count},
        }

    router.register("runtime_logs.list", handle_list_runtime_logs)
    router.register("runtime_logs.record", handle_record_runtime_log)
    router.register("runtime_logs.clear", handle_clear_runtime_logs)
