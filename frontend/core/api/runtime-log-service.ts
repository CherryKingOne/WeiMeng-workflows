import { getDesktopBridge } from "../electron/bridge";
import type {
  IPCResponse,
  RuntimeLogClearResponse,
  RuntimeLogEntry,
  RuntimeLogEventMessage,
  RuntimeLogListRequest,
  RuntimeLogRecordRequest,
} from "./types";

class RuntimeLogService {
  private getBridge() {
    return getDesktopBridge();
  }

  async list(params: RuntimeLogListRequest = {}): Promise<RuntimeLogEntry[]> {
    const bridge = this.getBridge();
    if (!bridge) {
      throw new Error("Desktop bridge 未初始化，请确保 Electron 已启动");
    }

    const response = await bridge.invoke<IPCResponse<RuntimeLogEntry[]>>(
      "runtime_logs.list",
      {
        limit: params.limit,
        visible_only: params.visible_only ?? true,
      }
    );

    if (response.status === "error") {
      throw new Error(response.message || "获取运行日志失败");
    }

    return response.data || [];
  }

  async record(params: RuntimeLogRecordRequest): Promise<RuntimeLogEntry> {
    const bridge = this.getBridge();
    if (!bridge) {
      throw new Error("Desktop bridge 未初始化，请确保 Electron 已启动");
    }

    const response = await bridge.invoke<IPCResponse<RuntimeLogEntry>>(
      "runtime_logs.record",
      params
    );

    if (response.status === "error") {
      throw new Error(response.message || "写入运行日志失败");
    }

    return response.data!;
  }

  async clear(): Promise<RuntimeLogClearResponse> {
    const bridge = this.getBridge();
    if (!bridge) {
      throw new Error("Desktop bridge 未初始化，请确保 Electron 已启动");
    }

    const response = await bridge.invoke<IPCResponse<RuntimeLogClearResponse>>(
      "runtime_logs.clear",
      {}
    );

    if (response.status === "error") {
      throw new Error(response.message || "清空运行日志失败");
    }

    return response.data!;
  }

  subscribe(callback: (event: RuntimeLogEventMessage) => void): (() => void) | null {
    const bridge = this.getBridge();
    if (!bridge?.onRuntimeLogEvent) {
      return null;
    }

    return bridge.onRuntimeLogEvent((event) => {
      callback(event as RuntimeLogEventMessage);
    });
  }

  isAvailable(): boolean {
    return this.getBridge() !== null;
  }
}

export const runtimeLogService = new RuntimeLogService();
