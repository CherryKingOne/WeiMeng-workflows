"use client";

import { useState, useRef, useCallback } from "react";
import { useTheme } from "@/features/theme/theme-context";

// Lucide 图标组件
function LucideIcon({ name, className }: { name: string; className?: string }) {
  const iconPaths: Record<string, string> = {
    x: "M18 6L6 18M6 6l12 12",
    "chevron-right": "M9 5l7 7-7 7",
    play: "M8 5v14l11-7z",
    expand: "M4 14v6h6M20 10V4h-6M4 20l7-7M20 4l-7 7",
    check: "M5 13l4 4L19 7",
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

interface ImageGenerationCardProps {
  id: string;
  onRemove?: (id: string) => void;
  onFocus?: (id: string) => void;
  isFocused?: boolean;
  onDragStart?: (e: React.MouseEvent) => void;
  onGenerate?: (id: string) => void;
  isGenerating?: boolean;
}

export function ImageGenerationCard({
  id,
  onRemove,
  onFocus,
  isFocused = false,
  onDragStart,
  onGenerate,
  isGenerating = false,
}: ImageGenerationCardProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const cardRef = useRef<HTMLDivElement>(null);

  const [prompt, setPrompt] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [selectedModel, setSelectedModel] = useState("Nano Banana Pro");

  // 处理拖拽开始
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    onDragStart?.(e);
  }, [onDragStart]);

  // 处理删除
  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.(id);
  }, [id, onRemove]);

  // 处理生成按钮点击
  const handleGenerate = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // 触发生成回调
    onGenerate?.(id);
  }, [id, onGenerate]);

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
      <div className="flex items-center gap-2 px-1 mb-3">
        <span className="text-xl">🍌</span>
        <span className="text-[#a1a1aa] text-sm font-medium tracking-wide">生成图片</span>
      </div>

      {/* 卡片主体 */}
      <div
        className={`relative bg-[#18181b] rounded-xl border ${
          isFocused ? "border-neutral-500" : "border-[#27272a]"
        } shadow-lg flex flex-col h-[380px] w-[480px] overflow-visible`}
        onClick={handleCardClick}
      >
        {/* 左侧节点连接点 */}
        <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#52525b] border-2 border-[#18181b]"></div>

        {/* 右上关闭按钮 */}
        <button
          className="absolute -top-2.5 -right-2.5 w-7 h-7 bg-[#2a2d32] border-neutral-700 border rounded-full flex items-center justify-center text-neutral-400 hover:text-white transition-colors z-20"
          onClick={handleRemove}
        >
          <LucideIcon name="x" className="w-3.5 h-3.5" />
        </button>

        {/* 输入区域 */}
        <textarea
          className="w-full flex-1 bg-transparent border-none outline-none resize-none p-6 text-[#e4e4e7] placeholder-[#52525b] text-base"
          placeholder="输入提示词..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />

        {/* 底部控制栏 */}
        <div className="p-5 pt-0 flex flex-col gap-3">
          {/* 快捷提示词链接 */}
          <div className="flex items-center gap-1 cursor-pointer w-max group">
            <span className="text-[#e4e4e7] text-sm font-medium group-hover:text-white transition-colors">
              常用提示词库
            </span>
            <LucideIcon name="chevron-right" className="w-3.5 h-3.5 text-[#a1a1aa] group-hover:text-white transition-colors" />
          </div>

          {/* 按钮组 */}
          <div className="flex items-center gap-2.5">
            {/* 模型选择 */}
            <div className="flex-1 bg-transparent border border-[#3f3f46] rounded-md px-2.5 py-1 text-xs text-[#d4d4d8] cursor-pointer hover:bg-[#27272a] transition-colors flex items-center justify-between">
              <span>{selectedModel}</span>
              <svg className="w-3.5 h-3.5 text-[#71717a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* 参数按钮 */}
            <button className="bg-transparent border border-[#3f3f46] rounded-md px-2.5 py-1 text-xs text-[#d4d4d8] hover:bg-[#27272a] transition-colors">
              1:1
            </button>
            <button className="bg-transparent border border-[#3f3f46] rounded-md px-2.5 py-1 text-xs text-[#d4d4d8] hover:bg-[#27272a] transition-colors">
              1K
            </button>
            <button className="bg-transparent border border-[#3f3f46] rounded-md px-2.5 py-1 text-xs text-[#d4d4d8] hover:bg-[#27272a] transition-colors">
              1张
            </button>
            <button className="bg-transparent border border-[#3f3f46] rounded-md px-2.5 py-1 text-xs text-[#d4d4d8] hover:bg-[#27272a] transition-colors">
              异步
            </button>

            {/* 播放/生成按钮 */}
            <button
              className={`bg-transparent border border-[#3f3f46] rounded-md p-1 text-[#d4d4d8] hover:bg-white hover:text-black transition-colors flex items-center justify-center group ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="生成图片"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>

            {/* 展开按钮 */}
            <button className="text-[#71717a] hover:text-[#d4d4d8] transition-colors ml-1">
              <LucideIcon name="expand" className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 成功提示 Toast */}
        {showToast && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#27272a]/90 backdrop-blur-sm border border-[#3f3f46] text-[#e4e4e7] px-4 py-2.5 rounded-lg shadow-2xl flex items-center gap-2.5 z-10">
            <div className="bg-[#10b981]/20 p-1 rounded-full">
              <LucideIcon name="check" className="w-3.5 h-3.5 text-[#10b981]" />
            </div>
            <span className="text-sm font-medium tracking-wide">参数已存储并加入队列</span>
          </div>
        )}
      </div>
    </div>
  );
}
