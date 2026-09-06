import React, { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  Brush,
  Building2,
  ChevronRight,
  Droplets,
  Factory,
  Hammer,
  Layers3,
  PaintBucket,
  Search,
  ShieldCheck,
  Sparkles,
  SprayCan,
  Wrench
} from 'lucide-react';
import { SPECIALTY_OPTIONS } from '../lib/painterProfileOptions';
import { NavigateToPage, Page } from '../types';

type PaintingCategory = {
  title: string;
  summary: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  specialties: string[];
  bestFor: string[];
};

type PaintingCategoriesProps = {
  setPage: NavigateToPage;
};

const normalizeText = (value: string) => (
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
);

const categories: PaintingCategory[] = [
  {
    title: 'Preparacao de superficie',
    summary: 'Etapa tecnica que corrige a base antes da pintura final.',
    icon: Wrench,
    specialties: [
      'Preparo do reboco (Limpeza, Lixa, Selador/Fundo Preparador)',
      'Preparo do Acartonado (Lixa e Fundo Preparador)',
      'Reformas (Tratamento de patologias e Superficies)'
    ],
    bestFor: ['paredes novas', 'reformas', 'superficies com falhas']
  },
  {
    title: 'Massa e nivelamento',
    summary: 'Aplicacao, regularizacao e lixamento para acabamento uniforme.',
    icon: Layers3,
    specialties: [
      'Massa Corrida (Aplicacao e lixamento)',
      'Massa Acrilica (Aplicacao e lixamento)',
      'Lixadeiras: Pequenas, medias e grande porte'
    ],
    bestFor: ['paredes internas', 'fachadas', 'acabamento liso']
  },
  {
    title: 'Tintas e acabamentos',
    summary: 'Escolha correta de produto, brilho e resistencia para cada area.',
    icon: PaintBucket,
    specialties: [
      'Tintas Acrilicas',
      'Tintas Solvente',
      'Acabamentos Finos'
    ],
    bestFor: ['interiores', 'areas externas', 'alto padrao']
  },
  {
    title: 'Efeitos decorativos',
    summary: 'Tecnicas visuais para criar textura, profundidade e identidade.',
    icon: Sparkles,
    specialties: [
      'Pinturas com Efeitos',
      'Texturas',
      'Pistolas Industriais (Pinturas, Texturas e Efeitos)'
    ],
    bestFor: ['salas', 'paineis', 'ambientes comerciais']
  },
  {
    title: 'Pintura mecanizada',
    summary: 'Aplicacao com equipamentos para produtividade e padrao constante.',
    icon: SprayCan,
    specialties: [
      'Airless',
      'Pistolas Industriais (Pinturas, Texturas e Efeitos)',
      'Compressores de Pequenos, Medios e grande porte'
    ],
    bestFor: ['grandes areas', 'obras rapidas', 'acabamento uniforme']
  },
  {
    title: 'Metais e madeira',
    summary: 'Tratamentos especificos para aderencia, protecao e durabilidade.',
    icon: Hammer,
    specialties: [
      'Pinturas em Metais (Tratamento especial)',
      'Pinturas em Madeira (Tratamento especial)',
      'Tintas Solvente'
    ],
    bestFor: ['portoes', 'esquadrias', 'moveis e madeiras']
  },
  {
    title: 'Fachadas e altura',
    summary: 'Servicos externos que exigem preparo, seguranca e controle tecnico.',
    icon: Building2,
    specialties: [
      'NR-35 (trabalho em altura)',
      'EPIs',
      'Massa Acrilica (Aplicacao e lixamento)'
    ],
    bestFor: ['predios', 'sobrados', 'areas externas']
  },
  {
    title: 'Seguranca profissional',
    summary: 'Requisitos operacionais para obras com risco, altura ou equipamento.',
    icon: ShieldCheck,
    specialties: [
      'EPIs',
      'NR-35 (trabalho em altura)'
    ],
    bestFor: ['condominios', 'obras em altura', 'ambientes controlados']
  }
];

export const PaintingCategories: React.FC<PaintingCategoriesProps> = ({ setPage }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);

  useEffect(() => {
    document.title = 'Categorias de Pintura | Pintor Pro';
    document.querySelector('meta[name="description"]')?.setAttribute('content', 'Conheca as principais categorias de pintura, preparacao, acabamentos, texturas, pintura mecanizada e seguranca profissional na Pintor Pro.');
  }, []);

  const filteredCategories = useMemo(() => {
    const normalizedSearchTerm = normalizeText(searchTerm.trim());

    if (!normalizedSearchTerm) {
      return categories.map((category, index) => ({ category, index }));
    }

    return categories
      .map((category, index) => ({ category, index }))
      .filter(({ category }) => {
        const searchableText = [
          category.title,
          category.summary,
          ...category.specialties,
          ...category.bestFor
        ].join(' ');

        return normalizeText(searchableText).includes(normalizedSearchTerm);
      });
  }, [searchTerm]);

  const selectedCategory = categories[selectedCategoryIndex] ?? categories[0];
  const SelectedCategoryIcon = selectedCategory.icon;
  const registeredSpecialties = new Set(SPECIALTY_OPTIONS);

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.05fr,0.95fr] lg:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#9A077B]">Marketplace</p>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-[#000747] sm:text-6xl">
                Categorias de Pintura
              </h1>
              <p className="mt-5 max-w-3xl text-lg font-medium leading-relaxed text-slate-500">
                Entenda qual tipo de profissional procurar conforme a etapa da obra, o acabamento desejado e os requisitos tecnicos do servico.
              </p>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-5">
              <label className="mb-3 block text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                Buscar categoria
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Ex: textura, fachada, airless"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#9A077B] focus:ring-2 focus:ring-[#EFC6E3]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[22rem,1fr] lg:px-8">
        <aside className="space-y-3">
          {filteredCategories.length > 0 ? (
            filteredCategories.map(({ category, index }) => {
              const Icon = category.icon;
              const isSelected = selectedCategoryIndex === index;

              return (
                <button
                  key={category.title}
                  type="button"
                  onClick={() => setSelectedCategoryIndex(index)}
                  className={`flex w-full items-center gap-4 rounded-[24px] border px-4 py-4 text-left transition ${
                    isSelected
                      ? 'border-[#9A077B] bg-white text-[#000747] shadow-[0_18px_45px_rgba(154,7,123,0.12)]'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-[#EFC6E3] hover:text-[#000747]'
                  }`}
                >
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${isSelected ? 'bg-[#9A077B] text-white' : 'bg-slate-50 text-[#9A077B]'}`}>
                    <Icon size={22} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-black uppercase tracking-tight">{category.title}</span>
                    <span className="mt-1 block text-xs font-semibold leading-5 text-slate-400">{category.specialties.length} especialidades</span>
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
                </button>
              );
            })
          ) : (
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-white px-5 py-8 text-center">
              <p className="text-sm font-black text-[#000747]">Nenhuma categoria encontrada</p>
              <p className="mt-2 text-sm font-medium text-slate-500">Tente buscar por acabamento, textura ou equipamento.</p>
            </div>
          )}
        </aside>

        <div className="rounded-[36px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 border-b border-slate-100 pb-8 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#FDF3FA] text-[#9A077B]">
                <SelectedCategoryIcon size={30} />
              </div>
              <h2 className="text-3xl font-black tracking-tight text-[#000747] sm:text-4xl">{selectedCategory.title}</h2>
              <p className="mt-4 max-w-3xl text-base font-medium leading-relaxed text-slate-500">{selectedCategory.summary}</p>
            </div>

            <button
              type="button"
              onClick={() => setPage(Page.Home)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#9A077B] px-6 py-4 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-[#7F0665]"
            >
              <Brush className="h-4 w-4" />
              Encontrar Pintores
            </button>
          </div>

          <div className="grid gap-8 pt-8 xl:grid-cols-[1fr,20rem]">
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Especialidades relacionadas</h3>
              <div className="mt-5 grid gap-3">
                {selectedCategory.specialties.map((specialty) => (
                  <div key={specialty} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#9A077B]" />
                    <div>
                      <p className="text-sm font-black text-[#000747]">{specialty}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-400">
                        {registeredSpecialties.has(specialty as (typeof SPECIALTY_OPTIONS)[number])
                          ? 'Disponivel no cadastro e no perfil dos pintores.'
                          : 'Categoria informativa relacionada ao servico.'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] bg-[#000747] p-6 text-white">
              <Droplets className="h-8 w-8 text-[#C93EA6]" />
              <h3 className="mt-5 text-xl font-black tracking-tight">Mais indicada para</h3>
              <div className="mt-5 flex flex-wrap gap-2">
                {selectedCategory.bestFor.map((item) => (
                  <span key={item} className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-white/85">
                    {item}
                  </span>
                ))}
              </div>
              <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start gap-3">
                  <Factory className="mt-0.5 h-5 w-5 shrink-0 text-[#C93EA6]" />
                  <p className="text-sm font-medium leading-relaxed text-slate-300">
                    Em servicos de maior risco ou maior area, priorize pintores com portfolio real, equipamentos adequados e requisitos de seguranca informados no perfil.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
