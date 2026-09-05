import { z } from "zod";

export const roomCodeSchema = z
  .string()
  .trim()
  .length(6, "Room code must be exactly 6 characters")
  .regex(/^[A-Z0-9]+$/i, "Room code must contain only letters and numbers");

export const fileItemSchema = z.object({
  name: z.string().min(1, "File name is required"),
  size: z.number().positive("File size must be greater than 0"),
  type: z.string().default("application/octet-stream"),
});

export const createRoomSchema = z.object({
  uploaderName: z.string().trim().max(50).default("A friend"),
  files: z
    .array(fileItemSchema)
    .min(1, "At least one file is required")
    .max(10, "Maximum 10 files per room"),
});

export const getLimitsFromEnv = () => {
  return {
    maxFilesPerRoom: Number(process.env.NEXT_PUBLIC_MAX_FILES_PER_ROOM || 10),
    maxFileSizeMB: Number(process.env.NEXT_PUBLIC_MAX_FILE_SIZE_MB || 200),
    maxTotalSizeMB: Number(process.env.NEXT_PUBLIC_MAX_TOTAL_SIZE_MB || 500),
  };
};
