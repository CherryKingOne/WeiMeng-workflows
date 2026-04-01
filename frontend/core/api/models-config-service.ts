/**
 * ============================================================
 * Models Config Service - 模型配置 API 服务
 *
 * 约束说明：
 * 1. 模型元数据来自后端 registry JSON，不允许在弹窗组件里继续硬编码模型列表。
 * 2. 用户输入的 API Key 只能通过后端持久化到数据库，不能写回代码、注释、JSON 注册表或默认值。
 * 3. 后端模型文件中的 OpenAI 兼容请求格式不是随意编写的，新增模型时必须按官方接口文档维护。
 * ============================================================
 */

import { getDesktopBridge } from "../electron/bridge";
import type {
  ModelsConfigGenerateImageRequest,
  ModelsConfigGenerateImageResponse,
  IPCResponse,
  ModelsConfigListResponse,
  ModelsConfigSaveRequest,
  ModelsConfigSaveResponse,
  ModelsConfigTestConnectionRequest,
  ModelsConfigTestConnectionResponse,
} from "./types";

class ModelsConfigService {
  private getBridge() {
    return getDesktopBridge();
  }

  private hasBridge(): boolean {
    return this.getBridge() !== null;
  }

  async list(): Promise<ModelsConfigListResponse> {
    const bridge = this.getBridge();
    if (!bridge) {
      throw new Error("Desktop bridge 未初始化，请确保 Electron 已启动");
    }

    const response = await bridge.invoke<IPCResponse<ModelsConfigListResponse>>(
      "models_config.list",
      {}
    );

    if (response.status === "error") {
      throw new Error(response.message || "获取模型配置失败");
    }

    return response.data || { categories: [], models: [] };
  }

  async save(params: ModelsConfigSaveRequest): Promise<ModelsConfigSaveResponse> {
    const bridge = this.getBridge();
    if (!bridge) {
      throw new Error("Desktop bridge 未初始化，请确保 Electron 已启动");
    }

    const response = await bridge.invoke<IPCResponse<ModelsConfigSaveResponse>>(
      "models_config.save",
      params
    );

    if (response.status === "error") {
      throw new Error(response.message || "保存模型配置失败");
    }

    return response.data || { categories: [], models: [] };
  }

  async testConnection(
    params: ModelsConfigTestConnectionRequest
  ): Promise<ModelsConfigTestConnectionResponse> {
    const bridge = this.getBridge();
    if (!bridge) {
      throw new Error("Desktop bridge 未初始化，请确保 Electron 已启动");
    }

    const response = await bridge.invoke<IPCResponse<ModelsConfigTestConnectionResponse>>(
      "models_config.test_connection",
      params
    );

    if (response.status === "error") {
      throw new Error(response.message || "测试连接失败");
    }

    return response.data!;
  }

  async generateImage(
    params: ModelsConfigGenerateImageRequest
  ): Promise<ModelsConfigGenerateImageResponse> {
    const bridge = this.getBridge();
    if (!bridge) {
      throw new Error("Desktop bridge 未初始化，请确保 Electron 已启动");
    }

    const response = await bridge.invoke<IPCResponse<ModelsConfigGenerateImageResponse>>(
      "models_config.generate_image",
      params
    );

    if (response.status === "error") {
      throw new Error(response.message || "图片生成失败");
    }

    return response.data || { key: params.key, images: [], image: null, request_id: null };
  }

  isAvailable(): boolean {
    return this.hasBridge();
  }
}

export const modelsConfigService = new ModelsConfigService();
