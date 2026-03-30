"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  getDownloadDir,
  setDownloadDir,
  getCacheDir,
  setCacheDir,
  selectDirectory,
  clearCache,
} from "@/core/api";
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
    "--pm-shadow": "0 18px 42px rgba(15, 23, 42, 0.12)",
  } as CSSProperties,
};

export default function SettingsPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  // 目录设置状态
  const [downloadDir, setDownloadDirState] = useState("");
  const [cacheDir, setCacheDirState] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [clearMessage, setClearMessage] = useState("");

  // 加载保存的目录设置
  const loadDirectories = useCallback(async () => {
    setIsLoading(true);
    try {
      const [download, cache] = await Promise.all([
        getDownloadDir(),
        getCacheDir(),
      ]);
      setDownloadDirState(download.download_dir);
      setCacheDirState(cache.cache_dir);
    } catch (error) {
      console.error("加载目录设置失败:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDirectories();
  }, [loadDirectories]);

  // 选择下载目录
  const handleSelectDownloadDir = useCallback(async () => {
    try {
      const path = await selectDirectory("选择下载目录");
      if (path) {
        setIsSaving(true);
        await setDownloadDir(path);
        setDownloadDirState(path);
      }
    } catch (error) {
      console.error("设置下载目录失败:", error);
    } finally {
      setIsSaving(false);
    }
  }, []);

  // 选择缓存目录
  const handleSelectCacheDir = useCallback(async () => {
    try {
      const path = await selectDirectory("选择缓存目录");
      if (path) {
        setIsSaving(true);
        await setCacheDir(path);
        setCacheDirState(path);
      }
    } catch (error) {
      console.error("设置缓存目录失败:", error);
    } finally {
      setIsSaving(false);
    }
  }, []);

  // 清理缓存
  const handleClearCache = useCallback(async () => {
    try {
      setIsSaving(true);
      setClearMessage("");
      const result = await clearCache();
      setClearMessage(result.message);
    } catch (error) {
      console.error("清理缓存失败:", error);
      setClearMessage("清理失败");
    } finally {
      setIsSaving(false);
    }
  }, []);

  const openProject = () => {
    router.push("/");
  };

  return (
    <div
      className="flex min-h-screen flex-col bg-[var(--pm-bg)] text-[var(--pm-text)] transition-colors duration-300"
      style={themeStyles[theme]}
    >
      <header
        className="flex h-10 shrink-0 items-center justify-between border-b border-[var(--pm-border)] bg-[var(--pm-surface)]"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        <div className="flex items-center gap-2 px-3" style={{ width: "80px" }}>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <span className="text-sm font-medium text-[var(--pm-text-muted)]">
            设置
          </span>
        </div>
        <div
          className="flex items-center gap-1 px-3"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-transparent text-[var(--pm-text)] transition hover:bg-[color-mix(in_srgb,var(--pm-text)_8%,transparent)]"
            title={theme === "dark" ? "切换到亮色模式" : "切换到暗色模式"}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
          <button
            type="button"
            onClick={openProject}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-transparent text-[var(--pm-text)] transition hover:bg-[color-mix(in_srgb,var(--pm-text)_8%,transparent)]"
            title="返回项目"
          >
            <HomeIcon />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6 sm:p-8">
        <div className="mx-auto w-full max-w-3xl">
          <section className="rounded-[28px] border border-[var(--pm-border)] bg-[var(--pm-surface)] p-8 shadow-[var(--pm-shadow)]">
            <div className="mb-6">
              <h1 className="text-3xl font-semibold tracking-tight">设置</h1>
              <p className="mt-2 text-sm text-[var(--pm-text-muted)]">
                配置应用目录和偏好设置，这些设置会被持久化保存
              </p>
            </div>

            {/* 目录设置 */}
            <div className="mt-8 space-y-6">
              <h2 className="text-lg font-medium">目录设置</h2>
              
              {/* 下载目录 */}
              <div className="rounded-2xl border border-[var(--pm-border)] bg-[var(--pm-surface-soft)] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FolderIcon />
                      <span className="font-medium">下载目录</span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--pm-text-muted)]">
                      导出项目文件保存的目录
                    </p>
                    <p className="mt-2 break-all rounded-lg bg-black/20 px-3 py-2 text-sm font-mono">
                      {isLoading ? "加载中..." : downloadDir || "未设置"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSelectDownloadDir}
                    disabled={isSaving}
                    className="shrink-0 rounded-xl bg-[var(--pm-accent)] px-4 py-2 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-50"
                  >
                    选择目录
                  </button>
                </div>
              </div>

              {/* 缓存目录 */}
              <div className="rounded-2xl border border-[var(--pm-border)] bg-[var(--pm-surface-soft)] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CacheIcon />
                      <span className="font-medium">缓存目录</span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--pm-text-muted)]">
                      临时文件缓存目录，可以手动清理
                    </p>
                    <p className="mt-2 break-all rounded-lg bg-black/20 px-3 py-2 text-sm font-mono">
                      {isLoading ? "加载中..." : cacheDir || "未设置"}
                    </p>
                    {clearMessage && (
                      <p className="mt-2 text-sm text-green-400">{clearMessage}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleSelectCacheDir}
                      disabled={isSaving}
                      className="shrink-0 rounded-xl bg-[var(--pm-accent)] px-4 py-2 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-50"
                    >
                      选择目录
                    </button>
                    <button
                      type="button"
                      onClick={handleClearCache}
                      disabled={isSaving || !cacheDir}
                      className="shrink-0 rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
                    >
                      清理缓存
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 说明 */}
            <div className="mt-8 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">
              <div className="flex items-start gap-3">
                <InfoIcon />
                <div className="text-sm text-[var(--pm-text-muted)]">
                  <p className="font-medium text-blue-400">持久化保存</p>
                  <p className="mt-1">
                    目录设置会保存到本地数据库，即使应用关闭、重启或电脑断电，再次打开后仍会显示之前设置的目录。
                  </p>
                </div>
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-2xl bg-[var(--pm-accent)] px-5 py-3 text-sm font-medium text-white transition hover:brightness-110"
              >
                返回项目管理
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function FolderIcon() {
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
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
    </svg>
  );
}

function CacheIcon() {
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
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}

function InfoIcon() {
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
      className="shrink-0 text-blue-400"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
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

function HomeIcon() {
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
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
