"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Lucide 图标组件
function LucideIcon({ name, className }: { name: string; className?: string }) {
  const iconPaths: Record<string, string> = {
    x: "M18 6L6 18M6 6l12 12",
    plus: "M12 5v14M5 12h14",
    play: "M8 5v14l11-7z",
    eye: "M12 5C7 5 2.73 8.11 1 12C2.73 15.89 7 19 12 19C17 19 21.27 15.89 23 12C21.27 8.11 17 5 12 5Z",
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
      {name === "eye" && (
        <>
          <circle
            cx="12"
            cy="12"
            r="3.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </>
      )}
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
  data?: Record<string, unknown>;
  onConnectionDragStart?: (id: string, e: React.MouseEvent) => void;
}

export function VideoResultCard({
  id,
  onRemove,
  onFocus,
  isFocused = false,
  onDragStart,
  isGenerating = false,
  onGenerationComplete,
  data,
  onConnectionDragStart,
}: VideoResultCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // 解析视频数据
  const videoData = data?.videoData as { base64?: string; mime_type?: string; file_name?: string } | undefined;

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
        return prev + 0.04; // 每80ms增加0.04%，动画更慢（约192秒完成）
      });
    }, 80);

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

  const handleConnectionHandleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onFocus?.(id);
    onConnectionDragStart?.(id, e);
  }, [id, onConnectionDragStart, onFocus]);

  const stopPropagation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <div
      ref={cardRef}
      className="group relative cursor-grab select-none"
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 标题 */}
      <div className="absolute -top-9 left-0 text-[15px] font-medium tracking-[0.16em] text-[#888888]">
        预览节点
      </div>

      {/* 卡片主体 */}
      <div
        className={`relative h-[340px] w-[540px] rounded-[14px] bg-[#161618] transition-all duration-150 ${
          isFocused
            ? "border-2 border-[#99999a] shadow-[0_0_12px_rgba(255,255,255,0.1)]"
            : "border border-[#2a2a2c] shadow-[0_20px_60px_rgba(0,0,0,0.32)]"
        }`}
        onClick={handleCardClick}
      >
        {/* 左侧输入端口 */}
        <div
          className={`absolute left-[-6px] top-1/2 h-[10px] w-[10px] -translate-y-1/2 rounded-full bg-[#606060] ${
            isFocused ? "border border-[#161618]" : ""
          }`}
        />

        {/* 内容区域 */}
        <div className="absolute inset-0 rounded-[14px] overflow-hidden">
          {isGenerating ? (
            // 生成中：显示进度
            <>
              {/* 灰白色进度填充 */}
              <div
                className="absolute inset-0 bg-gradient-to-b from-[#c4c4c8] to-[#a8a8ac]"
                style={{ clipPath: `inset(0 ${100 - progress}% 0 0)` }}
              />

              {/* 预览图标覆盖层 */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="mb-4 opacity-30"
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
              </div>

              {/* 中央播放按钮 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/35 text-white/90 shadow-lg">
                  <LucideIcon name="play" className="h-5 w-5 translate-x-[1px]" />
                </div>
              </div>
            </>
          ) : videoData?.base64 ? (
            // 有视频数据：显示视频播放器
            <div className="w-full h-full flex flex-col">
              <video
                src={videoData.base64}
                className="w-full flex-1 object-contain"
                controls
              />
            </div>
          ) : (
            // 默认状态：显示提示
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
          )}
        </div>

        {/* 右侧添加连接按钮 - hover 时显示 */}
        {isHovered && (
          <button
            type="button"
            className="absolute -right-[22px] top-1/2 z-20 flex h-[44px] w-[44px] -translate-y-1/2 items-center justify-center rounded-full border border-[#555] bg-[#161618] text-white transition-all duration-150 hover:bg-[#222]"
            onMouseDown={handleConnectionHandleMouseDown}
            onClick={stopPropagation}
            aria-label="添加连接"
          >
            <LucideIcon name="plus" className="h-6 w-6" />
          </button>
        )}

        {/* 右上角删除按钮 - hover 时显示 */}
        {isHovered && (
          <button
            type="button"
            className="absolute -right-[10px] -top-[10px] z-20 flex h-5 w-5 items-center justify-center rounded-full border border-[#444] bg-[#2a2a2b] text-[#999999] transition-all duration-150 hover:bg-[#333]"
            onClick={handleRemove}
            aria-label="删除预览节点"
          >
            <LucideIcon name="x" className="h-[10px] w-[10px]" />
          </button>
        )}
      </div>
    </div>
  );
}
