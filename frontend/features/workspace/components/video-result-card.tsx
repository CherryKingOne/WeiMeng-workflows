"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function LucideIcon({ name, className }: { name: string; className?: string }) {
  const iconPaths: Record<string, string> = {
    x: "M18 6L6 18M6 6l12 12",
    play: "M8 5v14l11-7z",
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

interface VideoResultCardProps {
  id: string;
  onRemove?: (id: string) => void;
  onFocus?: (id: string) => void;
  isFocused?: boolean;
  onDragStart?: (e: React.MouseEvent) => void;
  isGenerating?: boolean;
  onGenerationComplete?: () => void;
}

export function VideoResultCard({
  id,
  onRemove,
  onFocus,
  isFocused = false,
  onDragStart,
  isGenerating = false,
  onGenerationComplete,
}: VideoResultCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isGenerating) {
      return;
    }

    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          onGenerationComplete?.();
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isGenerating, onGenerationComplete]);

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

  return (
    <div
      ref={cardRef}
      className="cursor-grab"
      onMouseDown={handleMouseDown}
    >
      <div className="flex items-center gap-2 px-1 mb-2 font-medium tracking-wide pointer-events-none select-none">
        <span className="text-[#a1a1aa] text-[15px]">生成视频_1</span>
      </div>

      <div
        className={`relative w-[320px] h-[180px] rounded-[16px] overflow-visible ring-1 ring-white/5 shadow-2xl ${
          isFocused ? "ring-neutral-500/50" : ""
        }`}
        onClick={handleCardClick}
      >
        <div className="absolute inset-0 rounded-[16px] overflow-hidden bg-[#111114]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#404552_0%,#17171c_52%,#0d0d11_100%)]" />
          <div
            className="absolute inset-0 bg-gradient-to-r from-[#8b5cf6]/35 via-[#22d3ee]/20 to-[#34d399]/30 transition-[clip-path]"
            style={{ clipPath: `inset(0 ${100 - progress}% 0 0)` }}
          />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center">
            <div className="absolute left-0 -translate-x-1/2 w-[9px] h-[9px] bg-[#f4f4f5] rounded-full border-[1.5px] border-[#0b0b0e] z-10 box-content" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/35 text-white/90 shadow-lg">
              <LucideIcon name="play" className="h-5 w-5 translate-x-[1px]" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/55 to-transparent" />
          <div className="absolute left-4 bottom-3 text-[13px] font-medium tracking-wide text-[#e4e4e7]">
            视频输出
          </div>
        </div>

        <button
          className="absolute -top-2.5 -right-2.5 w-7 h-7 bg-[#2a2d32] border-neutral-700 border rounded-full flex items-center justify-center text-neutral-400 hover:text-white transition-colors z-20"
          onClick={handleRemove}
        >
          <LucideIcon name="x" className="w-3.5 h-3.5" />
        </button>

        {isGenerating && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-[#27272a]/80 backdrop-blur-sm px-3 py-1.5 rounded-full z-10">
            <span className="text-[#a1a1aa] text-xs font-medium">
              转视频中 {progress}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
