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

const hasPainterApplication = async (email: string) => {
  if (!email) {
    return false;
  }

  const { data, error } = await supabase
    .from('applications')
    .select('id')
    .ilike('email', email)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    throw error;
  }

  return (data?.length ?? 0) > 0;
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
  const painterAuthenticated = await hasPainterApplication(normalizedEmail);

  return {
    role: painterAuthenticated ? 'painter' : 'unknown',
    user,
    currentClientProfile: null
  };
};
