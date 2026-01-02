-- Add Mercado Pago payment tracking columns
ALTER TABLE public.participations 
ADD COLUMN IF NOT EXISTS mercado_pago_payment_id TEXT,
ADD COLUMN IF NOT EXISTS payment_created_at TIMESTAMPTZ;

-- Create index for faster lookups by payment_id
CREATE INDEX IF NOT EXISTS idx_participations_mp_payment_id 
ON public.participations(mercado_pago_payment_id);