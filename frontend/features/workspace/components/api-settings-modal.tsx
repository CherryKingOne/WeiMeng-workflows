"use client";

import { useCallback, useEffect, useState } from "react";
import { settingsService } from "@/core/api";

type ApiTab = "chat" | "image" | "video" | "music";

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ApiModelDefinition {
  key: string;
  name: string;
  tab: ApiTab;
  badgeLabel: string;
  badgeClassName: string;
  defaultModelId: string;
  defaultBaseUrl: string;
}

interface ApiModelFormValue {
  modelId: string;
  apiKey: string;
  baseUrl: string;
}

interface ApiSettingsFormState {
  models: Record<string, ApiModelFormValue>;
}

const API_TABS: Array<{ key: ApiTab; label: string; count?: number }> = [
  { key: "chat", label: "Chat", count: 20 },
  { key: "image", label: "Image", count: 14 },
  { key: "video", label: "Video", count: 29 },
  { key: "music", label: "Music", count: 6 },
];

const MODEL_DEFINITIONS: ApiModelDefinition[] = [
  {
    key: "gpt_4_1",
    name: "GPT-4.1",
    tab: "chat",
    badgeLabel: "Chat",
    badgeClassName: "bg-[#1f2937] text-cyan-300",
    defaultModelId: "gpt-4.1",
    defaultBaseUrl: "https://api.openai.com/v1",
  },
  {
    key: "deepseek_v3",
    name: "DeepSeek V3",
    tab: "chat",
    badgeLabel: "Chat",
    badgeClassName: "bg-[#1f2937] text-cyan-300",
    defaultModelId: "deepseek-chat",
    defaultBaseUrl: "https://api.deepseek.com/v1",
  },
  {
    key: "gpt_image_1",
    name: "GPT Image 1",
    tab: "image",
    badgeLabel: "Image",
    badgeClassName: "bg-[#2a1f13] text-amber-300",
    defaultModelId: "gpt-image-1",
    defaultBaseUrl: "https://api.openai.com/v1",
  },
  {
    key: "flux_pro",
    name: "Flux Pro",
    tab: "image",
    badgeLabel: "Image",
    badgeClassName: "bg-[#2a1f13] text-amber-300",
    defaultModelId: "flux-pro",
    defaultBaseUrl: "https://api.comfly.chat/v1",
  },
  {
    key: "sora_2",
    name: "Sora 2",
    tab: "video",
    badgeLabel: "Video",
    badgeClassName: "bg-[#3b224c] text-[#c78df6]",
    defaultModelId: "sora-2",
    defaultBaseUrl: "https://ai.comfly.chat",
  },
  {
    key: "sora_2_pro",
    name: "Sora 2 Pro",
    tab: "video",
    badgeLabel: "Video",
    badgeClassName: "bg-[#3b224c] text-[#c78df6]",
    defaultModelId: "sora-2-pro",
    defaultBaseUrl: "https://ai.comfly.chat",
  },
  {
    key: "suno_v4",
    name: "Suno v4",
    tab: "music",
    badgeLabel: "Music",
    badgeClassName: "bg-[#1c2b20] text-emerald-300",
    defaultModelId: "suno-v4",
    defaultBaseUrl: "https://api.comfly.chat/v1",
  },
  {
    key: "udio_1_5",
    name: "Udio 1.5",
    tab: "music",
    badgeLabel: "Music",
    badgeClassName: "bg-[#1c2b20] text-emerald-300",
    defaultModelId: "udio-1.5",
    defaultBaseUrl: "https://api.comfly.chat/v1",
  },
];

function getSettingKey(key: string) {
  return `api_settings.${key}`;
}

function buildDefaultFormState(): ApiSettingsFormState {
  return {
    models: MODEL_DEFINITIONS.reduce<Record<string, ApiModelFormValue>>((acc, model) => {
      acc[model.key] = {
        modelId: model.defaultModelId,
        apiKey: "",
        baseUrl: model.defaultBaseUrl,
      };
      return acc;
    }, {}),
  };
}

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

export function ApiSettingsModal({ isOpen, onClose }: ApiSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<ApiTab>("chat");
  const [formState, setFormState] = useState<ApiSettingsFormState>(() => buildDefaultFormState());
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;

    const loadSettings = async () => {
      setActiveTab("chat");
      setMessage(null);
      setShowSecrets({});

      if (!settingsService.isAvailable()) {
        setFormState(buildDefaultFormState());
        return;
      }

      setIsLoading(true);

      try {
        const settings = await settingsService.list();
        const settingsMap = new Map(settings.map((item) => [item.key, item.value]));
        const defaults = buildDefaultFormState();

        const nextState: ApiSettingsFormState = {
          models: { ...defaults.models },
        };

        MODEL_DEFINITIONS.forEach((model) => {
          nextState.models[model.key] = {
            modelId: settingsMap.get(getSettingKey(`${model.key}.model_id`)) ?? defaults.models[model.key].modelId,
            apiKey: settingsMap.get(getSettingKey(`${model.key}.api_key`)) ?? defaults.models[model.key].apiKey,
            baseUrl: settingsMap.get(getSettingKey(`${model.key}.base_url`)) ?? defaults.models[model.key].baseUrl,
          };
        });

        if (!cancelled) {
          setFormState(nextState);
        }
      } catch (error) {
        if (!cancelled) {
          setFormState(buildDefaultFormState());
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

  const visibleModels = MODEL_DEFINITIONS.filter((model) => model.tab === activeTab);

  const updateModelField = (modelKey: string, field: keyof ApiModelFormValue, value: string) => {
    setFormState((prev) => ({
      ...prev,
      models: {
        ...prev.models,
        [modelKey]: {
          ...prev.models[modelKey],
          [field]: value,
        },
      },
    }));
  };

  const toggleSecretVisibility = (key: string) => {
    setShowSecrets((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleRequestClose = useCallback(async () => {
    if (isSaving) {
      return;
    }

    if (!settingsService.isAvailable()) {
      onClose();
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const updates = [
        ...MODEL_DEFINITIONS.flatMap((model) => {
          const value = formState.models[model.key];
          return [
            settingsService.update({
              key: getSettingKey(`${model.key}.model_id`),
              value: value.modelId.trim(),
            }),
            settingsService.update({
              key: getSettingKey(`${model.key}.api_key`),
              value: value.apiKey.trim(),
            }),
            settingsService.update({
              key: getSettingKey(`${model.key}.base_url`),
              value: value.baseUrl.trim(),
            }),
          ];
        }),
      ];

      await Promise.all(updates);
      onClose();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存 API 设置失败");
    } finally {
      setIsSaving(false);
    }
  }, [formState, isSaving, onClose]);

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
      <div className="flex h-[85vh] max-h-[850px] w-full max-w-[800px] flex-col overflow-hidden rounded-xl border border-zinc-800 bg-[#121212] shadow-2xl">
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
          {API_TABS.map((tab) => {
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
                const modelValue = formState.models[model.key];
                const secretToggleKey = `model:${model.key}`;

                return (
                  <div key={model.key} className="flex flex-col gap-5 rounded-xl border border-zinc-800/80 bg-[#161618] p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="h-2 w-2 rounded-full bg-zinc-500" />
                        <span className="text-[15px] font-medium text-zinc-200">{model.name}</span>
                      </div>
                      <span className={`rounded-md px-2.5 py-0.5 text-[12px] font-medium ${model.badgeClassName}`}>
                        {model.badgeLabel}
                      </span>
                    </div>

                    <div className="grid grid-cols-[84px_1fr] items-center gap-y-3.5">
                      <label className="pr-4 text-right text-[12px] text-zinc-500">MODEL ID</label>
                      <input
                        type="text"
                        value={modelValue.modelId}
                        onChange={(event) => updateModelField(model.key, "modelId", event.target.value)}
                        disabled={isLoading || isSaving}
                        className="w-full rounded-lg border border-zinc-700/40 bg-[#1e1e20] px-3 py-2 text-[14px] text-zinc-300 outline-none transition-colors focus:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-70"
                      />

                      <label className="pr-4 text-right text-[12px] text-zinc-500">API KEY</label>
                      <div className="relative w-full">
                        <input
                          type={showSecrets[secretToggleKey] ? "text" : "password"}
                          value={modelValue.apiKey}
                          onChange={(event) => updateModelField(model.key, "apiKey", event.target.value)}
                          disabled={isLoading || isSaving}
                          placeholder="sk-..."
                          className="w-full rounded-lg border border-zinc-700/40 bg-[#1e1e20] py-2 pl-3 pr-10 text-[14px] text-zinc-300 outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-70"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-300"
                          onClick={() => toggleSecretVisibility(secretToggleKey)}
                          aria-label={showSecrets[secretToggleKey] ? `隐藏 ${model.name} API Key` : `显示 ${model.name} API Key`}
                        >
                          <EyeIcon visible={Boolean(showSecrets[secretToggleKey])} />
                        </button>
                      </div>

                      <label className="pr-4 text-right text-[12px] text-zinc-500">BASE URL</label>
                      <input
                        type="text"
                        value={modelValue.baseUrl}
                        onChange={(event) => updateModelField(model.key, "baseUrl", event.target.value)}
                        disabled={isLoading || isSaving}
                        className="w-full rounded-lg border border-zinc-700/40 bg-[#1e1e20] px-3 py-2 text-[14px] text-zinc-300 outline-none transition-colors focus:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-70"
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <button type="button" className="flex items-center gap-1.5 text-[13px] text-zinc-400 transition-colors hover:text-zinc-200">
                        <LinkIcon />
                        <span>测试连接</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-800 bg-[#151517] px-5 py-10 text-center text-sm text-zinc-500">
                当前分类暂未配置示例模型，后续可以继续扩展。
              </div>
            )}
          </div>
        </div>

        <div className="relative z-10 flex shrink-0 items-center justify-between border-t border-zinc-800/80 bg-[#121212] px-6 py-4 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.1)]">
          <div className="text-[12px] text-zinc-500">
            {message
              ? message
              : settingsService.isAvailable()
                ? "关闭弹窗时会自动保存 API 设置。"
                : "当前为预览模式，关闭后不会持久化保存。"}
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
