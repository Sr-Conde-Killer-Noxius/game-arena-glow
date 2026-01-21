-- Fix the duplicate slot: assign slot 2 to the second participation (created later)
UPDATE participations 
SET slot_number = 2 
WHERE id = 'a0a587ca-cdaf-43a5-91e9-c954bcf70778';

-- Create a UNIQUE PARTIAL INDEX to prevent duplicate slots for the same tournament
-- Only applies to paid participations (failed/pending can have null or duplicate slots)
CREATE UNIQUE INDEX IF NOT EXISTS unique_slot_per_tournament 
ON participations (tournament_id, slot_number) 
WHERE payment_status = 'paid' AND slot_number IS NOT NULL;