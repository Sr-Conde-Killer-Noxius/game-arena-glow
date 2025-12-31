-- Create enum for admin roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Only admins can manage roles
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all participations
CREATE POLICY "Admins can view all participations"
  ON public.participations FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update any participation
CREATE POLICY "Admins can update all participations"
  ON public.participations FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to insert tournaments
CREATE POLICY "Admins can create tournaments"
  ON public.tournaments FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update tournaments
CREATE POLICY "Admins can update tournaments"
  ON public.tournaments FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete tournaments
CREATE POLICY "Admins can delete tournaments"
  ON public.tournaments FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));