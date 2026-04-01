"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CanvasHeader } from "@/features/workspace/components/canvas-header";
import { ContextMenu } from "@/features/workspace/components/context-menu";
import { CanvasContainer, CardItem, Connection, CanvasContextMenuPosition } from "@/features/workspace/components/canvas-container";
import { getCardNameValue, getDefaultCardName, NODE_NAME_DATA_KEY, type EditableCardType } from "@/features/workspace/components/editable-card-name";
import { Minimap } from "@/features/workspace/components/minimap";
import { HelpButton } from "@/features/workspace/components/help-button";
import { StorageModal } from "@/features/workspace/components/storage-modal";
import { ApiSettingsModal } from "@/features/workspace/components/api-settings-modal";
import { useTheme } from "@/features/theme/theme-context";
import { runtimeLogService, workflowService } from "@/core/api";
import type { WorkflowNode, WorkflowEdge, RuntimeLogRecordRequest, RuntimeRequestType } from "@/core/api/types";

interface FileBase64Data {
  base64: string;
  file_name?: string;
  mime_type?: string;
}

interface CompareImageData {
  base64: string;
  fileName?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseFileBase64Data(value: unknown): FileBase64Data | null {
  if (!isRecord(value) || typeof value.base64 !== "string") {
    return null;
  }

  return {
    base64: value.base64,
    file_name: typeof value.file_name === "string" ? value.file_name : undefined,
    mime_type: typeof value.mime_type === "string" ? value.mime_type : undefined,
  };
}

function parseCompareImageData(value: unknown): CompareImageData | null {
  if (!isRecord(value) || typeof value.base64 !== "string") {
    return null;
  }

  return {
    base64: value.base64,
    fileName: typeof value.fileName === "string" ? value.fileName : undefined,
  };
}

function areCompareImagesEqual(left: CompareImageData | null, right: CompareImageData | null) {
  return left?.base64 === right?.base64 && left?.fileName === right?.fileName;
}

function buildCompareImageData(imageData: FileBase64Data): CompareImageData {
  return {
    base64: imageData.base64,
    fileName: imageData.file_name,
  };
}

function syncCompareCards(cards: CardItem[], connections: Connection[]): CardItem[] {
  const cardsById = new Map(cards.map((card) => [card.id, card]));
  let hasChanges = false;

  const nextCards = cards.map((card) => {
    if (card.type !== "compare") {
      return card;
    }

    const incomingImages = connections
      .filter((connection) => connection.toId === card.id)
      .map((connection) => cardsById.get(connection.fromId))
      .map((sourceCard) => parseFileBase64Data(sourceCard?.data?.imageData))
      .filter((imageData): imageData is FileBase64Data => Boolean(imageData))
      .slice(0, 2)
      .map(buildCompareImageData);

    const nextOriginalImage = incomingImages[0] ?? null;
    const nextGeneratedImage = incomingImages[1] ?? null;
    const currentOriginalImage = parseCompareImageData(card.data?.originalImage);
    const currentGeneratedImage = parseCompareImageData(card.data?.generatedImage);

    if (
      areCompareImagesEqual(currentOriginalImage, nextOriginalImage) &&
      areCompareImagesEqual(currentGeneratedImage, nextGeneratedImage)
    ) {
      return card;
    }

    const nextData = { ...(card.data ?? {}) };

    if (nextOriginalImage) {
      nextData.originalImage = nextOriginalImage;
    } else {
      delete nextData.originalImage;
    }

    if (nextGeneratedImage) {
      nextData.generatedImage = nextGeneratedImage;
    } else {
      delete nextData.generatedImage;
    }

    hasChanges = true;
    return {
      ...card,
      data: nextData,
    };
  });

  return hasChanges ? nextCards : cards;
}

function hasBase64Payload(value: unknown): boolean {
  return isRecord(value) && typeof value.base64 === "string" && value.base64.length > 0;
}

function getNormalizedCardType(type: CardItem["type"]): EditableCardType {
  return (type === "video" ? "video-generation" : type) as EditableCardType;
}

function getCardDisplayName(card: Pick<CardItem, "type" | "data">): string {
  const normalizedType = getNormalizedCardType(card.type);
  return getCardNameValue(card.data, getDefaultCardName(normalizedType));
}

function getRequestTypeLabel(requestType: RuntimeRequestType): string {
  const labelMap: Record<RuntimeRequestType, string> = {
    text_to_image: "文生图",
    image_to_image: "图生图",
    text_to_video: "文生视频",
    image_to_video: "图生视频",
  };

  return labelMap[requestType];
}

function cardHasImageInput(card: CardItem | undefined): boolean {
  if (!card) {
    return false;
  }

  if (card.type === "image" || card.type === "image-result") {
    return hasBase64Payload(card.data?.imageData);
  }

  if (card.type === "video-frame") {
    return true;
  }

  return false;
}

function resolveRequestType(
  generationCard: CardItem,
  cards: CardItem[],
  connections: Connection[]
): RuntimeRequestType {
  const cardsById = new Map(cards.map((card) => [card.id, card]));
  const incomingCards = connections
    .filter((connection) => connection.toId === generationCard.id)
    .map((connection) => cardsById.get(connection.fromId));
  const hasImageInput = incomingCards.some(cardHasImageInput);

  if (generationCard.type === "video-generation") {
    return hasImageInput ? "image_to_video" : "text_to_video";
  }

  return hasImageInput ? "image_to_image" : "text_to_image";
}

interface PendingGenerationRequest {
  requestId: string;
  requestType: RuntimeRequestType;
  modelName: string;
  generationCardId: string;
  resultCardId: string;
  processingTimerId: number | null;
}

function WorkspaceContent() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();
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
  
  // 画布缩放状态 (10% - 200%)
  const [zoom, setZoom] = useState(90);
  
  // 用于防止初始化加载时自动保存
  const isInitialLoad = useRef(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingGenerationRequestsRef = useRef<Map<string, PendingGenerationRequest>>(new Map());

  const buildCardData = useCallback((type: EditableCardType) => ({
    [NODE_NAME_DATA_KEY]: getDefaultCardName(type),
  }), []);

  const recordRuntimeLog = useCallback((payload: RuntimeLogRecordRequest) => {
    if (!runtimeLogService.isAvailable()) {
      return;
    }

    void runtimeLogService.record(payload).catch((error) => {
      console.error("写入运行日志失败:", error);
    });
  }, []);

  // 将后端节点数据转换为前端卡片数据
  const convertNodesToCards = (nodes: WorkflowNode[]): CardItem[] => {
    return nodes.map((node) => ({
      id: node.node_id,
      type: (node.node_type === "video" ? "video-generation" : node.node_type) as CardItem["type"],
      position: { x: node.position_x, y: node.position_y },
      data: node.data,
    }));
  };

  // 将前端卡片数据转换为后端节点数据
  const convertCardsToNodes = (cards: CardItem[]): WorkflowNode[] => {
    return cards.map((card) => ({
      node_id: card.id,
      node_type: card.type,
      position_x: card.position.x,
      position_y: card.position.y,
      data: card.data,
    }));
  };

  // 将前端连接转换为后端边数据
  const convertConnectionsToEdges = (connections: Connection[]): WorkflowEdge[] => {
    return connections.map((conn) => ({
      source_node_id: conn.fromId,
      target_node_id: conn.toId,
    }));
  };

  // 将后端边数据转换为前端连接
  const convertEdgesToConnections = (edges: WorkflowEdge[]): Connection[] => {
    return edges.map((edge) => ({
      fromId: edge.source_node_id,
      toId: edge.target_node_id,
    }));
  };

  // 保存工作流数据到后端
  const saveWorkflow = useCallback(async (
    cardsToSave: CardItem[],
    connectionsToSave: Connection[],
    name?: string
  ) => {
    if (!workflowId || !workflowService.isAvailable()) return;
    
    try {
      const nodes = convertCardsToNodes(cardsToSave);
      const edges = convertConnectionsToEdges(connectionsToSave);
      
      await workflowService.update({
        workflow_id: workflowId,
        name,
        nodes,
        edges,
      });
      console.log('工作流已保存');
    } catch (error) {
      console.error("保存工作流失败:", error);
    }
  }, [workflowId]);

  // 加载工作流数据
  useEffect(() => {
    if (!workflowId) return;

    const loadWorkflow = async () => {
      if (!workflowService.isAvailable()) return;
      
      try {
        setIsLoading(true);
        isInitialLoad.current = true;
        const workflow = await workflowService.get({ workflow_id: workflowId });
        setProjectName(workflow.name);
        
        const loadedCards = convertNodesToCards(workflow.nodes ?? []);
        const loadedConnections = convertEdgesToConnections(workflow.edges ?? []);
        setCards(syncCompareCards(loadedCards, loadedConnections));
        setConnections(loadedConnections);
        setGeneratingCards(new Set());
        recordRuntimeLog({
          category: "project",
          event_type: "project_entered",
          level: "info",
          message: `进入项目"${workflow.name}"，项目ID: ${workflow.workflow_id}`,
          workflow_id: workflow.workflow_id,
          details: {
            project_name: workflow.name,
          },
        });
        console.log(`已加载 ${loadedCards.length} 个节点和 ${loadedConnections.length} 条边`);
      } catch (error) {
        console.error("加载工作流失败:", error);
      } finally {
        setIsLoading(false);
        isInitialLoad.current = false;
      }
    };

    loadWorkflow();
    
    // 清理函数
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      for (const pendingRequest of pendingGenerationRequestsRef.current.values()) {
        if (pendingRequest.processingTimerId !== null) {
          window.clearTimeout(pendingRequest.processingTimerId);
        }
      }

      pendingGenerationRequestsRef.current.clear();
    };
  }, [recordRuntimeLog, workflowId]);

  useEffect(() => {
    if (!workflowId || isInitialLoad.current) {
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveWorkflow(cards, connections, projectName);
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [cards, connections, projectName, saveWorkflow, workflowId]);

  // 处理项目名称修改
  const handleProjectNameChange = useCallback(async (newName: string) => {
    if (!workflowId) return;

    const previousName = projectName;
    setProjectName(newName);
    if (previousName !== newName) {
      recordRuntimeLog({
        category: "project",
        event_type: "project_renamed",
        level: "info",
        message: `修改项目名称: "${previousName}" -> "${newName}"，项目ID: ${workflowId}`,
        workflow_id: workflowId,
        details: {
          previous_name: previousName,
          current_name: newName,
        },
      });
    }
  }, [projectName, recordRuntimeLog, workflowId]);

  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: CanvasContextMenuPosition;
  }>({
    isOpen: false,
    position: {
      screenPosition: { x: 0, y: 0 },
      canvasPosition: { x: 0, y: 0 },
    },
  });

  const [storageModalOpen, setStorageModalOpen] = useState(false);
  const [apiSettingsModalOpen, setApiSettingsModalOpen] = useState(false);

  const handleContextMenu = useCallback((position: CanvasContextMenuPosition) => {
    setContextMenu({
      isOpen: true,
      position,
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

  const openApiSettingsModal = useCallback(() => {
    setApiSettingsModalOpen(true);
  }, []);

  const closeApiSettingsModal = useCallback(() => {
    setApiSettingsModalOpen(false);
  }, []);

  const handleBackToProjects = useCallback(async () => {
    try {
      if (workflowId && runtimeLogService.isAvailable()) {
        await runtimeLogService.record({
          category: "project",
          event_type: "project_exited",
          level: "info",
          message: `退出项目"${projectName}"，项目ID: ${workflowId}`,
          workflow_id: workflowId,
          details: {
            project_name: projectName,
          },
        });
      }
    } catch (error) {
      console.error("写入退出项目日志失败:", error);
    } finally {
      router.push("/");
    }
  }, [projectName, router, workflowId]);

  // 添加卡片到画布
  const handleAddCard = useCallback((type: "image" | "image-generation" | "text" | "video" | "video-frame" | "preview" | "storyboard-form" | "compare", canvasPosition: { x: number; y: number }) => {
    const normalizedType = (type === "video" ? "video-generation" : type) as EditableCardType;
    const newCard: CardItem = {
      id: `card-${Date.now()}`,
      type: normalizedType,
      position: canvasPosition,
      data: buildCardData(normalizedType),
    };
    setCards((prev) => [...prev, newCard]);
    setFocusedCardId(newCard.id);
    const cardName = getCardDisplayName(newCard);
    recordRuntimeLog({
      category: "card",
      event_type: "card_added",
      level: "info",
      message: `画布新增"${cardName}"卡片，卡片ID: ${newCard.id}`,
      workflow_id: workflowId ?? undefined,
      card_id: newCard.id,
      card_name: cardName,
      details: {
        card_type: newCard.type,
        position: canvasPosition,
      },
    });
  }, [buildCardData, recordRuntimeLog, workflowId]);

  // 添加连接的子卡片
  const handleAddConnectedCard = useCallback((parentId: string, type: string, position: { x: number; y: number }) => {
    const normalizedType = type as EditableCardType;
    const newCardId = `card-${Date.now()}`;
    const newCard: CardItem = {
      id: newCardId,
      type: normalizedType,
      position,
      data: buildCardData(normalizedType),
    };
    setCards((prev) => [...prev, newCard]);
    setFocusedCardId(newCardId);
    
    // 添加连接关系
    setConnections((prev) => [...prev, { fromId: parentId, toId: newCardId }]);
    const cardName = getCardDisplayName(newCard);
    recordRuntimeLog({
      category: "card",
      event_type: "card_added",
      level: "info",
      message: `画布新增"${cardName}"卡片，卡片ID: ${newCard.id}`,
      workflow_id: workflowId ?? undefined,
      card_id: newCard.id,
      card_name: cardName,
      details: {
        card_type: newCard.type,
        parent_id: parentId,
        position,
      },
    });
  }, [buildCardData, recordRuntimeLog, workflowId]);

  // 移除卡片
  const handleRemoveCard = useCallback((id: string) => {
    const pendingRequest = pendingGenerationRequestsRef.current.get(id);
    if (pendingRequest && pendingRequest.processingTimerId !== null) {
      window.clearTimeout(pendingRequest.processingTimerId);
      pendingGenerationRequestsRef.current.delete(id);
    }

    const nextConnections = connections.filter((conn) => conn.fromId !== id && conn.toId !== id);
    setCards((prev) => syncCompareCards(prev.filter((card) => card.id !== id), nextConnections));
    // 同时移除相关的连接线
    setConnections(nextConnections);
    if (focusedCardId === id) {
      setFocusedCardId(null);
    }
  }, [connections, focusedCardId]);

  // 处理卡片聚焦
  const handleCardFocus = useCallback((id: string) => {
    setFocusedCardId(id);
  }, []);

  const handleCanvasBlur = useCallback(() => {
    setFocusedCardId(null);
  }, []);

  // 处理卡片移动
  const handleCardMove = useCallback((id: string, position: { x: number; y: number }) => {
    setCards((prev) => {
      return prev.map((card) =>
        card.id === id ? { ...card, position } : card
      );
    });
  }, []);

  const handleCardDataChange = useCallback((id: string, data: Record<string, unknown>) => {
    setCards((prev) =>
      syncCompareCards(prev.map((card) =>
        card.id === id
          ? { ...card, data: { ...(card.data ?? {}), ...data } }
          : card
      ), connections)
    );
  }, [connections]);

  const handleAddConnection = useCallback((fromId: string, toId: string) => {
    if (fromId === toId) {
      return;
    }

    let nextConnections: Connection[] = [];

    setConnections((prev) => {
      const exists = prev.some(
        (connection) => connection.fromId === fromId && connection.toId === toId
      );

      if (exists) {
        nextConnections = prev;
        return prev;
      }

      nextConnections = [...prev, { fromId, toId }];
      return nextConnections;
    });

    setCards((prevCards) => syncCompareCards(prevCards, nextConnections));
  }, []);

  // 处理生成按钮点击（从 ImageGenerationCard 触发）
  const handleGenerate = useCallback((generationCardId: string) => {
    const generationCard = cards.find((card) => card.id === generationCardId);
    if (!generationCard) {
      console.log("未找到生成卡片:", generationCardId);
      return;
    }

    const requestType = resolveRequestType(generationCard, cards, connections);
    const requestTypeLabel = getRequestTypeLabel(requestType);
    const modelName =
      typeof generationCard.data?.selectedModel === "string" && generationCard.data.selectedModel.trim()
        ? generationCard.data.selectedModel
        : generationCard.type === "video-generation"
          ? "未配置视频模型"
          : "未配置图片模型";
    const resultCardId = `card-${Date.now()}`;
    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const isVideoGeneration = generationCard.type === "video-generation";
    const resultCard: CardItem = {
      id: resultCardId,
      type: isVideoGeneration ? "video-result" : "image-result",
      position: isVideoGeneration
        ? {
            x: generationCard.position.x + 600,
            y: generationCard.position.y + 110,
          }
        : {
            x: generationCard.position.x + 580,
            y: generationCard.position.y + 92,
          },
      isGenerating: true,
      data: buildCardData(isVideoGeneration ? "video-result" : "image-result"),
    };

    setCards((prevCards) => [...prevCards, resultCard]);
    
    setFocusedCardId(resultCardId);
    
    // 添加连接关系
    setConnections((prev) => [...prev, { fromId: generationCardId, toId: resultCardId }]);
    
    // 标记为正在生成
    setGeneratingCards((prev) => new Set(prev).add(generationCardId));
    const resultCardName = getCardDisplayName(resultCard);
    recordRuntimeLog({
      category: "card",
      event_type: "card_added",
      level: "info",
      message: `画布新增"${resultCardName}"卡片，卡片ID: ${resultCard.id}`,
      workflow_id: workflowId ?? undefined,
      card_id: resultCard.id,
      card_name: resultCardName,
      details: {
        card_type: resultCard.type,
        source_generation_card_id: generationCardId,
      },
    });
    recordRuntimeLog({
      category: "request",
      event_type: "request_started",
      level: "info",
      message: `${requestTypeLabel}请求已发起，正在请求模型服务。`,
      workflow_id: workflowId ?? undefined,
      card_id: generationCardId,
      card_name: getCardDisplayName(generationCard),
      request_id: requestId,
      request_type: requestType,
      model_name: modelName,
      details: {
        generation_card_id: generationCardId,
        result_card_id: resultCardId,
      },
    });

    const processingTimerId = window.setTimeout(() => {
      const pendingRequest = pendingGenerationRequestsRef.current.get(resultCardId);
      if (!pendingRequest) {
        return;
      }

      recordRuntimeLog({
        category: "request",
        event_type: "request_processing",
        level: "loading",
        message: `${requestTypeLabel}任务生成中，等待模型返回结果。`,
        workflow_id: workflowId ?? undefined,
        card_id: generationCardId,
        card_name: getCardDisplayName(generationCard),
        request_id: requestId,
        request_type: requestType,
        model_name: modelName,
        details: {
          generation_card_id: generationCardId,
          result_card_id: resultCardId,
        },
      });
    }, 900);

    pendingGenerationRequestsRef.current.set(resultCardId, {
      requestId,
      requestType,
      modelName,
      generationCardId,
      resultCardId,
      processingTimerId,
    });
  }, [buildCardData, cards, connections, recordRuntimeLog, workflowId]);

  // 处理生成完成
  const handleGenerationComplete = useCallback((resultCardId: string) => {
    const pendingRequest = pendingGenerationRequestsRef.current.get(resultCardId);
    if (pendingRequest && pendingRequest.processingTimerId !== null) {
      window.clearTimeout(pendingRequest.processingTimerId);
    }

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

    if (pendingRequest) {
      recordRuntimeLog({
        category: "request",
        event_type: "request_completed",
        level: "success",
        message: `${getRequestTypeLabel(pendingRequest.requestType)}结果已返回，结果卡片已更新。`,
        workflow_id: workflowId ?? undefined,
        card_id: pendingRequest.generationCardId,
        request_id: pendingRequest.requestId,
        request_type: pendingRequest.requestType,
        model_name: pendingRequest.modelName,
        details: {
          generation_card_id: pendingRequest.generationCardId,
          result_card_id: resultCardId,
        },
      });
      pendingGenerationRequestsRef.current.delete(resultCardId);
    }
  }, [connections, recordRuntimeLog, workflowId]);

  // 处理侧边栏视频点击 - 添加视频生成卡片
  const handleVideoClick = useCallback(() => {
    // 在画布中心位置添加视频生成卡片
    const newCard: CardItem = {
      id: `card-${Date.now()}`,
      type: "video-generation",
      position: { x: 1500, y: 1200 }, // 画布中心位置
      data: buildCardData("video-generation"),
    };
    setCards((prev) => [...prev, newCard]);
    setFocusedCardId(newCard.id);
    const cardName = getCardDisplayName(newCard);
    recordRuntimeLog({
      category: "card",
      event_type: "card_added",
      level: "info",
      message: `画布新增"${cardName}"卡片，卡片ID: ${newCard.id}`,
      workflow_id: workflowId ?? undefined,
      card_id: newCard.id,
      card_name: cardName,
      details: {
        card_type: newCard.type,
        position: newCard.position,
      },
    });
  }, [buildCardData, recordRuntimeLog, workflowId]);

  return (
    <main className={`h-screen w-screen overflow-hidden font-sans select-none canvas-page ${
      isDark ? "text-gray-300" : "text-gray-700"
    }`}>
      {/* 画布容器 */}
      <CanvasContainer 
        onContextMenu={handleContextMenu}
        onCanvasBlur={handleCanvasBlur}
        cards={cards}
        focusedCardId={focusedCardId}
        onRemoveCard={handleRemoveCard}
        onCardFocus={handleCardFocus}
        onCardDataChange={handleCardDataChange}
        onCardMove={handleCardMove}
        onAddConnectedCard={handleAddConnectedCard}
        onAddConnection={handleAddConnection}
        connections={connections}
        generatingCards={generatingCards}
        onGenerationComplete={handleGenerationComplete}
        onGenerate={handleGenerate}
        zoom={zoom}
        onZoomChange={setZoom}
      />

      {/* 顶部导航栏 */}
      <CanvasHeader 
        projectName={projectName}
        onProjectNameChange={handleProjectNameChange}
        onStorageClick={openStorageModal}
        onApiSettingsClick={openApiSettingsModal}
        onBackToProjects={handleBackToProjects}
        zoom={zoom}
      />

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

      <ApiSettingsModal
        isOpen={apiSettingsModalOpen}
        onClose={closeApiSettingsModal}
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
