-- Migration: Add page_sessions table and update record_share_event procedure for session-based user tracking

CREATE TABLE IF NOT EXISTS public.page_sessions (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION record_share_event(p_session_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inserted BOOLEAN := FALSE;
BEGIN
  -- Ensure singleton app_stats row exists
  INSERT INTO public.app_stats (id, total_users, total_shares)
  VALUES (1, 0, 0)
  ON CONFLICT (id) DO NOTHING;

  -- Idempotent session registration
  IF p_session_id IS NOT NULL AND p_session_id <> '' THEN
    INSERT INTO public.page_sessions (id)
    VALUES (p_session_id)
    ON CONFLICT (id) DO NOTHING;

    IF FOUND THEN
      v_inserted := TRUE;
    END IF;
  END IF;

  -- Update stats: Shares unconditionally +1, Users +1 only on new page session
  UPDATE public.app_stats
  SET
    total_shares = COALESCE(total_shares, 0) + 1,
    total_users = COALESCE(total_users, 0) + (CASE WHEN v_inserted THEN 1 ELSE 0 END),
    updated_at = NOW()
  WHERE id = 1;
END;
$$;
