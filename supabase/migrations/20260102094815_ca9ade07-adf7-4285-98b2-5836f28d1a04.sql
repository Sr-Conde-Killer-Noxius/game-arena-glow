-- Create enum for game mode
CREATE TYPE public.game_mode AS ENUM ('solo', 'dupla', 'trio', 'squad');

-- Add game_mode column to tournaments
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS game_mode game_mode NOT NULL DEFAULT 'solo';

-- Add slot_number to participations
ALTER TABLE public.participations 
ADD COLUMN IF NOT EXISTS slot_number INTEGER;

-- Add partner columns for team-based modes
ALTER TABLE public.participations 
ADD COLUMN IF NOT EXISTS partner_nick TEXT,
ADD COLUMN IF NOT EXISTS partner_2_nick TEXT,
ADD COLUMN IF NOT EXISTS partner_3_nick TEXT;

-- Create index for slot lookups
CREATE INDEX IF NOT EXISTS idx_participations_slot ON public.participations(tournament_id, slot_number);