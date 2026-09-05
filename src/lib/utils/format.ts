export function bytesToSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function generateRoomCode(): string {
  const characters = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // Excludes 0, O, 1, I for readability
  let result = "";
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }
  return result;
}

export function isRoomExpired(expiresAt: string): boolean {
  const expiry = new Date(expiresAt).getTime();
  const now = new Date().getTime();
  return now >= expiry;
}

export function getTimeRemaining(expiresAt: string): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
} {
  const total = new Date(expiresAt).getTime() - new Date().getTime();
  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return { days, hours, minutes, seconds, isExpired: false };
}

export function formatExpiration(expiresAt: string): string {
  const date = new Date(expiresAt);
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
