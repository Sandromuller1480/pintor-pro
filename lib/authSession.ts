import type { User } from '@supabase/supabase-js';
import { getCurrentClientProfile, isAnonymousSessionUser, type CurrentClientProfile } from './services/clientSignupService';
import { supabase } from './supabase';

export type SessionRole = 'guest' | 'client' | 'painter' | 'unknown';

export type SessionRoleContext = {
  role: SessionRole;
  user: User | null;
  currentClientProfile: CurrentClientProfile | null;
};

const isClientMetadataUser = (user: User | null) => {
  if (!user) {
    return false;
  }

  return typeof user.user_metadata?.user_type === 'string'
    && user.user_metadata.user_type.trim().toLowerCase() === 'client';
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

export const getPainterApplicationId = async (email: string, userId?: string) => {
  if (!email && !userId) {
    return null;
  }

  const query = supabase
    .from('applications')
    .select('id, email, status, auth_user_id')
    .order('created_at', { ascending: false });

  const { data, error } = userId
    ? await query.or(`auth_user_id.eq.${userId},email.ilike.${email}`)
    : await query.ilike('email', email);

  if (error) {
    throw error;
  }

  const application = pickBestPainterApplication((data ?? []) as any[], email, userId);
  return application?.id ?? null;
};

const hasPainterApplication = async (email: string, userId?: string) => {
  if (!email && !userId) {
    return false;
  }

  const applicationId = await getPainterApplicationId(email, userId);
  return Boolean(applicationId);
};

export const getSessionRoleContext = async (): Promise<SessionRoleContext> => {
  const sessionResult = await supabase.auth.getSession();

  if (sessionResult.error) {
    throw sessionResult.error;
  }

  const user = sessionResult.data.session?.user ?? null;

  if (!user || isAnonymousSessionUser(user)) {
    return {
      role: 'guest',
      user: null,
      currentClientProfile: null
    };
  }

  const currentClientProfile = await getCurrentClientProfile();

  if (currentClientProfile || isClientMetadataUser(user)) {
    return {
      role: 'client',
      user,
      currentClientProfile
    };
  }

  const normalizedEmail = user.email?.trim().toLowerCase() ?? '';
  const painterAuthenticated = await hasPainterApplication(normalizedEmail, user.id);

  return {
    role: painterAuthenticated ? 'painter' : 'unknown',
    user,
    currentClientProfile: null
  };
};
