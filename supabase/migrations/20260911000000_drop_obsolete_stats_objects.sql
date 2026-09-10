-- Migration: Drop obsolete Live Platform Stats database objects
-- Safely removes stats counters, page sessions, legacy uploader tracking, and stats RPC functions.

DROP TABLE IF EXISTS public.app_stats CASCADE;
DROP TABLE IF EXISTS public.anonymous_users CASCADE;
DROP TABLE IF EXISTS public.page_sessions CASCADE;

DROP FUNCTION IF EXISTS public.record_share_event() CASCADE;
DROP FUNCTION IF EXISTS public.record_share_event(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.record_share_event(text) CASCADE;
