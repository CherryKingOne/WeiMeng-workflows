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
import { modelsConfigService, runtimeLogService, workflowService } from "@/core/api";
import type { WorkflowNode, WorkflowEdge, RuntimeLogRecordRequest, RuntimeRequestType } from "@/core/api/types";

interface FileBase64Data {
  base64?: string;
  url?: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
}

interface CompareImageData {
  base64?: string;
  url?: string;
  fileName?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseFileBase64Data(value: unknown): FileBase64Data | null {
  if (!isRecord(value)) {
    return null;
  }

  const base64 = typeof value.base64 === "string" && value.base64.length > 0 ? value.base64 : undefined;
  const url = typeof value.url === "string" && value.url.length > 0 ? value.url : undefined;

  if (!base64 && !url) {
    return null;
  }

  return {
    base64,
    url,
    file_name: typeof value.file_name === "string" ? value.file_name : undefined,
    mime_type: typeof value.mime_type === "string" ? value.mime_type : undefined,
    file_size: typeof value.file_size === "number" ? value.file_size : undefined,
  };
}

function parseVideoBase64Data(value: unknown): FileBase64Data | null {
  return parseFileBase64Data(value);
}

function parseVideoFrameImageSources(value: unknown): FileBase64Data[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .filter((item) => typeof item.imageData === "string")
    .map((item, index) => ({
      base64: item.imageData as string,
      mime_type: "image/jpeg",
      file_name: typeof item.label === "string" ? `${item.label}.jpg` : `frame-${index + 1}.jpg`,
    }));
}

function parseCompareImageData(value: unknown): CompareImageData | null {
  if (!isRecord(value)) {
    return null;
  }

  const base64 = typeof value.base64 === "string" && value.base64.length > 0 ? value.base64 : undefined;
  const url = typeof value.url === "string" && value.url.length > 0 ? value.url : undefined;

  if (!base64 && !url) {
    return null;
  }

  return {
    base64,
    url,
    fileName: typeof value.fileName === "string" ? value.fileName : undefined,
  };
}

function areCompareImagesEqual(left: CompareImageData | null, right: CompareImageData | null) {
  return (
    left?.base64 === right?.base64 &&
    left?.url === right?.url &&
    left?.fileName === right?.fileName
  );
}

function buildCompareImageData(imageData: FileBase64Data): CompareImageData {
  return {
    base64: imageData.base64,
    url: imageData.url,
    fileName: imageData.file_name,
  };
}

function areFileBase64DataEqual(left: FileBase64Data | null, right: FileBase64Data | null) {
  return (
    left?.base64 === right?.base64 &&
    left?.url === right?.url &&
    left?.file_name === right?.file_name &&
    left?.mime_type === right?.mime_type &&
    left?.file_size === right?.file_size
  );
}

function areFileBase64DataListsEqual(left: FileBase64Data[], right: FileBase64Data[]) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((item, index) => areFileBase64DataEqual(item, right[index] ?? null));
}

function extractSelectedVideoFrameImages(card: CardItem): FileBase64Data[] {
  const frameThumbnails = parseVideoFrameImageSources(card.data?.frameThumbnails);
  const selectedFrameIds = Array.isArray(card.data?.selectedFrameIds)
    ? card.data?.selectedFrameIds.filter((item): item is string => typeof item === "string")
    : [];

  if (frameThumbnails.length === 0) {
    return [];
  }

  if (selectedFrameIds.length === 0) {
    return frameThumbnails.slice(0, 1);
  }

  const selectedIdSet = new Set(selectedFrameIds);
  const rawFrames = Array.isArray(card.data?.frameThumbnails)
    ? card.data.frameThumbnails.filter((item): item is Record<string, unknown> => isRecord(item))
    : [];

  const selectedFrames = rawFrames
    .filter((frame) => typeof frame.id === "string" && selectedIdSet.has(frame.id))
    .map((frame, index) => ({
      base64: frame.imageData as string,
      mime_type: "image/jpeg",
      file_name: typeof frame.label === "string" ? `${frame.label}.jpg` : `frame-${index + 1}.jpg`,
    }));

  return selectedFrames.length > 0 ? selectedFrames : frameThumbnails.slice(0, 1);
}

function extractImageOutputs(card: CardItem): FileBase64Data[] {
  const directImage =
    parseFileBase64Data(card.data?.imageData) ??
    parseFileBase64Data(card.data?.incomingImageData);

  if (directImage) {
    return [directImage];
  }

  if (card.type === "video-frame") {
    return extractSelectedVideoFrameImages(card);
  }

  return [];
}

function extractVideoOutput(card: CardItem): FileBase64Data | null {
  return (
    parseVideoBase64Data(card.data?.videoData) ??
    parseVideoBase64Data(card.data?.incomingVideoData)
  );
}

function extractConnectedInputImages(card: CardItem | undefined): FileBase64Data[] {
  if (!card || !Array.isArray(card.data?.connectedInputImages)) {
    return [];
  }

  return card.data.connectedInputImages
    .map((item) => parseFileBase64Data(item))
    .filter((item): item is FileBase64Data => Boolean(item));
}

function syncConnectedCardData(cards: CardItem[], connections: Connection[]): CardItem[] {
  const cardsById = new Map(cards.map((card) => [card.id, card]));
  let hasChanges = false;

  const nextCards = cards.map((card) => {
    const incomingCards = connections
      .filter((connection) => connection.toId === card.id)
      .map((connection) => cardsById.get(connection.fromId))
      .filter((candidate): candidate is CardItem => Boolean(candidate));
    const incomingImages = incomingCards.flatMap(extractImageOutputs);
    const incomingPrimaryImage = incomingImages[0] ?? null;
    const incomingVideo = incomingCards
      .map(extractVideoOutput)
      .find((candidate): candidate is FileBase64Data => Boolean(candidate)) ?? null;

    if (card.type !== "compare") {
      const nextData = { ...(card.data ?? {}) };
      let changed = false;

      const currentIncomingImage = parseFileBase64Data(card.data?.incomingImageData);
      const currentIncomingVideo = parseVideoBase64Data(card.data?.incomingVideoData);
      const currentConnectedInputImages = Array.isArray(card.data?.connectedInputImages)
        ? card.data.connectedInputImages
            .map((item) => parseFileBase64Data(item))
            .filter((item): item is FileBase64Data => Boolean(item))
        : [];

      if (card.type === "image-generation" || card.type === "video-generation") {
        if (!areFileBase64DataListsEqual(currentConnectedInputImages, incomingImages)) {
          if (incomingImages.length > 0) {
            nextData.connectedInputImages = incomingImages;
          } else {
            delete nextData.connectedInputImages;
          }
          changed = true;
        }
      }

      if (card.type === "image-result" || card.type === "preview") {
        if (!areFileBase64DataEqual(currentIncomingImage, incomingPrimaryImage)) {
          if (incomingPrimaryImage) {
            nextData.incomingImageData = incomingPrimaryImage;
          } else {
            delete nextData.incomingImageData;
          }
          changed = true;
        }
      }

      if (card.type === "video-result" || card.type === "preview") {
        if (!areFileBase64DataEqual(currentIncomingVideo, incomingVideo)) {
          if (incomingVideo) {
            nextData.incomingVideoData = incomingVideo;
          } else {
            delete nextData.incomingVideoData;
          }
          changed = true;
        }
      }

      if (!changed) {
        return card;
      }

      hasChanges = true;
      return {
        ...card,
        data: nextData,
      };
    }

    const compareIncomingImages = incomingCards
      .map((sourceCard) => parseFileBase64Data(sourceCard.data?.imageData) ?? parseFileBase64Data(sourceCard.data?.incomingImageData))
      .filter((imageData): imageData is FileBase64Data => Boolean(imageData))
      .slice(0, 2)
      .map(buildCompareImageData);

    const nextOriginalImage = compareIncomingImages[0] ?? null;
    const nextGeneratedImage = compareIncomingImages[1] ?? null;
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

function hasMediaPayload(value: unknown): boolean {
  return Boolean(parseFileBase64Data(value));
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

const IMAGE_RESULT_CARD_X_OFFSET = 580;
const IMAGE_RESULT_CARD_Y_OFFSET = 92;
const IMAGE_RESULT_CARD_STACK_SPACING = 364;

function buildImageResultCardPosition(
  sourcePosition: { x: number; y: number },
  index: number
): { x: number; y: number } {
  return {
    x: sourcePosition.x + IMAGE_RESULT_CARD_X_OFFSET,
    y: sourcePosition.y + IMAGE_RESULT_CARD_Y_OFFSET + index * IMAGE_RESULT_CARD_STACK_SPACING,
  };
}

function cardHasImageInput(card: CardItem | undefined): boolean {
  if (!card) {
    return false;
  }

  if (card.type === "image" || card.type === "image-result" || card.type === "preview") {
    return hasMediaPayload(card.data?.imageData) || hasMediaPayload(card.data?.incomingImageData);
  }

  if (card.type === "video-frame") {
    return extractSelectedVideoFrameImages(card).length > 0;
  }

  return false;
}

/**
 * 检查图片结果卡片是否为空（无内容）
 * 用于判断是否可以重用该卡片显示新生成的图片
 */
function isImageResultCardEmpty(card: CardItem | undefined): boolean {
  if (!card) {
    return false;
  }

  if (card.type !== "image-result") {
    return false;
  }

  // 检查是否有任何图片数据
  const hasImageData = hasMediaPayload(card.data?.imageData);
  const hasIncomingImageData = hasMediaPayload(card.data?.incomingImageData);
  const hasGeneratedImages = Array.isArray(card.data?.generatedImages) && card.data.generatedImages.length > 0;

  return !hasImageData && !hasIncomingImageData && !hasGeneratedImages;
}

/**
 * 查找与生成卡片已连接且为空的图片结果卡片
 * 返回第一个找到的空卡片，用于重用
 */
function findEmptyConnectedResultCard(
  generationCardId: string,
  cards: CardItem[],
  connections: Connection[]
): CardItem | null {
  const connectedResultCardIds = connections
    .filter((conn) => conn.fromId === generationCardId)
    .map((conn) => conn.toId);

  for (const cardId of connectedResultCardIds) {
    const card = cards.find((c) => c.id === cardId);
    if (card && card.type === "image-result" && isImageResultCardEmpty(card)) {
      return card;
    }
  }

  return null;
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
  resultCardIds: string[];
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
  const cardsRef = useRef<CardItem[]>([]);
  const connectionsRef = useRef<Connection[]>([]);

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
    const pendingRequests = pendingGenerationRequestsRef.current;

    const loadWorkflow = async () => {
      if (!workflowService.isAvailable()) return;
      
      try {
        setIsLoading(true);
        isInitialLoad.current = true;
        const workflow = await workflowService.get({ workflow_id: workflowId });
        setProjectName(workflow.name);
        
        const loadedCards = convertNodesToCards(workflow.nodes ?? []);
        const loadedConnections = convertEdgesToConnections(workflow.edges ?? []);
        setCards(syncConnectedCardData(loadedCards, loadedConnections));
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

      for (const pendingRequest of pendingRequests.values()) {
        if (pendingRequest.processingTimerId !== null) {
          window.clearTimeout(pendingRequest.processingTimerId);
        }
      }

      pendingRequests.clear();
    };
  }, [recordRuntimeLog, workflowId]);

  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

  useEffect(() => {
    connectionsRef.current = connections;
  }, [connections]);

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
    setCards((prev) => syncConnectedCardData(prev.filter((card) => card.id !== id), nextConnections));
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
      syncConnectedCardData(prev.map((card) =>
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

    setCards((prevCards) => syncConnectedCardData(prevCards, nextConnections));
  }, []);

  const finalizeGenerationRequest = useCallback((
    resultCardId: string,
    options?: {
      imageData?: FileBase64Data | null;
      generatedImages?: FileBase64Data[];
      errorMessage?: string;
      providerRequestId?: string | null;
    }
  ) => {
    const pendingRequest = pendingGenerationRequestsRef.current.get(resultCardId);
    const outputImages = options?.generatedImages ?? (options?.imageData ? [options.imageData] : []);
    const targetResultCardIds = pendingRequest?.resultCardIds?.length
      ? pendingRequest.resultCardIds
      : [resultCardId];

    if (pendingRequest && pendingRequest.processingTimerId !== null) {
      window.clearTimeout(pendingRequest.processingTimerId);
    }

    const generationCardId = pendingRequest?.generationCardId;
    if (generationCardId) {
      setGeneratingCards((prev) => {
        const next = new Set(prev);
        next.delete(generationCardId);
        return next;
      });
    }

    setCards((prev) => {
      const nextCards = prev.map((card) => {
        const resultCardIndex = targetResultCardIds.indexOf(card.id);
        if (resultCardIndex === -1) {
          return card;
        }

        const nextData = { ...(card.data ?? {}) };
        if (card.type === "image-result") {
          const nextImageData = outputImages[resultCardIndex] ?? null;

          if (nextImageData) {
            nextData.imageData = nextImageData;
          } else {
            delete nextData.imageData;
          }

          if (resultCardIndex === 0 && options?.generatedImages && options.generatedImages.length > 0) {
            nextData.generatedImages = options.generatedImages;
          }

          if (options?.errorMessage) {
            nextData.generationError = options.errorMessage;
          } else if (!nextImageData) {
            nextData.generationError = `模型未返回第 ${resultCardIndex + 1} 张图片。`;
          } else {
            delete nextData.generationError;
          }
        }

        return {
          ...card,
          isGenerating: false,
          data: nextData,
        };
      });

      return syncConnectedCardData(nextCards, connectionsRef.current);
    });

    if (pendingRequest) {
      const outputImageCount = outputImages.length;
      recordRuntimeLog({
        category: "request",
        event_type: "request_completed",
        level: options?.errorMessage ? "error" : "success",
        message: options?.errorMessage
          ? `${getRequestTypeLabel(pendingRequest.requestType)}请求失败: ${options.errorMessage}`
          : `${getRequestTypeLabel(pendingRequest.requestType)}结果已返回，共生成 ${outputImageCount} 张图片。`,
        workflow_id: workflowId ?? undefined,
        card_id: pendingRequest.generationCardId,
        request_id: pendingRequest.requestId,
        request_type: pendingRequest.requestType,
        model_name: pendingRequest.modelName,
        details: {
          generation_card_id: pendingRequest.generationCardId,
          result_card_id: resultCardId,
          result_card_ids: targetResultCardIds,
          additional_result_card_ids: targetResultCardIds.slice(1),
          output_image_count: outputImageCount,
          provider_request_id: options?.providerRequestId ?? undefined,
        },
      });
      pendingGenerationRequestsRef.current.delete(resultCardId);
    }
  }, [buildCardData, recordRuntimeLog, workflowId]);

  // 处理生成按钮点击（从 ImageGenerationCard 触发）
  const handleGenerate = useCallback(async (generationCardId: string) => {
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
    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const isVideoGeneration = generationCard.type === "video-generation";
    const imageCountRaw =
      typeof generationCard.data?.selectedImageCount === "string"
        ? generationCard.data.selectedImageCount
        : "1";
    const parsedImageCount = Number.parseInt(imageCountRaw, 10);
    const resultCardCount = isVideoGeneration
      ? 1
      : Number.isFinite(parsedImageCount) && parsedImageCount > 0
        ? parsedImageCount
        : 1;

    // 查找已连接且为空的图片结果卡片，用于重用
    const emptyConnectedResultCard = isVideoGeneration
      ? null
      : findEmptyConnectedResultCard(generationCardId, cards, connections);

    let resultCards: CardItem[];
    let nextConnections: Connection[];

    if (emptyConnectedResultCard) {
      // 重用已存在的空预览卡片
      resultCards = [{
        ...emptyConnectedResultCard,
        isGenerating: true,
        data: {
          ...emptyConnectedResultCard.data,
          [NODE_NAME_DATA_KEY]: getCardNameValue(emptyConnectedResultCard.data, getDefaultCardName("image-result")),
        },
      }];
      // 不需要添加新连接，因为已经存在连接
      nextConnections = connectionsRef.current;
    } else {
      // 创建新的结果卡片
      resultCards = Array.from({ length: resultCardCount }, (_, index) => {
        const cardId = `card-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`;

        return {
          id: cardId,
          type: isVideoGeneration ? "video-result" : "image-result",
          position: isVideoGeneration
            ? {
                x: generationCard.position.x + 600,
                y: generationCard.position.y + 110,
              }
            : buildImageResultCardPosition(generationCard.position, index),
          isGenerating: true,
          data: buildCardData(isVideoGeneration ? "video-result" : "image-result"),
        };
      });
      // 添加新的连接
      nextConnections = [
        ...connectionsRef.current,
        ...resultCards.map((card) => ({ fromId: generationCardId, toId: card.id })),
      ];
    }

    const resultCardId = resultCards[0].id;

    if (emptyConnectedResultCard) {
      // 更新已存在的卡片状态
      setCards((prevCards) =>
        prevCards.map((card) =>
          card.id === emptyConnectedResultCard.id
            ? resultCards[0]
            : card
        )
      );
    } else {
      // 添加新卡片
      setCards((prevCards) => [...prevCards, ...resultCards]);
    }

    setFocusedCardId(resultCardId);
    connectionsRef.current = nextConnections;
    setConnections(nextConnections);
    setGeneratingCards((prev) => new Set(prev).add(generationCardId));

    if (!emptyConnectedResultCard) {
      // 只为新创建的卡片记录日志
      resultCards.forEach((resultCard) => {
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
            request_id: requestId,
          },
        });
      });
    } else {
      // 重用卡片时记录日志
      recordRuntimeLog({
        category: "card",
        event_type: "card_reused",
        level: "info",
        message: `重用已存在的空预览卡片，卡片ID: ${emptyConnectedResultCard.id}`,
        workflow_id: workflowId ?? undefined,
        card_id: emptyConnectedResultCard.id,
        card_name: getCardDisplayName(emptyConnectedResultCard),
        details: {
          card_type: emptyConnectedResultCard.type,
          source_generation_card_id: generationCardId,
          request_id: requestId,
        },
      });
    }
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
        result_card_ids: resultCards.map((card) => card.id),
        expected_output_count: resultCards.length,
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
          result_card_ids: resultCards.map((card) => card.id),
        },
      });
    }, 900);

    pendingGenerationRequestsRef.current.set(resultCardId, {
      requestId,
      requestType,
      modelName,
      generationCardId,
      resultCardId,
      resultCardIds: resultCards.map((card) => card.id),
      processingTimerId,
    });

    if (isVideoGeneration) {
      return;
    }

    const modelKey =
      typeof generationCard.data?.selectedModelKey === "string"
        ? generationCard.data.selectedModelKey.trim()
        : "";
    const prompt = typeof generationCard.data?.prompt === "string" ? generationCard.data.prompt : "";
    const selectedSize =
      typeof generationCard.data?.selectedSize === "string" && generationCard.data.selectedSize.trim()
        ? generationCard.data.selectedSize.trim()
        : "1024*1024";
    const imageCount = parsedImageCount;
    const inputImages = extractConnectedInputImages(generationCard);

    if (!modelsConfigService.isAvailable()) {
      finalizeGenerationRequest(resultCardId, {
        errorMessage: "Desktop bridge 未初始化，无法调用图片模型。",
      });
      return;
    }

    if (!modelKey) {
      finalizeGenerationRequest(resultCardId, {
        errorMessage: "当前图片卡片未选择有效模型，请重新选择后再试。",
      });
      return;
    }

    if (!prompt.trim() && inputImages.length === 0) {
      finalizeGenerationRequest(resultCardId, {
        errorMessage: "请输入提示词，或至少连接一张输入图片后再生成。",
      });
      return;
    }

    try {
      const response = await modelsConfigService.generateImage({
        key: modelKey,
        prompt,
        input_images: inputImages,
        size: selectedSize,
        image_count: Number.isFinite(imageCount) && imageCount > 0 ? imageCount : 1,
      });
      const generatedImages = response.images
        .map((item) => parseFileBase64Data(item))
        .filter((item): item is FileBase64Data => Boolean(item));
      const primaryImage =
        parseFileBase64Data(response.image) ??
        generatedImages[0] ??
        null;

      if (!primaryImage) {
        throw new Error("模型返回成功，但结果中没有可渲染的图片。");
      }

      finalizeGenerationRequest(resultCardId, {
        imageData: primaryImage,
        generatedImages,
        providerRequestId: response.request_id ?? null,
      });
    } catch (error) {
      finalizeGenerationRequest(resultCardId, {
        errorMessage: error instanceof Error ? error.message : "图片生成失败，请稍后重试。",
      });
    }
  }, [buildCardData, cards, connections, finalizeGenerationRequest, recordRuntimeLog, workflowId]);

  // 处理生成完成
  const handleGenerationComplete = useCallback((resultCardId: string) => {
    finalizeGenerationRequest(resultCardId);
  }, [finalizeGenerationRequest]);

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
