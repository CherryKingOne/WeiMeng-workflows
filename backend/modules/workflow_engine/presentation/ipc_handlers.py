"""Workflow engine IPC handlers."""

from core.container import ApplicationContainer
from core.ipc_router import IPCRouter
from modules.workflow_engine.application.dto import (
    CreateWorkflowCommand,
    UpdateWorkflowCommand,
    NodeDTO,
    EdgeDTO,
)
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
        
        # 检查是否需要详细信息（节点和边）
        include_details = payload.get("include_details", True)
        
        use_case = GetWorkflowUseCase(container.workflow_repository)
        result = use_case.execute(workflow_id, include_details=bool(include_details))
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
        nodes_data = payload.get("nodes")
        edges_data = payload.get("edges")
        
        # 解析节点数据
        nodes = None
        if nodes_data is not None and isinstance(nodes_data, list):
            nodes = []
            for node_dict in nodes_data:
                if isinstance(node_dict, dict):
                    nodes.append(NodeDTO(
                        node_id=str(node_dict.get("node_id", "")),
                        node_type=str(node_dict.get("node_type", "")),
                        position_x=float(node_dict.get("position_x", 0)),
                        position_y=float(node_dict.get("position_y", 0)),
                        data=node_dict.get("data", {}) if isinstance(node_dict.get("data", {}), dict) else {},
                    ))
        
        # 解析边数据
        edges = None
        if edges_data is not None and isinstance(edges_data, list):
            edges = []
            for edge_dict in edges_data:
                if isinstance(edge_dict, dict):
                    edges.append(EdgeDTO(
                        source_node_id=str(edge_dict.get("source_node_id", "")),
                        target_node_id=str(edge_dict.get("target_node_id", "")),
                    ))
        
        command = UpdateWorkflowCommand(
            workflow_id=workflow_id,
            name=str(name).strip() if name is not None else None,
            nodes=nodes,
            edges=edges,
        )
        use_case = UpdateWorkflowUseCase(container.workflow_repository)
        result = use_case.execute(command)
        if result is None:
            return {"status": "error", "message": "Workflow not found"}
        return {"status": "success", "data": result.to_dict()}

    def handle_get_storage_usage(payload: dict[str, object]) -> dict[str, object]:
        """获取指定工作流的存储使用情况"""
        workflow_id = str(payload.get("workflow_id", "")).strip()
        if not workflow_id:
            return {"status": "error", "message": "Missing workflow_id"}
        
        storage_usage = container.workflow_repository.get_storage_usage(workflow_id)
        return {"status": "success", "data": storage_usage}

    router.register("workflow.create", handle_create_workflow)
    router.register("workflow.list", handle_list_workflows)
    router.register("workflow.get", handle_get_workflow)
    router.register("workflow.delete", handle_delete_workflow)
    router.register("workflow.update", handle_update_workflow)
    router.register("workflow.getStorageUsage", handle_get_storage_usage)
