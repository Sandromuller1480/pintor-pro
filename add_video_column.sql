-- =========================================================================
-- SCRIPT PARA ADICIONAR A COLUNA DE VÍDEO NA TABELA "obras"
-- Execute isso no SQL Editor do seu Supabase.
-- =========================================================================

-- 1. Adiciona a coluna "video_url" na tabela obras existente
ALTER TABLE public.obras 
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- =========================================================================
-- SOBRE A PASTA "videos" NO BUCKET DO SUPABASE:
-- =========================================================================
-- No Supabase Storage, você não precisa rodar um comando SQL para criar uma pasta.
-- As pastas são "virtuais" e são criadas automaticamente no momento do upload.
-- 
-- Quando formos programar a função de salvar a obra no aplicativo, usaremos 
-- o caminho 'videos/' antes do nome do arquivo, assim:
-- 
-- supabase.storage.from('portfolio-obras').upload('videos/meu-video.mp4', arquivo)
--
-- Ao fazer o primeiro upload de vídeo por esse caminho, a pasta "videos" 
-- aparecerá automaticamente na interface do seu Storage!
