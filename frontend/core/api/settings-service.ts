/**
 * ============================================================
 * Settings Service - 设置 API 服务
 *
 * 【功能说明】
 * 提供设置相关的所有 API 调用，包括：
 * - 获取设置列表
 * - 更新设置项
 *
 * 【后端对应 IPC Channels】
 * - settings.list: backend/modules/settings/presentation/ipc_handlers.py
 * - settings.update
 *
 * 【如何新增设置 API】
 * 1. 在 backend/modules/settings/presentation/ipc_handlers.py 添加新 handler
 * 2. 在 ../application/dto.py 添加对应的 Command/DTO
 * 3. 在 ../application/use_cases.py 添加对应的 UseCase
 * 4. 在 core/api/types.ts 添加对应的 TypeScript 类型
 * 5. 在本文件添加对应的调用方法
 *
 * 【前端调用示例】
 * import { settingsService } from '@/core/api/settings-service';
 *
 * // 获取所有设置
 * const settings = await settingsService.list();
 *
 * // 更新 API Key
 * await settingsService.update({
 *   key: 'api_key',
 *   value: 'sk-xxx',
 *   scope: 'user'
 * });
 * ============================================================
 */

import { getDesktopBridge } from "../electron/bridge";
import type {
  SettingsListResponse,
  SettingsUpdateRequest,
  SettingsUpdateResponse,
  IPCResponse,
} from "./types";

/**
 * 设置 API 服务类
 * 封装所有设置相关的 IPC 调用
 */
class SettingsService {
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
   * 获取设置列表
   * ============================================================
   * GET settings.list
   *
   * @returns 所有设置项的数组
   *
   * @example
   * const settings = await settingsService.list();
   */
  async list(): Promise<SettingsListResponse> {
    const bridge = this.getBridge();
    if (!bridge) {
      throw new Error("Desktop bridge 未初始化，请确保 Electron 已启动");
    }

    const response = await bridge.invoke<IPCResponse<SettingsListResponse>>(
      "settings.list",
      {}
    );

    if (response.status === "error") {
      throw new Error(response.message || "获取设置列表失败");
    }

    return response.data || [];
  }

  /**
   * ============================================================
   * 更新设置项
   * ============================================================
   * PUT settings.update
   *
   * @param params - 更新参数
   * @param params.key - 设置键名
   * @param params.value - 设置值
   * @param params.scope - 作用域（user/system/project，默认 user）
   * @returns 更新后的设置项
   *
   * @example
   * // 更新用户级别的 API Key
   * await settingsService.update({
   *   key: 'api_key',
   *   value: 'sk-xxx',
   *   scope: 'user'
   * });
   */
  async update(params: SettingsUpdateRequest): Promise<SettingsUpdateResponse> {
    const bridge = this.getBridge();
    if (!bridge) {
      throw new Error("Desktop bridge 未初始化，请确保 Electron 已启动");
    }

    const response = await bridge.invoke<IPCResponse<SettingsUpdateResponse>>(
      "settings.update",
      {
        key: params.key,
        value: params.value,
        scope: params.scope || "user",
      }
    );

    if (response.status === "error") {
      throw new Error(response.message || "更新设置失败");
    }

    return response.data!;
  }

  /**
   * 检查设置功能是否可用
   */
  isAvailable(): boolean {
    return this.hasBridge();
  }
}

/** 设置服务单例 */
export const settingsService = new SettingsService();
