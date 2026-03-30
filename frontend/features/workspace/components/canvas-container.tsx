"use client";

import { useState, useRef, useCallback } from "react";
import { ImageInputCard } from "./image-input-card";

export interface CardItem {
  id: string;
  type: "image" | "text" | "video";
  position: { x: number; y: number };
}

interface CanvasContainerProps {
  onContextMenu: (e: React.MouseEvent) => void;
  cards: CardItem[];
  focusedCardId: string | null;
  onRemoveCard: (id: string) => void;
  onCardFocus: (id: string) => void;
  onCardMove?: (id: string, position: { x: number; y: number }) => void;
}

export function CanvasContainer({
  onContextMenu,
  cards,
  focusedCardId,
  onRemoveCard,
  onCardFocus,
  onCardMove,
}: CanvasContainerProps) {
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
    // 检查是否点击在UI元素上或卡片上
    if (
      e.target instanceof Element &&
      (e.target.closest("header") ||
        e.target.closest("aside") ||
        e.target.closest(".fixed") ||
        e.target.closest("[data-card]"))
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

  // 处理卡片拖拽
  const handleCardDrag = useCallback((cardId: string, delta: { x: number; y: number }) => {
    const card = cards.find(c => c.id === cardId);
    if (card && onCardMove) {
      onCardMove(cardId, {
        x: card.position.x + delta.x,
        y: card.position.y + delta.y,
      });
    }
  }, [cards, onCardMove]);

  return (
    <>
      {/* 画布背景层 - 有 overflow-hidden */}
      <div
        ref={containerRef}
        className={`absolute inset-0 overflow-hidden ${isDragging ? "grabbing" : "grabbable"}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onContextMenu={onContextMenu}
        onClick={(e) => {
          // 点击空白处取消聚焦
          if (
            e.target instanceof Element &&
            !e.target.closest("[data-card]")
          ) {
            // 取消聚焦逻辑由父组件处理
          }
        }}
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

      {/* 卡片渲染层 - 独立于画布容器，不受 overflow-hidden 限制 */}
      <div className="absolute inset-0 pointer-events-none overflow-visible z-10">
        {cards.map((card) => {
          if (card.type === "image") {
            return (
              <div
                key={card.id}
                data-card
                className="pointer-events-auto"
                style={{
                  position: "absolute",
                  left: offset.x + card.position.x,
                  top: offset.y + card.position.y,
                }}
              >
                <ImageInputCard
                  id={card.id}
                  onRemove={onRemoveCard}
                  onFocus={onCardFocus}
                  isFocused={focusedCardId === card.id}
                  onDrag={(delta) => handleCardDrag(card.id, delta)}
                />
              </div>
            );
          }
          return null;
        })}
      </div>
    </>
  );
}
