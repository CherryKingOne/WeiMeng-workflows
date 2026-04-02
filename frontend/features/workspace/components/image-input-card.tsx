"use client";

/**
 * 图片输入卡片组件
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

import { useState, useCallback, useEffect } from "react";
import { useTheme } from "@/features/theme/theme-context";
import { selectFile, readFileAsBase64, type FileBase64Result } from "@/core/api";
import { EditableCardName, getCardNameValue, NODE_NAME_DATA_KEY } from "./editable-card-name";

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
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={iconPaths[name] || ""} />
    </svg>
  );
}

interface ImageInputCardProps {
  id: string;
  onRemove?: (id: string) => void;
  onFocus?: (id: string) => void;
  isFocused?: boolean;
  hasOutgoingConnection?: boolean;
  onDragStart?: (e: React.MouseEvent) => void;
  onAddConnectedCard?: (type: string, position: { x: number; y: number }) => void;
  onConnectionDragStart?: (cardId: string, e: React.MouseEvent) => void;
  data?: Record<string, unknown>;
  onDataChange?: (data: Record<string, unknown>) => void;
}

function parseImageData(value: unknown): FileBase64Result | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<FileBase64Result>;
  if (
    typeof candidate.base64 !== "string" ||
    typeof candidate.mime_type !== "string" ||
    typeof candidate.file_name !== "string" ||
    typeof candidate.file_size !== "number"
  ) {
    return null;
  }

  return {
    base64: candidate.base64,
    mime_type: candidate.mime_type,
    file_name: candidate.file_name,
    file_size: candidate.file_size,
  };
}

export function ImageInputCard({
  id,
  onRemove,
  onFocus,
  hasOutgoingConnection = false,
  onDragStart,
  onConnectionDragStart,
  data,
  onDataChange,
}: ImageInputCardProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // 卡片状态：default - 默认态, interactive - 交互态（显示右侧连接按钮）
  const [status, setStatus] = useState<"default" | "interactive">("default");
  const [imageData, setImageData] = useState<FileBase64Result | null>(() => parseImageData(data?.imageData));
  const [isLoading, setIsLoading] = useState(false);
  const cardName = getCardNameValue(data, "上传文件");

  useEffect(() => {
    setImageData(parseImageData(data?.imageData));
  }, [data]);

  // 处理鼠标进入 - 显示+按钮
  const handleMouseEnter = useCallback(() => {
    if (status === "default") {
      setStatus("interactive");
    }
  }, [status]);

  // 处理鼠标离开
  const handleMouseLeave = useCallback(() => {
    if (status === "interactive") {
      setStatus("default");
    }
  }, [status]);

  // 处理点击卡片
  const handleCardClick = useCallback(() => {
    onFocus?.(id);
  }, [id, onFocus]);

  // 处理拖拽开始
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    onDragStart?.(e);
  }, [onDragStart]);

  // 处理删除
  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.(id);
  }, [id, onRemove]);

  // 处理文件选择
  const handleFileSelect = useCallback(async () => {
    try {
      // 选择图片文件
      const filePath = await selectFile("选择图片", [
        { name: "Images", extensions: ["jpg", "jpeg", "png", "gif", "webp", "bmp"] },
      ]);
      
      if (!filePath) return;
      
      setIsLoading(true);
      
      // 读取文件并转换为 Base64
      const result = await readFileAsBase64(filePath);
      setImageData(result);
      onDataChange?.({ imageData: result });
    } catch (error) {
      console.error("选择文件失败:", error);
    } finally {
      setIsLoading(false);
    }
  }, [onDataChange]);

  // 获取边框样式
  const getBorderStyle = () => {
    if (status === "interactive") {
      return "border border-neutral-700";
    }
    return "border border-transparent";
  };

  return (
    <div
      className="cursor-grab"
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
    >
      {/* 标签 */}
      <EditableCardName
        value={cardName}
        defaultValue="上传文件"
        onChange={(value) => onDataChange?.({ [NODE_NAME_DATA_KEY]: value })}
        onFocus={() => onFocus?.(id)}
        className="mb-2 bg-transparent text-[12px] text-neutral-400 outline-none"
      />

      {/* 主卡片 */}
      <div
        className={`relative w-[320px] aspect-square ${
          isDark ? "bg-[#18191c]" : "bg-white"
        } rounded-2xl flex flex-col items-center justify-center ${getBorderStyle()} transition-all duration-200 overflow-visible`}
        onMouseEnter={handleMouseEnter}
        onClick={handleCardClick}
      >
        {/* 左侧连接点（输入端口） */}
        <div className="absolute -left-[5px] top-1/2 -translate-y-1/2 w-[9px] h-[9px] bg-[#666] rounded-full border-[1.5px] border-[#171717] z-10" />

        {hasOutgoingConnection && (
          <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#52525b] border-2 border-[#18191c] z-10" />
        )}

        {/* 右上关闭按钮 - 交互态显示 */}
        {status !== "default" && (
          <button
            className={`absolute -top-2.5 -right-2.5 w-7 h-7 ${
              isDark ? "bg-[#2a2d32] border-neutral-700" : "bg-gray-100 border-gray-300"
            } border rounded-full flex items-center justify-center ${
              isDark ? "text-neutral-400 hover:text-white" : "text-gray-500 hover:text-gray-900"
            } transition-colors z-20`}
            onClick={handleRemove}
          >
            <LucideIcon name="x" className="w-3.5 h-3.5" />
          </button>
        )}

        {/* 图片预览 */}
        {imageData ? (
          <div className="w-full h-full flex items-center justify-center p-2">
            <img 
              src={imageData.base64} 
              alt={imageData.file_name}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        ) : (
          <>
            {/* 选择文件按钮 */}
            <button
              className={`border ${
                isDark
                  ? "border-neutral-700 bg-[#1e2023] hover:border-neutral-500 text-neutral-200"
                  : "border-gray-300 bg-gray-50 hover:border-gray-400 text-gray-700"
              } text-sm px-5 py-2 rounded-xl transition-all`}
              onClick={(e) => {
                e.stopPropagation();
                handleFileSelect();
              }}
              disabled={isLoading}
            >
              {isLoading ? "加载中..." : "选择文件"}
            </button>

            {/* 提示文字 */}
            <div
              className={`mt-4 text-center text-[11px] ${
                isDark ? "text-neutral-500" : "text-gray-400"
              } leading-5`}
            >
              或拖放文件到此处
              <br />
              或 Ctrl+V 粘贴
              {status === "default" && (
                <>
                  <br />
                  支持音频、视频、图片素材
                </>
              )}
            </div>
          </>
        )}

        {/* 右侧连接按钮 */}
        {status === "interactive" && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <button
              className={`absolute left-0 top-1/2 w-10 h-10 -translate-x-1/2 -translate-y-1/2 cursor-grab ${
                isDark ? "bg-[#18191c] border-neutral-500" : "bg-white border-gray-400"
              } border rounded-full flex items-center justify-center ${
                isDark ? "text-white" : "text-gray-900"
              } shadow-xl z-20`}
              onClick={(e) => {
                e.stopPropagation();
                onFocus?.(id);
              }}
              onMouseDown={(e) => {
                // 如果按住拖拽，则开始连接线拖拽
                if (onConnectionDragStart) {
                  e.stopPropagation();
                  onConnectionDragStart(id, e);
                }
              }}
            >
              <LucideIcon name="plus" className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
