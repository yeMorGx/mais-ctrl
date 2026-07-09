
-- Allow anyone authenticated to lookup a pending invite by token so the accept screen can render.
DROP POLICY IF EXISTS "invites_select_by_token" ON public.couple_invites;
CREATE POLICY "invites_select_by_token" ON public.couple_invites FOR SELECT TO authenticated
  USING (true);

-- Security-definer RPC to atomically accept a couple invite.
CREATE OR REPLACE FUNCTION public.accept_couple_invite(_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite public.couple_invites%ROWTYPE;
  v_couple public.couples%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_invite FROM public.couple_invites WHERE token = _token;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Convite inválido';
  END IF;
  IF v_invite.status <> 'pending' THEN
    RAISE EXCEPTION 'Convite já usado ou expirado';
  END IF;
  IF v_invite.expires_at < now() THEN
    RAISE EXCEPTION 'Convite expirado';
  END IF;

  SELECT * INTO v_couple FROM public.couples WHERE id = v_invite.couple_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Casal não encontrado';
  END IF;
  IF v_couple.owner_id = auth.uid() THEN
    RAISE EXCEPTION 'Você é o criador deste espaço';
  END IF;
  IF v_couple.partner_id IS NOT NULL AND v_couple.partner_id <> auth.uid() THEN
    RAISE EXCEPTION 'Este espaço já tem um parceiro';
  END IF;

  UPDATE public.couples
    SET partner_id = auth.uid(), status = 'active', updated_at = now()
    WHERE id = v_couple.id;

  UPDATE public.couple_invites
    SET status = 'accepted', accepted_at = now()
    WHERE id = v_invite.id;

  RETURN v_couple.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_couple_invite(text) TO authenticated;
