-- ============================================================
-- ETAPAS DE MIDIA DO PORTFOLIO DE OBRAS
-- Execute este script no SQL Editor do Supabase.
-- ============================================================

ALTER TABLE public.obras
ADD COLUMN IF NOT EXISTS video_url TEXT;

ALTER TABLE public.obras
ADD COLUMN IF NOT EXISTS stage_media JSONB NOT NULL DEFAULT jsonb_build_object(
  'preparo_reboco_fundo', jsonb_build_object('images', '[]'::jsonb, 'videos', '[]'::jsonb),
  'massa_corrida_lixamento', jsonb_build_object('images', '[]'::jsonb, 'videos', '[]'::jsonb),
  'pintura_acabamento', jsonb_build_object('images', '[]'::jsonb, 'videos', '[]'::jsonb)
);

UPDATE public.obras
SET stage_media = jsonb_build_object(
  'preparo_reboco_fundo', jsonb_build_object('images', '[]'::jsonb, 'videos', '[]'::jsonb),
  'massa_corrida_lixamento', jsonb_build_object('images', '[]'::jsonb, 'videos', '[]'::jsonb),
  'pintura_acabamento', jsonb_build_object(
    'images',
    CASE
      WHEN imagem_url IS NOT NULL AND TRIM(imagem_url) <> '' THEN to_jsonb(ARRAY[imagem_url])
      ELSE '[]'::jsonb
    END,
    'videos',
    CASE
      WHEN video_url IS NOT NULL AND TRIM(video_url) <> '' THEN to_jsonb(ARRAY[video_url])
      ELSE '[]'::jsonb
    END
  )
)
WHERE stage_media IS NULL
   OR stage_media = '{}'::jsonb;
