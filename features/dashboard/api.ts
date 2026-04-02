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
import { supabase } from '../../lib/supabase';
import {
  buildPainterMediaPath,
  getPublicMediaUrl,
  getSignedLegacyMediaUrl,
  PAINTER_MEDIA_BUCKET
} from './utils';
import { CurrentPainterProfile, PainterSettingsForm, SavedChatMessage, SavedChatThread, SavedVisitRequest } from './types';

type FetchCurrentPainterProfileParams = {
  email: string;
  userId?: string;
};

export const fetchPortfolioItems = async (userId: string) => {
  const { data, error } = await supabase
    .from('obras')
    .select('id, titulo, local, tipo_imovel, tipo_pintura, status, imagem_url, video_url, created_at')
    .eq('pintor_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as SavedObra[];
};

export const fetchQuoteItems = async (userId: string) => {
  const { data, error } = await supabase
    .from('orcamentos')
    .select(
      'id, cliente_nome, cliente_telefone, cliente_email, cliente_tipo, imovel_cidade_estado, imovel_tipo, pintura_tipo_servico, prazo_urgencia, status, created_at'
    )
    .eq('pintor_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as SavedOrcamento[];
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
    ? 'A tabela do chat ainda nao foi criada no banco. Rode o SQL chat_interno_schema.sql no Supabase.'
    : 'Nao foi possivel carregar as conversas do chat agora.';
};

export const normalizeChatMessagesError = (error: unknown) => {
  const message = error instanceof Error ? error.message.toLowerCase() : '';

  return message.includes('painter_chat_messages') || message.includes('does not exist')
    ? 'A tabela de mensagens do chat ainda nao foi criada no banco. Rode o SQL chat_interno_schema.sql no Supabase.'
    : 'Nao foi possivel carregar as mensagens dessa conversa agora.';
};

export const buildVisitErrorMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message.toLowerCase() : '';

  return message.includes('painter_visit_requests') || message.includes('does not exist')
    ? 'A tabela de visitas ainda nao foi criada no banco. Rode o SQL agendamentos_visitas_schema.sql no Supabase.'
    : 'Nao foi possivel carregar sua agenda de visitas agora.';
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
    dailySummaryEnabled: application.daily_summary_enabled ?? false
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
      daily_summary_enabled: settings.dailySummaryEnabled
    })
    .eq('id', applicationId)
    .select('allow_chat, allow_visit_requests, pause_lead_intake, business_hours_enabled, working_days, working_hours_start, working_hours_end, service_timezone, email_notifications, daily_summary_enabled')
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
    dailySummaryEnabled: data.daily_summary_enabled ?? false
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
