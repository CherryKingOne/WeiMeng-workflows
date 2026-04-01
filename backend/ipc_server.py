"""
============================================================
Python IPC 服务器 - 进程间通信桥接

【功能说明】
通过 stdin/stdout 与 Electron 主进程进行 JSON-RPC 通信
接收前端请求，调用业务逻辑，返回结果

【通信协议】
- 格式: JSON-RPC 2.0
- 输入: 从 stdin 读取 JSON 对象
- 输出: 向 stdout 写入 JSON 对象

【请求格式】
{
    "id": 1,
    "method": "workflow.create",
    "params": {"name": "xxx"}
}

【响应格式】
{
    "id": 1,
    "result": {"status": "success", "data": {...}}
}
或
{
    "id": 1,
    "error": {"code": -32600, "message": "错误信息"}
}

【支持的 IPC 通道】
- workflow.create, workflow.list, workflow.get, workflow.update, workflow.delete
- settings.list, settings.update
- nodes_market.list
- models_config.list, models_config.save, models_config.test_connection

【如何新增 IPC 通道】
1. 在 modules/xxx/presentation/ipc_handlers.py 添加 handler
2. 在 main.py 注册 handler（已有）
3. 无需修改本文件

============================================================
"""

import sys
import json
import threading
from typing import Any
from core.container import ApplicationContainer, build_container
from core.ipc_router import IPCRouter
from modules.workflow_engine.presentation.ipc_handlers import (
    register_handlers as register_workflow_handlers,
)
from modules.settings.presentation.ipc_handlers import (
    register_handlers as register_settings_handlers,
)
from modules.nodes_market.presentation.ipc_handlers import (
    register_handlers as register_nodes_market_handlers,
)
from modules.models_config.presentation.ipc_handlers import (
    register_handlers as register_models_config_handlers,
)


class IPCServer:
    """IPC 服务器 - 通过 stdin/stdout 与 Electron 通信"""

    def __init__(self):
        self.container = build_container()
        self.router = IPCRouter()
        self._register_handlers()
        self.running = False

    def _register_handlers(self):
        """注册所有业务 handler"""
        register_workflow_handlers(self.router, self.container)
        register_settings_handlers(self.router, self.container)
        register_nodes_market_handlers(self.router, self.container)
        register_models_config_handlers(self.router, self.container)
        print("[IPC Server] 所有 handler 注册完成", flush=True)
        print(f"[IPC Server] 可用路由: {self.router.list_routes()}", flush=True)

    def handle_request(self, request: dict[str, Any]) -> dict[str, Any]:
        """处理单个请求"""
        request_id = request.get("id")
        method = request.get("method")
        params = request.get("params", {})

        if not method:
            return {
                "id": request_id,
                "error": {
                    "code": -32600,
                    "message": "Invalid Request: method is required"
                }
            }

        try:
            # 调用 router 处理请求
            result = self.router.handle_message(method, params)
            return {"id": request_id, "result": result}
        except Exception as e:
            return {
                "id": request_id,
                "error": {
                    "code": -32000,
                    "message": f"Server Error: {str(e)}"
                }
            }

    def process_line(self, line: str):
        """处理一行输入"""
        try:
            request = json.loads(line.strip())
            response = self.handle_request(request)
            # 输出 JSON-RPC 响应
            print(json.dumps(response), flush=True)
        except json.JSONDecodeError as e:
            error_response = {
                "id": None,
                "error": {
                    "code": -32700,
                    "message": f"Parse Error: {str(e)}"
                }
            }
            print(json.dumps(error_response), flush=True)
        except Exception as e:
            error_response = {
                "id": None,
                "error": {
                    "code": -32000,
                    "message": f"Server Error: {str(e)}"
                }
            }
            print(json.dumps(error_response), flush=True)

    def run(self):
        """运行 IPC 服务器"""
        self.running = True
        print("[IPC Server] 启动成功，等待请求...", flush=True)

        # 逐行读取 stdin
        for line in sys.stdin:
            if not self.running:
                break
            if line.strip():
                self.process_line(line)


def main():
    """入口函数"""
    print("========================================", flush=True)
    print("  Python IPC Server 启动中...", flush=True)
    print("========================================", flush=True)

    server = IPCServer()
    server.run()


if __name__ == "__main__":
    main()
