"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/features/theme/theme-context";

interface LogEntry {
  id: string;
  time: string;
  type: "info" | "success" | "warning" | "loading" | "system";
  icon?: "terminal" | "shield" | "settings" | "database" | "box" | "check" | "loading";
  message: string;
  subInfo?: string;
  progress?: number;
}

interface LogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 示例日志数据
const sampleLogs: LogEntry[] = [
  {
    id: "1",
    time: "17:36:51",
    type: "system",
    icon: "terminal",
    message: "正在初始化云端沙箱...",
  },
  {
    id: "2",
    time: "17:36:51",
    type: "success",
    icon: "shield",
    message: "认证通过。令牌: ****************",
  },
  {
    id: "3",
    time: "17:36:51",
    type: "system",
    icon: "settings",
    message: "正在分配虚拟资源...",
  },
  {
    id: "4",
    time: "17:36:51",
    type: "info",
    subInfo: "vCPU: 4 核 | 内存: 8192 MB | GPU: N/A",
    message: "",
  },
  {
    id: "5",
    time: "17:36:51",
    type: "system",
    icon: "database",
    message: "正在配置安全网络策略...",
  },
  {
    id: "6",
    time: "17:36:52",
    type: "system",
    icon: "box",
    message: "正在拉取运行环境: coze-code:1.0.0",
  },
  {
    id: "7",
    time: "17:36:52",
    type: "info",
    message: "下载中",
    progress: 100,
  },
  {
    id: "8",
    time: "17:36:54",
    type: "system",
    icon: "database",
    message: "正在挂载工作区卷 /workspace/projects...",
  },
  {
    id: "9",
    time: "17:36:54",
    type: "info",
    message: "正在启动沙箱代理...",
  },
  {
    id: "10",
    time: "17:36:54",
    type: "success",
    icon: "check",
    message: "沙箱环境准备就绪。",
  },
];

export function LogModal({ isOpen, onClose }: LogModalProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [searchQuery, setSearchQuery] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>(sampleLogs);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // 过滤日志
  const filteredLogs = logs.filter((log) =>
    log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (log.subInfo && log.subInfo.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // 清屏
  const handleClearLogs = () => {
    setLogs([]);
  };

  // 导出日志
  const handleExportLogs = () => {
    const logText = logs
      .map((log) => `[${log.time}] ${log.message || log.subInfo}`)
      .join("\n");
    const blob = new Blob([logText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `log_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  // 渲染图标
  const renderIcon = (icon?: string) => {
    switch (icon) {
      case "terminal":
        return (
          <span className="text-amber-500 font-bold shrink-0">&gt;_</span>
        );
      case "shield":
        return (
          <span className="text-emerald-500 shrink-0">
            <svg className="w-[1em] h-[1em] inline-block mt-[-2px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
          </span>
        );
      case "settings":
        return (
          <span className="text-amber-500 shrink-0">
            <svg className="w-[1em] h-[1em] inline-block mt-[-2px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
          </span>
        );
      case "database":
        return (
          <span className="text-amber-500 shrink-0">
            <svg className="w-[1em] h-[1em] inline-block mt-[-2px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path>
            </svg>
          </span>
        );
      case "box":
        return (
          <span className="text-amber-500 shrink-0">
            <svg className="w-[1em] h-[1em] inline-block mt-[-2px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
            </svg>
          </span>
        );
      case "check":
        return (
          <span className="text-emerald-500 shrink-0">
            <svg className="w-[1em] h-[1em] inline-block mt-[-2px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </span>
        );
      case "loading":
        return (
          <span className="text-purple-500 shrink-0 ml-1">
            <svg className="w-4 h-4 inline-block mt-[-2px] animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
          </span>
        );
      default:
        return <span className="w-[1em] shrink-0"></span>;
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* 弹窗主体 */}
      <div
        className={`w-full max-w-5xl border rounded-xl shadow-2xl flex flex-col overflow-hidden ${
          isDark
            ? "bg-[#141414] border-[#2a2a2a]"
            : "bg-white border-black/10"
        }`}
        style={{ height: "85vh" }}
      >
        {/* 头部 Header */}
        <header
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isDark ? "border-[#2a2a2a] bg-[#1a1a1a]" : "border-black/5 bg-gray-50"
          }`}
        >
          <div className={`flex items-center gap-3 ${isDark ? "text-gray-100" : "text-gray-800"}`}>
            <svg
              className={`w-5 h-5 ${isDark ? "text-gray-400" : "text-gray-500"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              ></path>
            </svg>
            <h1 className="text-base font-semibold tracking-wide">运行日志</h1>
          </div>
          <button
            onClick={onClose}
            className={`transition-colors p-1 rounded ${
              isDark
                ? "text-gray-500 hover:text-gray-300 hover:bg-white/10"
                : "text-gray-400 hover:text-gray-600 hover:bg-black/5"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </header>

        {/* 控制台栏 */}
        <div
          className={`flex items-center justify-between px-6 py-3 ${
            isDark ? "bg-[#141414]" : "bg-gray-50"
          }`}
        >
          {/* 搜索框 */}
          <div
            className={`flex flex-1 max-w-md items-center border rounded-md px-3 py-1.5 transition-colors ${
              isDark
                ? "bg-[#0a0a0a] border-[#333] focus-within:border-gray-500"
                : "bg-white border-gray-200 focus-within:border-gray-400"
            }`}
          >
            <svg
              className={`w-4 h-4 shrink-0 ${isDark ? "text-gray-500" : "text-gray-400"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
            <input
              type="text"
              placeholder="检索日志内容 (例如: Error, 加载...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`bg-transparent border-none outline-none text-sm w-full ml-2 ${
                isDark
                  ? "text-gray-300 placeholder-gray-600"
                  : "text-gray-700 placeholder-gray-400"
              }`}
            />
          </div>

          {/* 自动滚动勾选 */}
          <label
            className={`flex items-center gap-2 cursor-pointer group text-sm transition-colors ${
              isDark
                ? "text-gray-400 hover:text-gray-200"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="w-4 h-4 rounded cursor-pointer accent-blue-600"
            />
            <span>自动滚动到底部</span>
          </label>
        </div>

        {/* 日志终端视图 */}
        <main
          ref={logContainerRef}
          className={`flex-1 overflow-y-auto p-4 font-mono text-[13px] leading-[1.7] border-y ${
            isDark
              ? "bg-[#050505] border-[#2a2a2a] text-gray-300"
              : "bg-gray-50 border-black/5 text-gray-700"
          }`}
        >
          {filteredLogs.length === 0 ? (
            <div className={`text-center py-8 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
              {logs.length === 0 ? "暂无日志记录" : "未找到匹配的日志"}
            </div>
          ) : (
            <div className="flex flex-col space-y-0.5">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className={`flex gap-3 py-1 px-2 rounded transition-colors ${
                    isDark ? "hover:bg-white/5" : "hover:bg-black/5"
                  }`}
                >
                  <span
                    className={`shrink-0 select-none ${
                      isDark ? "text-gray-600" : "text-gray-400"
                    }`}
                  >
                    [{log.time}]
                  </span>
                  {renderIcon(log.icon)}
                  {log.message && (
                    <span className={isDark ? "text-gray-300" : "text-gray-700"}>
                      {log.message}
                      {log.progress !== undefined && (
                        <span className="flex items-center">
                          <span className={isDark ? "text-gray-500 mx-1" : "text-gray-400 mx-1"}>[</span>
                          <span className="text-emerald-600/80 tracking-tighter">
                            {"█".repeat(Math.floor(log.progress / 5))}
                          </span>
                          <span className={isDark ? "text-gray-500 mx-1" : "text-gray-400 mx-1"}>]</span>
                          <span className={isDark ? "text-gray-400" : "text-gray-500"}>{log.progress}%</span>
                        </span>
                      )}
                    </span>
                  )}
                  {log.subInfo && (
                    <span className={isDark ? "text-[#888]" : "text-gray-500"}>
                      {log.subInfo}
                    </span>
                  )}
                </div>
              ))}
              
              {/* Loading 状态 */}
              <div
                className={`flex gap-3 py-1 px-2 rounded transition-colors ${
                  isDark ? "hover:bg-white/5" : "hover:bg-black/5"
                }`}
              >
                {renderIcon("loading")}
                <span className="text-purple-400">
                  等待连接中
                  <span className="animate-pulse">_</span>
                </span>
              </div>
            </div>
          )}
        </main>

        {/* 底栏操作区 */}
        <footer
          className={`flex items-center justify-between px-6 py-4 ${
            isDark ? "bg-[#141414]" : "bg-gray-50"
          }`}
        >
          <div className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>
            仅保留当前会话运行日志。如需排查问题，请导出完整信息。
          </div>

          <div className="flex gap-3">
            {/* 导出按钮 */}
            <button
              onClick={handleExportLogs}
              className="flex items-center gap-2 px-5 py-2 bg-[#2A64F6] hover:bg-[#1d4ed8] text-white text-sm rounded transition-colors shadow-lg shadow-blue-900/20"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                ></path>
              </svg>
              导出日志
            </button>

            {/* 清屏按钮 */}
            <button
              onClick={handleClearLogs}
              className="flex items-center gap-2 px-5 py-2 bg-[#EF4444] hover:bg-[#dc2626] text-white text-sm rounded transition-colors shadow-lg shadow-red-900/20"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                ></path>
              </svg>
              清屏
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
