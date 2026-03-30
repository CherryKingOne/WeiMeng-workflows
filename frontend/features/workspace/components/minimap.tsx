"use client";

import { useTheme } from "@/features/theme/theme-context";

export function Minimap() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="fixed bottom-4 right-4 z-20">
      <div className={`w-48 h-28 rounded-lg border relative overflow-hidden ${
        isDark
          ? "glass-panel border-white/10"
          : "bg-white/90 border-black/10"
      }`}>
        {/* 小地图背景 */}
        <div className={`absolute inset-0 dot-grid ${isDark ? "opacity-20" : "opacity-30"}`}></div>

        {/* 当前视口框 */}
        <div className={`absolute bottom-2 right-2 w-12 h-8 rounded-sm ${
          isDark
            ? "border border-white/40 bg-white/5"
            : "border border-black/30 bg-black/5"
        }`}></div>
      </div>
    </div>
  );
}
