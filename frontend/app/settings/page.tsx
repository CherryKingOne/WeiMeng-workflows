import Link from "next/link";

export default function SettingsPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0f0f0f] px-6 py-10 text-white">
      <section className="w-full max-w-3xl rounded-[28px] border border-white/10 bg-white/[0.04] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <div className="mb-6 inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-200">
          Settings Placeholder
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">设置页占位</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/65">
          当前先为 Electron 设置窗口和后端配置能力预留前端路由。后续接入时，这里会承接
          API Key、模型供应商、存储路径和应用偏好等真实配置项。
        </p>
        <div className="mt-8 rounded-3xl border border-dashed border-white/10 bg-black/20 p-5 text-sm leading-7 text-white/60">
          {/* TODO: 接入 Electron preload bridge，并通过 Python backend 的 IPC 路由读写真实设置。 */}
          预留说明：这里暂时不接真实后端，只保留前端入口与页面壳。
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-2xl bg-blue-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-400"
          >
            返回项目管理
          </Link>
          <Link
            href="/workspace"
            className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-white/80 transition hover:border-white/20 hover:bg-white/[0.06]"
          >
            前往工作区占位页
          </Link>
        </div>
      </section>
    </main>
  );
}
