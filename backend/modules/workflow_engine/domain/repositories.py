"""Workflow engine repository contracts."""

from abc import ABC, abstractmethod

from .entities import Workflow


class WorkflowRepository(ABC):
    """Persistence contract for workflow aggregates."""

    @abstractmethod
    def save(self, workflow: Workflow) -> None:
        """Persist a workflow aggregate."""

    @abstractmethod
    def get_by_id(self, workflow_id: str) -> Workflow | None:
        """Return a workflow by its identifier."""

    @abstractmethod
    def list_all(self) -> list[Workflow]:
        """Return all persisted workflows."""

    @abstractmethod
    def delete(self, workflow_id: str) -> None:
        """Delete a workflow by its identifier."""

    @abstractmethod
    def get_storage_usage(self, workflow_id: str) -> dict[str, int]:
        """获取指定工作流的存储使用情况（字节）
        
        返回格式:
        {
            "nodes_count": 节点数量,
            "edges_count": 边数量,
            "estimated_size_bytes": 预估大小（字节）
        }
        """

