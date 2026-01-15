-- 2. Create table for partner code settings (how many codes each partner can create)
CREATE TABLE public.partner_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  max_codes integer NOT NULL DEFAULT 5,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 3. Create table for promo codes
CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  partner_id uuid NOT NULL,
  max_uses integer NOT NULL DEFAULT 10,
  current_uses integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 4. Create junction table for codes valid for specific tournaments (if empty = valid for all)
CREATE TABLE public.promo_code_tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id uuid NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(promo_code_id, tournament_id)
);

-- 5. Create table to track code usage
CREATE TABLE public.promo_code_uses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id uuid NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  participation_id uuid REFERENCES public.participations(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(promo_code_id, user_id, tournament_id)
);

-- 6. Enable RLS on all new tables
ALTER TABLE public.partner_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_uses ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for partner_settings
CREATE POLICY "Admins can manage partner settings"
ON public.partner_settings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Partners can view their own settings"
ON public.partner_settings FOR SELECT
USING (auth.uid() = user_id);

-- 8. RLS Policies for promo_codes
CREATE POLICY "Admins can manage all promo codes"
ON public.promo_codes FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Partners can view their own codes"
ON public.promo_codes FOR SELECT
USING (auth.uid() = partner_id);

CREATE POLICY "Partners can create their own codes"
ON public.promo_codes FOR INSERT
WITH CHECK (auth.uid() = partner_id AND has_role(auth.uid(), 'parceiro'::app_role));

CREATE POLICY "Partners can update their own codes"
ON public.promo_codes FOR UPDATE
USING (auth.uid() = partner_id);

-- 9. RLS Policies for promo_code_tournaments
CREATE POLICY "Admins can manage code tournaments"
ON public.promo_code_tournaments FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Partners can view their code tournaments"
ON public.promo_code_tournaments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.promo_codes 
  WHERE id = promo_code_id AND partner_id = auth.uid()
));

CREATE POLICY "Partners can manage their code tournaments"
ON public.promo_code_tournaments FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.promo_codes 
  WHERE id = promo_code_id AND partner_id = auth.uid()
));

CREATE POLICY "Partners can delete their code tournaments"
ON public.promo_code_tournaments FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.promo_codes 
  WHERE id = promo_code_id AND partner_id = auth.uid()
));

-- 10. RLS Policies for promo_code_uses
CREATE POLICY "Admins can view all code uses"
ON public.promo_code_uses FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Partners can view their code uses"
ON public.promo_code_uses FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.promo_codes 
  WHERE id = promo_code_id AND partner_id = auth.uid()
));

CREATE POLICY "Users can use codes"
ON public.promo_code_uses FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 11. Function to check if partner role
CREATE OR REPLACE FUNCTION public.is_partner(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'parceiro'
  )
$$;

-- 12. Function to validate promo code
CREATE OR REPLACE FUNCTION public.validate_promo_code(
  _code text,
  _tournament_id uuid,
  _user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _promo_code promo_codes%ROWTYPE;
  _has_tournament_restriction boolean;
  _is_valid_tournament boolean;
  _already_used boolean;
BEGIN
  -- Find the code
  SELECT * INTO _promo_code
  FROM public.promo_codes
  WHERE LOWER(code) = LOWER(_code) AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Código não encontrado ou inativo');
  END IF;
  
  -- Check if code has uses remaining
  IF _promo_code.current_uses >= _promo_code.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Código atingiu o limite de usos');
  END IF;
  
  -- Check if there are tournament restrictions
  SELECT EXISTS (
    SELECT 1 FROM public.promo_code_tournaments
    WHERE promo_code_id = _promo_code.id
  ) INTO _has_tournament_restriction;
  
  IF _has_tournament_restriction THEN
    SELECT EXISTS (
      SELECT 1 FROM public.promo_code_tournaments
      WHERE promo_code_id = _promo_code.id AND tournament_id = _tournament_id
    ) INTO _is_valid_tournament;
    
    IF NOT _is_valid_tournament THEN
      RETURN jsonb_build_object('valid', false, 'error', 'Código não válido para este torneio');
    END IF;
  END IF;
  
  -- Check if user already used this code for this tournament
  SELECT EXISTS (
    SELECT 1 FROM public.promo_code_uses
    WHERE promo_code_id = _promo_code.id 
      AND user_id = _user_id 
      AND tournament_id = _tournament_id
  ) INTO _already_used;
  
  IF _already_used THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Você já usou este código neste torneio');
  END IF;
  
  RETURN jsonb_build_object(
    'valid', true, 
    'promo_code_id', _promo_code.id,
    'partner_id', _promo_code.partner_id
  );
END;
$$;

-- 13. Function to redeem promo code
CREATE OR REPLACE FUNCTION public.redeem_promo_code(
  _promo_code_id uuid,
  _tournament_id uuid,
  _user_id uuid,
  _participation_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert usage record
  INSERT INTO public.promo_code_uses (promo_code_id, user_id, tournament_id, participation_id)
  VALUES (_promo_code_id, _user_id, _tournament_id, _participation_id);
  
  -- Increment usage count
  UPDATE public.promo_codes
  SET current_uses = current_uses + 1, updated_at = now()
  WHERE id = _promo_code_id;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- 14. Triggers for updated_at
CREATE TRIGGER update_partner_settings_updated_at
BEFORE UPDATE ON public.partner_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_promo_codes_updated_at
BEFORE UPDATE ON public.promo_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();