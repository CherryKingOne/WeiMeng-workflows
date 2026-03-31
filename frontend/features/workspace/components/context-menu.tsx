"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/features/theme/theme-context";
import type { CanvasContextMenuPosition } from "./canvas-container";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  submenu?: MenuItem[];
  highlight?: boolean;
  highlightColor?: string;
}

const menuItems: MenuItem[] = [
  {
    id: "file-upload",
    label: "上传文件",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
        ></path>
      </svg>
    ),
  },
  {
    id: "image-generation",
    label: "图片",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z"
        ></path>
      </svg>
    ),
  },
  {
    id: "text",
    label: "文本",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
      </svg>
    ),
  },
  {
    id: "video-frame",
    label: "视频抽帧",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
      </svg>
    ),
  },
  {
    id: "storyboard",
    label: "分镜",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeWidth="1.5"
          d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
        />
      </svg>
    ),
    submenu: [
      {
        id: "storyboard-view",
        label: "分镜表单",
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeWidth="1.5"
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            />
          </svg>
        ),
      },
      {
        id: "storyboard-chart",
        label: "分镜图表",
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeWidth="1.5"
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            />
          </svg>
        ),
      },
    ],
  },
  {
    id: "video",
    label: "视频",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"></path>
      </svg>
    ),
  },
  {
    id: "compare",
    label: "对比",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
      </svg>
    ),
  },
  {
    id: "preview",
    label: "预览",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
      </svg>
    ),
  },
  {
    id: "save",
    label: "保存",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
      </svg>
    ),
  },
];

interface ContextMenuProps {
  isOpen: boolean;
  position: CanvasContextMenuPosition;
  onClose: () => void;
  onAddCard?: (type: "image" | "image-generation" | "text" | "video" | "video-frame" | "preview" | "storyboard-form", canvasPosition: { x: number; y: number }) => void;
}

export function ContextMenu({ isOpen, position, onClose, onAddCard }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // 确保菜单不超出视口
  const menuWidth = 200;
  const menuHeight = 500;
  let posX = position.screenPosition.x;
  let posY = position.screenPosition.y;

  if (typeof window !== "undefined") {
    if (posX + menuWidth > window.innerWidth) {
      posX = window.innerWidth - menuWidth - 10;
    }
    if (posY + menuHeight > window.innerHeight) {
      posY = window.innerHeight - menuHeight - 10;
    }
  }

  return (
    <div
      ref={menuRef}
      className={`fixed z-50 backdrop-blur-md border rounded-xl shadow-2xl py-1 overflow-visible select-none context-menu-animate ${
        isDark
          ? "bg-[#1a1a1a]/95 border-[#2d2d2d]"
          : "bg-white/95 border-gray-200"
      }`}
      style={{ left: posX, top: posY }}
    >
      {/* 顶部标题 */}
      <div className={`text-center py-2 text-xs tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>
        @WeiMeng
      </div>

      {/* 菜单项列表 */}
      <div className="flex flex-col px-1 min-w-[200px]">
        {menuItems.map((item) => (
          <div
            key={item.id}
            className="relative"
            onMouseEnter={() => item.submenu && setActiveSubmenu(item.id)}
            onMouseLeave={() => setActiveSubmenu(null)}
          >
            <button
              className={`flex items-center justify-between w-full px-3 py-2 rounded-md group transition-colors ${
                isDark ? "hover:bg-white/5" : "hover:bg-black/5"
              }`}
              onClick={() => {
                if (!item.submenu) {
                  // 处理上传文件菜单项点击
                  if (item.id === "file-upload" && onAddCard) {
                    onAddCard("image", position.canvasPosition);
                  }
                  // 处理图片菜单项点击 - 创建图像生成卡片
                  if (item.id === "image-generation" && onAddCard) {
                    onAddCard("image-generation", position.canvasPosition);
                  }
                  // 处理文本菜单项点击
                  if (item.id === "text" && onAddCard) {
                    onAddCard("text", position.canvasPosition);
                  }
                  if (item.id === "video-frame" && onAddCard) {
                    onAddCard("video-frame", position.canvasPosition);
                  }
                  // 处理视频菜单项点击
                  if (item.id === "video" && onAddCard) {
                    onAddCard("video", position.canvasPosition);
                  }
                  if (item.id === "preview" && onAddCard) {
                    onAddCard("preview", position.canvasPosition);
                  }
                  onClose();
                }
              }}
            >
              <div className="flex items-center">
                <span className={`${isDark ? "text-gray-400 group-hover:text-white" : "text-gray-500 group-hover:text-gray-900"} mr-3`}>
                  {item.icon}
                </span>
                <span className={`text-sm ${isDark ? "text-gray-300 group-hover:text-white" : "text-gray-700 group-hover:text-gray-900"}`}>
                  {item.label}
                </span>
              </div>
              {item.submenu && (
                <svg
                  className={`w-4 h-4 ${isDark ? "text-gray-500" : "text-gray-400"}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"></path>
                </svg>
              )}
            </button>

            {/* 子菜单 */}
            {item.submenu && activeSubmenu === item.id && (
              <div 
                className="absolute left-full top-0 pl-2 w-[170px]"
                style={{ 
                  // 使用负边距创建一个不可见的桥接区域，让鼠标可以平滑移动
                  marginTop: '-4px',
                  marginBottom: '-4px',
                  paddingTop: '4px',
                  paddingBottom: '4px',
                }}
              >
                <div className="submenu-glass rounded-xl p-1">
                  {item.submenu.map((subItem) => (
                  <button
                    key={subItem.id}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group ${
                      isDark ? "hover:bg-white/5" : "hover:bg-black/5"
                    }`}
                    onClick={() => {
                      // 处理分镜表单菜单项点击
                      if (subItem.id === "storyboard-view" && onAddCard) {
                        onAddCard("storyboard-form", position.canvasPosition);
                      }
                      onClose();
                    }}
                  >
                    <span className={`${isDark ? "text-gray-500 group-hover:text-white" : "text-gray-500 group-hover:text-gray-900"}`}>
                      {subItem.icon}
                    </span>
                    <span className={`text-sm ${isDark ? "text-gray-300 group-hover:text-white" : "text-gray-700 group-hover:text-gray-900"}`}>
                      {subItem.label}
                    </span>
                  </button>
                ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}
