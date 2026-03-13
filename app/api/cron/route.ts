import { NextResponse } from "next/server";
import { tick } from "@/lib/core/poller";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await tick();
    return NextResponse.json({ ok: true, time: new Date().toISOString() });
  } catch (error) {
    console.error("[check-cx] cron tick failed", error);
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}
