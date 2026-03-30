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

// 渐变 Logo 图标
function GradientLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" fill="url(#videoLogoGradient)"/>
      <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22" fill="#00FF9D" style={{ mixBlendMode: "color-dodge" }}/>
      <path d="M22 12C22 6.48 17.52 2 12 2" fill="#7B61FF" style={{ mixBlendMode: "color-dodge" }}/>
      <path d="M12 22C17.52 22 22 17.52 22 12" fill="#00E0FF" style={{ mixBlendMode: "color-dodge" }}/>
      <defs>
        <linearGradient id="videoLogoGradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7B61FF"/>
          <stop offset="0.5" stopColor="#00E0FF"/>
          <stop offset="1" stopColor="#00FF9D"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

interface VideoGenerationCardProps {
  id: string;
  onRemove?: (id: string) => void;
  onFocus?: (id: string) => void;
  isFocused?: boolean;
  onDragStart?: (e: React.MouseEvent) => void;
  onGenerate?: (id: string) => void;
  isGenerating?: boolean;
}

export function VideoGenerationCard({
  id,
  onRemove,
  onFocus,
  isFocused = false,
  onDragStart,
  onGenerate,
  isGenerating = false,
}: VideoGenerationCardProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const cardRef = useRef<HTMLDivElement>(null);

  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("Seedance 1.0 lite (文生)");
  const [selectedRatio, setSelectedRatio] = useState("16:9");
  const [selectedDuration, setSelectedDuration] = useState("5s");
  const [selectedResolution, setSelectedResolution] = useState("1080P");

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
        <GradientLogo />
        <span className="text-[#a1a1aa] text-[15px] font-medium tracking-wide">生成视频</span>
      </div>

      {/* 卡片主体 */}
      <div
        className={`relative bg-[#171717] rounded-xl border ${
          isFocused ? "border-neutral-500" : "border-[#27272a]"
        } shadow-2xl flex flex-col h-[420px] w-[540px] overflow-visible`}
        onClick={handleCardClick}
      >
        {/* 左侧节点连接点 */}
        <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-[9px] h-[9px] rounded-full bg-[#52525b] border-2 border-[#171717]"></div>

        {/* 右上关闭按钮 */}
        <button
          className="absolute -top-2.5 -right-2.5 w-7 h-7 bg-[#2a2d32] border-neutral-700 border rounded-full flex items-center justify-center text-neutral-400 hover:text-white transition-colors z-20"
          onClick={handleRemove}
        >
          <LucideIcon name="x" className="w-3.5 h-3.5" />
        </button>

        {/* 输入区域 */}
        <textarea
          className="w-full flex-1 bg-transparent border-none outline-none resize-none p-5 text-[#e4e4e7] placeholder-[#71717a] text-[15px] leading-relaxed"
          placeholder="输入提示词..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />

        {/* 底部工具栏 */}
        <div className="flex items-center gap-2 px-5 pb-5 select-none">
          {/* 模型选择框 */}
          <button className="h-8 px-3 border border-[#3f3f46] rounded-md text-[13px] text-[#d4d4d8] bg-transparent hover:bg-[#27272a] transition-colors flex items-center justify-between w-[200px]">
            <span className="truncate">{selectedModel}</span>
            <svg className="w-3.5 h-3.5 text-[#71717a] ml-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* 比例选择 */}
          <button className="h-8 px-3 border border-[#3f3f46] rounded-md text-[13px] text-[#d4d4d8] bg-transparent hover:bg-[#27272a] transition-colors flex items-center justify-center">
            {selectedRatio}
          </button>

          {/* 时长选择 */}
          <button className="h-8 px-3 border border-[#3f3f46] rounded-md text-[13px] text-[#d4d4d8] bg-transparent hover:bg-[#27272a] transition-colors flex items-center justify-center">
            {selectedDuration}
          </button>

          {/* 分辨率选择 */}
          <button className="h-8 px-3 border border-[#3f3f46] rounded-md text-[13px] text-[#d4d4d8] bg-transparent hover:bg-[#27272a] transition-colors flex items-center justify-center">
            {selectedResolution}
          </button>

          {/* 播放按钮 */}
          <button
            className={`h-8 w-8 border border-[#3f3f46] rounded-md text-[#d4d4d8] bg-transparent hover:bg-[#27272a] transition-colors flex items-center justify-center ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="生成视频"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="translate-x-[1px]">
              <path d="M6 4L20 12L6 20V4Z" />
            </svg>
          </button>

          {/* 全屏/展开按钮 */}
          <button className="h-8 w-7 text-[#71717a] hover:text-[#d4d4d8] bg-transparent transition-colors flex items-center justify-center ml-1">
            <LucideIcon name="expand" className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
