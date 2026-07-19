import React, { useEffect, useState } from 'react';
import {
  Activity,
  BadgeDollarSign,
  Ban,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Eye,
  FileStack,
  History,
  ImageOff,
  LayoutDashboard,
  Loader2,
  LogOut,
  MessageSquareText,
  RefreshCw,
  ShieldCheck,
  X,
  XCircle
} from 'lucide-react';
import { Logo } from '../components/Logo';
import {
  createAdminAuditLog,
  formatAdminAuditValue,
  getAdminAuditActionLabel,
  getAdminAuditChangesList,
  type AdminAuditLog
} from '../lib/adminAudit';
import { getCurrentAdminProfile, type CurrentAdminProfile } from '../lib/adminAccess';
import { getPortfolioPreviewMedia, getPortfolioTotalMediaCount, normalizePortfolioStageMedia } from '../lib/portfolioStages';
import { resolvePortfolioRecordMedia } from '../lib/portfolioMedia';
import { supabase } from '../lib/supabase';
import { type NavigateToPage, Page } from '../types';

type AdminDashboardProps = {
  setPage: NavigateToPage;
};

type AdminTab = 'overview' | 'applications' | 'painters' | 'subscriptions' | 'operations' | 'moderation' | 'audit';

type AdminApplication = {
  id: string;
  full_name: string | null;
  email: string | null;
  whatsapp: string | null;
  city: string | null;
  uf: string | null;
  gender: string | null;
  experience_time: string | null;
  specialties: string[] | null;
  status: string | null;
  created_at: string | null;
  category_level: string | null;
  subscription_plan: string | null;
  subscription_status: string | null;
  auth_user_id: string | null;
  is_online: boolean | null;
  allow_chat: boolean | null;
  allow_visit_requests: boolean | null;
  pause_lead_intake: boolean | null;
  last_seen_at: string | null;
  work_photo_paths: string[] | null;
  certification_paths: string[] | null;
  foto_perfil: string | null;
  foto_capa: string | null;
};

type AdminChat = {
  id: string;
  application_id: string;
  client_name: string;
  status: string;
  last_message_preview: string | null;
  last_message_at: string;
};

type AdminVisit = {
  id: string;
  application_id: string;
  client_name: string;
  preferred_date: string;
  preferred_time: string;
  location: string;
  status: string;
};

type AdminQuote = {
  id: string;
  pintor_id: string | null;
  cliente_nome: string;
  imovel_cidade_estado: string | null;
  status: string | null;
  created_at: string;
};

type AdminPortfolioItem = {
  id: string;
  pintor_id: string | null;
  titulo: string;
  local: string;
  tipo_imovel: string;
  tipo_pintura: string;
  status: string;
  imagem_url: string | null;
  video_url: string | null;
  stage_media: unknown;
  created_at: string;
  is_publicly_visible?: boolean | null;
  featured_in_showcase?: boolean | null;
  admin_review_status?: string | null;
  admin_review_notes?: string | null;
  admin_reviewed_at?: string | null;
  preview_url?: string | null;
  media_count?: number;
};

type AdminMetrics = {
  pendingApplications: number;
  totalApplications: number;
  acceptedPainters: number;
  onlinePainters: number;
  activeClients: number;
  totalContacts: number;
  openChats: number;
  pendingVisits: number;
  activeSubscriptions: number;
  profileViewsLast30Days: number;
  applicationsThisWeek: number;
  weeklyGrowthPercent: number;
  estimatedMrr: number;
  ticketMedio: number;
  overdueSubscriptions: number;
  trialSubscriptions: number;
};

const tabs: Array<{ id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'applications', label: 'Aplicações', icon: ClipboardList },
  { id: 'painters', label: 'Pintores', icon: ShieldCheck },
  { id: 'subscriptions', label: 'Assinaturas', icon: CreditCard },
  { id: 'operations', label: 'Operação', icon: Activity },
  { id: 'moderation', label: 'Moderação', icon: FileStack },
  { id: 'audit', label: 'Auditoria', icon: History }
];

const categoryOptions = ['', 'bronze', 'prata', 'ouro'];
const planOptions = ['', 'monthly', 'annual'];
const portfolioReviewStatusOptions = ['approved', 'pending_review', 'blocked'] as const;
const planValueMap: Record<string, number> = { monthly: 50, annual: 500 };

const isOptionalReadError = (message: string) => (
  message.includes('does not exist')
  || message.includes('relation')
  || message.includes('schema cache')
  || message.includes('column')
  || message.includes('permission denied')
  || message.includes('row-level')
);

const getStatusLabel = (status?: string | null) => {
  switch ((status || '').toLowerCase()) {
    case 'accepted': return 'Aprovado';
    case 'pending': return 'Pendente';
    case 'rejected': return 'Reprovado';
    case 'active': return 'Ativo';
    case 'trialing': return 'Período de teste';
    case 'past_due': return 'Atrasado';
    case 'cancelled': return 'Cancelado';
    case 'open': return 'Aberto';
    case 'confirmed': return 'Confirmado';
    case 'completed': return 'Concluído';
    default: return status || 'Não informado';
  }
};

const getStatusClass = (status?: string | null) => {
  switch ((status || '').toLowerCase()) {
    case 'accepted':
    case 'active':
    case 'confirmed':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'pending':
    case 'trialing':
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'rejected':
    case 'cancelled':
    case 'past_due':
      return 'bg-rose-50 text-rose-700 border border-rose-200';
    default:
      return 'bg-slate-100 text-slate-600 border border-slate-200';
  }
};

const getPortfolioStatusLabel = (status?: string | null) => {
  switch ((status || '').toLowerCase()) {
    case 'blocked': return 'Bloqueado';
    case 'pending_review': return 'Em revisão';
    default: return 'Aprovado';
  }
};

const getPortfolioStatusClass = (status?: string | null) => {
  switch ((status || '').toLowerCase()) {
    case 'blocked':
      return 'bg-rose-50 text-rose-700 border border-rose-200';
    case 'pending_review':
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    default:
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  }
};

const formatDate = (value?: string | null) => value
  ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value))
  : 'Sem data';

const formatDateTime = (value?: string | null) => value
  ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
  : 'Sem registro';

const formatRelative = (value?: string | null) => {
  if (!value) return 'Sem atividade';
  const diffMinutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (diffMinutes < 1) return 'Agora mesmo';
  if (diffMinutes < 60) return `Há ${diffMinutes} min`;
  if (diffMinutes < 1440) return `Há ${Math.floor(diffMinutes / 60)} h`;
  return `Há ${Math.floor(diffMinutes / 1440)} dia(s)`;
};

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 0
}).format(value);

const getApplicationName = (application: AdminApplication) => application.full_name?.trim() || application.email?.trim() || 'Pintor sem nome';
const getApplicationLocation = (application: AdminApplication) => application.city && application.uf
  ? `${application.city} - ${application.uf}`
  : application.city || application.uf || 'Localização não informada';

const buildAuditWarningMessage = (successMessage: string) => `${successMessage} Porém, a auditoria não conseguiu registrar o evento.`;

const getAdminRoleLabel = (role?: string | null) => {
  switch ((role || '').toLowerCase()) {
    case 'owner': return 'Proprietário';
    case 'admin': return 'Administrador';
    case 'manager': return 'Gerente';
    default: return role || 'Proprietário';
  }
};

const getPlanLabel = (plan?: string | null) => {
  switch ((plan || '').toLowerCase()) {
    case 'monthly': return 'Plano mensal';
    case 'annual': return 'Plano anual';
    case 'bronze': return 'Bronze';
    case 'silver':
    case 'prata': return 'Prata';
    case 'pro':
    case 'ouro': return 'Ouro';
    default: return plan || 'Sem plano';
  }
};

const isSubscriptionAccessActive = (status?: string | null) => {
  const normalizedStatus = (status || '').toLowerCase();
  return normalizedStatus === 'active' || normalizedStatus === 'trialing';
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ setPage }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [adminProfile, setAdminProfile] = useState<CurrentAdminProfile | null>(null);
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<AdminPortfolioItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [recentChats, setRecentChats] = useState<AdminChat[]>([]);
  const [recentVisits, setRecentVisits] = useState<AdminVisit[]>([]);
  const [recentQuotes, setRecentQuotes] = useState<AdminQuote[]>([]);
  const [metrics, setMetrics] = useState<AdminMetrics>({
    pendingApplications: 0,
    totalApplications: 0,
    acceptedPainters: 0,
    onlinePainters: 0,
    activeClients: 0,
    totalContacts: 0,
    openChats: 0,
    pendingVisits: 0,
    activeSubscriptions: 0,
    profileViewsLast30Days: 0,
    applicationsThisWeek: 0,
    weeklyGrowthPercent: 0,
    estimatedMrr: 0,
    ticketMedio: 0,
    overdueSubscriptions: 0,
    trialSubscriptions: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<AdminApplication | null>(null);

  const loadDashboard = async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'initial') setLoading(true);
    else setRefreshing(true);

    setPageError('');

    const safeCount = async (promise: PromiseLike<{ count: number | null; error: { message?: string } | null }>) => {
      const result = await promise;
      if (result.error) {
        const message = String(result.error.message ?? '').toLowerCase();
        if (isOptionalReadError(message)) return 0;
        throw result.error;
      }
      return result.count ?? 0;
    };

    const safeList = async <T,>(promise: PromiseLike<{ data: T[] | null; error: { message?: string } | null }>) => {
      const result = await promise;
      if (result.error) {
        const message = String(result.error.message ?? '').toLowerCase();
        if (isOptionalReadError(message)) return [] as T[];
        throw result.error;
      }
      return result.data ?? [];
    };

    try {
      const currentAdminProfile = await getCurrentAdminProfile();
      setAdminProfile(currentAdminProfile);

      const applicationsResult = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(400);

      if (applicationsResult.error) throw applicationsResult.error;

      const loadedApplications = (applicationsResult.data ?? []) as AdminApplication[];
      setApplications(loadedApplications);

      const now = Date.now();
      const sevenDaysAgoIso = new Date(now - (7 * 24 * 60 * 60 * 1000)).toISOString();
      const fourteenDaysAgoIso = new Date(now - (14 * 24 * 60 * 60 * 1000)).toISOString();
      const thirtyDaysAgoIso = new Date(now - (30 * 24 * 60 * 60 * 1000)).toISOString();

      const [activeClients, profileViewsLast30Days, totalChats, openChats, totalVisits, pendingVisits, totalQuotes, chats, visits, quotes, loadedPortfolioItems, loadedAuditLogs] = await Promise.all([
        safeCount(supabase.from('clientes').select('*', { count: 'exact', head: true })),
        safeCount(supabase.from('painter_profile_views').select('*', { count: 'exact', head: true }).gte('viewed_at', thirtyDaysAgoIso)),
        safeCount(supabase.from('painter_chat_threads').select('*', { count: 'exact', head: true })),
        safeCount(supabase.from('painter_chat_threads').select('*', { count: 'exact', head: true }).eq('status', 'open')),
        safeCount(supabase.from('painter_visit_requests').select('*', { count: 'exact', head: true })),
        safeCount(supabase.from('painter_visit_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending')),
        safeCount(supabase.from('orcamentos').select('*', { count: 'exact', head: true })),
        safeList<AdminChat>(supabase.from('painter_chat_threads').select('id, application_id, client_name, status, last_message_preview, last_message_at').order('last_message_at', { ascending: false }).limit(8)),
        safeList<AdminVisit>(supabase.from('painter_visit_requests').select('id, application_id, client_name, preferred_date, preferred_time, location, status').order('created_at', { ascending: false }).limit(8)),
        safeList<AdminQuote>(supabase.from('orcamentos').select('id, pintor_id, cliente_nome, imovel_cidade_estado, status, created_at').order('created_at', { ascending: false }).limit(8)),
        safeList<AdminPortfolioItem>(supabase.from('obras').select('id, pintor_id, titulo, local, tipo_imovel, tipo_pintura, status, imagem_url, video_url, stage_media, created_at, is_publicly_visible, featured_in_showcase, admin_review_status, admin_review_notes, admin_reviewed_at').order('created_at', { ascending: false }).limit(80)),
        safeList<AdminAuditLog>(supabase.from('admin_action_logs').select('id, admin_name, admin_email, action_type, target_table, target_id, target_label, metadata, created_at').order('created_at', { ascending: false }).limit(40))
      ]);

      const resolvedPortfolioItems = await Promise.all(loadedPortfolioItems.map(async (item) => {
        const { displayStageMedia, displayPreviewMedia } = await resolvePortfolioRecordMedia({
          stageMedia: item.stage_media,
          imageUrl: item.imagem_url,
          videoUrl: item.video_url
        });

        return {
          ...item,
          preview_url: displayPreviewMedia.imageUrl ?? displayPreviewMedia.videoUrl,
          media_count: getPortfolioTotalMediaCount(displayStageMedia)
        };
      }));

      setRecentChats(chats);
      setRecentVisits(visits);
      setRecentQuotes(quotes);
      setPortfolioItems(resolvedPortfolioItems);
      setAuditLogs(loadedAuditLogs);

      const acceptedPainters = loadedApplications.filter((item) => item.status === 'accepted');
      const subscriptionBase = acceptedPainters.filter((item) => item.subscription_status === 'active' || item.subscription_status === 'trialing' || Boolean(item.subscription_plan));
      const applicationsThisWeek = loadedApplications.filter((item) => item.created_at && item.created_at >= sevenDaysAgoIso).length;
      const applicationsPreviousWeek = loadedApplications.filter((item) => item.created_at && item.created_at >= fourteenDaysAgoIso && item.created_at < sevenDaysAgoIso).length;
      const weeklyGrowthPercent = applicationsPreviousWeek === 0 ? (applicationsThisWeek === 0 ? 0 : 100) : Math.round(((applicationsThisWeek - applicationsPreviousWeek) / applicationsPreviousWeek) * 100);
      const estimatedMrr = subscriptionBase.reduce((total, item) => total + (planValueMap[(item.subscription_plan || '').toLowerCase()] || 0), 0);

      setMetrics({
        pendingApplications: loadedApplications.filter((item) => item.status === 'pending').length,
        totalApplications: loadedApplications.length,
        acceptedPainters: acceptedPainters.length,
        onlinePainters: acceptedPainters.filter((item) => Boolean(item.is_online)).length,
        activeClients,
        totalContacts: totalChats + totalVisits + totalQuotes,
        openChats,
        pendingVisits,
        activeSubscriptions: subscriptionBase.length,
        profileViewsLast30Days,
        applicationsThisWeek,
        weeklyGrowthPercent,
        estimatedMrr,
        ticketMedio: subscriptionBase.length > 0 ? Math.round(estimatedMrr / subscriptionBase.length) : 0,
        overdueSubscriptions: acceptedPainters.filter((item) => item.subscription_status === 'past_due').length,
        trialSubscriptions: acceptedPainters.filter((item) => item.subscription_status === 'trialing').length
      });
    } catch (error) {
      console.error('Erro ao carregar dashboard admin:', error);
      const message = String((error as { message?: string } | null)?.message ?? '').toLowerCase();
      setPageError(message.includes('admin_users')
        ? 'O acesso administrativo ainda não foi configurado. Rode o SQL admin_dashboard_schema.sql no Supabase.'
        : 'O painel admin ainda não tem as permissões necessárias. Rode os SQLs administrativos no Supabase.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const registerAuditEvent = async (params: {
    actionType: string;
    targetTable: string;
    targetId: string;
    targetLabel: string;
    previousRecord?: Record<string, unknown> | null;
    nextRecord?: Record<string, unknown> | null;
    metadata?: Record<string, unknown>;
  }) => {
    await createAdminAuditLog({
      adminProfile,
      actionType: params.actionType,
      targetTable: params.targetTable,
      targetId: params.targetId,
      targetLabel: params.targetLabel,
      previousRecord: params.previousRecord,
      nextRecord: params.nextRecord,
      metadata: params.metadata
    });
  };

  const updateApplication = async (
    id: string,
    payload: Record<string, unknown>,
    successMessage: string,
    actionKey: string,
    actionType: string
  ) => {
    setBusyKey(actionKey);
    setFeedback(null);
    const currentApplication = applications.find((item) => item.id === id) ?? null;

    try {
      const { error } = await supabase.from('applications').update(payload).eq('id', id);
      if (error) throw error;

      try {
        await registerAuditEvent({
          actionType,
          targetTable: 'applications',
          targetId: id,
          targetLabel: currentApplication ? getApplicationName(currentApplication) : `Aplicação ${id}`,
          previousRecord: currentApplication,
          nextRecord: payload,
          metadata: {
            entity: 'application'
          }
        });
        setFeedback({ type: 'success', message: successMessage });
      } catch (auditError) {
        console.error('Erro ao registrar auditoria administrativa da aplicação:', auditError);
        setFeedback({ type: 'error', message: buildAuditWarningMessage(successMessage) });
      }

      await loadDashboard('refresh');
    } catch (error) {
      console.error('Erro ao atualizar cadastro administrativo:', error);
      setFeedback({ type: 'error', message: 'Não foi possível salvar esta alteração administrativa.' });
    } finally {
      setBusyKey(null);
    }
  };

  const updatePortfolioModeration = async (
    id: string,
    payload: Record<string, unknown>,
    successMessage: string,
    actionKey: string,
    actionType: string
  ) => {
    setBusyKey(actionKey);
    setFeedback(null);
    const currentPortfolioItem = portfolioItems.find((item) => item.id === id) ?? null;

    try {
      const updatePayload = {
        ...payload,
        admin_reviewed_at: new Date().toISOString()
      };

      const { error } = await supabase.from('obras').update(updatePayload).eq('id', id);
      if (error) throw error;

      try {
        await registerAuditEvent({
          actionType,
          targetTable: 'obras',
          targetId: id,
          targetLabel: currentPortfolioItem?.titulo || `Obra ${id}`,
          previousRecord: currentPortfolioItem,
          nextRecord: updatePayload,
          metadata: {
            entity: 'portfolio'
          }
        });
        setFeedback({ type: 'success', message: successMessage });
      } catch (auditError) {
        console.error('Erro ao registrar auditoria administrativa da obra:', auditError);
        setFeedback({ type: 'error', message: buildAuditWarningMessage(successMessage) });
      }

      await loadDashboard('refresh');
    } catch (error) {
      console.error('Erro ao moderar obra:', error);
      setFeedback({ type: 'error', message: 'Não foi possível salvar esta moderação.' });
    } finally {
      setBusyKey(null);
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setFeedback({ type: 'error', message: 'Não foi possível encerrar a sessão admin agora.' });
      return;
    }
    setPage(Page.Home);
  };

  const painterByApplicationId = applications.reduce<Record<string, string>>((acc, item) => {
    acc[item.id] = getApplicationName(item);
    return acc;
  }, {});

  const painterByUserId = applications.reduce<Record<string, string>>((acc, item) => {
    if (item.auth_user_id) acc[item.auth_user_id] = getApplicationName(item);
    return acc;
  }, {});

  const pendingApplications = applications.filter((item) => item.status === 'pending').slice(0, 6);
  const acceptedPainters = applications.filter((item) => item.status === 'accepted');
  const subscribedPainters = acceptedPainters.filter((item) => item.subscription_plan || item.subscription_status).slice(0, 24);
  const moderatedPortfolioItems = portfolioItems.map((item) => {
    const stageMedia = normalizePortfolioStageMedia(item.stage_media, { imageUrl: item.imagem_url, videoUrl: item.video_url });
    return {
      ...item,
      previewUrl: item.preview_url ?? null,
      mediaCount: item.media_count ?? getPortfolioTotalMediaCount(stageMedia),
      painterName: painterByUserId[item.pintor_id ?? ''] || 'Pintor não identificado'
    };
  });
  const latestAuditLog = auditLogs[0] ?? null;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)]">
      {selectedApplication && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 p-4">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[36px] border border-slate-200 bg-white p-7 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#9A077B]">Revisao completa</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-[#000747]">{getApplicationName(selectedApplication)}</h2>
                <p className="mt-2 text-sm font-medium text-slate-500">{selectedApplication.email || 'Sem e-mail informado'}</p>
              </div>
              <button type="button" onClick={() => setSelectedApplication(null)} className="rounded-2xl border border-slate-200 p-3 text-slate-500 transition hover:border-[#9A077B] hover:text-[#9A077B]"><X className="h-5 w-5" /></button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[24px] bg-slate-50 px-5 py-4"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Situação</p><p className="mt-2 text-lg font-black text-[#000747]">{getStatusLabel(selectedApplication.status)}</p></div>
              <div className="rounded-[24px] bg-slate-50 px-5 py-4"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Categoria</p><p className="mt-2 text-lg font-black text-[#000747]">{selectedApplication.category_level || 'Sem categoria'}</p></div>
              <div className="rounded-[24px] bg-slate-50 px-5 py-4"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Plano</p><p className="mt-2 text-lg font-black text-[#000747]">{selectedApplication.subscription_plan || 'Sem plano'}</p></div>
              <div className="rounded-[24px] bg-slate-50 px-5 py-4"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Criado em</p><p className="mt-2 text-lg font-black text-[#000747]">{formatDate(selectedApplication.created_at)}</p></div>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1fr,1fr]">
              <div className="rounded-[28px] border border-slate-200 p-6">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#9A077B]">Dados do cadastro</p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div><p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Cidade</p><p className="mt-2 text-sm font-bold text-[#000747]">{getApplicationLocation(selectedApplication)}</p></div>
                  <div><p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">WhatsApp</p><p className="mt-2 text-sm font-bold text-[#000747]">{selectedApplication.whatsapp || 'Não informado'}</p></div>
                  <div><p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Gênero</p><p className="mt-2 text-sm font-bold text-[#000747]">{selectedApplication.gender || 'Não informado'}</p></div>
                  <div><p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Experiência</p><p className="mt-2 text-sm font-bold text-[#000747]">{selectedApplication.experience_time || 'Não informada'}</p></div>
                </div>
                <div className="mt-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Especialidades</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(selectedApplication.specialties ?? []).length > 0
                      ? (selectedApplication.specialties ?? []).map((item) => <span key={item} className="rounded-full bg-[#FDF1FA] px-3 py-2 text-xs font-black text-[#9A077B]">{item}</span>)
                      : <span className="text-sm font-medium text-slate-500">Nenhuma especialidade informada.</span>}
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 p-6">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#9A077B]">Material enviado</p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[24px] bg-slate-50 px-5 py-4"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Anexos de obra</p><p className="mt-2 text-2xl font-black text-[#000747]">{selectedApplication.work_photo_paths?.length || 0}</p></div>
                  <div className="rounded-[24px] bg-slate-50 px-5 py-4"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Certificações</p><p className="mt-2 text-2xl font-black text-[#000747]">{selectedApplication.certification_paths?.length || 0}</p></div>
                </div>
                <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Fotos vinculadas</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    {selectedApplication.foto_perfil && <span className="rounded-full bg-white px-3 py-2">Foto de perfil</span>}
                    {selectedApplication.foto_capa && <span className="rounded-full bg-white px-3 py-2">Foto de capa</span>}
                    {!selectedApplication.foto_perfil && !selectedApplication.foto_capa && <span>Nenhuma foto pública definida.</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" disabled={busyKey === `approve:${selectedApplication.id}`} onClick={() => void updateApplication(selectedApplication.id, { status: 'accepted' }, 'Aplicação aprovada com sucesso.', `approve:${selectedApplication.id}`, 'application.approved')} className="rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-60">Aprovar pintor</button>
              <button type="button" disabled={busyKey === `pending:${selectedApplication.id}`} onClick={() => void updateApplication(selectedApplication.id, { status: 'pending' }, 'Aplicação voltou para pendência.', `pending:${selectedApplication.id}`, 'application.pending')} className="rounded-2xl bg-amber-500 px-5 py-4 text-sm font-black text-white transition hover:bg-amber-600 disabled:opacity-60">Voltar para pendência</button>
              <button type="button" disabled={busyKey === `reject:${selectedApplication.id}`} onClick={() => void updateApplication(selectedApplication.id, { status: 'rejected' }, 'Aplicação marcada como reprovada.', `reject:${selectedApplication.id}`, 'application.rejected')} className="rounded-2xl bg-rose-600 px-5 py-4 text-sm font-black text-white transition hover:bg-rose-700 disabled:opacity-60">Reprovar cadastro</button>
              <button type="button" onClick={() => setPage(Page.PainterProfile, { painterId: selectedApplication.id })} className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-black text-[#000747] transition hover:border-[#9A077B] hover:text-[#9A077B]">Abrir perfil público</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid min-h-screen lg:grid-cols-[300px,1fr]">
        <aside className="border-r border-slate-200 bg-white/95 px-5 py-6">
          <div className="flex h-full flex-col">
            <button type="button" onClick={() => setPage(Page.Home)} className="flex items-center"><Logo className="h-14" color="#000000" /></button>
            <div className="mt-8 rounded-[28px] bg-[#000747] px-5 py-5 text-white">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/65">Painel do Dono</p>
              <p className="mt-3 text-2xl font-black tracking-tight">{adminProfile?.fullName || 'Administrador'}</p>
              <p className="mt-2 text-sm font-medium text-white/75">{getAdminRoleLabel(adminProfile?.role)}</p>
            </div>
            <nav className="mt-8 space-y-2">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button key={id} type="button" onClick={() => setActiveTab(id)} className={`flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left text-sm font-black transition ${activeTab === id ? 'bg-[#FDF1FA] text-[#9A077B]' : 'text-slate-500 hover:bg-slate-100 hover:text-[#000747]'}`}>
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              ))}
            </nav>
            <div className="mt-auto space-y-3">
              <button type="button" onClick={() => void loadDashboard('refresh')} disabled={refreshing} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-4 text-sm font-black text-[#000747] transition hover:border-[#9A077B] hover:text-[#9A077B] disabled:opacity-60">
                {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Atualizar dados
              </button>
              <button type="button" onClick={() => void logout()} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 py-4 text-sm font-black text-rose-600 transition hover:bg-rose-100"><LogOut className="h-4 w-4" />Sair da conta</button>
            </div>
          </div>
        </aside>

        <main className="px-5 py-6 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#9A077B]">Controle total da plataforma</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-[#000747] sm:text-5xl">Painel Administrativo</h1>
            <p className="mt-4 max-w-3xl text-base font-medium text-slate-500">Gerencie aplicações, pintores, assinaturas, operação e moderação de conteúdo em um único painel.</p>

            {feedback && <div className={`mt-6 rounded-[24px] px-5 py-4 text-sm font-black ${feedback.type === 'success' ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-rose-200 bg-rose-50 text-rose-700'}`}>{feedback.message}</div>}

            {pageError ? (
              <div className="mt-8 rounded-[36px] border border-rose-200 bg-white px-6 py-14 text-center">
                <p className="text-lg font-black text-[#000747]">Painel admin indisponível</p>
                <p className="mx-auto mt-3 max-w-2xl text-sm font-medium text-slate-500">{pageError}</p>
              </div>
            ) : loading ? (
              <div className="mt-8 flex min-h-[320px] items-center justify-center rounded-[36px] border border-slate-200 bg-white"><div className="flex items-center gap-3 text-[#000747]"><Loader2 className="h-6 w-6 animate-spin" /><span className="text-lg font-black">Carregando painel admin...</span></div></div>
            ) : (
              <div className="mt-8 space-y-8">
                {activeTab === 'overview' && (
                  <>
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                      {[
                        { label: 'Aplicações Pendentes', value: metrics.pendingApplications, helper: `${metrics.totalApplications} cadastros no total`, icon: ClipboardList },
                        { label: 'Pintores Aprovados', value: metrics.acceptedPainters, helper: `${metrics.onlinePainters} on-line agora`, icon: ShieldCheck },
                        { label: 'Contatos da Plataforma', value: metrics.totalContacts, helper: `${metrics.openChats} chats abertos e ${metrics.pendingVisits} visitas pendentes`, icon: MessageSquareText },
                        { label: 'MRR Estimado', value: formatCurrency(metrics.estimatedMrr), helper: `${metrics.activeSubscriptions} assinaturas ativas`, icon: BadgeDollarSign }
                      ].map(({ label, value, helper, icon: Icon }) => (
                        <div key={label} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_70px_-50px_rgba(15,23,42,0.35)]"><div className="flex items-start justify-between gap-4"><div><p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">{label}</p><p className="mt-3 text-4xl font-black tracking-tight text-[#000747]">{value}</p><p className="mt-2 text-sm font-medium text-slate-500">{helper}</p></div><div className="rounded-2xl bg-[#FDF1FA] p-3 text-[#9A077B]"><Icon className="h-6 w-6" /></div></div></div>
                      ))}
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
                      <div className="rounded-[32px] border border-slate-200 bg-white p-6">
                        <div className="flex items-center justify-between gap-3"><div><p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#9A077B]">Fila de aprovação</p><h2 className="mt-2 text-2xl font-black tracking-tight text-[#000747]">Aplicações urgentes</h2></div><button type="button" onClick={() => setActiveTab('applications')} className="text-sm font-black text-[#9A077B] transition hover:text-[#000747]">Ver tudo</button></div>
                        <div className="mt-5 space-y-4">
                          {pendingApplications.length === 0 ? <div className="rounded-[24px] border border-dashed border-slate-300 px-5 py-10 text-center text-sm font-medium text-slate-500">Sem aplicações pendentes no momento.</div> : pendingApplications.map((item) => (
                            <div key={item.id} className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                              <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-lg font-black text-[#000747]">{getApplicationName(item)}</p><p className="mt-1 text-sm font-medium text-slate-500">{item.email || 'Sem e-mail informado'}</p><p className="mt-2 text-sm font-semibold text-slate-400">{getApplicationLocation(item)}</p></div><span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${getStatusClass(item.status)}`}>{getStatusLabel(item.status)}</span></div>
                              <div className="mt-4 flex flex-wrap gap-3">
                                <button type="button" onClick={() => setSelectedApplication(item)} className="rounded-2xl border border-[#9A077B]/20 bg-white px-4 py-3 text-sm font-black text-[#9A077B] transition hover:border-[#9A077B] hover:bg-[#FDF1FA]">Revisar cadastro</button>
                                <button type="button" disabled={busyKey === `approve:${item.id}`} onClick={() => void updateApplication(item.id, { status: 'accepted' }, 'Aplicação aprovada com sucesso.', `approve:${item.id}`, 'application.approved')} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-60">Aprovar</button>
                                <button type="button" disabled={busyKey === `reject:${item.id}`} onClick={() => void updateApplication(item.id, { status: 'rejected' }, 'Aplicação marcada como reprovada.', `reject:${item.id}`, 'application.rejected')} className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-black text-white transition hover:bg-rose-700 disabled:opacity-60">Reprovar</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="rounded-[32px] border border-slate-200 bg-white p-6"><p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#9A077B]">Pulso do negócio</p><div className="mt-5 rounded-[24px] bg-[#000747] p-5 text-white"><p className="text-sm font-bold uppercase tracking-[0.18em] text-white/70">Crescimento semanal</p><p className="mt-3 text-3xl font-black tracking-tight">{metrics.weeklyGrowthPercent}%</p><p className="mt-2 text-sm font-medium text-white/75">{metrics.applicationsThisWeek} novas aplicações nos últimos 7 dias.</p></div></div>
                        <div className="rounded-[32px] border border-slate-200 bg-white p-6"><p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#9A077B]">Leitura executiva</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><div className="rounded-[24px] bg-slate-50 px-5 py-4"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Ticket médio</p><p className="mt-2 text-2xl font-black text-[#000747]">{formatCurrency(metrics.ticketMedio)}</p></div><div className="rounded-[24px] bg-slate-50 px-5 py-4"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Inadimplentes</p><p className="mt-2 text-2xl font-black text-[#000747]">{metrics.overdueSubscriptions}</p></div><div className="rounded-[24px] bg-slate-50 px-5 py-4"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Clientes ativos</p><p className="mt-2 text-2xl font-black text-[#000747]">{metrics.activeClients}</p></div><div className="rounded-[24px] bg-slate-50 px-5 py-4"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Visualizações em 30 dias</p><p className="mt-2 text-2xl font-black text-[#000747]">{metrics.profileViewsLast30Days}</p></div></div></div>
                      </div>
                    </div>
                  </>
                )}
                {activeTab === 'applications' && (
                  <div className="space-y-5">
                    {applications.map((item) => (
                      <div key={item.id} className="rounded-[32px] border border-slate-200 bg-white p-6">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div><div className="flex flex-wrap items-center gap-3"><h3 className="text-2xl font-black tracking-tight text-[#000747]">{getApplicationName(item)}</h3><span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${getStatusClass(item.status)}`}>{getStatusLabel(item.status)}</span></div><p className="mt-2 text-sm font-medium text-slate-500">{item.email || 'Sem e-mail informado'}</p><p className="mt-2 text-sm font-semibold text-slate-400">{getApplicationLocation(item)}</p></div>
                          <div className="text-right"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Criado em</p><p className="mt-2 text-sm font-bold text-[#000747]">{formatDate(item.created_at)}</p></div>
                        </div>
                        <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr,1.1fr,0.8fr]">
                          <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Categoria operacional</p><select value={item.category_level ?? ''} onChange={(event) => void updateApplication(item.id, { category_level: event.target.value || null }, 'Categoria atualizada.', `category:${item.id}`, 'application.category_changed')} disabled={busyKey === `category:${item.id}`} className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-[#000747] outline-none focus:border-[#9A077B]">{categoryOptions.map((option) => <option key={option || 'empty'} value={option}>{option || 'sem categoria'}</option>)}</select></div>
                          <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Ações de credenciamento</p><div className="mt-3 flex flex-wrap gap-3"><button type="button" onClick={() => setSelectedApplication(item)} className="rounded-2xl border border-[#9A077B]/20 bg-white px-4 py-3 text-sm font-black text-[#9A077B] transition hover:border-[#9A077B] hover:bg-[#FDF1FA]">Revisar cadastro</button><button type="button" disabled={busyKey === `approve:${item.id}`} onClick={() => void updateApplication(item.id, { status: 'accepted' }, 'Aplicação aprovada com sucesso.', `approve:${item.id}`, 'application.approved')} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-60">Aprovar</button><button type="button" disabled={busyKey === `pending:${item.id}`} onClick={() => void updateApplication(item.id, { status: 'pending' }, 'Aplicação voltou para pendência.', `pending:${item.id}`, 'application.pending')} className="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-black text-white transition hover:bg-amber-600 disabled:opacity-60">Pendente</button><button type="button" disabled={busyKey === `reject:${item.id}`} onClick={() => void updateApplication(item.id, { status: 'rejected' }, 'Aplicação marcada como reprovada.', `reject:${item.id}`, 'application.rejected')} className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-black text-white transition hover:bg-rose-700 disabled:opacity-60">Reprovar</button></div></div>
                          <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Presença atual</p><div className="mt-3 flex items-center justify-between gap-3"><span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${item.is_online ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-200 text-slate-600 border border-slate-300'}`}>{item.is_online ? 'On-line' : 'Off-line'}</span><span className="text-xs font-bold text-slate-500">{formatRelative(item.last_seen_at)}</span></div><button type="button" onClick={() => setPage(Page.PainterProfile, { painterId: item.id })} className="mt-4 inline-flex items-center gap-2 text-sm font-black text-[#9A077B] transition hover:text-[#000747]"><Eye className="h-4 w-4" />Abrir perfil público</button></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'painters' && (
                  <div className="space-y-5">
                    {acceptedPainters.map((item) => (
                      <div key={item.id} className="rounded-[32px] border border-slate-200 bg-white p-6">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div><div className="flex flex-wrap items-center gap-3"><h3 className="text-2xl font-black tracking-tight text-[#000747]">{getApplicationName(item)}</h3><span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${item.is_online ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-200 text-slate-600 border border-slate-300'}`}>{item.is_online ? 'On-line agora' : 'Off-line'}</span></div><p className="mt-2 text-sm font-medium text-slate-500">{getApplicationLocation(item)}</p><p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Última atividade: {formatRelative(item.last_seen_at)}</p></div>
                          <button type="button" onClick={() => setPage(Page.PainterProfile, { painterId: item.id })} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-[#000747] transition hover:border-[#9A077B] hover:text-[#9A077B]"><Eye className="h-4 w-4" />Ver perfil</button>
                        </div>
                        <div className="mt-6 grid gap-4 lg:grid-cols-3">
                          <button type="button" disabled={busyKey === `toggle-leads:${item.id}`} onClick={() => void updateApplication(item.id, { pause_lead_intake: !item.pause_lead_intake }, item.pause_lead_intake ? 'Captação de leads reativada.' : 'Captação de leads pausada.', `toggle-leads:${item.id}`, item.pause_lead_intake ? 'application.leads_resumed' : 'application.leads_paused')} className={`rounded-[24px] border px-5 py-5 text-left transition ${item.pause_lead_intake ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'} disabled:opacity-60`}><p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Captação de leads</p><p className="mt-3 text-lg font-black text-[#000747]">{item.pause_lead_intake ? 'Pausada' : 'Ativa'}</p></button>
                          <button type="button" disabled={busyKey === `toggle-chat:${item.id}`} onClick={() => void updateApplication(item.id, { allow_chat: !(item.allow_chat ?? true) }, item.allow_chat ? 'Chat desativado.' : 'Chat reativado.', `toggle-chat:${item.id}`, item.allow_chat ? 'application.chat_disabled' : 'application.chat_enabled')} className={`rounded-[24px] border px-5 py-5 text-left transition ${item.allow_chat ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-100'} disabled:opacity-60`}><p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Chat</p><p className="mt-3 text-lg font-black text-[#000747]">{item.allow_chat ? 'Liberado' : 'Bloqueado'}</p></button>
                          <button type="button" disabled={busyKey === `toggle-visits:${item.id}`} onClick={() => void updateApplication(item.id, { allow_visit_requests: !(item.allow_visit_requests ?? true) }, item.allow_visit_requests ? 'Agendamentos desativados.' : 'Agendamentos reativados.', `toggle-visits:${item.id}`, item.allow_visit_requests ? 'application.visits_disabled' : 'application.visits_enabled')} className={`rounded-[24px] border px-5 py-5 text-left transition ${item.allow_visit_requests ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-100'} disabled:opacity-60`}><p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Visitas</p><p className="mt-3 text-lg font-black text-[#000747]">{item.allow_visit_requests ? 'Liberadas' : 'Bloqueadas'}</p></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'subscriptions' && (
                  <div className="space-y-5">
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-[28px] border border-slate-200 bg-white p-6"><p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">MRR estimado</p><p className="mt-3 text-4xl font-black tracking-tight text-[#000747]">{formatCurrency(metrics.estimatedMrr)}</p><p className="mt-2 text-sm font-medium text-slate-500">Leitura executiva por plano ativo.</p></div>
                      <div className="rounded-[28px] border border-slate-200 bg-white p-6"><p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Ticket médio</p><p className="mt-3 text-4xl font-black tracking-tight text-[#000747]">{formatCurrency(metrics.ticketMedio)}</p><p className="mt-2 text-sm font-medium text-slate-500">Média por assinante ativo ou em período de teste.</p></div>
                      <div className="rounded-[28px] border border-slate-200 bg-white p-6"><p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Inadimplentes</p><p className="mt-3 text-4xl font-black tracking-tight text-[#000747]">{metrics.overdueSubscriptions}</p><p className="mt-2 text-sm font-medium text-slate-500">Assinaturas com risco de cancelamento.</p></div>
                      <div className="rounded-[28px] border border-slate-200 bg-white p-6"><p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Testes</p><p className="mt-3 text-4xl font-black tracking-tight text-[#000747]">{metrics.trialSubscriptions}</p><p className="mt-2 text-sm font-medium text-slate-500">Contas em fase inicial de conversão.</p></div>
                    </div>
                    {subscribedPainters.map((item) => (
                      <div key={item.id} className="rounded-[32px] border border-slate-200 bg-white p-6">
                        <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-3"><h3 className="text-2xl font-black tracking-tight text-[#000747]">{getApplicationName(item)}</h3><span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${isSubscriptionAccessActive(item.subscription_status) ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>{isSubscriptionAccessActive(item.subscription_status) ? 'Ativo' : 'Bloqueado'}</span></div><p className="mt-2 text-sm font-medium text-slate-500">{item.email || 'Sem e-mail informado'}</p></div><div className="rounded-[22px] bg-[#000747] px-4 py-3 text-white"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/70">Receita estimada</p><p className="mt-2 text-xl font-black uppercase">{formatCurrency(planValueMap[(item.subscription_plan || '').toLowerCase()] || 0)}</p></div></div>
                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                          <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Plano</p><select value={item.subscription_plan ?? ''} onChange={(event) => void updateApplication(item.id, { subscription_plan: event.target.value || null }, 'Plano atualizado.', `plan:${item.id}`, 'subscription.plan_changed')} disabled={busyKey === `plan:${item.id}`} className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-[#000747] outline-none focus:border-[#9A077B]">{planOptions.map((option) => <option key={option || 'empty'} value={option}>{getPlanLabel(option)}</option>)}</select></div>
                          <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Situação da assinatura</p>
                            <div className="mt-3 grid grid-cols-2 gap-3">
                              <div className={`rounded-2xl border px-4 py-4 ${isSubscriptionAccessActive(item.subscription_status) ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-400'}`}>
                                <p className="text-sm font-black uppercase tracking-[0.16em]">Ativo</p>
                              </div>
                              <div className={`rounded-2xl border px-4 py-4 ${isSubscriptionAccessActive(item.subscription_status) ? 'border-slate-200 bg-white text-slate-400' : 'border-rose-300 bg-rose-50 text-rose-700'}`}>
                                <p className="text-sm font-black uppercase tracking-[0.16em]">Bloqueado</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'moderation' && (
                  <div className="space-y-5">
                    <div className="grid gap-5 md:grid-cols-3">
                      <div className="rounded-[28px] border border-slate-200 bg-white p-6"><p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Obras públicas</p><p className="mt-3 text-4xl font-black tracking-tight text-[#000747]">{moderatedPortfolioItems.filter((item) => item.is_publicly_visible !== false).length}</p></div>
                      <div className="rounded-[28px] border border-slate-200 bg-white p-6"><p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Bloqueadas</p><p className="mt-3 text-4xl font-black tracking-tight text-[#000747]">{moderatedPortfolioItems.filter((item) => item.admin_review_status === 'blocked').length}</p></div>
                      <div className="rounded-[28px] border border-slate-200 bg-white p-6"><p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Em revisão</p><p className="mt-3 text-4xl font-black tracking-tight text-[#000747]">{moderatedPortfolioItems.filter((item) => item.admin_review_status === 'pending_review').length}</p></div>
                    </div>
                    {moderatedPortfolioItems.length === 0 ? <div className="rounded-[32px] border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><p className="text-lg font-black text-[#000747]">Nenhuma obra encontrada para moderação</p><p className="mt-2 text-sm font-medium text-slate-500">Se você já tiver portfólio cadastrado, rode o SQL add_portfolio_admin_moderation.sql no Supabase.</p></div> : moderatedPortfolioItems.map((item) => (
                      <div key={item.id} className="rounded-[32px] border border-slate-200 bg-white p-6">
                        <div className="grid gap-6 xl:grid-cols-[240px,1fr]">
                          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-100">{item.previewUrl ? <img src={item.previewUrl} alt={item.titulo} className="h-56 w-full object-cover" /> : <div className="flex h-56 items-center justify-center text-slate-400"><ImageOff className="h-10 w-10" /></div>}</div>
                          <div>
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div><div className="flex flex-wrap items-center gap-3"><h3 className="text-2xl font-black tracking-tight text-[#000747]">{item.titulo}</h3><span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${getPortfolioStatusClass(item.admin_review_status)}`}>{getPortfolioStatusLabel(item.admin_review_status)}</span><span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${item.is_publicly_visible === false ? 'bg-slate-200 text-slate-600 border border-slate-300' : 'bg-[#EEF3FF] text-[#000747] border border-[#cdd7ff]'}`}>{item.is_publicly_visible === false ? 'Oculta' : 'Pública'}</span></div><p className="mt-2 text-sm font-medium text-slate-500">{item.painterName}</p><p className="mt-2 text-sm font-semibold text-slate-400">{item.local}</p></div>
                              <div className="flex flex-wrap gap-2">
                                <button type="button" disabled={busyKey === `obra-approved:${item.id}`} onClick={() => void updatePortfolioModeration(item.id, { admin_review_status: 'approved' }, 'Obra aprovada para exibição pública.', `obra-approved:${item.id}`, 'portfolio.approved')} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-60">Aprovar</button>
                                <button type="button" disabled={busyKey === `obra-blocked:${item.id}`} onClick={() => void updatePortfolioModeration(item.id, { admin_review_status: 'blocked', is_publicly_visible: false }, 'Obra bloqueada da vitrine pública.', `obra-blocked:${item.id}`, 'portfolio.blocked')} className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-black text-white transition hover:bg-rose-700 disabled:opacity-60">Bloquear</button>
                                <button type="button" disabled={busyKey === `obra-visible:${item.id}`} onClick={() => void updatePortfolioModeration(item.id, { is_publicly_visible: item.is_publicly_visible === false }, item.is_publicly_visible === false ? 'Obra voltou para a vitrine.' : 'Obra ocultada da vitrine.', `obra-visible:${item.id}`, item.is_publicly_visible === false ? 'portfolio.shown' : 'portfolio.hidden')} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-[#000747] transition hover:border-[#9A077B] hover:text-[#9A077B] disabled:opacity-60">{item.is_publicly_visible === false ? 'Mostrar' : 'Ocultar'}</button>
                              </div>
                            </div>
                            <div className="mt-5 grid gap-4 md:grid-cols-4">
                              <div className="rounded-[24px] bg-slate-50 px-4 py-4"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Tipo</p><p className="mt-2 text-sm font-black text-[#000747]">{item.tipo_imovel}</p></div>
                              <div className="rounded-[24px] bg-slate-50 px-4 py-4"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Pintura</p><p className="mt-2 text-sm font-black text-[#000747]">{item.tipo_pintura}</p></div>
                              <div className="rounded-[24px] bg-slate-50 px-4 py-4"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Mídias</p><p className="mt-2 text-sm font-black text-[#000747]">{item.mediaCount} arquivo(s)</p></div>
                              <div className="rounded-[24px] bg-slate-50 px-4 py-4"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Revisado em</p><p className="mt-2 text-sm font-black text-[#000747]">{formatDate(item.admin_reviewed_at || item.created_at)}</p></div>
                            </div>
                            <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Situação da moderação</p><div className="mt-3 flex flex-wrap gap-2">{portfolioReviewStatusOptions.map((status) => <button key={status} type="button" disabled={busyKey === `obra-status:${item.id}:${status}`} onClick={() => void updatePortfolioModeration(item.id, { admin_review_status: status }, `Situação da obra atualizada para ${getPortfolioStatusLabel(status)}.`, `obra-status:${item.id}:${status}`, 'portfolio.status_changed')} className={`rounded-full px-3 py-2 text-xs font-black uppercase tracking-[0.14em] transition ${item.admin_review_status === status ? 'bg-[#000747] text-white' : 'bg-white text-slate-600 hover:text-[#9A077B]'}`}>{getPortfolioStatusLabel(status)}</button>)}</div></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'audit' && (
                  <div className="space-y-6">
                    <div className="grid gap-5 md:grid-cols-3">
                      <div className="rounded-[28px] border border-slate-200 bg-white p-6">
                        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Eventos carregados</p>
                        <p className="mt-3 text-4xl font-black tracking-tight text-[#000747]">{auditLogs.length}</p>
                        <p className="mt-2 text-sm font-medium text-slate-500">Leitura rápida dos últimos eventos administrativos.</p>
                      </div>
                      <div className="rounded-[28px] border border-slate-200 bg-white p-6">
                        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Última ação</p>
                        <p className="mt-3 text-xl font-black tracking-tight text-[#000747]">{latestAuditLog ? getAdminAuditActionLabel(latestAuditLog.action_type) : 'Sem registros'}</p>
                        <p className="mt-2 text-sm font-medium text-slate-500">{latestAuditLog ? formatDateTime(latestAuditLog.created_at) : 'A tabela ainda não recebeu eventos.'}</p>
                      </div>
                      <div className="rounded-[28px] border border-slate-200 bg-white p-6">
                        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Último operador</p>
                        <p className="mt-3 text-xl font-black tracking-tight text-[#000747]">{latestAuditLog?.admin_name || 'Sem operador'}</p>
                        <p className="mt-2 text-sm font-medium text-slate-500">{latestAuditLog?.admin_email || 'Nenhum evento registrado ainda.'}</p>
                      </div>
                    </div>

                    {auditLogs.length === 0 ? (
                      <div className="rounded-[32px] border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                        <p className="text-lg font-black text-[#000747]">Nenhum evento auditado ainda</p>
                        <p className="mt-2 text-sm font-medium text-slate-500">Rode o SQL add_admin_audit_logs.sql no Supabase e execute uma ação administrativa para começar a trilha de auditoria.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {auditLogs.map((log) => {
                          const changes = getAdminAuditChangesList(log.metadata);

                          return (
                            <div key={log.id} className="rounded-[32px] border border-slate-200 bg-white p-6">
                              <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                  <div className="flex flex-wrap items-center gap-3">
                                    <h3 className="text-2xl font-black tracking-tight text-[#000747]">{getAdminAuditActionLabel(log.action_type)}</h3>
                                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-600">{log.target_table}</span>
                                  </div>
                                  <p className="mt-2 text-sm font-medium text-slate-500">{log.target_label || log.target_id}</p>
                                </div>
                                <div className="rounded-[22px] bg-slate-50 px-4 py-3 text-right">
                                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Registrado em</p>
                                  <p className="mt-2 text-sm font-black text-[#000747]">{formatDateTime(log.created_at)}</p>
                                </div>
                              </div>

                              <div className="mt-5 grid gap-4 md:grid-cols-2">
                                <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Administrador</p>
                                  <p className="mt-2 text-sm font-black text-[#000747]">{log.admin_name}</p>
                                  <p className="mt-1 text-sm font-medium text-slate-500">{log.admin_email}</p>
                                </div>
                                <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Alvo</p>
                                  <p className="mt-2 text-sm font-black text-[#000747]">{log.target_label || log.target_id}</p>
                                  <p className="mt-1 text-sm font-medium text-slate-500">ID: {log.target_id}</p>
                                </div>
                              </div>

                              <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Campos alterados</p>
                                {changes.length === 0 ? (
                                  <p className="mt-3 text-sm font-medium text-slate-500">Sem diferença disponível para este evento.</p>
                                ) : (
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {changes.map((change) => (
                                      <span key={`${log.id}:${change.field}`} className="inline-flex flex-wrap items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600">
                                        <span className="uppercase tracking-[0.12em] text-[#000747]">{change.field}</span>
                                        <span className="text-slate-400">{formatAdminAuditValue(change.from)}</span>
                                        <span className="text-slate-300">â†’</span>
                                        <span className="text-[#9A077B]">{formatAdminAuditValue(change.to)}</span>
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'operations' && (
                  <div className="grid gap-6 xl:grid-cols-3">
                    <div className="rounded-[32px] border border-slate-200 bg-white p-6"><div className="flex items-center justify-between gap-3"><div><p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#9A077B]">Chats</p><h2 className="mt-2 text-2xl font-black tracking-tight text-[#000747]">Conversas recentes</h2></div><span className="rounded-full bg-[#FDF1FA] px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#9A077B]">{metrics.openChats} abertos</span></div><div className="mt-5 space-y-4">{recentChats.map((item) => <div key={item.id} className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black text-[#000747]">{item.client_name}</p><p className="mt-1 text-xs font-medium text-slate-500">{painterByApplicationId[item.application_id] || 'Pintor não identificado'}</p></div><span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${getStatusClass(item.status)}`}>{getStatusLabel(item.status)}</span></div><p className="mt-3 text-sm font-medium text-slate-500">{item.last_message_preview || 'Sem prévia de mensagem.'}</p><p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{formatDateTime(item.last_message_at)}</p></div>)}</div></div>
                    <div className="rounded-[32px] border border-slate-200 bg-white p-6"><div className="flex items-center justify-between gap-3"><div><p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#9A077B]">Visitas</p><h2 className="mt-2 text-2xl font-black tracking-tight text-[#000747]">Agenda operacional</h2></div><span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-amber-700">{metrics.pendingVisits} pendentes</span></div><div className="mt-5 space-y-4">{recentVisits.map((item) => <div key={item.id} className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black text-[#000747]">{item.client_name}</p><p className="mt-1 text-xs font-medium text-slate-500">{painterByApplicationId[item.application_id] || 'Pintor não identificado'}</p></div><span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${getStatusClass(item.status)}`}>{getStatusLabel(item.status)}</span></div><p className="mt-3 text-sm font-medium text-slate-500">{item.location}</p><p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{formatDate(item.preferred_date)} às {item.preferred_time}</p></div>)}</div></div>
                    <div className="rounded-[32px] border border-slate-200 bg-white p-6"><div className="flex items-center justify-between gap-3"><div><p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#9A077B]">Orçamentos</p><h2 className="mt-2 text-2xl font-black tracking-tight text-[#000747]">Negócios recentes</h2></div><span className="rounded-full bg-[#EEF3FF] px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#000747]">{recentQuotes.length} recentes</span></div><div className="mt-5 space-y-4">{recentQuotes.map((item) => <div key={item.id} className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black text-[#000747]">{item.cliente_nome}</p><p className="mt-1 text-xs font-medium text-slate-500">{painterByUserId[item.pintor_id ?? ''] || 'Pintor não identificado'}</p></div><span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${getStatusClass(item.status)}`}>{getStatusLabel(item.status)}</span></div><p className="mt-3 text-sm font-medium text-slate-500">{item.imovel_cidade_estado || 'Cidade não informada'}</p><p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{formatDateTime(item.created_at)}</p></div>)}</div></div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};


