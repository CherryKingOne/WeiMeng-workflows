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
});

console.log("[Preload] workflowsDesktop API 已注入");
