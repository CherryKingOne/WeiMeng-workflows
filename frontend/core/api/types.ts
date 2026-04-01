/**
 * ============================================================
 * API 类型定义 - 前后端通信数据结构
 *
 * 本文件定义前端与后端 Python IPC 通信的类型对应关系
 * 遵循以下命名规范：
 * - IPC Channel 命名: 模块名.操作名 (如 workflow.create, settings.list)
 * - 请求参数: 模块名 + Operation + Request
 * - 响应数据: 模块名 + Operation + Response
 *
 * 【如何新增 API】
 * 1. 在 backend/modules/xxx/presentation/ipc_handlers.py 添加新的 handler
 * 2. 在本文件添加对应的 Request/Response 类型定义
 * 3. 在对应的 service 文件中添加调用方法
 * ============================================================
 */

/**
 * ============================================================
 * 通用响应类型
 * 所有 IPC 调用都返回此格式
 * ============================================================
 */

export interface IPCResponse<T = unknown> {
  status: "success" | "error";
  data?: T;
  message?: string;
}

/**
 * ============================================================
 * Workflow 模块 - 工作流相关类型定义
 * 后端 IPC Channels:
 * - workflow.create: 创建工作流
 * - workflow.list: 获取工作流列表
 * - workflow.get: 获取单个工作流详情
 * - workflow.update: 更新工作流
 * - workflow.delete: 删除工作流
 * ============================================================
 */

/** 创建工作流请求参数 */
export interface WorkflowCreateRequest {
  /** 工作流名称 */
  name: string;
}

/** 节点数据 */
export interface WorkflowNode {
  /** 节点 ID */
  node_id: string;
  /** 节点类型 */
  node_type: string;
  /** X 坐标 */
  position_x: number;
  /** Y 坐标 */
  position_y: number;
  /** 节点扩展数据，例如可编辑节点名称 nodeName */
  data?: Record<string, unknown>;
}

/** 边数据 */
export interface WorkflowEdge {
  /** 源节点 ID */
  source_node_id: string;
  /** 目标节点 ID */
  target_node_id: string;
}

/** 工作流基础信息 - 与后端 WorkflowDTO 对应 */
export interface WorkflowSummary {
  /** 工作流唯一 ID */
  workflow_id: string;
  /** 工作流名称 */
  name: string;
  /** 节点数量 */
  node_count: number;
  /** 边数量 */
  edge_count: number;
  /** 节点列表（可选，获取详情时返回） */
  nodes?: WorkflowNode[];
  /** 边列表（可选，获取详情时返回） */
  edges?: WorkflowEdge[];
}

/** 创建工作流响应数据 */
export type WorkflowCreateResponse = WorkflowSummary;

/** 获取工作流列表响应数据 */
export type WorkflowListResponse = WorkflowSummary[];

/** 获取单个工作流请求参数 */
export interface WorkflowGetRequest {
  /** 工作流 ID */
  workflow_id: string;
  /** 是否包含详细信息（节点和边），默认 true */
  include_details?: boolean;
}

/** 获取单个工作流响应数据 */
export type WorkflowGetResponse = WorkflowSummary;

/** 更新工作流请求参数 */
export interface WorkflowUpdateRequest {
  /** 工作流 ID */
  workflow_id: string;
  /** 新名称（可选） */
  name?: string;
  /** 节点列表（可选） */
  nodes?: WorkflowNode[];
  /** 边列表（可选） */
  edges?: WorkflowEdge[];
}

/** 更新工作流响应数据 */
export type WorkflowUpdateResponse = WorkflowSummary;

/** 删除工作流请求参数 */
export interface WorkflowDeleteRequest {
  /** 工作流 ID */
  workflow_id: string;
}

/** 删除工作流响应数据 */
export interface WorkflowDeleteResponse {
  deleted: boolean;
}

/** 存储使用情况 - 工作流的节点和边统计 */
export interface StorageUsageResponse {
  /** 节点数量 */
  nodes_count: number;
  /** 边数量 */
  edges_count: number;
  /** 预估大小（字节） */
  estimated_size_bytes: number;
}

/**
 * ============================================================
 * Settings 模块 - 设置相关类型定义
 * 后端 IPC Channels:
 * - settings.list: 获取设置列表
 * - settings.update: 更新设置项
 * ============================================================
 */

/** 设置项的作用域 */
export type SettingScope = "user" | "system" | "project";

/** 单个设置项 */
export interface SettingItem {
  /** 设置键名 */
  key: string;
  /** 设置值 */
  value: string;
  /** 作用域 */
  scope: SettingScope;
}

/** 获取设置列表响应数据 */
export type SettingsListResponse = SettingItem[];

/** 更新设置请求参数 */
export interface SettingsUpdateRequest {
  /** 设置键名 */
  key: string;
  /** 设置值 */
  value: string;
  /** 作用域（默认 user） */
  scope?: SettingScope;
}

/** 更新设置响应数据 */
export type SettingsUpdateResponse = SettingItem;

/** 目录设置 - 下载目录和缓存目录 */
export interface DirectorySettings {
  /** 下载目录路径 */
  download_dir: string;
  /** 缓存目录路径 */
  cache_dir: string;
}

/** 清理缓存结果 */
export interface ClearCacheResult {
  deleted_count: number;
  message: string;
}

/** 文件过滤器 */
export interface FileFilter {
  name: string;
  extensions: string[];
}

/** 文件 Base64 转换结果 */
export interface FileBase64Result {
  base64: string;
  mime_type: string;
  file_name: string;
  file_size: number;
}

/**
 * ============================================================
 * Models Config 模块 - 模型配置相关类型定义
 * 后端 IPC Channels:
 * - models_config.list: 获取 registry + 数据库存储后的模型配置
 * - models_config.save: 持久化模型配置到 SQLite
 * - models_config.test_connection: 使用 base_url + /models 测试连接
 * - models_config.generate_image: 调用已配置图片模型生成结果
 * ============================================================
 */

export type ModelCategory = "chat" | "image" | "video";

export interface ModelsConfigCategoryItem {
  key: ModelCategory;
  label: string;
  count: number;
}

export interface ModelOptionItem {
  label: string;
  value: string;
}

export interface ModelResolutionOptionItem extends ModelOptionItem {
  size_map?: Record<string, string>;
}

export interface ModelParameterSpec {
  input_image_mode?: string;
  supports_multiple_input_images?: boolean;
  supports_multiple_output_images?: boolean;
  defaults?: {
    aspect_ratio?: string;
    resolution?: string;
    image_count?: string;
  };
  aspect_ratio_options?: ModelOptionItem[];
  resolution_options?: ModelResolutionOptionItem[];
  image_count_options?: ModelOptionItem[];
}

export interface ModelsConfigModelItem {
  key: string;
  display_name: string;
  provider: string;
  category: ModelCategory;
  module_name: string;
  model_id: string;
  api_key: string;
  base_url: string;
  parameter_spec?: ModelParameterSpec;
}

export interface ModelsConfigListResponse {
  categories: ModelsConfigCategoryItem[];
  models: ModelsConfigModelItem[];
}

export interface ModelsConfigSaveItem {
  key: string;
  model_id: string;
  api_key: string;
  base_url: string;
}

export interface ModelsConfigSaveRequest {
  models: ModelsConfigSaveItem[];
}

export type ModelsConfigSaveResponse = ModelsConfigListResponse;

export interface ModelsConfigTestConnectionRequest {
  key: string;
  api_key: string;
  base_url: string;
}

export interface ModelsConfigTestConnectionResponse {
  key: string;
  ok: boolean;
  status_code: number | null;
  tested_url: string;
  message: string;
}

export interface ModelsConfigGenerateImageInputItem {
  base64?: string;
  url?: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
}

export interface ModelsConfigGenerateImageRequest {
  key: string;
  prompt: string;
  input_images?: ModelsConfigGenerateImageInputItem[];
  size?: string;
  image_count?: number;
}

export interface ModelsConfigGenerateImageResultItem {
  base64?: string | null;
  url?: string | null;
  mime_type: string;
  file_name: string;
  file_size: number;
  source_url?: string | null;
}

export interface ModelsConfigGenerateImageResponse {
  key: string;
  request_id?: string | null;
  image?: ModelsConfigGenerateImageResultItem | null;
  images: ModelsConfigGenerateImageResultItem[];
}

/**
 * ============================================================
 * Runtime Logs 模块 - 运行日志相关类型定义
 * 后端 IPC Channels:
 * - runtime_logs.list
 * - runtime_logs.record
 * - runtime_logs.clear
 * ============================================================
 */

export type RuntimeLogLevel = "info" | "success" | "warning" | "error" | "loading";

export type RuntimeLogCategory = "lifecycle" | "project" | "card" | "request" | "system";

export type RuntimeLogEventType =
  | "startup"
  | "shutdown"
  | "project_created"
  | "project_entered"
  | "project_renamed"
  | "project_exited"
  | "project_deleted"
  | "card_added"
  | "request_started"
  | "request_processing"
  | "request_completed"
  | "generic";

export type RuntimeRequestType =
  | "text_to_image"
  | "image_to_image"
  | "text_to_video"
  | "image_to_video";

export interface RuntimeLogEntry {
  log_id: string;
  created_at: string;
  category: RuntimeLogCategory | string;
  event_type: RuntimeLogEventType | string;
  level: RuntimeLogLevel | string;
  message: string;
  workflow_id?: string | null;
  card_id?: string | null;
  card_name?: string | null;
  request_id?: string | null;
  request_type?: RuntimeRequestType | string | null;
  model_name?: string | null;
  display: boolean;
  details?: Record<string, unknown>;
}

export interface RuntimeLogListRequest {
  limit?: number;
  visible_only?: boolean;
}

export interface RuntimeLogRecordRequest {
  category: RuntimeLogCategory | string;
  event_type: RuntimeLogEventType | string;
  level: RuntimeLogLevel | string;
  message: string;
  workflow_id?: string;
  card_id?: string;
  card_name?: string;
  request_id?: string;
  request_type?: RuntimeRequestType | string;
  model_name?: string;
  display?: boolean;
  details?: Record<string, unknown>;
}

export interface RuntimeLogClearResponse {
  cleared_count: number;
}

export interface RuntimeLogEventMessage {
  event: "runtime_logs.appended" | "runtime_logs.cleared";
  payload: {
    entry?: RuntimeLogEntry;
    cleared_count?: number;
  };
}

/**
 * ============================================================
 * Nodes Market 模块 - 节点市场相关类型定义
 * 后端 IPC Channels:
 * - nodes_market.list: 获取可用节点列表
 * ============================================================
 */

/** 节点定义 */
export interface NodeDefinition {
  /** 节点 ID */
  id: string;
  /** 节点类型 */
  type: string;
  /** 节点显示名称 */
  name: string;
  /** 节点描述 */
  description: string;
  /** 节点图标 */
  icon?: string;
  /** 节点分类 */
  category?: string;
  /** 节点版本 */
  version?: string;
  /** 节点属性定义 */
  properties?: Record<string, unknown>;
}

/** 获取节点市场列表响应数据 */
export type NodesMarketListResponse = NodeDefinition[];

/**
 * ============================================================
 * 前端页面使用的类型 - 项目管理页
 * ============================================================
 */

/** 项目卡片显示数据 - 前端页面使用 */
export interface ProjectSummary {
  /** 项目 ID */
  id: string;
  /** 项目名称 */
  name: string;
  /** 修改时间显示文本 */
  updatedAtLabel: string;
  /** 创建时间显示文本 */
  createdAtLabel: string;
  /** 节点数量 */
  nodeCount: number;
}
