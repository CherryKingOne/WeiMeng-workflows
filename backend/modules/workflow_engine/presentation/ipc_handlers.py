"""Workflow engine IPC handlers."""

from core.container import ApplicationContainer
from core.ipc_router import IPCRouter
from modules.workflow_engine.application.dto import CreateWorkflowCommand, UpdateWorkflowCommand
from modules.workflow_engine.application.use_cases import (
    CreateWorkflowUseCase,
    ListWorkflowsUseCase,
    GetWorkflowUseCase,
    DeleteWorkflowUseCase,
    UpdateWorkflowUseCase,
)


def register_handlers(router: IPCRouter, container: ApplicationContainer) -> None:
    """Register workflow engine IPC handlers."""

    def handle_create_workflow(payload: dict[str, object]) -> dict[str, object]:
        workflow_name = str(payload.get("name", "")).strip() or "Untitled Workflow"
        command = CreateWorkflowCommand(name=workflow_name)
        use_case = CreateWorkflowUseCase(container.workflow_repository)
        result = use_case.execute(command)
        return {"status": "success", "data": result.to_dict()}

    def handle_list_workflows(payload: dict[str, object]) -> dict[str, object]:
        _ = payload
        use_case = ListWorkflowsUseCase(container.workflow_repository)
        result = [workflow.to_dict() for workflow in use_case.execute()]
        return {"status": "success", "data": result}

    def handle_get_workflow(payload: dict[str, object]) -> dict[str, object]:
        workflow_id = str(payload.get("workflow_id", "")).strip()
        if not workflow_id:
            return {"status": "error", "message": "Missing workflow_id"}
        use_case = GetWorkflowUseCase(container.workflow_repository)
        result = use_case.execute(workflow_id)
        if result is None:
            return {"status": "error", "message": "Workflow not found"}
        return {"status": "success", "data": result.to_dict()}

    def handle_delete_workflow(payload: dict[str, object]) -> dict[str, object]:
        workflow_id = str(payload.get("workflow_id", "")).strip()
        if not workflow_id:
            return {"status": "error", "message": "Missing workflow_id"}
        use_case = DeleteWorkflowUseCase(container.workflow_repository)
        deleted = use_case.execute(workflow_id)
        if not deleted:
            return {"status": "error", "message": "Workflow not found"}
        return {"status": "success", "data": {"deleted": True}}

    def handle_update_workflow(payload: dict[str, object]) -> dict[str, object]:
        workflow_id = str(payload.get("workflow_id", "")).strip()
        if not workflow_id:
            return {"status": "error", "message": "Missing workflow_id"}
        name = payload.get("name")
        command = UpdateWorkflowCommand(
            workflow_id=workflow_id,
            name=str(name).strip() if name is not None else None,
        )
        use_case = UpdateWorkflowUseCase(container.workflow_repository)
        result = use_case.execute(command)
        if result is None:
            return {"status": "error", "message": "Workflow not found"}
        return {"status": "success", "data": result.to_dict()}

    router.register("workflow.create", handle_create_workflow)
    router.register("workflow.list", handle_list_workflows)
    router.register("workflow.get", handle_get_workflow)
    router.register("workflow.delete", handle_delete_workflow)
    router.register("workflow.update", handle_update_workflow)

