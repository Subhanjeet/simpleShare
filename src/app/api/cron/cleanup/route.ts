import { NextRequest, NextResponse } from "next/server";
import { purgeAllExpiredRooms } from "@/lib/supabase/store";
import { ApiResponse } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<{ deletedRoomsCount: number }>>> {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // In dev allow request if secret matches query param
      const urlSecret = req.nextUrl.searchParams.get("secret");
      if (urlSecret !== cronSecret) {
        return NextResponse.json({ data: null, error: "Unauthorized cron execution request" }, { status: 401 });
      }
    }

    const { deletedRoomsCount } = await purgeAllExpiredRooms();

    return NextResponse.json(
      {
        data: { deletedRoomsCount },
        error: null,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error executing cleanup cron job";
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}
