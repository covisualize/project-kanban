import { NextResponse } from "next/server";

/** GET /api/health — liveness probe used by local checks and future hosting. */
export function GET() {
  return NextResponse.json({ status: "ok" });
}
