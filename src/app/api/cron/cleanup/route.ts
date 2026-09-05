import { NextRequest, NextResponse } from "next/server";
import { purgeAllExpiredRooms } from "@/lib/supabase/store";
import { ApiResponse } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest
): Promise<NextResponse<ApiResponse<{ deletedRoomsCount: number }>>> {
  try {
    const result = await purgeAllExpiredRooms();
    return NextResponse.json({ data: result, error: null }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to purge expired rooms";
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}
