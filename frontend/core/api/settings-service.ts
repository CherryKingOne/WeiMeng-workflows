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

/**
 * ============================================================
 * 目录设置 API - 下载目录和缓存目录
 * ============================================================
 * 这些设置会持久化保存，即使应用关闭/重启/断电也不会丢失
 */

export interface DirectorySettings {
  download_dir: string;
  cache_dir: string;
}

/**
 * ============================================================
 * 获取下载目录
 * ============================================================
 * 从 SQLite 数据库读取保存的下载目录路径
 *
 * @returns 下载目录路径，如果未设置则返回空字符串
 *
 * @example
 * const { download_dir } = await getDownloadDir();
 * console.log(download_dir); // "/Users/xxx/Downloads"
 */
export async function getDownloadDir(): Promise<{ download_dir: string }> {
  const bridge = getDesktopBridge();
  if (!bridge) {
    throw new Error("Desktop bridge 未初始化");
  }

  const response = await bridge.invoke<IPCResponse<{ download_dir: string }>>(
    "settings.getDownloadDir",
    {}
  );

  if (response.status === "error") {
    throw new Error(response.message || "获取下载目录失败");
  }

  return response.data!;
}

/**
 * ============================================================
 * 设置下载目录
 * ============================================================
 * 保存下载目录到 SQLite 数据库，持久化存储
 *
 * @param path - 下载目录的绝对路径
 * @returns 设置后的下载目录路径
 *
 * @example
 * await setDownloadDir("/Users/xxx/Downloads/my-projects");
 */
export async function setDownloadDir(path: string): Promise<{ download_dir: string }> {
  const bridge = getDesktopBridge();
  if (!bridge) {
    throw new Error("Desktop bridge 未初始化");
  }

  const response = await bridge.invoke<IPCResponse<{ download_dir: string }>>(
    "settings.setDownloadDir",
    { path }
  );

  if (response.status === "error") {
    throw new Error(response.message || "设置下载目录失败");
  }

  return response.data!;
}

/**
 * ============================================================
 * 获取缓存目录
 * ============================================================
 * 从 SQLite 数据库读取保存的缓存目录路径
 *
 * @returns 缓存目录路径，如果未设置则返回空字符串
 *
 * @example
 * const { cache_dir } = await getCacheDir();
 * console.log(cache_dir); // "/Users/xxx/Library/Caches/my-app"
 */
export async function getCacheDir(): Promise<{ cache_dir: string }> {
  const bridge = getDesktopBridge();
  if (!bridge) {
    throw new Error("Desktop bridge 未初始化");
  }

  const response = await bridge.invoke<IPCResponse<{ cache_dir: string }>>(
    "settings.getCacheDir",
    {}
  );

  if (response.status === "error") {
    throw new Error(response.message || "获取缓存目录失败");
  }

  return response.data!;
}

/**
 * ============================================================
 * 设置缓存目录
 * ============================================================
 * 保存缓存目录到 SQLite 数据库，持久化存储
 *
 * @param path - 缓存目录的绝对路径
 * @returns 设置后的缓存目录路径
 *
 * @example
 * await setCacheDir("/Users/xxx/Library/Caches/my-app");
 */
export async function setCacheDir(path: string): Promise<{ cache_dir: string }> {
  const bridge = getDesktopBridge();
  if (!bridge) {
    throw new Error("Desktop bridge 未初始化");
  }

  const response = await bridge.invoke<IPCResponse<{ cache_dir: string }>>(
    "settings.setCacheDir",
    { path }
  );

  if (response.status === "error") {
    throw new Error(response.message || "设置缓存目录失败");
  }

  return response.data!;
}

/**
 * ============================================================
 * 选择目录对话框
 * ============================================================
 * 调用 Electron 的系统对话框让用户选择目录
 *
 * @param title - 对话框标题
 * @returns 用户选择的目录路径，如果取消则返回空字符串
 *
 * @example
 * const path = await selectDirectory("选择下载目录");
 * if (path) {
 *   await setDownloadDir(path);
 * }
 */
export async function selectDirectory(title?: string): Promise<string> {
  const bridge = getDesktopBridge();
  if (!bridge || !bridge.selectDirectory) {
    throw new Error("Desktop bridge 不支持选择目录功能");
  }

  const result = await bridge.selectDirectory(title || "选择目录");
  
  if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
    return "";
  }
  
  return result.filePaths[0];
}

/**
 * ============================================================
 * 清理缓存
 * ============================================================
 * 清空缓存目录中的所有文件（但保留目录本身）
 *
 * @returns 清理结果，包含删除的文件数量和消息
 *
 * @example
 * const result = await clearCache();
 * console.log(result.message); // "已清理 5 个文件/文件夹"
 */
export interface ClearCacheResult {
  deleted_count: number;
  message: string;
}

export async function clearCache(): Promise<ClearCacheResult> {
  const bridge = getDesktopBridge();
  if (!bridge) {
    throw new Error("Desktop bridge 未初始化");
  }

  const response = await bridge.invoke<IPCResponse<ClearCacheResult>>(
    "settings.clearCache",
    {}
  );

  if (response.status === "error") {
    throw new Error(response.message || "清理缓存失败");
  }

  return response.data!;
}
