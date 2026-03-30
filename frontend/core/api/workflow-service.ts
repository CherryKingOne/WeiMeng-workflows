/**
 * ============================================================
 * Workflow Service - 工作流 API 服务
 *
 * 【功能说明】
 * 提供工作流相关的所有 API 调用，包括：
 * - 创建工作流
 * - 获取工作流列表
 * - 获取单个工作流详情
 * - 更新工作流
 * - 删除工作流
 *
 * 【后端对应 IPC Channels】
 * - workflow.create: backend/modules/workflow_engine/presentation/ipc_handlers.py
 * - workflow.list
 * - workflow.get
 * - workflow.update
 * - workflow.delete
 *
 * 【如何新增工作流 API】
 * 1. 在 backend/modules/workflow_engine/presentation/ipc_handlers.py 添加新 handler
 * 2. 在 ../application/dto.py 添加对应的 Command/DTO
 * 3. 在 ../application/use_cases.py 添加对应的 UseCase
 * 4. 在 core/api/types.ts 添加对应的 TypeScript 类型
 * 5. 在本文件添加对应的调用方法
 *
 * 【前端调用示例】
 * import { workflowService } from '@/core/api/workflow-service';
 *
 * // 获取工作流列表
 * const workflows = await workflowService.list();
 *
 * // 创建工作流
 * const newWorkflow = await workflowService.create({ name: '我的工作流' });
 *
 * // 更新工作流
 * await workflowService.update({ workflow_id: 'xxx', name: '新名称' });
 *
 * // 删除工作流
 * await workflowService.delete('xxx');
 * ============================================================
 */

import { getDesktopBridge } from "../electron/bridge";
import type {
  WorkflowCreateRequest,
  WorkflowCreateResponse,
  WorkflowListResponse,
  WorkflowGetRequest,
  WorkflowGetResponse,
  WorkflowUpdateRequest,
  WorkflowUpdateResponse,
  WorkflowDeleteRequest,
  WorkflowDeleteResponse,
  IPCResponse,
} from "./types";

/**
 * 工作流 API 服务类
 * 封装所有工作流相关的 IPC 调用
 */
class WorkflowService {
  /**
   * 获取桌面桥接器实例
   * 用于与 Electron 主进程通信
   */
  private getBridge() {
    return getDesktopBridge();
  }

  /**
   * 检查是否有可用的桌面桥接器
   */
  private hasBridge(): boolean {
    return this.getBridge() !== null;
  }

  /**
   * ============================================================
   * 创建工作流
   * ============================================================
   * POST workflow.create
   *
   * @param params - 创建参数
   * @param params.name - 工作流名称
   * @returns 创建成功的工作流对象
   *
   * @example
   * const workflow = await workflowService.create({ name: '视频分镜工作流' });
   */
  async create(params: WorkflowCreateRequest): Promise<WorkflowCreateResponse> {
    const bridge = this.getBridge();
    if (!bridge) {
      throw new Error("Desktop bridge 未初始化，请确保 Electron 已启动");
    }

    const response = await bridge.invoke<IPCResponse<WorkflowCreateResponse>>(
      "workflow.create",
      { name: params.name }
    );

    if (response.status === "error") {
      throw new Error(response.message || "创建工作流失败");
    }

    return response.data!;
  }

  /**
   * ============================================================
   * 获取工作流列表
   * ============================================================
   * GET workflow.list
   *
   * @returns 所有工作流的数组
   *
   * @example
   * const workflows = await workflowService.list();
   */
  async list(): Promise<WorkflowListResponse> {
    const bridge = this.getBridge();
    if (!bridge) {
      throw new Error("Desktop bridge 未初始化，请确保 Electron 已启动");
    }

    const response = await bridge.invoke<IPCResponse<WorkflowListResponse>>(
      "workflow.list",
      {}
    );

    if (response.status === "error") {
      throw new Error(response.message || "获取工作流列表失败");
    }

    return response.data || [];
  }

  /**
   * ============================================================
   * 获取单个工作流详情
   * ============================================================
   * GET workflow.get
   *
   * @param params - 查询参数
   * @param params.workflow_id - 工作流 ID
   * @param params.include_details - 是否包含详细信息（节点和边），默认 true
   * @returns 工作流详情
   *
   * @example
   * const workflow = await workflowService.get({ workflow_id: 'abc-123' });
   */
  async get(params: WorkflowGetRequest): Promise<WorkflowGetResponse> {
    const bridge = this.getBridge();
    if (!bridge) {
      throw new Error("Desktop bridge 未初始化，请确保 Electron 已启动");
    }

    const response = await bridge.invoke<IPCResponse<WorkflowGetResponse>>(
      "workflow.get",
      {
        workflow_id: params.workflow_id,
        include_details: params.include_details ?? true,
      }
    );

    if (response.status === "error") {
      throw new Error(response.message || "获取工作流详情失败");
    }

    return response.data!;
  }

  /**
   * ============================================================
   * 更新工作流
   * ============================================================
   * PUT workflow.update
   *
   * @param params - 更新参数
   * @param params.workflow_id - 工作流 ID
   * @param params.name - 新名称（可选）
   * @param params.nodes - 节点列表（可选）
   * @param params.edges - 边列表（可选）
   * @returns 更新后的工作流对象
   *
   * @example
   * const updated = await workflowService.update({
   *   workflow_id: 'abc-123',
   *   name: '新名称',
   *   nodes: [{ node_id: 'n1', node_type: 'image', position_x: 100, position_y: 100 }],
   *   edges: [{ source_node_id: 'n1', target_node_id: 'n2' }],
   * });
   */
  async update(params: WorkflowUpdateRequest): Promise<WorkflowUpdateResponse> {
    const bridge = this.getBridge();
    if (!bridge) {
      throw new Error("Desktop bridge 未初始化，请确保 Electron 已启动");
    }

    const response = await bridge.invoke<IPCResponse<WorkflowUpdateResponse>>(
      "workflow.update",
      {
        workflow_id: params.workflow_id,
        name: params.name,
        nodes: params.nodes,
        edges: params.edges,
      }
    );

    if (response.status === "error") {
      throw new Error(response.message || "更新工作流失败");
    }

    return response.data!;
  }

  /**
   * ============================================================
   * 删除工作流
   * ============================================================
   * DELETE workflow.delete
   *
   * @param params - 删除参数
   * @param params.workflow_id - 工作流 ID
   * @returns 删除结果
   *
   * @example
   * await workflowService.delete({ workflow_id: 'abc-123' });
   */
  async delete(params: WorkflowDeleteRequest): Promise<WorkflowDeleteResponse> {
    const bridge = this.getBridge();
    if (!bridge) {
      throw new Error("Desktop bridge 未初始化，请确保 Electron 已启动");
    }

    const response = await bridge.invoke<IPCResponse<WorkflowDeleteResponse>>(
      "workflow.delete",
      { workflow_id: params.workflow_id }
    );

    if (response.status === "error") {
      throw new Error(response.message || "删除工作流失败");
    }

    return response.data!;
  }

  /**
   * ============================================================
   * 获取工作流存储使用情况
   * ============================================================
   * GET workflow.getStorageUsage
   *
   * @param params - 查询参数
   * @param params.workflow_id - 工作流 ID
   * @returns 存储使用情况，包含节点数、边数、预估大小
   *
   * @example
   * const usage = await workflowService.getStorageUsage({ workflow_id: 'abc-123' });
   * console.log(usage.nodes_count, usage.edges_count, usage.estimated_size_bytes);
   */
  async getStorageUsage(params: { workflow_id: string }): Promise<StorageUsageResponse> {
    const bridge = this.getBridge();
    if (!bridge) {
      throw new Error("Desktop bridge 未初始化，请确保 Electron 已启动");
    }

    const response = await bridge.invoke<IPCResponse<StorageUsageResponse>>(
      "workflow.getStorageUsage",
      { workflow_id: params.workflow_id }
    );

    if (response.status === "error") {
      throw new Error(response.message || "获取存储使用情况失败");
    }

    return response.data!;
  }

  /**
   * 检查工作流功能是否可用
   * 用于判断当前环境是否支持工作流操作
   */
  isAvailable(): boolean {
    return this.hasBridge();
  }
}

/** 存储使用情况响应类型 */
export interface StorageUsageResponse {
  /** 节点数量 */
  nodes_count: number;
  /** 边数量 */
  edges_count: number;
  /** 预估大小（字节） */
  estimated_size_bytes: number;
}

/** 工作流服务单例 */
export const workflowService = new WorkflowService();
