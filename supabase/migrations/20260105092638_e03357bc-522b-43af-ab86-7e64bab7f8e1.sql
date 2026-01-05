-- Add user data fields to participations table for ticket completeness
ALTER TABLE public.participations 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS cpf TEXT,
ADD COLUMN IF NOT EXISTS cep TEXT,
ADD COLUMN IF NOT EXISTS whatsapp TEXT,
ADD COLUMN IF NOT EXISTS player_nick TEXT,
ADD COLUMN IF NOT EXISTS player_game_id TEXT,
ADD COLUMN IF NOT EXISTS partner_game_id TEXT,
ADD COLUMN IF NOT EXISTS partner_2_game_id TEXT,
ADD COLUMN IF NOT EXISTS partner_3_game_id TEXT;

-- Add pending date flags to tournaments table
ALTER TABLE public.tournaments
ADD COLUMN IF NOT EXISTS start_date_pending BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS end_date_pending BOOLEAN NOT NULL DEFAULT false;