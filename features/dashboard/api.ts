import { SavedObra } from '../../components/ObraModal';
import { SavedOrcamento } from '../../components/OrcamentoModal';
import {
  DEFAULT_SERVICE_TIMEZONE,
  DEFAULT_WORKING_HOURS_END,
  DEFAULT_WORKING_HOURS_START,
  normalizeServiceTimezone,
  normalizeWorkingDays,
  sanitizeWorkingTime
} from '../../lib/painterAvailability';
import { normalizePortfolioStageMedia } from '../../lib/portfolioStages';
import { supabase } from '../../lib/supabase';
import {
  buildPainterMediaPath,
  getPublicMediaUrl,
  getSignedLegacyMediaUrl,
  PAINTER_MEDIA_BUCKET
} from './utils';
import { resolvePortfolioRecordMedia } from '../../lib/portfolioMedia';
import {
  AnalyticsPeriodDays,
  CurrentPainterProfile,
  FinancialEntryForm,
  PainterProfileEngagementMetrics,
  PainterProfileViewMetrics,
  PainterSettingsForm,
  SavedFinancialEntry,
  SavedTeamMember,
  TeamMemberForm,
  UpdateVisitRequestInput,
  SavedChatMessage,
  SavedChatThread,
  SavedVisitRequest
} from './types';

const QUOTE_SELECT_FIELDS = [
  'id',
  'cliente_nome',
  'cliente_cpf_cnpj',
  'cliente_telefone',
  'cliente_email',
  'cliente_tipo',
  'imovel_endereco',
  'imovel_cidade_estado',
  'imovel_tipo',
  'edificio_nome',
  'edificio_total_pavimentos',
  'edificio_pavimento_atendido',
  'edificio_possui_elevador',
  'edificio_tipo_atendimento',
  'imovel_situacao',
  'imovel_status',
  'ambientes',
  'pintura_tipo_servico',
  'pintura_acabamento',
  'pintura_acabamentos',
  'pintura_tinta',
  'pintura_tintas',
  'prep_situacao_parede',
  'prep_servicos_necessarios',
  'comp_altura_trabalho',
  'comp_necessidade',
  'comp_acesso',
  'servicos_extras',
  'cores_ja_definidas',
  'cores_quantidade',
  'cores_consultoria',
  'prazo_data_inicio',
  'prazo_estimado',
  'prazo_urgencia',
  'fornecimento_materiais',
  'valor_materiais',
  'valor_deslocamento',
  'valor_ajuste_extra',
  'valor_desconto',
  'valor_total',
  'imagens_paths',
  'observacoes',
  'status',
  'created_at'
].join(', ');

const FINANCIAL_ENTRY_SELECT_FIELDS = [
  'id',
  'painter_id',
  'entry_type',
  'title',
  'category',
  'related_client_name',
  'amount',
  'entry_date',
  'payment_method',
  'status',
  'notes',
  'created_at'
].join(', ');

const TEAM_MEMBER_SELECT_FIELDS = [
  'id',
  'painter_id',
  'full_name',
  'role',
  'phone',
  'daily_rate',
  'has_nr35',
  'nr35_expiration_date',
  'status',
  'specialties',
  'notes',
  'created_at'
].join(', ');

const createEmptyShareChannels = () => ({
  native: 0,
  copyLink: 0,
  facebook: 0,
  instagram: 0
});

const normalizeSocialProfileUrl = (value: string | null | undefined) => {
  const trimmedValue = (value ?? '').trim();

  if (!trimmedValue) {
    return '';
  }

  if (/^https?:\/\//i.test(trimmedValue)) {
    return trimmedValue;
  }

  return `https://${trimmedValue}`;
};

const normalizeShareChannel = (channel: string | null | undefined): keyof ReturnType<typeof createEmptyShareChannels> => {
  switch ((channel ?? '').trim().toLowerCase()) {
    case 'copy_link':
      return 'copyLink';
    case 'facebook':
      return 'facebook';
    case 'instagram':
      return 'instagram';
    default:
      return 'native';
  }
};

type FetchCurrentPainterProfileParams = {
  email: string;
  userId?: string;
};

export const fetchPortfolioItems = async (userId: string) => {
  const primaryQuery = await supabase
    .from('obras')
    .select('id, titulo, local, tipo_imovel, tipo_pintura, status, imagem_url, video_url, stage_media, created_at')
    .eq('pintor_id', userId)
    .order('created_at', { ascending: false });

  let data = primaryQuery.data;
  let error = primaryQuery.error;

  if (error && String(error.message || '').toLowerCase().includes('stage_media')) {
    const legacyQuery = await supabase
      .from('obras')
      .select('id, titulo, local, tipo_imovel, tipo_pintura, status, imagem_url, video_url, created_at')
      .eq('pintor_id', userId)
      .order('created_at', { ascending: false });

    data = legacyQuery.data?.map((item) => ({
      ...item,
      stage_media: null
    })) ?? null;
    error = legacyQuery.error;
  }

  if (error) {
    throw error;
  }

  return Promise.all((data ?? []).map(async (item: any) => {
    const {
      rawStageMedia,
      displayStageMedia,
      rawPreviewMedia,
      displayPreviewMedia
    } = await resolvePortfolioRecordMedia({
      stageMedia: item.stage_media,
      imageUrl: item.imagem_url,
      videoUrl: item.video_url
    });

    return {
      ...item,
      imagem_url: displayPreviewMedia.imageUrl,
      video_url: displayPreviewMedia.videoUrl,
      stage_media: displayStageMedia,
      image_path: rawPreviewMedia.imageUrl,
      video_path: rawPreviewMedia.videoUrl,
      stage_media_paths: rawStageMedia
    };
  })) as Promise<SavedObra[]>;
};

export const fetchQuoteItems = async (userId: string) => {
  const { data, error } = await supabase
    .from('orcamentos')
    .select(QUOTE_SELECT_FIELDS)
    .eq('pintor_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as unknown as SavedOrcamento[];
};

export const fetchFinancialEntries = async (userId: string) => {
  const { data, error } = await supabase
    .from('painter_financial_entries')
    .select(FINANCIAL_ENTRY_SELECT_FIELDS)
    .eq('painter_id', userId)
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as unknown as SavedFinancialEntry[];
};

export const createFinancialEntry = async (
  userId: string,
  payload: FinancialEntryForm
) => {
  const normalizedAmount = Number(payload.amount || 0);
  const { data, error } = await supabase
    .from('painter_financial_entries')
    .insert({
      painter_id: userId,
      entry_type: payload.entryType,
      title: payload.title.trim(),
      category: payload.category.trim() || null,
      related_client_name: payload.relatedClientName.trim() || null,
      amount: Number.isFinite(normalizedAmount) ? normalizedAmount : 0,
      entry_date: payload.entryDate,
      payment_method: payload.paymentMethod.trim() || null,
      status: payload.entryType === 'entrada' ? 'recebido' : 'pago',
      notes: payload.notes.trim() || null
    })
    .select(FINANCIAL_ENTRY_SELECT_FIELDS)
    .single();

  if (error) {
    throw error;
  }

  return data as unknown as SavedFinancialEntry;
};

export const deleteFinancialEntry = async (entryId: string, userId: string) => {
  const { error } = await supabase
    .from('painter_financial_entries')
    .delete()
    .eq('id', entryId)
    .eq('painter_id', userId);

  if (error) {
    throw error;
  }
};

export const fetchTeamMembers = async (userId: string) => {
  const { data, error } = await supabase
    .from('painter_team_members')
    .select(TEAM_MEMBER_SELECT_FIELDS)
    .eq('painter_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as unknown as SavedTeamMember[];
};

export const createTeamMember = async (
  userId: string,
  payload: TeamMemberForm
) => {
  const normalizedDailyRate = Number(payload.dailyRate || 0);
  const specialties = payload.specialties
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const { data, error } = await supabase
    .from('painter_team_members')
    .insert({
      painter_id: userId,
      full_name: payload.fullName.trim(),
      role: payload.role,
      phone: payload.phone.trim() || null,
      daily_rate: Number.isFinite(normalizedDailyRate) ? normalizedDailyRate : null,
      has_nr35: payload.hasNr35,
      nr35_expiration_date: payload.hasNr35 ? (payload.nr35ExpirationDate || null) : null,
      status: payload.status,
      specialties,
      notes: payload.notes.trim() || null
    })
    .select(TEAM_MEMBER_SELECT_FIELDS)
    .single();

  if (error) {
    throw error;
  }

  return data as unknown as SavedTeamMember;
};

export const deleteTeamMember = async (memberId: string, userId: string) => {
  const { error } = await supabase
    .from('painter_team_members')
    .delete()
    .eq('id', memberId)
    .eq('painter_id', userId);

  if (error) {
    throw error;
  }
};

export const deleteQuoteItem = async (quote: SavedOrcamento): Promise<void> => {
  const attachmentPaths = Array.isArray(quote.imagens_paths)
    ? quote.imagens_paths.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];

  if (attachmentPaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from('orcamentos-media')
      .remove(attachmentPaths);

    if (storageError) {
      console.error('Erro ao remover anexos do orcamento:', storageError);
    }
  }

  const { error } = await supabase
    .from('orcamentos')
    .delete()
    .eq('id', quote.id);

  if (error) {
    throw error;
  }
};

export const fetchVisitItems = async (applicationId: string) => {
  const { data, error } = await supabase
    .from('painter_visit_requests')
    .select('id, client_name, client_phone, client_email, preferred_date, preferred_time, location, notes, status, created_at')
    .eq('application_id', applicationId)
    .order('preferred_date', { ascending: true })
    .order('preferred_time', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as SavedVisitRequest[];
};

export const updateVisitRequest = async (
  visitId: string,
  updates: UpdateVisitRequestInput
): Promise<SavedVisitRequest> => {
  const normalizedLocation = updates.location.trim();

  const { data, error } = await supabase
    .from('painter_visit_requests')
    .update({
      preferred_date: updates.preferredDate,
      preferred_time: updates.preferredTime,
      location: normalizedLocation,
      status: updates.status
    })
    .eq('id', visitId)
    .select('id, client_name, client_phone, client_email, preferred_date, preferred_time, location, notes, status, created_at')
    .single();

  if (error) {
    throw error;
  }

  return data as SavedVisitRequest;
};

export const deleteVisitRequest = async (visitId: string): Promise<void> => {
  const { error } = await supabase
    .from('painter_visit_requests')
    .delete()
    .eq('id', visitId);

  if (error) {
    throw error;
  }
};

export const fetchChatThreads = async (applicationId: string) => {
  const { data, error } = await supabase
    .from('painter_chat_threads')
    .select('id, client_name, client_phone, client_email, status, unread_for_painter, last_message_preview, last_message_at, created_at')
    .eq('application_id', applicationId)
    .order('last_message_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as SavedChatThread[];
};

export const fetchChatMessages = async (threadId: string) => {
  const { data, error } = await supabase
    .from('painter_chat_messages')
    .select('id, thread_id, sender_type, sender_name, message, created_at')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as SavedChatMessage[];
};

export const normalizeChatThreadsError = (error: unknown) => {
  const message = error instanceof Error ? error.message.toLowerCase() : '';

  return message.includes('painter_chat_threads') || message.includes('does not exist')
    ? 'A tabela do chat ainda não foi criada no banco. Rode o SQL chat_interno_schema.sql no Supabase.'
    : 'Não foi possível carregar as conversas do chat agora.';
};

export const normalizeChatMessagesError = (error: unknown) => {
  const message = error instanceof Error ? error.message.toLowerCase() : '';

  return message.includes('painter_chat_messages') || message.includes('does not exist')
    ? 'A tabela de mensagens do chat ainda não foi criada no banco. Rode o SQL chat_interno_schema.sql no Supabase.'
    : 'Não foi possível carregar as mensagens dessa conversa agora.';
};

export const buildVisitErrorMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message.toLowerCase() : '';

  return message.includes('painter_visit_requests') || message.includes('does not exist')
    ? 'A tabela de visitas ainda não foi criada no banco. Rode o SQL agendamentos_visitas_schema.sql no Supabase.'
    : 'Não foi possível carregar sua agenda de visitas agora.';
};

const buildPeriodGrowthPercent = (currentPeriodViews: number, previousPeriodViews: number) => {
  if (currentPeriodViews === 0 && previousPeriodViews === 0) {
    return 0;
  }

  if (previousPeriodViews === 0) {
    return 100;
  }

  return Math.round(((currentPeriodViews - previousPeriodViews) / previousPeriodViews) * 100);
};

const isMissingProfileSharesTableError = (error: { message?: string } | null) => {
  const message = error?.message?.toLowerCase() ?? '';
  return message.includes('painter_profile_shares')
    && (message.includes('does not exist') || message.includes('schema cache') || message.includes('could not find the table'));
};

const pickBestPainterApplication = (applications: any[], email: string, userId?: string) => {
  if (!applications.length) {
    return null;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const byUserId = userId
    ? applications.filter((application) => application.auth_user_id === userId)
    : [];
  const byEmail = applications.filter((application) => (
    typeof application.email === 'string' && application.email.trim().toLowerCase() === normalizedEmail
  ));

  const pickAccepted = (items: any[]) => items.find((application) => application.status === 'accepted') ?? null;

  return pickAccepted(byUserId)
    ?? byUserId[0]
    ?? pickAccepted(byEmail)
    ?? byEmail[0]
    ?? applications[0]
    ?? null;
};

export const fetchCurrentPainterProfile = async ({
  email,
  userId
}: FetchCurrentPainterProfileParams): Promise<CurrentPainterProfile | null> => {
  if (!email && !userId) return null;

  const query = supabase
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false });

  const { data, error } = userId
    ? await query.or(`auth_user_id.eq.${userId},email.ilike.${email}`)
    : await query.ilike('email', email);

  if (error) {
    throw error;
  }

  const application = pickBestPainterApplication((data ?? []) as any[], email, userId);

  if (!application) {
    return null;
  }

  const publicProfilePhotoPath = application.foto_perfil || null;
  const publicCoverPhotoPath = application.foto_capa || null;
  const legacyProfilePhotoPath =
    application.profile_photo_path ||
    application.work_photo_paths?.find((path: string) => path.includes('/profile-photo/')) ||
    application.work_photo_paths?.[0] ||
    null;

  const profilePhotoPath = publicProfilePhotoPath || legacyProfilePhotoPath;
  const profilePhotoUrl =
    getPublicMediaUrl(publicProfilePhotoPath) || await getSignedLegacyMediaUrl(legacyProfilePhotoPath);

  return {
    applicationId: application.id,
    fullName: application.full_name || email.split('@')[0],
    email: application.email || email,
    city: application.city || '',
    uf: application.uf || '',
    whatsapp: application.whatsapp || '',
    experienceTime: application.experience_time || '',
    specialties: application.specialties || [],
    profilePhotoPath,
    profilePhotoUrl,
    coverPhotoPath: publicCoverPhotoPath,
    coverPhotoUrl: getPublicMediaUrl(publicCoverPhotoPath),
    applicationStatus: application.status || null,
    categoryLevel: application.category_level || null,
    subscriptionPlan: application.subscription_plan || null,
    subscriptionStatus: application.subscription_status || null,
    allowChat: application.allow_chat ?? true,
    allowVisitRequests: application.allow_visit_requests ?? true,
    pauseLeadIntake: application.pause_lead_intake ?? false,
    businessHoursEnabled: application.business_hours_enabled ?? false,
    workingDays: normalizeWorkingDays(application.working_days),
    workingHoursStart: sanitizeWorkingTime(application.working_hours_start, DEFAULT_WORKING_HOURS_START),
    workingHoursEnd: sanitizeWorkingTime(application.working_hours_end, DEFAULT_WORKING_HOURS_END),
    serviceTimezone: normalizeServiceTimezone(application.service_timezone ?? DEFAULT_SERVICE_TIMEZONE),
    emailNotifications: application.email_notifications ?? true,
    dailySummaryEnabled: application.daily_summary_enabled ?? false,
    instagramUrl: normalizeSocialProfileUrl(application.instagram_url),
    facebookUrl: normalizeSocialProfileUrl(application.facebook_url)
  };
};

export const updatePainterSettings = async (applicationId: string, settings: PainterSettingsForm): Promise<PainterSettingsForm> => {
  const normalizedWorkingDays = normalizeWorkingDays(settings.workingDays);
  const normalizedWorkingHoursStart = sanitizeWorkingTime(settings.workingHoursStart, DEFAULT_WORKING_HOURS_START);
  const normalizedWorkingHoursEnd = sanitizeWorkingTime(settings.workingHoursEnd, DEFAULT_WORKING_HOURS_END);
  const normalizedServiceTimezone = normalizeServiceTimezone(settings.serviceTimezone);

  const { data, error } = await supabase
    .from('applications')
    .update({
      allow_chat: settings.allowChat,
      allow_visit_requests: settings.allowVisitRequests,
      pause_lead_intake: settings.pauseLeadIntake,
      business_hours_enabled: settings.businessHoursEnabled,
      working_days: normalizedWorkingDays,
      working_hours_start: normalizedWorkingHoursStart,
      working_hours_end: normalizedWorkingHoursEnd,
      service_timezone: normalizedServiceTimezone,
      email_notifications: settings.emailNotifications,
      daily_summary_enabled: settings.dailySummaryEnabled,
      instagram_url: normalizeSocialProfileUrl(settings.instagramUrl),
      facebook_url: normalizeSocialProfileUrl(settings.facebookUrl)
    })
    .eq('id', applicationId)
    .select('allow_chat, allow_visit_requests, pause_lead_intake, business_hours_enabled, working_days, working_hours_start, working_hours_end, service_timezone, email_notifications, daily_summary_enabled, instagram_url, facebook_url')
    .single();

  if (error) {
    throw error;
  }

  return {
    allowChat: data.allow_chat ?? true,
    allowVisitRequests: data.allow_visit_requests ?? true,
    pauseLeadIntake: data.pause_lead_intake ?? false,
    businessHoursEnabled: data.business_hours_enabled ?? false,
    workingDays: normalizeWorkingDays(data.working_days),
    workingHoursStart: sanitizeWorkingTime(data.working_hours_start, DEFAULT_WORKING_HOURS_START),
    workingHoursEnd: sanitizeWorkingTime(data.working_hours_end, DEFAULT_WORKING_HOURS_END),
    serviceTimezone: normalizeServiceTimezone(data.service_timezone ?? DEFAULT_SERVICE_TIMEZONE),
    emailNotifications: data.email_notifications ?? true,
    dailySummaryEnabled: data.daily_summary_enabled ?? false,
    instagramUrl: normalizeSocialProfileUrl(data.instagram_url),
    facebookUrl: normalizeSocialProfileUrl(data.facebook_url)
  };
};

export const deleteCurrentPainterAccount = async (applicationId: string): Promise<void> => {
  const { error } = await supabase.functions.invoke('delete-painter-account', {
    body: { applicationId }
  });

  if (error) {
    throw error;
  }
};

export const fetchPainterProfileViewMetrics = async (
  applicationId: string,
  periodDays: AnalyticsPeriodDays
): Promise<PainterProfileViewMetrics> => {
  const { data, error } = await supabase
    .from('painter_profile_views')
    .select('viewed_at')
    .eq('application_id', applicationId);

  if (error) {
    throw error;
  }

  const nowMs = Date.now();
  const currentPeriodStartMs = nowMs - (periodDays * 24 * 60 * 60 * 1000);
  const previousPeriodStartMs = nowMs - ((periodDays * 2) * 24 * 60 * 60 * 1000);

  const viewedAtValues = (data ?? [])
    .map((item) => new Date(item.viewed_at).getTime())
    .filter((value) => !Number.isNaN(value));

  const currentPeriodViews = viewedAtValues.filter((value) => value >= currentPeriodStartMs).length;
  const previousPeriodViews = viewedAtValues.filter((value) => value >= previousPeriodStartMs && value < currentPeriodStartMs).length;

  return {
    totalViews: viewedAtValues.length,
    currentPeriodViews,
    previousPeriodViews,
    periodGrowthPercent: buildPeriodGrowthPercent(currentPeriodViews, previousPeriodViews)
  };
};

export const fetchPainterProfileEngagementMetrics = async (
  applicationId: string,
  periodDays: AnalyticsPeriodDays
): Promise<PainterProfileEngagementMetrics> => {
  const [reviewsResult, sharesResult] = await Promise.all([
    supabase
      .from('painter_reviews')
      .select('rating')
      .eq('application_id', applicationId),
    supabase
      .from('painter_profile_shares')
      .select('shared_at, channel')
      .eq('application_id', applicationId)
  ]);

  if (reviewsResult.error) {
    throw reviewsResult.error;
  }

  if (sharesResult.error && !isMissingProfileSharesTableError(sharesResult.error)) {
    throw sharesResult.error;
  }

  const ratings = (reviewsResult.data ?? [])
    .map((item) => Number(item.rating ?? 0))
    .filter((value) => value > 0);
  const totalReviewsCount = ratings.length;
  const averageRating = totalReviewsCount > 0
    ? Number((ratings.reduce((sum, value) => sum + value, 0) / totalReviewsCount).toFixed(1))
    : 0;

  const currentPeriodStartMs = Date.now() - (periodDays * 24 * 60 * 60 * 1000);
  const totalShareChannels = createEmptyShareChannels();
  const currentPeriodShareChannels = createEmptyShareChannels();
  let totalShares = 0;
  let currentPeriodShares = 0;

  for (const item of sharesResult.data ?? []) {
    const sharedAtMs = new Date(item.shared_at).getTime();

    if (Number.isNaN(sharedAtMs)) {
      continue;
    }

    const normalizedChannel = normalizeShareChannel(item.channel);
    totalShareChannels[normalizedChannel] += 1;
    totalShares += 1;

    if (sharedAtMs >= currentPeriodStartMs) {
      currentPeriodShareChannels[normalizedChannel] += 1;
      currentPeriodShares += 1;
    }
  }

  return {
    totalReviewsCount,
    averageRating,
    totalShares,
    currentPeriodShares,
    totalShareChannels,
    currentPeriodShareChannels
  };
};

export const updatePainterPresence = async (applicationId: string, isOnline: boolean) => {
  if (!applicationId) {
    return;
  }

  const { error } = await supabase
    .from('applications')
    .update({
      is_online: isOnline,
      last_seen_at: new Date().toISOString()
    })
    .eq('id', applicationId);

  if (error) {
    throw error;
  }
};

type UploadPainterMediaParams = {
  file: File;
  folder: 'foto-perfil' | 'foto-capa';
  column: 'foto_perfil' | 'foto_capa';
  applicationId: string;
  userId: string;
  previousPath: string | null;
};

export const uploadPainterMedia = async ({
  file,
  folder,
  column,
  applicationId,
  userId,
  previousPath
}: UploadPainterMediaParams) => {
  const filePath = buildPainterMediaPath(folder, userId, file);

  const { error: uploadError } = await supabase.storage
    .from(PAINTER_MEDIA_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    throw uploadError;
  }

  const { error: updateError } = await supabase
    .from('applications')
    .update({ [column]: filePath })
    .eq('id', applicationId);

  if (updateError) {
    await supabase.storage.from(PAINTER_MEDIA_BUCKET).remove([filePath]);
    throw updateError;
  }

  if (previousPath && previousPath !== filePath && previousPath.startsWith(`${folder}/`)) {
    const { error: removeError } = await supabase.storage
      .from(PAINTER_MEDIA_BUCKET)
      .remove([previousPath]);

    if (removeError) {
      console.error('Erro ao remover midia anterior do pintor:', removeError);
    }
  }

  return {
    path: filePath,
    url: getPublicMediaUrl(filePath)
  };
};

