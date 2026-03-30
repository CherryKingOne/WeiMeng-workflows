"use client";

import { useState, useRef, useCallback } from "react";
import { useTheme } from "@/features/theme/theme-context";
import { selectFile, readFileAsBase64, type FileBase64Result } from "@/core/api";

// 弧形菜单工具项
const arcMenuTools = [
  { id: "image-generation", icon: "sparkles", label: "图像生成" },
  { id: "film", icon: "film", label: "视频" },
  { id: "layout-grid", icon: "layout-grid", label: "网格" },
  { id: "scissors", icon: "scissors", label: "裁剪" },
];

// Lucide 图标组件
function LucideIcon({ name, className }: { name: string; className?: string }) {
  const iconPaths: Record<string, string> = {
    x: "M18 6L6 18M6 6l12 12",
    plus: "M12 5v14M5 12h14",
    sparkles: "M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z",
    film: "M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9",
    "layout-grid": "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
    scissors: "M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 11-4.243 4.243 3 3 0 014.243-4.243zm0-11.515a3 3 0 11-4.243 4.243 3 3 0 014.243-4.243z",
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
}

export function ImageInputCard({
  id,
  onRemove,
  onFocus,
  isFocused = false,
  hasOutgoingConnection = false,
  onDragStart,
  onAddConnectedCard,
}: ImageInputCardProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const cardRef = useRef<HTMLDivElement>(null);

  // 卡片状态：default - 默认态, interactive - 交互态（显示+按钮）, expanded - 展开态（显示工具组）
  const [status, setStatus] = useState<"default" | "interactive" | "expanded">("default");
  const [imageData, setImageData] = useState<FileBase64Result | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  // 处理点击+按钮 - 展开工具组
  const handleExpandTools = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setStatus("expanded");
  }, []);

  // 处理点击卡片其他区域 - 收起工具组
  const handleCardClick = useCallback(() => {
    if (status === "expanded") {
      setStatus("interactive");
    }
    onFocus?.(id);
  }, [id, onFocus, status]);

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
    } catch (error) {
      console.error("选择文件失败:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 获取边框样式
  const getBorderStyle = () => {
    if (status === "expanded") {
      return "border-2 border-neutral-500 shadow-[0_0_20px_rgba(255,255,255,0.05)]";
    }
    if (status === "interactive") {
      return "border border-neutral-700";
    }
    return "border border-transparent";
  };

  return (
    <div
      ref={cardRef}
      className="cursor-grab"
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
    >
      {/* 标签 */}
      <div className="text-[12px] text-neutral-400 mb-2">图片输入</div>

      {/* 主卡片 - 使用 overflow-visible 允许弧形菜单超出边界 */}
      <div
        className={`relative w-[320px] aspect-square ${
          isDark ? "bg-[#18191c]" : "bg-white"
        } rounded-2xl flex flex-col items-center justify-center ${getBorderStyle()} transition-all duration-200 overflow-visible`}
        onMouseEnter={handleMouseEnter}
        onClick={handleCardClick}
      >
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

        {/* 弧形菜单 - 交互态显示+按钮，展开态显示工具组 */}
        {(status === "interactive" || status === "expanded") && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            {/* 主按钮 - 加号 */}
            <button
              className={`absolute left-0 top-1/2 w-10 h-10 -translate-x-1/2 -translate-y-1/2 ${
                isDark ? "bg-[#18191c] border-neutral-500" : "bg-white border-gray-400"
              } border rounded-full flex items-center justify-center ${
                isDark ? "text-white" : "text-gray-900"
              } shadow-xl z-20`}
              onClick={handleExpandTools}
            >
              <LucideIcon name="plus" className="w-6 h-6" />
            </button>

            {/* 弧形图标组 - 仅展开态显示 */}
            {status === "expanded" && (
              <div className="absolute left-12 top-1/2 flex -translate-y-1/2 flex-col gap-2.5">
                {arcMenuTools.map((tool, index) => (
                  <button
                    key={tool.id}
                    className={`w-9 h-9 ${
                      isDark
                        ? "bg-[#2a2d32] border-neutral-800 text-neutral-400 hover:text-white hover:bg-[#3a3d42]"
                        : "bg-gray-100 border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-200"
                    } border rounded-full flex items-center justify-center transition-all`}
                    style={{
                      transform: `translateX(${index === 0 || index === 3 ? 0 : 16}px)`,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      // 点击图像生成按钮时创建新卡片
                      if (tool.id === "image-generation") {
                        onAddConnectedCard?.("image-generation", { x: 350, y: -46 });
                      }
                      // TODO: 实现其他工具点击逻辑
                    }}
                    title={tool.label}
                  >
                    <LucideIcon name={tool.icon} className="w-4 h-4" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
