"use client";

/**
 * 文本卡片组件
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
 *
 * 【输入状态说明】
 * - 默认状态：textarea 为只读，显示占位符或文本内容
 * - 点击卡片进入输入状态：textarea 变为可编辑，自动聚焦
 * - 点击非文本卡片区域：退出输入状态，textarea 回到只读状态
 * ============================================================================
 */

import { useState, useRef, useCallback, useEffect } from "react";

// Lucide 图标组件
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
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={iconPaths[name] || ""} />
    </svg>
  );
}

interface TextCardProps {
  id: string;
  onRemove?: (id: string) => void;
  onFocus?: (id: string) => void;
  isFocused?: boolean;
  onDragStart?: (e: React.MouseEvent) => void;
  onConnectionDragStart?: (id: string, e: React.MouseEvent) => void;
  data?: Record<string, unknown>;
  onDataChange?: (data: Record<string, unknown>) => void;
}

export function TextCard({
  id,
  onRemove,
  onFocus,
  isFocused = false,
  onDragStart,
  onConnectionDragStart,
  data,
  onDataChange,
}: TextCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // 文本内容状态
  const [textContent, setTextContent] = useState(() => {
    if (data?.textContent && typeof data.textContent === "string") {
      return data.textContent;
    }
    return "";
  });

  // 同步外部数据
  useEffect(() => {
    if (data?.textContent && typeof data.textContent === "string") {
      setTextContent(data.textContent);
    }
  }, [data]);

  // 当 isFocused 变为 true 时，聚焦 textarea
  useEffect(() => {
    if (isFocused && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isFocused]);

  // 处理文本变化
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setTextContent(newText);
    onDataChange?.({ textContent: newText });
  }, [onDataChange]);

  // 处理拖拽开始
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // 如果正在输入状态（isFocused），不触发拖拽
    if (isFocused) {
      return;
    }
    onDragStart?.(e);
  }, [onDragStart, isFocused]);

  // 处理删除
  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.(id);
  }, [id, onRemove]);

  // 处理卡片点击 - 进入输入状态
  const handleCardClick = useCallback(() => {
    onFocus?.(id);
  }, [id, onFocus]);

  // 处理连接拖拽开始
  const handleConnectionDragStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onFocus?.(id);
    onConnectionDragStart?.(id, e);
  }, [id, onFocus, onConnectionDragStart]);

  const stopPropagation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  // 判断是否处于输入状态
  const isEditing = isFocused;

  return (
    <div
      ref={cardRef}
      className={`group ${isEditing ? "" : "cursor-grab"}`}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 顶部标题 */}
      <div className="text-[#71717a] text-[15px] font-medium tracking-wide pl-1 mb-2">
        文本节点
      </div>

      {/* 卡片主体 */}
      <div
        className={`relative w-[340px] h-[260px] bg-[#161618] rounded-xl border shadow-lg overflow-visible transition-all duration-150 ${
          isFocused
            ? "border-[#99999a] shadow-[0_0_12px_rgba(255,255,255,0.1)]"
            : "border-[#28282b]"
        }`}
        onClick={handleCardClick}
      >
        {/* 左侧连接点（输入端口） */}
        <div className="absolute -left-[5px] top-1/2 -translate-y-1/2 w-[10px] h-[10px] rounded-full bg-[#5b5b60]" />

        {/* 右上角关闭按钮 - hover/选中时显示 */}
        {(isHovered || isFocused) && (
          <button
            type="button"
            className="absolute -top-[12px] -right-[12px] w-6 h-6 rounded-full bg-[#1e1e22] border border-[#333] flex items-center justify-center text-[#71717a] shadow-sm z-10 cursor-pointer hover:text-white transition-colors"
            onClick={handleRemove}
            aria-label="删除文本节点"
          >
            <LucideIcon name="x" className="w-3 h-3" />
          </button>
        )}

        {/* 右侧连接点（输出端口） - hover/选中时显示 */}
        {(isHovered || isFocused) && (
          <button
            type="button"
            className="absolute top-1/2 -translate-y-1/2 -right-[18px] w-9 h-9 rounded-full bg-[#161618] border border-[#5b5b60] flex items-center justify-center text-white z-10 cursor-pointer shadow-md hover:bg-[#28282b] transition-colors"
            onMouseDown={handleConnectionDragStart}
            onClick={stopPropagation}
            aria-label="添加连接"
          >
            <LucideIcon name="plus" className="w-[18px] h-[18px]" />
          </button>
        )}

        {/* 文本输入区 */}
        <textarea
          ref={textareaRef}
          className={`w-full h-full p-5 bg-transparent text-[15px] font-medium resize-none outline-none ${
            isEditing ? "text-[#e4e4e7]" : "text-[#5b5b60]"
          } ${isEditing ? "cursor-text" : "cursor-default select-none pointer-events-none"}`}
          placeholder="输入文字内容..."
          value={textContent}
          onChange={handleTextChange}
          onMouseDown={stopPropagation}
          onClick={stopPropagation}
          readOnly={!isEditing}
        />
      </div>
    </div>
  );
}
