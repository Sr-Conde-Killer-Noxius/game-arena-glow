-- Add winner columns to tournaments table
-- These columns will store the participation IDs of winners
ALTER TABLE public.tournaments
ADD COLUMN IF NOT EXISTS winner_1st_id UUID REFERENCES public.participations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS winner_2nd_id UUID REFERENCES public.participations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS winner_3rd_id UUID REFERENCES public.participations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS winner_mvp_id UUID REFERENCES public.participations(id) ON DELETE SET NULL;

-- Add index for quick lookup of finished tournaments
CREATE INDEX IF NOT EXISTS idx_tournaments_finished ON public.tournaments(game, status) WHERE status = 'finished';