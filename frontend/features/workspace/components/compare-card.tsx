"use client";

/**
 * 图片对比卡片组件
 *
 * 支持两种图片的滑动对比，中间有可拖拽的分割线
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { EditableCardName, getCardNameValue, NODE_NAME_DATA_KEY } from "./editable-card-name";

interface CompareImage {
  base64: string;
  fileName?: string;
}

interface CompareCardProps {
  id: string;
  onRemove?: (id: string) => void;
  onFocus?: (id: string) => void;
  isFocused?: boolean;
  hasOutgoingConnection?: boolean;
  onDragStart?: (e: React.MouseEvent) => void;
  onConnectionDragStart?: (cardId: string, e: React.MouseEvent) => void;
  data?: Record<string, unknown>;
  onDataChange?: (data: Record<string, unknown>) => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseCompareImage(value: unknown): CompareImage | null {
  if (!isRecord(value)) {
    return null;
  }

  if (typeof value.base64 !== "string") {
    return null;
  }

  return {
    base64: value.base64,
    fileName: typeof value.fileName === "string" ? value.fileName : undefined,
  };
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function CompareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path d="M9 18V6" strokeLinecap="round" />
      <path d="M15 18V6" strokeLinecap="round" />
      <rect x="5" y="6" width="4" height="12" rx="1" />
      <rect x="15" y="6" width="4" height="12" rx="1" />
    </svg>
  );
}

function SliderHandleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18-6-6 6-6" />
      <path d="m15 18 6-6-6-6" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v12m6-6H6" />
    </svg>
  );
}

export function CompareCard({
  id,
  onRemove,
  onFocus,
  isFocused = false,
  hasOutgoingConnection = false,
  onDragStart,
  onConnectionDragStart,
  data,
  onDataChange,
}: CompareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);

  const cardName = getCardNameValue(data, "图片对比");
  const originalImage = parseCompareImage(data?.originalImage);
  const generatedImage = parseCompareImage(data?.generatedImage);
  const hasOriginalImage = Boolean(originalImage?.base64);
  const hasGeneratedImage = Boolean(generatedImage?.base64);
  const hasImages = hasOriginalImage || hasGeneratedImage;
  const hasBothImages = hasOriginalImage && hasGeneratedImage;

  const persistData = useCallback(
    (nextData: Record<string, unknown>) => {
      onDataChange?.({
        ...(data ?? {}),
        ...nextData,
      });
    },
    [data, onDataChange]
  );

  const handleSliderMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setIsDraggingSlider(true);
      onFocus?.(id);
    },
    [id, onFocus]
  );

  useEffect(() => {
    if (!isDraggingSlider) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPosition(percentage);
    };

    const handleMouseUp = () => {
      setIsDraggingSlider(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingSlider]);

  const handleCardClick = useCallback(() => {
    onFocus?.(id);
  }, [id, onFocus]);

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onRemove?.(id);
    },
    [id, onRemove]
  );

  const handleConnectionHandleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onFocus?.(id);
      onConnectionDragStart?.(id, e);
    },
    [id, onConnectionDragStart, onFocus]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("[data-slider]")) {
        return;
      }
      onDragStart?.(e);
    },
    [onDragStart]
  );

  const stopPropagation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const showConnectionHandle = hasImages && (isHovered || isFocused);
  const connectionDotColor = hasImages ? "bg-white" : "bg-zinc-600";

  // 渲染空状态
  const renderEmptyState = () => (
    <div className="flex h-[240px] flex-col items-center justify-center">
      <CompareIcon className="mb-3 h-7 w-7 text-zinc-600" />
      <span className="text-sm font-medium text-zinc-500">连接图片以对比</span>
    </div>
  );

  // 渲染两张图片的对比状态
  const renderCompareState = () => (
    <div
      ref={containerRef}
      className="relative h-[260px] overflow-hidden rounded-[12px]"
      style={{
        backgroundColor: "#18181b",
        backgroundImage: `
          linear-gradient(45deg, #09090b 25%, transparent 25%, transparent 75%, #09090b 75%, #09090b),
          linear-gradient(45deg, #09090b 25%, transparent 25%, transparent 75%, #09090b 75%, #09090b)
        `,
        backgroundSize: "20px 20px",
        backgroundPosition: "0 0, 10px 10px",
      }}
    >
      <div className="absolute inset-2 rounded-lg overflow-hidden border border-zinc-800 bg-black">
        {/* 底层图片 (生成图 - 右侧) */}
        <img
          src={generatedImage!.base64}
          className="absolute inset-0 h-full w-full object-cover"
          alt="Generated"
          draggable={false}
        />

        {/* 顶层图片 (原始图 - 左侧) 使用 clip-path 裁切 */}
        <div
          className="absolute inset-0 h-full w-full"
          style={{
            clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
          }}
        >
          <img
            src={originalImage!.base64}
            className="absolute inset-0 h-full w-full object-cover"
            alt="Original"
            draggable={false}
          />
        </div>

        {/* 中间分割线与滑块 */}
        <div
          ref={sliderRef}
          data-slider
          className="absolute top-0 bottom-0 z-10 w-[2px] cursor-ew-resize bg-white shadow-[0_0_4px_rgba(0,0,0,0.5)]"
          style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
          onMouseDown={handleSliderMouseDown}
        >
          <div className="absolute left-1/2 top-1/2 z-10 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-zinc-800 shadow-lg">
            <SliderHandleIcon className="h-5 w-5" />
          </div>
        </div>

        {/* 左下角 Label 原始 */}
        <div className="absolute bottom-2 left-2 z-10 rounded-md border border-zinc-700/50 bg-black/80 px-2.5 py-1 text-xs font-medium text-zinc-300">
          原始
        </div>

        {/* 右下角 Button 生成 */}
        <div className="absolute bottom-2 right-2 z-10 cursor-pointer rounded-md bg-[#2563eb] px-3.5 py-1.5 text-xs font-medium text-white shadow-md transition hover:bg-blue-500">
          生成
        </div>
      </div>
    </div>
  );

  // 渲染单张图片状态
  const renderSingleImageState = () => (
    <div
      ref={containerRef}
      className="relative h-[260px] overflow-hidden rounded-[12px]"
      style={{
        backgroundColor: "#18181b",
        backgroundImage: `
          linear-gradient(45deg, #09090b 25%, transparent 25%, transparent 75%, #09090b 75%, #09090b),
          linear-gradient(45deg, #09090b 25%, transparent 25%, transparent 75%, #09090b 75%, #09090b)
        `,
        backgroundSize: "20px 20px",
        backgroundPosition: "0 0, 10px 10px",
      }}
    >
      <div className="absolute inset-2 rounded-lg overflow-hidden border border-zinc-800 bg-black">
        {/* 显示已有的图片 */}
        <img
          src={(hasOriginalImage ? originalImage : generatedImage)!.base64}
          className="absolute inset-0 h-full w-full object-cover"
          alt="Connected"
          draggable={false}
        />

        {/* 等待第二张图片的提示 */}
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/40"
          style={{
            clipPath: `inset(0 0 0 ${sliderPosition}%)`,
          }}
        >
          <div className="text-center">
            <CompareIcon className="mx-auto mb-2 h-6 w-6 text-zinc-400" />
            <span className="text-sm font-medium text-zinc-300">连接第二张图片以对比</span>
          </div>
        </div>

        {/* 中间分割线与滑块 */}
        <div
          data-slider
          className="absolute top-0 bottom-0 z-10 w-[2px] cursor-ew-resize bg-white shadow-[0_0_4px_rgba(0,0,0,0.5)]"
          style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
          onMouseDown={handleSliderMouseDown}
        >
          {/* 滑块按钮 */}
          <div className="absolute left-1/2 top-1/2 z-10 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-zinc-800 shadow-lg">
            <SliderHandleIcon className="h-5 w-5" />
          </div>
        </div>

        {/* 已有图片的标签 */}
        <div className="absolute bottom-2 left-2 z-10 rounded-md border border-zinc-700/50 bg-black/80 px-2.5 py-1 text-xs font-medium text-zinc-300">
          {hasOriginalImage ? "原始" : "生成"}
        </div>
      </div>
    </div>
  );

  return (
    <div
      ref={cardRef}
      className="group relative cursor-grab select-none"
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 标题 */}
      <div className="mb-3 flex items-center gap-2 px-1 text-gray-400">
        <div className="h-1 w-1 rounded-full bg-gray-500" />
        <EditableCardName
          value={cardName}
          defaultValue="图片对比"
          onChange={(value) => persistData({ [NODE_NAME_DATA_KEY]: value })}
          onFocus={() => onFocus?.(id)}
          className="bg-transparent text-sm text-gray-400 outline-none"
        />
      </div>

      {/* 主体框 */}
      <div
        className={`relative w-[380px] rounded-[14px] border bg-[#18181b] shadow-lg transition-all ${
          isFocused ? "border-zinc-500/80 shadow-[0_0_15px_rgba(255,255,255,0.05)]" : "border-zinc-700/60"
        }`}
        onClick={handleCardClick}
      >
        {/* 左侧输入连接点 */}
        <div className={`absolute top-1/2 -left-[6px] z-20 -translate-y-1/2 h-[12px] w-[12px] rounded-full border border-[#18181b] ${connectionDotColor}`} />

        {/* 删除按钮 */}
        {(isHovered || isFocused) && (
          <button
            type="button"
            className="absolute -right-3 -top-3 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-zinc-700 bg-[#27272a] text-zinc-400 shadow-lg transition hover:bg-zinc-600 hover:text-white"
            onClick={handleRemove}
            aria-label="删除对比节点"
          >
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        )}

        {/* 右侧连接点 */}
        {showConnectionHandle && (
          <button
            type="button"
            className="absolute -right-8 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#262626] bg-[#171717] text-gray-400 shadow-lg transition hover:text-white"
            onMouseDown={handleConnectionHandleMouseDown}
            onClick={stopPropagation}
            aria-label="添加连接"
          >
            <PlusIcon className="h-6 w-6" />
          </button>
        )}

        {!hasImages && renderEmptyState()}
        {hasBothImages && renderCompareState()}
        {hasImages && !hasBothImages && renderSingleImageState()}
      </div>
    </div>
  );
}
