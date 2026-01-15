-- Fix the existing participation with missing slot
UPDATE participations 
SET slot_number = 1
WHERE id = '40b28ed2-5b4b-4db0-b03f-fd12be92bcea'
AND slot_number IS NULL;

-- Create a trigger to ensure slot_number is never null when payment_status is 'paid'
CREATE OR REPLACE FUNCTION public.validate_paid_participation_has_slot()
RETURNS TRIGGER AS $$
BEGIN
  -- Only validate on update or insert when status is being set to 'paid'
  IF NEW.payment_status = 'paid' AND NEW.slot_number IS NULL THEN
    RAISE EXCEPTION 'Cannot set payment_status to paid without a slot_number';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Drop the trigger if it exists and recreate it
DROP TRIGGER IF EXISTS ensure_paid_has_slot ON participations;

CREATE TRIGGER ensure_paid_has_slot
  BEFORE INSERT OR UPDATE ON participations
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_paid_participation_has_slot();