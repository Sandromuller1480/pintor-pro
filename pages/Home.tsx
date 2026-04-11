
import React, { useEffect, useState } from 'react';
import { NavigateToPage, Page, Painter } from '../types';
import { HOW_IT_WORKS_CLIENTS, FAQ_DATA } from '../constants';
import { PainterCard } from '../components/PainterCard';
import { ClientLoginModal } from '../components/ClientLoginModal';
import { ClientSignupModal } from '../components/ClientSignupModal';
import { Logo } from '../components/Logo';
import { PublicPainterMap } from '../components/PublicPainterMap';
import { getCurrentClientProfile } from '../lib/services/clientSignupService';
import { paintersService } from '../lib/services/paintersService';
import mascostesImage from '../imagens/CASAL DE PINTORES.png';
import {
  CheckCircle,
  ShieldCheck,
  ChevronDown,
  Star,
  Paintbrush
} from 'lucide-react';

interface HomeProps {
  setPage: NavigateToPage;
}

const formatMetricValue = (value: number) => new Intl.NumberFormat('pt-BR').format(value);

export const Home: React.FC<HomeProps> = ({ setPage }) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [imgError, setImgError] = useState(false);
  const [painters, setPainters] = useState<Painter[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleHomePainterCount, setVisibleHomePainterCount] = useState<number | null>(null);
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
      } catch (error) {
        console.error('Erro ao carregar pintores na home:', error);

        if (!isMounted) {
          return;
        }

        setPainters([]);
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
        setPage(Page.FindPainter);
        return;
      }
    } catch (error) {
      console.error('Erro ao verificar cliente logado na home:', error);
    } finally {
      setIsCheckingClientAccess(false);
    }

    setIsClientLoginModalOpen(true);
  };

  const featuredPainters = painters.slice(0, 3);
  const socialProofPainters = painters.slice(0, 4);
  const totalPainters = painters.length;
  const verifiedPainters = painters.filter((painter) => painter.verified).length;
  const topRatedPainters = painters.filter((painter) => painter.topRated).length;
  const totalReviews = painters.reduce((total, painter) => total + Math.max(0, painter.reviewsCount), 0);
  const ratedPainters = painters.filter((painter) => painter.reviewsCount > 0 && painter.rating > 0);
  const averageRating = ratedPainters.length > 0
    ? ratedPainters.reduce((total, painter) => total + painter.rating, 0) / ratedPainters.length
    : 0;
  const uniqueLocations = Array.from(
    new Set(
      painters
        .map((painter) => painter.location.trim())
        .filter(Boolean)
    )
  );
  const uniqueSpecialties = Array.from(
    new Set(
      painters
        .flatMap((painter) => painter.specialties ?? [])
        .map((specialty) => specialty.trim())
        .filter(Boolean)
    )
  );
  const hasDirectoryData = totalPainters > 0;
  const totalPaintersLabel = formatMetricValue(totalPainters);
  const verifiedPaintersLabel = formatMetricValue(verifiedPainters);
  const topRatedPaintersLabel = formatMetricValue(topRatedPainters);
  const totalReviewsLabel = formatMetricValue(totalReviews);
  const uniqueLocationsLabel = formatMetricValue(uniqueLocations.length);
  const uniqueSpecialtiesLabel = formatMetricValue(uniqueSpecialties.length);
  const socialProofLabel = totalReviews > 0 && averageRating > 0
    ? `${averageRating.toFixed(1)} de média em ${totalReviewsLabel} avaliações públicas`
    : `${totalPaintersLabel} perfis publicados na vitrine`;
  const homeMapBadgeCount = visibleHomePainterCount ?? totalPainters;
  const homeMapBadgeLabel = visibleHomePainterCount === null ? 'Perfis ativos' : 'Na área atual';

  return (
    <div className="overflow-x-hidden">
      {/* HERO SECTION - PUBLICITÁRIA */}
      <section className="relative bg-white pt-12 pb-24 lg:pt-20 lg:pb-40 overflow-hidden">
        <div className="absolute top-[10%] right-[5%] w-[400px] h-[400px] bg-[#FDF3FA] rounded-full blur-[100px] -z-10"></div>
        <div className="absolute bottom-[5%] left-[40%] w-[500px] h-[500px] bg-[#FDF3FA]/50 rounded-full blur-[120px] -z-10"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

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
                  {isCheckingClientAccess ? 'Verificando...' : 'Contratar Agora'}
                </button>
                <button
                  onClick={() => setPage(Page.Register)}
                  className="bg-white border-2 border-slate-100 text-[#1e293b] px-10 py-6 rounded-2xl font-black text-lg hover:border-[#9A077B] hover:text-[#9A077B] transition-all duration-300 flex items-center justify-center uppercase tracking-[0.1em] shadow-sm"
                >
                  Sou Pintor PRO
                </button>
              </div>

              <div className="flex items-center gap-8 pt-8">
                <div className="flex -space-x-3">
                  {socialProofPainters.length > 0 ? (
                    socialProofPainters.map((painter) => (
                      <img
                        key={painter.id}
                        src={painter.avatar}
                        alt={painter.name}
                        className="w-12 h-12 rounded-full border-4 border-white shadow-sm object-cover"
                      />
                    ))
                  ) : (
                    [1, 2, 3, 4].map((item) => (
                      <div key={item} className="w-12 h-12 rounded-full border-4 border-white shadow-sm bg-slate-100" />
                    ))
                  )}
                </div>
                <div>
                  <div className="flex text-yellow-400 mb-1">
                    <Star className="fill-current w-3.5 h-3.5" /><Star className="fill-current w-3.5 h-3.5" /><Star className="fill-current w-3.5 h-3.5" /><Star className="fill-current w-3.5 h-3.5" /><Star className="fill-current w-3.5 h-3.5" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{socialProofLabel}</p>
                </div>
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
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status</div>
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

      {/* SEÇÃO: VITRINE COM DADOS REAIS */}
      <section className="py-32 bg-slate-900 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

            <div className="order-2 lg:order-1 relative">
              <PublicPainterMap
                painters={painters}
                onOpenDirectory={() => setPage(Page.FindPainter)}
                onOpenPainter={(painterId) => setPage(Page.PainterProfile, { painterId })}
                onVisiblePaintersChange={(visiblePainters) => setVisibleHomePainterCount(visiblePainters.length)}
                variant="home"
              />

              {/* Badge de Pintores na Area */}
              <div className="absolute -top-10 -right-10 bg-[#9A077B] text-white p-8 rounded-[40px] shadow-3xl border border-white/20">
                <p className="text-4xl font-black mb-1">{formatMetricValue(homeMapBadgeCount)}</p>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{homeMapBadgeLabel}</p>
              </div>
            </div>

            <div className="order-1 lg:order-2 space-y-8">
              <h2 className="text-[#B21492] font-black uppercase tracking-[0.3em] text-xs">Vitrine Pública</h2>
              <h3 className="text-5xl lg:text-6xl font-black text-white tracking-tighter leading-none">
                {hasDirectoryData ? `${totalPaintersLabel} perfis reais` : 'A vitrine pública'} <br /> já publicados <span className="text-[#B21492] underline decoration-slate-700">na plataforma.</span>
              </h3>
              <p className="text-slate-400 text-xl font-medium leading-relaxed max-w-md">
                {hasDirectoryData
                  ? `Hoje a busca pública reúne ${totalPaintersLabel} pintores, ${verifiedPaintersLabel} verificados, ${uniqueSpecialtiesLabel} especialidades cadastradas e presença em ${uniqueLocationsLabel} regiões da vitrine.`
                  : 'Os perfis aprovados aparecem aqui com cidade, especialidades, portfólio e selos de confiança.'}
              </p>
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-4 text-white">
                  <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-[#B21492]"><CheckCircle size={20} /></div>
                  <span className="font-bold text-lg">Filtro por cidade, especialidade e palavras-chave</span>
                </div>
                <div className="flex items-center gap-4 text-white">
                  <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-[#B21492]"><CheckCircle size={20} /></div>
                  <span className="font-bold text-lg">Perfis com selos, portfólio e avaliações públicas</span>
                </div>
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
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{topRatedPainters > 0 ? 'Top Avaliados' : 'Regiões Ativas'}</div>
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
      <section className="py-32 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-[#9A077B] font-black uppercase tracking-[0.3em] text-xs mb-6">Galeria de Elite</h2>
              <h3 className="text-5xl font-black text-slate-900 tracking-tighter">Acabamentos que inspiram.</h3>
            </div>
            <button onClick={() => setPage(Page.FindPainter)} className="bg-white border-2 border-slate-900 text-slate-900 px-8 py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all duration-300">
              Ver Todos os Pintores
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {loading ? (
              <div className="col-span-full py-20 text-center font-black text-slate-300 uppercase tracking-widest">Carregando Elite...</div>
            ) : (
                featuredPainters.map((painter, idx) => (
                <PainterCard key={idx} painter={painter} onClick={(id) => setPage(Page.PainterProfile, { painterId: id })} />
              ))
            )}
          </div>
        </div>
      </section>

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
        onSuccess={() => setPage(Page.FindPainter)}
        onShowSignup={() => setIsClientSignupModalOpen(true)}
      />

      <ClientSignupModal
        isOpen={isClientSignupModalOpen}
        onClose={() => setIsClientSignupModalOpen(false)}
        onSuccess={() => setPage(Page.FindPainter)}
      />
    </div>
  );
};
