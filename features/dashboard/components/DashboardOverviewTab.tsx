import React from 'react';
import { ArrowRight, CalendarDays, Camera, Clock, Edit2, Eye, FileText, Link2, Loader2, MessageSquare, Share2, Star, TrendingUp, Users } from 'lucide-react';
import { SavedObra } from '../../../components/ObraModal';
import { AnalyticsPeriodDays, CurrentPainterProfile, DashboardMetrics, FeedbackMessage } from '../types';
import {
  DEFAULT_COVER_IMAGE,
  DEFAULT_PROFILE_IMAGE,
  formatShortDate,
  getApplicationStatusLabel,
  getPlanLabel
} from '../utils';

interface DashboardOverviewTabProps {
  analyticsPeriodDays: AnalyticsPeriodDays;
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
  onAnalyticsPeriodChange: (nextPeriod: AnalyticsPeriodDays) => void;
}

export const DashboardOverviewTab: React.FC<DashboardOverviewTabProps> = ({
  analyticsPeriodDays,
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
  onEditProfile,
  onAnalyticsPeriodChange
}) => {
  const analyticsPeriodOptions: AnalyticsPeriodDays[] = [7, 30, 90];
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
  const periodLabel = `${analyticsPeriodDays} dias`;
  const periodContextLabel = `nos últimos ${analyticsPeriodDays} dias`;
  const previousPeriodContextLabel = `nos ${analyticsPeriodDays} dias anteriores`;
  const periodGrowthLabel = metrics.periodGrowthPercent > 0
    ? `+${metrics.periodGrowthPercent}%`
    : `${metrics.periodGrowthPercent}%`;
  const contactSources = [
    {
      label: 'Chat',
      value: metrics.periodChatContactsCount,
      icon: MessageSquare,
      color: 'text-cyan-600',
      bg: 'bg-cyan-50'
    },
    {
      label: 'Visitas',
      value: metrics.periodVisitContactsCount,
      icon: CalendarDays,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50'
    },
    {
      label: 'Orçamentos',
      value: metrics.periodQuoteContactsCount,
      icon: FileText,
      color: 'text-[#9A077B]',
      bg: 'bg-[#9A077B]/10'
    }
  ] as const;
  const topContactSource = [...contactSources].sort((firstSource, secondSource) => secondSource.value - firstSource.value)[0];
  const reputationCards = [
    {
      label: 'Avaliações Públicas',
      value: String(metrics.totalReviewsCount),
      detail: metrics.totalReviewsCount > 0
        ? `${metrics.averageRating.toFixed(1)} de nota média no perfil`
        : 'Seu perfil ainda não recebeu avaliações',
      icon: Star,
      color: 'text-amber-500',
      bg: 'bg-amber-50'
    },
    {
      label: 'Nota Média',
      value: metrics.totalReviewsCount > 0 ? metrics.averageRating.toFixed(1) : '--',
      detail: metrics.totalReviewsCount > 0
        ? `${metrics.totalReviewsCount} avaliação(ões) publicadas`
        : 'As estrelas aparecem após a primeira avaliação',
      icon: TrendingUp,
      color: 'text-violet-600',
      bg: 'bg-violet-50'
    },
    {
      label: 'Compartilhamentos do Perfil',
      value: String(metrics.periodShareCount),
      detail: `${metrics.totalShareCount} no total acumulado`,
      icon: Share2,
      color: 'text-cyan-600',
      bg: 'bg-cyan-50'
    }
  ] as const;
  const shareSources = [
    {
      label: 'Link do perfil',
      value: metrics.periodShareChannels.copyLink,
      total: metrics.totalShareChannels.copyLink,
      icon: Link2,
      color: 'text-sky-600',
      bg: 'bg-sky-50'
    },
    {
      label: 'Compart. nativo',
      value: metrics.periodShareChannels.native,
      total: metrics.totalShareChannels.native,
      icon: Share2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    },
    {
      label: 'Facebook',
      value: metrics.periodShareChannels.facebook,
      total: metrics.totalShareChannels.facebook,
      icon: Users,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50'
    },
    {
      label: 'Instagram',
      value: metrics.periodShareChannels.instagram,
      total: metrics.totalShareChannels.instagram,
      icon: Camera,
      color: 'text-fuchsia-600',
      bg: 'bg-fuchsia-50'
    }
  ] as const;
  const topShareSource = [...shareSources].sort((firstSource, secondSource) => secondSource.value - firstSource.value)[0];
  const safeFunnelPercent = (value: number, base: number) => {
    if (base <= 0 || value <= 0) {
      return 0;
    }

    return Math.round((value / base) * 100);
  };
  const funnelStages = [
    {
      label: 'Visualizações',
      value: metrics.periodProfileViewsCount,
      detail: `Perfis abertos ${periodContextLabel}`,
      accent: 'bg-emerald-50 border-emerald-100 text-emerald-600'
    },
    {
      label: 'Contatos',
      value: metrics.periodContactsCount,
      detail: 'Chats, visitas e orçamentos no período',
      accent: 'bg-cyan-50 border-cyan-100 text-cyan-600'
    },
    {
      label: 'Visitas',
      value: metrics.periodVisitContactsCount,
      detail: 'Pedidos de visita técnica no período',
      accent: 'bg-indigo-50 border-indigo-100 text-indigo-600'
    },
    {
      label: 'Orçamentos',
      value: metrics.periodQuoteContactsCount,
      detail: 'Pedidos de orçamento no período',
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
                  : 'Seu perfil está ativo e visível para clientes em sua região.'}
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

      <div className="mb-8 rounded-[28px] border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Filtro Analítico</p>
            <h3 className="mt-2 text-xl font-black text-[#000747]">Período das métricas comerciais</h3>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Visualizações, contatos, origem e funil agora seguem o mesmo intervalo.
            </p>
          </div>
          <div className="inline-flex w-full flex-wrap gap-2 rounded-[20px] bg-slate-100 p-1.5 lg:w-auto lg:flex-nowrap">
            {analyticsPeriodOptions.map((periodOption) => {
              const isActive = analyticsPeriodDays === periodOption;

              return (
                <button
                  key={periodOption}
                  type="button"
                  onClick={() => onAnalyticsPeriodChange(periodOption)}
                  className={`flex-1 rounded-2xl px-4 py-2.5 text-sm font-black transition lg:flex-none ${
                    isActive
                      ? 'bg-[#000747] text-white shadow-sm'
                      : 'text-slate-500 hover:bg-white hover:text-slate-700'
                  }`}
                >
                  {periodOption} dias
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {[
          {
            label: 'Obras no Portfólio',
            value: String(metrics.portfolioCount),
            trend: lastPortfolioEntry ? `Última obra em ${formatShortDate(lastPortfolioEntry.created_at)}` : 'Nenhuma obra cadastrada ainda',
            icon: Users,
            color: 'text-blue-500',
            bg: 'bg-blue-50'
          },
          {
            label: 'Orçamentos Recebidos',
            value: String(metrics.quoteCount),
            trend: `${metrics.pendingQuoteCount} aguardando resposta`,
            icon: FileText,
            color: 'text-[#9A077B]',
            bg: 'bg-[#9A077B]/10'
          },
          {
            label: 'Visualizações do Perfil',
            value: String(metrics.periodProfileViewsCount),
            trend: `${metrics.totalProfileViewsCount} no total acumulado`,
            icon: Eye,
            color: 'text-emerald-500',
            bg: 'bg-emerald-50'
          },
          {
            label: 'Contatos Recebidos',
            value: String(metrics.periodContactsCount),
            trend: `${metrics.periodChatContactsCount} chat(s), ${metrics.periodVisitContactsCount} visita(s) e ${metrics.periodQuoteContactsCount} orçamento(s) no período`,
            icon: MessageSquare,
            color: 'text-cyan-600',
            bg: 'bg-cyan-50'
          },
          {
            label: 'Crescimento do Período',
            value: periodGrowthLabel,
            trend: `${metrics.periodProfileViewsCount} visualização(ões) vs ${metrics.previousPeriodProfileViewsCount} ${previousPeriodContextLabel}`,
            icon: TrendingUp,
            color: metrics.periodGrowthPercent >= 0 ? 'text-violet-600' : 'text-rose-600',
            bg: metrics.periodGrowthPercent >= 0 ? 'bg-violet-50' : 'bg-rose-50'
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
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-xl font-black text-[#000747]">Reputação e Alcance</h3>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-amber-700">
                Perfil Público
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500">
              Acompanhe como os clientes estão avaliando e compartilhando o seu perfil.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Compartilhamentos no período</p>
            <p className="mt-1 text-sm font-black text-slate-700">{metrics.periodShareCount}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {reputationCards.map((card) => (
            <div key={card.label} className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{card.label}</p>
                  <p className="mt-2 text-3xl font-black text-slate-900">{card.value}</p>
                  <p className="mt-2 text-sm font-medium text-slate-500">{card.detail}</p>
                </div>
                <div className={`rounded-2xl p-3 ${card.bg} ${card.color}`}>
                  <card.icon size={20} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-[28px] border border-slate-200 bg-slate-50/70 p-5">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Canais de compartilhamento</p>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Veja quais ações estão espalhando mais o seu perfil no intervalo selecionado.
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Canal líder</p>
              <p className="mt-1 text-sm font-black text-slate-700">
                {topShareSource.value > 0 ? `${topShareSource.label} (${topShareSource.value})` : 'Sem compartilhamentos ainda'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {shareSources.map((source) => (
              <div key={source.label} className="rounded-[24px] border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{source.label}</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">{source.value}</p>
                    <p className="mt-2 text-sm font-medium text-slate-500">{source.total} no total acumulado</p>
                  </div>
                  <div className={`rounded-2xl p-3 ${source.bg} ${source.color}`}>
                    <source.icon size={18} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-8 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-xl font-black text-[#000747]">Origem dos Contatos</h3>
              <span className="rounded-full bg-[#9A077B]/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[#9A077B]">
                {periodLabel}
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500">Veja qual canal está trazendo mais demanda para o seu perfil no intervalo selecionado.</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Canal líder</p>
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
                    {metrics.periodContactsCount > 0
                      ? `${Math.round((source.value / metrics.periodContactsCount) * 100)}% dos contatos no período`
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
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-xl font-black text-[#000747]">Funil Comercial</h3>
              <span className="rounded-full bg-[#000747]/5 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[#000747]">
                {periodLabel}
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500">Leitura simples do interesse no perfil até a solicitação comercial no período escolhido.</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Taxa visita / contato</p>
            <p className="mt-1 text-sm font-black text-slate-700">
              {safeFunnelPercent(metrics.periodVisitContactsCount, metrics.periodContactsCount)}%
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
                      {index === 0 ? 'Base do período' : 'Conversão da etapa anterior'}
                    </p>
                    <p className="text-sm font-black text-slate-700">
                      {index === 0 ? '100%' : `${stageRate}%`}
                    </p>
                    <p className="text-xs font-medium text-slate-500">
                      {overallRate}% em relação às visualizações do período
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
          <TrendingUp className="mr-3 text-[#9A077B]" /> Insights & Próximos Passos
        </h3>
        <ul className="space-y-4">
          <li className="flex items-center p-4 bg-amber-50 text-amber-900 rounded-2xl border border-amber-100">
            <Clock className="mr-4 flex-shrink-0" />
            <div>
              <p className="font-bold">Orçamentos aguardando retorno</p>
              <p className="text-sm opacity-80">
                {metrics.pendingQuoteCount > 0
                  ? `Você tem ${metrics.pendingQuoteCount} orçamento(s) novos esperando resposta.`
                  : 'Nenhum novo orçamento pendente no momento.'}
              </p>
            </div>
          </li>
          <li className="flex items-center p-4 bg-emerald-50 text-emerald-900 rounded-2xl border border-emerald-100">
            <Eye className="mr-4 flex-shrink-0 text-emerald-500" />
            <div>
              <p className="font-bold">Desempenho do perfil</p>
              <p className="text-sm opacity-80">
                {metrics.totalProfileViewsCount > 0
                  ? `Seu perfil soma ${metrics.totalProfileViewsCount} visualização(ões), com ${metrics.periodProfileViewsCount} ${periodContextLabel} e ${periodGrowthLabel} frente ao período anterior.`
                  : 'Seu perfil ainda não registrou visualizações públicas suficientes para análise.'}
              </p>
            </div>
          </li>
          <li className="flex items-center p-4 bg-cyan-50 text-cyan-900 rounded-2xl border border-cyan-100">
            <MessageSquare className="mr-4 flex-shrink-0 text-cyan-500" />
            <div>
              <p className="font-bold">Canal com mais retorno</p>
              <p className="text-sm opacity-80">
                {topContactSource.value > 0
                  ? `${topContactSource.label} lidera com ${topContactSource.value} contato(s) recebidos ${periodContextLabel}.`
                  : 'Assim que os primeiros contatos chegarem, mostramos aqui qual canal mais converte.'}
              </p>
            </div>
          </li>
          <li className="flex items-center p-4 bg-violet-50 text-violet-900 rounded-2xl border border-violet-100">
            <TrendingUp className="mr-4 flex-shrink-0 text-violet-500" />
            <div>
              <p className="font-bold">Funil do período</p>
              <p className="text-sm opacity-80">
                {metrics.periodProfileViewsCount > 0
                  ? `${metrics.periodContactsCount} contato(s), ${metrics.periodVisitContactsCount} visita(s) e ${metrics.periodQuoteContactsCount} orçamento(s) nasceram de ${metrics.periodProfileViewsCount} visualização(ões) ${periodContextLabel}.`
                  : `Assim que o perfil registrar visualizações ${periodContextLabel}, o funil comercial passa a preencher automaticamente.`}
              </p>
            </div>
          </li>
          <li className="flex items-center p-4 bg-slate-50 text-slate-700 rounded-2xl border border-slate-100">
            <Camera className="mr-4 flex-shrink-0 text-slate-400" />
            <div>
              <p className="font-bold">Portfólio em evolução</p>
              <p className="text-sm text-slate-500">
                {metrics.portfolioCount > 0
                  ? `Seu portfólio já possui ${metrics.portfolioCount} obra(s) publicada(s).`
                  : 'Adicione sua primeira obra para fortalecer sua apresentação no painel.'}
              </p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
};


