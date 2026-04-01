/**
 * ============================================================
 * Electron Preload 脚本
 *
 * 【功能说明】
 * - 暴露安全的 API 给前端 Renderer 进程
 * - 桥接前端与 Electron 主进程通信
 * - 提供 window.workflowsDesktop 接口供前端调用
 *
 * 【安全原则】
 * - contextIsolation: true（启用上下文隔离）
 * - nodeIntegration: false（禁用 Node.js）
 * - 只暴露必要的 API，防止 XSS 攻击
 *
 * 【暴露给前端的 API】
 * window.workflowsDesktop.invoke(channel, payload)
 *   - channel: IPC 通道名，如 'workflow.create'
 *   - payload: 请求参数对象
 *   - 返回: Promise<IPCResponse>
 *
 * 【如何新增 API】
 * 在 contextBridge.exposeInMainWorld 添加新的方法即可
 *
 * ============================================================
 */

const { contextBridge, ipcRenderer } = require("electron");

/**
 * ============================================================
 * 暴露给前端的安全 API
 * ============================================================
 */
contextBridge.exposeInMainWorld("workflowsDesktop", {
  /**
   * 调用 IPC 通道
   * @param {string} channel - IPC 通道名，如 'workflow.create'
   * @param {unknown} payload - 请求参数
   * @returns {Promise<{status: string, data?: unknown, message?: string}>}
   */
  invoke(channel, payload) {
    return ipcRenderer.invoke("invoke", channel, payload);
  },

  /**
   * 窗口控制
   */
  window: {
    minimize: () => ipcRenderer.send("window:minimize"),
    maximize: () => ipcRenderer.send("window:maximize"),
    close: () => ipcRenderer.send("window:close"),
  },

  /**
   * 监听菜单事件
   */
  onMenuEvent(channel, callback) {
    const validChannels = ["menu:new-project"];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },

  /**
   * 获取应用版本
   */
  getVersion() {
    return ipcRenderer.invoke("app:version");
  },

  /**
   * 选择文件夹目录
   * @param {string} title - 对话框标题
   * @returns {Promise<{canceled: boolean, filePaths?: string[]}>}
   */
  selectDirectory(title) {
    return ipcRenderer.invoke("dialog:selectDirectory", title);
  },

  /**
   * 选择文件
   * @param {string} title - 对话框标题
   * @param {string[]} filters - 文件类型过滤器，如 [{name: 'Images', extensions: ['jpg', 'png']}]
   * @returns {Promise<{canceled: boolean, filePaths?: string[]}>}
   */
  selectFile(title, filters) {
    return ipcRenderer.invoke("dialog:selectFile", title, filters);
  },

  /**
   * 获取本地文件的 Blob URL
   * 用于在渲染进程中播放本地视频文件
   * @param {string} filePath - 本地文件路径
   * @returns {Promise<{blobUrl: string, fileName: string, fileSize: number, mimeType: string}>}
   */
  getLocalFileUrl(filePath) {
    return ipcRenderer.invoke("file:getBlobUrl", filePath);
  },

  /**
   * 释放 Blob URL
   * @param {string} blobUrl - 要释放的 Blob URL
   */
  revokeBlobUrl(blobUrl) {
    ipcRenderer.send("file:revokeBlobUrl", blobUrl);
  },

  /**
   * 监听运行日志事件
   * @param {(event: {event: string, payload: unknown}) => void} callback
   * @returns {() => void}
   */
  onRuntimeLogEvent(callback) {
    const listener = (_, payload) => callback(payload);
    ipcRenderer.on("runtime-logs:event", listener);
    return () => {
      ipcRenderer.removeListener("runtime-logs:event", listener);
    };
  },
});

console.log("[Preload] workflowsDesktop API 已注入");
