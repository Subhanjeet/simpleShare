import { NextRequest, NextResponse } from "next/server";
import { roomCodeSchema } from "@/lib/validation/room";
import { getRoomByCodeFromStore } from "@/lib/supabase/store";
import { ApiResponse, ShareRoom } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
): Promise<NextResponse<ApiResponse<{ room: ShareRoom }>>> {
  try {
    const rawCode = params.code;
    const validation = roomCodeSchema.safeParse(rawCode);

    if (!validation.success) {
      return NextResponse.json({ data: null, error: "Invalid room code format" }, { status: 400 });
    }

    const room = await getRoomByCodeFromStore(validation.data);

    if (!room) {
      return NextResponse.json(
        { data: null, error: "This share has expired or does not exist. Files are automatically deleted after 7 days." },
        { status: 410 }
      );
    }

    return NextResponse.json({ data: { room }, error: null }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}
