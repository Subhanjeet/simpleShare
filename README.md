# SimpleShare 🚀

> **Drop. Connect. Share.**  
> A minimal, modern, full-stack temporary file-sharing platform designed for small groups of friends.

SimpleShare lets users upload files, generates a unique 6-character room code and high-resolution QR code, and allows friends to access and download the files instantly. Every room and file remains available for **exactly 7 days**, after which all files and room records are automatically and permanently deleted.

---

## ⚡ Key Features

- 📂 **Instant Drag & Drop Uploader**: Drag and drop single or multiple files with live validation.
- 🔑 **Unique 6-Character Room Codes**: Unpredictable short room codes (e.g. `X7K92P`).
- 📱 **Instant QR Code Generation**: Downloadable & scannable QR codes for seamless mobile sharing.
- ⏱️ **Live Countdown Expiry Timer**: Real-time ticker showing remaining time (e.g. *"Expires in 6 days 14 hours"*).
- 📦 **Individual & Batch ZIP Downloads**: Download files one-by-one or generate a multi-file ZIP archive in a single click.
- 🗑️ **Permanent 7-Day Auto-Deletion**: Server-side expiration enforcement & automated storage cleanup.
- 🛡️ **Zero Friction**: No mandatory user accounts, social profiles, or messaging clutter.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js (App Router, React 18/19), TypeScript, Tailwind CSS, Lucide Icons, Framer Motion
- **Backend**: Next.js Server API Routes
- **Database**: Supabase PostgreSQL (`share_rooms`, `shared_files`)
- **Storage**: Supabase Storage (`simpleshare-files` bucket)
- **Utilities**: `qrcode.react` (QR generation), `jszip` (ZIP packaging), `zod` (Validation)

---

## ⚙️ How System & 7-Day Auto-Deletion Work

1. **Upload & Room Creation**:
   - Files are uploaded to Supabase Storage under `simpleshare-files/{ROOM_CODE}/{FILE_ID}-{FILENAME}`.
   - Room metadata (`room_code`, `created_at`, `expires_at = NOW() + 7 days`, `status = active`) is saved to `share_rooms`.
   - File metadata is saved to `shared_files`.

2. **Access & Download Enforcement**:
   - Every file download and room request checks `expires_at`.
   - If `expires_at <= NOW()`, the server invalidates access immediately (HTTP `410 Gone`) and purges the room.

3. **Automated Background Storage Deletion**:
   - An automated background cron endpoint (`/api/cron/cleanup`) purges expired rooms from Supabase Storage and PostgreSQL.
   - Alternatively, a PostgreSQL function (`delete_expired_rooms()`) can be scheduled via `pg_cron`.

---

## 📁 Project Structure

```
simpleShare/
├── supabase/
│   └── schema.sql                  # PostgreSQL tables, RLS policies & cleanup functions
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── cron/cleanup/       # Cron route for 7-day auto-deletion
│   │   │   └── rooms/              # Room creation, details & file download API endpoints
│   │   ├── room/[code]/page.tsx   # Room download view
│   │   ├── globals.css             # Tailwind base styles & custom scrollbars
│   │   ├── layout.tsx              # Root app layout & navigation
│   │   └── page.tsx                # Landing page (Upload & Join with code)
│   ├── components/
│   │   ├── ui/Button.tsx           # Reusable accessible button
│   │   ├── FileCard.tsx            # File display card
│   │   ├── FileList.tsx            # Pre-upload selected file list
│   │   ├── FileUploader.tsx        # Drag & drop upload dropzone
│   │   ├── ShareRoomModal.tsx      # Share modal with room code & QR
│   │   ├── QRCodeDisplay.tsx       # QR code canvas & PNG export
│   │   ├── RoomCodeInput.tsx       # Join room code form
│   │   ├── ExpiryTimer.tsx         # Real-time countdown timer
│   │   ├── DownloadButton.tsx      # Single file / ZIP download button
│   │   └── ExpiredRoom.tsx         # Expired room notification banner
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts           # Browser Supabase client
│   │   │   ├── server.ts           # Server administrative Supabase client
│   │   │   └── store.ts            # Data store handler with local dev fallback
│   │   ├── validation/room.ts      # Zod validation schemas & room limits
│   │   └── utils/format.ts         # Byte sizes, room code & time formatting
│   └── types/index.ts              # TypeScript definitions
├── .env.example                    # Environment variables template
├── package.json
└── tsconfig.json
```

---

## 🗄️ Supabase Setup & Database Instructions

### 1. Database Schema Execution
Run the following SQL in your Supabase SQL Editor (found in `supabase/schema.sql`):

```sql
-- Create share_rooms table
CREATE TABLE IF NOT EXISTS public.share_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code VARCHAR(10) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'expired')),
  uploader_name VARCHAR(50) DEFAULT 'Subhan' NOT NULL
);

-- Create shared_files table
CREATE TABLE IF NOT EXISTS public.shared_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.share_rooms(id) ON DELETE CASCADE,
  original_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_share_rooms_code ON public.share_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_share_rooms_expires ON public.share_rooms(expires_at);
CREATE INDEX IF NOT EXISTS idx_shared_files_room_id ON public.shared_files(room_id);
```

### 2. Storage Bucket Creation
Create a private or public bucket named `simpleshare-files` in your Supabase Storage console.

---

## 🔑 Environment Variables

Copy `.env.example` to `.env.local` and set your credentials:

```bash
# Supabase Credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Room Threshold Limits
NEXT_PUBLIC_MAX_FILES_PER_ROOM=10
NEXT_PUBLIC_MAX_FILE_SIZE_MB=200
NEXT_PUBLIC_MAX_TOTAL_SIZE_MB=500

# Base URL & Cron Secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=your-secret-cron-key
```

---

## 💻 Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Dev Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚀 Deploying to Vercel

1. Push your repository to GitHub.
2. Import the repository into [Vercel](https://vercel.com).
3. Add the Environment Variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`) in your Vercel Project Settings.
4. Set up a Vercel Cron Job in `vercel.json` to automatically trigger `/api/cron/cleanup` daily:
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/cleanup",
         "schedule": "0 0 * * *"
       }
     ]
   }
   ```
5. Deploy!

---

## 🔐 Security Considerations

- **Service Role Protection**: `SUPABASE_SERVICE_ROLE_KEY` is restricted exclusively to server-side API routes and is never exposed to the client bundle.
- **Access Control**: File downloads require an active non-expired room code matching `expires_at > NOW()`.
- **Validation**: Strict Zod validation on file size (200MB/file max), file count (10 files max per room), total payload size (500MB max per room), and 6-character room codes.
- **Privacy First**: Files and records are physically deleted from storage and PostgreSQL databases after 7 days.
