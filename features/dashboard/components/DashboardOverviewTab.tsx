import React from 'react';
import { ArrowRight, CalendarDays, Camera, Clock, Edit2, Eye, FileText, Loader2, MessageSquare, Star, TrendingUp, Users } from 'lucide-react';
import { SavedObra } from '../../../components/ObraModal';
import { CurrentPainterProfile, DashboardMetrics, FeedbackMessage } from '../types';
import {
  DEFAULT_COVER_IMAGE,
  DEFAULT_PROFILE_IMAGE,
  formatShortDate,
  getApplicationStatusLabel,
  getPlanLabel
} from '../utils';

interface DashboardOverviewTabProps {
  userName: string;
  currentProfile: CurrentPainterProfile | null;
  metrics: DashboardMetrics;
  portfolioItems: SavedObra[];
  mediaFeedback: FeedbackMessage | null;
  profileFeedback: FeedbackMessage | null;
  profileInputRef: React.RefObject<HTMLInputElement | null>;
  coverInputRef: React.RefObject<HTMLInputElement | null>;
  isUploadingProfile: boolean;
  isUploadingCover: boolean;
  onProfileFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCoverFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenProfilePicker: () => void;
  onOpenCoverPicker: () => void;
  onEditProfile: () => void;
}

export const DashboardOverviewTab: React.FC<DashboardOverviewTabProps> = ({
  userName,
  currentProfile,
  metrics,
  portfolioItems,
  mediaFeedback,
  profileFeedback,
  profileInputRef,
  coverInputRef,
  isUploadingProfile,
  isUploadingCover,
  onProfileFileChange,
  onCoverFileChange,
  onOpenProfilePicker,
  onOpenCoverPicker,
  onEditProfile
}) => {
  const displayName = currentProfile?.fullName || userName;
  const profilePhotoUrl = currentProfile?.profilePhotoUrl || DEFAULT_PROFILE_IMAGE;
  const locationLabel = currentProfile?.city
    ? [currentProfile.city, currentProfile.uf].filter(Boolean).join(' - ')
    : '';
  const coverPhotoUrl =
    currentProfile?.coverPhotoUrl ||
    portfolioItems.find((obra) => obra.imagem_url)?.imagem_url ||
    DEFAULT_COVER_IMAGE;
  const introDetails = [
    locationLabel || null,
    currentProfile?.experienceTime ? `${currentProfile.experienceTime} de experiencia` : null,
    currentProfile?.specialties.length ? `${currentProfile.specialties.length} especialidades` : null
  ].filter(Boolean);
  const lastPortfolioEntry = portfolioItems[0];
  const canEditMedia = Boolean(currentProfile?.applicationId);
  const weeklyGrowthLabel = metrics.weeklyGrowthPercent > 0
    ? `+${metrics.weeklyGrowthPercent}%`
    : `${metrics.weeklyGrowthPercent}%`;
  const contactSources = [
    {
      label: 'Chat',
      value: metrics.chatContactsCount,
      icon: MessageSquare,
      color: 'text-cyan-600',
      bg: 'bg-cyan-50'
    },
    {
      label: 'Visitas',
      value: metrics.visitContactsCount,
      icon: CalendarDays,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50'
    },
    {
      label: 'Orcamentos',
      value: metrics.quoteContactsCount,
      icon: FileText,
      color: 'text-[#9A077B]',
      bg: 'bg-[#9A077B]/10'
    }
  ] as const;
  const topContactSource = [...contactSources].sort((firstSource, secondSource) => secondSource.value - firstSource.value)[0];
  const safeFunnelPercent = (value: number, base: number) => {
    if (base <= 0 || value <= 0) {
      return 0;
    }

    return Math.round((value / base) * 100);
  };
  const funnelStages = [
    {
      label: 'Visualizacoes',
      value: metrics.currentWeekProfileViews,
      detail: 'Perfis abertos nos ultimos 7 dias',
      accent: 'bg-emerald-50 border-emerald-100 text-emerald-600'
    },
    {
      label: 'Contatos',
      value: metrics.currentWeekContactsCount,
      detail: 'Chats, visitas e orcamentos no periodo',
      accent: 'bg-cyan-50 border-cyan-100 text-cyan-600'
    },
    {
      label: 'Visitas',
      value: metrics.currentWeekVisitContactsCount,
      detail: 'Pedidos de visita tecnica no periodo',
      accent: 'bg-indigo-50 border-indigo-100 text-indigo-600'
    },
    {
      label: 'Orcamentos',
      value: metrics.currentWeekQuoteContactsCount,
      detail: 'Pedidos de orcamento no periodo',
      accent: 'bg-[#F7E3F1] border-[#F2C9E7] text-[#9A077B]'
    }
  ] as const;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <input
        ref={profileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onProfileFileChange}
      />
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onCoverFileChange}
      />

      <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-200 mb-8 relative">
        <div className="h-48 bg-slate-800 relative">
          <img src={coverPhotoUrl} className="w-full h-full object-cover opacity-60" alt="Capa do perfil" />
          <button
            type="button"
            onClick={onOpenCoverPicker}
            disabled={isUploadingCover || !canEditMedia}
            className="absolute bottom-4 right-4 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center hover:bg-white/30 transition disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isUploadingCover ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Camera size={14} className="mr-2" />}
            {isUploadingCover ? 'Enviando capa...' : 'Alterar Capa'}
          </button>
        </div>

        <div className="px-8 pb-8 relative">
          <button
            type="button"
            onClick={onOpenProfilePicker}
            disabled={isUploadingProfile || !canEditMedia}
            className="absolute -top-16 rounded-full bg-white shadow-xl group disabled:cursor-not-allowed"
          >
            <div className="border-4 border-white rounded-full overflow-hidden relative">
              <img src={profilePhotoUrl} alt={displayName} className="w-32 h-32 rounded-full object-cover relative z-10" />
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                {isUploadingProfile ? <Loader2 className="text-white animate-spin" /> : <Camera className="text-white" />}
              </div>
            </div>
            <div className="absolute bottom-1 right-1 z-30 bg-[#9A077B] text-white rounded-full p-2 shadow-lg">
              {isUploadingProfile ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            </div>
          </button>

          <div className="pt-20 flex justify-between items-start gap-4">
            <div>
              <h2 className="text-3xl font-black text-[#000747]">Bem-vindo de volta, {displayName.split(' ')[0]}!</h2>
              <p className="text-slate-500 font-medium">
                {introDetails.length > 0
                  ? introDetails.join(' | ')
                  : 'Seu perfil esta ativo e visivel para clientes em sua regiao.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onEditProfile}
              disabled={!currentProfile?.applicationId}
              className="bg-slate-100 text-slate-700 px-5 py-2.5 rounded-xl font-bold text-sm flex items-center hover:bg-slate-200 transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Edit2 size={16} className="mr-2" /> Editar Perfil
            </button>
          </div>

          {profileFeedback && (
            <div
              className={`mt-6 rounded-2xl border px-4 py-3 text-sm font-bold ${
                profileFeedback.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {profileFeedback.message}
            </div>
          )}

          {mediaFeedback && (
            <div
              className={`mt-6 rounded-2xl border px-4 py-3 text-sm font-bold ${
                mediaFeedback.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {mediaFeedback.message}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {[
          {
            label: 'Obras no Portfolio',
            value: String(metrics.portfolioCount),
            trend: lastPortfolioEntry ? `Ultima obra em ${formatShortDate(lastPortfolioEntry.created_at)}` : 'Nenhuma obra cadastrada ainda',
            icon: Users,
            color: 'text-blue-500',
            bg: 'bg-blue-50'
          },
          {
            label: 'Orcamentos Recebidos',
            value: String(metrics.quoteCount),
            trend: `${metrics.pendingQuoteCount} aguardando resposta`,
            icon: FileText,
            color: 'text-[#9A077B]',
            bg: 'bg-[#9A077B]/10'
          },
          {
            label: 'Visualizacoes do Perfil',
            value: String(metrics.profileViewsCount),
            trend: `${metrics.currentWeekProfileViews} nesta semana`,
            icon: Eye,
            color: 'text-emerald-500',
            bg: 'bg-emerald-50'
          },
          {
            label: 'Contatos Recebidos',
            value: String(metrics.contactsCount),
            trend: `${metrics.chatContactsCount} chat(s), ${metrics.visitContactsCount} visita(s) e ${metrics.quoteContactsCount} orcamento(s)`,
            icon: MessageSquare,
            color: 'text-cyan-600',
            bg: 'bg-cyan-50'
          },
          {
            label: 'Crescimento Semanal',
            value: weeklyGrowthLabel,
            trend: `${metrics.currentWeekProfileViews} visualizacao(oes) vs ${metrics.previousWeekProfileViews} na semana anterior`,
            icon: TrendingUp,
            color: metrics.weeklyGrowthPercent >= 0 ? 'text-violet-600' : 'text-rose-600',
            bg: metrics.weeklyGrowthPercent >= 0 ? 'bg-violet-50' : 'bg-rose-50'
          },
          {
            label: 'Plano Atual',
            value: getPlanLabel(currentProfile),
            trend: getApplicationStatusLabel(currentProfile?.applicationStatus),
            icon: Star,
            color: 'text-amber-500',
            bg: 'bg-amber-50'
          }
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-start justify-between hover:shadow-md transition">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">{stat.label}</p>
              <h3 className="text-4xl font-black text-slate-900 mb-2 break-words">{stat.value}</h3>
              <p className="text-slate-400 text-sm font-medium">{stat.trend}</p>
            </div>
            <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      <div className="mb-8 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-[#000747]">Origem dos Contatos</h3>
            <p className="text-sm font-medium text-slate-500">Veja qual canal esta trazendo mais demanda para o seu perfil.</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Canal lider</p>
            <p className="mt-1 text-sm font-black text-slate-700">
              {topContactSource.value > 0 ? `${topContactSource.label} (${topContactSource.value})` : 'Sem contatos ainda'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {contactSources.map((source) => (
            <div key={source.label} className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{source.label}</p>
                  <p className="mt-2 text-3xl font-black text-slate-900">{source.value}</p>
                  <p className="mt-2 text-sm font-medium text-slate-500">
                    {metrics.contactsCount > 0
                      ? `${Math.round((source.value / metrics.contactsCount) * 100)}% dos contatos recebidos`
                      : 'Aguardando os primeiros contatos'}
                  </p>
                </div>
                <div className={`rounded-2xl p-3 ${source.bg} ${source.color}`}>
                  <source.icon size={20} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-[#000747]">Funil Comercial</h3>
            <p className="text-sm font-medium text-slate-500">Leitura simples dos ultimos 7 dias: do interesse no perfil ate a solicitacao comercial.</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Taxa visita / contato</p>
            <p className="mt-1 text-sm font-black text-slate-700">
              {safeFunnelPercent(metrics.currentWeekVisitContactsCount, metrics.currentWeekContactsCount)}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[repeat(4,minmax(0,1fr))]">
          {funnelStages.map((stage, index) => {
            const previousValue = index === 0 ? stage.value : funnelStages[index - 1].value;
            const stageRate = index === 0 ? 100 : safeFunnelPercent(stage.value, previousValue);
            const overallRate = safeFunnelPercent(stage.value, funnelStages[0].value);

            return (
              <div key={stage.label} className="relative">
                <div className={`h-full rounded-[28px] border p-5 ${stage.accent}`}>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-70">{stage.label}</p>
                  <p className="mt-3 text-4xl font-black text-slate-900">{stage.value}</p>
                  <p className="mt-3 text-sm font-medium text-slate-500">{stage.detail}</p>
                  <div className="mt-5 space-y-2 rounded-2xl bg-white/70 px-4 py-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                      {index === 0 ? 'Base da semana' : 'Conversao da etapa anterior'}
                    </p>
                    <p className="text-sm font-black text-slate-700">
                      {index === 0 ? '100%' : `${stageRate}%`}
                    </p>
                    <p className="text-xs font-medium text-slate-500">
                      {overallRate}% em relacao as visualizacoes da semana
                    </p>
                  </div>
                </div>

                {index < funnelStages.length - 1 && (
                  <div className="pointer-events-none absolute -right-3 top-1/2 hidden -translate-y-1/2 xl:flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm">
                    <ArrowRight size={18} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
        <h3 className="text-xl font-black text-[#000747] mb-6 flex items-center">
          <TrendingUp className="mr-3 text-[#9A077B]" /> Insights & Proximos Passos
        </h3>
        <ul className="space-y-4">
          <li className="flex items-center p-4 bg-amber-50 text-amber-900 rounded-2xl border border-amber-100">
            <Clock className="mr-4 flex-shrink-0" />
            <div>
              <p className="font-bold">Orcamentos aguardando retorno</p>
              <p className="text-sm opacity-80">
                {metrics.pendingQuoteCount > 0
                  ? `Voce tem ${metrics.pendingQuoteCount} orcamento(s) novos esperando resposta.`
                  : 'Nenhum novo orcamento pendente no momento.'}
              </p>
            </div>
          </li>
          <li className="flex items-center p-4 bg-emerald-50 text-emerald-900 rounded-2xl border border-emerald-100">
            <Eye className="mr-4 flex-shrink-0 text-emerald-500" />
            <div>
              <p className="font-bold">Desempenho do perfil</p>
              <p className="text-sm opacity-80">
                {metrics.profileViewsCount > 0
                  ? `Seu perfil soma ${metrics.profileViewsCount} visualizacao(oes), com ${weeklyGrowthLabel} nesta comparacao semanal.`
                  : 'Seu perfil ainda nao registrou visualizacoes publicas suficientes para analise.'}
              </p>
            </div>
          </li>
          <li className="flex items-center p-4 bg-cyan-50 text-cyan-900 rounded-2xl border border-cyan-100">
            <MessageSquare className="mr-4 flex-shrink-0 text-cyan-500" />
            <div>
              <p className="font-bold">Canal com mais retorno</p>
              <p className="text-sm opacity-80">
                {topContactSource.value > 0
                  ? `${topContactSource.label} lidera com ${topContactSource.value} contato(s) recebido(s) ate agora.`
                  : 'Assim que os primeiros contatos chegarem, mostramos aqui qual canal mais converte.'}
              </p>
            </div>
          </li>
          <li className="flex items-center p-4 bg-violet-50 text-violet-900 rounded-2xl border border-violet-100">
            <TrendingUp className="mr-4 flex-shrink-0 text-violet-500" />
            <div>
              <p className="font-bold">Funil da semana</p>
              <p className="text-sm opacity-80">
                {metrics.currentWeekProfileViews > 0
                  ? `${metrics.currentWeekContactsCount} contato(s), ${metrics.currentWeekVisitContactsCount} visita(s) e ${metrics.currentWeekQuoteContactsCount} orcamento(s) nasceram de ${metrics.currentWeekProfileViews} visualizacao(oes) nesta semana.`
                  : 'Assim que o perfil registrar visualizacoes nesta semana, o funil comercial passa a preencher automaticamente.'}
              </p>
            </div>
          </li>
          <li className="flex items-center p-4 bg-slate-50 text-slate-700 rounded-2xl border border-slate-100">
            <Camera className="mr-4 flex-shrink-0 text-slate-400" />
            <div>
              <p className="font-bold">Portfolio em evolucao</p>
              <p className="text-sm text-slate-500">
                {metrics.portfolioCount > 0
                  ? `Seu portfolio ja possui ${metrics.portfolioCount} obra(s) publicada(s).`
                  : 'Adicione sua primeira obra para fortalecer sua apresentacao no painel.'}
              </p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
};
