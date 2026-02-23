
import React from 'react';
import { Shield, Star, CheckCircle, Search, Calendar, Award, MapPin, Wrench, Zap, Users, TrendingUp } from 'lucide-react';
import { Painter } from './types';

export const COLORS = {
  brand: '#000747', // Azul-marinho do logotipo
  primary: '#9A077B', // Magenta principal do logotipo
  secondary: '#000747', // Azul-marinho institucional
  accent: '#C93EA6', // Magenta de destaque (tom claro)
  bg: '#f8fafc',
  white: '#ffffff'
};

export const SLOGANS = [
  "O PadrÃ£o Ouro da Pintura Profissional no Brasil.",
  "Sua obra merece o PadrÃ£o Pro.",
  "Conectando a elite da pintura brasileira ao seu projeto.",
  "Qualidade que transforma, confianÃ§a que permanece.",
  "Onde a tÃ©cnica encontra a tecnologia."
];

export const HOW_IT_WORKS_CLIENTS = [
  { icon: <Search className="w-8 h-8 text-[#9A077B]" />, title: "Encontre Especialistas", desc: "Filtre pintores por localizaÃ§Ã£o, especialidade e portfÃ³lio real." },
  { icon: <Shield className="w-8 h-8 text-[#9A077B]" />, title: "Verifique AvaliaÃ§Ãµes", desc: "Veja fotos de antes e depois e opiniÃµes de clientes reais." },
  { icon: <Calendar className="w-8 h-8 text-[#9A077B]" />, title: "Contrate com SeguranÃ§a", desc: "Agende sua obra e pague com a garantia de entrega da plataforma." }
];

export const HOW_IT_WORKS_PAINTERS = [
  { icon: <Wrench className="w-8 h-8 text-[#9A077B]" />, title: "Crie seu PortfÃ³lio", desc: "Mostre seus melhores trabalhos em uma vitrine premium e profissional." },
  { icon: <Zap className="w-8 h-8 text-[#9A077B]" />, title: "Receba Propostas", desc: "Seja encontrado por clientes qualificados em todo o Brasil." },
  { icon: <Award className="w-8 h-8 text-[#9A077B]" />, title: "Construa sua Autoridade", desc: "Ganhe selos de verificaÃ§Ã£o e destaque-se no mercado nacional." }
];

export const FAQ_DATA = [
  { q: "Como a PINTOR PRO garante a qualidade?", a: "Todos os profissionais passam por uma anÃ¡lise de portfÃ³lio e histÃ³rico antes de receberem o selo Verificado." },
  { q: "O serviÃ§o de busca Ã© gratuito para clientes?", a: "Sim, clientes podem buscar, visualizar portfÃ³lios e solicitar orÃ§amentos sem custo." },
  { q: "Como funcionam os pagamentos?", a: "Oferecemos uma camada de proteÃ§Ã£o financeira onde o valor fica seguro atÃ© a conclusÃ£o da etapa acordada." }
];

export const MOCK_PAINTERS: Painter[] = [
  {
    id: '1',
    name: 'Roberto Silva',
    location: 'SÃ£o Paulo - SP',
    rating: 4.9,
    reviewsCount: 124,
    description: 'Especialista em pintura imobiliÃ¡ria de alto padrÃ£o e texturas decorativas. 15 anos de experiÃªncia.',
    verified: true,
    topRated: true,
    responseTime: 'menos de 1 hora',
    avatar: 'https://picsum.photos/seed/rob/200/200',
    banner: 'https://picsum.photos/seed/rob_banner/800/300',
    specialties: ['Laca', 'Cimento Queimado', 'Pintura EpÃ³xi'],
    coordinates: { lat: -23.5505, lng: -46.6333 }
  },
  {
    id: '2',
    name: 'Maria Fernanda',
    location: 'Curitiba - PR',
    rating: 5.0,
    reviewsCount: 89,
    description: 'Especialista em restauraÃ§Ã£o de fachadas e acabamentos finos. Certificada pelas melhores marcas.',
    verified: true,
    topRated: true,
    responseTime: '15 minutos',
    avatar: 'https://picsum.photos/seed/mari/200/200',
    banner: 'https://picsum.photos/seed/mari_banner/800/300',
    specialties: ['Acabamentos Finos', 'Verniz', 'Pintura Airless'],
    coordinates: { lat: -25.4290, lng: -49.2671 }
  }
];

