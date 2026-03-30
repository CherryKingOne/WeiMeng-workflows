"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CanvasHeader } from "@/features/workspace/components/canvas-header";
import { CanvasSidebar } from "@/features/workspace/components/canvas-sidebar";
import { ContextMenu } from "@/features/workspace/components/context-menu";
import { CanvasContainer, CardItem, Connection } from "@/features/workspace/components/canvas-container";
import { Minimap } from "@/features/workspace/components/minimap";
import { HelpButton } from "@/features/workspace/components/help-button";
import { StorageModal } from "@/features/workspace/components/storage-modal";
import { useTheme } from "@/features/theme/theme-context";
import { workflowService } from "@/core/api";

function WorkspaceContent() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const searchParams = useSearchParams();
  const workflowId = searchParams.get("id");

  // 当前工作流信息
  const [projectName, setProjectName] = useState("未命名项目");
  const [isLoading, setIsLoading] = useState(false);

  // 卡片列表状态
  const [cards, setCards] = useState<CardItem[]>([]);
  const [focusedCardId, setFocusedCardId] = useState<string | null>(null);
  
  // 连接线状态
  const [connections, setConnections] = useState<Connection[]>([]);
  
  // 正在生成中的卡片ID集合
  const [generatingCards, setGeneratingCards] = useState<Set<string>>(new Set());

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

  // 添加卡片到画布
  const handleAddCard = useCallback((type: "image" | "text" | "video", canvasPosition: { x: number; y: number }) => {
    const newCard: CardItem = {
      id: `card-${Date.now()}`,
      type: type === "video" ? "video-generation" : type,
      position: canvasPosition,
    };
    setCards((prev) => [...prev, newCard]);
    setFocusedCardId(newCard.id);
  }, []);

  // 添加连接的子卡片
  const handleAddConnectedCard = useCallback((parentId: string, type: string, position: { x: number; y: number }) => {
    const newCardId = `card-${Date.now()}`;
    const newCard: CardItem = {
      id: newCardId,
      type: type as CardItem["type"],
      position,
    };
    setCards((prev) => [...prev, newCard]);
    setFocusedCardId(newCardId);
    
    // 添加连接关系
    setConnections((prev) => [...prev, { fromId: parentId, toId: newCardId }]);
  }, []);

  // 移除卡片
  const handleRemoveCard = useCallback((id: string) => {
    setCards((prev) => prev.filter((card) => card.id !== id));
    // 同时移除相关的连接线
    setConnections((prev) => prev.filter((conn) => conn.fromId !== id && conn.toId !== id));
    if (focusedCardId === id) {
      setFocusedCardId(null);
    }
  }, [focusedCardId]);

  // 处理卡片聚焦
  const handleCardFocus = useCallback((id: string) => {
    setFocusedCardId(id);
  }, []);

  // 处理卡片移动
  const handleCardMove = useCallback((id: string, position: { x: number; y: number }) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === id ? { ...card, position } : card
      )
    );
  }, []);

  // 处理生成按钮点击（从 ImageGenerationCard 触发）
  const handleGenerate = useCallback((generationCardId: string) => {
    const resultCardId = `card-${Date.now()}`;

    setCards((prevCards) => {
      const generationCard = prevCards.find(c => c.id === generationCardId);
      if (!generationCard) {
        console.log('未找到生成卡片:', generationCardId);
        return prevCards;
      }

      const isVideoGeneration = generationCard.type === "video-generation";
      const newCard: CardItem = {
        id: resultCardId,
        type: isVideoGeneration ? "video-result" : "image-result",
        position: isVideoGeneration
          ? {
              x: generationCard.position.x + 600,
              y: generationCard.position.y + 110,
            }
          : {
              x: generationCard.position.x + 540,
              y: generationCard.position.y + 60,
            },
        isGenerating: true,
      };

      return [...prevCards, newCard];
    });
    
    setFocusedCardId(resultCardId);
    
    // 添加连接关系
    setConnections((prev) => [...prev, { fromId: generationCardId, toId: resultCardId }]);
    
    // 标记为正在生成
    setGeneratingCards((prev) => new Set(prev).add(generationCardId));
  }, []);

  // 处理生成完成
  const handleGenerationComplete = useCallback((resultCardId: string) => {
    // 找到结果卡片对应的生成卡片
    const connection = connections.find(c => c.toId === resultCardId);
    if (connection) {
      // 从生成中集合移除
      setGeneratingCards((prev) => {
        const next = new Set(prev);
        next.delete(connection.fromId);
        return next;
      });
    }
    
    // 更新结果卡片状态
    setCards((prev) =>
      prev.map((card) =>
        card.id === resultCardId ? { ...card, isGenerating: false } : card
      )
    );
  }, [connections]);

  // 处理侧边栏视频点击 - 添加视频生成卡片
  const handleVideoClick = useCallback(() => {
    console.log('handleVideoClick called');
    // 在画布中心位置添加视频生成卡片
    const newCard: CardItem = {
      id: `card-${Date.now()}`,
      type: "video-generation",
      position: { x: 1500, y: 1200 }, // 画布中心位置
    };
    console.log('Creating video card:', newCard);
    setCards((prev) => {
      const newCards = [...prev, newCard];
      console.log('New cards array:', newCards);
      return newCards;
    });
    setFocusedCardId(newCard.id);
  }, []);

  return (
    <main className={`h-screen w-screen overflow-hidden font-sans select-none canvas-page ${
      isDark ? "text-gray-300" : "text-gray-700"
    }`}>
      {/* 画布容器 */}
      <CanvasContainer 
        onContextMenu={handleContextMenu}
        cards={cards}
        focusedCardId={focusedCardId}
        onRemoveCard={handleRemoveCard}
        onCardFocus={handleCardFocus}
        onCardMove={handleCardMove}
        onAddConnectedCard={handleAddConnectedCard}
        connections={connections}
        generatingCards={generatingCards}
        onGenerationComplete={handleGenerationComplete}
        onGenerate={handleGenerate}
      />

      {/* 顶部导航栏 */}
      <CanvasHeader 
        projectName={projectName}
        onProjectNameChange={handleProjectNameChange}
        onStorageClick={openStorageModal} 
      />

      {/* 左侧工具栏 */}
      <CanvasSidebar onVideoClick={handleVideoClick} />

      {/* 左下角帮助按钮 */}
      <HelpButton />

      {/* 右下角导航小地图 */}
      <Minimap />

      {/* 右键菜单 */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={closeContextMenu}
        onAddCard={handleAddCard}
      />

      {/* 存储管理弹窗 */}
      <StorageModal
        isOpen={storageModalOpen}
        onClose={closeStorageModal}
      />
    </main>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-500">加载中...</div>
      </div>
    }>
      <WorkspaceContent />
    </Suspense>
  );
}
