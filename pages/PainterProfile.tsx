import React, { useEffect, useState } from 'react';
import { Heart, Loader2, MapPin, Share2, Shield, Star } from 'lucide-react';
import { MOCK_PAINTERS } from '../constants';
import { ScheduleVisitModal } from '../components/ScheduleVisitModal';
import { StartChatModal } from '../components/StartChatModal';
import { ClientLoginModal } from '../features/client-auth/components/ClientLoginModal';
import { ClientSignupModal } from '../features/client-auth/components/ClientSignupModal';
import { getCurrentClientProfile } from '../lib/services/clientSignupService';
import { paintersService } from '../lib/services/paintersService';
import { supabase } from '../lib/supabase';
import { PainterAboutSection } from '../features/painter-profile/components/PainterAboutSection';
import { PainterActionsSidebar } from '../features/painter-profile/components/PainterActionsSidebar';
import { PainterPortfolioSection } from '../features/painter-profile/components/PainterPortfolioSection';
import { PainterReviewsSection } from '../features/painter-profile/components/PainterReviewsSection';
import { PainterTabsNav } from '../features/painter-profile/components/PainterTabsNav';
import { PainterProfileTab } from '../features/painter-profile/types';
import { isUuid } from '../features/painter-profile/utils';
import { NavigateToPage, Page, Painter, PainterReview, PortfolioItem } from '../types';

interface PainterProfileProps {
  painterId?: string;
  setPage?: NavigateToPage;
}

export const PainterProfile: React.FC<PainterProfileProps> = ({ painterId, setPage }) => {
  const [checkingClientAction, setCheckingClientAction] = useState<'chat' | 'visit' | null>(null);
  const [painter, setPainter] = useState<Painter | null>(null);
  const [loading, setLoading] = useState(true);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const [portfolioError, setPortfolioError] = useState('');
  const [reviewItems, setReviewItems] = useState<PainterReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState('');
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isScheduleVisitModalOpen, setIsScheduleVisitModalOpen] = useState(false);
  const [isClientLoginModalOpen, setIsClientLoginModalOpen] = useState(false);
  const [isClientSignupModalOpen, setIsClientSignupModalOpen] = useState(false);
  const [pendingClientAction, setPendingClientAction] = useState<'chat' | 'visit' | null>(null);
  const [activeTab, setActiveTab] = useState<PainterProfileTab>('portfolio');

  const hasRealReviews = (painter?.reviewsCount ?? 0) > 0 && (painter?.rating ?? 0) > 0;
  const publicApplicationId = painter?.applicationId;
  const isPainterOffline = painter?.isOnline === false;
  const isLeadPaused = painter?.pauseLeadIntake === true;
  const allowsChat = painter?.allowChat !== false;
  const allowsVisitRequests = painter?.allowVisitRequests !== false;
  const hasSchedulableProfile = Boolean(publicApplicationId && isUuid(publicApplicationId));
  const canScheduleVisit = hasSchedulableProfile && !isPainterOffline && !isLeadPaused && allowsVisitRequests;
  const canStartChat = hasSchedulableProfile && !isPainterOffline && !isLeadPaused && allowsChat;

  const openProtectedClientAction = (action: 'chat' | 'visit') => {
    if (action === 'chat') {
      if (!canStartChat) {
        return;
      }

      setIsChatModalOpen(true);
      return;
    }

    if (!canScheduleVisit) {
      return;
    }

    setIsScheduleVisitModalOpen(true);
  };

  const handleCloseClientLogin = () => {
    setIsClientLoginModalOpen(false);
    setPendingClientAction(null);
  };

  const handleCloseClientSignup = () => {
    setIsClientSignupModalOpen(false);
    setPendingClientAction(null);
  };

  const handleShowClientSignup = () => {
    setIsClientLoginModalOpen(false);
    setIsClientSignupModalOpen(true);
  };

  const handleClientSignupSuccess = () => {
    setIsClientSignupModalOpen(false);
    setIsClientLoginModalOpen(true);
  };

  const handleClientLoginSuccess = () => {
    setIsClientLoginModalOpen(false);

    if (!pendingClientAction) {
      return;
    }

    const actionToOpen = pendingClientAction;
    setPendingClientAction(null);
    openProtectedClientAction(actionToOpen);
  };

  const handleProtectedClientAction = async (action: 'chat' | 'visit') => {
    if ((action === 'chat' && !canStartChat) || (action === 'visit' && !canScheduleVisit)) {
      return;
    }

    setCheckingClientAction(action);

    try {
      const currentClientProfile = await getCurrentClientProfile();

      if (currentClientProfile) {
        openProtectedClientAction(action);
        return;
      }

      setPendingClientAction(action);
      setIsClientLoginModalOpen(true);
    } catch (error) {
      console.error('Erro ao verificar acesso do cliente para acao protegida:', error);
      setPendingClientAction(action);
      setIsClientLoginModalOpen(true);
    } finally {
      setCheckingClientAction(null);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function loadPainter() {
      setLoading(true);

      if (!painterId) {
        if (!cancelled) {
          setPainter(MOCK_PAINTERS[0] ?? null);
          setLoading(false);
        }
        return;
      }

      const found = await paintersService.getById(painterId);
      const fallback = MOCK_PAINTERS.find((item) => item.id === painterId) ?? null;

      if (!cancelled) {
        setPainter(found ?? fallback);
        setLoading(false);
      }
    }

    void loadPainter();
    return () => {
      cancelled = true;
    };
  }, [painterId]);

  useEffect(() => {
    const targetApplicationId = publicApplicationId && isUuid(publicApplicationId)
      ? publicApplicationId
      : painterId && isUuid(painterId)
        ? painterId
        : null;

    if (!targetApplicationId) {
      return;
    }

    let isMounted = true;

    const refreshPainterPresence = async () => {
      try {
        const nextPainter = await paintersService.getById(targetApplicationId);

        if (!isMounted || !nextPainter) {
          return;
        }

        setPainter((currentPainter) => currentPainter ? { ...currentPainter, ...nextPainter } : nextPainter);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        console.error('Erro ao atualizar status publico do pintor em tempo real:', error);
      }
    };

    const handleWindowFocus = () => {
      void refreshPainterPresence();
    };

    const presenceIntervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void refreshPainterPresence();
      }
    }, 15_000);

    window.addEventListener('focus', handleWindowFocus);

    const presenceChannel = supabase
      .channel(`public-painter-profile-${targetApplicationId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'applications',
        filter: `id=eq.${targetApplicationId}`
      }, () => {
        void refreshPainterPresence();
      })
      .subscribe();

    return () => {
      isMounted = false;
      window.clearInterval(presenceIntervalId);
      window.removeEventListener('focus', handleWindowFocus);
      void supabase.removeChannel(presenceChannel);
    };
  }, [painterId, publicApplicationId]);

  useEffect(() => {
    let cancelled = false;

    async function loadPortfolio() {
      if (loading) {
        return;
      }

      setPortfolioLoading(true);
      setPortfolioError('');

      if (!painter) {
        if (!cancelled) {
          setPortfolioItems([]);
          setPortfolioLoading(false);
        }
        return;
      }

      const ownerIds = Array.from(
        new Set(
          [painter.portfolioOwnerId, painter.id].filter((value): value is string => Boolean(value) && isUuid(value))
        )
      );

      if (ownerIds.length === 0) {
        if (!cancelled) {
          setPortfolioItems([]);
          setPortfolioLoading(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from('obras')
        .select('id, pintor_id, titulo, local, tipo_imovel, tipo_pintura, status, imagem_url, video_url, created_at')
        .in('pintor_id', ownerIds)
        .order('created_at', { ascending: false });

      if (cancelled) {
        return;
      }

      if (error) {
        console.error('Erro ao carregar portfolio publico do pintor:', error);
        setPortfolioItems([]);
        setPortfolioError('Nao foi possivel carregar o portfolio deste pintor agora.');
        setPortfolioLoading(false);
        return;
      }

      setPortfolioItems((data ?? []).map((item: any) => ({
        id: item.id,
        painterId: item.pintor_id,
        title: item.titulo,
        location: item.local,
        propertyType: item.tipo_imovel,
        paintType: item.tipo_pintura,
        status: item.status,
        imageUrl: item.imagem_url,
        videoUrl: item.video_url,
        createdAt: item.created_at
      })));
      setPortfolioLoading(false);
    }

    void loadPortfolio();

    return () => {
      cancelled = true;
    };
  }, [loading, painter]);

  useEffect(() => {
    let cancelled = false;

    async function loadReviews() {
      if (loading) {
        return;
      }

      setReviewsLoading(true);
      setReviewsError('');

      if (!painter || !isUuid(painter.id)) {
        if (!cancelled) {
          setReviewItems([]);
          setReviewsLoading(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from('painter_reviews')
        .select('id, application_id, client_name, client_avatar_url, rating, comment, created_at')
        .eq('application_id', painter.id)
        .order('created_at', { ascending: false });

      if (cancelled) {
        return;
      }

      if (error) {
        console.error('Erro ao carregar avaliacoes publicas do pintor:', error);
        setReviewItems([]);
        setReviewsError('Nao foi possivel carregar as avaliacoes deste pintor agora.');
        setReviewsLoading(false);
        return;
      }

      setReviewItems((data ?? []).map((item: any) => ({
        id: item.id,
        applicationId: item.application_id,
        clientName: item.client_name,
        clientAvatarUrl: item.client_avatar_url ?? null,
        rating: Number(item.rating ?? 0),
        comment: item.comment,
        createdAt: item.created_at
      })));
      setReviewsLoading(false);
    }

    void loadReviews();

    return () => {
      cancelled = true;
    };
  }, [loading, painter]);

  if (loading) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-[#9A077B] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!painter) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center px-4">
        <div className="max-w-xl w-full bg-white p-10 rounded-[32px] border border-slate-100 shadow-sm text-center">
          <h1 className="text-2xl font-black text-slate-900 mb-4">Perfil nao encontrado</h1>
          <p className="text-slate-500 mb-8">O pintor solicitado nao esta disponivel ou foi removido.</p>
          <button
            onClick={() => setPage?.(Page.FindPainter)}
            className="bg-[#9A077B] text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs"
          >
            Voltar para busca
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="relative h-64 lg:h-80 w-full overflow-hidden">
        <img src={painter.banner} alt="Banner" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-8 left-0 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-end">
            <div className="flex gap-6 items-end">
              <img
                src={painter.avatar}
                alt={painter.name}
                className="w-24 h-24 lg:w-32 lg:h-32 rounded-3xl border-4 border-white shadow-xl object-cover relative z-10"
              />
                <div className="pb-2">
                  <div className="flex items-center gap-3 text-white mb-2">
                    <h1 className="text-3xl font-black">{painter.name}</h1>
                    {painter.verified && <Shield className="w-6 h-6 text-[#C93EA6] fill-[#C93EA6]" />}
                    {painter.isOnline === true && (
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-500/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-100 backdrop-blur-md">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.8)]" />
                        Online agora
                      </span>
                    )}
                    {painter.isOnline === false && (
                      <span className="inline-flex items-center rounded-full border border-slate-300/25 bg-slate-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-100 backdrop-blur-md">
                        Indisponivel
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-white/80 text-sm font-medium">
                  {hasRealReviews ? (
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      {painter.rating.toFixed(1)} ({painter.reviewsCount} avaliacoes)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-white/70" />
                      Sem avaliacoes ainda
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" /> {painter.location}
                  </span>
                </div>
              </div>
            </div>
            <div className="hidden lg:flex gap-3 mb-2">
              <button className="bg-white/10 backdrop-blur-md text-white p-3 rounded-2xl border border-white/20 hover:bg-white/20 transition">
                <Share2 className="w-5 h-5" />
              </button>
              <button className="bg-white/10 backdrop-blur-md text-white p-3 rounded-2xl border border-white/20 hover:bg-white/20 transition">
                <Heart className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-12">
            <PainterTabsNav activeTab={activeTab} onChange={setActiveTab} />

            {activeTab === 'portfolio' && (
              <PainterPortfolioSection
                items={portfolioItems}
                isLoading={portfolioLoading}
                errorMessage={portfolioError}
              />
            )}

            {activeTab === 'about' && (
              <PainterAboutSection
                painter={painter}
                portfolioCount={portfolioItems.length}
                portfolioLoading={portfolioLoading}
              />
            )}

            {activeTab === 'reviews' && (
              <PainterReviewsSection
                items={reviewItems}
                isLoading={reviewsLoading}
                errorMessage={reviewsError}
              />
            )}
          </div>

          <PainterActionsSidebar
            isPainterOffline={isPainterOffline}
            isLeadPaused={isLeadPaused}
            allowsChat={allowsChat}
            allowsVisitRequests={allowsVisitRequests}
            canStartChat={canStartChat}
            canScheduleVisit={canScheduleVisit}
            checkingClientAction={checkingClientAction}
            onProtectedClientAction={handleProtectedClientAction}
          />
        </div>
      </div>

      <ScheduleVisitModal
        isOpen={isScheduleVisitModalOpen}
        painterId={canScheduleVisit ? publicApplicationId ?? null : null}
        painterName={painter.name}
        painterLocation={painter.location}
        onClose={() => setIsScheduleVisitModalOpen(false)}
      />
      <StartChatModal
        isOpen={isChatModalOpen}
        painterId={canStartChat ? publicApplicationId ?? null : null}
        painterName={painter.name}
        painterLocation={painter.location}
        onClose={() => setIsChatModalOpen(false)}
      />
      <ClientLoginModal
        isOpen={isClientLoginModalOpen}
        onClose={handleCloseClientLogin}
        onSuccess={handleClientLoginSuccess}
        onShowSignup={handleShowClientSignup}
      />
      <ClientSignupModal
        isOpen={isClientSignupModalOpen}
        onClose={handleCloseClientSignup}
        onSuccess={handleClientSignupSuccess}
      />
    </div>
  );
};
