"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { CanvasHeader } from "@/features/workspace/components/canvas-header";
import { CanvasSidebar } from "@/features/workspace/components/canvas-sidebar";
import { ContextMenu } from "@/features/workspace/components/context-menu";
import { CanvasContainer } from "@/features/workspace/components/canvas-container";
import { Minimap } from "@/features/workspace/components/minimap";
import { HelpButton } from "@/features/workspace/components/help-button";
import { StorageModal } from "@/features/workspace/components/storage-modal";
import { useTheme } from "@/features/theme/theme-context";
import { workflowService } from "@/core/api";

export default function WorkspacePage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const searchParams = useSearchParams();
  const workflowId = searchParams.get("id");

  // 当前工作流信息
  const [projectName, setProjectName] = useState("未命名项目");
  const [isLoading, setIsLoading] = useState(false);

  // 加载工作流数据
  useEffect(() => {
    if (!workflowId) return;

    const loadWorkflow = async () => {
      if (!workflowService.isAvailable()) return;
      
      try {
        setIsLoading(true);
        const workflow = await workflowService.get({ workflow_id: workflowId });
        setProjectName(workflow.name);
      } catch (error) {
        console.error("加载工作流失败:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkflow();
  }, [workflowId]);

  // 处理项目名称修改
  const handleProjectNameChange = useCallback(async (newName: string) => {
    if (!workflowId) return;
    
    setProjectName(newName);
    
    if (workflowService.isAvailable()) {
      try {
        await workflowService.update({
          workflow_id: workflowId,
          name: newName,
        });
      } catch (error) {
        console.error("保存项目名称失败:", error);
      }
    }
  }, [workflowId]);

  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
  });

  const [storageModalOpen, setStorageModalOpen] = useState(false);

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

  const openStorageModal = useCallback(() => {
    setStorageModalOpen(true);
  }, []);

  const closeStorageModal = useCallback(() => {
    setStorageModalOpen(false);
  }, []);

  return (
    <main className={`h-screen w-screen overflow-hidden font-sans select-none canvas-page ${
      isDark ? "text-gray-300" : "text-gray-700"
    }`}>
      {/* 画布容器 */}
      <CanvasContainer onContextMenu={handleContextMenu} />

      {/* 顶部导航栏 */}
      <CanvasHeader 
        projectName={projectName}
        onProjectNameChange={handleProjectNameChange}
        onStorageClick={openStorageModal} 
      />

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

      {/* 存储管理弹窗 */}
      <StorageModal
        isOpen={storageModalOpen}
        onClose={closeStorageModal}
      />
    </main>
  );
}
