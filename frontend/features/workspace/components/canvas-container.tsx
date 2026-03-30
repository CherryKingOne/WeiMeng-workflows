"use client";

import { useState, useRef, useCallback } from "react";

interface CanvasContainerProps {
  onContextMenu: (e: React.MouseEvent) => void;
}

export function CanvasContainer({ onContextMenu }: CanvasContainerProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 画布位置状态
  const [offset, setOffset] = useState({ x: -1500, y: -1200 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });

  // 更新画布位置
  const updateCanvasPosition = useCallback((newOffset: { x: number; y: number }) => {
    setOffset(newOffset);
  }, []);

  // 鼠标按下
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // 检查是否点击在UI元素上
    if (
      e.target instanceof Element &&
      (e.target.closest("header") ||
        e.target.closest("aside") ||
        e.target.closest(".fixed"))
    ) {
      return;
    }

    // 左键拖拽
    if (e.button === 0) {
      setIsDragging(true);
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        offsetX: offset.x,
        offsetY: offset.y,
      };
      e.preventDefault();
    }
  }, [offset]);

  // 鼠标移动
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;

    const newOffsetX = e.clientX - dragStart.current.x + dragStart.current.offsetX;
    const newOffsetY = e.clientY - dragStart.current.y + dragStart.current.offsetY;

    updateCanvasPosition({ x: newOffsetX, y: newOffsetY });
  }, [isDragging, updateCanvasPosition]);

  // 鼠标释放
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 鼠标离开
  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden ${isDragging ? "grabbing" : "grabbable"}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onContextMenu={onContextMenu}
    >
      {/* 画布背景 */}
      <div
        ref={canvasRef}
        className="absolute dot-grid z-0"
        style={{
          width: "4000px",
          height: "3000px",
          left: `${offset.x}px`,
          top: `${offset.y}px`,
        }}
      />
    </div>
  );
}
