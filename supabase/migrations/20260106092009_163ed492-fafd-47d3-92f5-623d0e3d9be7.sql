-- Add room credentials columns to tournaments table
ALTER TABLE public.tournaments
ADD COLUMN room_id text,
ADD COLUMN room_password text,
ADD COLUMN room_pending boolean NOT NULL DEFAULT true;