/**
 * ============================================================
 * API 服务入口 - 统一导出所有前端 API 服务
 *
 * 【项目架构说明】
 * 本项目采用前后端分离架构，通过 Electron IPC 通信：
 * - 前端: Next.js (React) 运行在 Electron Renderer 进程
 * - 后端: Python 运行在 Electron Main 进程
 * - 通信: Electron IPC (preload 桥接)
 *
 * 【目录结构】
 * core/
 * ├── electron/
 * │   └── bridge.ts          # Electron 桥接器
 * └── api/
 *     ├── types.ts           # 类型定义
 *     ├── workflow-service.ts    # 工作流 API
 *     ├── settings-service.ts    # 设置 API
 *     ├── models-config-service.ts # 模型配置 API
 *     ├── nodes-market-service.ts # 节点市场 API
 *     └── index.ts           # 本文件 - 统一导出
 *
 * 【IPC 通信流程】
 * 1. 前端调用 Service 方法
 * 2. Service 通过 bridge.invoke() 发送 IPC 消息
 * 3. Electron preload 接收消息并转发给 Main 进程
 * 4. Main 进程中的 Python 后端处理请求
 * 5. Python 后端返回结果给 Electron Main
 * 6. Electron Main 返回结果给 Renderer
 * 7. Service 解析响应并返回给调用者
 *
 * 【如何新增 API 模块】
 * 假设要添加新的 "project" 模块：
 *
 * 1. 后端 (Python):
 *    - backend/modules/project/domain/entities.py     # 领域实体
 *    - backend/modules/project/domain/repositories.py # 仓储接口
 *    - backend/modules/project/application/dto.py     # 数据传输对象
 *    - backend/modules/project/application/use_cases.py # 用例
 *    - backend/modules/project/infrastructure/        # 基础设施实现
 *    - backend/modules/project/presentation/ipc_handlers.py # IPC 处理器
 *
 * 2. 后端注册 (在 backend/main.py):
 *    from modules.project.presentation.ipc_handlers import register_handlers
 *    register_handlers(router, container)
 *
 * 3. 前端类型 (core/api/types.ts):
 *    - 添加 ProjectXxxRequest / ProjectXxxResponse 类型
 *
 * 4. 前端服务 (core/api/project-service.ts):
 *    - 创建 ProjectService 类
 *    - 实现各个 API 方法
 *
 * 5. 前端导出 (本文件):
 *    - 导出新的服务
 *
 * 6. 前端使用:
 *    import { projectService } from '@/core/api';
 *    await projectService.list();
 *
 * 【后端 IPC Channel 命名规范】
 * - 格式: 模块名.操作名 (小写)
 * - 例如: workflow.create, settings.update, nodes_market.list
 *
 * 【响应格式规范】
 * 所有 API 响应都是以下格式:
 * {
 *   "status": "success" | "error",
 *   "data": <数据> | undefined,
 *   "message": <错误信息> | undefined
 * }
 *
 * ============================================================
 */

// Workflow 工作流服务
export { workflowService } from "./workflow-service";
export type {
  WorkflowSummary,
  WorkflowCreateRequest,
  WorkflowCreateResponse,
  WorkflowListResponse,
  WorkflowGetResponse,
  WorkflowUpdateRequest,
  WorkflowUpdateResponse,
  WorkflowDeleteRequest,
  WorkflowDeleteResponse,
  ProjectSummary,
} from "./types";

// StorageUsageResponse 从 workflow-service 导出
export type { StorageUsageResponse } from "./workflow-service";

// Settings 设置服务
export { settingsService } from "./settings-service";
export {
  getDownloadDir,
  setDownloadDir,
  getCacheDir,
  setCacheDir,
  selectDirectory,
  selectFile,
  readFileAsBase64,
  clearCache,
} from "./settings-service";
export type {
  SettingsListResponse,
  SettingsUpdateRequest,
  SettingsUpdateResponse,
  SettingScope,
  DirectorySettings,
  FileFilter,
  FileBase64Result,
  ClearCacheResult,
} from "./types";

// Models Config 模型配置服务
export { modelsConfigService } from "./models-config-service";
export type {
  ModelCategory,
  ModelsConfigCategoryItem,
  ModelsConfigGenerateImageInputItem,
  ModelsConfigGenerateImageRequest,
  ModelsConfigGenerateImageResponse,
  ModelsConfigGenerateImageResultItem,
  ModelsConfigModelItem,
  ModelsConfigListResponse,
  ModelsConfigSaveItem,
  ModelsConfigSaveRequest,
  ModelsConfigSaveResponse,
  ModelsConfigTestConnectionRequest,
  ModelsConfigTestConnectionResponse,
} from "./types";

// Nodes Market 节点市场服务
export { nodesMarketService } from "./nodes-market-service";
export type {
  NodesMarketListResponse,
  NodeDefinition,
} from "./types";

// Runtime Logs 运行日志服务
export { runtimeLogService } from "./runtime-log-service";
export type {
  RuntimeLogEntry,
  RuntimeLogListRequest,
  RuntimeLogRecordRequest,
  RuntimeLogClearResponse,
  RuntimeLogEventMessage,
  RuntimeLogLevel,
  RuntimeLogCategory,
  RuntimeLogEventType,
  RuntimeRequestType,
} from "./types";

// 通用类型
export type { IPCResponse } from "./types";
