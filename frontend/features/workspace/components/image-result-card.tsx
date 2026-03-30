"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// Lucide 图标组件
function LucideIcon({ name, className }: { name: string; className?: string }) {
  const iconPaths: Record<string, string> = {
    x: "M18 6L6 18M6 6l12 12",
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

interface ImageResultCardProps {
  id: string;
  onRemove?: (id: string) => void;
  onFocus?: (id: string) => void;
  isFocused?: boolean;
  onDragStart?: (e: React.MouseEvent) => void;
  isGenerating?: boolean;
  onGenerationComplete?: () => void;
}

export function ImageResultCard({
  id,
  onRemove,
  onFocus,
  isFocused = false,
  onDragStart,
  isGenerating = false,
  onGenerationComplete,
}: ImageResultCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  // 生成进度动画
  useEffect(() => {
    if (isGenerating) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            onGenerationComplete?.();
            return 100;
          }
          return prev + 2; // 每50ms增加2%
        });
      }, 50);

      return () => clearInterval(interval);
    }
  }, [isGenerating, onGenerationComplete]);

  // 处理拖拽开始
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    onDragStart?.(e);
  }, [onDragStart]);

  // 处理删除
  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.(id);
  }, [id, onRemove]);

  // 处理卡片点击
  const handleCardClick = useCallback(() => {
    onFocus?.(id);
  }, [id, onFocus]);

  return (
    <div
      ref={cardRef}
      className="cursor-grab"
      onMouseDown={handleMouseDown}
    >
      {/* 头部标题 */}
      <div className="flex items-center gap-2 px-1 mb-2 font-medium tracking-wide pointer-events-none select-none">
        <span className="text-[#a1a1aa] text-[15px]">生成图片_1</span>
      </div>

      {/* 卡片主体 */}
      <div
        className={`relative w-[260px] h-[260px] rounded-[14px] overflow-visible ring-1 ring-white/5 shadow-2xl ${
          isFocused ? "ring-neutral-500/50" : ""
        }`}
        onClick={handleCardClick}
      >
        {/* 内容区域 - 单独设置 overflow-hidden */}
        <div className="absolute inset-0 rounded-[14px] overflow-hidden bg-[#18181b]">
          {/* 灰白色进度从左往右渲染整个卡片 */}
          <div
            className="absolute inset-0 bg-gradient-to-b from-[#c4c4c8] to-[#a8a8ac]"
            style={{
              clipPath: `inset(0 ${100 - progress}% 0 0)`,
            }}
          />

          {/* 左侧输入端口 */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center">
            {/* 白色的端口圆点 */}
            <div className="absolute left-0 -translate-x-1/2 w-[9px] h-[9px] bg-[#f4f4f5] rounded-full border-[1.5px] border-[#0b0b0e] z-10 box-content"></div>
          </div>
        </div>

        {/* 右上关闭按钮 */}
        <button
          className="absolute -top-2.5 -right-2.5 w-7 h-7 bg-[#2a2d32] border-neutral-700 border rounded-full flex items-center justify-center text-neutral-400 hover:text-white transition-colors z-20"
          onClick={handleRemove}
        >
          <LucideIcon name="x" className="w-3.5 h-3.5" />
        </button>

        {/* 生成中提示 */}
        {isGenerating && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-[#27272a]/80 backdrop-blur-sm px-3 py-1.5 rounded-full z-10">
            <span className="text-[#a1a1aa] text-xs font-medium">
              生成中 {progress}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
