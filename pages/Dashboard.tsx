import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare } from 'lucide-react';
import { EditProfileModal, type EditProfileFormData } from '../components/EditProfileModal';
import { ObraModal, type SavedObra } from '../components/ObraModal';
import { OrcamentoModal, type SavedOrcamento } from '../components/OrcamentoModal';
import { supabase } from '../lib/supabase';
import {
  buildVisitErrorMessage,
  fetchChatMessages,
  fetchChatThreads,
  fetchCurrentPainterProfile,
  fetchPortfolioItems,
  fetchPainterProfileViewMetrics,
  fetchQuoteItems,
  updateVisitRequest,
  fetchVisitItems,
  normalizeChatMessagesError,
  normalizeChatThreadsError,
  updatePainterSettings,
  updatePainterPresence,
  uploadPainterMedia
} from '../features/dashboard/api';
import { DashboardAgendaTab } from '../features/dashboard/components/DashboardAgendaTab';
import { DashboardChatInbox } from '../features/dashboard/components/DashboardChatInbox';
import { DashboardOverviewTab } from '../features/dashboard/components/DashboardOverviewTab';
import { DashboardPortfolioTab } from '../features/dashboard/components/DashboardPortfolioTab';
import { DashboardQuotesTab } from '../features/dashboard/components/DashboardQuotesTab';
import { DashboardSettingsTab } from '../features/dashboard/components/DashboardSettingsTab';
import { DashboardSidebar } from '../features/dashboard/components/DashboardSidebar';
import {
  AnalyticsPeriodDays,
  CurrentPainterProfile,
  DashboardMetrics,
  DashboardTab,
  FeedbackMessage,
  PainterProfileViewMetrics,
  PainterSettingsForm,
  SavedChatMessage,
  SavedChatThread,
  SavedVisitRequest
} from '../features/dashboard/types';
import { createUuid } from '../features/dashboard/utils';
import { NavigateToPage, Page } from '../types';

interface DashboardProps {
  setPage: NavigateToPage;
}

export const Dashboard: React.FC<DashboardProps> = ({ setPage }) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('inicio');
  const [userName, setUserName] = useState('Pintor');
  const [currentProfile, setCurrentProfile] = useState<CurrentPainterProfile | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    portfolioCount: 0,
    quoteCount: 0,
    pendingQuoteCount: 0,
    totalProfileViewsCount: 0,
    totalContactsCount: 0,
    totalChatContactsCount: 0,
    totalVisitContactsCount: 0,
    totalQuoteContactsCount: 0,
    periodProfileViewsCount: 0,
    periodContactsCount: 0,
    periodChatContactsCount: 0,
    periodVisitContactsCount: 0,
    periodQuoteContactsCount: 0,
    previousPeriodProfileViewsCount: 0,
    periodGrowthPercent: 0
  });
  const [profileViewMetrics, setProfileViewMetrics] = useState<PainterProfileViewMetrics>({
    totalViews: 0,
    currentPeriodViews: 0,
    previousPeriodViews: 0,
    periodGrowthPercent: 0
  });
  const [analyticsPeriodDays, setAnalyticsPeriodDays] = useState<AnalyticsPeriodDays>(7);
  const [isSignOut, setIsSignOut] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [portfolioItems, setPortfolioItems] = useState<SavedObra[]>([]);
  const [quoteItems, setQuoteItems] = useState<SavedOrcamento[]>([]);
  const [visitItems, setVisitItems] = useState<SavedVisitRequest[]>([]);
  const [chatThreads, setChatThreads] = useState<SavedChatThread[]>([]);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(false);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);
  const [isLoadingVisits, setIsLoadingVisits] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [portfolioError, setPortfolioError] = useState('');
  const [quotesError, setQuotesError] = useState('');
  const [visitsError, setVisitsError] = useState('');
  const [chatsError, setChatsError] = useState('');
  const [isOrcamentoModalOpen, setIsOrcamentoModalOpen] = useState(false);
  const [isObraModalOpen, setIsObraModalOpen] = useState(false);
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isChatInboxOpen, setIsChatInboxOpen] = useState(false);
  const [selectedChatThreadId, setSelectedChatThreadId] = useState<string | null>(null);
  const [activeChatMessages, setActiveChatMessages] = useState<SavedChatMessage[]>([]);
  const [isLoadingActiveChatMessages, setIsLoadingActiveChatMessages] = useState(false);
  const [activeChatError, setActiveChatError] = useState('');
  const [chatReplyDraft, setChatReplyDraft] = useState('');
  const [chatReplyError, setChatReplyError] = useState('');
  const [isSendingChatReply, setIsSendingChatReply] = useState(false);
  const [mediaFeedback, setMediaFeedback] = useState<FeedbackMessage | null>(null);
  const [profileFeedback, setProfileFeedback] = useState<FeedbackMessage | null>(null);
  const [settingsFeedback, setSettingsFeedback] = useState<FeedbackMessage | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const profileInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement | null>(null);
  const portalTarget = typeof document !== 'undefined' ? document.body : null;

  const pendingVisitCount = visitItems.filter((visit) => visit.status === 'pending').length;
  const unreadChatCount = chatThreads.filter((thread) => thread.unread_for_painter).length;
  const hasUnreadChats = unreadChatCount > 0;
  const selectedChatThread = selectedChatThreadId
    ? chatThreads.find((thread) => thread.id === selectedChatThreadId) ?? null
    : null;
  const activeChatDisplayMessages = selectedChatThread
    ? (() => {
        const hasClientMessage = activeChatMessages.some((message) => message.sender_type === 'client');

        if (!hasClientMessage && selectedChatThread.last_message_preview) {
          return [
            {
              id: `synthetic-${selectedChatThread.id}`,
              thread_id: selectedChatThread.id,
              sender_type: 'client' as const,
              sender_name: selectedChatThread.client_name,
              message: selectedChatThread.last_message_preview,
              created_at: selectedChatThread.created_at
            },
            ...activeChatMessages
          ];
        }

        return activeChatMessages;
      })()
    : activeChatMessages;

  const loadChatThreads = async (applicationId: string, silent = false) => {
    if (!silent) {
      setIsLoadingChats(true);
    }

    try {
      const data = await fetchChatThreads(applicationId);
      setChatThreads(data);
      setChatsError('');
    } catch (error) {
      console.error('Erro ao carregar conversas do chat:', error);
      setChatThreads([]);
      setChatsError(normalizeChatThreadsError(error));
    } finally {
      if (!silent) {
        setIsLoadingChats(false);
      }
    }
  };

  const loadChatMessages = async (threadId: string, silent = false) => {
    if (!silent) {
      setIsLoadingActiveChatMessages(true);
    }

    try {
      const data = await fetchChatMessages(threadId);
      setActiveChatMessages(data);
      setActiveChatError('');
    } catch (error) {
      console.error('Erro ao carregar mensagens da conversa:', error);
      setActiveChatMessages([]);
      setActiveChatError(normalizeChatMessagesError(error));
    } finally {
      if (!silent) {
        setIsLoadingActiveChatMessages(false);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (!isMounted) return;

      if (error || !data.user) {
        if (error) {
          console.error('Erro ao carregar usuario do painel:', error);
        }
        setIsCheckingAccess(false);
        setPage(Page.Login);
        return;
      }

      const normalizedEmail = data.user.email?.trim().toLowerCase() ?? '';
      const fallbackFullName =
        typeof data.user.user_metadata?.full_name === 'string' && data.user.user_metadata.full_name.trim()
          ? data.user.user_metadata.full_name.trim()
          : normalizedEmail.split('@')[0];

      const [portfolioResult, quotesResult, profileResult] = await Promise.allSettled([
        fetchPortfolioItems(data.user.id),
        fetchQuoteItems(data.user.id),
        fetchCurrentPainterProfile({
          email: normalizedEmail,
          userId: data.user.id
        })
      ]);

      if (!isMounted) return;

      if (portfolioResult.status === 'fulfilled') {
        setPortfolioItems(portfolioResult.value);
        setPortfolioError('');
      } else {
        console.error('Erro ao carregar portfolio:', portfolioResult.reason);
        setPortfolioItems([]);
        setPortfolioError('Nao foi possivel carregar suas obras agora.');
      }

      if (quotesResult.status === 'fulfilled') {
        setQuoteItems(quotesResult.value);
        setQuotesError('');
      } else {
        console.error('Erro ao carregar lista de orcamentos:', quotesResult.reason);
        setQuoteItems([]);
        setQuotesError('Nao foi possivel carregar seus orcamentos agora.');
      }

      if (profileResult.status === 'fulfilled' && profileResult.value) {
        setCurrentProfile(profileResult.value);
        setUserName(profileResult.value.fullName.split(' ')[0]);
      } else {
        if (profileResult.status === 'rejected') {
          console.error('Erro ao carregar cadastro do pintor:', profileResult.reason);
        }
        setCurrentProfile(null);
        setUserName(fallbackFullName.split(' ')[0]);
      }

      setIsLoadingPortfolio(false);
      setIsLoadingQuotes(false);
      setIsCheckingAccess(false);
    };

    setIsLoadingPortfolio(true);
    setIsLoadingQuotes(true);
    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [setPage]);

  useEffect(() => {
    const periodStartMs = Date.now() - (analyticsPeriodDays * 24 * 60 * 60 * 1000);
    const quoteContactsCount = quoteItems.length;
    const visitContactsCount = visitItems.length;
    const chatContactsCount = chatThreads.length;
    const periodQuoteContactsCount = quoteItems.filter((quote) => (
      new Date(quote.created_at).getTime() >= periodStartMs
    )).length;
    const periodVisitContactsCount = visitItems.filter((visit) => (
      new Date(visit.created_at).getTime() >= periodStartMs
    )).length;
    const periodChatContactsCount = chatThreads.filter((thread) => (
      new Date(thread.created_at).getTime() >= periodStartMs
    )).length;
    const periodContactsCount = periodQuoteContactsCount + periodVisitContactsCount + periodChatContactsCount;

    setMetrics({
      portfolioCount: portfolioItems.length,
      quoteCount: quoteContactsCount,
      pendingQuoteCount: quoteItems.filter((quote) => quote.status === 'novo').length,
      totalProfileViewsCount: profileViewMetrics.totalViews,
      totalContactsCount: quoteContactsCount + visitContactsCount + chatContactsCount,
      totalChatContactsCount: chatContactsCount,
      totalVisitContactsCount: visitContactsCount,
      totalQuoteContactsCount: quoteContactsCount,
      periodProfileViewsCount: profileViewMetrics.currentPeriodViews,
      periodContactsCount,
      periodChatContactsCount,
      periodVisitContactsCount,
      periodQuoteContactsCount,
      previousPeriodProfileViewsCount: profileViewMetrics.previousPeriodViews,
      periodGrowthPercent: profileViewMetrics.periodGrowthPercent
    });
  }, [analyticsPeriodDays, portfolioItems, quoteItems, visitItems, chatThreads, profileViewMetrics]);

  useEffect(() => {
    let isMounted = true;

    const loadProfileViewMetrics = async () => {
        if (!currentProfile?.applicationId) {
          if (isMounted) {
            setProfileViewMetrics({
              totalViews: 0,
              currentPeriodViews: 0,
              previousPeriodViews: 0,
              periodGrowthPercent: 0
            });
          }
          return;
        }

      try {
        const nextMetrics = await fetchPainterProfileViewMetrics(currentProfile.applicationId, analyticsPeriodDays);

        if (!isMounted) {
          return;
        }

        setProfileViewMetrics(nextMetrics);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        console.error('Erro ao carregar metricas de visualizacao do perfil:', error);
        setProfileViewMetrics({
          totalViews: 0,
          currentPeriodViews: 0,
          previousPeriodViews: 0,
          periodGrowthPercent: 0
        });
      }
    };

    void loadProfileViewMetrics();

    const handleWindowFocus = () => {
      void loadProfileViewMetrics();
    };

    const refreshIntervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void loadProfileViewMetrics();
      }
    }, 30_000);

    window.addEventListener('focus', handleWindowFocus);

    return () => {
      isMounted = false;
      window.clearInterval(refreshIntervalId);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [analyticsPeriodDays, currentProfile?.applicationId]);

  useEffect(() => {
    let isMounted = true;

    const loadVisitItems = async () => {
      if (!currentProfile?.applicationId) {
        if (isMounted) {
          setVisitItems([]);
          setVisitsError('');
          setIsLoadingVisits(false);
        }
        return;
      }

      setIsLoadingVisits(true);

      try {
        const data = await fetchVisitItems(currentProfile.applicationId);

        if (!isMounted) {
          return;
        }

        setVisitItems(data);
        setVisitsError('');
      } catch (error) {
        if (!isMounted) {
          return;
        }

        console.error('Erro ao carregar agenda de visitas:', error);
        setVisitItems([]);
        setVisitsError(buildVisitErrorMessage(error));
      } finally {
        if (isMounted) {
          setIsLoadingVisits(false);
        }
      }
    };

    void loadVisitItems();

    return () => {
      isMounted = false;
    };
  }, [currentProfile?.applicationId]);

  useEffect(() => {
    let isMounted = true;

    if (!currentProfile?.applicationId) {
      setChatThreads([]);
      setChatsError('');
      setIsLoadingChats(false);
      return () => {
        isMounted = false;
      };
    }

    void loadChatThreads(currentProfile.applicationId);

    const handleWindowFocus = () => {
      if (currentProfile?.applicationId) {
        void loadChatThreads(currentProfile.applicationId, true);
      }
    };

    window.addEventListener('focus', handleWindowFocus);

    const threadsChannel = supabase
      .channel(`painter-chat-threads-${currentProfile.applicationId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'painter_chat_threads',
        filter: `application_id=eq.${currentProfile.applicationId}`
      }, () => {
        if (!isMounted || !currentProfile?.applicationId) {
          return;
        }

        void loadChatThreads(currentProfile.applicationId, true);
      })
      .subscribe();

    return () => {
      isMounted = false;
      window.removeEventListener('focus', handleWindowFocus);
      void supabase.removeChannel(threadsChannel);
    };
  }, [currentProfile?.applicationId]);

  const markChatThreadsAsRead = async (threadIds: string[]) => {
    if (threadIds.length === 0) {
      return;
    }

    setChatThreads((currentThreads) =>
      currentThreads.map((thread) => (
        threadIds.includes(thread.id)
          ? { ...thread, unread_for_painter: false }
          : thread
      ))
    );

    const { error } = await supabase
      .from('painter_chat_threads')
      .update({ unread_for_painter: false })
      .in('id', threadIds);

    if (error) {
      console.error('Erro ao marcar conversas como lidas:', error);
      setChatThreads((currentThreads) =>
        currentThreads.map((thread) => (
          threadIds.includes(thread.id)
            ? { ...thread, unread_for_painter: true }
            : thread
        ))
      );
    }
  };

  const handleTabChange = (tab: DashboardTab) => {
    setActiveTab(tab);
    setIsChatInboxOpen(false);
  };

  useEffect(() => {
    if (!isChatInboxOpen) {
      return;
    }

    const unreadThreadIds = chatThreads
      .filter((thread) => thread.unread_for_painter)
      .map((thread) => thread.id);

    if (unreadThreadIds.length > 0) {
      void markChatThreadsAsRead(unreadThreadIds);
    }
  }, [isChatInboxOpen, chatThreads]);

  useEffect(() => {
    if (!isChatInboxOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsChatInboxOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isChatInboxOpen]);

  useEffect(() => {
    let isMounted = true;

    if (!isChatInboxOpen || !selectedChatThreadId) {
      setActiveChatMessages([]);
      setActiveChatError('');
      setIsLoadingActiveChatMessages(false);
      return () => {
        isMounted = false;
      };
    }

    void loadChatMessages(selectedChatThreadId);

    const messagesChannel = supabase
      .channel(`painter-chat-messages-${selectedChatThreadId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'painter_chat_messages',
        filter: `thread_id=eq.${selectedChatThreadId}`
      }, () => {
        if (!isMounted) {
          return;
        }

        void loadChatMessages(selectedChatThreadId, true);
      })
      .subscribe();

    return () => {
      isMounted = false;
      void supabase.removeChannel(messagesChannel);
    };
  }, [isChatInboxOpen, selectedChatThreadId]);

  useEffect(() => {
    if (!selectedChatThreadId || !chatThreads.some((thread) => thread.id === selectedChatThreadId)) {
      setSelectedChatThreadId(null);
      setActiveChatMessages([]);
      setChatReplyDraft('');
      setChatReplyError('');
    }
  }, [chatThreads, selectedChatThreadId]);

  useEffect(() => {
    if (!selectedChatThreadId || activeChatDisplayMessages.length === 0) {
      return;
    }

    window.requestAnimationFrame(() => {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  }, [selectedChatThreadId, activeChatDisplayMessages]);

  const toggleChatInbox = () => {
    setIsChatInboxOpen((currentValue) => {
      const nextValue = !currentValue;

      if (!nextValue) {
        setSelectedChatThreadId(null);
        setActiveChatMessages([]);
        setActiveChatError('');
        setChatReplyDraft('');
        setChatReplyError('');
      }

      return nextValue;
    });
  };

  const handleOpenChatThread = (threadId: string) => {
    setSelectedChatThreadId(threadId);
    setActiveChatError('');
    setChatReplyError('');
  };

  const handleBackToChatList = () => {
    setSelectedChatThreadId(null);
    setActiveChatMessages([]);
    setActiveChatError('');
    setChatReplyDraft('');
    setChatReplyError('');
  };

  const handleSendChatReply = async () => {
    if (!selectedChatThreadId || !selectedChatThread || !currentProfile) {
      setChatReplyError('Nao foi possivel identificar a conversa para responder.');
      return;
    }

    const normalizedReply = chatReplyDraft.trim();

    if (!normalizedReply) {
      setChatReplyError('Digite uma mensagem para responder ao cliente.');
      return;
    }

    setIsSendingChatReply(true);
    setChatReplyError('');

    const replyMessageId = createUuid();
    const nowIso = new Date().toISOString();
    const nextMessage: SavedChatMessage = {
      id: replyMessageId,
      thread_id: selectedChatThreadId,
      sender_type: 'painter',
      sender_name: currentProfile.fullName || userName,
      message: normalizedReply,
      created_at: nowIso
    };

    try {
      const messageInsert = await supabase
        .from('painter_chat_messages')
        .insert({
          id: replyMessageId,
          thread_id: selectedChatThreadId,
          sender_type: 'painter',
          sender_name: currentProfile.fullName || userName,
          message: normalizedReply
        });

      if (messageInsert.error) {
        throw messageInsert.error;
      }

      const threadUpdate = await supabase
        .from('painter_chat_threads')
        .update({
          last_message_preview: normalizedReply.slice(0, 180),
          last_message_at: nowIso,
          unread_for_painter: false,
          status: 'open'
        })
        .eq('id', selectedChatThreadId);

      if (threadUpdate.error) {
        console.error('Erro ao atualizar resumo da conversa:', threadUpdate.error);
      }

      setActiveChatMessages((currentMessages) => [...currentMessages, nextMessage]);
      setChatThreads((currentThreads) => {
        const reorderedThreads = currentThreads.map((thread) => (
          thread.id === selectedChatThreadId
            ? {
                ...thread,
                unread_for_painter: false,
                status: 'open',
                last_message_preview: normalizedReply.slice(0, 180),
                last_message_at: nowIso
              }
            : thread
        ));

        return reorderedThreads.sort((firstThread, secondThread) => (
          new Date(secondThread.last_message_at).getTime() - new Date(firstThread.last_message_at).getTime()
        ));
      });
      setChatReplyDraft('');
    } catch (error) {
      console.error('Erro ao responder conversa do chat:', error);
      const message = error instanceof Error ? error.message.toLowerCase() : '';
      setChatReplyError(
        message.includes('row-level security') || message.includes('permission denied')
          ? 'Sua conta nao conseguiu salvar a resposta no chat. Confirme se o SQL chat_interno_schema.sql foi aplicado e se este cadastro esta vinculado ao usuario autenticado.'
          : 'Nao foi possivel enviar sua resposta agora.'
      );
    } finally {
      setIsSendingChatReply(false);
    }
  };

  const handleLogout = async () => {
    setIsSignOut(true);

    try {
      if (currentProfile?.applicationId) {
        try {
          await updatePainterPresence(currentProfile.applicationId, false);
        } catch (presenceError) {
          console.error('Erro ao marcar pintor como offline antes do logout:', presenceError);
        }
      }

      const { error } = await supabase.auth.signOut();

      if (error) {
        if (currentProfile?.applicationId) {
          try {
            await updatePainterPresence(currentProfile.applicationId, true);
          } catch (presenceRollbackError) {
            console.error('Erro ao restaurar presenca online apos falha no logout:', presenceRollbackError);
          }
        }
        throw error;
      }

      setPage(Page.Home);
    } catch (error) {
      console.error('Erro ao encerrar sessao:', error);
      alert('Nao foi possivel sair da conta agora. Tente novamente.');
      setIsSignOut(false);
    }
  };

  const handleObraSaved = (obra: SavedObra) => {
    setPortfolioItems((currentItems) => {
      const nextItems = [obra, ...currentItems.filter((item) => item.id !== obra.id)];
      return nextItems.sort((firstItem, secondItem) => (
        new Date(secondItem.created_at).getTime() - new Date(firstItem.created_at).getTime()
      ));
    });
    setPortfolioError('');
    setActiveTab('portfolio');
  };

  const handleOrcamentoSaved = (orcamento: SavedOrcamento) => {
    setQuoteItems((currentItems) => {
      const nextItems = [orcamento, ...currentItems.filter((item) => item.id !== orcamento.id)];
      return nextItems.sort((firstItem, secondItem) => (
        new Date(secondItem.created_at).getTime() - new Date(firstItem.created_at).getTime()
      ));
    });
    setQuotesError('');
    setActiveTab('orcamentos');
  };

  const handleVisitUpdated = async (
    visitId: string,
    updates: {
      preferredDate: string;
      preferredTime: string;
      location: string;
      status: string;
    }
  ) => {
    const updatedVisit = await updateVisitRequest(visitId, updates);

    setVisitItems((currentItems) => (
      currentItems.map((item) => (item.id === visitId ? updatedVisit : item))
    ));
    setVisitsError('');

    return updatedVisit;
  };

  const openEditProfileModal = () => {
    if (!currentProfile?.applicationId) {
      setProfileFeedback({
        type: 'error',
        message: 'Nao encontramos seu cadastro para editar o perfil.'
      });
      return;
    }

    setProfileFeedback(null);
    setIsEditProfileModalOpen(true);
  };

  const handleProfileUpdated = async (formData: EditProfileFormData) => {
    if (!currentProfile?.applicationId) {
      throw new Error('Nao encontramos seu cadastro para salvar as alteracoes.');
    }

    const normalizedSpecialties = Array.from(
      new Set(
        formData.specialties
          .map((specialty) => specialty.trim())
          .filter(Boolean)
      )
    );

    const { data, error } = await supabase
      .from('applications')
      .update({
        full_name: formData.fullName.trim(),
        city: formData.city.trim(),
        uf: formData.uf.trim().toUpperCase().slice(0, 2),
        whatsapp: formData.whatsapp.trim(),
        experience_time: formData.experienceTime.trim(),
        specialties: normalizedSpecialties
      })
      .eq('id', currentProfile.applicationId)
      .select('full_name, city, uf, whatsapp, experience_time, specialties')
      .single();

    if (error) {
      console.error('Erro ao atualizar perfil do pintor:', error);
      throw new Error('Nao foi possivel salvar as alteracoes do perfil agora.');
    }

    setCurrentProfile((profile) => {
      if (!profile) {
        return profile;
      }

      return {
        ...profile,
        fullName: data.full_name || profile.fullName,
        city: data.city || '',
        uf: data.uf || '',
        whatsapp: data.whatsapp || '',
        experienceTime: data.experience_time || '',
        specialties: Array.isArray(data.specialties) ? data.specialties : []
      };
    });
    setUserName((data.full_name || currentProfile.fullName).split(' ')[0]);
    setProfileFeedback({
      type: 'success',
      message: 'Perfil atualizado com sucesso.'
    });
    setIsEditProfileModalOpen(false);
  };

  const handleSettingsSave = async (settings: PainterSettingsForm) => {
    if (!currentProfile?.applicationId) {
      setSettingsFeedback({
        type: 'error',
        message: 'Nao encontramos seu cadastro para salvar as configuracoes.'
      });
      return;
    }

    setIsSavingSettings(true);
    setSettingsFeedback(null);

    try {
      const savedSettings = await updatePainterSettings(currentProfile.applicationId, settings);

      setCurrentProfile((profile) => (
        profile
          ? {
              ...profile,
              ...savedSettings
            }
          : profile
      ));

      setSettingsFeedback({
        type: 'success',
        message: 'Configuracoes atualizadas com sucesso.'
      });
    } catch (error) {
      console.error('Erro ao salvar configuracoes do pintor:', error);
      setSettingsFeedback({
        type: 'error',
        message: 'Nao foi possivel salvar as configuracoes agora.'
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const openProfilePicker = () => {
    if (!isUploadingProfile && currentProfile?.applicationId) {
      profileInputRef.current?.click();
    }
  };

  const openCoverPicker = () => {
    if (!isUploadingCover && currentProfile?.applicationId) {
      coverInputRef.current?.click();
    }
  };

  const handlePainterMediaSelected = async (
    event: React.ChangeEvent<HTMLInputElement>,
    mediaType: 'profile' | 'cover'
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setMediaFeedback({
        type: 'error',
        message: 'Selecione uma imagem valida para atualizar o perfil.'
      });
      return;
    }

    if (!currentProfile?.applicationId) {
      setMediaFeedback({
        type: 'error',
        message: 'Nao encontramos seu cadastro para salvar essa imagem.'
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMediaFeedback({
        type: 'error',
        message: 'A imagem precisa ter no maximo 10 MB.'
      });
      return;
    }

    const setLoadingState = mediaType === 'profile' ? setIsUploadingProfile : setIsUploadingCover;
    setLoadingState(true);
    setMediaFeedback(null);

    try {
      const {
        data: { user },
        error: authError
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error('Sua sessao expirou. Entre novamente para atualizar as imagens.');
      }

      const uploadResult = await uploadPainterMedia({
        file,
        folder: mediaType === 'profile' ? 'foto-perfil' : 'foto-capa',
        column: mediaType === 'profile' ? 'foto_perfil' : 'foto_capa',
        applicationId: currentProfile.applicationId,
        userId: user.id,
        previousPath: mediaType === 'profile' ? currentProfile.profilePhotoPath : currentProfile.coverPhotoPath
      });

      setCurrentProfile((profile) => {
        if (!profile) {
          return profile;
        }

        if (mediaType === 'profile') {
          return {
            ...profile,
            profilePhotoPath: uploadResult.path,
            profilePhotoUrl: uploadResult.url
          };
        }

        return {
          ...profile,
          coverPhotoPath: uploadResult.path,
          coverPhotoUrl: uploadResult.url
        };
      });

      setMediaFeedback({
        type: 'success',
        message: mediaType === 'profile'
          ? 'Foto de perfil atualizada com sucesso.'
          : 'Foto de capa atualizada com sucesso.'
      });
    } catch (error) {
      console.error(`Erro ao atualizar ${mediaType === 'profile' ? 'foto de perfil' : 'foto de capa'}:`, error);
      setMediaFeedback({
        type: 'error',
        message: mediaType === 'profile'
          ? 'Nao foi possivel atualizar a foto de perfil agora.'
          : 'Nao foi possivel atualizar a foto de capa agora.'
      });
    } finally {
      setLoadingState(false);
    }
  };

  let content: React.ReactNode = null;
  switch (activeTab) {
    case 'inicio':
      content = (
        <DashboardOverviewTab
          analyticsPeriodDays={analyticsPeriodDays}
          userName={userName}
          currentProfile={currentProfile}
          metrics={metrics}
          portfolioItems={portfolioItems}
          mediaFeedback={mediaFeedback}
          profileFeedback={profileFeedback}
          profileInputRef={profileInputRef}
          coverInputRef={coverInputRef}
          isUploadingProfile={isUploadingProfile}
          isUploadingCover={isUploadingCover}
          onProfileFileChange={(event) => void handlePainterMediaSelected(event, 'profile')}
          onCoverFileChange={(event) => void handlePainterMediaSelected(event, 'cover')}
          onOpenProfilePicker={openProfilePicker}
          onOpenCoverPicker={openCoverPicker}
          onEditProfile={openEditProfileModal}
          onAnalyticsPeriodChange={setAnalyticsPeriodDays}
        />
      );
      break;
    case 'portfolio':
      content = (
        <DashboardPortfolioTab
          items={portfolioItems}
          isLoading={isLoadingPortfolio}
          errorMessage={portfolioError}
          onAdd={() => setIsObraModalOpen(true)}
          onWorkSaved={handleObraSaved}
        />
      );
      break;
    case 'orcamentos':
      content = (
        <DashboardQuotesTab
          items={quoteItems}
          isLoading={isLoadingQuotes}
          errorMessage={quotesError}
          onAdd={() => setIsOrcamentoModalOpen(true)}
        />
      );
      break;
    case 'agenda':
      content = (
        <DashboardAgendaTab
          items={visitItems}
          isLoading={isLoadingVisits}
          errorMessage={visitsError}
          onUpdateVisit={(visitId, updates) => handleVisitUpdated(visitId, updates)}
        />
      );
      break;
    case 'config':
      content = (
        <DashboardSettingsTab
          currentProfile={currentProfile}
          feedback={settingsFeedback}
          isSaving={isSavingSettings}
          onSave={(settings) => void handleSettingsSave(settings)}
        />
      );
      break;
  }

  if (isCheckingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500 font-black uppercase tracking-widest">Carregando painel...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <DashboardSidebar
        activeTab={activeTab}
        currentProfile={currentProfile}
        pendingVisitCount={pendingVisitCount}
        isSigningOut={isSignOut}
        onTabChange={handleTabChange}
        onGoHome={() => setPage(Page.Home)}
        onLogout={() => void handleLogout()}
      />
      <main className="ml-64 flex-1 p-10 max-w-7xl relative">
        {content}
      </main>

      {portalTarget && currentProfile?.applicationId && createPortal(
        <>
          <DashboardChatInbox
            isOpen={isChatInboxOpen}
            selectedThread={selectedChatThread}
            chatThreads={chatThreads}
            activeChatDisplayMessages={activeChatDisplayMessages}
            chatsError={chatsError}
            activeChatError={activeChatError}
            chatReplyDraft={chatReplyDraft}
            chatReplyError={chatReplyError}
            isLoadingChats={isLoadingChats}
            isLoadingActiveChatMessages={isLoadingActiveChatMessages}
            isSendingChatReply={isSendingChatReply}
            chatMessagesEndRef={chatMessagesEndRef}
            onBack={handleBackToChatList}
            onClose={toggleChatInbox}
            onOpenThread={handleOpenChatThread}
            onChatReplyDraftChange={setChatReplyDraft}
            onSendReply={() => void handleSendChatReply()}
          />
          <button
            type="button"
            onClick={toggleChatInbox}
            className={`fixed z-50 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border shadow-[0_18px_45px_rgba(15,23,42,0.18)] transition-all ${
              hasUnreadChats
                ? 'border-[#9A077B]/30 bg-gradient-to-br from-[#9A077B] to-[#000747] text-white hover:shadow-[0_22px_55px_rgba(154,7,123,0.28)]'
                : 'border-slate-200 bg-white text-slate-900 hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(15,23,42,0.14)]'
            }`}
            style={{
              right: '24px',
              bottom: '24px'
            }}
            aria-label={hasUnreadChats ? `Abrir chat com ${unreadChatCount} conversa(s) nao lida(s)` : 'Abrir chat interno'}
          >
            <MessageSquare size={24} />
            {hasUnreadChats && (
              <>
                <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-white/10" />
                <span className="absolute -top-1 -right-1 flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-amber-300 px-1 text-[10px] font-black text-slate-900 shadow-sm">
                  {unreadChatCount > 9 ? '9+' : unreadChatCount}
                </span>
              </>
            )}
          </button>
        </>,
        portalTarget
      )}

      <OrcamentoModal
        isOpen={isOrcamentoModalOpen}
        onClose={() => setIsOrcamentoModalOpen(false)}
        onSaved={handleOrcamentoSaved}
      />
      <ObraModal
        isOpen={isObraModalOpen}
        onClose={() => setIsObraModalOpen(false)}
        onSaved={handleObraSaved}
      />
      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        profile={currentProfile}
        onClose={() => setIsEditProfileModalOpen(false)}
        onSave={handleProfileUpdated}
      />
    </div>
  );
};
