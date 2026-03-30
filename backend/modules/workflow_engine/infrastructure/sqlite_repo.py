"""Workflow engine persistence adapters."""

import json
from modules.workflow_engine.domain.entities import Workflow
from modules.workflow_engine.domain.repositories import WorkflowRepository


class WorkflowSqliteRepository(WorkflowRepository):
    """Bootstrap repository using in-memory storage before SQLite is wired in."""

    def __init__(self) -> None:
        self._items: dict[str, Workflow] = {}

    def save(self, workflow: Workflow) -> None:
        self._items[workflow.workflow_id] = workflow

    def get_by_id(self, workflow_id: str) -> Workflow | None:
        return self._items.get(workflow_id)

    def list_all(self) -> list[Workflow]:
        return list(self._items.values())

    def delete(self, workflow_id: str) -> None:
        self._items.pop(workflow_id, None)

    def get_storage_usage(self, workflow_id: str) -> dict[str, int]:
        """获取工作流的存储使用情况"""
        workflow = self._items.get(workflow_id)
        
        if not workflow:
            return {
                "nodes_count": 0,
                "edges_count": 0,
                "estimated_size_bytes": 0,
            }
        
        # 计算预估大小：将整个工作流序列化为 JSON 估算字节数
        workflow_data = {
            "workflow_id": workflow.workflow_id,
            "name": workflow.name,
            "nodes": [
                {
                    "node_id": node.node_id,
                    "node_type": node.node_type,
                    "position": {"x": node.position.x, "y": node.position.y},
                }
                for node in workflow.nodes
            ],
            "edges": [
                {"source": edge.source_node_id, "target": edge.target_node_id}
                for edge in workflow.edges
            ],
            "created_at": workflow.created_at.isoformat() if workflow.created_at else None,
        }
        
        json_str = json.dumps(workflow_data, ensure_ascii=False)
        estimated_size = len(json_str.encode("utf-8"))
        
        return {
            "nodes_count": len(workflow.nodes),
            "edges_count": len(workflow.edges),
            "estimated_size_bytes": estimated_size,
        }

