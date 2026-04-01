"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { runtimeLogService, type RuntimeLogEntry, type RuntimeRequestType } from "@/core/api";
import { useTheme } from "@/features/theme/theme-context";

interface LogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatLogTime(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return "--:--:--";
  }

  return date.toLocaleTimeString("zh-CN", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getRequestTypeLabel(requestType?: string | null): string | null {
  const labelMap: Record<RuntimeRequestType, string> = {
    text_to_image: "文生图",
    image_to_image: "图生图",
    text_to_video: "文生视频",
    image_to_video: "图生视频",
  };

  if (!requestType) {
    return null;
  }

  return labelMap[requestType as RuntimeRequestType] ?? requestType;
}

function buildSubInfo(log: RuntimeLogEntry): string | null {
  const segments: string[] = [];

  if (log.workflow_id) {
    segments.push(`项目ID: ${log.workflow_id}`);
  }

  if (log.card_id) {
    segments.push(`卡片ID: ${log.card_id}`);
  }

  const requestTypeLabel = getRequestTypeLabel(log.request_type);
  if (requestTypeLabel) {
    segments.push(`请求类型: ${requestTypeLabel}`);
  }

  if (log.model_name) {
    segments.push(`模型: ${log.model_name}`);
  }

  if (log.request_id) {
    segments.push(`请求ID: ${log.request_id}`);
  }

  return segments.length > 0 ? segments.join(" | ") : null;
}

function buildSearchableText(log: RuntimeLogEntry): string {
  return [
    log.message,
    log.workflow_id,
    log.card_id,
    log.card_name,
    log.request_id,
    log.request_type,
    log.model_name,
    JSON.stringify(log.details ?? {}),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function renderIcon(log: RuntimeLogEntry) {
  if (log.event_type === "startup" || log.event_type === "shutdown") {
    return <span className="text-amber-500 font-bold shrink-0">&gt;_</span>;
  }

  if (log.event_type === "request_processing") {
    return (
      <span className="text-sky-400 shrink-0">
        <svg className="w-4 h-4 inline-block animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
      </span>
    );
  }

  if (log.level === "success" || log.event_type === "request_completed") {
    return (
      <span className="text-emerald-500 shrink-0">
        <svg className="w-[1em] h-[1em] inline-block mt-[-2px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      </span>
    );
  }

  if (log.category === "card") {
    return (
      <span className="text-violet-400 shrink-0">
        <svg className="w-[1em] h-[1em] inline-block mt-[-2px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
        </svg>
      </span>
    );
  }

  if (log.category === "project") {
    return (
      <span className="text-blue-400 shrink-0">
        <svg className="w-[1em] h-[1em] inline-block mt-[-2px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h5l2 2h11v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"></path>
        </svg>
      </span>
    );
  }

  if (log.category === "request") {
    return (
      <span className="text-cyan-400 shrink-0">
        <svg className="w-[1em] h-[1em] inline-block mt-[-2px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
        </svg>
      </span>
    );
  }

  if (log.level === "warning" || log.level === "error") {
    return (
      <span className="text-amber-500 shrink-0">
        <svg className="w-[1em] h-[1em] inline-block mt-[-2px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v4m0 4h.01M10.29 3.86l-7.07 12.27A2 2 0 004.95 19h14.1a2 2 0 001.73-2.87L13.71 3.86a2 2 0 00-3.42 0z"></path>
        </svg>
      </span>
    );
  }

  return <span className="w-[1em] shrink-0"></span>;
}

export function LogModal({ isOpen, onClose }: LogModalProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [searchQuery, setSearchQuery] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [logs, setLogs] = useState<RuntimeLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !runtimeLogService.isAvailable()) {
      return;
    }

    let active = true;
    setIsLoading(true);
    setLoadError(null);

    runtimeLogService
      .list({ visible_only: true, limit: 500 })
      .then((items) => {
        if (!active) {
          return;
        }

        setLogs(items);
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        setLoadError(error instanceof Error ? error.message : "加载运行日志失败");
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    const unsubscribe = runtimeLogService.subscribe((event) => {
      if (!active) {
        return;
      }

      if (event.event === "runtime_logs.cleared") {
        setLogs([]);
        return;
      }

      const entry = event.payload.entry;
      if (!entry) {
        return;
      }

      setLogs((prev) => {
        if (prev.some((item) => item.log_id === entry.log_id)) {
          return prev;
        }

        return [...prev, entry];
      });
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [isOpen]);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filteredLogs = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return logs;
    }

    return logs.filter((log) => buildSearchableText(log).includes(normalizedQuery));
  }, [logs, searchQuery]);

  const handleClearLogs = async () => {
    try {
      await runtimeLogService.clear();
      setLogs([]);
    } catch (error) {
      console.error("清空运行日志失败:", error);
    }
  };

  const handleExportLogs = () => {
    const logText = logs
      .map((log) => {
        const subInfo = buildSubInfo(log);
        return `[${formatLogTime(log.created_at)}] ${log.message}${subInfo ? ` (${subInfo})` : ""}`;
      })
      .join("\n");

    const blob = new Blob([logText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `runtime-log-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border shadow-2xl ${
          isDark
            ? "border-[#2a2a2a] bg-[#141414]"
            : "border-black/10 bg-white"
        }`}
      >
        <header
          className={`flex items-center justify-between border-b px-6 py-4 ${
            isDark ? "border-[#2a2a2a] bg-[#1a1a1a]" : "border-black/5 bg-gray-50"
          }`}
        >
          <div className={`flex items-center gap-3 ${isDark ? "text-gray-100" : "text-gray-800"}`}>
            <svg
              className={`h-5 w-5 ${isDark ? "text-gray-400" : "text-gray-500"}`}
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
            className={`rounded p-1 transition-colors ${
              isDark
                ? "text-gray-500 hover:bg-white/10 hover:text-gray-300"
                : "text-gray-400 hover:bg-black/5 hover:text-gray-600"
            }`}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </header>

        <div
          className={`flex items-center justify-between px-6 py-3 ${
            isDark ? "bg-[#141414]" : "bg-gray-50"
          }`}
        >
          <div
            className={`flex max-w-md flex-1 items-center rounded-md border px-3 py-1.5 transition-colors ${
              isDark
                ? "border-[#333] bg-[#0a0a0a] focus-within:border-gray-500"
                : "border-gray-200 bg-white focus-within:border-gray-400"
            }`}
          >
            <svg
              className={`h-4 w-4 shrink-0 ${isDark ? "text-gray-500" : "text-gray-400"}`}
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
              placeholder="检索日志内容 (例如: 文生图, card-123)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`ml-2 w-full border-none bg-transparent text-sm outline-none ${
                isDark
                  ? "text-gray-300 placeholder-gray-600"
                  : "text-gray-700 placeholder-gray-400"
              }`}
            />
          </div>

          <label
            className={`flex cursor-pointer items-center gap-2 text-sm transition-colors ${
              isDark
                ? "text-gray-400 hover:text-gray-200"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="h-4 w-4 cursor-pointer rounded accent-blue-600"
            />
            <span>自动滚动到底部</span>
          </label>
        </div>

        <main
          ref={logContainerRef}
          className={`flex-1 overflow-y-auto border-y p-4 font-mono text-[13px] leading-[1.7] ${
            isDark
              ? "border-[#2a2a2a] bg-[#050505] text-gray-300"
              : "border-black/5 bg-gray-50 text-gray-700"
          }`}
        >
          {loadError ? (
            <div className="py-8 text-center text-sm text-rose-400">{loadError}</div>
          ) : isLoading ? (
            <div className={`py-8 text-center ${isDark ? "text-gray-500" : "text-gray-400"}`}>日志加载中...</div>
          ) : filteredLogs.length === 0 ? (
            <div className={`py-8 text-center ${isDark ? "text-gray-500" : "text-gray-400"}`}>
              {logs.length === 0 ? "当前会话暂无运行日志" : "未找到匹配的日志"}
            </div>
          ) : (
            <div className="flex flex-col space-y-0.5">
              {filteredLogs.map((log) => {
                const subInfo = buildSubInfo(log);

                return (
                  <div
                    key={log.log_id}
                    className={`rounded px-2 py-1 transition-colors ${
                      isDark ? "hover:bg-white/5" : "hover:bg-black/5"
                    }`}
                  >
                    <div className="flex gap-3">
                      <span
                        className={`shrink-0 select-none ${
                          isDark ? "text-gray-600" : "text-gray-400"
                        }`}
                      >
                        [{formatLogTime(log.created_at)}]
                      </span>
                      {renderIcon(log)}
                      <span className={isDark ? "text-gray-300" : "text-gray-700"}>
                        {log.message}
                      </span>
                    </div>
                    {subInfo ? (
                      <div className={`pl-[92px] ${isDark ? "text-[#888]" : "text-gray-500"}`}>
                        {subInfo}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </main>

        <footer
          className={`flex items-center justify-between px-6 py-4 ${
            isDark ? "bg-[#141414]" : "bg-gray-50"
          }`}
        >
          <div className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>
            仅保留当前会话运行日志。如需排查问题，请导出完整信息。
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleExportLogs}
              className="flex items-center gap-2 rounded bg-[#2A64F6] px-5 py-2 text-sm text-white shadow-lg shadow-blue-900/20 transition-colors hover:bg-[#1d4ed8]"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                ></path>
              </svg>
              导出日志
            </button>

            <button
              onClick={handleClearLogs}
              className="flex items-center gap-2 rounded bg-[#EF4444] px-5 py-2 text-sm text-white shadow-lg shadow-red-900/20 transition-colors hover:bg-[#dc2626]"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
