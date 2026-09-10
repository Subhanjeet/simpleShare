import { ShareRoom, SharedFile, ActiveFileItem, ActiveShareItem, UserStatItem, AppStats } from "@/types";
import { generateRoomCode } from "@/lib/utils/format";
import { customCodeSchema } from "@/lib/validation/room";

// Development-only isolated in-memory mock store
const memoryRooms = new Map<string, ShareRoom>();
const memoryFiles = new Map<string, { buffer: Buffer; metadata: SharedFile }>();
const mockPageSessions = new Set<string>();
let mockSharesCount = 0;

function assertDevOnly() {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Critical Error: In-memory mock store is strictly disabled in production. Please configure SUPABASE environment variables."
    );
  }
}

export async function mockIsCodeAvailable(rawCode: string): Promise<{ available: boolean; reason?: string }> {
  assertDevOnly();
  const validation = customCodeSchema.safeParse(rawCode);
  if (!validation.success) {
    return { available: false, reason: validation.error.errors[0]?.message || "Invalid code format" };
  }

  const normalizedCode = validation.data;
  for (const [existingCode, room] of Array.from(memoryRooms.entries())) {
    if (existingCode.toLowerCase() === normalizedCode) {
      if (new Date(room.expires_at).getTime() <= Date.now() || room.status === "expired") {
        memoryRooms.delete(existingCode);
      } else {
        return { available: false, reason: "Code already in use" };
      }
    }
  }
  return { available: true };
}

export async function mockCreateRoom(
  uploaderName: string,
  filesData: { originalName: string; mimeType: string; fileSize: number; contentBuffer?: Buffer }[],
  customCode?: string,
  sessionId?: string
): Promise<{ room: ShareRoom; files: SharedFile[] }> {
  assertDevOnly();
  let code = customCode ? customCode.trim().toLowerCase() : generateRoomCode();

  if (customCode) {
    const availability = await mockIsCodeAvailable(customCode);
    if (!availability.available) {
      throw new Error(availability.reason || "Code already in use");
    }
  } else {
    let attempts = 0;
    while (attempts < 5) {
      const availability = await mockIsCodeAvailable(code);
      if (availability.available) break;
      code = generateRoomCode();
      attempts++;
    }
  }

  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
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

  memoryRooms.set(code.toLowerCase(), room);

  // Record mock stats ONLY after room creation successfully completes
  mockSharesCount++;
  if (sessionId) {
    mockPageSessions.add(sessionId);
  }

  return { room, files: createdFiles };
}

export async function mockGetRoomByCode(code: string): Promise<ShareRoom | null> {
  assertDevOnly();
  const cleanCode = code.trim().toLowerCase();
  let room = memoryRooms.get(cleanCode);

  if (!room) {
    for (const [k, r] of Array.from(memoryRooms.entries())) {
      if (k.toLowerCase() === cleanCode) {
        room = r;
        break;
      }
    }
  }

  if (!room) return null;

  if (new Date(room.expires_at).getTime() <= Date.now() || room.status === "expired") {
    memoryRooms.delete(room.room_code.toLowerCase());
    return null;
  }
  return room;
}

export async function mockGetFileContent(code: string, fileId: string): Promise<{ buffer: Buffer; fileName: string; mimeType: string } | null> {
  assertDevOnly();
  const room = await mockGetRoomByCode(code);
  if (!room) return null;

  const targetFile = room.files?.find((f) => f.id === fileId);
  if (!targetFile) return null;

  const memoryItem = memoryFiles.get(fileId);
  if (!memoryItem) return null;

  return {
    buffer: memoryItem.buffer,
    fileName: targetFile.original_name,
    mimeType: targetFile.mime_type,
  };
}

export async function mockDeleteExpiredRoom(_roomId: string, code: string): Promise<void> {
  assertDevOnly();
  const room = memoryRooms.get(code.toLowerCase());
  if (room) {
    if (room.files) {
      for (const f of room.files) {
        memoryFiles.delete(f.id);
      }
    }
    memoryRooms.delete(code.toLowerCase());
  }
}

export async function mockPurgeAllExpiredRooms(): Promise<{ deletedRoomsCount: number }> {
  assertDevOnly();
  let count = 0;
  const now = Date.now();

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

export async function mockGetAppStats(): Promise<AppStats> {
  assertDevOnly();
  const activeFilesList: ActiveFileItem[] = [];
  const activeSharesList: ActiveShareItem[] = [];
  const uploaderMap = new Map<string, { rooms: number; files: number; lastActive: string }>();
  const now = Date.now();

  for (const [, room] of Array.from(memoryRooms.entries())) {
    const isRoomActive = new Date(room.expires_at).getTime() > now && room.status === "active";
    const filesCount = room.files?.length || 0;

    activeSharesList.push({
      id: room.id,
      roomCode: "",
      uploaderName: room.uploader_name || "Subhan",
      filesCount,
      expiresAt: room.expires_at,
      createdAt: room.created_at,
    });

    if (isRoomActive && room.files) {
      for (const f of room.files) {
        activeFilesList.push({
          id: f.id,
          name: f.original_name,
          size: f.file_size,
          roomCode: "",
          expiresAt: room.expires_at,
        });
      }
    }

    const uploader = room.uploader_name || "Subhan";
    const prev = uploaderMap.get(uploader) || { rooms: 0, files: 0, lastActive: room.created_at };
    uploaderMap.set(uploader, {
      rooms: prev.rooms + 1,
      files: prev.files + filesCount,
      lastActive: new Date(room.created_at) > new Date(prev.lastActive) ? room.created_at : prev.lastActive,
    });
  }

  const recentUsersList: UserStatItem[] = Array.from(uploaderMap.entries()).map(([uploaderName, stats], idx) => ({
    id: `uploader-${idx + 1}`,
    uploaderName,
    totalRooms: stats.rooms,
    totalFiles: stats.files,
    lastActive: stats.lastActive,
  }));

  const totalSharesCount = mockSharesCount;
  const totalUsersCount = mockPageSessions.size;

  return {
    users: totalUsersCount,
    shares: totalSharesCount,
    files: activeFilesList.length,
    activeFiles: activeFilesList,
    activeShares: activeSharesList,
    recentUsers: recentUsersList,
  };
}
