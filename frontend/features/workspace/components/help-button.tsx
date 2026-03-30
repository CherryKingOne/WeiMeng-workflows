"use client";

import { useTheme } from "@/features/theme/theme-context";

export function HelpButton() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="fixed bottom-4 left-4 z-20">
      <button className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
        isDark
          ? "glass-panel hover:bg-white/10"
          : "bg-white/90 border border-black/10 hover:bg-gray-50"
      }`}>
        <span className={`text-xs ${isDark ? "" : "text-gray-700"}`}>?</span>
      </button>
    </div>
  );
}
