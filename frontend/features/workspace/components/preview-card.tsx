"use client";

/**
 * 预览卡片组件
 *
 * ============================================================================
 * 【卡片连接点规范】
 * ============================================================================
 * 所有工作流卡片组件默认应包含以下连接点：
 *
 * 【左侧连接点】（输入端口）
 * - 样式：<div className="absolute -left-[5px] top-1/2 -translate-y-1/2 w-[9px] h-[9px] bg-[#666] rounded-full border-[1.5px] border-[#171717] z-10" />
 * - 用于接收来自其他卡片的连接线
 * - 默认情况下所有卡片都应有左侧连接点
 *
 * 【右侧连接点】（输出端口 - 带加号按钮）
 * - 样式：<button className="absolute -right-[18px] top-1/2 -translate-y-1/2 w-[36px] h-[36px] bg-[#111] border border-[#4a4a4a] rounded-full flex items-center justify-center text-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20">
 *           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
 *             <line x1="12" y1="5" x2="12" y2="19"></line>
 *             <line x1="5" y1="12" x2="19" y2="12"></line>
 *           </svg>
 *         </button>
 * - 用于创建到其他卡片的连接线
 * - 默认情况下所有卡片都应有右侧连接点
 *
 * 【特殊说明】
 * - 如果用户明确要求某个卡片不需要左侧或右侧连接点，则根据用户需求移除
 * - 移除连接点需要用户明确说明，否则默认保留
 * ============================================================================
 */

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
