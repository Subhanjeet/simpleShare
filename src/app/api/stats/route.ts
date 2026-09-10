import { NextRequest, NextResponse } from "next/server";
import { getAppStatsFromStore } from "@/lib/supabase/store";
import { ApiResponse, AppStats } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest
): Promise<NextResponse<ApiResponse<AppStats>>> {
  try {
    const stats = await getAppStatsFromStore();
    console.log("[/api/stats GET] Responding with payload:", {
      users: stats.users,
      shares: stats.shares,
      files: stats.files,
      activeFilesLength: stats.activeFiles.length,
      activeSharesLength: stats.activeShares.length,
      recentUsersLength: stats.recentUsers.length,
    });

    return NextResponse.json(
      { data: stats, error: null },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch application statistics";
    console.error("[/api/stats GET Error]:", message);
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}
