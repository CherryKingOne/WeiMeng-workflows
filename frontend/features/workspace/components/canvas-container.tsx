"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { ImageInputCard } from "./image-input-card";
import { ImageGenerationCard } from "./image-generation-card";
import { ImageResultCard } from "./image-result-card";
import { VideoGenerationCard } from "./video-generation-card";
import { VideoResultCard } from "./video-result-card";
import { PreviewCard } from "./preview-card";
import { StoryboardCard } from "./storyboard-card";

const IMAGE_INPUT_CARD_WIDTH = 320;
const IMAGE_INPUT_CARD_HEIGHT = 320;
const IMAGE_INPUT_CARD_HEADER_OFFSET = 24;
const IMAGE_GENERATION_CARD_WIDTH = 520;
const IMAGE_GENERATION_CARD_HEIGHT = 392;
const IMAGE_GENERATION_CARD_HEADER_OFFSET = 28;
const IMAGE_RESULT_CARD_WIDTH = 540;
const IMAGE_RESULT_CARD_HEIGHT = 340;
const IMAGE_RESULT_CARD_HEADER_OFFSET = 36;
const VIDEO_GENERATION_CARD_WIDTH = 540;
const VIDEO_GENERATION_CARD_HEIGHT = 420;
const VIDEO_GENERATION_CARD_HEADER_OFFSET = 40;
const VIDEO_RESULT_CARD_WIDTH = 540;
const VIDEO_RESULT_CARD_HEIGHT = 340;
const VIDEO_RESULT_CARD_HEADER_OFFSET = 36;
const PREVIEW_CARD_WIDTH = 540;
const PREVIEW_CARD_HEIGHT = 340;
const PREVIEW_CARD_HEADER_OFFSET = 0;
const STORYBOARD_CARD_WIDTH = 820;
const STORYBOARD_CARD_HEIGHT = 420;
const STORYBOARD_CARD_HEADER_OFFSET = 24;

export interface CardItem {
  id: string;
  type: "image" | "text" | "video" | "video-generation" | "image-generation" | "image-result" | "video-result" | "preview" | "storyboard-form";
  position: { x: number; y: number };
  data?: Record<string, unknown>;
  // 连接关系：此卡片连接到哪个卡片
  connectedTo?: string;
  // 是否正在生成中
  isGenerating?: boolean;
}

// 连接线配置
export interface Connection {
  fromId: string;
  toId: string;
}

interface CanvasContainerProps {
  onContextMenu: (e: React.MouseEvent) => void;
  onCanvasBlur?: () => void;
  cards: CardItem[];
  focusedCardId: string | null;
  onRemoveCard: (id: string) => void;
  onCardFocus: (id: string) => void;
  onCardDataChange?: (id: string, data: Record<string, unknown>) => void;
  onCardMove?: (id: string, position: { x: number; y: number }) => void;
  onAddConnectedCard?: (parentId: string, type: string, position: { x: number; y: number }) => void;
  onAddConnection?: (fromId: string, toId: string) => void;
  connections?: Connection[];
  generatingCards?: Set<string>;
  onGenerationComplete?: (resultCardId: string) => void;
  onGenerate?: (generationCardId: string) => void;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
}

export function CanvasContainer({
  onContextMenu,
  onCanvasBlur,
  cards,
  focusedCardId,
  onRemoveCard,
  onCardFocus,
  onCardDataChange,
  onCardMove,
  onAddConnectedCard,
  onAddConnection,
  connections = [],
  generatingCards = new Set(),
  onGenerationComplete,
  onGenerate,
  zoom: externalZoom = 90,
  onZoomChange,
}: CanvasContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardElementRefs = useRef(new Map<string, HTMLDivElement>());
  const connectionPathRefs = useRef(new Map<string, SVGPathElement>());

  // 画布位置状态
  const [offset, setOffset] = useState({ x: -1500, y: -1200 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  
  // 缩放状态 (10% - 200%)
  const scale = externalZoom / 100;

  // 卡片拖拽状态 - 使用 ref 避免频繁重新渲染
  const cardDragState = useRef<{
    isDragging: boolean;
    cardId: string | null;
    startX: number;
    startY: number;
    cardStartX: number;
    cardStartY: number;
    currentPosition: { x: number; y: number };
    pendingPosition: { x: number; y: number } | null;
    animationFrameId: number | null;
  }>({
    isDragging: false,
    cardId: null,
    startX: 0,
    startY: 0,
    cardStartX: 0,
    cardStartY: 0,
    currentPosition: { x: 0, y: 0 },
    pendingPosition: null,
    animationFrameId: null,
  });

  const [connectionDraft, setConnectionDraft] = useState<{
    fromId: string;
    currentX: number;
    currentY: number;
  } | null>(null);
  const [connectionTargetId, setConnectionTargetId] = useState<string | null>(null);

  // SVG 连接线 ref
  const svgRef = useRef<SVGSVGElement>(null);

  // 处理滚轮缩放 - 以鼠标位置为中心缩放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    // 检查是否在卡片上滚动，如果是则不缩放
    if (e.target instanceof Element && e.target.closest("[data-card]")) {
      return;
    }

    e.preventDefault();
    
    // 计算新的缩放值
    const delta = e.deltaY > 0 ? -5 : 5; // 每次滚动调整 5%
    const newZoom = Math.max(10, Math.min(200, externalZoom + delta));
    const newScale = newZoom / 100;
    const oldScale = scale;
    
    // 以鼠标位置为中心缩放
    // 鼠标在屏幕上的位置
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    // 计算鼠标在画布坐标系中的位置（缩放前）
    const mouseCanvasX = (mouseX - offset.x) / oldScale;
    const mouseCanvasY = (mouseY - offset.y) / oldScale;
    
    // 计算新的偏移量，使鼠标位置在画布坐标系中保持不变
    const newOffsetX = mouseX - mouseCanvasX * newScale;
    const newOffsetY = mouseY - mouseCanvasY * newScale;
    
    // 更新偏移量
    setOffset({ x: newOffsetX, y: newOffsetY });
    
    // 更新缩放值
    if (onZoomChange) {
      onZoomChange(newZoom);
    }
  }, [externalZoom, onZoomChange, offset, scale]);

  const getCardDimensions = useCallback((type: CardItem["type"]) => {
    switch (type) {
      case "image":
        return {
          width: IMAGE_INPUT_CARD_WIDTH,
          height: IMAGE_INPUT_CARD_HEIGHT,
          headerOffset: IMAGE_INPUT_CARD_HEADER_OFFSET,
        };
      case "image-generation":
        return {
          width: IMAGE_GENERATION_CARD_WIDTH,
          height: IMAGE_GENERATION_CARD_HEIGHT,
          headerOffset: IMAGE_GENERATION_CARD_HEADER_OFFSET,
        };
      case "image-result":
        return {
          width: IMAGE_RESULT_CARD_WIDTH,
          height: IMAGE_RESULT_CARD_HEIGHT,
          headerOffset: IMAGE_RESULT_CARD_HEADER_OFFSET,
        };
      case "video-generation":
        return {
          width: VIDEO_GENERATION_CARD_WIDTH,
          height: VIDEO_GENERATION_CARD_HEIGHT,
          headerOffset: VIDEO_GENERATION_CARD_HEADER_OFFSET,
        };
      case "video-result":
        return {
          width: VIDEO_RESULT_CARD_WIDTH,
          height: VIDEO_RESULT_CARD_HEIGHT,
          headerOffset: VIDEO_RESULT_CARD_HEADER_OFFSET,
        };
      case "preview":
        return {
          width: PREVIEW_CARD_WIDTH,
          height: PREVIEW_CARD_HEIGHT,
          headerOffset: PREVIEW_CARD_HEADER_OFFSET,
        };
      case "storyboard-form":
        return {
          width: STORYBOARD_CARD_WIDTH,
          height: STORYBOARD_CARD_HEIGHT,
          headerOffset: STORYBOARD_CARD_HEADER_OFFSET,
        };
      default:
        return null;
    }
  }, []);

  const getAnchorPosition = useCallback((card: CardItem, position: { x: number; y: number }, side: "input" | "output") => {
    const dimensions = getCardDimensions(card.type);
    if (!dimensions) {
      return null;
    }

    return {
      x: offset.x + (position.x + (side === "output" ? dimensions.width : 0)) * scale,
      y: offset.y + (position.y + dimensions.headerOffset + dimensions.height / 2) * scale,
    };
  }, [getCardDimensions, offset.x, offset.y, scale]);

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

  // 处理卡片拖拽开始
  const handleCardDragStart = useCallback((cardId: string, e: React.MouseEvent) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    
    e.stopPropagation();
    
    cardDragState.current = {
      isDragging: true,
      cardId,
      startX: e.clientX,
      startY: e.clientY,
      cardStartX: card.position.x,
      cardStartY: card.position.y,
      currentPosition: { x: card.position.x, y: card.position.y },
      pendingPosition: { x: card.position.x, y: card.position.y },
      animationFrameId: null,
    };
  }, [cards]);

  // 实时更新连接线
  const updateConnectionsForCard = useCallback((cardId: string, newX: number, newY: number) => {
    if (!svgRef.current) return;
    
    // 找到与这个卡片相关的所有连接
    connections.forEach((connection) => {
      const isFromCard = connection.fromId === cardId;
      const isToCard = connection.toId === cardId;
      
      if (!isFromCard && !isToCard) return;
      
      const otherCardId = isFromCard ? connection.toId : connection.fromId;
      const otherCard = cards.find(c => c.id === otherCardId);
      const currentCard = cards.find(c => c.id === cardId);
      
      if (!otherCard || !currentCard) return;
      
      const movedCardAnchor = getAnchorPosition(
        currentCard,
        { x: newX, y: newY },
        isFromCard ? "output" : "input"
      );
      const otherCardAnchor = getAnchorPosition(
        otherCard,
        otherCard.position,
        isFromCard ? "input" : "output"
      );

      if (!movedCardAnchor || !otherCardAnchor) {
        return;
      }

      const fromX = isFromCard ? movedCardAnchor.x : otherCardAnchor.x;
      const fromY = isFromCard ? movedCardAnchor.y : otherCardAnchor.y;
      const toX = isFromCard ? otherCardAnchor.x : movedCardAnchor.x;
      const toY = isFromCard ? otherCardAnchor.y : movedCardAnchor.y;
      
      // 生成贝塞尔曲线路径
      const dx = toX - fromX;
      const controlOffset = Math.min(Math.abs(dx) * 0.5, 100);
      const path = `M ${fromX} ${fromY} C ${fromX + controlOffset} ${fromY}, ${toX - controlOffset} ${toY}, ${toX} ${toY}`;
      
      const connectionKey = `${connection.fromId}-${connection.toId}`;
      const pathElement = connectionPathRefs.current.get(connectionKey);
      
      if (pathElement) {
        pathElement.setAttribute("d", path);
      }
    });
  }, [connections, cards, getAnchorPosition]);

  // 处理卡片拖拽移动 - 使用全局事件和 requestAnimationFrame
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      const state = cardDragState.current;
      if (!state.isDragging || !state.cardId) return;

      const deltaX = (e.clientX - state.startX) / scale;
      const deltaY = (e.clientY - state.startY) / scale;
      const newX = state.cardStartX + deltaX;
      const newY = state.cardStartY + deltaY;

      state.pendingPosition = { x: newX, y: newY };

      if (state.animationFrameId !== null) {
        return;
      }

      state.animationFrameId = window.requestAnimationFrame(() => {
        const currentState = cardDragState.current;
        currentState.animationFrameId = null;

        if (!currentState.isDragging || !currentState.cardId || !currentState.pendingPosition) {
          return;
        }

        const cardElement = cardElementRefs.current.get(currentState.cardId);
        if (cardElement) {
          cardElement.style.left = `${offset.x + currentState.pendingPosition.x * scale}px`;
          cardElement.style.top = `${offset.y + currentState.pendingPosition.y * scale}px`;
        }

        currentState.currentPosition = currentState.pendingPosition;
        updateConnectionsForCard(
          currentState.cardId,
          currentState.pendingPosition.x,
          currentState.pendingPosition.y
        );
      });
    };

    const handleGlobalMouseUp = () => {
      const state = cardDragState.current;

      if (state.animationFrameId !== null) {
        window.cancelAnimationFrame(state.animationFrameId);
      }

      if (state.isDragging && state.cardId) {
        // 拖拽结束时，更新 React 状态
        onCardMove?.(state.cardId, state.pendingPosition ?? state.currentPosition);
      }
      
      cardDragState.current = {
        isDragging: false,
        cardId: null,
        startX: 0,
        startY: 0,
        cardStartX: 0,
        cardStartY: 0,
        currentPosition: { x: 0, y: 0 },
        pendingPosition: null,
        animationFrameId: null,
      };
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [offset, onCardMove, scale, updateConnectionsForCard]);

  const getCardOutputAnchor = useCallback((card: CardItem) => {
    if (card.type === "image") {
      return {
        x: offset.x + (card.position.x + IMAGE_INPUT_CARD_WIDTH) * scale,
        y: offset.y + (card.position.y + IMAGE_INPUT_CARD_HEADER_OFFSET + IMAGE_INPUT_CARD_HEIGHT / 2) * scale,
      };
    }

    if (card.type === "image-generation") {
      return {
        x: offset.x + (card.position.x + IMAGE_GENERATION_CARD_WIDTH) * scale,
        y: offset.y + (card.position.y + IMAGE_GENERATION_CARD_HEADER_OFFSET + IMAGE_GENERATION_CARD_HEIGHT / 2) * scale,
      };
    }

    if (card.type === "image-result") {
      return {
        x: offset.x + (card.position.x + IMAGE_RESULT_CARD_WIDTH) * scale,
        y: offset.y + (card.position.y + IMAGE_RESULT_CARD_HEADER_OFFSET + IMAGE_RESULT_CARD_HEIGHT / 2) * scale,
      };
    }

    if (card.type === "video-generation") {
      return {
        x: offset.x + (card.position.x + VIDEO_GENERATION_CARD_WIDTH) * scale,
        y: offset.y + (card.position.y + VIDEO_GENERATION_CARD_HEADER_OFFSET + VIDEO_GENERATION_CARD_HEIGHT / 2) * scale,
      };
    }

    if (card.type === "video-result") {
      return {
        x: offset.x + (card.position.x + VIDEO_RESULT_CARD_WIDTH) * scale,
        y: offset.y + (card.position.y + VIDEO_RESULT_CARD_HEADER_OFFSET + VIDEO_RESULT_CARD_HEIGHT / 2) * scale,
      };
    }

    return null;
  }, [offset.x, offset.y, scale]);

  const getCardInputAnchor = useCallback((card: CardItem) => {
    if (card.type === "image") {
      return {
        x: offset.x + card.position.x * scale,
        y: offset.y + (card.position.y + IMAGE_INPUT_CARD_HEADER_OFFSET + IMAGE_INPUT_CARD_HEIGHT / 2) * scale,
      };
    }

    if (card.type === "image-generation") {
      return {
        x: offset.x + card.position.x * scale,
        y: offset.y + (card.position.y + IMAGE_GENERATION_CARD_HEADER_OFFSET + IMAGE_GENERATION_CARD_HEIGHT / 2) * scale,
      };
    }

    if (card.type === "image-result") {
      return {
        x: offset.x + card.position.x * scale,
        y: offset.y + (card.position.y + IMAGE_RESULT_CARD_HEADER_OFFSET + IMAGE_RESULT_CARD_HEIGHT / 2) * scale,
      };
    }

    if (card.type === "video-generation") {
      return {
        x: offset.x + card.position.x * scale,
        y: offset.y + (card.position.y + VIDEO_GENERATION_CARD_HEADER_OFFSET + VIDEO_GENERATION_CARD_HEIGHT / 2) * scale,
      };
    }

    if (card.type === "video-result") {
      return {
        x: offset.x + card.position.x * scale,
        y: offset.y + (card.position.y + VIDEO_RESULT_CARD_HEADER_OFFSET + VIDEO_RESULT_CARD_HEIGHT / 2) * scale,
      };
    }

    if (card.type === "preview") {
      return {
        x: offset.x + card.position.x * scale,
        y: offset.y + (card.position.y + PREVIEW_CARD_HEADER_OFFSET + PREVIEW_CARD_HEIGHT / 2) * scale,
      };
    }

    if (card.type === "storyboard-form") {
      return {
        x: offset.x + card.position.x * scale,
        y: offset.y + (card.position.y + STORYBOARD_CARD_HEADER_OFFSET + STORYBOARD_CARD_HEIGHT / 2) * scale,
      };
    }

    return null;
  }, [offset.x, offset.y, scale]);

  const handleConnectionDragStart = useCallback((cardId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const card = cards.find((item) => item.id === cardId);
    if (!card) return;

    const outputAnchor = getCardOutputAnchor(card);
    if (!outputAnchor) return;

    setConnectionDraft({
      fromId: cardId,
      currentX: outputAnchor.x,
      currentY: outputAnchor.y,
    });
    setConnectionTargetId(null);
  }, [cards, getCardOutputAnchor]);

  const findConnectionTarget = useCallback((pointerX: number, pointerY: number, fromId: string) => {
    let closestTargetId: string | null = null;
    let closestDistance = Number.POSITIVE_INFINITY;

    cards.forEach((card) => {
      if (card.id === fromId) {
        return;
      }

      const inputAnchor = getCardInputAnchor(card);
      if (!inputAnchor) {
        return;
      }

      const distance = Math.hypot(inputAnchor.x - pointerX, inputAnchor.y - pointerY);
      if (distance <= 28 && distance < closestDistance) {
        closestDistance = distance;
        closestTargetId = card.id;
      }
    });

    return closestTargetId;
  }, [cards, getCardInputAnchor]);

  useEffect(() => {
    if (!connectionDraft) {
      return;
    }

    const handleGlobalMouseMove = (e: MouseEvent) => {
      setConnectionDraft((prev) =>
        prev
          ? {
              ...prev,
              currentX: e.clientX,
              currentY: e.clientY,
            }
          : prev
      );
      setConnectionTargetId(findConnectionTarget(e.clientX, e.clientY, connectionDraft.fromId));
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      const targetId = findConnectionTarget(e.clientX, e.clientY, connectionDraft.fromId);
      if (targetId) {
        onAddConnection?.(connectionDraft.fromId, targetId);
      }
      setConnectionDraft(null);
      setConnectionTargetId(null);
    };

    document.addEventListener("mousemove", handleGlobalMouseMove);
    document.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [connectionDraft, findConnectionTarget, onAddConnection]);

  // 计算连接线的起点和终点
  const getConnectionLine = (connection: Connection) => {
    const fromCard = cards.find(c => c.id === connection.fromId);
    const toCard = cards.find(c => c.id === connection.toId);
    
    if (!fromCard || !toCard) return null;

    const fromAnchor = getCardOutputAnchor(fromCard);
    const toAnchor = getCardInputAnchor(toCard);

    if (!fromAnchor || !toAnchor) return null;

    return {
      fromX: fromAnchor.x,
      fromY: fromAnchor.y,
      toX: toAnchor.x,
      toY: toAnchor.y,
    };
  };

  // 生成贝塞尔曲线路径
  const generateBezierPath = (fromX: number, fromY: number, toX: number, toY: number) => {
    // 计算控制点，使曲线更平滑
    const dx = toX - fromX;
    const controlOffset = Math.min(Math.abs(dx) * 0.5, 100); // 控制点偏移量
    
    // 使用三次贝塞尔曲线 (C 命令)
    // 控制点1: 从起点向右延伸
    // 控制点2: 从终点向左延伸
    return `M ${fromX} ${fromY} C ${fromX + controlOffset} ${fromY}, ${toX - controlOffset} ${toY}, ${toX} ${toY}`;
  };

  const draftSourceCard = connectionDraft
    ? cards.find((card) => card.id === connectionDraft.fromId) ?? null
    : null;
  const draftSourceAnchor = draftSourceCard ? getCardOutputAnchor(draftSourceCard) : null;
  const draftTargetCard = connectionTargetId
    ? cards.find((card) => card.id === connectionTargetId) ?? null
    : null;
  const draftTargetAnchor = draftTargetCard ? getCardInputAnchor(draftTargetCard) : null;

  return (
    <>
      {/* 无限画布背景层 - 使用 background-position 实现无限滚动 */}
      <div
        ref={containerRef}
        className={`absolute inset-0 overflow-hidden ${isDragging ? "grabbing" : "grabbable"}`}
        style={{
          backgroundColor: "#09090b",
          backgroundImage: "radial-gradient(circle at center, #3f3f46 1px, transparent 1px)",
          backgroundSize: `${32 * scale}px ${32 * scale}px`,
          backgroundPosition: `${offset.x}px ${offset.y}px`,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onContextMenu={onContextMenu}
        onWheel={handleWheel}
        onClick={(e) => {
          // 点击空白处取消聚焦
          if (
            e.target instanceof Element &&
            !e.target.closest("[data-card]")
          ) {
            onCanvasBlur?.();
          }
        }}
      />

      {/* 卡片渲染层 - 独立于画布容器，不受 overflow-hidden 限制 */}
      <div className="absolute inset-0 pointer-events-none overflow-visible z-10">
        {/* 连接线渲染 */}
        <svg ref={svgRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
          {connections.map((connection) => {
            const line = getConnectionLine(connection);
            if (!line) return null;
            
            const path = generateBezierPath(line.fromX, line.fromY, line.toX, line.toY);
            
            return (
              <g key={`${connection.fromId}-${connection.toId}`}>
                {/* 贝塞尔曲线 */}
                <path
                  data-connection={`${connection.fromId}-${connection.toId}`}
                  ref={(node) => {
                    const key = `${connection.fromId}-${connection.toId}`;
                    if (node) {
                      connectionPathRefs.current.set(key, node);
                    } else {
                      connectionPathRefs.current.delete(key);
                    }
                  }}
                  d={path}
                  fill="none"
                  stroke="#a1a1aa"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </g>
            );
          })}

          {connectionDraft && draftSourceAnchor && (
            <g>
              <path
                d={generateBezierPath(
                  draftSourceAnchor.x,
                  draftSourceAnchor.y,
                  draftTargetAnchor?.x ?? connectionDraft.currentX,
                  draftTargetAnchor?.y ?? connectionDraft.currentY
                )}
                fill="none"
                stroke={draftTargetAnchor ? "#60a5fa" : "#71717a"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="7 7"
              />

              {cards.map((card) => {
                if (card.id === connectionDraft.fromId) {
                  return null;
                }

                const inputAnchor = getCardInputAnchor(card);
                if (!inputAnchor) {
                  return null;
                }

                const isActiveTarget = connectionTargetId === card.id;
                return (
                  <circle
                    key={`connection-target-${card.id}`}
                    cx={inputAnchor.x}
                    cy={inputAnchor.y}
                    r={isActiveTarget ? 7 : 5}
                    fill={isActiveTarget ? "#60a5fa" : "#3f3f46"}
                    stroke={isActiveTarget ? "#dbeafe" : "#18181b"}
                    strokeWidth={isActiveTarget ? 2 : 1.5}
                    opacity={isActiveTarget ? 1 : 0.7}
                  />
                );
              })}
            </g>
          )}
        </svg>

        {cards.map((card) => {
          // 图片输入卡片
          if (card.type === "image") {
            return (
              <div
                key={card.id}
                data-card
                data-card-id={card.id}
                className="pointer-events-auto"
                ref={(node) => {
                  if (node) {
                    cardElementRefs.current.set(card.id, node);
                  } else {
                    cardElementRefs.current.delete(card.id);
                  }
                }}
                style={{
                  position: "absolute",
                  left: offset.x + card.position.x * scale,
                  top: offset.y + card.position.y * scale,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                }}
              >
                <ImageInputCard
                  id={card.id}
                  data={card.data}
                  onRemove={onRemoveCard}
                  onFocus={onCardFocus}
                  onDataChange={(data) => onCardDataChange?.(card.id, data)}
                  isFocused={focusedCardId === card.id}
                  hasOutgoingConnection={connections.some((connection) => connection.fromId === card.id)}
                  onDragStart={(e) => handleCardDragStart(card.id, e)}
                  onAddConnectedCard={(type, position) => {
                    onAddConnectedCard?.(card.id, type, {
                      x: card.position.x + position.x,
                      y: card.position.y + position.y,
                    });
                  }}
                  onConnectionDragStart={handleConnectionDragStart}
                />
              </div>
            );
          }
          
          // 图片生成卡片
          if (card.type === "image-generation") {
            return (
              <div
                key={card.id}
                data-card
                data-card-id={card.id}
                className="pointer-events-auto"
                ref={(node) => {
                  if (node) {
                    cardElementRefs.current.set(card.id, node);
                  } else {
                    cardElementRefs.current.delete(card.id);
                  }
                }}
                style={{
                  position: "absolute",
                  left: offset.x + card.position.x * scale,
                  top: offset.y + card.position.y * scale,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                }}
              >
                <ImageGenerationCard
                  id={card.id}
                  data={card.data}
                  onRemove={onRemoveCard}
                  onFocus={onCardFocus}
                  onDataChange={(data) => onCardDataChange?.(card.id, data)}
                  isFocused={focusedCardId === card.id}
                  onDragStart={(e) => handleCardDragStart(card.id, e)}
                  onConnectionDragStart={handleConnectionDragStart}
                  isGenerating={generatingCards.has(card.id)}
                  onGenerate={onGenerate}
                />
              </div>
            );
          }
          
          // 图片结果卡片
          if (card.type === "image-result") {
            return (
              <div
                key={card.id}
                data-card
                data-card-id={card.id}
                className="pointer-events-auto"
                ref={(node) => {
                  if (node) {
                    cardElementRefs.current.set(card.id, node);
                  } else {
                    cardElementRefs.current.delete(card.id);
                  }
                }}
                style={{
                  position: "absolute",
                  left: offset.x + card.position.x * scale,
                  top: offset.y + card.position.y * scale,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                }}
              >
                <ImageResultCard
                  id={card.id}
                  onRemove={onRemoveCard}
                  onFocus={onCardFocus}
                  isFocused={focusedCardId === card.id}
                  onDragStart={(e) => handleCardDragStart(card.id, e)}
                  isGenerating={card.isGenerating}
                  onGenerationComplete={() => onGenerationComplete?.(card.id)}
                />
              </div>
            );
          }

          if (card.type === "video-result") {
            return (
              <div
                key={card.id}
                data-card
                data-card-id={card.id}
                className="pointer-events-auto"
                ref={(node) => {
                  if (node) {
                    cardElementRefs.current.set(card.id, node);
                  } else {
                    cardElementRefs.current.delete(card.id);
                  }
                }}
                style={{
                  position: "absolute",
                  left: offset.x + card.position.x * scale,
                  top: offset.y + card.position.y * scale,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                }}
              >
                <VideoResultCard
                  id={card.id}
                  onRemove={onRemoveCard}
                  onFocus={onCardFocus}
                  isFocused={focusedCardId === card.id}
                  onDragStart={(e) => handleCardDragStart(card.id, e)}
                  isGenerating={card.isGenerating}
                  onGenerationComplete={() => onGenerationComplete?.(card.id)}
                />
              </div>
            );
          }
          
          // 视频生成卡片
          if (card.type === "video-generation") {
            return (
              <div
                key={card.id}
                data-card
                data-card-id={card.id}
                className="pointer-events-auto"
                ref={(node) => {
                  if (node) {
                    cardElementRefs.current.set(card.id, node);
                  } else {
                    cardElementRefs.current.delete(card.id);
                  }
                }}
                style={{
                  position: "absolute",
                  left: offset.x + card.position.x * scale,
                  top: offset.y + card.position.y * scale,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                }}
              >
                <VideoGenerationCard
                  id={card.id}
                  data={card.data}
                  onRemove={onRemoveCard}
                  onFocus={onCardFocus}
                  onDataChange={(data) => onCardDataChange?.(card.id, data)}
                  isFocused={focusedCardId === card.id}
                  onDragStart={(e) => handleCardDragStart(card.id, e)}
                  isGenerating={generatingCards.has(card.id)}
                  onGenerate={onGenerate}
                />
              </div>
            );
          }

          if (card.type === "preview") {
            return (
              <div
                key={card.id}
                data-card
                data-card-id={card.id}
                className="pointer-events-auto"
                ref={(node) => {
                  if (node) {
                    cardElementRefs.current.set(card.id, node);
                  } else {
                    cardElementRefs.current.delete(card.id);
                  }
                }}
                style={{
                  position: "absolute",
                  left: offset.x + card.position.x * scale,
                  top: offset.y + card.position.y * scale,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                }}
              >
                <PreviewCard
                  id={card.id}
                  onRemove={onRemoveCard}
                  onFocus={onCardFocus}
                  isFocused={focusedCardId === card.id}
                  onDragStart={(e) => handleCardDragStart(card.id, e)}
                />
              </div>
            );
          }

          // 分镜表单卡片
          if (card.type === "storyboard-form") {
            return (
              <div
                key={card.id}
                data-card
                data-card-id={card.id}
                className="pointer-events-auto"
                ref={(node) => {
                  if (node) {
                    cardElementRefs.current.set(card.id, node);
                  } else {
                    cardElementRefs.current.delete(card.id);
                  }
                }}
                style={{
                  position: "absolute",
                  left: offset.x + card.position.x * scale,
                  top: offset.y + card.position.y * scale,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                }}
              >
                <StoryboardCard
                  id={card.id}
                  data={card.data}
                  onRemove={onRemoveCard}
                  onFocus={onCardFocus}
                  onDataChange={(data) => onCardDataChange?.(card.id, data)}
                  isFocused={focusedCardId === card.id}
                  onDragStart={(e) => handleCardDragStart(card.id, e)}
                  hasOutgoingConnection={connections.some((connection) => connection.fromId === card.id)}
                  onConnectionDragStart={handleConnectionDragStart}
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
