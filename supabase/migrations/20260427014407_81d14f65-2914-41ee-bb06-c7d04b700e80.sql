ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS selfie_url TEXT,
  ADD COLUMN IF NOT EXISTS face_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS face_match_score NUMERIC;

ALTER TYPE public.document_type ADD VALUE IF NOT EXISTS 'selfie';