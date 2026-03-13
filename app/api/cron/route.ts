import { NextResponse } from "next/server";
import { loadProviderConfigsFromDB } from "@/lib/database/config-loader";
import { runProviderChecks } from "@/lib/providers";
import { historySnapshotStore } from "@/lib/database/history";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * Vercel Cron 触发的健康检测端点
 * 跳过 leadership 选举，直接执行检测
 */
export async function GET() {
  const startTime = Date.now();
  try {
    // 直接加载配置并执行检测，不走 leadership
    const configs = await loadProviderConfigsFromDB();

    if (configs.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "No configs found",
        time: new Date().toISOString(),
      });
    }

    const results = await runProviderChecks(configs);
    await historySnapshotStore.append(results);

    const elapsed = Date.now() - startTime;
    const succeeded = results.filter(
      (r) => r.status === "ok" || r.status === "degraded"
    ).length;
    const failed = results.length - succeeded;

    return NextResponse.json({
      ok: true,
      checked: results.length,
      succeeded,
      failed,
      elapsed: `${elapsed}ms`,
      time: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[check-cx] cron tick failed", error);
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}
