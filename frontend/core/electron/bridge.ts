export interface LocalFileResult {
  blobUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface WorkflowsDesktopBridge {
  invoke<TResponse>(channel: string, payload?: unknown): Promise<TResponse>;
  selectDirectory(title?: string): Promise<{ canceled: boolean; filePaths?: string[] }>;
  selectFile(title?: string, filters?: Array<{ name: string; extensions: string[] }>): Promise<{ canceled: boolean; filePaths?: string[] }>;
  getLocalFileUrl(filePath: string): Promise<LocalFileResult | { error: string }>;
  revokeBlobUrl(blobUrl: string): void;
}

declare global {
  interface Window {
    workflowsDesktop?: WorkflowsDesktopBridge;
  }
}

export function getDesktopBridge(): WorkflowsDesktopBridge | null {
  if (typeof window === "undefined") {
    return null;
  }

  // TODO: Electron preload 完成后，在这里读取真正注入到 renderer 的桌面桥对象。
  return window.workflowsDesktop ?? null;
}

/**
 * 获取本地文件的 URL（用于视频播放等场景）
 * 通过自定义协议避免将大文件读取为 base64
 */
export async function getLocalFileUrl(filePath: string): Promise<LocalFileResult> {
  const bridge = getDesktopBridge();
  if (!bridge) {
    throw new Error("Desktop bridge 未初始化");
  }

  const result = await bridge.getLocalFileUrl(filePath);
  if ("error" in result) {
    throw new Error(result.error);
  }

  return result;
}
