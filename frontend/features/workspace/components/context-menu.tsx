"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/features/theme/theme-context";

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
    id: "image",
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
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        ></path>
      </svg>
    ),
  },
  {
    id: "text",
    label: "文字",
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
    id: "video-split",
    label: "视频拆解",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 11-4.243 4.243 3 3 0 014.243-4.243zm0-11.515a3 3 0 11-4.243 4.243 3 3 0 014.243-4.243z"></path>
      </svg>
    ),
  },
  {
    id: "storyboard",
    label: "分镜表",
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
        label: "分镜视表",
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
    id: "table",
    label: "表格编辑",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
      </svg>
    ),
  },
  {
    id: "doodle",
    label: "涂鸦画板",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
      </svg>
    ),
  },
  {
    id: "paint",
    label: "绘画",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-3"></path>
      </svg>
    ),
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
    id: "music",
    label: "音乐",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
      </svg>
    ),
  },
  {
    id: "agent",
    label: "Agent",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
      </svg>
    ),
  },
  {
    id: "comfy-ui",
    label: "Comfy UI",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M13 10V3L4 14h7v7l9-11h-7z"></path>
      </svg>
    ),
    submenu: [
      {
        id: "rh-app",
        label: "RH 应用",
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeWidth="1.5"
              d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
            />
          </svg>
        ),
      },
      {
        id: "rh-comfyui",
        label: "RH ComfyUI",
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeWidth="1.5"
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
        ),
      },
    ],
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
    id: "inpaint",
    label: "局部重绘",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeWidth="1.5"
          d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 11-4.243 4.243 3 3 0 014.243-4.243zm0-11.515a3 3 0 11-4.243 4.243 3 3 0 014.243-4.243z"
        />
      </svg>
    ),
    submenu: [
      {
        id: "crop-inpaint",
        label: "裁剪局部重绘",
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeWidth="1.5"
              d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879"
            />
          </svg>
        ),
      },
      {
        id: "seamless-stitch",
        label: "无缝拼回",
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeWidth="1.5" d="M14.121 14.121L19 19m-7-7l7-7" />
          </svg>
        ),
      },
    ],
  },
  {
    id: "upscale",
    label: "智能超清",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z"></path>
      </svg>
    ),
  },
  {
    id: "motion-transfer",
    label: "动作迁移",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M4 6h16M4 12h16m-7 6h7"></path>
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

const directorModeItem: MenuItem = {
  id: "director-mode",
  label: "导演模式",
  highlight: true,
  highlightColor: "#eab308",
  icon: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"></path>
    </svg>
  ),
  submenu: [
    {
      id: "camera-movement",
      label: "镜头运镜",
      icon: (
        <svg
          className="w-4 h-4 text-blue-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeWidth="1.5"
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      id: "professional-camera",
      label: "专业摄影机",
      icon: (
        <svg
          className="w-4 h-4 text-blue-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeWidth="1.5"
            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
          />
          <path
            strokeWidth="1.5"
            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
  ],
};

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
}

export function ContextMenu({ isOpen, position, onClose }: ContextMenuProps) {
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
  let posX = position.x;
  let posY = position.y;

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
              onClick={() => !item.submenu && console.log(`Clicked: ${item.id}`)}
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
              <div className="absolute left-full top-0 ml-1 submenu-glass rounded-xl p-1 w-[170px]">
                {item.submenu.map((subItem) => (
                  <button
                    key={subItem.id}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group ${
                      isDark ? "hover:bg-white/5" : "hover:bg-black/5"
                    }`}
                    onClick={() => console.log(`Clicked: ${subItem.id}`)}
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
            )}
          </div>
        ))}
      </div>

      {/* 分隔线 */}
      <div className={`h-[1px] my-1 mx-2 ${isDark ? "bg-[#2d2d2d]" : "bg-gray-200"}`}></div>

      {/* 导演模式 */}
      <div className="px-1">
        <div
          className="relative"
          onMouseEnter={() => setActiveSubmenu("director-mode")}
          onMouseLeave={() => setActiveSubmenu(null)}
        >
          <button
            className={`flex items-center justify-between w-full px-3 py-2 rounded-md group transition-colors ${
              isDark ? "hover:bg-white/5" : "hover:bg-black/5"
            }`}
          >
            <div className="flex items-center">
              <span
                className="mr-3"
                style={{ color: directorModeItem.highlightColor }}
              >
                {directorModeItem.icon}
              </span>
              <span
                className="text-sm font-medium"
                style={{ color: directorModeItem.highlightColor }}
              >
                {directorModeItem.label}
              </span>
            </div>
            <svg
              className="w-4 h-4"
              style={{ color: directorModeItem.highlightColor }}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"></path>
            </svg>
          </button>

          {/* 导演模式子菜单 */}
          {directorModeItem.submenu && activeSubmenu === "director-mode" && (
            <div className="absolute left-full top-0 ml-1 submenu-glass rounded-xl p-1 w-[170px]">
              {directorModeItem.submenu.map((subItem) => (
                <button
                  key={subItem.id}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group ${
                    isDark ? "hover:bg-white/5" : "hover:bg-black/5"
                  }`}
                  onClick={() => console.log(`Clicked: ${subItem.id}`)}
                >
                  {subItem.icon}
                  <span className={`text-sm ${isDark ? "text-gray-300 group-hover:text-white" : "text-gray-700 group-hover:text-gray-900"}`}>
                    {subItem.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
