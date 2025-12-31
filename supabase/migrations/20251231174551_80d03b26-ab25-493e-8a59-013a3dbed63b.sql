-- Public, non-PII tournament participant counters for realtime slot updates

CREATE TABLE IF NOT EXISTS public.tournament_participant_counts (
  tournament_id uuid PRIMARY KEY,
  paid_count integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Lock down writes, allow public read
ALTER TABLE public.tournament_participant_counts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read tournament participant counts" ON public.tournament_participant_counts;
CREATE POLICY "Public can read tournament participant counts"
ON public.tournament_participant_counts
FOR SELECT
TO public
USING (true);

-- Recompute helper (exact count from participations)
CREATE OR REPLACE FUNCTION public._refresh_tournament_participant_count(_tournament_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.tournament_participant_counts (tournament_id, paid_count, updated_at)
  VALUES (
    _tournament_id,
    (
      SELECT COUNT(*)::int
      FROM public.participations p
      WHERE p.tournament_id = _tournament_id
        AND p.payment_status = 'paid'
    ),
    now()
  )
  ON CONFLICT (tournament_id)
  DO UPDATE SET
    paid_count = EXCLUDED.paid_count,
    updated_at = EXCLUDED.updated_at;
END;
$$;

-- Trigger handler
CREATE OR REPLACE FUNCTION public.handle_participations_count_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_tid uuid;
  old_tid uuid;
BEGIN
  new_tid := COALESCE(NEW.tournament_id, NULL);
  old_tid := COALESCE(OLD.tournament_id, NULL);

  IF new_tid IS NOT NULL THEN
    PERFORM public._refresh_tournament_participant_count(new_tid);
  END IF;

  IF old_tid IS NOT NULL AND (new_tid IS NULL OR old_tid <> new_tid) THEN
    PERFORM public._refresh_tournament_participant_count(old_tid);
  END IF;

  RETURN NULL;
END;
$$;

-- Single trigger for insert/update/delete
DROP TRIGGER IF EXISTS participations_count_aiud ON public.participations;
CREATE TRIGGER participations_count_aiud
AFTER INSERT OR UPDATE OR DELETE ON public.participations
FOR EACH ROW
EXECUTE FUNCTION public.handle_participations_count_change();

-- Backfill / sync existing tournaments
INSERT INTO public.tournament_participant_counts (tournament_id, paid_count, updated_at)
SELECT
  t.id AS tournament_id,
  COALESCE(COUNT(p.*), 0)::int AS paid_count,
  now() AS updated_at
FROM public.tournaments t
LEFT JOIN public.participations p
  ON p.tournament_id = t.id
 AND p.payment_status = 'paid'
GROUP BY t.id
ON CONFLICT (tournament_id)
DO UPDATE SET
  paid_count = EXCLUDED.paid_count,
  updated_at = EXCLUDED.updated_at;

-- Enable realtime on the counters table
ALTER TABLE public.tournament_participant_counts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_participant_counts;