import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/features/theme/theme-context";

export const metadata: Metadata = {
  title: "分镜助手",
  description: "基于 Next.js 与 Electron 桌面壳规划的分镜项目管理界面原型。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
