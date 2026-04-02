import React, { useEffect, useState } from 'react';
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Eye,
  LayoutDashboard,
  Loader2,
  LogOut,
  MessageSquareText,
  RefreshCw,
  ShieldCheck,
  XCircle
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { getCurrentAdminProfile, type CurrentAdminProfile } from '../lib/adminAccess';
import { supabase } from '../lib/supabase';
import { type NavigateToPage, Page } from '../types';

type AdminDashboardProps = {
  setPage: NavigateToPage;
};

type AdminTab = 'overview' | 'applications' | 'painters' | 'subscriptions' | 'operations';

type AdminApplication = {
  id: string;
  full_name: string | null;
  email: string | null;
  city: string | null;
  uf: string | null;
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
};

const tabs: Array<{ id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'overview', label: 'Visao Geral', icon: LayoutDashboard },
  { id: 'applications', label: 'Aplicacoes', icon: ClipboardList },
  { id: 'painters', label: 'Pintores', icon: ShieldCheck },
  { id: 'subscriptions', label: 'Assinaturas', icon: CreditCard },
  { id: 'operations', label: 'Operacao', icon: Activity }
];

const planOptions = ['', 'bronze', 'prata', 'ouro', 'pro'];
const categoryOptions = ['', 'bronze', 'prata', 'ouro'];
const subscriptionStatusOptions = ['', 'trialing', 'active', 'past_due', 'cancelled'];

const isOptionalReadError = (message: string) => (
  message.includes('does not exist')
  || message.includes('relation')
  || message.includes('schema cache')
  || message.includes('permission denied')
  || message.includes('row-level')
);

const getStatusLabel = (status?: string | null) => {
  switch ((status || '').toLowerCase()) {
    case 'accepted': return 'Aprovado';
    case 'pending': return 'Pendente';
    case 'rejected': return 'Reprovado';
    case 'active': return 'Ativo';
    case 'trialing': return 'Trial';
    case 'past_due': return 'Atrasado';
    case 'cancelled': return 'Cancelado';
    case 'open': return 'Aberto';
    case 'confirmed': return 'Confirmado';
    case 'completed': return 'Concluido';
    default: return status || 'Nao informado';
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
  if (diffMinutes < 60) return `Ha ${diffMinutes} min`;
  if (diffMinutes < 1440) return `Ha ${Math.floor(diffMinutes / 60)} h`;
  return `Ha ${Math.floor(diffMinutes / 1440)} dia(s)`;
};

const getApplicationName = (application: AdminApplication) => application.full_name?.trim() || application.email?.trim() || 'Pintor sem nome';

const getApplicationLocation = (application: AdminApplication) => {
  if (application.city && application.uf) return `${application.city} - ${application.uf}`;
  return application.city || application.uf || 'Localizacao nao informada';
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ setPage }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [adminProfile, setAdminProfile] = useState<CurrentAdminProfile | null>(null);
  const [applications, setApplications] = useState<AdminApplication[]>([]);
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
    weeklyGrowthPercent: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

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
      setAdminProfile(await getCurrentAdminProfile());

      const applicationsResult = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(400);

      if (applicationsResult.error) {
        throw applicationsResult.error;
      }

      const loadedApplications = (applicationsResult.data ?? []) as AdminApplication[];
      setApplications(loadedApplications);

      const now = Date.now();
      const sevenDaysAgoIso = new Date(now - (7 * 24 * 60 * 60 * 1000)).toISOString();
      const fourteenDaysAgoIso = new Date(now - (14 * 24 * 60 * 60 * 1000)).toISOString();
      const thirtyDaysAgoIso = new Date(now - (30 * 24 * 60 * 60 * 1000)).toISOString();

      const [activeClients, profileViewsLast30Days, totalChats, openChats, totalVisits, pendingVisits, totalQuotes, chats, visits, quotes] = await Promise.all([
        safeCount(supabase.from('clientes').select('*', { count: 'exact', head: true })),
        safeCount(supabase.from('painter_profile_views').select('*', { count: 'exact', head: true }).gte('viewed_at', thirtyDaysAgoIso)),
        safeCount(supabase.from('painter_chat_threads').select('*', { count: 'exact', head: true })),
        safeCount(supabase.from('painter_chat_threads').select('*', { count: 'exact', head: true }).eq('status', 'open')),
        safeCount(supabase.from('painter_visit_requests').select('*', { count: 'exact', head: true })),
        safeCount(supabase.from('painter_visit_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending')),
        safeCount(supabase.from('orcamentos').select('*', { count: 'exact', head: true })),
        safeList<AdminChat>(supabase.from('painter_chat_threads').select('id, application_id, client_name, status, last_message_preview, last_message_at').order('last_message_at', { ascending: false }).limit(8)),
        safeList<AdminVisit>(supabase.from('painter_visit_requests').select('id, application_id, client_name, preferred_date, preferred_time, location, status').order('created_at', { ascending: false }).limit(8)),
        safeList<AdminQuote>(supabase.from('orcamentos').select('id, pintor_id, cliente_nome, imovel_cidade_estado, status, created_at').order('created_at', { ascending: false }).limit(8))
      ]);

      setRecentChats(chats);
      setRecentVisits(visits);
      setRecentQuotes(quotes);

      const acceptedPainters = loadedApplications.filter((item) => item.status === 'accepted');
      const applicationsThisWeek = loadedApplications.filter((item) => item.created_at && item.created_at >= sevenDaysAgoIso).length;
      const applicationsPreviousWeek = loadedApplications.filter((item) => item.created_at && item.created_at >= fourteenDaysAgoIso && item.created_at < sevenDaysAgoIso).length;
      const weeklyGrowthPercent = applicationsPreviousWeek === 0
        ? (applicationsThisWeek === 0 ? 0 : 100)
        : Math.round(((applicationsThisWeek - applicationsPreviousWeek) / applicationsPreviousWeek) * 100);

      setMetrics({
        pendingApplications: loadedApplications.filter((item) => item.status === 'pending').length,
        totalApplications: loadedApplications.length,
        acceptedPainters: acceptedPainters.length,
        onlinePainters: acceptedPainters.filter((item) => Boolean(item.is_online)).length,
        activeClients,
        totalContacts: totalChats + totalVisits + totalQuotes,
        openChats,
        pendingVisits,
        activeSubscriptions: acceptedPainters.filter((item) => item.subscription_status === 'active' || item.subscription_status === 'trialing' || Boolean(item.subscription_plan)).length,
        profileViewsLast30Days,
        applicationsThisWeek,
        weeklyGrowthPercent
      });
    } catch (error) {
      console.error('Erro ao carregar dashboard admin:', error);
      const message = String((error as { message?: string } | null)?.message ?? '').toLowerCase();
      setPageError(
        message.includes('admin_users')
          ? 'O acesso administrativo ainda nao foi configurado. Rode o SQL admin_dashboard_schema.sql no Supabase.'
          : 'O painel admin ainda nao tem as permissoes necessarias. Rode o SQL admin_dashboard_schema.sql no Supabase.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const updateApplication = async (id: string, payload: Record<string, unknown>, successMessage: string, actionKey: string) => {
    setBusyKey(actionKey);
    setFeedback(null);

    try {
      const { error } = await supabase.from('applications').update(payload).eq('id', id);
      if (error) throw error;
      setFeedback({ type: 'success', message: successMessage });
      await loadDashboard('refresh');
    } catch (error) {
      console.error('Erro ao atualizar cadastro administrativo:', error);
      setFeedback({ type: 'error', message: 'Nao foi possivel salvar esta alteracao administrativa.' });
    } finally {
      setBusyKey(null);
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setFeedback({ type: 'error', message: 'Nao foi possivel encerrar a sessao admin agora.' });
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

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)]">
      <div className="grid min-h-screen lg:grid-cols-[300px,1fr]">
        <aside className="border-r border-slate-200 bg-white/95 px-5 py-6">
          <div className="flex h-full flex-col">
            <button type="button" onClick={() => setPage(Page.Home)} className="flex items-center">
              <Logo className="h-14" color="#000000" />
            </button>

            <div className="mt-8 rounded-[28px] bg-[#000747] px-5 py-5 text-white">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/65">Painel do Dono</p>
              <p className="mt-3 text-2xl font-black tracking-tight">{adminProfile?.fullName || 'Administrador'}</p>
              <p className="mt-2 text-sm font-medium text-white/75">{adminProfile?.role || 'owner'}</p>
            </div>

            <nav className="mt-8 space-y-2">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left text-sm font-black transition ${
                    activeTab === id ? 'bg-[#FDF1FA] text-[#9A077B]' : 'text-slate-500 hover:bg-slate-100 hover:text-[#000747]'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              ))}
            </nav>

            <div className="mt-auto space-y-3">
              <button
                type="button"
                onClick={() => void loadDashboard('refresh')}
                disabled={refreshing}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-4 text-sm font-black text-[#000747] transition hover:border-[#9A077B] hover:text-[#9A077B] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Atualizar dados
              </button>
              <button
                type="button"
                onClick={() => void logout()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 py-4 text-sm font-black text-rose-600 transition hover:bg-rose-100"
              >
                <LogOut className="h-4 w-4" />
                Sair da conta
              </button>
            </div>
          </div>
        </aside>

        <main className="px-5 py-6 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#9A077B]">Controle total da plataforma</p>
                <h1 className="mt-3 text-4xl font-black tracking-tight text-[#000747] sm:text-5xl">Dashboard Admin</h1>
                <p className="mt-4 max-w-3xl text-base font-medium text-slate-500">
                  Gerencie aplicacoes, pintores, assinaturas e a operacao real da PINTOR PRO em um unico painel.
                </p>
              </div>
            </div>

            {feedback && (
              <div className={`mt-6 rounded-[24px] px-5 py-4 text-sm font-black ${feedback.type === 'success' ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-rose-200 bg-rose-50 text-rose-700'}`}>
                {feedback.message}
              </div>
            )}

            {pageError ? (
              <div className="mt-8 rounded-[36px] border border-rose-200 bg-white px-6 py-14 text-center">
                <p className="text-lg font-black text-[#000747]">Painel admin indisponivel</p>
                <p className="mx-auto mt-3 max-w-2xl text-sm font-medium text-slate-500">{pageError}</p>
              </div>
            ) : loading ? (
              <div className="mt-8 flex min-h-[320px] items-center justify-center rounded-[36px] border border-slate-200 bg-white">
                <div className="flex items-center gap-3 text-[#000747]">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-lg font-black">Carregando painel admin...</span>
                </div>
              </div>
            ) : (
              <div className="mt-8 space-y-8">
                {activeTab === 'overview' && (
                  <>
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                      {[
                        { label: 'Aplicacoes Pendentes', value: metrics.pendingApplications, helper: `${metrics.totalApplications} cadastros no total`, icon: ClipboardList },
                        { label: 'Pintores Aprovados', value: metrics.acceptedPainters, helper: `${metrics.onlinePainters} online agora`, icon: ShieldCheck },
                        { label: 'Contatos da Plataforma', value: metrics.totalContacts, helper: `${metrics.openChats} chats abertos e ${metrics.pendingVisits} visitas pendentes`, icon: MessageSquareText },
                        { label: 'Assinaturas Ativas', value: metrics.activeSubscriptions, helper: `${metrics.profileViewsLast30Days} views publicas em 30 dias`, icon: CreditCard }
                      ].map(({ label, value, helper, icon: Icon }) => (
                        <div key={label} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_70px_-50px_rgba(15,23,42,0.35)]">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">{label}</p>
                              <p className="mt-3 text-4xl font-black tracking-tight text-[#000747]">{value}</p>
                              <p className="mt-2 text-sm font-medium text-slate-500">{helper}</p>
                            </div>
                            <div className="rounded-2xl bg-[#FDF1FA] p-3 text-[#9A077B]">
                              <Icon className="h-6 w-6" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
                      <div className="rounded-[32px] border border-slate-200 bg-white p-6">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#9A077B]">Fila de aprovacao</p>
                            <h2 className="mt-2 text-2xl font-black tracking-tight text-[#000747]">Aplicacoes urgentes</h2>
                          </div>
                          <button type="button" onClick={() => setActiveTab('applications')} className="text-sm font-black text-[#9A077B] transition hover:text-[#000747]">
                            Ver tudo
                          </button>
                        </div>
                        <div className="mt-5 space-y-4">
                          {pendingApplications.length === 0 ? (
                            <div className="rounded-[24px] border border-dashed border-slate-300 px-5 py-10 text-center text-sm font-medium text-slate-500">
                              Sem aplicacoes pendentes no momento.
                            </div>
                          ) : pendingApplications.map((item) => (
                            <div key={item.id} className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                              <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                  <p className="text-lg font-black text-[#000747]">{getApplicationName(item)}</p>
                                  <p className="mt-1 text-sm font-medium text-slate-500">{item.email || 'Sem e-mail informado'}</p>
                                  <p className="mt-2 text-sm font-semibold text-slate-400">{getApplicationLocation(item)}</p>
                                </div>
                                <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${getStatusClass(item.status)}`}>{getStatusLabel(item.status)}</span>
                              </div>
                              <div className="mt-4 flex flex-wrap gap-3">
                                <button type="button" disabled={busyKey === `approve:${item.id}`} onClick={() => void updateApplication(item.id, { status: 'accepted' }, 'Aplicacao aprovada com sucesso.', `approve:${item.id}`)} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-60">Aprovar</button>
                                <button type="button" disabled={busyKey === `reject:${item.id}`} onClick={() => void updateApplication(item.id, { status: 'rejected' }, 'Aplicacao marcada como reprovada.', `reject:${item.id}`)} className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-black text-white transition hover:bg-rose-700 disabled:opacity-60">Reprovar</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="rounded-[32px] border border-slate-200 bg-white p-6">
                          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#9A077B]">Pulso do negocio</p>
                          <div className="mt-5 rounded-[24px] bg-[#000747] p-5 text-white">
                            <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/70">Crescimento semanal</p>
                            <p className="mt-3 text-3xl font-black tracking-tight">{metrics.weeklyGrowthPercent}%</p>
                            <p className="mt-2 text-sm font-medium text-white/75">{metrics.applicationsThisWeek} novas aplicacoes nos ultimos 7 dias.</p>
                          </div>
                        </div>
                        <div className="rounded-[32px] border border-slate-200 bg-white p-6">
                          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#9A077B]">Leitura rapida</p>
                          <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <div className="rounded-[24px] bg-slate-50 px-5 py-4">
                              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Clientes ativos</p>
                              <p className="mt-2 text-2xl font-black text-[#000747]">{metrics.activeClients}</p>
                            </div>
                            <div className="rounded-[24px] bg-slate-50 px-5 py-4">
                              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Views em 30 dias</p>
                              <p className="mt-2 text-2xl font-black text-[#000747]">{metrics.profileViewsLast30Days}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                {activeTab === 'applications' && (
                  <div className="space-y-5">
                    {applications.map((item) => (
                      <div key={item.id} className="rounded-[32px] border border-slate-200 bg-white p-6">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="text-2xl font-black tracking-tight text-[#000747]">{getApplicationName(item)}</h3>
                              <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${getStatusClass(item.status)}`}>{getStatusLabel(item.status)}</span>
                            </div>
                            <p className="mt-2 text-sm font-medium text-slate-500">{item.email || 'Sem e-mail informado'}</p>
                            <p className="mt-2 text-sm font-semibold text-slate-400">{getApplicationLocation(item)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Criado em</p>
                            <p className="mt-2 text-sm font-bold text-[#000747]">{formatDate(item.created_at)}</p>
                          </div>
                        </div>

                        <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr,1.1fr,0.8fr]">
                          <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Categoria operacional</p>
                            <select value={item.category_level ?? ''} onChange={(event) => void updateApplication(item.id, { category_level: event.target.value || null }, 'Categoria atualizada.', `category:${item.id}`)} disabled={busyKey === `category:${item.id}`} className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-[#000747] outline-none focus:border-[#9A077B]">
                              {categoryOptions.map((option) => <option key={option || 'empty'} value={option}>{option || 'sem categoria'}</option>)}
                            </select>
                          </div>
                          <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Acoes de credenciamento</p>
                            <div className="mt-3 flex flex-wrap gap-3">
                              <button type="button" disabled={busyKey === `approve:${item.id}`} onClick={() => void updateApplication(item.id, { status: 'accepted' }, 'Aplicacao aprovada com sucesso.', `approve:${item.id}`)} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-60">Aprovar</button>
                              <button type="button" disabled={busyKey === `pending:${item.id}`} onClick={() => void updateApplication(item.id, { status: 'pending' }, 'Aplicacao voltou para pendencia.', `pending:${item.id}`)} className="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-black text-white transition hover:bg-amber-600 disabled:opacity-60">Pendente</button>
                              <button type="button" disabled={busyKey === `reject:${item.id}`} onClick={() => void updateApplication(item.id, { status: 'rejected' }, 'Aplicacao marcada como reprovada.', `reject:${item.id}`)} className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-black text-white transition hover:bg-rose-700 disabled:opacity-60">Reprovar</button>
                            </div>
                          </div>
                          <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Presenca atual</p>
                            <div className="mt-3 flex items-center justify-between gap-3">
                              <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${item.is_online ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-200 text-slate-600 border border-slate-300'}`}>{item.is_online ? 'Online' : 'Offline'}</span>
                              <span className="text-xs font-bold text-slate-500">{formatRelative(item.last_seen_at)}</span>
                            </div>
                            <button type="button" onClick={() => setPage(Page.PainterProfile, { painterId: item.id })} className="mt-4 inline-flex items-center gap-2 text-sm font-black text-[#9A077B] transition hover:text-[#000747]"><Eye className="h-4 w-4" />Abrir perfil publico</button>
                          </div>
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
                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="text-2xl font-black tracking-tight text-[#000747]">{getApplicationName(item)}</h3>
                              <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${item.is_online ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-200 text-slate-600 border border-slate-300'}`}>{item.is_online ? 'Online agora' : 'Offline'}</span>
                            </div>
                            <p className="mt-2 text-sm font-medium text-slate-500">{getApplicationLocation(item)}</p>
                            <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Ultima atividade: {formatRelative(item.last_seen_at)}</p>
                          </div>
                          <button type="button" onClick={() => setPage(Page.PainterProfile, { painterId: item.id })} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-[#000747] transition hover:border-[#9A077B] hover:text-[#9A077B]"><Eye className="h-4 w-4" />Ver perfil</button>
                        </div>

                        <div className="mt-6 grid gap-4 lg:grid-cols-3">
                          <button type="button" disabled={busyKey === `toggle-leads:${item.id}`} onClick={() => void updateApplication(item.id, { pause_lead_intake: !item.pause_lead_intake }, item.pause_lead_intake ? 'Captação de leads reativada.' : 'Captação de leads pausada.', `toggle-leads:${item.id}`)} className={`rounded-[24px] border px-5 py-5 text-left transition ${item.pause_lead_intake ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'} disabled:opacity-60`}>
                            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Captação de leads</p>
                            <p className="mt-3 text-lg font-black text-[#000747]">{item.pause_lead_intake ? 'Pausada' : 'Ativa'}</p>
                          </button>
                          <button type="button" disabled={busyKey === `toggle-chat:${item.id}`} onClick={() => void updateApplication(item.id, { allow_chat: !(item.allow_chat ?? true) }, item.allow_chat ? 'Chat desativado.' : 'Chat reativado.', `toggle-chat:${item.id}`)} className={`rounded-[24px] border px-5 py-5 text-left transition ${item.allow_chat ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-100'} disabled:opacity-60`}>
                            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Chat</p>
                            <p className="mt-3 text-lg font-black text-[#000747]">{item.allow_chat ? 'Liberado' : 'Bloqueado'}</p>
                          </button>
                          <button type="button" disabled={busyKey === `toggle-visits:${item.id}`} onClick={() => void updateApplication(item.id, { allow_visit_requests: !(item.allow_visit_requests ?? true) }, item.allow_visit_requests ? 'Agendamentos desativados.' : 'Agendamentos reativados.', `toggle-visits:${item.id}`)} className={`rounded-[24px] border px-5 py-5 text-left transition ${item.allow_visit_requests ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-100'} disabled:opacity-60`}>
                            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Visitas</p>
                            <p className="mt-3 text-lg font-black text-[#000747]">{item.allow_visit_requests ? 'Liberadas' : 'Bloqueadas'}</p>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'subscriptions' && (
                  <div className="space-y-5">
                    {subscribedPainters.map((item) => (
                      <div key={item.id} className="rounded-[32px] border border-slate-200 bg-white p-6">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="text-2xl font-black tracking-tight text-[#000747]">{getApplicationName(item)}</h3>
                              <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${getStatusClass(item.subscription_status)}`}>{getStatusLabel(item.subscription_status)}</span>
                            </div>
                            <p className="mt-2 text-sm font-medium text-slate-500">{item.email || 'Sem e-mail informado'}</p>
                          </div>
                          <div className="rounded-[22px] bg-[#000747] px-4 py-3 text-white">
                            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/70">Plano atual</p>
                            <p className="mt-2 text-xl font-black uppercase">{item.subscription_plan || 'Sem plano'}</p>
                          </div>
                        </div>

                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                          <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Plano</p>
                            <select value={item.subscription_plan ?? ''} onChange={(event) => void updateApplication(item.id, { subscription_plan: event.target.value || null }, 'Plano atualizado.', `plan:${item.id}`)} disabled={busyKey === `plan:${item.id}`} className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-[#000747] outline-none focus:border-[#9A077B]">
                              {planOptions.map((option) => <option key={option || 'empty'} value={option}>{option || 'sem plano'}</option>)}
                            </select>
                          </div>
                          <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Status da assinatura</p>
                            <select value={item.subscription_status ?? ''} onChange={(event) => void updateApplication(item.id, { subscription_status: event.target.value || null }, 'Status da assinatura atualizado.', `subscription:${item.id}`)} disabled={busyKey === `subscription:${item.id}`} className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-[#000747] outline-none focus:border-[#9A077B]">
                              {subscriptionStatusOptions.map((option) => <option key={option || 'empty'} value={option}>{option || 'nao informado'}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'operations' && (
                  <div className="grid gap-6 xl:grid-cols-3">
                    <div className="rounded-[32px] border border-slate-200 bg-white p-6">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#9A077B]">Chats</p>
                          <h2 className="mt-2 text-2xl font-black tracking-tight text-[#000747]">Conversas recentes</h2>
                        </div>
                        <span className="rounded-full bg-[#FDF1FA] px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#9A077B]">{metrics.openChats} abertos</span>
                      </div>
                      <div className="mt-5 space-y-4">
                        {recentChats.map((item) => (
                          <div key={item.id} className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-black text-[#000747]">{item.client_name}</p>
                                <p className="mt-1 text-xs font-medium text-slate-500">{painterByApplicationId[item.application_id] || 'Pintor nao identificado'}</p>
                              </div>
                              <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${getStatusClass(item.status)}`}>{getStatusLabel(item.status)}</span>
                            </div>
                            <p className="mt-3 text-sm font-medium text-slate-500">{item.last_message_preview || 'Sem previa de mensagem.'}</p>
                            <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{formatDateTime(item.last_message_at)}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[32px] border border-slate-200 bg-white p-6">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#9A077B]">Visitas</p>
                          <h2 className="mt-2 text-2xl font-black tracking-tight text-[#000747]">Agenda operacional</h2>
                        </div>
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-amber-700">{metrics.pendingVisits} pendentes</span>
                      </div>
                      <div className="mt-5 space-y-4">
                        {recentVisits.map((item) => (
                          <div key={item.id} className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-black text-[#000747]">{item.client_name}</p>
                                <p className="mt-1 text-xs font-medium text-slate-500">{painterByApplicationId[item.application_id] || 'Pintor nao identificado'}</p>
                              </div>
                              <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${getStatusClass(item.status)}`}>{getStatusLabel(item.status)}</span>
                            </div>
                            <p className="mt-3 text-sm font-medium text-slate-500">{item.location}</p>
                            <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{formatDate(item.preferred_date)} as {item.preferred_time}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[32px] border border-slate-200 bg-white p-6">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#9A077B]">Orcamentos</p>
                          <h2 className="mt-2 text-2xl font-black tracking-tight text-[#000747]">Negocios recentes</h2>
                        </div>
                        <span className="rounded-full bg-[#EEF3FF] px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#000747]">{recentQuotes.length} recentes</span>
                      </div>
                      <div className="mt-5 space-y-4">
                        {recentQuotes.map((item) => (
                          <div key={item.id} className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-black text-[#000747]">{item.cliente_nome}</p>
                                <p className="mt-1 text-xs font-medium text-slate-500">{painterByUserId[item.pintor_id ?? ''] || 'Pintor nao identificado'}</p>
                              </div>
                              <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${getStatusClass(item.status)}`}>{getStatusLabel(item.status)}</span>
                            </div>
                            <p className="mt-3 text-sm font-medium text-slate-500">{item.imovel_cidade_estado || 'Cidade nao informada'}</p>
                            <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{formatDateTime(item.created_at)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
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
