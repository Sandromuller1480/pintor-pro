
-- Tabela para os pintores (Existente)
CREATE TABLE IF NOT EXISTS painters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  rating FLOAT DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  description TEXT,
  verified BOOLEAN DEFAULT false,
  top_rated BOOLEAN DEFAULT false,
  response_time TEXT,
  avatar TEXT,
  banner TEXT,
  specialties TEXT[], 
  lat FLOAT,
  lng FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Nova Tabela para Solicitações de Credenciamento
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  city TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT NOT NULL, -- Adicionado para notificações
  status TEXT DEFAULT 'pending', -- pending, accepted, rejected
  analysis_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inserir dados iniciais (opcional)
INSERT INTO painters (name, location, rating, reviews_count, description, verified, top_rated, response_time, avatar, banner, specialties, lat, lng)
VALUES 
('Roberto Silva', 'São Paulo - SP', 4.9, 124, 'Especialista em pintura imobiliária de alto padrão e texturas decorativas. 15 anos de experiência.', true, true, 'menos de 1 hora', 'https://picsum.photos/seed/rob/200/200', 'https://picsum.photos/seed/rob_banner/800/300', ARRAY['Laca', 'Cimento Queimado', 'Pintura Epóxi'], -23.5505, -46.6333),
('Maria Fernanda', 'Curitiba - PR', 5.0, 89, 'Especialista em restauração de fachadas e acabamentos finos. Certificada pelas melhores marcas.', true, true, '15 minutos', 'https://picsum.photos/seed/mari/200/200', 'https://picsum.photos/seed/mari_banner/800/300', ARRAY['Acabamentos Finos', 'Verniz', 'Pintura Airless'], -25.4290, -49.2671);
