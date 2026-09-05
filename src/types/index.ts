export interface SharedFile {
  id: string;
  room_id: string;
  original_name: string;
  storage_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  download_url?: string;
}

export interface ShareRoom {
  id: string;
  room_code: string;
  created_at: string;
  expires_at: string;
  status: "active" | "expired";
  uploader_name: string;
  files?: SharedFile[];
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface RoomLimits {
  maxFilesPerRoom: number;
  maxFileSizeMB: number;
  maxTotalSizeMB: number;
}

export interface SelectedFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
}

export interface ActiveFileItem {
  id: string;
  name: string;
  size: number;
  roomCode: string;
  expiresAt: string;
}

export interface AppStats {
  users: number;
  shares: number;
  files: number;
  activeFiles: ActiveFileItem[];
}


