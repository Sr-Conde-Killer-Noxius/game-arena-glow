-- Add prize distribution fields to tournaments table
ALTER TABLE public.tournaments
ADD COLUMN IF NOT EXISTS prize_1st numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS prize_2nd numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS prize_3rd numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS prize_mvp numeric DEFAULT NULL;