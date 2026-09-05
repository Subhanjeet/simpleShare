import { z } from "zod";

export const RESERVED_CODES = [
  "admin",
  "login",
  "test",
  "password",
  "root",
  "api",
  "room",
  "share",
  "null",
  "undefined",
  "create",
  "download",
  "public",
  "system",
];

export const roomCodeSchema = z
  .string()
  .trim()
  .min(6, "Room code must be between 6 and 20 characters")
  .max(20, "Room code must be between 6 and 20 characters")
  .regex(/^[a-zA-Z0-9-]+$/, "Use letters, numbers, and hyphens only");

export const customCodeSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(6, "Use 6–20 letters, numbers or hyphens")
  .max(20, "Use 6–20 letters, numbers or hyphens")
  .regex(/^[a-z0-9-]+$/, "Use 6–20 letters, numbers or hyphens")
  .refine((val) => !RESERVED_CODES.includes(val), {
    message: "This code is reserved and cannot be used",
  });

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
