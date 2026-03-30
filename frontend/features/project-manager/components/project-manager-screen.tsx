"use client";

import { startTransition, useCallback, useEffect, useRef, useState, useMemo, type CSSProperties, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { workflowService, type WorkflowSummary, type ProjectSummary } from "@/core/api";
import { useTheme } from "@/features/theme/theme-context";

const themeStyles: Record<"dark" | "light", CSSProperties> = {
  dark: {
    "--pm-bg": "#0f0f0f",
    "--pm-bg-rgb": "15 15 15",
    "--pm-surface": "#1a1a1a",
    "--pm-surface-soft": "#141414",
    "--pm-border": "#2a2a2a",
    "--pm-text": "#ffffff",
    "--pm-text-muted": "#8a8a8a",
    "--pm-accent": "#3b82f6",
    "--pm-accent-soft": "rgba(59, 130, 246, 0.12)",
    "--pm-accent-border": "rgba(59, 130, 246, 0.24)",
    "--pm-shadow": "0 20px 48px rgba(0, 0, 0, 0.28)",
  } as CSSProperties,
  light: {
    "--pm-bg": "#ffffff",
    "--pm-bg-rgb": "255 255 255",
    "--pm-surface": "#f5f5f5",
    "--pm-surface-soft": "#ffffff",
    "--pm-border": "#e3e3e3",
    "--pm-text": "#111111",
    "--pm-text-muted": "#666666",
    "--pm-accent": "#3b82f6",
    "--pm-accent-soft": "rgba(59, 130, 246, 0.1)",
    "--pm-accent-border": "rgba(59, 130, 246, 0.2)",
    "--pm-shadow": "0 18px 42px rgba(15, 23, 42, 0.12)",
  } as CSSProperties,
};

export function ProjectManagerScreen() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 只在客户端检查 bridge 可用性，避免 hydration mismatch
  const isBridgeAvailable = useMemo(() => {
    if (typeof window === "undefined") return false;
    return workflowService.isAvailable();
  }, []);

  /**
   * ============================================================
   * 从后端加载工作流列表
   * ============================================================
   * API 调用流程:
   * 1. workflowService.list() -> 调用 desktopBridge.invoke('workflow.list')
   * 2. Electron IPC 转发给 Python 后端
   * 3. Python 后端处理请求，返回工作流列表
   * 4. 前端更新 workflows 状态
   *
   * @see core/api/workflow-service.ts
   * @see backend/modules/workflow_engine/presentation/ipc_handlers.py
   */
  const loadWorkflows = useCallback(async () => {
    if (!isBridgeAvailable) {
      console.warn("Desktop bridge 不可用，使用模拟数据");
      return;
    }

    setIsLoading(true);
    try {
      const data = await workflowService.list();
      setWorkflows(data);
    } catch (error) {
      console.error("加载工作流失败:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isBridgeAvailable]);

  // 组件挂载时加载工作流列表
  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  // 监听路由变化，当从其他页面返回时刷新数据
  // 使用 pageshow 事件检测页面从 bfcache 恢复
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      // persisted 为 true 表示页面从 bfcache 恢复
      if (event.persisted) {
        loadWorkflows();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [loadWorkflows]);

  // 统一跳转函数 - 传递工作流 ID 到工作区
  const openWorkspace = useCallback((workflowId?: string) => {
    if (workflowId) {
      router.push(`/workspace?id=${workflowId}`);
    } else {
      router.push("/workspace");
    }
  }, [router]);

  /**
   * ============================================================
   * 创建新工作流
   * ============================================================
   * 点击"新建项目"按钮时调用
   * 调用 workflowService.create() 创建新工作流
   *
   * @see core/api/workflow-service.ts#create
   */
  const handleCreateWorkflow = useCallback(async () => {
    if (!isBridgeAvailable) {
      openWorkspace();
      return;
    }

    try {
      const newWorkflow = await workflowService.create({
        name: "新工作流",
      });
      setWorkflows((prev) => [newWorkflow, ...prev]);
      openWorkspace();
    } catch (error) {
      console.error("创建工作流失败:", error);
      openWorkspace();
    }
  }, [openWorkspace]);

  /**
   * ============================================================
   * 删除工作流
   * ============================================================
   * 点击删除按钮时调用
   * 调用 workflowService.delete() 删除工作流
   */
  const handleDeleteWorkflow = useCallback(async (projectId: string, _projectName: string) => {
    if (!isBridgeAvailable) return;

    if (!confirm("确定要删除这个项目吗？此操作无法撤销。")) {
      return;
    }

    try {
      await workflowService.delete({ workflow_id: projectId });
      setWorkflows((prev) => prev.filter((wf) => wf.workflow_id !== projectId));
    } catch (error) {
      console.error("删除工作流失败:", error);
    }
  }, []);

  /**
   * ============================================================
   * 重命名工作流
   * ============================================================
   * 项目卡片点击编辑按钮后，输入新名称并保存
   */
  const handleRenameWorkflow = useCallback((projectId: string, newName: string) => {
    if (!newName || !newName.trim()) return;

    workflowService.update({
      workflow_id: projectId,
      name: newName.trim(),
    }).then(() => {
      setWorkflows((prev) =>
        prev.map((wf) =>
          wf.workflow_id === projectId
            ? { ...wf, name: newName.trim() }
            : wf
        )
      );
    }).catch((error) => {
      console.error("重命名工作流失败:", error);
    });
  }, [workflows]);

  /**
   * ============================================================
   * 将后端工作流数据转换为前端显示格式
   * ============================================================
   * 后端 WorkflowSummary 转换为 ProjectSummary
   */
  const projects: ProjectSummary[] = workflows.map((wf) => ({
    id: wf.workflow_id,
    name: wf.name,
    updatedAtLabel: "修改于刚刚",
    createdAtLabel: "创建于刚刚",
    nodeCount: wf.node_count,
  }));

  // 是否有真实数据
  const hasProjects = projects.length > 0;

  // 统一跳转函数
  const openSettings = () => {
    startTransition(() => {
      router.push("/settings");
    });
  };

  return (
    <div
      className="flex min-h-screen flex-col bg-[var(--pm-bg)] text-[var(--pm-text)] transition-colors duration-300"
      style={themeStyles[theme]}
    >
      <header
        className="flex h-10 shrink-0 items-center justify-between border-b border-[var(--pm-border)] bg-[var(--pm-surface)]"
        style={{ WebkitAppRegion: "drag" } as CSSProperties}
      >
        <div className="flex items-center gap-2 px-3" style={{ width: "80px" }}>
          {/* macOS 原生窗口控制按钮区域占位 */}
        </div>
        <div className="flex flex-1 items-center justify-center">
          <span className="text-sm font-medium text-[var(--pm-text-muted)]">
            WeiMeng
          </span>
        </div>
        <div
          className="flex items-center gap-1 px-3"
          style={{ WebkitAppRegion: "no-drag" } as CSSProperties}
        >
          <GhostIconButton
            label="切换语言"
            title="语言切换入口预留"
            icon={<LanguageIcon />}
          />
          <GhostIconButton
            label="切换主题"
            title="切换主题"
            onClick={toggleTheme}
            icon={theme === "dark" ? <MoonIcon /> : <SunIcon />}
          />
          <GhostIconButton
            label="设置"
            title="打开设置页"
            onClick={openSettings}
            icon={<SettingsIcon />}
          />
        </div>
      </header>

      <main className="project-manager-scrollbar flex-1 overflow-auto px-6 py-8 sm:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">项目</h1>
              <p className="mt-2 text-sm text-[var(--pm-text-muted)]">
                管理你的分镜工作流项目
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-[var(--pm-border)] bg-[var(--pm-surface)] px-3 py-2 shadow-[var(--pm-shadow)]">
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-[var(--pm-text-muted)]">排序</span>
                  <select
                    className="bg-transparent text-sm text-[var(--pm-text)] outline-none"
                    defaultValue="modified"
                  >
                    <option value="modified">按修改时间</option>
                    <option value="created">按创建时间</option>
                    <option value="name">按名称</option>
                  </select>
                </label>
              </div>
              <button
                type="button"
                onClick={handleCreateWorkflow}
                disabled={isLoading}
                className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[var(--pm-accent)] px-5 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-50"
              >
                <PlusIcon />
                <span>新建项目</span>
              </button>
            </div>
          </div>

          <div className="mb-6 flex flex-col gap-4 rounded-[24px] border border-[var(--pm-accent-border)] bg-[linear-gradient(135deg,var(--pm-accent-soft),transparent)] px-5 py-4 shadow-[var(--pm-shadow)] md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--pm-accent-soft)] text-[var(--pm-accent)]">
                <KeyIcon />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--pm-text)]">
                  需要配置 API Key
                </p>
                <p className="mt-1 text-xs leading-6 text-[var(--pm-text-muted)]">
                  请前往设置页面补充供应商配置。当前前端只保留入口，真实设置读写将在
                  Electron + Python backend 准备完成后接入。
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {isBridgeAvailable ? null : (
                <span className="rounded-full border border-white/8 bg-black/15 px-3 py-1 text-[11px] text-[var(--pm-text-muted)]">
                  Electron bridge 未接入
                </span>
              )}
              <button
                type="button"
                onClick={openSettings}
                className="inline-flex h-10 items-center justify-center rounded-2xl bg-[var(--pm-accent)] px-4 text-xs font-medium text-white transition hover:brightness-110"
              >
                前往设置
              </button>
            </div>
          </div>

          <section
            aria-label="项目列表"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            {hasProjects ? (
              projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onOpen={() => openWorkspace(project.id)}
                  onDelete={handleDeleteWorkflow}
                  onRename={handleRenameWorkflow}
                />
              ))
            ) : (
              <div className="col-span-full py-12 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--pm-accent-soft)] text-[var(--pm-accent)]">
                    <PlusIcon />
                  </div>
                </div>
                <p className="text-lg font-medium text-[var(--pm-text)]">
                  还没有项目
                </p>
                <p className="mt-2 text-sm text-[var(--pm-text-muted)]">
                  点击下方按钮创建你的第一个项目
                </p>
              </div>
            )}

            <article
              role="button"
              tabIndex={0}
              onClick={handleCreateWorkflow}
              onKeyDown={(event) => handleEnterOpen(event, handleCreateWorkflow)}
              className="group flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-[var(--pm-border)] bg-[var(--pm-surface)] p-6 text-center shadow-[var(--pm-shadow)] transition duration-200 hover:border-[var(--pm-accent)] hover:bg-[var(--pm-accent-soft)]"
            >
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--pm-accent-soft)] text-[var(--pm-accent)] transition group-hover:scale-105">
                <PlusIcon />
              </div>
              <p className="text-base font-medium">新建项目</p>
              <p className="mt-2 text-sm leading-6 text-[var(--pm-text-muted)]">
                点击创建新项目
              </p>
            </article>
          </section>

          <footer className="mt-8 flex flex-col gap-3 rounded-[24px] border border-[var(--pm-border)] bg-[var(--pm-surface)] px-5 py-4 text-sm text-[var(--pm-text-muted)] shadow-[var(--pm-shadow)] md:flex-row md:items-center md:justify-between">
            <p>项目数据从后端实时获取，点击项目卡片可进入工作区编辑。</p>
            <div className="flex items-center gap-3">
              <Link
                href="/workspace"
                className="rounded-xl border border-white/8 bg-black/10 px-3 py-2 text-white/85 transition hover:border-white/15 hover:bg-black/20"
              >
                工作区
              </Link>
              <Link
                href="/settings"
                className="rounded-xl border border-white/8 bg-black/10 px-3 py-2 text-white/85 transition hover:border-white/15 hover:bg-black/20"
              >
                设置
              </Link>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}

function ProjectCard({
  project,
  onOpen,
  onDelete,
  onRename,
}: {
  project: ProjectSummary;
  onOpen: () => void;
  onDelete?: (projectId: string, newName: string) => void;
  onRename?: (projectId: string, newName: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(project.name);
  const inputRef = useRef<HTMLInputElement>(null);

  // 开始编辑时聚焦输入框
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // 开始编辑
  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditName(project.name);
    setIsEditing(true);
  };

  // 保存编辑
  const handleSave = () => {
    const trimmedName = editName.trim();
    if (trimmedName && trimmedName !== project.name) {
      onRename?.(project.id, trimmedName);
    }
    setIsEditing(false);
  };

  // 取消编辑
  const handleCancel = () => {
    setEditName(project.name);
    setIsEditing(false);
  };

  // 按键处理
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
    // 阻止事件冒泡，避免触发卡片点击
    e.stopPropagation();
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => !isEditing && handleEnterOpen(event, onOpen)}
      className="group cursor-pointer rounded-[24px] border border-[var(--pm-border)] bg-[var(--pm-surface)] p-5 shadow-[var(--pm-shadow)] transition duration-200 hover:border-[var(--pm-accent-border)] hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="w-full truncate rounded border border-[var(--pm-accent)] bg-[var(--pm-surface)] px-2 py-1 text-base font-semibold text-[var(--pm-text)] outline-none"
            />
          ) : (
            <h2 
              onClick={handleStartEdit}
              className="truncate text-base font-semibold text-[var(--pm-text)] cursor-text"
            >
              {project.name}
            </h2>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
          {!isEditing && (
            <>
              <CardActionButton 
                label="编辑" 
                icon={<EditIcon />} 
                onClick={handleStartEdit}
              />
              <CardActionButton 
                danger 
                label="删除" 
                icon={<TrashIcon />} 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(project.id, project.name);
                }}
              />
            </>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-1 text-sm text-[var(--pm-text-muted)]">
        <p>{project.updatedAtLabel}</p>
        <p>{project.createdAtLabel}</p>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-[var(--pm-accent-soft)] px-3 py-1 text-xs font-medium text-[var(--pm-accent)]">
          {project.nodeCount} 个节点
        </span>
      </div>
    </article>
  );
}

function GhostIconButton({
  icon,
  label,
  onClick,
  title,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={label}
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-transparent text-[var(--pm-text)] transition hover:bg-[color-mix(in_srgb,var(--pm-text)_8%,transparent)]"
    >
      {icon}
    </button>
  );
}

function CardActionButton({
  danger = false,
  icon,
  label,
  onClick,
}: {
  danger?: boolean;
  icon: React.ReactNode;
  label: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-xl transition ${
        danger
          ? "text-red-400 hover:bg-red-500/10"
          : "text-[var(--pm-text-muted)] hover:bg-white/6 hover:text-[var(--pm-text)]"
      }`}
    >
      {icon}
    </button>
  );
}

function handleEnterOpen(event: KeyboardEvent<HTMLElement>, onOpen: () => void) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onOpen();
  }
}

function LanguageIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 8 6 6" />
      <path d="m4 14 6-6 2-3" />
      <path d="M2 5h12" />
      <path d="M7 2h1" />
      <path d="m22 22-5-10-5 10" />
      <path d="M14 18h6" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15.5 7.5 19 4" />
      <path d="m12.5 10.5 2-2" />
      <path d="m9.5 13.5 2-2" />
      <path d="m6.5 16.5 2-2" />
      <path d="M2 22 6.5 17.5" />
      <path d="M12 17.5 17.5 12" />
      <path d="M22 2 17.5 6.5" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}
