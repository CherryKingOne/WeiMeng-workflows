/**
 * ============================================================
 * Nodes Market Service - 节点市场 API 服务
 *
 * 【功能说明】
 * 提供节点市场相关的 API 调用：
 * - 获取可用节点列表
 *
 * 【后端对应 IPC Channels】
 * - nodes_market.list: backend/modules/nodes_market/presentation/ipc_handlers.py
 *
 * 【如何新增节点市场 API】
 * 1. 在 backend/modules/nodes_market/presentation/ipc_handlers.py 添加新 handler
 * 2. 在 ../application/dto.py 添加对应的 Command/DTO
 * 3. 在 ../application/use_cases.py 添加对应的 UseCase
 * 4. 在 core/api/types.ts 添加对应的 TypeScript 类型
 * 5. 在本文件添加对应的调用方法
 *
 * 【前端调用示例】
 * import { nodesMarketService } from '@/core/api/nodes-market-service';
 *
 * // 获取可用节点列表
 * const nodes = await nodesMarketService.list();
 * ============================================================
 */

import { getDesktopBridge } from "../electron/bridge";
import type {
  NodesMarketListResponse,
  IPCResponse,
} from "./types";

/**
 * 节点市场 API 服务类
 * 封装节点市场相关的 IPC 调用
 */
class NodesMarketService {
  /**
   * 获取桌面桥接器实例
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
   * 获取可用节点列表
   * ============================================================
   * GET nodes_market.list
   *
   * @returns 所有可用节点的数组
   *
   * @example
   * const nodes = await nodesMarketService.list();
   */
  async list(): Promise<NodesMarketListResponse> {
    const bridge = this.getBridge();
    if (!bridge) {
      throw new Error("Desktop bridge 未初始化，请确保 Electron 已启动");
    }

    const response = await bridge.invoke<IPCResponse<NodesMarketListResponse>>(
      "nodes_market.list",
      {}
    );

    if (response.status === "error") {
      throw new Error(response.message || "获取节点列表失败");
    }

    return response.data || [];
  }

  /**
   * 检查节点市场功能是否可用
   */
  isAvailable(): boolean {
    return this.hasBridge();
  }
}

/** 节点市场服务单例 */
export const nodesMarketService = new NodesMarketService();
