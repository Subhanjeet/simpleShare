import { NextRequest, NextResponse } from "next/server";
import { isCodeAvailable } from "@/lib/supabase/store";
import { customCodeSchema } from "@/lib/validation/room";
import { ApiResponse } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest
): Promise<NextResponse<ApiResponse<{ available: boolean; reason?: string }>>> {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { data: { available: false, reason: "Code is required" }, error: null },
        { status: 200 }
      );
    }

    const validation = customCodeSchema.safeParse(code);
    if (!validation.success) {
      return NextResponse.json(
        {
          data: {
            available: false,
            reason: validation.error.errors[0]?.message || "Use 6–20 letters, numbers or hyphens",
          },
          error: null,
        },
        { status: 200 }
      );
    }

    const result = await isCodeAvailable(validation.data);
    return NextResponse.json({ data: result, error: null }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to check code availability";
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}
