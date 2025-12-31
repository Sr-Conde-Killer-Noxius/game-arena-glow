-- Enable realtime for participations table
ALTER TABLE public.participations REPLICA IDENTITY FULL;

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.participations;