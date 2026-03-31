"use client";

import { useCallback, useRef } from "react";

function LucideIcon({ name, className }: { name: string; className?: string }) {
  const iconPaths: Record<string, string> = {
    x: "M18 6L6 18M6 6l12 12",
    plus: "M12 5v14M5 12h14",
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

interface PreviewCardProps {
  id: string;
  onRemove?: (id: string) => void;
  onFocus?: (id: string) => void;
  isFocused?: boolean;
  onDragStart?: (e: React.MouseEvent) => void;
}

export function PreviewCard({
  id,
  onRemove,
  onFocus,
  isFocused = false,
  onDragStart,
}: PreviewCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    onDragStart?.(e);
  }, [onDragStart]);

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.(id);
  }, [id, onRemove]);

  const handleCardClick = useCallback(() => {
    onFocus?.(id);
  }, [id, onFocus]);

  const handleUtilityButtonClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onFocus?.(id);
  }, [id, onFocus]);

  return (
    <div
      ref={cardRef}
      className="group relative cursor-grab select-none"
      onMouseDown={handleMouseDown}
    >
      <div className="absolute -top-9 left-0 text-[15px] font-medium tracking-[0.16em] text-[#888888]">
        预览节点
      </div>

      <div
        className={`relative h-[340px] w-[540px] rounded-[14px] bg-[#161618] transition-all duration-150 ${
          isFocused
            ? "border-2 border-[#99999a] shadow-[0_0_12px_rgba(255,255,255,0.1)]"
            : "border border-[#2a2a2c] shadow-[0_20px_60px_rgba(0,0,0,0.32)]"
        }`}
        onClick={handleCardClick}
      >
        <div
          className={`absolute left-[-6px] top-1/2 h-[10px] w-[10px] -translate-y-1/2 rounded-full bg-[#606060] ${
            isFocused ? "border border-[#161618]" : ""
          }`}
        />

        <div className="flex h-full flex-col items-center justify-center px-8 text-center">
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="mb-4"
            aria-hidden="true"
          >
            <path
              d="M12 5C7 5 2.73 8.11 1 12C2.73 15.89 7 19 12 19C17 19 21.27 15.89 23 12C21.27 8.11 17 5 12 5Z"
              stroke="#4a4a4c"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx="12"
              cy="12"
              r="3.5"
              stroke="#4a4a4c"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="12" r="1.5" fill="#4a4a4c" />
          </svg>

          <p className="text-[15px] font-normal tracking-[0.05em] text-[#999999]">
            连接 AI 绘图 / AI 视频 / 可灵动作迁移 节点
          </p>

          <p className="mt-3 text-[13px] tracking-[0.05em] text-[#666666]">
            或从历史记录发送到此处进行预览
          </p>
        </div>

        <button
          type="button"
          className="absolute -right-[22px] top-1/2 z-20 flex h-[44px] w-[44px] -translate-y-1/2 items-center justify-center rounded-full border border-[#555] bg-[#161618] text-white opacity-0 transition-all duration-150 group-hover:opacity-100 hover:bg-[#222]"
          onClick={handleUtilityButtonClick}
          aria-label="添加连接"
        >
          <LucideIcon name="plus" className="h-6 w-6" />
        </button>

        <button
          type="button"
          className="absolute -right-[10px] -top-[10px] z-20 flex h-5 w-5 items-center justify-center rounded-full border border-[#444] bg-[#2a2a2b] text-[#999999] opacity-0 transition-all duration-150 group-hover:opacity-100 hover:bg-[#333]"
          onClick={handleRemove}
          aria-label="删除预览节点"
        >
          <LucideIcon name="x" className="h-[10px] w-[10px]" />
        </button>
      </div>
    </div>
  );
}
