"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/features/theme/theme-context";

interface CanvasHeaderProps {
  projectName?: string;
  zoom?: number;
  onProjectNameChange?: (name: string) => void;
  onStorageClick?: () => void;
  onApiSettingsClick?: () => void;
}

export function CanvasHeader({
  projectName: initialProjectName = "未命名项目",
  zoom = 90,
  onProjectNameChange,
  onStorageClick,
  onApiSettingsClick,
}: CanvasHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  
  const [isEditing, setIsEditing] = useState(false);
  const [projectName, setProjectName] = useState(initialProjectName);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 当外部传入的 projectName 变化时更新本地状态
  useEffect(() => {
    setProjectName(initialProjectName);
  }, [initialProjectName]);
  
  // 进入编辑模式时自动聚焦输入框
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);
  
  const handleSave = () => {
    const trimmedName = projectName.trim();
    if (trimmedName) {
      setProjectName(trimmedName);
      onProjectNameChange?.(trimmedName);
    } else {
      setProjectName(initialProjectName);
    }
    setIsEditing(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setProjectName(initialProjectName);
      setIsEditing(false);
    }
  };

  return (
    <header className="fixed top-4 inset-x-0 z-20 pointer-events-none">
      <div className="flex items-center justify-between px-4 max-w-[100vw] overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* 左侧项目信息 */}
        <div
          className={`flex shrink-0 items-center space-x-2 px-3 py-1.5 rounded-full border pointer-events-auto transition-colors ${
            isDark
              ? "bg-[#1a1a1a] border-white/5 hover:bg-[#252525]"
              : "bg-white border-black/10 hover:bg-gray-50"
          }`}
        >
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shrink-0">
            <svg
              className="w-4 h-4 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
          </div>
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              className={`text-sm font-medium bg-transparent outline-none w-32 ${
                isDark ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400"
              }`}
              placeholder="输入项目名称"
            />
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className={`text-sm font-medium cursor-pointer ${
                isDark ? "" : "text-gray-900"
              }`}
            >
              {projectName}
            </button>
          )}
        </div>

        {/* 中间信息栏 */}
        <div className="glass-panel shrink-0 px-4 py-2 rounded-full flex items-center space-x-3 text-sm pointer-events-auto mx-4">
          <Link
            href="/"
            className="nav-pill inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              ></path>
            </svg>
            <span>返回项目</span>
          </Link>
          <span className="text-blue-400">@WeiMeng</span>
          <span className={isDark ? "text-gray-500" : "text-gray-400"}>|</span>
          <span className="text-purple-400">V.0.0.1</span>
        </div>

        {/* 右侧工具栏 */}
        <div className="glass-panel shrink-0 px-4 py-2 rounded-full flex items-center space-x-4 text-sm pointer-events-auto">
          <span className={isDark ? "" : "text-gray-700"}>{zoom}%</span>
          <div className={`flex items-center space-x-4 border-l pl-4 ${isDark ? "border-white/10" : "border-black/10"}`}>
            <button className={`flex items-center space-x-1.5 transition-colors ${isDark ? "hover:text-white" : "text-gray-700 hover:text-gray-900"}`}>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
              </svg>
              <span>下载</span>
            </button>
            <button
              className={`flex items-center space-x-1.5 transition-colors ${isDark ? "hover:text-white" : "text-gray-700 hover:text-gray-900"}`}
              onClick={toggleTheme}
              title={isDark ? "切换到亮色模式" : "切换到暗色模式"}
            >
              {isDark ? (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
                </svg>
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="4"></circle>
                  <path d="M12 2v2"></path>
                  <path d="M12 20v2"></path>
                  <path d="m4.93 4.93 1.41 1.41"></path>
                  <path d="m17.66 17.66 1.41 1.41"></path>
                  <path d="M2 12h2"></path>
                  <path d="M20 12h2"></path>
                  <path d="m6.34 17.66-1.41 1.41"></path>
                  <path d="m19.07 4.93-1.41 1.41"></path>
                </svg>
              )}
              <span>{isDark ? "暗色" : "亮色"}</span>
            </button>
            <button
              onClick={onStorageClick}
              className={`flex items-center space-x-1.5 transition-colors ${isDark ? "hover:text-white" : "text-gray-700 hover:text-gray-900"}`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
              <span>存储</span>
            </button>
            <button
              onClick={onApiSettingsClick}
              className={`flex items-center space-x-1.5 transition-colors ${isDark ? "hover:text-white" : "text-gray-700 hover:text-gray-900"}`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
              </svg>
              <span>API 设置</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
