-- Allow admins to delete participations
CREATE POLICY "Admins can delete participations"
ON public.participations
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));