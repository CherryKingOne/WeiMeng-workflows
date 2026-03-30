"use client";

import { useState } from "react";
import { useTheme } from "@/features/theme/theme-context";
import { getDesktopBridge } from "@/core/electron/bridge";

interface StorageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StorageModal({ isOpen, onClose }: StorageModalProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [saveInterval, setSaveInterval] = useState(5);
  const [downloadDir, setDownloadDir] = useState("Qiaodoumayi_Media");
  const [cacheDir, setCacheDir] = useState<string | null>(null);

  const handleSelectDownloadDir = async () => {
    const bridge = getDesktopBridge();
    if (!bridge) {
      alert("此功能需要在 Electron 环境中使用");
      return;
    }
    
    try {
      const result = await bridge.selectDirectory("选择下载目录");
      if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
        setDownloadDir(result.filePaths[0]);
      }
    } catch (error) {
      console.error("选择目录失败:", error);
    }
  };

  const handleSelectCacheDir = async () => {
    const bridge = getDesktopBridge();
    if (!bridge) {
      alert("此功能需要在 Electron 环境中使用");
      return;
    }
    
    try {
      const result = await bridge.selectDirectory("选择资源缓存目录");
      if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
        setCacheDir(result.filePaths[0]);
      }
    } catch (error) {
      console.error("选择目录失败:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* 弹窗主体 */}
      <div
        className={`w-full max-w-[720px] border rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] ${
          isDark
            ? "bg-[#161616] border-white/10"
            : "bg-white border-black/10"
        }`}
      >
        {/* 头部 Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isDark ? "border-white/5" : "border-black/5"
          }`}
        >
          <div className={`flex items-center gap-3 ${isDark ? "text-gray-200" : "text-gray-800"}`}>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              ></path>
            </svg>
            <span className="text-[15px] font-medium">本地存储管理</span>
          </div>
          <button
            onClick={onClose}
            className={`group relative p-2 rounded-full transition-all duration-200 ${
              isDark 
                ? "text-gray-500 hover:text-white hover:bg-white/10" 
                : "text-gray-400 hover:text-gray-800 hover:bg-black/5"
            }`}
            aria-label="关闭"
          >
            <svg
              className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M18 6L6 18M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 内容区 Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {/* 1. 下载目录设置 */}
          <section
            className={`border rounded-xl p-5 space-y-4 ${
              isDark
                ? "border-white/5 bg-white/[0.02]"
                : "border-black/5 bg-gray-50/50"
            }`}
          >
            <div className="flex items-center gap-2 text-blue-400">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
              </svg>
              <h3 className={`text-sm font-medium ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                下载目录设置
              </h3>
            </div>
            <div
              className={`rounded-lg p-3 flex justify-between items-center ${
                isDark
                  ? "bg-black/30 border border-white/5"
                  : "bg-gray-100 border border-black/5"
              }`}
            >
              <span className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                当前下载目录
              </span>
              <span className={`text-xs truncate max-w-[200px] ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                {downloadDir}
              </span>
            </div>
            <button
              onClick={handleSelectDownloadDir}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
              </svg>
              选择下载目录
            </button>
            <p className={`text-[11px] ${isDark ? "text-gray-500" : "text-gray-400"}`}>
              设置后，所有下载的文件将保存到指定目录。首次设置后，后续下载将自动使用该目录。
            </p>
          </section>

          {/* 2. 资源缓存目录 */}
          <section
            className={`border rounded-xl p-5 space-y-4 ${
              isDark
                ? "border-white/5 bg-white/[0.02]"
                : "border-black/5 bg-gray-50/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path>
                </svg>
                <h3 className={`text-sm font-medium ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                  资源缓存目录
                </h3>
              </div>
              <span className={`text-[11px] italic ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                {cacheDir ? "已启用" : "未启用"}
              </span>
            </div>
            <div
              className={`rounded-lg p-3 flex justify-between items-center ${
                isDark
                  ? "bg-black/30 border border-white/5"
                  : "bg-gray-100 border border-black/5"
              }`}
            >
              <span className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                缓存目录
              </span>
              <span className={`text-xs font-medium truncate max-w-[200px] ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                {cacheDir || "未选择"}
              </span>
            </div>
            <button
              onClick={handleSelectCacheDir}
              className="w-full bg-[#00a870] hover:bg-[#00c080] text-white text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
              </svg>
              选择缓存目录
            </button>
            <p className={`text-[11px] leading-relaxed ${isDark ? "text-gray-500" : "text-gray-400"}`}>
              选择一个本地目录后，AI生成或远程下载的素材将按类型（图片/视频/音频）分类缓存；从本机文件夹拖入画布或从剪贴板粘贴的素材也会写入同目录下的local文件夹。当浏览器清理IndexedDB或页面刷新导致Blob
              URL失效时，可从本地缓存自动恢复。导出项目时也会优先从本地缓存读取，提升导出速度。
            </p>
          </section>

          {/* 3. 工作流自动保存 */}
          <section
            className={`border rounded-xl p-5 space-y-4 ${
              isDark
                ? "border-white/5 bg-white/[0.02]"
                : "border-black/5 bg-gray-50/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-yellow-500">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                </svg>
                <h3 className={`text-sm font-medium ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                  工作流自动保存
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                  防止画布卡死、白屏丢失内容
                </span>
                <div className="flex items-center gap-1.5 ml-2">
                  <input
                    type="checkbox"
                    checked={autoSaveEnabled}
                    onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 rounded bg-gray-800 border-none"
                  />
                  <span className={`text-xs ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    启用
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                保存间隔（分钟）
              </span>
              <div
                className={`flex items-center border rounded px-2 py-1 ${
                  isDark
                    ? "bg-black/40 border-white/10"
                    : "bg-white border-black/10"
                }`}
              >
                <input
                  type="number"
                  value={saveInterval}
                  onChange={(e) => setSaveInterval(Number(e.target.value))}
                  className={`bg-transparent w-8 text-xs text-center outline-none ${
                    isDark ? "text-white" : "text-gray-800"
                  }`}
                />
                <div
                  className={`flex flex-col border-l ml-2 pl-1 ${
                    isDark ? "border-white/10" : "border-black/10"
                  }`}
                >
                  <svg
                    className={`w-2.5 h-2.5 cursor-pointer ${
                      isDark ? "text-gray-500" : "text-gray-400"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    onClick={() => setSaveInterval((v) => Math.min(v + 1, 60))}
                  >
                    <path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"></path>
                  </svg>
                  <svg
                    className={`w-2.5 h-2.5 cursor-pointer ${
                      isDark ? "text-gray-500" : "text-gray-400"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    onClick={() => setSaveInterval((v) => Math.max(v - 1, 1))}
                  >
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"></path>
                  </svg>
                </div>
              </div>
              <span className={`text-[11px] italic ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                保存到资源缓存目录 / autosave /
              </span>
            </div>
            <div className="flex gap-2">
              <button
                className={`flex-1 border text-sm py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                  isDark
                    ? "bg-white/5 border-white/10 hover:bg-white/10 text-gray-400"
                    : "bg-gray-100 border-black/10 hover:bg-gray-200 text-gray-600"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                </svg>
                立即保存
              </button>
              <button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm py-2 rounded-lg flex items-center justify-center gap-2 transition-all">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                </svg>
                导入自动保存
              </button>
            </div>
            <p className={`text-[11px] leading-relaxed ${isDark ? "text-gray-500" : "text-gray-400"}`}>
              仅保存工作流结构及画布节点引用的图像/视频素材信息（JSON），素材从资源缓存目录读取。文件名格式：项目名_时间.json。
            </p>
          </section>

          {/* 4. 内存管理 */}
          <section
            className={`border rounded-xl p-5 space-y-4 ${
              isDark
                ? "border-white/5 bg-white/[0.02]"
                : "border-black/5 bg-gray-50/50"
            }`}
          >
            <div className="flex items-center gap-2 text-blue-400">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
              <h3 className={`text-sm font-medium ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                内存管理
              </h3>
            </div>
            <button className="w-full bg-[#ef4444] hover:bg-[#ff5555] text-white text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
              清理内存
            </button>
            <p className={`text-[11px] leading-relaxed ${isDark ? "text-gray-500" : "text-gray-400"}`}>
              清理将释放：节点Blob URL、历史记录（Mac/Windows保留最新500条，其他200条）、缩略图缓存、内容缓存
            </p>
          </section>

          {/* 5. 存储使用情况 */}
          <section
            className={`border rounded-xl p-5 space-y-4 ${
              isDark
                ? "border-white/5 bg-white/[0.02]"
                : "border-black/5 bg-gray-50/50"
            }`}
          >
            <h3 className={`text-sm font-medium ${isDark ? "text-gray-200" : "text-gray-800"}`}>
              存储使用情况
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className={isDark ? "text-gray-500" : "text-gray-400"}>
                  资源数量
                </span>
                <span className={`font-mono ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  0 <span className={isDark ? "text-gray-600" : "text-gray-400"}>↑</span>
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className={isDark ? "text-gray-500" : "text-gray-400"}>
                  占用空间
                </span>
                <span className={`font-mono ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  0 B
                </span>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                className={`flex-1 border text-sm py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                  isDark
                    ? "bg-white/5 border-white/10 hover:bg-white/10 text-gray-400"
                    : "bg-gray-100 border-black/10 hover:bg-gray-200 text-gray-600"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                导出所有资源
              </button>
              <button
                className={`w-10 border rounded-lg flex items-center justify-center transition-all ${
                  isDark
                    ? "bg-white/5 border-white/10 hover:bg-white/10 text-gray-500"
                    : "bg-gray-100 border-black/10 hover:bg-gray-200 text-gray-400"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
