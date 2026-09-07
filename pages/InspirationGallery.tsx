import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronDown,
  Copy,
  Eye,
  Heart,
  HelpCircle,
  Home as HomeIcon,
  Info,
  Layers,
  Lightbulb,
  Maximize2,
  Paintbrush,
  Palette,
  Search,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Sun,
  X,
  Zap
} from 'lucide-react';
import { NavigateToPage, Page } from '../types';

type ColorTone = {
  name: string;
  brand: 'Suvinil' | 'Coral' | 'Pintor Pro';
  hex: string;
  family: 'Neutros & Beges' | 'Terrosos & Quentes' | 'Verdes & Botânicos' | 'Azuis & Frios' | 'Cinzas & Urbanos';
  bestFinish: 'Fosco Aveludado' | 'Acetinado' | 'Semibrilho' | 'Efeito Especial';
  description: string;
};

type InspirationRoom = {
  id: string;
  title: string;
  category: 'Salas' | 'Quartos' | 'Cozinhas' | 'Fachadas' | 'Escritórios' | 'Banheiros';
  mood: 'Aconchego' | 'Moderno' | 'Natureza' | 'Elegância' | 'Luminosidade';
  brandRef: 'Suvinil' | 'Coral' | 'Mista';
  image: string;
  primaryColor: ColorTone;
  secondaryColor: ColorTone;
  accentColor: ColorTone;
  finishRecommended: string;
  proTip: string;
};

type InspirationGalleryProps = {
  setPage: NavigateToPage;
};

const TRENDING_COLORS: ColorTone[] = [
  // Suvinil
  {
    name: 'Calcita Alaranjada',
    brand: 'Suvinil',
    hex: '#D77A53',
    family: 'Terrosos & Quentes',
    bestFinish: 'Fosco Aveludado',
    description: 'Tom terroso alaranjado eleito Cor do Ano. Traz aconchego, energia criativa e sensação de acolhimento.'
  },
  {
    name: 'Silêncio da Noite',
    brand: 'Suvinil',
    hex: '#2B373E',
    family: 'Azuis & Frios',
    bestFinish: 'Fosco Aveludado',
    description: 'Azul marinho escuro profundo e misterioso. Ideal para paredes de destaque em salas e cabeceiras.'
  },
  {
    name: 'Duna Serena',
    brand: 'Suvinil',
    hex: '#D5C4B4',
    family: 'Neutros & Beges',
    bestFinish: 'Acetinado',
    description: 'Bege suave e aquecido que substitui o branco frio, transmitindo paz e luz natural suave.'
  },
  {
    name: 'Capim Santo',
    brand: 'Suvinil',
    hex: '#9AA78F',
    family: 'Verdes & Botânicos',
    bestFinish: 'Fosco Aveludado',
    description: 'Verde sálvia botânico calmo e restaurador. Excelente para quartos, home office e salas de leitura.'
  },
  {
    name: 'Algodão Egípcio',
    brand: 'Suvinil',
    hex: '#EDE8DF',
    family: 'Neutros & Beges',
    bestFinish: 'Fosco Aveludado',
    description: 'O clássico neutro brasileiro com fundo levemente aquecido. O padrão ouro da elegância atemporal.'
  },
  {
    name: 'Terra Roxa',
    brand: 'Suvinil',
    hex: '#A05C4E',
    family: 'Terrosos & Quentes',
    bestFinish: 'Fosco Aveludado',
    description: 'Terracota nobre inspirado no solo fértil brasileiro. Combina perfeitamente com madeira e folhagens.'
  },

  // Coral
  {
    name: 'Lugar de Afeto',
    brand: 'Coral',
    hex: '#D3BCB2',
    family: 'Neutros & Beges',
    bestFinish: 'Acetinado',
    description: 'Rosa acinzentado suave que acolhe e expande visualmente os ambientes sem cansar os olhos.'
  },
  {
    name: 'Mel Suave',
    brand: 'Coral',
    hex: '#D5B78A',
    family: 'Terrosos & Quentes',
    bestFinish: 'Acetinado',
    description: 'Amarelo dourado ambarado e radiante. Ilumina salas sombreadas e cria clima solar e otimista.'
  },
  {
    name: 'Silêncio de Inverno',
    brand: 'Coral',
    hex: '#C6CAC1',
    family: 'Verdes & Botânicos',
    bestFinish: 'Fosco Aveludado',
    description: 'Verde acinzentado pálido e sereno. Conecta o ambiente interno à natureza de forma sutil.'
  },
  {
    name: 'Mina de Cascalho',
    brand: 'Coral',
    hex: '#989791',
    family: 'Cinzas & Urbanos',
    bestFinish: 'Fosco Aveludado',
    description: 'Cinza médio neutro balanceado, sem puxar para o azul nem amarelo. O fundo urbano definitivo.'
  },
  {
    name: 'Lagoa Azul',
    brand: 'Coral',
    hex: '#335F70',
    family: 'Azuis & Frios',
    bestFinish: 'Fosco Aveludado',
    description: 'Azul petróleo contemporâneo com toque sofisticado. Perfeito para contraste com metais dourados.'
  },
  {
    name: 'Bambu Verdejante',
    brand: 'Coral',
    hex: '#587352',
    family: 'Verdes & Botânicos',
    bestFinish: 'Acetinado',
    description: 'Verde floresta nobre e vibrante. Ideal para varandas gourmet, lavabos e salas de jantar.'
  }
];

const INSPIRATION_ROOMS: InspirationRoom[] = [
  {
    id: 'sala-contemporanea-terracota',
    title: 'Living Contemporâneo com Parede Terracota',
    category: 'Salas',
    mood: 'Aconchego',
    brandRef: 'Suvinil',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop',
    primaryColor: {
      name: 'Calcita Alaranjada',
      brand: 'Suvinil',
      hex: '#D77A53',
      family: 'Terrosos & Quentes',
      bestFinish: 'Fosco Aveludado',
      description: 'Cor principal na parede de destaque da sala.'
    },
    secondaryColor: {
      name: 'Duna Serena',
      brand: 'Suvinil',
      hex: '#D5C4B4',
      family: 'Neutros & Beges',
      bestFinish: 'Fosco Aveludado',
      description: 'Nas paredes laterais e corredores.'
    },
    accentColor: {
      name: 'Algodão Egípcio',
      brand: 'Suvinil',
      hex: '#EDE8DF',
      family: 'Neutros & Beges',
      bestFinish: 'Fosco Aveludado',
      description: 'No teto e sancas para elevar a amplitude.'
    },
    finishRecommended: 'Fosco Aveludado (toque suave sem reflexos incômodos de TV)',
    proTip: 'Aplique 3 demãos finas na parede terracota para garantir saturação homogênea sob a luz solar da tarde.'
  },
  {
    id: 'quarto-suite-serenidade',
    title: 'Suíte Master em Tons de Sálvia e Neutro Aquecido',
    category: 'Quartos',
    mood: 'Natureza',
    brandRef: 'Coral',
    image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=1200&auto=format&fit=crop',
    primaryColor: {
      name: 'Silêncio de Inverno',
      brand: 'Coral',
      hex: '#C6CAC1',
      family: 'Verdes & Botânicos',
      bestFinish: 'Fosco Aveludado',
      description: 'Verde suave aplicado na cabeceira da cama.'
    },
    secondaryColor: {
      name: 'Lugar de Afeto',
      brand: 'Coral',
      hex: '#D3BCB2',
      family: 'Neutros & Beges',
      bestFinish: 'Acetinado',
      description: 'Nas paredes complementares para quebrar a frieza.'
    },
    accentColor: {
      name: 'Bambu Verdejante',
      brand: 'Coral',
      hex: '#587352',
      family: 'Verdes & Botânicos',
      bestFinish: 'Acetinado',
      description: 'Nos detalhes da marcenaria ou portas.'
    },
    finishRecommended: 'Fosco Aveludado com tinta antibactéria / antimofo',
    proTip: 'A cabeceira pintada em verde sálvia reduz a frequência cardíaca visual e melhora a indução do sono.'
  },
  {
    id: 'cozinha-gourmet-moderna',
    title: 'Cozinha Gourmet com Cimento e Azul Petróleo',
    category: 'Cozinhas',
    mood: 'Moderno',
    brandRef: 'Mista',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=1200&auto=format&fit=crop',
    primaryColor: {
      name: 'Mina de Cascalho',
      brand: 'Coral',
      hex: '#989791',
      family: 'Cinzas & Urbanos',
      bestFinish: 'Acetinado',
      description: 'Base de concreto e cinza urbano para as paredes.'
    },
    secondaryColor: {
      name: 'Lagoa Azul',
      brand: 'Coral',
      hex: '#335F70',
      family: 'Azuis & Frios',
      bestFinish: 'Acetinado',
      description: 'Na ilha ou parede dos armários para sofisticação.'
    },
    accentColor: {
      name: 'Algodão Egípcio',
      brand: 'Suvinil',
      hex: '#EDE8DF',
      family: 'Neutros & Beges',
      bestFinish: 'Fosco Aveludado',
      description: 'No teto para refletir a iluminação dos pendentes.'
    },
    finishRecommended: 'Massa Acrílica + Esmalte Base Água Acetinado Superlavável',
    proTip: 'Em cozinhas, exija sempre tinta com alta resistência à gordura e vapor d’água para permitir limpeza com detergente neutro.'
  },
  {
    id: 'fachada-contemporanea-alto-padrao',
    title: 'Fachada Arquitetônica com Tons Minerais e Textura',
    category: 'Fachadas',
    mood: 'Elegância',
    brandRef: 'Suvinil',
    image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=1200&auto=format&fit=crop',
    primaryColor: {
      name: 'Duna Serena',
      brand: 'Suvinil',
      hex: '#D5C4B4',
      family: 'Neutros & Beges',
      bestFinish: 'Efeito Especial',
      description: 'Textura projetada mineral nos volumes principais.'
    },
    secondaryColor: {
      name: 'Silêncio da Noite',
      brand: 'Suvinil',
      hex: '#2B373E',
      family: 'Azuis & Frios',
      bestFinish: 'Acetinado',
      description: 'Nos pilares metálicos e esquadrias de alumínio.'
    },
    accentColor: {
      name: 'Terra Roxa',
      brand: 'Suvinil',
      hex: '#A05C4E',
      family: 'Terrosos & Quentes',
      bestFinish: 'Fosco Aveludado',
      description: 'No pórtico de entrada para calor e acolhimento.'
    },
    finishRecommended: 'Tinta Emborrachada Elastomérica + Textura Projetada com resina UV',
    proTip: 'Fachadas externas exigem selador elastomérico prévio para vedar microfissuras e proteger contra maresia e chuvas fortes.'
  },
  {
    id: 'home-office-foco-criatividade',
    title: 'Home Office com Parede de Foco Azul Profundo',
    category: 'Escritórios',
    mood: 'Luminosidade',
    brandRef: 'Coral',
    image: 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?q=80&w=1200&auto=format&fit=crop',
    primaryColor: {
      name: 'Lagoa Azul',
      brand: 'Coral',
      hex: '#335F70',
      family: 'Azuis & Frios',
      bestFinish: 'Fosco Aveludado',
      description: 'Parede atrás do monitor que gera foco e diminui reflexo.'
    },
    secondaryColor: {
      name: 'Lugar de Afeto',
      brand: 'Coral',
      hex: '#D3BCB2',
      family: 'Neutros & Beges',
      bestFinish: 'Fosco Aveludado',
      description: 'Paredes laterais aquecidas para balancear o ambiente.'
    },
    accentColor: {
      name: 'Mel Suave',
      brand: 'Coral',
      hex: '#D5B78A',
      family: 'Terrosos & Quentes',
      bestFinish: 'Acetinado',
      description: 'Detalhe em nichos ou estante para despertar a criatividade.'
    },
    finishRecommended: 'Fosco Aveludado antirreflexo',
    proTip: 'A cor escura atrás de monitores de computador diminui o cansaço visual após horas contínuas de trabalho.'
  },
  {
    id: 'banheiro-lavabo-hotel-boutique',
    title: 'Lavabo Estilo Hotel Boutique com Toque Escuro',
    category: 'Banheiros',
    mood: 'Elegância',
    brandRef: 'Suvinil',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1200&auto=format&fit=crop',
    primaryColor: {
      name: 'Silêncio da Noite',
      brand: 'Suvinil',
      hex: '#2B373E',
      family: 'Azuis & Frios',
      bestFinish: 'Acetinado',
      description: 'Paredes e forro em envelope escuro de alto luxo.'
    },
    secondaryColor: {
      name: 'Calcita Alaranjada',
      brand: 'Suvinil',
      hex: '#D77A53',
      family: 'Terrosos & Quentes',
      bestFinish: 'Efeito Especial',
      description: 'Na bancada ou cuba de concreto esculpido.'
    },
    accentColor: {
      name: 'Algodão Egípcio',
      brand: 'Suvinil',
      hex: '#EDE8DF',
      family: 'Neutros & Beges',
      bestFinish: 'Acetinado',
      description: 'Na louça sanitária e toalhas para contraste nítido.'
    },
    finishRecommended: 'Massa Acrílica + Esmalte Epóxi Base Água ou Tinta Banheiros e Cozinhas',
    proTip: 'Lavabos sem chuveiro suportam pinturas escuras e texturas com efeito veludo sem problemas de vapor excessivo.'
  }
];

const HARMONY_PRESETS = [
  {
    title: 'Terracota Orgânico',
    base: { name: 'Calcita Alaranjada', hex: '#D77A53' },
    harmonies: [
      { type: 'Monocromático', name: 'Terracota Claro & Escuro', colors: ['#E8A78A', '#D77A53', '#8F3D1F'] },
      { type: 'Análogo (Aconchego)', name: 'Areia, Terra e Mostarda', colors: ['#D5B78A', '#D77A53', '#A05C4E'] },
      { type: 'Contraste Moderno', name: 'Terracota e Verde Sálvia', colors: ['#9AA78F', '#D77A53', '#2B373E'] }
    ]
  },
  {
    title: 'Verde Botânico',
    base: { name: 'Capim Santo', hex: '#9AA78F' },
    harmonies: [
      { type: 'Monocromático', name: 'Degradê de Sálvias', colors: ['#C6CAC1', '#9AA78F', '#587352'] },
      { type: 'Análogo (Equilíbrio)', name: 'Verde, Oliva e Neutro Areia', colors: ['#D5C4B4', '#9AA78F', '#6E7D63'] },
      { type: 'Contraste Moderno', name: 'Verde Sálvia e Terracota', colors: ['#D77A53', '#9AA78F', '#EDE8DF'] }
    ]
  },
  {
    title: 'Azul Nobre',
    base: { name: 'Lagoa Azul', hex: '#335F70' },
    harmonies: [
      { type: 'Monocromático', name: 'Profundidade Marinha', colors: ['#7EA2B1', '#335F70', '#1C3742'] },
      { type: 'Análogo (Serenidade)', name: 'Petróleo, Azul Névoa e Menta', colors: ['#335F70', '#9AA78F', '#B5C6D0'] },
      { type: 'Contraste Nobre', name: 'Azul Petróleo e Mel Suave', colors: ['#D5B78A', '#335F70', '#EDE8DF'] }
    ]
  }
];

export const InspirationGallery: React.FC<InspirationGalleryProps> = ({ setPage }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedMood, setSelectedMood] = useState<string>('Todos');
  const [selectedBrand, setSelectedBrand] = useState<string>('Todas');
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [previewRoom, setPreviewRoom] = useState<InspirationRoom | null>(null);
  const [activeHarmonyIndex, setActiveHarmonyIndex] = useState(0);

  useEffect(() => {
    document.title = 'Galeria de Inspiração de Pintura | Pintor Pro';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'Inspiração de cores e pinturas baseadas nas tendências da Suvinil e Coral. Paletas harmônicas para salas, quartos, cozinhas e fachadas de alto padrão.'
      );
    }
  }, []);

  const handleCopyHex = (hex: string) => {
    void navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    window.setTimeout(() => {
      setCopiedHex(null);
    }, 2200);
  };

  const filteredRooms = useMemo(() => {
    return INSPIRATION_ROOMS.filter((room) => {
      const matchCat = selectedCategory === 'Todos' || room.category === selectedCategory;
      const matchMood = selectedMood === 'Todos' || room.mood === selectedMood;
      const matchBrand = selectedBrand === 'Todas' || room.brandRef === selectedBrand || room.brandRef === 'Mista';
      return matchCat && matchMood && matchBrand;
    });
  }, [selectedCategory, selectedMood, selectedBrand]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-[#FDF3FA] selection:text-[#9A077B]">
      {/* Hero Header */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white py-16 sm:py-24">
        <div className="absolute right-0 top-0 -mr-28 -mt-28 h-[450px] w-[450px] rounded-full bg-gradient-to-br from-[#FDF3FA] via-[#FCE8F6] to-slate-100 opacity-80 blur-3xl pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#EFC6E3] bg-[#FDF3FA] px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#9A077B]">
              <Palette size={14} className="text-[#9A077B]" />
              Tendências Suvinil & Coral
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-[#000747] sm:text-5xl lg:text-6xl">
              Galeria de <span className="text-[#9A077B]">Inspiração</span>
            </h1>
            <p className="mt-4 text-base sm:text-lg font-medium leading-relaxed text-slate-600">
              Transforme a atmosfera do seu imóvel com paletas consagradas por arquitetos, combinações harmônicas de cores e acabamentos de alto padrão executados pela elite da pintura.
            </p>

            <div className="mt-8 flex flex-wrap gap-4 pt-6 border-t border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
              <div className="flex items-center gap-2">
                <BadgeCheck className="text-[#9A077B]" size={18} />
                <span>Paletas Harmônicas 60-30-10</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="text-[#9A077B]" size={18} />
                <span>Códigos HEX Prontos para Uso</span>
              </div>
              <div className="flex items-center gap-2">
                <Paintbrush className="text-[#9A077B]" size={18} />
                <span>Dicas Práticas de Aplicação</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Colors of the Year Bar */}
      <section className="border-b border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#9A077B]">
                Cores Tendência
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#000747]">
                Paleta de Cores do Ano (Suvinil & Coral)
              </h2>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-500 max-w-md">
              Passe o mouse ou clique para copiar o código hexadecimal da cor e utilizá-lo no seu projeto.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {TRENDING_COLORS.map((color) => {
              const isCopied = copiedHex === color.hex;

              return (
                <div
                  key={color.name}
                  onClick={() => handleCopyHex(color.hex)}
                  className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all hover:border-[#9A077B] hover:shadow-md hover:-translate-y-1"
                >
                  <div
                    className="h-28 w-full rounded-xl transition-transform duration-300 group-hover:scale-[1.03] relative overflow-hidden shadow-inner flex items-end justify-end p-2"
                    style={{ backgroundColor: color.hex }}
                  >
                    <span className="rounded-lg bg-black/40 backdrop-blur-sm px-2 py-1 text-[10px] font-mono font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      {isCopied ? 'Copiado!' : color.hex}
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        {color.brand}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {color.bestFinish.split(' ')[0]}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-[#000747] truncate group-hover:text-[#9A077B] transition">
                      {color.name}
                    </h4>
                    <button
                      type="button"
                      className="mt-2 text-[11px] font-bold text-[#9A077B] flex items-center gap-1 group-hover:underline"
                    >
                      {isCopied ? (
                        <>
                          <Check size={12} className="text-emerald-600" />
                          <span className="text-emerald-600">Código Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copiar HEX</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Filter Toolbar */}
      <section className="border-b border-slate-200 bg-slate-100/60 py-6 sticky top-0 z-20 backdrop-blur-md bg-white/90">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Category tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {['Todos', 'Salas', 'Quartos', 'Cozinhas', 'Fachadas', 'Escritórios', 'Banheiros'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-[#000747] text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {cat === 'Todos' ? 'Todos os Ambientes' : cat}
                </button>
              ))}
            </div>

            {/* Subfilters: Mood & Brand */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <span>Sensação:</span>
                <select
                  value={selectedMood}
                  onChange={(e) => setSelectedMood(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-[#9A077B]"
                >
                  <option value="Todos">Todas as Sensações</option>
                  <option value="Aconchego">Aconchego & Calor</option>
                  <option value="Moderno">Moderno & Urbano</option>
                  <option value="Natureza">Natureza & Frescor</option>
                  <option value="Elegância">Elegância & Noite</option>
                  <option value="Luminosidade">Luminosidade & Espaço</option>
                </select>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <span>Marca:</span>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-[#9A077B]"
                >
                  <option value="Todas">Suvinil & Coral</option>
                  <option value="Suvinil">Suvinil</option>
                  <option value="Coral">Coral</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Inspiration Room Grid */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
              Projetos em Destaque
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-[#000747]">
              Ambientes & Paletas Aplicadas ({filteredRooms.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setPage(Page.Home)}
            className="text-xs font-black uppercase tracking-wider text-[#9A077B] hover:text-[#7F0665] flex items-center gap-1"
          >
            Contratar Pintor Especialista <ArrowRight size={14} />
          </button>
        </div>

        {filteredRooms.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredRooms.map((room) => (
              <div
                key={room.id}
                className="group rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm transition-all hover:shadow-xl hover:border-slate-300 flex flex-col"
              >
                {/* Room image */}
                <div className="relative h-64 overflow-hidden bg-slate-100">
                  <img
                    src={room.image}
                    alt={room.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="rounded-full bg-black/60 backdrop-blur-sm px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                      {room.category}
                    </span>
                    <span className="rounded-full bg-[#9A077B]/90 backdrop-blur-sm px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                      {room.mood}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPreviewRoom(room)}
                    className="absolute top-4 right-4 rounded-full bg-white/80 p-2 text-slate-700 backdrop-blur-sm hover:bg-white hover:text-[#9A077B] transition"
                    title="Expandir foto"
                  >
                    <Maximize2 size={16} />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9A077B] block mb-1">
                      Referência {room.brandRef}
                    </span>
                    <h4 className="text-lg font-black text-[#000747] leading-snug">
                      {room.title}
                    </h4>

                    {/* Applied Color Palette (3 Tones) */}
                    <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-3">
                        Paleta Harmônica Aplicada
                      </span>

                      <div className="space-y-2">
                        {[room.primaryColor, room.secondaryColor, room.accentColor].map((tone, toneIdx) => {
                          const isToneCopied = copiedHex === tone.hex;

                          return (
                            <div
                              key={tone.name}
                              onClick={() => handleCopyHex(tone.hex)}
                              className="flex items-center justify-between p-1.5 rounded-xl hover:bg-white transition cursor-pointer group/tone"
                            >
                              <div className="flex items-center gap-3">
                                <span
                                  className="h-6 w-6 rounded-full border border-black/10 shadow-sm shrink-0"
                                  style={{ backgroundColor: tone.hex }}
                                />
                                <div>
                                  <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    {tone.name}
                                    <span className="text-[10px] text-slate-400 font-normal">
                                      ({toneIdx === 0 ? '60% Base' : toneIdx === 1 ? '30% Secundária' : '10% Acento'})
                                    </span>
                                  </p>
                                </div>
                              </div>

                              <span className="text-[10px] font-mono font-bold text-slate-400 group-hover/tone:text-[#9A077B]">
                                {isToneCopied ? 'Copiado!' : tone.hex}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Finish recommendation */}
                    <div className="mt-4 flex items-start gap-2 text-xs text-slate-600">
                      <Paintbrush size={16} className="text-[#9A077B] shrink-0 mt-0.5" />
                      <span><strong>Acabamento:</strong> {room.finishRecommended}</span>
                    </div>

                    {/* Pro Tip */}
                    <div className="mt-3 rounded-xl bg-amber-50/80 border border-amber-200/60 p-3 text-xs text-amber-900 leading-relaxed">
                      <strong>Dica Pro:</strong> {room.proTip}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        const allHex = `${room.primaryColor.hex}, ${room.secondaryColor.hex}, ${room.accentColor.hex}`;
                        handleCopyHex(allHex);
                      }}
                      className="text-xs font-bold text-slate-600 hover:text-[#9A077B] flex items-center gap-1"
                    >
                      <Copy size={14} />
                      <span>Copiar Paleta</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPage(Page.Home)}
                      className="rounded-xl bg-[#9A077B] px-4 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-[#7F0665] transition"
                    >
                      Buscar Pintor
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Palette className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <h4 className="text-base font-black text-[#000747]">Nenhum ambiente encontrado com estes filtros</h4>
            <p className="mt-1 text-xs text-slate-500">Tente selecionar outro ambiente ou sensação.</p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('Todos');
                setSelectedMood('Todos');
                setSelectedBrand('Todas');
              }}
              className="mt-4 rounded-xl bg-[#9A077B] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white"
            >
              Resetar Filtros
            </button>
          </div>
        )}
      </section>

      {/* Interactive Color Harmony Generator */}
      <section className="border-t border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-[#000747] via-[#010c59] to-[#000747] p-8 sm:p-12 text-white relative overflow-hidden">
            <div className="max-w-3xl">
              <span className="text-[11px] font-black uppercase tracking-[0.24em] text-[#C93EA6]">
                Harmonizador Profissional
              </span>
              <h3 className="text-2xl sm:text-4xl font-black tracking-tight mt-2">
                A Regra de Ouro dos 60-30-10
              </h3>
              <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
                Utilizada pelos maiores designers de interiores do mundo: <strong>60%</strong> da cor dominante nas paredes principais, <strong>30%</strong> em paredes secundárias ou tetos, e <strong>10%</strong> em detalhes ou portas.
              </p>
            </div>

            {/* Presets switcher */}
            <div className="mt-8 flex flex-wrap gap-3">
              {HARMONY_PRESETS.map((preset, pIdx) => (
                <button
                  key={preset.title}
                  type="button"
                  onClick={() => setActiveHarmonyIndex(pIdx)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                    activeHarmonyIndex === pIdx
                      ? 'bg-white text-[#000747] shadow-lg'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: preset.base.hex }} />
                  <span>{preset.title}</span>
                </button>
              ))}
            </div>

            {/* Harmonies Cards */}
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {HARMONY_PRESETS[activeHarmonyIndex].harmonies.map((harm) => (
                <div
                  key={harm.type}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
                >
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C93EA6]">
                    {harm.type}
                  </span>
                  <h4 className="text-base font-black text-white mt-1 mb-4">
                    {harm.name}
                  </h4>

                  {/* Visual 60-30-10 bar */}
                  <div className="h-14 w-full rounded-xl overflow-hidden flex mb-4 border border-white/10">
                    <div
                      className="h-full flex items-center justify-center text-[10px] font-black text-white/90"
                      style={{ width: '60%', backgroundColor: harm.colors[0] }}
                    >
                      60%
                    </div>
                    <div
                      className="h-full flex items-center justify-center text-[10px] font-black text-white/90"
                      style={{ width: '30%', backgroundColor: harm.colors[1] }}
                    >
                      30%
                    </div>
                    <div
                      className="h-full flex items-center justify-center text-[10px] font-black text-white/90"
                      style={{ width: '10%', backgroundColor: harm.colors[2] }}
                    >
                      10%
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300 font-mono">
                    {harm.colors.map((c, cIdx) => (
                      <div
                        key={c}
                        onClick={() => handleCopyHex(c)}
                        className="flex items-center justify-between p-1 rounded hover:bg-white/10 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: c }} />
                          <span>{cIdx === 0 ? 'Paredes principais' : cIdx === 1 ? 'Paredes secundárias' : 'Acentos / Detalhes'}</span>
                        </div>
                        <span className="text-white font-bold">{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Lighting & Color Guide */}
      <section className="border-t border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-[11px] font-black uppercase tracking-[0.24em] text-[#9A077B]">
              Fator Fundamental
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#000747] mt-2">
              Como a Luz Altera a Cor da Parede
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
              A mesma tinta Suvinil ou Coral pode parecer completamente diferente dependendo da temperatura de cor da sua iluminação artificial e da posição solar da janela.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <div className="p-3 rounded-xl bg-amber-100 text-amber-800 w-fit mb-4">
                <Sun size={24} />
              </div>
              <h4 className="text-base font-black text-[#000747]">Luz Quente (2.700K - 3.000K)</h4>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Acentua tons terrosos, amarelos e beges, tornando o ambiente super acolhedor. Pode deixar tons frios como azul e cinza com aspecto esverdeado ou abafado.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <div className="p-3 rounded-xl bg-slate-200 text-slate-800 w-fit mb-4">
                <Lightbulb size={24} />
              </div>
              <h4 className="text-base font-black text-[#000747]">Luz Neutra (4.000K)</h4>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                A mais fiel à cor original da lata. Ideal para cozinhas, lavanderias, home offices e áreas onde você precisa de máxima clareza e fidelidade cromática.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <div className="p-3 rounded-xl bg-blue-100 text-blue-800 w-fit mb-4">
                <Sparkles size={24} />
              </div>
              <h4 className="text-base font-black text-[#000747]">Luz Fria (5.000K - 6.500K)</h4>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Realça tons de azul, verde e cinza moderno. Evite em salas e quartos de descanso, pois reduz o conforto visual e altera tons ambarados.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Conversion Banner */}
      <section className="bg-gradient-to-r from-[#000747] via-[#020d58] to-[#000747] py-16 text-white text-center">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#C93EA6] mb-4">
            Do Projeto à Parede
          </div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight max-w-2xl mx-auto">
            Gostou das paletas? Transforme seu ambiente com a PINTOR PRO.
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-sm sm:text-base text-slate-300">
            Contrate pintores verificados que dominam a preparação correta, aplicação de demãos sem manchas e acabamento aveludado impecável.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button
              type="button"
              onClick={() => setPage(Page.Home)}
              className="rounded-xl bg-[#9A077B] px-8 py-4 text-xs font-black uppercase tracking-[0.18em] text-white hover:bg-[#7F0665] transition shadow-xl"
            >
              Encontrar Pintores na Minha Região
            </button>
            <button
              type="button"
              onClick={() => setPage(Page.PaintingCategories)}
              className="rounded-xl border border-white/20 bg-white/10 px-8 py-4 text-xs font-black uppercase tracking-[0.18em] text-white hover:bg-white/20 transition"
            >
              Ver Categorias de Pintura
            </button>
          </div>
        </div>
      </section>

      {/* Modal Preview Room */}
      {previewRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setPreviewRoom(null)}
              className="absolute right-4 top-4 rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 transition"
            >
              <X size={20} />
            </button>

            <div className="h-80 w-full overflow-hidden rounded-2xl bg-slate-100 mb-5">
              <img
                src={previewRoom.image}
                alt={previewRoom.title}
                className="h-full w-full object-cover"
              />
            </div>

            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9A077B]">
              {previewRoom.category} • Referência {previewRoom.brandRef}
            </span>
            <h3 className="text-xl font-black text-[#000747] mt-1">
              {previewRoom.title}
            </h3>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {[previewRoom.primaryColor, previewRoom.secondaryColor, previewRoom.accentColor].map((t) => (
                <div
                  key={t.name}
                  onClick={() => handleCopyHex(t.hex)}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-white transition"
                >
                  <div className="h-8 w-full rounded-lg mb-2 shadow-inner" style={{ backgroundColor: t.hex }} />
                  <p className="text-xs font-black text-[#000747] truncate">{t.name}</p>
                  <p className="text-[10px] font-mono font-bold text-[#9A077B]">{t.hex}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPreviewRoom(null)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreviewRoom(null);
                  setPage(Page.Home);
                }}
                className="rounded-xl bg-[#9A077B] px-6 py-2.5 text-xs font-black uppercase tracking-wider text-white hover:bg-[#7F0665]"
              >
                Solicitar Orçamento deste Estilo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InspirationGallery;
