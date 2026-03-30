import { ProjectManagerScreen } from "@/features/project-manager/components/project-manager-screen";

// 强制动态渲染，避免使用缓存
export const dynamic = "force-dynamic";

export default function HomePage() {
  return <ProjectManagerScreen />;
}
