export interface WorkflowsDesktopBridge {
  invoke<TResponse>(channel: string, payload?: unknown): Promise<TResponse>;
  selectDirectory(title?: string): Promise<{ canceled: boolean; filePaths?: string[] }>;
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
