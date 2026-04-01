"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  modelsConfigService,
  type ModelCategory,
  type ModelsConfigCategoryItem,
  type ModelsConfigModelItem,
} from "@/core/api";

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ToastState {
  modelKey: string;
  tone: "success" | "error";
  text: string;
}

const PREVIEW_TABS: ModelsConfigCategoryItem[] = [{ key: "chat", label: "Chat", count: 0 }];

function CloseIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

function EyeIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m3 3 18 18" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.88 5.09A9.8 9.8 0 0 1 12 5c4.48 0 8.27 2.94 9.54 7a9.78 9.78 0 0 1-4.16 5.26" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6.61 6.61A9.76 9.76 0 0 0 2.46 12c1.27 4.06 5.06 7 9.54 7 1.67 0 3.24-.41 4.61-1.13" />
      </svg>
    );
  }

  return (
    <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.46 12C3.73 7.94 7.52 5 12 5s8.27 2.94 9.54 7c-1.27 4.06-5.06 7-9.54 7S3.73 16.06 2.46 12Z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.83 10.17a4 4 0 0 0-5.66 0l-4 4a4 4 0 1 0 5.66 5.66l1.1-1.1" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.17 13.83a4 4 0 0 0 5.66 0l4-4a4 4 0 0 0-5.66-5.66l-1.1 1.1" />
    </svg>
  );
}

function isTextEntryElement(target: EventTarget | null): target is HTMLInputElement | HTMLTextAreaElement {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
}

export function ApiSettingsModal({ isOpen, onClose }: ApiSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<ModelCategory>("chat");
  const [tabs, setTabs] = useState<ModelsConfigCategoryItem[]>(PREVIEW_TABS);
  const [models, setModels] = useState<ModelsConfigModelItem[]>([]);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testingModelKey, setTestingModelKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;

    const loadSettings = async () => {
      setActiveTab("chat");
      setMessage(null);
      setToast(null);
      setShowSecrets({});
      setTestingModelKey(null);

      if (!modelsConfigService.isAvailable()) {
        setTabs(PREVIEW_TABS);
        setModels([]);
        return;
      }

      setIsLoading(true);

      try {
        const snapshot = await modelsConfigService.list();
        const nextTabs = snapshot.categories.length > 0 ? snapshot.categories : PREVIEW_TABS;
        const nextActiveTab =
          nextTabs.find((item) => item.key === "chat")?.key ??
          nextTabs[0]?.key ??
          "chat";

        if (!cancelled) {
          setTabs(nextTabs);
          setModels(snapshot.models);
          setActiveTab(nextActiveTab);
        }
      } catch (error) {
        if (!cancelled) {
          setTabs(PREVIEW_TABS);
          setModels([]);
          setMessage(error instanceof Error ? error.message : "加载 API 设置失败");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const visibleModels = models.filter((model) => model.category === activeTab);

  const updateModelField = (
    modelKey: string,
    field: "model_id" | "api_key" | "base_url",
    value: string
  ) => {
    setModels((prev) =>
      prev.map((model) =>
        model.key === modelKey
          ? {
              ...model,
              [field]: value,
            }
          : model
      )
    );
  };

  const toggleSecretVisibility = (key: string) => {
    setShowSecrets((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleFormKeyDownCapture = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isTextEntryElement(event.target)) {
      return;
    }

    if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "a") {
      return;
    }

    if (event.target.disabled || event.target.readOnly) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const target = event.target;
    window.requestAnimationFrame(() => {
      target.focus();
      target.setSelectionRange(0, target.value.length);
    });
  }, []);

  const showToast = useCallback((nextToast: ToastState) => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }

    setToast(nextToast);
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 2000);
  }, []);

  const handleRequestClose = useCallback(async () => {
    if (isSaving) {
      return;
    }

    if (!modelsConfigService.isAvailable()) {
      onClose();
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      await modelsConfigService.save({
        models: models.map((model) => ({
          key: model.key,
          model_id: model.model_id.trim(),
          api_key: model.api_key.trim(),
          base_url: model.base_url.trim(),
        })),
      });
      onClose();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存 API 设置失败");
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, models, onClose]);

  const handleTestConnection = useCallback(async (model: ModelsConfigModelItem) => {
    if (testingModelKey || isSaving || isLoading) {
      return;
    }

    setTestingModelKey(model.key);

    try {
      const result = await modelsConfigService.testConnection({
        key: model.key,
        api_key: model.api_key.trim(),
        base_url: model.base_url.trim(),
      });
      showToast({
        modelKey: model.key,
        tone: result.ok ? "success" : "error",
        text: result.ok ? "连接成功" : "连接失败",
      });
    } catch {
      showToast({
        modelKey: model.key,
        tone: "error",
        text: "连接失败",
      });
    } finally {
      setTestingModelKey(null);
    }
  }, [isLoading, isSaving, showToast, testingModelKey]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        void handleRequestClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleRequestClose, isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          void handleRequestClose();
        }
      }}
    >
      <div
        className="flex h-[85vh] max-h-[850px] w-full max-w-[800px] select-text flex-col overflow-hidden rounded-xl border border-zinc-800 bg-[#121212] shadow-2xl"
        onKeyDownCapture={handleFormKeyDownCapture}
      >
        <div className="flex items-center justify-between px-6 py-[18px]">
          <h2 className="text-[16px] font-medium tracking-wide text-zinc-100">模型接口配置</h2>
          <button
            type="button"
            className="text-zinc-500 transition-colors hover:text-zinc-300"
            onClick={() => {
              void handleRequestClose();
            }}
            aria-label="关闭模型接口配置"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex select-none border-b border-zinc-800/80 px-6 text-[14px]">
          {tabs.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                type="button"
                className={`relative top-[1px] flex items-center gap-2 px-4 py-3 transition-colors ${
                  isActive
                    ? "border-b-2 border-blue-500 text-blue-400"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                <span>{tab.label}</span>
                {typeof tab.count === "number" && (
                  <span
                    className={`rounded px-1.5 py-0.5 text-[12px] font-medium ${
                      isActive ? "bg-[#1e293b] text-blue-300" : "bg-[#222] text-zinc-300"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col gap-4">
            {visibleModels.length > 0 ? (
              visibleModels.map((model) => {
                const secretToggleKey = `model:${model.key}`;
                const badge = getCategoryBadge(model.category);

                return (
                  <div key={model.key} className="flex flex-col gap-5 rounded-xl border border-zinc-800/80 bg-[#161618] p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="h-2 w-2 rounded-full bg-zinc-500" />
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[15px] font-medium text-zinc-200">{model.display_name}</span>
                          <span className="text-[12px] text-zinc-500">{model.provider}</span>
                        </div>
                      </div>
                      <span className={`rounded-md px-2.5 py-0.5 text-[12px] font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-[84px_1fr] items-center gap-y-3.5">
                      <label className="pr-4 text-right text-[12px] text-zinc-500">MODEL ID</label>
                      <input
                        type="text"
                        value={model.model_id}
                        onChange={(event) => updateModelField(model.key, "model_id", event.target.value)}
                        disabled={isLoading || isSaving}
                        className="w-full select-text rounded-lg border border-zinc-700/40 bg-[#1e1e20] px-3 py-2 text-[14px] text-zinc-300 outline-none transition-colors focus:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-70"
                      />

                      <label className="pr-4 text-right text-[12px] text-zinc-500">API KEY</label>
                      <div className="relative w-full">
                        <input
                          type={showSecrets[secretToggleKey] ? "text" : "password"}
                          value={model.api_key}
                          onChange={(event) => updateModelField(model.key, "api_key", event.target.value)}
                          disabled={isLoading || isSaving}
                          placeholder="sk-..."
                          className="w-full select-text rounded-lg border border-zinc-700/40 bg-[#1e1e20] py-2 pl-3 pr-10 text-[14px] text-zinc-300 outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-70"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-300"
                          onClick={() => toggleSecretVisibility(secretToggleKey)}
                          aria-label={showSecrets[secretToggleKey] ? `隐藏 ${model.display_name} API Key` : `显示 ${model.display_name} API Key`}
                        >
                          <EyeIcon visible={Boolean(showSecrets[secretToggleKey])} />
                        </button>
                      </div>

                      <label className="pr-4 text-right text-[12px] text-zinc-500">BASE URL</label>
                      <input
                        type="text"
                        value={model.base_url}
                        onChange={(event) => updateModelField(model.key, "base_url", event.target.value)}
                        disabled={isLoading || isSaving}
                        className="w-full select-text rounded-lg border border-zinc-700/40 bg-[#1e1e20] px-3 py-2 text-[14px] text-zinc-300 outline-none transition-colors focus:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-70"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="min-h-[20px] text-[12px]">
                        {toast?.modelKey === model.key ? (
                          <span
                            className={
                              toast.tone === "success"
                                ? "text-emerald-300"
                                : "text-rose-300"
                            }
                          >
                            {toast.text}
                          </span>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          void handleTestConnection(model);
                        }}
                        disabled={isLoading || isSaving || testingModelKey === model.key}
                        className="flex items-center gap-1.5 text-[13px] text-zinc-400 transition-colors hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <LinkIcon />
                        <span>{testingModelKey === model.key ? "测试中..." : "测试连接"}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-800 bg-[#151517] px-5 py-10 text-center text-sm text-zinc-500">
                当前仅初始化 Chat 模型配置；新增模型时请先在后端 registry 中注册，再通过数据库加载运行时配置。
              </div>
            )}
          </div>
        </div>

        <div className="relative z-10 flex shrink-0 items-center justify-between border-t border-zinc-800/80 bg-[#121212] px-6 py-4 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.1)]">
          <div className="text-[12px] text-zinc-500">
            {message
              ? message
              : modelsConfigService.isAvailable()
                ? "关闭弹窗时会自动保存 API 设置到数据库。"
                : "当前为预览模式，未连接数据库接口。"}
          </div>
          <button
            type="button"
            onClick={() => {
              void handleRequestClose();
            }}
            disabled={isSaving}
            className="rounded-md border border-zinc-700/50 bg-[#2a2a2b] px-6 py-2 text-[14px] font-medium text-zinc-200 transition-colors hover:bg-[#3f3f41] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? "保存中..." : "关闭"}
          </button>
        </div>
      </div>
    </div>
  );
}

function getCategoryBadge(category: ModelCategory): { label: string; className: string } {
  switch (category) {
    case "image":
      return { label: "Image", className: "bg-[#2a1f13] text-amber-300" };
    case "video":
      return { label: "Video", className: "bg-[#3b224c] text-[#c78df6]" };
    case "chat":
    default:
      return { label: "Chat", className: "bg-[#1f2937] text-cyan-300" };
  }
}
