
import React, { useEffect, useMemo, useState } from 'react';
import { NavigateToPage, Page, Painter } from '../types';
import { HOW_IT_WORKS_CLIENTS, FAQ_DATA } from '../constants';
import { PainterCard } from '../components/PainterCard';
import { ClientLoginModal } from '../components/ClientLoginModal';
import { ClientSignupModal } from '../components/ClientSignupModal';
import { Logo } from '../components/Logo';
import { PublicPainterMap } from '../components/PublicPainterMap';
import { getCurrentClientProfile } from '../lib/services/clientSignupService';
import { paintersService } from '../lib/services/paintersService';
import mascostesImage from '../imagens/CASAL DE PINTORES.jpg';
import {
  MapPin,
  ShieldCheck,
  ChevronDown,
  SlidersHorizontal,
  Paintbrush
} from 'lucide-react';

interface HomeProps {
  setPage: NavigateToPage;
}

const formatMetricValue = (value: number) => new Intl.NumberFormat('pt-BR').format(value);

type LocationFocusRequest = {
  location: string;
  requestId: number;
};

const normalizeText = (value: string) => (
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
);

const matchesNormalizedTerm = (source: string, query: string) => {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return true;
  }

  const normalizedSource = normalizeText(source);

  if (normalizedSource.includes(normalizedQuery)) {
    return true;
  }

  return normalizedQuery
    .split(' ')
    .every((term) => normalizedSource.includes(term));
};

export const Home: React.FC<HomeProps> = ({ setPage }) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [imgError, setImgError] = useState(false);
  const [painters, setPainters] = useState<Painter[]>([]);
  const [loading, setLoading] = useState(true);
  const [painterSearchError, setPainterSearchError] = useState('');
  const [locationDraft, setLocationDraft] = useState('');
  const [appliedLocationTerm, setAppliedLocationTerm] = useState('');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [onlyTopRated, setOnlyTopRated] = useState(false);
  const [onlyOnline, setOnlyOnline] = useState(false);
  const [visiblePainterIds, setVisiblePainterIds] = useState<string[] | null>(null);
  const [isLocationSuggestionsOpen, setIsLocationSuggestionsOpen] = useState(false);
  const [locationFocusRequest, setLocationFocusRequest] = useState<LocationFocusRequest | null>(null);
  const [isClientLoginModalOpen, setIsClientLoginModalOpen] = useState(false);
  const [isClientSignupModalOpen, setIsClientSignupModalOpen] = useState(false);
  const [isCheckingClientAccess, setIsCheckingClientAccess] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadPainters(silent = false) {
      if (!silent) {
        setLoading(true);
      }

      try {
        const data = await paintersService.getAll();

        if (!isMounted) {
          return;
        }

        setPainters(data);
        setPainterSearchError('');
      } catch (error) {
        console.error('Erro ao carregar pintores na home:', error);

        if (!isMounted) {
          return;
        }

        setPainters([]);
        if (!silent) {
          setPainterSearchError('Não foi possível carregar os pintores agora.');
        }
      } finally {
        if (isMounted && !silent) {
          setLoading(false);
        }
      }
    }

    const handleWindowFocus = () => {
      void loadPainters(true);
    };

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void loadPainters(true);
      }
    }, 30_000);

    window.addEventListener('focus', handleWindowFocus);
    void loadPainters();

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  const handleHireNowClick = async () => {
    setIsCheckingClientAccess(true);

    try {
      const currentClientProfile = await getCurrentClientProfile();

      if (currentClientProfile) {
        return;
      }
    } catch (error) {
      console.error('Erro ao verificar cliente logado na home:', error);
    } finally {
      setIsCheckingClientAccess(false);
    }

    setIsClientLoginModalOpen(true);
  };

  const totalPainters = painters.length;
  const verifiedPainters = painters.filter((painter) => painter.verified).length;
  const topRatedPainters = painters.filter((painter) => painter.topRated).length;
  const totalReviews = painters.reduce((total, painter) => total + Math.max(0, painter.reviewsCount), 0);
  const ratedPainters = painters.filter((painter) => painter.reviewsCount > 0 && painter.rating > 0);
  const averageRating = ratedPainters.length > 0
    ? ratedPainters.reduce((total, painter) => total + painter.rating, 0) / ratedPainters.length
    : 0;
  const uniqueLocations = Array.from(
    new Set<string>(
      painters
        .map((painter) => painter.location.trim())
        .filter(Boolean)
    )
  );
  const totalPaintersLabel = formatMetricValue(totalPainters);
  const verifiedPaintersLabel = formatMetricValue(verifiedPainters);
  const topRatedPaintersLabel = formatMetricValue(topRatedPainters);
  const totalReviewsLabel = formatMetricValue(totalReviews);
  const uniqueLocationsLabel = formatMetricValue(uniqueLocations.length);
  const availableSpecialties = useMemo(() => {
    return Array.from(
      new Set<string>(
        painters.flatMap((painter) => painter.specialties ?? [])
      )
    )
      .sort((firstItem, secondItem) => firstItem.localeCompare(secondItem, 'pt-BR'))
      .slice(0, 10);
  }, [painters]);

  const locationSuggestions = useMemo(() => {
    const trimmedDraft = locationDraft.trim();

    if (!trimmedDraft) {
      return uniqueLocations.slice(0, 8);
    }

    return uniqueLocations
      .filter((location) => matchesNormalizedTerm(location, trimmedDraft))
      .slice(0, 8);
  }, [locationDraft, uniqueLocations]);

  const filteredPainters = useMemo(() => {
    const normalizedLocationTerm = normalizeText(appliedLocationTerm);

    return painters.filter((painter) => {
      const matchesLocation = !normalizedLocationTerm || matchesNormalizedTerm(painter.location, normalizedLocationTerm);
      const matchesSpecialties = selectedSpecialties.length === 0 ||
        selectedSpecialties.every((specialty) => (
          painter.specialties.some((painterSpecialty) => normalizeText(painterSpecialty) === normalizeText(specialty))
        ));
      const matchesVerified = !onlyVerified || painter.verified;
      const matchesTopRated = !onlyTopRated || painter.topRated;
      const matchesOnline = !onlyOnline || painter.isOnline === true;

      return matchesLocation && matchesSpecialties && matchesVerified && matchesTopRated && matchesOnline;
    });
  }, [appliedLocationTerm, onlyOnline, onlyTopRated, onlyVerified, painters, selectedSpecialties]);

  const filteredPainterIdsKey = useMemo(
    () => filteredPainters.map((painter) => painter.id).join('|'),
    [filteredPainters]
  );

  useEffect(() => {
    setVisiblePainterIds(null);
  }, [filteredPainterIdsKey]);

  const displayedPainters = useMemo(() => {
    if (visiblePainterIds === null) {
      return filteredPainters;
    }

    return filteredPainters.filter((painter) => visiblePainterIds.includes(painter.id));
  }, [filteredPainters, visiblePainterIds]);

  const handleSearchSubmit = (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const nextLocation = locationDraft.trim();

    setAppliedLocationTerm(nextLocation);
    setLocationFocusRequest(nextLocation ? {
      location: nextLocation,
      requestId: Date.now()
    } : null);
    setIsLocationSuggestionsOpen(false);
  };

  const clearFilters = () => {
    setLocationDraft('');
    setAppliedLocationTerm('');
    setSelectedSpecialties([]);
    setOnlyVerified(false);
    setOnlyTopRated(false);
    setOnlyOnline(false);
    setIsLocationSuggestionsOpen(false);
    setLocationFocusRequest(null);
  };

  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties((currentSpecialties) =>
      currentSpecialties.includes(specialty)
        ? currentSpecialties.filter((item) => item !== specialty)
        : [...currentSpecialties, specialty]
    );
  };

  return (
    <div className="overflow-x-hidden">
      {/* HERO SECTION - PUBLICITÁRIA */}
      <section className="relative bg-white pt-12 pb-8 lg:pt-20 lg:pb-10 overflow-hidden">
        <div className="absolute top-[10%] right-[5%] w-[400px] h-[400px] bg-[#FDF3FA] rounded-full blur-[100px] -z-10"></div>
        <div className="absolute bottom-[5%] left-[40%] w-[500px] h-[500px] bg-[#FDF3FA]/50 rounded-full blur-[120px] -z-10"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">

            <div className="space-y-8 animate-in">
              <div className="inline-flex items-center bg-gradient-to-r from-[#C93EA6] to-[#9A077B] text-white px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-[#EFC6E3]">
                <Paintbrush className="w-3 h-3 mr-2" /> Plataforma Líder no Brasil
              </div>

              <div className="relative">
                <h1 className="text-6xl lg:text-[6.5rem] font-black text-[#1e293b] leading-[0.85] tracking-tighter mb-6">
                  Sua obra <br /> merece o <br />
                  <span className="relative inline-block mt-4">
                    <span className="relative z-10 text-white px-6">Padrão PRO.</span>
                    <span className="absolute inset-0 bg-[#9A077B] -rotate-1 scale-105 shadow-xl shadow-[#C93EA6]/30"></span>
                  </span>
                </h1>
              </div>

              <p className="text-xl text-slate-500 leading-relaxed max-w-lg font-medium border-l-4 border-slate-200 pl-6">
                Conectamos os usuários aos pintores de elite que dominam as técnicas mais avançadas do mercado.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  onClick={() => void handleHireNowClick()}
                  disabled={isCheckingClientAccess}
                  className="bg-[#000747] text-white px-12 py-6 rounded-2xl font-black text-lg hover:bg-[#9A077B] transition-all duration-300 shadow-2xl flex items-center justify-center uppercase tracking-[0.1em] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isCheckingClientAccess ? 'Verificando...' : 'Contratar Pintor'}
                </button>
                <button
                  onClick={() => setPage(Page.Register)}
                  className="bg-white border-2 border-[#000747] text-[#000747] px-10 py-6 rounded-2xl font-black text-lg hover:border-[#9A077B] hover:text-[#9A077B] transition-all duration-300 flex items-center justify-center uppercase tracking-[0.1em] shadow-sm"
                >
                  Sou Pintor
                </button>
              </div>

            </div>

            <div className="relative">
              {/* Frame Container - Reforçado para visibilidade */}
              <div className="relative z-10 w-full max-w-[620px] mx-auto bg-gradient-to-b from-slate-50 to-slate-200 rounded-[60px] overflow-hidden border-[12px] border-white shadow-[0_60px_100px_-20px_rgba(0,0,0,0.12)]">
                {!imgError ? (
                  <img
                    src={mascostesImage}
                    alt="Padrão Pintor PRO"
                    className="block w-full h-auto"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-12">
                    <Logo className="h-32 mb-6" color="#000" />
                    <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Aguardando Carregamento do Mascote</p>
                  </div>
                )}

                {/* Selo Animado da UI */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-[360px] animate-in slide-in-from-bottom duration-700 delay-300 z-20">
                  <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-white flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#9A077B] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#EFC6E3]"><ShieldCheck size={22} /></div>
                    <div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Situação</div>
                      <div className="text-sm font-black text-slate-900 leading-none uppercase">Pintor Verificado</div>
                    </div>
                  </div>
                </div>

                {/* Overlay de gradiente inferior para fusão suave */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-200/50 via-transparent to-transparent pointer-events-none"></div>
              </div>

              <div className="absolute -top-16 -right-16 w-64 h-64 bg-[#9A077B]/5 rounded-full blur-[80px]"></div>
              <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#C93EA6]/10 rounded-full blur-[100px]"></div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 pt-6 pb-12 lg:pt-8 lg:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white p-6 rounded-[32px] shadow-md border-2 border-slate-300 mb-12">
            <form className="grid grid-cols-1 md:grid-cols-12 gap-4" onSubmit={handleSearchSubmit}>
              <div className="relative md:col-span-9">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Cidade ou região"
                  autoComplete="off"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#9A077B] focus:border-transparent outline-none transition font-medium"
                  value={locationDraft}
                  onFocus={() => setIsLocationSuggestionsOpen(true)}
                  onBlur={() => {
                    window.setTimeout(() => setIsLocationSuggestionsOpen(false), 120);
                  }}
                  onChange={(event) => {
                    setLocationDraft(event.target.value);
                    setIsLocationSuggestionsOpen(true);
                  }}
                />

                {isLocationSuggestionsOpen && (
                  <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.12)]">
                    {locationSuggestions.length > 0 ? (
                      locationSuggestions.map((location) => (
                        <button
                          key={location}
                          type="button"
                          className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            setLocationDraft(location);
                            setIsLocationSuggestionsOpen(false);
                          }}
                        >
                          <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                          <span className="truncate">{location}</span>
                        </button>
                      ))
                    ) : locationDraft.trim() ? (
                      <div className="px-4 py-3 text-sm font-medium text-slate-400">Nenhuma cidade encontrada.</div>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="md:col-span-3">
                <button type="submit" className="w-full bg-[#9A077B] text-white py-4 rounded-2xl font-bold hover:bg-[#7F0665] transition shadow-lg shadow-[#EFC6E3]">
                  Buscar Pintores
                </button>
              </div>
            </form>
          </div>

          <div className="mb-12">
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-[#9A077B] text-xs font-black uppercase tracking-[0.28em] mb-2">Mapa da Busca</h2>
                <p className="text-2xl font-black tracking-tight text-slate-900">Explore a área visível e encontre pintores por região.</p>
              </div>
              <p className="text-sm font-bold text-slate-500">
                Mostrando <span className="text-[#9A077B]">{displayedPainters.length}</span> de <span className="text-slate-900">{filteredPainters.length}</span> pintores na área atual do mapa
              </p>
            </div>

            <div className="mx-auto max-w-[82rem]">
              <PublicPainterMap
                painters={filteredPainters}
                onOpenPainter={(painterId) => setPage(Page.PainterProfile, { painterId })}
                onVisiblePaintersChange={(visiblePainters) => setVisiblePainterIds(visiblePainters.map((painter) => painter.id))}
                primaryActionLabel="Entrar em contato"
                showDirectoryButton={false}
                size="compact"
                focusRequest={locationFocusRequest}
              />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="lg:w-72 space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold flex items-center"><SlidersHorizontal className="w-4 h-4 mr-2" /> Filtros</h3>
                  <button className="text-xs text-[#9A077B] font-bold hover:underline" onClick={clearFilters}>Limpar</button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Especialidade</h4>
                    <div className="space-y-2">
                      {availableSpecialties.length > 0 ? availableSpecialties.map((specialty) => (
                        <label key={specialty} className="flex items-center gap-2 cursor-pointer group">
                          <input type="checkbox" checked={selectedSpecialties.includes(specialty)} onChange={() => toggleSpecialty(specialty)} className="w-4 h-4 min-w-4 min-h-4 shrink-0 rounded border-slate-300 text-[#9A077B] focus:ring-[#9A077B]" />
                          <span className="text-sm text-slate-600 group-hover:text-[#000747] transition">{specialty}</span>
                        </label>
                      )) : (
                        <p className="text-sm text-slate-400">Nenhuma especialidade disponível.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Selo de Confiança</h4>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" checked={onlyVerified} onChange={(event) => setOnlyVerified(event.target.checked)} className="w-4 h-4 min-w-4 min-h-4 shrink-0 rounded border-slate-300 text-[#9A077B] focus:ring-[#9A077B]" />
                        <span className="text-sm text-slate-600 group-hover:text-[#000747] transition">Verificado</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" checked={onlyTopRated} onChange={(event) => setOnlyTopRated(event.target.checked)} className="w-4 h-4 min-w-4 min-h-4 shrink-0 rounded border-slate-300 text-[#9A077B] focus:ring-[#9A077B]" />
                        <span className="text-sm text-slate-600 group-hover:text-[#000747] transition">Melhor avaliado</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Disponibilidade</h4>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" checked={onlyOnline} onChange={(event) => setOnlyOnline(event.target.checked)} className="w-4 h-4 min-w-4 min-h-4 shrink-0 rounded border-slate-300 text-[#9A077B] focus:ring-[#9A077B]" />
                      <span className="text-sm text-slate-600 group-hover:text-[#000747] transition">Somente on-line</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-[#9A077B] rounded-2xl p-6 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <h4 className="font-bold mb-2">Quer aparecer aqui?</h4>
                  <p className="text-xs text-[#F7E3F1] mb-4 leading-relaxed">Profissionais aprovados aparecem na vitrine da PINTOR PRO e recebem contatos mais qualificados.</p>
                  <button onClick={() => setPage(Page.Register)} className="w-full bg-white text-[#9A077B] py-3 rounded-xl font-bold text-sm hover:bg-slate-50 transition">Cadastrar Perfil</button>
                </div>
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full"></div>
              </div>
            </aside>

            <div className="flex-1">
              <div className="flex justify-between items-center mb-6">
                <p className="text-slate-500 font-medium">{displayedPainters.length} pintores encontrados</p>
                <div className="flex items-center gap-2 text-sm font-bold cursor-default text-slate-500">
                  <span>Ordenar por: <span className="text-[#9A077B]">Mais recentes</span></span>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>

              {painterSearchError && (
                <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">{painterSearchError}</div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {loading ? (
                  <div className="col-span-full py-20 text-center font-black text-slate-300 uppercase tracking-widest">Carregando pintores...</div>
                ) : displayedPainters.length > 0 ? (
                  displayedPainters.map((painter) => (
                    <PainterCard key={painter.id} painter={painter} onClick={(id) => setPage(Page.PainterProfile, { painterId: id })} />
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center text-slate-400 font-medium">
                    {filteredPainters.length > 0 ? 'Nenhum pintor visível na área atual do mapa. Arraste ou ajuste o zoom para ver mais profissionais.' : 'Nenhum pintor encontrado com os filtros atuais.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO DE ESTATÍSTICAS */}
      <section className="py-20 bg-[#000747] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
            <div className="space-y-4">
              <div className="text-5xl font-black text-[#B21492] tracking-tighter">{totalPaintersLabel}</div>
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Perfis Publicados</div>
            </div>
            <div className="space-y-4">
              <div className="text-5xl font-black text-[#B21492] tracking-tighter">{verifiedPaintersLabel}</div>
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Pintores Verificados</div>
            </div>
            <div className="space-y-4">
              <div className="text-5xl font-black text-[#B21492] tracking-tighter">{totalReviewsLabel}</div>
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Avaliações Públicas</div>
            </div>
            <div className="space-y-4">
              <div className="text-5xl font-black text-[#B21492] tracking-tighter">{topRatedPainters > 0 ? topRatedPaintersLabel : uniqueLocationsLabel}</div>
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{topRatedPainters > 0 ? 'Melhores avaliados' : 'Regiões Ativas'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <h2 className="text-[#9A077B] font-black uppercase tracking-[0.3em] text-xs mb-6">Processo Premium</h2>
            <h3 className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter leading-tight">Como elevamos o seu projeto.</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            {HOW_IT_WORKS_CLIENTS.map((item, idx) => (
              <div key={idx} className="relative group">
                <div className="mb-10 relative">
                  <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center group-hover:bg-[#9A077B] group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-xl group-hover:shadow-[#EFC6E3]">
                    {React.cloneElement(item.icon as React.ReactElement<any>, { size: 36 })}
                  </div>
                  <div className="absolute -top-4 -right-4 w-12 h-12 bg-white border border-slate-100 rounded-full flex items-center justify-center font-black text-slate-200 text-xl">0{idx + 1}</div>
                </div>
                <h4 className="text-2xl font-black mb-6 uppercase tracking-tight text-slate-900">{item.title}</h4>
                <p className="text-slate-500 leading-relaxed font-medium text-lg">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEÇÃO de PORTFÓLIOS */}
      {/* SEÇÃO de PERGUNTAS FREQUENTES (FAQ) */}
      <section className="py-32 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-[#9A077B] font-black uppercase tracking-[0.3em] text-xs mb-6">Suporte</h2>
            <h3 className="text-5xl font-black text-slate-900 tracking-tighter">Perguntas Frequentes.</h3>
          </div>
          <div className="space-y-6">
            {FAQ_DATA.map((item, idx) => (
              <div key={idx} className="border-2 border-slate-100 rounded-[24px] overflow-hidden transition-all duration-300 hover:border-[#EFC6E3]">
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-8 text-left transition"
                >
                  <span className="font-black text-slate-800 text-lg uppercase tracking-tight leading-tight">{item.q}</span>
                  <div className={`shrink-0 ml-4 transition-transform duration-300 ${activeFaq === idx ? 'rotate-180 text-[#9A077B]' : 'text-slate-400'}`}>
                    <ChevronDown size={28} />
                  </div>
                </button>
                <div className={`overflow-hidden transition-all duration-500 ease-in-out ${activeFaq === idx ? 'max-h-96' : 'max-h-0'}`}>
                  <div className="px-8 pb-8 pt-2 bg-slate-50/50 text-slate-600 font-medium leading-relaxed text-lg">
                    {item.a}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ClientLoginModal
        isOpen={isClientLoginModalOpen}
        onClose={() => setIsClientLoginModalOpen(false)}
        onSuccess={() => setIsClientLoginModalOpen(false)}
        onShowSignup={() => setIsClientSignupModalOpen(true)}
      />

      <ClientSignupModal
        isOpen={isClientSignupModalOpen}
        onClose={() => setIsClientSignupModalOpen(false)}
        onSuccess={() => setIsClientSignupModalOpen(false)}
      />
    </div>
  );
};
