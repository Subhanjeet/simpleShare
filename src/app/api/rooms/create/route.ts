import { NextRequest, NextResponse } from "next/server";
import { createRoomSchema, getLimitsFromEnv } from "@/lib/validation/room";
import { createRoomInStore } from "@/lib/supabase/store";
import { ApiResponse, ShareRoom } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<{ room: ShareRoom }>>> {
  try {
    const formData = await req.formData();
    const uploaderName = (formData.get("uploaderName") as string) || "Subhan";
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ data: null, error: "No files provided for upload" }, { status: 400 });
    }

    const limits = getLimitsFromEnv();

    if (files.length > limits.maxFilesPerRoom) {
      return NextResponse.json({ data: null, error: `Maximum ${limits.maxFilesPerRoom} files per room allowed.` }, { status: 400 });
    }

    let totalSize = 0;
    const fileItemsData = [];

    for (const file of files) {
      if (file.size > limits.maxFileSizeMB * 1024 * 1024) {
        return NextResponse.json({ data: null, error: `File "${file.name}" exceeds the maximum individual limit of ${limits.maxFileSizeMB} MB.` }, { status: 400 });
      }
      totalSize += file.size;

      const arrayBuffer = await file.arrayBuffer();
      const contentBuffer = Buffer.from(arrayBuffer);

      fileItemsData.push({
        originalName: file.name,
        mimeType: file.type || "application/octet-stream",
        fileSize: file.size,
        contentBuffer,
      });
    }

    if (totalSize > limits.maxTotalSizeMB * 1024 * 1024) {
      return NextResponse.json({ data: null, error: `Total upload size exceeds the maximum room threshold of ${limits.maxTotalSizeMB} MB.` }, { status: 400 });
    }

    // Validate metadata schema
    const validation = createRoomSchema.safeParse({
      uploaderName,
      files: fileItemsData.map((f) => ({ name: f.originalName, size: f.fileSize, type: f.mimeType })),
    });

    if (!validation.success) {
      return NextResponse.json({ data: null, error: validation.error.errors[0]?.message || "Invalid upload parameters" }, { status: 400 });
    }

    const { room } = await createRoomInStore(uploaderName, fileItemsData);

    return NextResponse.json({ data: { room }, error: null }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected server error occurred";
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}
