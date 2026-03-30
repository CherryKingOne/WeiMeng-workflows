"""Workflow engine persistence adapters."""

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from modules.workflow_engine.domain.entities import Workflow, WorkflowNode, WorkflowEdge
from modules.workflow_engine.domain.repositories import WorkflowRepository
from modules.workflow_engine.domain.value_objects import NodeCoordinates


class WorkflowSqliteRepository(WorkflowRepository):
    """Workflow store using SQLite for persistence."""

    def __init__(self, db_path: Optional[Path] = None) -> None:
        if db_path is None:
            db_path = Path(__file__).resolve().parent.parent.parent.parent / "data" / "workflows.db"
        
        self._db_path = db_path
        self._ensure_db_dir()
        self._init_db()

    def _ensure_db_dir(self) -> None:
        """确保数据库目录存在"""
        self._db_path.parent.mkdir(parents=True, exist_ok=True)

    def _get_connection(self) -> sqlite3.Connection:
        """获取数据库连接"""
        conn = sqlite3.connect(str(self._db_path))
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        """初始化数据库表"""
        with self._get_connection() as conn:
            # 工作流主表
            conn.execute("""
                CREATE TABLE IF NOT EXISTS workflows (
                    workflow_id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
            """)
            
            # 节点表
            conn.execute("""
                CREATE TABLE IF NOT EXISTS workflow_nodes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    workflow_id TEXT NOT NULL,
                    node_id TEXT NOT NULL,
                    node_type TEXT NOT NULL,
                    position_x REAL NOT NULL,
                    position_y REAL NOT NULL,
                    data_json TEXT NOT NULL DEFAULT '{}',
                    UNIQUE(workflow_id, node_id),
                    FOREIGN KEY (workflow_id) REFERENCES workflows(workflow_id) ON DELETE CASCADE
                )
            """)
            
            # 边表
            conn.execute("""
                CREATE TABLE IF NOT EXISTS workflow_edges (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    workflow_id TEXT NOT NULL,
                    source_node_id TEXT NOT NULL,
                    target_node_id TEXT NOT NULL,
                    UNIQUE(workflow_id, source_node_id, target_node_id),
                    FOREIGN KEY (workflow_id) REFERENCES workflows(workflow_id) ON DELETE CASCADE
                )
            """)
            
            # 创建索引
            conn.execute("CREATE INDEX IF NOT EXISTS idx_nodes_workflow_id ON workflow_nodes(workflow_id)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_edges_workflow_id ON workflow_edges(workflow_id)")

            columns = {
                row["name"]
                for row in conn.execute("PRAGMA table_info(workflow_nodes)").fetchall()
            }
            if "data_json" not in columns:
                conn.execute(
                    "ALTER TABLE workflow_nodes ADD COLUMN data_json TEXT NOT NULL DEFAULT '{}'"
                )
            
            conn.commit()

    def _row_to_workflow(self, row: sqlite3.Row, nodes: list[WorkflowNode], edges: list[WorkflowEdge]) -> Workflow:
        """将数据库行转换为 Workflow 实体"""
        created_at_str = row["created_at"]
        created_at = datetime.fromisoformat(created_at_str) if created_at_str else datetime.now(tz=timezone.utc)
        
        return Workflow(
            workflow_id=row["workflow_id"],
            name=row["name"],
            nodes=nodes,
            edges=edges,
            created_at=created_at,
        )

    def _get_workflow_nodes(self, conn: sqlite3.Connection, workflow_id: str) -> list[WorkflowNode]:
        """获取工作流的所有节点"""
        rows = conn.execute(
            "SELECT node_id, node_type, position_x, position_y, data_json FROM workflow_nodes WHERE workflow_id = ?",
            (workflow_id,)
        ).fetchall()
        
        return [
            WorkflowNode(
                node_id=row["node_id"],
                node_type=row["node_type"],
                position=NodeCoordinates(x=row["position_x"], y=row["position_y"]),
                data=self._parse_node_data(row["data_json"]),
            )
            for row in rows
        ]

    def _parse_node_data(self, raw_data: str | None) -> dict[str, object]:
        """Parse persisted node metadata."""
        if not raw_data:
            return {}

        try:
            parsed = json.loads(raw_data)
        except json.JSONDecodeError:
            return {}

        return parsed if isinstance(parsed, dict) else {}

    def _get_workflow_edges(self, conn: sqlite3.Connection, workflow_id: str) -> list[WorkflowEdge]:
        """获取工作流的所有边"""
        rows = conn.execute(
            "SELECT source_node_id, target_node_id FROM workflow_edges WHERE workflow_id = ?",
            (workflow_id,)
        ).fetchall()
        
        return [
            WorkflowEdge(
                source_node_id=row["source_node_id"],
                target_node_id=row["target_node_id"],
            )
            for row in rows
        ]

    def save(self, workflow: Workflow) -> None:
        """保存工作流（新增或更新）"""
        with self._get_connection() as conn:
            now = datetime.now(tz=timezone.utc).isoformat()
            
            # 保存或更新工作流主记录
            conn.execute("""
                INSERT INTO workflows (workflow_id, name, created_at, updated_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(workflow_id) DO UPDATE SET
                    name = excluded.name,
                    updated_at = excluded.updated_at
            """, (
                workflow.workflow_id,
                workflow.name,
                workflow.created_at.isoformat() if workflow.created_at else now,
                now,
            ))
            
            # 删除旧的节点和边
            conn.execute("DELETE FROM workflow_nodes WHERE workflow_id = ?", (workflow.workflow_id,))
            conn.execute("DELETE FROM workflow_edges WHERE workflow_id = ?", (workflow.workflow_id,))
            
            # 插入新的节点
            for node in workflow.nodes:
                conn.execute("""
                    INSERT INTO workflow_nodes (workflow_id, node_id, node_type, position_x, position_y, data_json)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    workflow.workflow_id,
                    node.node_id,
                    node.node_type,
                    node.position.x,
                    node.position.y,
                    json.dumps(node.data, ensure_ascii=False),
                ))
            
            # 插入新的边
            for edge in workflow.edges:
                conn.execute("""
                    INSERT INTO workflow_edges (workflow_id, source_node_id, target_node_id)
                    VALUES (?, ?, ?)
                """, (
                    workflow.workflow_id,
                    edge.source_node_id,
                    edge.target_node_id,
                ))
            
            conn.commit()

    def get_by_id(self, workflow_id: str) -> Optional[Workflow]:
        """根据 ID 获取工作流"""
        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT workflow_id, name, created_at FROM workflows WHERE workflow_id = ?",
                (workflow_id,)
            ).fetchone()
            
            if row is None:
                return None
            
            nodes = self._get_workflow_nodes(conn, workflow_id)
            edges = self._get_workflow_edges(conn, workflow_id)
            
            return self._row_to_workflow(row, nodes, edges)

    def list_all(self) -> list[Workflow]:
        """获取所有工作流"""
        with self._get_connection() as conn:
            rows = conn.execute(
                "SELECT workflow_id, name, created_at FROM workflows ORDER BY created_at DESC"
            ).fetchall()
            
            workflows = []
            for row in rows:
                nodes = self._get_workflow_nodes(conn, row["workflow_id"])
                edges = self._get_workflow_edges(conn, row["workflow_id"])
                workflows.append(self._row_to_workflow(row, nodes, edges))
            
            return workflows

    def delete(self, workflow_id: str) -> None:
        """删除工作流"""
        with self._get_connection() as conn:
            # 由于有外键约束，删除工作流会自动删除相关的节点和边
            conn.execute("DELETE FROM workflows WHERE workflow_id = ?", (workflow_id,))
            conn.commit()

    def get_storage_usage(self, workflow_id: str) -> dict[str, int]:
        """获取工作流的存储使用情况"""
        workflow = self.get_by_id(workflow_id)
        
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
                    "data": node.data,
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
