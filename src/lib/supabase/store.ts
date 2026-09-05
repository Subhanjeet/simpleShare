import { getSupabaseAdmin } from "./server";
import { ShareRoom, SharedFile } from "@/types";
import { generateRoomCode } from "@/lib/utils/format";

// In-Memory Fallback Storage for local testing without Supabase credentials
const memoryRooms = new Map<string, ShareRoom>();
const memoryFiles = new Map<string, { buffer: Buffer; metadata: SharedFile }>();

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && !url.includes("placeholder") && !url.includes("xyz-simpleshare-mock") && key && !key.includes("mock"));
}

export async function createRoomInStore(
  uploaderName: string,
  filesData: { originalName: string; mimeType: string; fileSize: number; contentBuffer?: Buffer }[]
): Promise<{ room: ShareRoom; files: SharedFile[] }> {
  const code = generateRoomCode();
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // Exactly 7 days

  if (!isSupabaseConfigured()) {
    // In-memory fallback mode
    const roomId = `room-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const createdFiles: SharedFile[] = [];

    for (const f of filesData) {
      const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const storagePath = `${code}/${fileId}-${f.originalName}`;
      const fileMeta: SharedFile = {
        id: fileId,
        room_id: roomId,
        original_name: f.originalName,
        storage_path: storagePath,
        file_size: f.fileSize,
        mime_type: f.mimeType,
        created_at: createdAt,
        download_url: `/api/rooms/${code}/download/${fileId}`,
      };

      if (f.contentBuffer) {
        memoryFiles.set(fileId, { buffer: f.contentBuffer, metadata: fileMeta });
      }
      createdFiles.push(fileMeta);
    }

    const room: ShareRoom = {
      id: roomId,
      room_code: code,
      created_at: createdAt,
      expires_at: expiresAt,
      status: "active",
      uploader_name: uploaderName || "Subhan",
      files: createdFiles,
    };

    memoryRooms.set(code, room);
    return { room, files: createdFiles };
  }

  // Real Supabase PostgreSQL + Storage integration
  const supabase = getSupabaseAdmin();
  const { data: roomData, error: roomError } = await supabase
    .from("share_rooms")
    .insert({
      room_code: code,
      created_at: createdAt,
      expires_at: expiresAt,
      status: "active",
      uploader_name: uploaderName || "Subhan",
    })
    .select()
    .single();

  if (roomError || !roomData) {
    throw new Error(`Failed to create room in Supabase: ${roomError?.message || "Unknown error"}`);
  }

  const createdFiles: SharedFile[] = [];

  for (const f of filesData) {
    const fileId = crypto.randomUUID();
    const storagePath = `${code}/${fileId}-${f.originalName}`;

    // Upload to Supabase Storage bucket 'simpleshare-files'
    if (f.contentBuffer) {
      const { error: uploadError } = await supabase.storage
        .from("simpleshare-files")
        .upload(storagePath, f.contentBuffer, {
          contentType: f.mimeType,
          upsert: true,
        });

      if (uploadError) {
        console.error("Supabase Storage Upload Error:", uploadError);
      }
    }

    // Insert database record
    const { data: fileData, error: fileError } = await supabase
      .from("shared_files")
      .insert({
        id: fileId,
        room_id: roomData.id,
        original_name: f.originalName,
        storage_path: storagePath,
        file_size: f.fileSize,
        mime_type: f.mimeType,
        created_at: createdAt,
      })
      .select()
      .single();

    if (fileData) {
      createdFiles.push({
        ...fileData,
        download_url: `/api/rooms/${code}/download/${fileData.id}`,
      });
    }
  }

  return {
    room: { ...roomData, files: createdFiles },
    files: createdFiles,
  };
}

export async function getRoomByCodeFromStore(code: string): Promise<ShareRoom | null> {
  const uppercaseCode = code.toUpperCase().trim();

  if (!isSupabaseConfigured()) {
    const room = memoryRooms.get(uppercaseCode);
    if (!room) return null;

    // Check expiration
    if (new Date(room.expires_at).getTime() <= Date.now()) {
      memoryRooms.delete(uppercaseCode);
      return null; // Expired
    }
    return room;
  }

  const supabase = getSupabaseAdmin();

  // Clean up inline if past expiration
  const { data: room, error: roomError } = await supabase
    .from("share_rooms")
    .select("*")
    .eq("room_code", uppercaseCode)
    .single();

  if (roomError || !room) return null;

  if (new Date(room.expires_at).getTime() <= Date.now() || room.status === "expired") {
    // Purge expired room immediately
    await deleteExpiredRoomFromStore(room.id, uppercaseCode);
    return null;
  }

  // Fetch associated files
  const { data: files } = await supabase
    .from("shared_files")
    .select("*")
    .eq("room_id", room.id);

  const formattedFiles = (files || []).map((f) => ({
    ...f,
    download_url: `/api/rooms/${uppercaseCode}/download/${f.id}`,
  }));

  return {
    ...room,
    files: formattedFiles,
  };
}

export async function getFileContentFromStore(code: string, fileId: string): Promise<{ buffer: Buffer; fileName: string; mimeType: string } | null> {
  const room = await getRoomByCodeFromStore(code);
  if (!room) return null;

  const targetFile = room.files?.find((f) => f.id === fileId);
  if (!targetFile) return null;

  if (!isSupabaseConfigured()) {
    const memoryItem = memoryFiles.get(fileId);
    if (!memoryItem) return null;
    return {
      buffer: memoryItem.buffer,
      fileName: targetFile.original_name,
      mimeType: targetFile.mime_type,
    };
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from("simpleshare-files")
    .download(targetFile.storage_path);

  if (error || !data) {
    console.error("Storage download error:", error);
    return null;
  }

  const arrayBuffer = await data.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    fileName: targetFile.original_name,
    mimeType: targetFile.mime_type,
  };
}

export async function deleteExpiredRoomFromStore(roomId: string, code: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const room = memoryRooms.get(code);
    if (room) {
      if (room.files) {
        for (const f of room.files) {
          memoryFiles.delete(f.id);
        }
      }
      memoryRooms.delete(code);
    }
    return;
  }

  const supabase = getSupabaseAdmin();

  // Get files to delete storage paths
  const { data: files } = await supabase.from("shared_files").select("storage_path").eq("room_id", roomId);
  if (files && files.length > 0) {
    const paths = files.map((f) => f.storage_path);
    await supabase.storage.from("simpleshare-files").remove(paths);
  }

  // Delete DB record (cascade deletes files)
  await supabase.from("share_rooms").delete().eq("id", roomId);
}

export async function purgeAllExpiredRooms(): Promise<{ deletedRoomsCount: number }> {
  let count = 0;
  const now = new Date().getTime();

  if (!isSupabaseConfigured()) {
    for (const [code, room] of Array.from(memoryRooms.entries())) {
      if (new Date(room.expires_at).getTime() <= now || room.status === "expired") {
        if (room.files) {
          for (const f of room.files) {
            memoryFiles.delete(f.id);
          }
        }
        memoryRooms.delete(code);
        count++;
      }
    }
    return { deletedRoomsCount: count };
  }

  const supabase = getSupabaseAdmin();
  const { data: expiredRooms } = await supabase
    .from("share_rooms")
    .select("id, room_code")
    .lte("expires_at", new Date().toISOString());

  if (expiredRooms && expiredRooms.length > 0) {
    for (const r of expiredRooms) {
      await deleteExpiredRoomFromStore(r.id, r.room_code);
      count++;
    }
  }

  return { deletedRoomsCount: count };
}
