-- Test script to verify calendar_events table and data

-- 1. Check if calendar_events table exists and its structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'calendar_events'
ORDER BY ordinal_position;

-- 2. Count total calendar events
SELECT COUNT(*) as total_events FROM public.calendar_events;

-- 3. Show all calendar events with details
SELECT 
  ce.id,
  ce.title,
  ce.type,
  ce.start_date,
  ce.end_date,
  ce.status,
  ce.client_name,
  ce.location,
  ce.mission_id,
  p.full_name as prestataire_name,
  ce.created_at
FROM public.calendar_events ce
LEFT JOIN public.prestataires p ON p.id = ce.prestataire_id
ORDER BY ce.start_date DESC
LIMIT 20;

-- 4. Check if triggers exist
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE '%calendar%'
  AND event_object_schema = 'public';

-- 5. Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'calendar_events';

-- 6. Check if there are missions that should have calendar events
SELECT 
  m.id as mission_id,
  m.start_date,
  m.end_date,
  m.status,
  p.full_name as prestataire_name,
  ce.id as calendar_event_id,
  ce.title as event_title
FROM public.missions m
LEFT JOIN public.prestataires p ON p.id = m.prestataire_id
LEFT JOIN public.calendar_events ce ON ce.mission_id = m.id
ORDER BY m.created_at DESC
LIMIT 10;
