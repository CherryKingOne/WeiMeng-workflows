"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// Lucide 图标组件
function LucideIcon({ name, className }: { name: string; className?: string }) {
  const iconPaths: Record<string, string> = {
    x: "M18 6L6 18M6 6l12 12",
    sparkles: "M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z",
    "chevron-right": "M9 5l7 7-7 7",
    play: "M8 5v14l11-7z",
    expand: "M4 14v6h6M20 10V4h-6M4 20l7-7M20 4l-7 7",
    plus: "M12 5v14M5 12h14",
  };

  return (
    <svg
      className={className}
      fill={name === "play" ? "currentColor" : "none"}
      stroke={name === "play" ? "none" : "currentColor"}
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
  onConnectionDragStart?: (id: string, e: React.MouseEvent) => void;
  onGenerate?: (id: string) => void;
  isGenerating?: boolean;
  data?: Record<string, unknown>;
  onDataChange?: (data: Record<string, unknown>) => void;
}

export function ImageGenerationCard({
  id,
  onRemove,
  onFocus,
  isFocused = false,
  onDragStart,
  onConnectionDragStart,
  onGenerate,
  isGenerating = false,
  data,
  onDataChange,
}: ImageGenerationCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("Qwen Image Edit");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isCollapsedEditorOpen, setIsCollapsedEditorOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setPrompt(typeof data?.prompt === "string" ? data.prompt : "");
    setSelectedModel(typeof data?.selectedModel === "string" ? data.selectedModel : "Qwen Image Edit");
    setIsCollapsed(Boolean(data?.isCollapsed));
    setIsCollapsedEditorOpen(Boolean(data?.isCollapsedEditorOpen));
  }, [data]);

  const syncCardData = useCallback((next: {
    prompt?: string;
    selectedModel?: string;
    isCollapsed?: boolean;
    isCollapsedEditorOpen?: boolean;
  }) => {
    onDataChange?.({
      prompt: next.prompt ?? prompt,
      selectedModel: next.selectedModel ?? selectedModel,
      isCollapsed: next.isCollapsed ?? isCollapsed,
      isCollapsedEditorOpen: next.isCollapsedEditorOpen ?? isCollapsedEditorOpen,
    });
  }, [isCollapsed, isCollapsedEditorOpen, onDataChange, prompt, selectedModel]);

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
    onFocus?.(id);
    onGenerate?.(id);
  }, [id, onFocus, onGenerate]);

  // 处理卡片点击
  const handleCardClick = useCallback(() => {
    onFocus?.(id);
  }, [id, onFocus]);

  const handleToggleCollapsed = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onFocus?.(id);
    setIsCollapsed((prev) => {
      const next = !prev;
      const nextCollapsedEditorOpen = next ? false : isCollapsedEditorOpen;
      setIsCollapsedEditorOpen(nextCollapsedEditorOpen);
      syncCardData({
        isCollapsed: next,
        isCollapsedEditorOpen: nextCollapsedEditorOpen,
      });
      return next;
    });
  }, [id, isCollapsedEditorOpen, onFocus, syncCardData]);

  const handleToggleCollapsedEditor = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onFocus?.(id);
    setIsCollapsedEditorOpen((prev) => {
      const next = !prev;
      syncCardData({ isCollapsedEditorOpen: next });
      return next;
    });
  }, [id, onFocus, syncCardData]);

  const handlePromptChange = useCallback((nextPrompt: string) => {
    setPrompt(nextPrompt);
    syncCardData({ prompt: nextPrompt });
  }, [syncCardData]);

  const handleUtilityButtonClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onFocus?.(id);
  }, [id, onFocus]);

  const handleConnectionHandleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onFocus?.(id);
    onConnectionDragStart?.(id, e);
  }, [id, onConnectionDragStart, onFocus]);

  const stopPropagation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const chipButtonClass = "rounded-lg border border-white/10 bg-[#18181b] px-4 py-2 text-sm text-gray-300 transition hover:bg-white/5";
  const compactChipButtonClass = "rounded-lg border border-white/10 bg-[#18181b] px-4 py-2 text-sm text-gray-300 transition hover:bg-white/5";
  const showCollapsedEditor = isCollapsed && isCollapsedEditorOpen;

  return (
    <div
      ref={cardRef}
      className="group cursor-grab"
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-2 px-1 mb-3">
        <LucideIcon name="sparkles" className="w-4 h-4 text-[#a1a1aa]" />
        <span className="text-[#a1a1aa] text-sm font-medium tracking-wide">生成图片</span>
      </div>

      {!isCollapsed ? (
        <div
          className="relative flex h-[392px] w-[520px] flex-col justify-between overflow-visible rounded-2xl border border-white/10 bg-[#18181b] p-4 shadow-2xl"
          onClick={handleCardClick}
        >
          <div className="absolute -left-[5px] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-gray-500" />

          {isHovered && (
            <>
              <button
                type="button"
                className="absolute -right-[10px] -top-[10px] z-10 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-[#27272a] text-gray-400 transition hover:bg-gray-700 hover:text-white"
                onMouseDown={stopPropagation}
                onClick={handleRemove}
                aria-label="关闭生成图片卡片"
              >
                <LucideIcon name="x" className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                className="absolute -right-[24px] top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-[#18181b] text-white shadow-lg transition hover:bg-[#27272a]"
                onMouseDown={handleConnectionHandleMouseDown}
                onClick={stopPropagation}
                aria-label="添加连接"
              >
                <LucideIcon name="plus" className="h-6 w-6" />
              </button>
            </>
          )}

          <textarea
            className="w-full flex-1 resize-none border-none bg-transparent px-3 pt-4 text-[17px] font-light tracking-wide text-gray-300 outline-none placeholder:text-gray-500"
            placeholder="输入提示词..."
            value={prompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            onMouseDown={stopPropagation}
            onClick={stopPropagation}
            onFocus={() => onFocus?.(id)}
          />

          <div className="flex flex-col gap-3">
            <div
              className="group flex w-max cursor-pointer items-center gap-1"
              onMouseDown={stopPropagation}
              onClick={handleUtilityButtonClick}
            >
              <span className="text-sm font-medium text-[#e4e4e7] transition group-hover:text-white">
                常用提示词库
              </span>
              <LucideIcon
                name="chevron-right"
                className="h-3.5 w-3.5 text-[#a1a1aa] transition group-hover:text-white"
              />
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                className="flex flex-1 items-center justify-between rounded-lg border border-white/10 bg-[#121214] px-4 py-2 text-sm text-gray-200"
                onMouseDown={stopPropagation}
                onClick={handleUtilityButtonClick}
              >
                <span>{selectedModel}</span>
                <svg className="h-3.5 w-3.5 text-[#71717a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button type="button" className={chipButtonClass} onMouseDown={stopPropagation} onClick={handleUtilityButtonClick}>1:1</button>
              <button type="button" className={chipButtonClass} onMouseDown={stopPropagation} onClick={handleUtilityButtonClick}>1K</button>
              <button type="button" className={chipButtonClass} onMouseDown={stopPropagation} onClick={handleUtilityButtonClick}>异步</button>
              <button
                type="button"
                className={`flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#18181b] text-white transition hover:bg-white/5 ${isGenerating ? "cursor-not-allowed opacity-50" : ""}`}
                onMouseDown={stopPropagation}
                onClick={handleGenerate}
                disabled={isGenerating}
                title="生成图片"
              >
                <LucideIcon name="play" className="h-3.5 w-3.5 fill-current stroke-none" />
              </button>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center text-gray-500 transition hover:text-gray-300"
                onMouseDown={stopPropagation}
                onClick={handleToggleCollapsed}
                title="收起卡片"
              >
                <LucideIcon name="expand" className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative flex w-[520px] flex-col gap-2" onClick={handleCardClick}>
          <div className="absolute -left-[5px] top-8 z-20 h-2.5 w-2.5 rounded-full bg-gray-500" />

          <div className="relative z-10 flex flex-col rounded-2xl border border-white/10 bg-[#18181b] p-3 shadow-xl">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                className="flex flex-1 items-center rounded-lg border border-white/10 bg-[#121214] px-4 py-2 text-sm text-gray-200"
                onMouseDown={stopPropagation}
                onClick={handleUtilityButtonClick}
              >
                {selectedModel}
              </button>
              <button type="button" className={compactChipButtonClass} onMouseDown={stopPropagation} onClick={handleUtilityButtonClick}>1:1</button>
              <button type="button" className={compactChipButtonClass} onMouseDown={stopPropagation} onClick={handleUtilityButtonClick}>1K</button>
              <button
                type="button"
                className={`flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#18181b] text-white transition hover:bg-white/5 ${isGenerating ? "cursor-not-allowed opacity-50" : ""}`}
                onMouseDown={stopPropagation}
                onClick={handleGenerate}
                disabled={isGenerating}
                title="生成图片"
              >
                <LucideIcon name="play" className="h-3.5 w-3.5 fill-current stroke-none" />
              </button>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center text-gray-500 transition hover:text-gray-300"
                onMouseDown={stopPropagation}
                onClick={handleToggleCollapsed}
                title="展开卡片"
              >
                <LucideIcon name="expand" className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="mt-2 flex w-full justify-center">
              <button
                type="button"
                className="flex items-center justify-center"
                onMouseDown={stopPropagation}
                onClick={handleToggleCollapsedEditor}
                title={showCollapsedEditor ? "收起输入面板" : "展开输入面板"}
              >
                <div
                  className={`rounded-full transition-all ${
                    showCollapsedEditor
                      ? "h-1 w-12 bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.6)]"
                      : "h-1 w-10 bg-[#3f3f46]"
                  }`}
                />
              </button>
            </div>
          </div>

          {showCollapsedEditor && (
            <div className="relative h-[148px] w-full rounded-2xl border border-white/10 bg-[#18181b] p-2 shadow-xl">
              <div className="flex h-full w-full rounded-xl border border-blue-900/50 bg-[#161619] p-4 ring-1 ring-blue-500/20 shadow-[inset_0_0_20px_rgba(37,99,235,0.05)]">
                <textarea
                  className="h-full w-full resize-none border-none bg-transparent text-[17px] font-light tracking-wide text-gray-300 outline-none placeholder:text-gray-500"
                  placeholder="输入提示词..."
                  value={prompt}
                  onChange={(e) => handlePromptChange(e.target.value)}
                  onMouseDown={stopPropagation}
                  onClick={stopPropagation}
                  onFocus={() => onFocus?.(id)}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
