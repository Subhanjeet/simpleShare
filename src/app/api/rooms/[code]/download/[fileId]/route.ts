import { NextRequest, NextResponse } from "next/server";
import { getRoomByCodeFromStore, getFileContentFromStore } from "@/lib/supabase/store";
import JSZip from "jszip";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string; fileId: string } }
): Promise<NextResponse | Response> {
  try {
    const { code, fileId } = params;
    const room = await getRoomByCodeFromStore(code);

    if (!room) {
      return NextResponse.json(
        { data: null, error: "This share room has expired or is invalid. Files are deleted after 7 days." },
        { status: 410 }
      );
    }

    if (fileId === "all") {
      // Download all files as a ZIP archive
      if (!room.files || room.files.length === 0) {
        return NextResponse.json({ data: null, error: "No files found in room" }, { status: 404 });
      }

      const zip = new JSZip();
      for (const file of room.files) {
        const fileContent = await getFileContentFromStore(code, file.id);
        if (fileContent) {
          zip.file(fileContent.fileName, fileContent.buffer);
        }
      }

      const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
      const headers = new Headers();
      headers.set("Content-Type", "application/zip");
      headers.set("Content-Disposition", `attachment; filename="SimpleShare_${code}.zip"`);
      headers.set("Content-Length", zipBuffer.length.toString());

      return new Response(new Uint8Array(zipBuffer), { status: 200, headers });
    }

    // Single file download
    const fileContent = await getFileContentFromStore(code, fileId);
    if (!fileContent) {
      return NextResponse.json({ data: null, error: "File not found or expired" }, { status: 404 });
    }

    const headers = new Headers();
    headers.set("Content-Type", fileContent.mimeType);
    headers.set(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(fileContent.fileName)}"`
    );
    headers.set("Content-Length", fileContent.buffer.length.toString());

    return new Response(new Uint8Array(fileContent.buffer), { status: 200, headers });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to download file";
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}
