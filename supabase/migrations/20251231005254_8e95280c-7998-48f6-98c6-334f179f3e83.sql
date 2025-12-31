-- Add is_banned column to profiles for anti-smurfing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false;

-- Allow admins to view all profiles (already exists as public, but need update for banned users)
-- Create policy for admins to update any profile (for rank/ban management)
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));