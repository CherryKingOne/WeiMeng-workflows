"use client";

import { useState, useRef, useCallback } from "react";
import { useTheme } from "@/features/theme/theme-context";

// 弧形菜单工具项
const arcMenuTools = [
  { id: "palette", icon: "palette", label: "调色板" },
  { id: "film", icon: "film", label: "视频" },
  { id: "layout-grid", icon: "layout-grid", label: "网格" },
  { id: "scissors", icon: "scissors", label: "裁剪" },
];

// Lucide 图标组件
function LucideIcon({ name, className }: { name: string; className?: string }) {
  const iconPaths: Record<string, string> = {
    x: "M18 6L6 18M6 6l12 12",
    plus: "M12 5v14M5 12h14",
    palette: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 8 6.5 8 8 8.67 8 9.5 7.33 11 6.5 11zm3-4C8.67 7 8 6.33 8 5.5S8.67 4 9.5 4s1.5.67 1.5 1.5S10.33 7 9.5 7zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 4 14.5 4s1.5.67 1.5 1.5S15.33 7 14.5 7zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 8 17.5 8s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z",
    film: "M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9",
    "layout-grid": "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
    scissors: "M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 11-4.243 4.243 3 3 0 014.243-4.243zm0-11.515a3 3 0 11-4.243 4.243 3 3 0 014.243-4.243z",
  };

  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={iconPaths[name] || ""} />
    </svg>
  );
}

interface ImageInputCardProps {
  id: string;
  onRemove?: (id: string) => void;
  onFocus?: (id: string) => void;
  isFocused?: boolean;
  onDrag?: (delta: { x: number; y: number }) => void;
}

export function ImageInputCard({
  id,
  onRemove,
  onFocus,
  isFocused = false,
  onDrag,
}: ImageInputCardProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const cardRef = useRef<HTMLDivElement>(null);

  // 卡片状态：default - 默认态, interactive - 交互态, focused - 激活态
  const [status, setStatus] = useState<"default" | "interactive" | "focused">("default");
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // 处理鼠标进入 - 显示弧形菜单
  const handleMouseEnter = useCallback(() => {
    if (status === "default") {
      setStatus("interactive");
    }
  }, [status]);

  // 处理鼠标离开
  const handleMouseLeave = useCallback(() => {
    if (status === "interactive" && !isFocused) {
      setStatus("default");
    }
  }, [status, isFocused]);

  // 处理点击聚焦
  const handleClick = useCallback(() => {
    setStatus("focused");
    onFocus?.(id);
  }, [id, onFocus]);

  // 处理拖拽
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
    };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStart.current.x;
    const deltaY = e.clientY - dragStart.current.y;
    dragStart.current = { x: e.clientX, y: e.clientY };
    onDrag?.({ x: deltaX, y: deltaY });
  }, [isDragging, onDrag]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 处理删除
  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.(id);
  }, [id, onRemove]);

  // 处理文件选择
  const handleFileSelect = useCallback(() => {
    // TODO: 实现文件选择逻辑
  }, []);

  // 获取边框样式
  const getBorderStyle = () => {
    if (isFocused || status === "focused") {
      return "border-2 border-neutral-500 shadow-[0_0_20px_rgba(255,255,255,0.05)]";
    }
    if (status === "interactive") {
      return "border border-neutral-700";
    }
    return "border border-transparent";
  };

  return (
    <div
      ref={cardRef}
      className={`${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        handleMouseLeave();
        if (isDragging) handleMouseUp();
      }}
    >
      {/* 标签 */}
      <div className="text-[12px] text-neutral-400 mb-2">图片输入</div>

      {/* 主卡片 - 使用 overflow-visible 允许弧形菜单超出边界 */}
      <div
        className={`relative w-[320px] aspect-square ${
          isDark ? "bg-[#18191c]" : "bg-white"
        } rounded-2xl flex flex-col items-center justify-center ${getBorderStyle()} transition-all duration-200 overflow-visible`}
        onMouseEnter={handleMouseEnter}
        onClick={handleClick}
      >
        {/* 右上关闭按钮 - 交互态显示 */}
        {status !== "default" && (
          <button
            className={`absolute -top-2.5 -right-2.5 w-7 h-7 ${
              isDark ? "bg-[#2a2d32] border-neutral-700" : "bg-gray-100 border-gray-300"
            } border rounded-full flex items-center justify-center ${
              isDark ? "text-neutral-400 hover:text-white" : "text-gray-500 hover:text-gray-900"
            } transition-colors z-20`}
            onClick={handleRemove}
          >
            <LucideIcon name="x" className="w-3.5 h-3.5" />
          </button>
        )}

        {/* 选择文件按钮 */}
        <button
          className={`border ${
            isDark
              ? "border-neutral-700 bg-[#1e2023] hover:border-neutral-500 text-neutral-200"
              : "border-gray-300 bg-gray-50 hover:border-gray-400 text-gray-700"
          } text-sm px-5 py-2 rounded-xl transition-all`}
          onClick={(e) => {
            e.stopPropagation();
            handleFileSelect();
          }}
        >
          选择文件
        </button>

        {/* 提示文字 */}
        <div
          className={`mt-4 text-center text-[11px] ${
            isDark ? "text-neutral-500" : "text-gray-400"
          } leading-5`}
        >
          或拖放文件到此处
          <br />
          或 Ctrl+V 粘贴
          {status === "default" && (
            <>
              <br />
              支持音频、视频、图片素材
            </>
          )}
        </div>

        {/* 弧形菜单 - 交互态显示，使用独立锚点避免加号被工具列宽度挤回卡片内部 */}
        {status === "interactive" && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            {/* 主按钮 - 加号 */}
            <button
              className={`absolute left-0 top-1/2 w-10 h-10 -translate-x-1/2 -translate-y-1/2 ${
                isDark ? "bg-[#18191c] border-neutral-500" : "bg-white border-gray-400"
              } border rounded-full flex items-center justify-center ${
                isDark ? "text-white" : "text-gray-900"
              } shadow-xl z-20`}
            >
              <LucideIcon name="plus" className="w-6 h-6" />
            </button>

            {/* 弧形图标组 */}
            <div className="absolute left-12 top-1/2 flex -translate-y-1/2 flex-col gap-2.5">
              {arcMenuTools.map((tool, index) => (
                <button
                  key={tool.id}
                  className={`w-9 h-9 ${
                    isDark
                      ? "bg-[#2a2d32] border-neutral-800 text-neutral-400 hover:text-white hover:bg-[#3a3d42]"
                      : "bg-gray-100 border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-200"
                  } border rounded-full flex items-center justify-center transition-all`}
                  style={{
                    transform: `translateX(${index === 0 || index === 3 ? 0 : 16}px)`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: 实现工具点击逻辑
                  }}
                  title={tool.label}
                >
                  <LucideIcon name={tool.icon} className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
