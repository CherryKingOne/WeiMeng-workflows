"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { settingsService } from "@/core/api";

type ThemeMode = "dark" | "light";

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "weimeng-theme";
const THEME_SETTING_KEY = "theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("dark");
  const [isLoading, setIsLoading] = useState(true);

  // 初始化时从后端读取主题设置
  useEffect(() => {
    const loadTheme = async () => {
      // 优先从 localStorage 读取（快速响应）
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      if (stored === "dark" || stored === "light") {
        setThemeState(stored);
      }

      // 然后尝试从后端读取（持久化存储）
      if (settingsService.isAvailable()) {
        try {
          const settings = await settingsService.list();
          const themeSetting = settings.find((s) => s.key === THEME_SETTING_KEY);
          if (themeSetting?.value === "dark" || themeSetting?.value === "light") {
            setThemeState(themeSetting.value);
            localStorage.setItem(THEME_STORAGE_KEY, themeSetting.value);
          }
        } catch (error) {
          console.error("从后端加载主题设置失败:", error);
        }
      }
      
      setIsLoading(false);
    };

    loadTheme();
  }, []);

  // 主题变化时更新 localStorage 和 document class
  useEffect(() => {
    if (isLoading) return;
    
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme, isLoading]);

  // 保存主题到后端
  const saveThemeToBackend = async (newTheme: ThemeMode) => {
    if (settingsService.isAvailable()) {
      try {
        await settingsService.update({
          key: THEME_SETTING_KEY,
          value: newTheme,
          scope: "user",
        });
      } catch (error) {
        console.error("保存主题到后端失败:", error);
      }
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setThemeState(newTheme);
    saveThemeToBackend(newTheme);
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    saveThemeToBackend(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
