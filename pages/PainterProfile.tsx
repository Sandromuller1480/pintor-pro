import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Heart, Loader2, MapPin, Share2, Shield, Star } from 'lucide-react';
import { MOCK_PAINTERS } from '../constants';
import { ScheduleVisitModal } from '../components/ScheduleVisitModal';
import { StartChatModal } from '../components/StartChatModal';
import { ClientLoginModal } from '../features/client-auth/components/ClientLoginModal';
import { ClientSignupModal } from '../features/client-auth/components/ClientSignupModal';
import facebookIcon from '../imagens/facebook.png';
import instagramIcon from '../imagens/instagram.png';
import pintorProLogo from '../imagens/Logo colorido PP.png';
import whatsappIcon from '../imagens/ícone whatsapp.png';
import { getCurrentClientProfile, type CurrentClientProfile } from '../lib/services/clientSignupService';
import { paintersService } from '../lib/services/paintersService';
import { supabase } from '../lib/supabase';
import { PainterAboutSection } from '../features/painter-profile/components/PainterAboutSection';
import { PainterActionsSidebar } from '../features/painter-profile/components/PainterActionsSidebar';
import { PainterPortfolioSection } from '../features/painter-profile/components/PainterPortfolioSection';
import { PainterReviewsSection } from '../features/painter-profile/components/PainterReviewsSection';
import { PainterTabsNav } from '../features/painter-profile/components/PainterTabsNav';
import { PainterProfileTab } from '../features/painter-profile/types';
import { isUuid } from '../features/painter-profile/utils';
import { getBusinessHoursAvailability } from '../lib/painterAvailability';
import {
  getPortfolioPreviewMedia,
  getPortfolioTotalMediaCount,
  normalizePortfolioStageMedia
} from '../lib/portfolioStages';
import { resolvePortfolioRecordMedia } from '../lib/portfolioMedia';
import { NavigateToPage, Page, Painter, PainterReview, PortfolioItem } from '../types';

interface PainterProfileProps {
  painterId?: string;
  setPage?: NavigateToPage;
}

const PROFILE_VIEWER_KEY_STORAGE = 'pintorpro-public-viewer-key';

const createViewerKey = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `viewer-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const getViewerKey = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const storedKey = window.localStorage.getItem(PROFILE_VIEWER_KEY_STORAGE);

  if (storedKey) {
    return storedKey;
  }

  const nextKey = createViewerKey();
  window.localStorage.setItem(PROFILE_VIEWER_KEY_STORAGE, nextKey);
  return nextKey;
};

const normalizeWhatsappPhone = (value: string | null | undefined) => {
  const digits = String(value ?? '').replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  if (digits.startsWith('55')) {
    return digits;
  }

  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  return digits;
};

const buildPainterWhatsappUrl = (phone: string | null | undefined, profileUrl: string) => {
  const normalizedPhone = normalizeWhatsappPhone(phone);

  if (!normalizedPhone) {
    return null;
  }

  const introMessage = encodeURIComponent(`Olá! Encontrei você na Pintor Pro!\n${profileUrl}`);

  return `https://wa.me/${normalizedPhone}?text=${introMessage}`;
};

const getCurrentProfileUrl = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.location.href;
};

export const PainterProfile: React.FC<PainterProfileProps> = ({ painterId, setPage }) => {
  const [checkingClientAction, setCheckingClientAction] = useState<'chat' | 'visit' | null>(null);
  const [currentClientProfile, setCurrentClientProfile] = useState<CurrentClientProfile | null>(null);
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
  const [pendingClientAction, setPendingClientAction] = useState<'chat' | 'visit' | 'whatsapp' | 'share' | 'favorite' | null>(null);
  const [activeTab, setActiveTab] = useState<PainterProfileTab>('portfolio');
  const [availabilityNow, setAvailabilityNow] = useState(() => new Date());
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isWhatsappIntroCardVisible, setIsWhatsappIntroCardVisible] = useState(false);
  const whatsappRedirectTimeoutRef = useRef<number | null>(null);

  const hasRealReviews = (painter?.reviewsCount ?? 0) > 0 && (painter?.rating ?? 0) > 0;
  const publicApplicationId = painter?.applicationId;
  const isPainterOffline = painter?.isOnline === false;
  const isLeadPaused = painter?.pauseLeadIntake === true;
  const allowsChat = painter?.allowChat !== false;
  const allowsVisitRequests = painter?.allowVisitRequests !== false;
  const businessHoursAvailability = getBusinessHoursAvailability({
    businessHoursEnabled: painter?.businessHoursEnabled,
    workingDays: painter?.workingDays,
    workingHoursStart: painter?.workingHoursStart,
    workingHoursEnd: painter?.workingHoursEnd,
    serviceTimezone: painter?.serviceTimezone
  }, availabilityNow);
  const isOutsideBusinessHours = businessHoursAvailability.withinBusinessHours === false;
  const hasSchedulableProfile = Boolean(publicApplicationId && isUuid(publicApplicationId));
  const canScheduleVisit = hasSchedulableProfile && !isPainterOffline && !isLeadPaused && allowsVisitRequests && !isOutsideBusinessHours;
  const canStartChat = hasSchedulableProfile && !isPainterOffline && !isLeadPaused && allowsChat && !isOutsideBusinessHours;
  const painterWhatsappUrl = buildPainterWhatsappUrl(painter?.whatsapp, getCurrentProfileUrl());
  const painterInstagramUrl = painter?.instagramUrl ?? null;
  const painterFacebookUrl = painter?.facebookUrl ?? null;
  const currentClientReview = useMemo(() => (
    currentClientProfile
      ? reviewItems.find((item) => item.clientAuthUserId === currentClientProfile.authUserId) ?? null
      : null
  ), [currentClientProfile, reviewItems]);

  const refreshClientSession = async () => {
    try {
      const nextClientProfile = await getCurrentClientProfile();
      setCurrentClientProfile(nextClientProfile);
    } catch (error) {
      console.error('Erro ao verificar sessao atual do cliente:', error);
      setCurrentClientProfile(null);
    }
  };

  const openPainterWhatsapp = () => {
    if (!painterWhatsappUrl) {
      return;
    }

    if (whatsappRedirectTimeoutRef.current) {
      window.clearTimeout(whatsappRedirectTimeoutRef.current);
    }

    setIsWhatsappIntroCardVisible(true);

    whatsappRedirectTimeoutRef.current = window.setTimeout(() => {
      window.location.assign(painterWhatsappUrl);
    }, 1150);
  };

  const showActionFeedback = (type: 'success' | 'error', message: string) => {
    setActionFeedback({ type, message });
  };

  const copyTextToClipboard = async (value: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return;
    }

    const tempTextArea = document.createElement('textarea');
    tempTextArea.value = value;
    tempTextArea.style.position = 'fixed';
    tempTextArea.style.opacity = '0';
    document.body.appendChild(tempTextArea);
    tempTextArea.focus();
    tempTextArea.select();
    document.execCommand('copy');
    document.body.removeChild(tempTextArea);
  };

  const updatePainterReviewStats = (nextReviewItems: PainterReview[]) => {
    const validReviewItems = nextReviewItems.filter((item) => item.rating > 0);
    const totalReviews = validReviewItems.length;
    const averageRating = totalReviews > 0
      ? validReviewItems.reduce((sum, item) => sum + item.rating, 0) / totalReviews
      : 0;

    setPainter((currentPainter) => currentPainter ? {
      ...currentPainter,
      reviewsCount: totalReviews,
      rating: averageRating
    } : currentPainter);
  };

  const logProfileShare = async (
    channel: 'native' | 'copy_link' | 'facebook' | 'instagram',
    clientProfileOverride?: CurrentClientProfile | null
  ) => {
    const resolvedClientProfile = clientProfileOverride ?? currentClientProfile ?? await getCurrentClientProfile();

    if (!resolvedClientProfile || !publicApplicationId) {
      return;
    }

    const { error } = await supabase
      .from('painter_profile_shares')
      .insert({
        application_id: publicApplicationId,
        client_auth_user_id: resolvedClientProfile.authUserId,
        channel
      });

    if (error) {
      const normalizedMessage = String(error.message || '').toLowerCase();

      if (normalizedMessage.includes('painter_profile_shares')) {
        throw new Error('O banco ainda nao recebeu o rastreamento de compartilhamentos. Rode o SQL add_client_profile_engagement.sql no Supabase.');
      }

      throw error;
    }
  };

  useEffect(() => {
    void refreshClientSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(() => {
      void refreshClientSession();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!actionFeedback) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setActionFeedback(null);
    }, 3200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [actionFeedback]);

  useEffect(() => (
    () => {
      if (whatsappRedirectTimeoutRef.current) {
        window.clearTimeout(whatsappRedirectTimeoutRef.current);
      }
    }
  ), []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setAvailabilityNow(new Date());
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const targetApplicationId = publicApplicationId && isUuid(publicApplicationId)
      ? publicApplicationId
      : null;

    if (!targetApplicationId || !painter) {
      return;
    }

    let cancelled = false;

    const registerProfileView = async () => {
      try {
        const viewerKey = getViewerKey();

        if (!viewerKey) {
          return;
        }

        const {
          data: { user }
        } = await supabase.auth.getUser();

        if (user?.id && painter.portfolioOwnerId && user.id === painter.portfolioOwnerId) {
          return;
        }

        const todayBucket = new Date().toISOString().slice(0, 10);
        const { error } = await supabase
          .from('painter_profile_views')
          .upsert({
            application_id: targetApplicationId,
            viewer_key: viewerKey,
            view_bucket: todayBucket,
            viewed_at: new Date().toISOString()
          }, {
            onConflict: 'application_id,viewer_key,view_bucket',
            ignoreDuplicates: true
          });

        if (error && !cancelled) {
          console.error('Erro ao registrar visualizacao publica do perfil:', error);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Erro ao preparar visualizacao publica do perfil:', error);
        }
      }
    };

    void registerProfileView();

    return () => {
      cancelled = true;
    };
  }, [painter, publicApplicationId]);

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
    void refreshClientSession();

    if (!pendingClientAction) {
      return;
    }

    const actionToOpen = pendingClientAction;
    setPendingClientAction(null);

    switch (actionToOpen) {
      case 'whatsapp':
        openPainterWhatsapp();
        return;
      case 'share':
        void handleShareProfile(true);
        return;
      case 'favorite':
        void handleFavoriteAction(true);
        return;
      default:
        break;
    }

    if (actionToOpen === 'chat' || actionToOpen === 'visit') {
      openProtectedClientAction(actionToOpen);
    }
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

  const handleWhatsappAction = async () => {
    if (!painterWhatsappUrl) {
      return;
    }

    try {
      const nextClientProfile = await getCurrentClientProfile();

      if (nextClientProfile) {
        setCurrentClientProfile(nextClientProfile);
        openPainterWhatsapp();
        return;
      }

      setPendingClientAction('whatsapp');
      setIsClientLoginModalOpen(true);
    } catch (error) {
      console.error('Erro ao verificar acesso do cliente para contato por WhatsApp:', error);
      setPendingClientAction('whatsapp');
      setIsClientLoginModalOpen(true);
    }
  };

  const requireClientSessionForAction = async (
    action: 'share' | 'favorite',
    callback: () => Promise<void> | void,
    continueAfterLogin = true
  ) => {
    try {
      const nextClientProfile = await getCurrentClientProfile();

      if (nextClientProfile) {
        setCurrentClientProfile(nextClientProfile);
        await callback();
        return;
      }

      if (continueAfterLogin) {
        setPendingClientAction(action);
      }

      setIsClientLoginModalOpen(true);
    } catch (error) {
      console.error('Erro ao validar sessao do cliente para acao protegida:', error);

      if (continueAfterLogin) {
        setPendingClientAction(action);
      }

      setIsClientLoginModalOpen(true);
    }
  };

  const handleShareProfile = async (skipGuard = false) => {
    const executeShare = async () => {
      const profileUrl = getCurrentProfileUrl();
      const resolvedClientProfile = currentClientProfile ?? await getCurrentClientProfile();

      try {
        if (navigator.share) {
          await navigator.share({
            title: painter?.name ?? 'Pintor Pro',
            text: `Veja o perfil de ${painter?.name ?? 'este pintor'} na Pintor Pro.`,
            url: profileUrl
          });
          await logProfileShare('native', resolvedClientProfile);
          showActionFeedback('success', 'Perfil compartilhado com sucesso.');
          return;
        }

        await copyTextToClipboard(profileUrl);
        await logProfileShare('copy_link', resolvedClientProfile);
        showActionFeedback('success', 'Link do perfil copiado para compartilhamento.');
      } catch (error) {
        console.error('Erro ao compartilhar perfil:', error);
        showActionFeedback('error', error instanceof Error && error.message ? error.message : 'Nao foi possivel compartilhar este perfil agora.');
      }
    };

    if (skipGuard) {
      await executeShare();
      return;
    }

    await requireClientSessionForAction('share', executeShare);
  };

  const handleOpenSocialProfile = (network: 'facebook' | 'instagram') => {
    const socialUrl = network === 'facebook' ? painterFacebookUrl : painterInstagramUrl;

    if (!socialUrl) {
      showActionFeedback('error', `O perfil de ${network === 'facebook' ? 'Facebook' : 'Instagram'} deste pintor ainda nao foi informado.`);
      return;
    }

    window.open(socialUrl, '_blank', 'noopener,noreferrer');
  };

  const handleFavoriteAction = async (skipGuard = false) => {
    const executeFavorite = async () => {
      const resolvedClientProfile = currentClientProfile ?? await getCurrentClientProfile();

      if (resolvedClientProfile && !currentClientProfile) {
        setCurrentClientProfile(resolvedClientProfile);
      }

      if (!resolvedClientProfile || !publicApplicationId) {
        showActionFeedback('error', 'Nao foi possivel identificar o cliente ou o pintor para favoritar.');
        return;
      }

      setFavoriteLoading(true);

      try {
        if (isFavorite) {
          const { error } = await supabase
            .from('client_favorite_painters')
            .delete()
            .eq('client_auth_user_id', resolvedClientProfile.authUserId)
            .eq('application_id', publicApplicationId);

          if (error) {
            throw error;
          }

          setIsFavorite(false);
          showActionFeedback('success', 'Pintor removido dos seus favoritos.');
        } else {
          const { error } = await supabase
            .from('client_favorite_painters')
            .upsert({
              client_auth_user_id: resolvedClientProfile.authUserId,
              application_id: publicApplicationId
            }, {
              onConflict: 'client_auth_user_id,application_id'
            });

          if (error) {
            throw error;
          }

          setIsFavorite(true);
          showActionFeedback('success', 'Pintor salvo nos seus favoritos.');
        }
      } catch (error) {
        console.error('Erro ao atualizar favorito do cliente:', error);
        showActionFeedback('error', 'Nao foi possivel atualizar seus favoritos agora.');
      } finally {
        setFavoriteLoading(false);
      }
    };

    if (skipGuard) {
      await executeFavorite();
      return;
    }

    await requireClientSessionForAction('favorite', executeFavorite);
  };

  const handleRequireClientReviewAccess = () => {
    setPendingClientAction(null);
    setIsClientLoginModalOpen(true);
  };

  const handleSubmitReview = async (rating: number, comment: string) => {
    if (!currentClientProfile || !publicApplicationId) {
      setIsClientLoginModalOpen(true);
      return;
    }

    if (rating < 1 || rating > 5) {
      setReviewFeedback({
        type: 'error',
        message: 'Selecione de 1 a 5 estrelas antes de publicar a avaliacao.'
      });
      return;
    }

    setIsSubmittingReview(true);
    setReviewFeedback(null);

    try {
      const { data, error } = await supabase
        .from('painter_reviews')
        .upsert({
          application_id: publicApplicationId,
          client_auth_user_id: currentClientProfile.authUserId,
          client_name: currentClientProfile.fullName,
          client_avatar_url: null,
          rating,
          comment: comment.trim()
        }, {
          onConflict: 'application_id,client_auth_user_id'
        })
        .select('id, application_id, client_auth_user_id, client_name, client_avatar_url, rating, comment, created_at')
        .single();

      if (error) {
        const normalizedMessage = String(error.message || '').toLowerCase();
        throw new Error(
          normalizedMessage.includes('client_auth_user_id')
            ? 'O banco ainda nao recebeu a escrita segura de avaliacoes. Rode o SQL add_client_profile_engagement.sql no Supabase.'
            : error.message
        );
      }

      const nextReview: PainterReview = {
        id: data.id,
        applicationId: data.application_id,
        clientAuthUserId: data.client_auth_user_id ?? null,
        clientName: data.client_name,
        clientAvatarUrl: data.client_avatar_url ?? null,
        rating: Number(data.rating ?? 0),
        comment: data.comment ?? '',
        createdAt: data.created_at
      };

      setReviewItems((currentItems) => {
        const nextItems = [
          nextReview,
          ...currentItems.filter((item) => item.id !== nextReview.id && item.clientAuthUserId !== nextReview.clientAuthUserId)
        ];

        updatePainterReviewStats(nextItems);
        return nextItems;
      });

      setReviewFeedback({
        type: 'success',
        message: currentClientReview ? 'Sua avaliacao foi atualizada com sucesso.' : 'Sua avaliacao foi publicada com sucesso.'
      });
    } catch (error) {
      console.error('Erro ao publicar avaliacao do cliente:', error);
      setReviewFeedback({
        type: 'error',
        message: error instanceof Error && error.message
          ? error.message
          : 'Nao foi possivel publicar sua avaliacao agora.'
      });
    } finally {
      setIsSubmittingReview(false);
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
    if (!currentClientProfile || !publicApplicationId) {
      setIsFavorite(false);
      return;
    }

    let cancelled = false;

    const loadFavoriteState = async () => {
      try {
        const { data, error } = await supabase
          .from('client_favorite_painters')
          .select('id')
          .eq('client_auth_user_id', currentClientProfile.authUserId)
          .eq('application_id', publicApplicationId)
          .maybeSingle();

        if (cancelled) {
          return;
        }

        if (error) {
          throw error;
        }

        setIsFavorite(Boolean(data?.id));
      } catch (error) {
        if (!cancelled) {
          console.error('Erro ao carregar favorito do cliente:', error);
          setIsFavorite(false);
        }
      }
    };

    void loadFavoriteState();

    return () => {
      cancelled = true;
    };
  }, [currentClientProfile, publicApplicationId]);

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

      const primaryQuery = await supabase
        .from('obras')
        .select('id, pintor_id, titulo, local, tipo_imovel, tipo_pintura, status, imagem_url, video_url, stage_media, created_at')
        .in('pintor_id', ownerIds)
        .eq('is_publicly_visible', true)
        .neq('admin_review_status', 'blocked')
        .order('created_at', { ascending: false });

      let data = primaryQuery.data;
      let error = primaryQuery.error;

      const normalizedPortfolioError = String(error?.message || '').toLowerCase();

      if (error && (normalizedPortfolioError.includes('stage_media') || normalizedPortfolioError.includes('is_publicly_visible') || normalizedPortfolioError.includes('admin_review_status'))) {
        const legacyQuery = await supabase
          .from('obras')
          .select('id, pintor_id, titulo, local, tipo_imovel, tipo_pintura, status, imagem_url, video_url, created_at')
          .in('pintor_id', ownerIds)
          .order('created_at', { ascending: false });

        data = legacyQuery.data?.map((item) => ({
          ...item,
          stage_media: null
        })) ?? null;
        error = legacyQuery.error;
      }

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

      const nextPortfolioItems = await Promise.all((data ?? []).map(async (item: any) => {
        const { displayStageMedia, displayPreviewMedia } = await resolvePortfolioRecordMedia({
          stageMedia: item.stage_media,
          imageUrl: item.imagem_url,
          videoUrl: item.video_url
        });

        return {
          id: item.id,
          painterId: item.pintor_id,
          title: item.titulo,
          location: item.local,
          propertyType: item.tipo_imovel,
          paintType: item.tipo_pintura,
          status: item.status,
          imageUrl: displayPreviewMedia.imageUrl,
          videoUrl: displayPreviewMedia.videoUrl,
          stageMedia: displayStageMedia,
          totalMediaCount: getPortfolioTotalMediaCount(displayStageMedia),
          createdAt: item.created_at
        };
      }));

      if (cancelled) {
        return;
      }

      setPortfolioItems(nextPortfolioItems);
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
        .select('id, application_id, client_auth_user_id, client_name, client_avatar_url, rating, comment, created_at')
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
        clientAuthUserId: item.client_auth_user_id ?? null,
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
                      {painter.rating.toFixed(1)} ({painter.reviewsCount} avaliações)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-white/70" />
                      Sem avaliações ainda
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" /> {painter.location}
                  </span>
                </div>
              </div>
            </div>
            <div className="hidden lg:flex gap-3 mb-2">
              <button
                type="button"
                onClick={() => void handleShareProfile()}
                className="bg-white/10 backdrop-blur-md text-white p-3 rounded-2xl border border-white/20 hover:bg-white/20 transition"
                aria-label="Compartilhar perfil"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => handleOpenSocialProfile('facebook')}
                disabled={!painterFacebookUrl}
                className="bg-white/10 backdrop-blur-md text-white p-3 rounded-2xl border border-white/20 hover:bg-white/20 transition disabled:cursor-not-allowed disabled:opacity-45"
                aria-label="Abrir Facebook do pintor"
              >
                <img src={facebookIcon} alt="Facebook" className="h-5 w-5 brightness-0 invert" />
              </button>
              <button
                type="button"
                onClick={() => handleOpenSocialProfile('instagram')}
                disabled={!painterInstagramUrl}
                className="bg-white/10 backdrop-blur-md text-white p-3 rounded-2xl border border-white/20 hover:bg-white/20 transition disabled:cursor-not-allowed disabled:opacity-45"
                aria-label="Abrir Instagram do pintor"
              >
                <img src={instagramIcon} alt="Instagram" className="h-5 w-5 brightness-0 invert" />
              </button>
              <button
                type="button"
                onClick={() => void handleFavoriteAction()}
                disabled={favoriteLoading}
                className={`bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 transition hover:bg-white/20 ${isFavorite ? 'text-[#FF7AAF]' : 'text-white'}`}
                aria-label={isFavorite ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
              >
                {favoriteLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {actionFeedback && (
        <div className="mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className={`rounded-3xl border px-6 py-4 text-sm font-bold ${
            actionFeedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}>
            {actionFeedback.message}
          </div>
        </div>
      )}

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
                currentClientProfile={currentClientProfile}
                currentClientReview={currentClientReview}
                isSubmittingReview={isSubmittingReview}
                reviewFeedback={reviewFeedback}
                onSubmitReview={handleSubmitReview}
                onRequireClientAccess={handleRequireClientReviewAccess}
              />
            )}
          </div>

          <PainterActionsSidebar
            isPainterOffline={isPainterOffline}
            isLeadPaused={isLeadPaused}
            isOutsideBusinessHours={isOutsideBusinessHours}
            businessHoursMessage={businessHoursAvailability.message}
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
      {isWhatsappIntroCardVisible && (
        <div className="pointer-events-none fixed bottom-28 right-6 z-40 w-[320px] max-w-[calc(100vw-2rem)] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-white/95 p-5 shadow-[0_24px_60px_rgba(0,7,71,0.18)] backdrop-blur-xl">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#000747] via-[#8D0B82] to-[#C01188]" />
            <div className="relative flex items-center gap-4">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-[22px] border border-slate-100 bg-white shadow-sm">
                <img src={pintorProLogo} alt="Pintor Pro" className="h-11 w-11 object-contain" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#9A077B]">Pintor Pro</p>
                <p className="mt-1 text-base font-black leading-tight text-[#000747]">Olá! Encontrei você na Pintor Pro!</p>
                <p className="mt-2 text-xs font-medium text-slate-500">Abrindo o WhatsApp automaticamente...</p>
              </div>
            </div>
          </div>
        </div>
      )}
      {painterWhatsappUrl && (
        <button
          type="button"
          onClick={() => void handleWhatsappAction()}
          aria-label={`Falar com ${painter.name} no WhatsApp`}
          className="fixed bottom-6 right-6 z-40 block transition hover:-translate-y-0.5 hover:scale-[1.03]"
        >
          <img
            src={whatsappIcon}
            alt="WhatsApp"
            className="h-16 w-16 drop-shadow-[0_16px_28px_rgba(34,197,94,0.28)]"
          />
        </button>
      )}
    </div>
  );
};
