"use client";

import { useState, useCallback } from "react";
import { CanvasHeader } from "@/features/workspace/components/canvas-header";
import { CanvasSidebar } from "@/features/workspace/components/canvas-sidebar";
import { ContextMenu } from "@/features/workspace/components/context-menu";
import { CanvasContainer } from "@/features/workspace/components/canvas-container";
import { Minimap } from "@/features/workspace/components/minimap";
import { HelpButton } from "@/features/workspace/components/help-button";
import { useTheme } from "@/features/theme/theme-context";

export default function WorkspacePage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
  });

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <main className={`h-screen w-screen overflow-hidden font-sans select-none canvas-page ${
      isDark ? "text-gray-300" : "text-gray-700"
    }`}>
      {/* 画布容器 */}
      <CanvasContainer onContextMenu={handleContextMenu} />

      {/* 顶部导航栏 */}
      <CanvasHeader />

      {/* 左侧工具栏 */}
      <CanvasSidebar />

      {/* 左下角帮助按钮 */}
      <HelpButton />

      {/* 右下角导航小地图 */}
      <Minimap />

      {/* 右键菜单 */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={closeContextMenu}
      />
    </main>
  );
}
