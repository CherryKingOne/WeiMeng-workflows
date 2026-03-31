"use client";

/**
 * 分镜表卡片组件
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

import { useState, useRef, useCallback, useEffect } from "react";
import { useTheme } from "@/features/theme/theme-context";

// 分镜项目数据结构
interface StoryboardItem {
  id: string;
  order: number;
  imageUrl?: string;
  chineseDescription: string;
  englishDescription: string;
  dialogue: string;
  character: string;
  shotSize: string;
  angle: string;
  cameraMovement: string;
  duration: string;
}

// 视图模式类型
type ViewMode = "list" | "grid" | "table";

// 下拉选项配置
const SHOT_SIZES = ["远景", "全景", "中景", "近景", "特写", "大特写"];
const ANGLES = ["平视", "俯视", "仰视", "斜角", "荷兰角"];
const CAMERA_MOVEMENTS = ["固定", "推", "拉", "摇", "移", "跟", "升降", "环绕"];
const DURATIONS = ["1秒", "2秒", "3秒", "5秒", "10秒", "15秒", "30秒"];

interface StoryboardCardProps {
  id: string;
  onRemove?: (id: string) => void;
  onFocus?: (id: string) => void;
  isFocused?: boolean;
  hasOutgoingConnection?: boolean;
  onDragStart?: (e: React.MouseEvent) => void;
  onAddConnectedCard?: (type: string, position: { x: number; y: number }) => void;
  data?: Record<string, unknown>;
  onDataChange?: (data: Record<string, unknown>) => void;
  onConnectionDragStart?: (cardId: string, e: React.MouseEvent) => void;
}

// 解析分镜数据
function parseStoryboardData(value: unknown): StoryboardItem[] {
  if (!value || !Array.isArray(value)) {
    return [];
  }
  return value as StoryboardItem[];
}

// 列表图标
function ListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="8" y1="6" x2="21" y2="6"></line>
      <line x1="8" y1="12" x2="21" y2="12"></line>
      <line x1="8" y1="18" x2="21" y2="18"></line>
      <line x1="3" y1="6" x2="3.01" y2="6"></line>
      <line x1="3" y1="12" x2="3.01" y2="12"></line>
      <line x1="3" y1="18" x2="3.01" y2="18"></line>
    </svg>
  );
}

// 宫格图标
function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7"></rect>
      <rect x="14" y="3" width="7" height="7"></rect>
      <rect x="14" y="14" width="7" height="7"></rect>
      <rect x="3" y="14" width="7" height="7"></rect>
    </svg>
  );
}

// 表格图标
function TableIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="3" y1="9" x2="21" y2="9"></line>
      <line x1="3" y1="15" x2="21" y2="15"></line>
      <line x1="9" y1="9" x2="9" y2="21"></line>
      <line x1="15" y1="9" x2="15" y2="21"></line>
    </svg>
  );
}

// 加号图标
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}

// 关闭图标
function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}

// 图片图标
function ImageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <circle cx="8.5" cy="8.5" r="1.5"></circle>
      <polyline points="21 15 16 10 5 21"></polyline>
    </svg>
  );
}

// 播放图标
function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3"></polygon>
    </svg>
  );
}

// 发送图标
function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="22" y1="2" x2="11" y2="13"></line>
      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
  );
}

// 复制图标
function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7"></rect>
      <rect x="14" y="3" width="7" height="7"></rect>
      <rect x="14" y="14" width="7" height="7"></rect>
      <rect x="3" y="14" width="7" height="7"></rect>
    </svg>
  );
}

// 删除图标
function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  );
}

export function StoryboardCard({
  id,
  onRemove,
  onFocus,
  isFocused = false,
  hasOutgoingConnection = false,
  onDragStart,
  data,
  onDataChange,
  onConnectionDragStart,
}: StoryboardCardProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const cardRef = useRef<HTMLDivElement>(null);

  // 视图模式状态
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  
  // 分镜项目列表
  const [items, setItems] = useState<StoryboardItem[]>(() => parseStoryboardData(data?.storyboardItems));

  // 同步外部数据
  useEffect(() => {
    setItems(parseStoryboardData(data?.storyboardItems));
  }, [data]);

  // 添加空白镜头
  const handleAddItem = useCallback(() => {
    const newItem: StoryboardItem = {
      id: `item-${Date.now()}`,
      order: items.length + 1,
      chineseDescription: "",
      englishDescription: "",
      dialogue: "",
      character: "",
      shotSize: "",
      angle: "",
      cameraMovement: "",
      duration: "",
    };
    const newItems = [...items, newItem];
    setItems(newItems);
    onDataChange?.({ storyboardItems: newItems });
  }, [items, onDataChange]);

  // 更新分镜项目
  const handleUpdateItem = useCallback((itemId: string, updates: Partial<StoryboardItem>) => {
    const newItems = items.map((item) =>
      item.id === itemId ? { ...item, ...updates } : item
    );
    setItems(newItems);
    onDataChange?.({ storyboardItems: newItems });
  }, [items, onDataChange]);

  // 删除分镜项目
  const handleDeleteItem = useCallback((itemId: string) => {
    const newItems = items.filter((item) => item.id !== itemId);
    // 重新排序
    const reorderedItems = newItems.map((item, index) => ({
      ...item,
      order: index + 1,
    }));
    setItems(reorderedItems);
    onDataChange?.({ storyboardItems: reorderedItems });
  }, [items, onDataChange]);

  // 处理卡片点击
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

  // 渲染视图模式切换按钮
  const renderViewModeButtons = () => (
    <div className="flex bg-transparent border border-[#444] rounded overflow-hidden">
      <button
        className={`px-3 py-1.5 text-xs flex items-center gap-1.5 border-r border-[#444] transition-colors ${
          viewMode === "list"
            ? "bg-[#333] text-gray-200"
            : "text-gray-400 hover:text-gray-300"
        }`}
        onClick={() => setViewMode("list")}
      >
        <ListIcon className="w-3.5 h-3.5" /> 列表
      </button>
      <button
        className={`px-3 py-1.5 text-xs flex items-center gap-1.5 border-r border-[#444] transition-colors ${
          viewMode === "grid"
            ? "bg-[#333] text-gray-200"
            : "text-gray-400 hover:text-gray-300"
        }`}
        onClick={() => setViewMode("grid")}
      >
        <GridIcon className="w-3.5 h-3.5" /> 宫格
      </button>
      <button
        className={`px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors ${
          viewMode === "table"
            ? "bg-[#333] text-gray-200"
            : "text-gray-400 hover:text-gray-300"
        }`}
        onClick={() => setViewMode("table")}
      >
        <TableIcon className="w-3.5 h-3.5" /> 表格
      </button>
    </div>
  );

  // 渲染空状态
  const renderEmptyState = () => {
    const icon =
      viewMode === "list" ? (
        <ListIcon className="text-[#555]" />
      ) : viewMode === "grid" ? (
        <GridIcon className="text-[#555]" />
      ) : (
        <TableIcon className="text-[#555]" />
      );

    return (
      <div className="w-full h-[240px] border-[1.5px] border-dashed border-[#3a3a3a] rounded-lg flex flex-col items-center justify-center bg-[#1a1a1a]">
        {viewMode === "list" ? (
          <ListIcon className="text-[#555] mb-4 w-[42px] h-[42px]" />
        ) : viewMode === "grid" ? (
          <GridIcon className="text-[#555] mb-4 w-[42px] h-[42px]" />
        ) : (
          <TableIcon className="text-[#555] mb-4 w-[42px] h-[42px]" />
        )}
        <div className="text-sm text-[#777]">暂无分镜，请添加或同步分析结果</div>
      </div>
    );
  };

  // 渲染列表项
  const renderListItem = (item: StoryboardItem) => (
    <div key={item.id} className="flex gap-4 p-4 bg-[#1e1e1e] rounded-xl">
      <div className="text-[13px] font-bold text-[#555] w-4 mt-1">{item.order}</div>
      
      {/* 占位图区域 */}
      <div className="w-[280px] h-[160px] bg-[#000] rounded-lg flex flex-col items-center justify-center border border-[#111]">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={`镜头 ${item.order}`}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <>
            <ImageIcon className="text-[#555] mb-2" />
            <span className="text-xs text-[#666]">点击粘贴/拖入</span>
            <span className="text-[10px] text-[#444] mt-1">支持1-3张图片</span>
          </>
        )}
      </div>

      {/* 参数及输入框 */}
      <div className="flex-1 flex flex-col gap-3 pl-2">
        <div className="flex items-center gap-2">
          {/* 模型选择 */}
          <select className="bg-gradient-to-b from-[#424242] to-[#1e1e1e] border border-black/80 rounded px-2 py-1 text-xs text-white outline-none w-[180px] h-[26px] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            <option>Sora 2</option>
          </select>
          {/* 比例选择 */}
          <select
            className="bg-[#262626] border border-[#3a3a3a] rounded px-2 py-1 text-xs text-gray-300 outline-none w-[64px] h-[26px]"
            value={item.shotSize || "16:9"}
            onChange={(e) => handleUpdateItem(item.id, { shotSize: e.target.value })}
          >
            <option>16:9</option>
            <option>9:16</option>
            <option>1:1</option>
          </select>
          {/* 时长选择 */}
          <select
            className="bg-[#262626] border border-[#3a3a3a] rounded px-2 py-1 text-xs text-gray-300 outline-none w-[64px] h-[26px]"
            value={item.duration || "15秒"}
            onChange={(e) => handleUpdateItem(item.id, { duration: e.target.value })}
          >
            {DURATIONS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          {/* HD选项 */}
          <label className="flex items-center gap-1.5 text-xs text-[#888] ml-1 cursor-pointer">
            <input
              type="checkbox"
              className="w-3 h-3 appearance-none bg-[#2a2a2a] border border-[#444] rounded-sm checked:bg-white checked:border-white"
            />
            HD
          </label>
        </div>
        <div className="text-xs text-[#555] mt-1">画面描述...</div>
        <textarea
          className="flex-1 bg-transparent border border-[#3a3a3a] rounded-lg p-3 text-xs text-gray-300 resize-none outline-none placeholder-[#555]"
          placeholder="等待生成提示词..."
          value={item.chineseDescription}
          onChange={(e) => handleUpdateItem(item.id, { chineseDescription: e.target.value })}
        />
      </div>

      {/* 操作栏图标 */}
      <div className="flex flex-col gap-2.5 justify-center pl-2">
        <button className="w-[30px] h-[30px] rounded border border-[#3a3a3a] flex items-center justify-center text-gray-400 hover:text-white hover:border-[#555] transition-colors">
          <PlayIcon />
        </button>
        <button className="w-[30px] h-[30px] rounded border border-[#3a3a3a] flex items-center justify-center text-gray-400 hover:text-white hover:border-[#555] transition-colors">
          <SendIcon />
        </button>
        <button className="w-[30px] h-[30px] rounded border border-[#3a3a3a] flex items-center justify-center text-gray-400 hover:text-white hover:border-[#555] transition-colors">
          <CopyIcon />
        </button>
        <button
          className="w-[30px] h-[30px] rounded border border-[#3a3a3a] flex items-center justify-center text-gray-400 hover:text-red-400 hover:border-red-400/50 transition-colors"
          onClick={() => handleDeleteItem(item.id)}
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );

  // 渲染宫格项
  const renderGridItem = (item: StoryboardItem) => (
    <div
      key={item.id}
      className="w-[280px] h-[160px] bg-[#222] border border-[#3a3a3a] rounded-lg relative flex flex-col items-center justify-center cursor-pointer hover:border-[#555] transition-colors"
    >
      <span className="absolute top-2.5 left-2.5 bg-[#111] text-[10px] px-1.5 py-0.5 rounded text-gray-300 font-bold border border-[#222]">
        {item.order}
      </span>
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={`镜头 ${item.order}`}
          className="w-full h-full object-cover rounded-lg"
        />
      ) : (
        <>
          <ImageIcon className="text-[#555] mb-2" />
          <span className="text-xs text-[#777]">镜头 {item.order}</span>
        </>
      )}
    </div>
  );

  // 渲染表格视图
  const renderTableView = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs text-gray-300 min-w-[980px] border-collapse">
        <thead className="border-b border-[#2a2a2a] text-[#888] font-normal">
          <tr>
            <th className="py-3 px-4 w-10 font-normal">
              <input
                type="checkbox"
                className="w-3.5 h-3.5 rounded-sm appearance-none bg-[#2a2a2a] border border-[#444]"
              />
            </th>
            <th className="py-3 px-2 w-12 font-normal text-center text-[#ccc]">镜号</th>
            <th className="py-3 px-4 w-[100px] font-normal text-[#ccc]">画面</th>
            <th className="py-3 px-4 w-[240px] font-normal text-[#ccc]">中英画面描述</th>
            <th className="py-3 px-4 w-[140px] font-normal text-[#ccc]">对白/旁白</th>
            <th className="py-3 px-2 font-normal text-center text-[#ccc]">角色</th>
            <th className="py-3 px-2 font-normal text-center text-[#ccc]">景别</th>
            <th className="py-3 px-2 font-normal text-center text-[#ccc]">角度</th>
            <th className="py-3 px-2 font-normal text-center text-[#ccc]">运镜</th>
            <th className="py-3 px-2 font-normal text-center text-[#ccc]">时长</th>
            <th className="py-3 px-4 font-normal text-center text-[#ccc]">操作</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-[#2a2a2a] bg-[#1a1a1a]">
              <td className="py-4 px-4">
                <input
                  type="checkbox"
                  className="w-3.5 h-3.5 rounded-sm appearance-none bg-[#2a2a2a] border border-[#444]"
                />
              </td>
              <td className="py-4 px-2 text-center text-[#888] font-bold">{item.order}</td>
              <td className="py-4 px-4">
                <div className="w-[60px] h-[40px] bg-[#2a2a2a] rounded flex items-center justify-center text-[10px] text-[#555] border border-[#3a3a3a]">
                  {item.imageUrl ? "图片" : "无图"}
                </div>
              </td>
              <td className="py-4 px-4">
                <div className="flex flex-col gap-1.5">
                  <input
                    type="text"
                    placeholder="中文描述"
                    className="w-full bg-[#222] border border-[#3a3a3a] rounded px-2.5 py-1.5 text-xs outline-none placeholder-[#555]"
                    value={item.chineseDescription}
                    onChange={(e) => handleUpdateItem(item.id, { chineseDescription: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="English Description"
                    className="w-full bg-[#222] border border-[#3a3a3a] rounded px-2.5 py-1.5 text-xs outline-none placeholder-[#555]"
                    value={item.englishDescription}
                    onChange={(e) => handleUpdateItem(item.id, { englishDescription: e.target.value })}
                  />
                </div>
              </td>
              <td className="py-4 px-4">
                <input
                  type="text"
                  placeholder="对白/旁白"
                  className="w-full bg-[#222] border border-[#3a3a3a] rounded px-2.5 py-1.5 text-xs outline-none placeholder-[#555]"
                  value={item.dialogue}
                  onChange={(e) => handleUpdateItem(item.id, { dialogue: e.target.value })}
                />
              </td>
              <td className="py-4 px-2 text-center">
                <select
                  className="border border-[#3a3a3a] bg-[#222] text-[#888] px-2 py-1 rounded text-[11px]"
                  value={item.character}
                  onChange={(e) => handleUpdateItem(item.id, { character: e.target.value })}
                >
                  <option value="">角色</option>
                </select>
              </td>
              <td className="py-4 px-2 text-center">
                <select
                  className="border border-[#3a3a3a] bg-[#222] text-[#888] px-2 py-1 rounded text-[11px]"
                  value={item.shotSize}
                  onChange={(e) => handleUpdateItem(item.id, { shotSize: e.target.value })}
                >
                  <option value="">景别</option>
                  {SHOT_SIZES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </td>
              <td className="py-4 px-2 text-center">
                <select
                  className="border border-[#3a3a3a] bg-[#222] text-[#888] px-2 py-1 rounded text-[11px]"
                  value={item.angle}
                  onChange={(e) => handleUpdateItem(item.id, { angle: e.target.value })}
                >
                  <option value="">角度</option>
                  {ANGLES.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </td>
              <td className="py-4 px-2 text-center">
                <select
                  className="border border-[#3a3a3a] bg-[#222] text-[#888] px-2 py-1 rounded text-[11px]"
                  value={item.cameraMovement}
                  onChange={(e) => handleUpdateItem(item.id, { cameraMovement: e.target.value })}
                >
                  <option value="">运镜</option>
                  {CAMERA_MOVEMENTS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </td>
              <td className="py-4 px-2 text-center">
                <select
                  className="border border-[#3a3a3a] bg-[#222] text-[#888] px-2 py-1 rounded text-[11px]"
                  value={item.duration}
                  onChange={(e) => handleUpdateItem(item.id, { duration: e.target.value })}
                >
                  <option value="">时长</option>
                  {DURATIONS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </td>
              <td className="py-4 px-4 text-center">
                <button
                  className="bg-[#ba1a1a] text-white w-7 h-7 rounded flex items-center justify-center mx-auto hover:bg-[#d42020] transition-colors"
                  onClick={() => handleDeleteItem(item.id)}
                >
                  <TrashIcon className="w-3 h-3" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // 渲染内容区域
  const renderContent = () => {
    if (items.length === 0) {
      return renderEmptyState();
    }

    switch (viewMode) {
      case "list":
        return (
          <div className="p-4 min-h-[360px] flex flex-col gap-4">
            {items.map(renderListItem)}
          </div>
        );
      case "grid":
        return (
          <div className="p-4 min-h-[360px]">
            <div className="text-xs text-[#666] mb-3 pl-1">共 {items.length} 个镜头</div>
            <div className="flex gap-4 flex-wrap border-b border-[#2a2a2a] pb-4">
              {items.map(renderGridItem)}
            </div>
          </div>
        );
      case "table":
        return (
          <div className="min-h-[300px]">
            {/* 表格二级工具栏 */}
            <div className="flex justify-between items-center px-4 py-2 border-b border-[#2a2a2a] bg-[#1c1c1c]">
              <label className="flex items-center gap-2 text-xs text-gray-400">
                <input
                  type="checkbox"
                  className="w-3.5 h-3.5 rounded-sm appearance-none bg-[#2a2a2a] border border-[#444]"
                />
                已选择 0 个镜头
              </label>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-[11px] bg-[#222] text-[#555] rounded flex items-center gap-1 border border-transparent hover:text-gray-300 transition-colors">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  批量下载
                </button>
                <button className="px-3 py-1.5 text-[11px] bg-[#222] text-[#555] rounded flex items-center gap-1 border border-transparent hover:text-gray-300 transition-colors">
                  <TrashIcon className="w-3 h-3" />
                  批量删除
                </button>
              </div>
            </div>
            {renderTableView()}
          </div>
        );
    }
  };

  return (
    <div className="cursor-grab" onMouseDown={handleMouseDown}>
      {/* 标签 */}
      <div className="text-[12px] text-neutral-400 mb-2">分镜节点</div>

      {/* 主卡片 */}
      <div
        ref={cardRef}
        className={`relative bg-[#171717] rounded-xl border shadow-2xl overflow-visible transition-all duration-150 ${
          isFocused
            ? "border-2 border-[#99999a] shadow-[0_0_12px_rgba(255,255,255,0.1)]"
            : "border border-[#3a3a3a]"
        }`}
        style={{
          width: viewMode === "table" ? "1060px" : "820px",
        }}
        onClick={handleCardClick}
      >
        {/* 左侧连接点 */}
        <div className="absolute -left-[5px] top-1/2 -translate-y-1/2 w-[9px] h-[9px] bg-[#666] rounded-full border-[1.5px] border-[#171717] z-10" />

        {/* 右上关闭按钮 */}
        <button
          className="absolute -right-[12px] -top-[12px] w-[24px] h-[24px] bg-[#222] border border-[#3a3a3a] rounded-full flex items-center justify-center text-gray-400 z-20 hover:text-white hover:bg-[#333] transition-colors"
          onClick={handleRemove}
        >
          <CloseIcon />
        </button>

        {/* 右侧输出连接点 */}
        {hasOutgoingConnection && (
          <button
            className="absolute -right-[18px] top-1/2 -translate-y-1/2 w-[36px] h-[36px] bg-[#111] border border-[#4a4a4a] rounded-full flex items-center justify-center text-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20 hover:bg-[#1a1a1a] transition-colors"
            onMouseDown={(e) => onConnectionDragStart?.(id, e)}
          >
            <PlusIcon className="w-[18px] h-[18px]" />
          </button>
        )}

        {/* 顶栏 */}
        <div className="flex justify-between items-center p-3.5 border-b border-[#2a2a2a]">
          <div className="text-[13px] font-medium text-gray-200 pl-1">分镜表</div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 text-xs text-gray-300 border border-[#444] rounded flex items-center gap-1.5 hover:bg-[#222] transition-colors">
                  <span className="text-[10px] border border-gray-400 px-0.5 rounded-sm">T</span> 批量添加前缀
                </button>
                <button className="px-3 py-1.5 text-xs text-gray-300 border border-[#444] rounded flex items-center gap-1.5 hover:bg-[#222] transition-colors">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20V10M18 20V4M6 20v-4" />
                  </svg>
                  批量设置
                </button>
              </div>
            )}
            {renderViewModeButtons()}
          </div>
        </div>

        {/* 内容区域 */}
        {renderContent()}

        {/* 底部添加按钮 */}
        <div className="p-4 pt-0 border-t border-[#2a2a2a] mt-0 first:mt-0">
          <button
            className="w-full py-2.5 text-[13px] text-[#888] border border-dashed border-[#444] rounded-lg flex items-center justify-center gap-1.5 bg-[#171717] hover:border-[#666] hover:text-gray-300 transition-colors"
            onClick={handleAddItem}
          >
            <PlusIcon /> 添加空白镜头
          </button>
        </div>
      </div>
    </div>
  );
}
