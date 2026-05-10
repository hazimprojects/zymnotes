-- =============================================================================
-- ZymNotes — Supabase: maklum balas nota + kiraan muat turun PDF
-- =============================================================================
-- Jalankan dalam SQL Editor projek Supabase anda.
--
-- Rujukan kod: assets/js/main.js (widget maklum balas, stat bar, muat turun PDF)
--
-- AMARAN — Seksyen A menggunakan DROP TABLE ... CASCADE
--   Ini memadam SEMUA rekod maklum balas sedia ada. Untuk pangkalan produksi
--   yang sudah berisi data, JANGAN jalankan Seksyen A; gunakan Seksyen B
--   (tambah PDF sahaja) jika skema nota_feedback sudah betul.
-- =============================================================================


-- =============================================================================
-- SEKSYEN A — Jadual & fungsi nota_feedback (pemasangan bersih / dev)
-- =============================================================================

DROP TABLE IF EXISTS public.nota_feedback CASCADE;

DROP FUNCTION IF EXISTS public.submit_nota_feedback(text, text, uuid);
DROP FUNCTION IF EXISTS public.get_nota_helpful_count(text);
DROP FUNCTION IF EXISTS public.get_nota_reaction_counts(text);
DROP FUNCTION IF EXISTS public.delete_nota_feedback_entry(bigint, uuid);
DROP FUNCTION IF EXISTS public.delete_nota_feedback_entries(bigint[], uuid);

CREATE TABLE public.nota_feedback (
  id          bigserial PRIMARY KEY,
  page_path   text NOT NULL,
  reaction    text NOT NULL CHECK (reaction IN ('suka', 'mudah', 'boleh-baik', 'kurang-jelas')),
  user_secret uuid NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.nota_feedback ENABLE ROW LEVEL SECURITY;

-- Anon boleh INSERT (hantar maklum balas / suka dari pelayar)
DROP POLICY IF EXISTS "anon insert nota feedback" ON public.nota_feedback;
CREATE POLICY "anon insert nota feedback"
  ON public.nota_feedback
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.submit_nota_feedback(p_path text, p_reaction text, p_secret uuid)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO nota_feedback (page_path, reaction, user_secret)
  VALUES (p_path, p_reaction, p_secret)
  RETURNING id;
$$;

GRANT EXECUTE ON FUNCTION public.submit_nota_feedback(text, text, uuid) TO anon;

CREATE OR REPLACE FUNCTION public.get_nota_helpful_count(p_path text)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::bigint
  FROM nota_feedback
  WHERE page_path = p_path AND reaction = 'mudah';
$$;

GRANT EXECUTE ON FUNCTION public.get_nota_helpful_count(text) TO anon;

CREATE OR REPLACE FUNCTION public.get_nota_reaction_counts(p_path text)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'suka',         COUNT(*) FILTER (WHERE reaction = 'suka'),
    'mudah',        COUNT(*) FILTER (WHERE reaction = 'mudah'),
    'boleh-baik',   COUNT(*) FILTER (WHERE reaction = 'boleh-baik'),
    'kurang-jelas', COUNT(*) FILTER (WHERE reaction = 'kurang-jelas')
  )
  FROM nota_feedback
  WHERE page_path = p_path;
$$;

GRANT EXECUTE ON FUNCTION public.get_nota_reaction_counts(text) TO anon;

CREATE OR REPLACE FUNCTION public.delete_nota_feedback_entry(p_id bigint, p_secret uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM nota_feedback WHERE id = p_id AND user_secret = p_secret;
$$;

GRANT EXECUTE ON FUNCTION public.delete_nota_feedback_entry(bigint, uuid) TO anon;

CREATE OR REPLACE FUNCTION public.delete_nota_feedback_entries(p_ids bigint[], p_secret uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM nota_feedback WHERE id = ANY (p_ids) AND user_secret = p_secret;
$$;

GRANT EXECUTE ON FUNCTION public.delete_nota_feedback_entries(bigint[], uuid) TO anon;


-- =============================================================================
-- SEKSYEN B — Kiraan muat turun PDF (tambah pada DB sedia ada atau selepas A)
-- =============================================================================
-- Satu baris log setiap kali pengguna menyelesaikan muat turun PDF pada halaman
-- subtopik. Kiraan dipaparkan pada stat bar hero (lihat main.js).

CREATE TABLE IF NOT EXISTS public.nota_pdf_downloads (
  id          bigserial PRIMARY KEY,
  page_path   text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS nota_pdf_downloads_page_path_idx
  ON public.nota_pdf_downloads (page_path);

ALTER TABLE public.nota_pdf_downloads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon insert pdf download" ON public.nota_pdf_downloads;
CREATE POLICY "anon insert pdf download"
  ON public.nota_pdf_downloads
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.submit_nota_pdf_download(p_path text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.nota_pdf_downloads (page_path) VALUES (p_path);
$$;

GRANT EXECUTE ON FUNCTION public.submit_nota_pdf_download(text) TO anon;

CREATE OR REPLACE FUNCTION public.get_nota_pdf_download_count(p_path text)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::bigint
  FROM public.nota_pdf_downloads
  WHERE page_path = p_path;
$$;

GRANT EXECUTE ON FUNCTION public.get_nota_pdf_download_count(text) TO anon;
