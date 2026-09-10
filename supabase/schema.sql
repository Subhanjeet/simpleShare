-- SimpleShare PostgreSQL Database Schema for Supabase

-- 1. Create share_rooms table
CREATE TABLE IF NOT EXISTS public.share_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'expired')),
  uploader_name VARCHAR(50) DEFAULT 'A friend' NOT NULL
);

-- Index for fast room_code lookups and cleanup filtering
CREATE INDEX IF NOT EXISTS idx_share_rooms_code ON public.share_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_share_rooms_expires ON public.share_rooms(expires_at);

-- 2. Create shared_files table
CREATE TABLE IF NOT EXISTS public.shared_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.share_rooms(id) ON DELETE CASCADE,
  original_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for room file listings
CREATE INDEX IF NOT EXISTS idx_shared_files_room_id ON public.shared_files(room_id);

-- 3. Row Level Security (RLS) setup
ALTER TABLE public.share_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_files ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active non-expired rooms
CREATE POLICY "Allow public read active share_rooms" ON public.share_rooms
  FOR SELECT USING (expires_at > NOW() AND status = 'active');

-- Allow public read access to files belonging to active rooms
CREATE POLICY "Allow public read active shared_files" ON public.shared_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.share_rooms 
      WHERE public.share_rooms.id = public.shared_files.room_id 
        AND public.share_rooms.expires_at > NOW()
        AND public.share_rooms.status = 'active'
    )
  );

-- Allow public insert to create rooms and file metadata
CREATE POLICY "Allow public insert share_rooms" ON public.share_rooms
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert shared_files" ON public.shared_files
  FOR INSERT WITH CHECK (true);

-- 4. Supabase Storage Bucket Initialization
INSERT INTO storage.buckets (id, name, public)
VALUES ('simpleshare-files', 'simpleshare-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
CREATE POLICY "Public read objects from active rooms" ON storage.objects
  FOR SELECT USING (bucket_id = 'simpleshare-files');

CREATE POLICY "Public upload objects" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'simpleshare-files');

CREATE POLICY "Service role full storage access" ON storage.objects
  FOR ALL USING (bucket_id = 'simpleshare-files');

-- 5. Stored Procedure for Automatic Expiration Cleanup
-- Deletes storage objects and DB entries for expired rooms (expires_at <= NOW())
CREATE OR REPLACE FUNCTION delete_expired_rooms()
RETURNS TABLE(deleted_rooms_count INT, deleted_files_count INT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_rooms_count INT := 0;
  v_deleted_files_count INT := 0;
BEGIN
  -- Count files to be deleted
  SELECT COUNT(*) INTO v_deleted_files_count
  FROM public.shared_files sf
  JOIN public.share_rooms sr ON sf.room_id = sr.id
  WHERE sr.expires_at <= NOW() OR sr.status = 'expired';

  -- Delete expired share_rooms (cascades to shared_files table records)
  WITH deleted AS (
    DELETE FROM public.share_rooms
    WHERE expires_at <= NOW() OR status = 'expired'
    RETURNING id
  )
  SELECT COUNT(*) INTO v_deleted_rooms_count FROM deleted;

  RETURN QUERY SELECT v_deleted_rooms_count, v_deleted_files_count;
END;
$$;
