import { getSupabaseAdmin } from "./server";
import { ShareRoom, SharedFile, ActiveFileItem, ActiveShareItem, UserStatItem, AppStats } from "@/types";
import { generateRoomCode } from "@/lib/utils/format";
import { customCodeSchema } from "@/lib/validation/room";
import {
  mockIsCodeAvailable,
  mockCreateRoom,
  mockGetRoomByCode,
  mockGetFileContent,
  mockDeleteExpiredRoom,
  mockPurgeAllExpiredRooms,
  mockGetAppStats,
} from "./mock-store";

const fallbackPageSessions = new Set<string>();

function getSupabaseHostname(url: string): string {
  if (!url) return "N/A (Missing)";
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return "Invalid URL format";
  }
}

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    "";

  const key = serviceKey || anonKey;

  return {
    url,
    anonKey,
    serviceKey,
    key,
  };
}

export function logSupabaseConfigDiagnostics(): void {
  const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const hasAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const hasPublishableKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  const hasSecretKey = Boolean(process.env.SUPABASE_SECRET_KEY);
  const nodeEnv = process.env.NODE_ENV || "unknown";
  const hostname = getSupabaseHostname(process.env.NEXT_PUBLIC_SUPABASE_URL || "");

  console.log("[Supabase Config Diagnostic]", {
    nodeEnv,
    hasUrl,
    urlHostname: hostname,
    hasAnonKey,
    hasPublishableKey,
    hasServiceRoleKey,
    hasSecretKey,
  });
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseEnv();
  const isUrlValid = Boolean(
    url &&
      !url.includes("placeholder") &&
      !url.includes("xyz-simpleshare-mock")
  );
  const isKeyValid = Boolean(
    key &&
      !key.includes("mock") &&
      !key.includes("placeholder")
  );

  return isUrlValid && isKeyValid;
}

function assertStoreMode(): "supabase" | "mock" {
  if (isSupabaseConfigured()) {
    return "supabase";
  }

  logSupabaseConfigDiagnostics();

  if (process.env.NODE_ENV === "production") {
    const { url, anonKey, serviceKey } = getSupabaseEnv();
    const missing: string[] = [];

    if (!url || url.includes("placeholder") || url.includes("xyz-simpleshare-mock")) {
      missing.push("NEXT_PUBLIC_SUPABASE_URL");
    }

    if (!anonKey && !serviceKey) {
      missing.push(
        "Supabase Key (expected NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SERVICE_ROLE_KEY, or SUPABASE_SECRET_KEY)"
      );
    }

    throw new Error(
      `Database Configuration Error: Missing or invalid Supabase environment variables in production [Missing: ${missing.join(
        ", "
      )}]. Shared-memory fallback is strictly disabled in production.`
    );
  }

  return "mock";
}

export async function isCodeAvailable(rawCode: string): Promise<{ available: boolean; reason?: string }> {
  const validation = customCodeSchema.safeParse(rawCode);
  if (!validation.success) {
    return { available: false, reason: validation.error.errors[0]?.message || "Invalid code format" };
  }

  const mode = assertStoreMode();
  if (mode === "mock") {
    return mockIsCodeAvailable(rawCode);
  }

  const normalizedCode = validation.data;
  const supabase = getSupabaseAdmin();
  const { data: room } = await supabase
    .from("share_rooms")
    .select("id, room_code, expires_at, status")
    .ilike("room_code", normalizedCode)
    .single();

  if (!room) {
    return { available: true };
  }

  if (new Date(room.expires_at).getTime() <= Date.now() || room.status === "expired") {
    await deleteExpiredRoomFromStore(room.id, room.room_code);
    return { available: true };
  }

  return { available: false, reason: "Code already in use" };
}

export async function createRoomInStore(
  uploaderName: string,
  filesData: { originalName: string; mimeType: string; fileSize: number; contentBuffer?: Buffer }[],
  customCode?: string,
  sessionId?: string
): Promise<{ room: ShareRoom; files: SharedFile[] }> {
  const mode = assertStoreMode();
  if (mode === "mock") {
    return mockCreateRoom(uploaderName, filesData, customCode, sessionId);
  }

  let code = customCode ? customCode.trim().toLowerCase() : generateRoomCode();

  if (customCode) {
    const availability = await isCodeAvailable(customCode);
    if (!availability.available) {
      throw new Error(availability.reason || "Code already in use");
    }
  } else {
    let attempts = 0;
    while (attempts < 5) {
      const availability = await isCodeAvailable(code);
      if (availability.available) break;
      code = generateRoomCode();
      attempts++;
    }
  }

  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

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
    if (roomError?.code === "23505" || roomError?.message?.includes("unique constraint")) {
      throw new Error("Code already in use. Please choose another.");
    }
    throw new Error(`Failed to create room in Supabase: ${roomError?.message || "Unknown error"}`);
  }

  const createdFiles: SharedFile[] = [];

  for (const f of filesData) {
    const fileId = crypto.randomUUID();
    const storagePath = `${code}/${fileId}-${f.originalName}`;

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

    const { data: fileData } = await supabase
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

  // Atomically record lifetime share & user session stats using RPC with table/memory fallback
  const activeSessionId = sessionId && sessionId.trim() ? sessionId.trim() : `sess-${crypto.randomUUID()}`;

  const { error: rpcError } = await supabase.rpc("record_share_event", {
    p_session_id: activeSessionId,
  });

  if (rpcError) {
    console.error("Supabase RPC record_share_event warning:", rpcError.message || rpcError);

    // Fallback if RPC fails or table is unmigrated
    let isNewSession = false;
    const { data: insertedSession, error: insertErr } = await supabase
      .from("page_sessions")
      .insert({ id: activeSessionId })
      .select("id")
      .maybeSingle();

    if (!insertErr && insertedSession) {
      isNewSession = true;
    } else if (!fallbackPageSessions.has(activeSessionId)) {
      // Robust memory fallback if page_sessions DB table is not migrated yet
      fallbackPageSessions.add(activeSessionId);
      isNewSession = true;
    }

    const { data: currentStats } = await supabase
      .from("app_stats")
      .select("total_users, total_shares")
      .eq("id", 1)
      .maybeSingle();

    const currentUsers = Number(currentStats?.total_users || 0);
    const currentShares = Number(currentStats?.total_shares || 0);

    const newShares = currentShares + 1;
    const newUsers = currentUsers + (isNewSession ? 1 : 0);

    const { error: updateError } = await supabase
      .from("app_stats")
      .update({
        total_shares: newShares,
        total_users: newUsers,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    if (updateError) {
      console.error("Supabase app_stats update error:", updateError.message || updateError);
    }
  }

  return {
    room: { ...roomData, files: createdFiles },
    files: createdFiles,
  };
}

export async function getRoomByCodeFromStore(code: string): Promise<ShareRoom | null> {
  const mode = assertStoreMode();
  if (mode === "mock") {
    return mockGetRoomByCode(code);
  }

  const cleanCode = code.trim().toLowerCase();
  const supabase = getSupabaseAdmin();

  const { data: room, error: roomError } = await supabase
    .from("share_rooms")
    .select("*")
    .ilike("room_code", cleanCode)
    .single();

  if (roomError || !room) return null;

  if (new Date(room.expires_at).getTime() <= Date.now() || room.status === "expired") {
    await deleteExpiredRoomFromStore(room.id, room.room_code);
    return null;
  }

  const { data: files } = await supabase
    .from("shared_files")
    .select("*")
    .eq("room_id", room.id);

  const formattedFiles = (files || []).map((f) => ({
    ...f,
    download_url: `/api/rooms/${room.room_code}/download/${f.id}`,
  }));

  return {
    ...room,
    files: formattedFiles,
  };
}

export async function getFileContentFromStore(code: string, fileId: string): Promise<{ buffer: Buffer; fileName: string; mimeType: string } | null> {
  const mode = assertStoreMode();
  if (mode === "mock") {
    return mockGetFileContent(code, fileId);
  }

  const room = await getRoomByCodeFromStore(code);
  if (!room) return null;

  const targetFile = room.files?.find((f) => f.id === fileId);
  if (!targetFile) return null;

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
  const mode = assertStoreMode();
  if (mode === "mock") {
    return mockDeleteExpiredRoom(roomId, code);
  }

  const supabase = getSupabaseAdmin();

  const { data: files } = await supabase.from("shared_files").select("storage_path").eq("room_id", roomId);
  if (files && files.length > 0) {
    const paths = files.map((f) => f.storage_path);
    await supabase.storage.from("simpleshare-files").remove(paths);
  }

  await supabase.from("share_rooms").delete().eq("id", roomId);
}

export async function purgeAllExpiredRooms(): Promise<{ deletedRoomsCount: number }> {
  const mode = assertStoreMode();
  if (mode === "mock") {
    return mockPurgeAllExpiredRooms();
  }

  let count = 0;
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



export async function getAppStatsFromStore(): Promise<AppStats> {
  const mode = assertStoreMode();
  console.log(`[getAppStatsFromStore] Store Mode: ${mode}`);

  if (mode === "mock") {
    const mockRes = await mockGetAppStats();
    console.log("[getAppStatsFromStore] Mock stats output:", mockRes);
    return mockRes;
  }

  const { url } = getSupabaseEnv();
  console.log(`[getAppStatsFromStore] Supabase Hostname: ${getSupabaseHostname(url)}`);

  const supabase = getSupabaseAdmin();

  let { data: statsData, error: statsError } = await supabase
    .from("app_stats")
    .select("total_users, total_shares")
    .eq("id", 1)
    .maybeSingle();

  if (statsError) {
    console.error("[getAppStatsFromStore] Error fetching app_stats:", statsError.message || statsError);
  }

  if (!statsData) {
    // Self-healing: Ensure singleton row id=1 exists in public.app_stats
    const { data: upsertData } = await supabase
      .from("app_stats")
      .upsert({ id: 1, total_users: 0, total_shares: 0 })
      .select("total_users, total_shares")
      .single();
    if (upsertData) {
      statsData = upsertData;
    }
  }

  const dbUsers = Number(statsData?.total_users || 0);
  const dbShares = Number(statsData?.total_shares || 0);

  // 2. Fetch all rooms stored in share_rooms for lifetime stats and active files
  const { data: allRooms } = await supabase
    .from("share_rooms")
    .select("id, room_code, uploader_name, created_at, expires_at, status")
    .order("created_at", { ascending: false })
    .limit(100);

  const activeRooms = (allRooms || []).filter(
    (r) => new Date(r.expires_at).getTime() > Date.now() && r.status === "active"
  );

  let activeFilesCount = 0;
  const activeFilesList: ActiveFileItem[] = [];
  const activeSharesList: ActiveShareItem[] = [];
  const uploaderMap = new Map<string, { rooms: number; files: number; lastActive: string }>();

  // Fetch files count per room
  const roomIds = (allRooms || []).map((r) => r.id);
  const filesPerRoom = new Map<string, number>();

  if (roomIds.length > 0) {
    const { data: filesData } = await supabase
      .from("shared_files")
      .select("id, room_id, original_name, file_size, created_at")
      .in("room_id", roomIds)
      .order("created_at", { ascending: false });

    if (filesData) {
      const activeRoomIds = new Set(activeRooms.map((r) => r.id));
      const roomMap = new Map((allRooms || []).map((r) => [r.id, r]));

      for (const f of filesData) {
        filesPerRoom.set(f.room_id, (filesPerRoom.get(f.room_id) || 0) + 1);

        if (activeRoomIds.has(f.room_id)) {
          const rm = roomMap.get(f.room_id);
          activeFilesList.push({
            id: f.id,
            name: f.original_name,
            size: f.file_size,
            roomCode: "",
            expiresAt: rm?.expires_at || "",
          });
        }
      }
      activeFilesCount = activeFilesList.length;
    }
  }

  // Build activeSharesList and uploaderMap from allRooms
  if (allRooms && allRooms.length > 0) {
    for (const r of allRooms) {
      const roomFilesCount = filesPerRoom.get(r.id) || 0;
      activeSharesList.push({
        id: r.id,
        roomCode: "",
        uploaderName: r.uploader_name || "Subhan",
        filesCount: roomFilesCount,
        expiresAt: r.expires_at,
        createdAt: r.created_at,
      });

      const uploader = r.uploader_name || "Subhan";
      const prev = uploaderMap.get(uploader) || { rooms: 0, files: 0, lastActive: r.created_at };
      uploaderMap.set(uploader, {
        rooms: prev.rooms + 1,
        files: prev.files + roomFilesCount,
        lastActive: new Date(r.created_at) > new Date(prev.lastActive) ? r.created_at : prev.lastActive,
      });
    }
  }

  const recentUsersList: UserStatItem[] = Array.from(uploaderMap.entries()).map(([uploaderName, stats], idx) => ({
    id: `uploader-${idx + 1}`,
    uploaderName,
    totalRooms: stats.rooms,
    totalFiles: stats.files,
    lastActive: stats.lastActive,
  }));

  const payload: AppStats = {
    users: dbUsers,
    shares: dbShares,
    files: activeFilesCount,
    activeFiles: activeFilesList,
    activeShares: activeSharesList,
    recentUsers: recentUsersList,
  };

  console.log("[getAppStatsFromStore] Final DB Payload:", {
    users: payload.users,
    shares: payload.shares,
    files: payload.files,
    activeFilesCount: payload.activeFiles.length,
    activeSharesCount: payload.activeShares.length,
    recentUsersCount: payload.recentUsers.length,
  });

  return payload;
}
