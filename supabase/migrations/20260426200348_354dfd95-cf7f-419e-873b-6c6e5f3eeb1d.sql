-- =========================================================
-- Caixinha Eldorado — expansão (admin + dashboard usuário)
-- =========================================================

-- 1) Adicionar campos ao profile (CPF, foto, banimento)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cpf TEXT,
  ADD COLUMN IF NOT EXISTS cpf_valid BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS banned_reason TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_cpf_unique
  ON public.profiles (cpf) WHERE cpf IS NOT NULL;

-- 2) Settings globais (chave Pix, QR code, WhatsApp admin)
CREATE TABLE IF NOT EXISTS public.app_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  pix_key TEXT,
  pix_key_type TEXT,
  pix_qr_url TEXT,
  pix_copy_paste TEXT,
  admin_whatsapp TEXT,
  daily_amount NUMERIC(10,2) NOT NULL DEFAULT 5.00,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  CONSTRAINT singleton CHECK (id = 1)
);

INSERT INTO public.app_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view settings"
  ON public.app_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins update settings"
  ON public.app_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3) Documentos do usuário (RG/CNH, comprovante de endereço)
CREATE TYPE public.document_type AS ENUM ('rg', 'cnh', 'address_proof', 'payment_proof', 'other');
CREATE TYPE public.document_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE IF NOT EXISTS public.user_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  document_type public.document_type NOT NULL,
  file_path TEXT NOT NULL,
  status public.document_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own documents"
  ON public.user_documents FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users upload own documents"
  ON public.user_documents FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete pending docs"
  ON public.user_documents FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins update documents"
  ON public.user_documents FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4) Tickets de suporte
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'closed');
CREATE TYPE public.ticket_priority AS ENUM ('low', 'normal', 'high');

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status public.ticket_status NOT NULL DEFAULT 'open',
  priority public.ticket_priority NOT NULL DEFAULT 'normal',
  assigned_to UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own tickets"
  ON public.support_tickets FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users create own tickets"
  ON public.support_tickets FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins update tickets"
  ON public.support_tickets FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5) Mensagens entre usuário e admin (DM)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL,
  to_user_id UUID,
  to_admins BOOLEAN NOT NULL DEFAULT false,
  ticket_id UUID,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_to_user_idx ON public.messages(to_user_id);
CREATE INDEX IF NOT EXISTS messages_from_user_idx ON public.messages(from_user_id);
CREATE INDEX IF NOT EXISTS messages_ticket_idx ON public.messages(ticket_id);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their conversations"
  ON public.messages FOR SELECT TO authenticated
  USING (
    auth.uid() = from_user_id
    OR auth.uid() = to_user_id
    OR (to_admins AND public.has_role(auth.uid(), 'admin'))
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users send messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Recipients mark read"
  ON public.messages FOR UPDATE TO authenticated
  USING (auth.uid() = to_user_id OR public.has_role(auth.uid(), 'admin'));

-- 6) Notificações in-app (admin → user broadcast ou direcionada)
CREATE TYPE public.notif_type AS ENUM ('info', 'warning', 'success', 'alert');

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,           -- NULL = broadcast para todos
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type public.notif_type NOT NULL DEFAULT 'info',
  link TEXT,
  read_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications(user_id);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own + broadcast"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id IS NULL OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins create notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users mark own as read"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 7) Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contributions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payouts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;

-- 8) Trigger updated_at em support_tickets
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_tickets_updated
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER trg_settings_updated
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 9) Storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false) ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('pix-qr', 'pix-qr', true) ON CONFLICT DO NOTHING;

-- Avatars: público para leitura, usuário gerencia o seu
CREATE POLICY "Avatar public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users upload own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Documents: privado, usuário vê os seus, admin vê todos
CREATE POLICY "Users read own docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin')));

CREATE POLICY "Users upload own docs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own docs"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Pix QR: público para leitura, só admin gerencia
CREATE POLICY "Pix QR public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pix-qr');

CREATE POLICY "Admins manage pix QR"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'pix-qr' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update pix QR"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'pix-qr' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete pix QR"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'pix-qr' AND public.has_role(auth.uid(), 'admin'));