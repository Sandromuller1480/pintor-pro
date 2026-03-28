import { supabase } from '../../lib/supabase';
import { CurrentPainterProfile } from './types';

export const QUOTE_STATUS_LABELS: Record<string, string> = {
  novo: 'Novo',
  respondido: 'Respondido',
  em_negociacao: 'Em Negociacao',
  fechado: 'Fechado',
  recusado: 'Recusado'
};

export const QUOTE_STATUS_STYLES: Record<string, string> = {
  novo: 'bg-emerald-100 text-emerald-700',
  respondido: 'bg-blue-100 text-blue-700',
  em_negociacao: 'bg-amber-100 text-amber-700',
  fechado: 'bg-slate-200 text-slate-700',
  recusado: 'bg-red-100 text-red-700'
};

export const DEFAULT_COVER_IMAGE =
  'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=2070&auto=format&fit=crop';
export const DEFAULT_PROFILE_IMAGE = 'https://i.pravatar.cc/150?u=dashboard-profile';
export const PAINTER_MEDIA_BUCKET = 'painters-media';
export const LEGACY_PROFILE_BUCKET = 'application-work-photos';

const PLAN_LABELS: Record<string, string> = {
  bronze: 'Bronze',
  silver: 'Elite Silver',
  pro: 'PINTOR PRO'
};

const CATEGORY_LABELS: Record<string, string> = {
  bronze: 'Bronze',
  prata: 'Prata',
  ouro: 'Ouro'
};

const APPLICATION_STATUS_LABELS: Record<string, string> = {
  pending: 'Em analise',
  accepted: 'Ativo',
  rejected: 'Reprovado'
};

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);

export const getPlanLabel = (profile: CurrentPainterProfile | null) => {
  if (profile?.subscriptionPlan && PLAN_LABELS[profile.subscriptionPlan]) {
    return PLAN_LABELS[profile.subscriptionPlan];
  }

  if (profile?.categoryLevel && CATEGORY_LABELS[profile.categoryLevel]) {
    return `Categoria ${CATEGORY_LABELS[profile.categoryLevel]}`;
  }

  return 'Sem plano';
};

export const getApplicationStatusLabel = (status: string | null | undefined) => {
  if (!status) return 'Sem status';
  return APPLICATION_STATUS_LABELS[status] ?? status;
};

export const formatShortDate = (value: string) => {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(parsedDate);
};

export const getPublicMediaUrl = (path: string | null | undefined) => {
  if (!path) {
    return null;
  }

  if (isAbsoluteUrl(path)) {
    return path;
  }

  const {
    data: { publicUrl }
  } = supabase.storage.from(PAINTER_MEDIA_BUCKET).getPublicUrl(path);

  return publicUrl;
};

export const getSignedLegacyMediaUrl = async (path: string | null | undefined) => {
  if (!path) {
    return null;
  }

  if (isAbsoluteUrl(path)) {
    return path;
  }

  const { data, error } = await supabase.storage
    .from(LEGACY_PROFILE_BUCKET)
    .createSignedUrl(path, 60 * 60);

  if (error) {
    console.error('Erro ao gerar URL assinada da foto antiga:', error);
    return null;
  }

  return data.signedUrl;
};

const sanitizeFileName = (fileName: string) => {
  const cleanedName = fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return cleanedName || 'imagem';
};

export const buildPainterMediaPath = (
  folder: 'foto-perfil' | 'foto-capa',
  userId: string,
  file: File
) => {
  const nameParts = file.name.split('.');
  const extension = nameParts.length > 1 ? nameParts.pop()?.toLowerCase() : 'jpg';
  const baseName = sanitizeFileName(nameParts.join('.'));

  return `${folder}/${userId}/${baseName}-${Date.now()}.${extension || 'jpg'}`;
};

export const createUuid = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const randomValue = Math.floor(Math.random() * 16);
    const value = character === 'x' ? randomValue : ((randomValue & 0x3) | 0x8);
    return value.toString(16);
  });
};
