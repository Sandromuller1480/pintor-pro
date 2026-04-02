import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type CurrentAdminProfile = {
  id: string;
  authUserId: string | null;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
};

const isMissingAdminUsersTableError = (message: string) => (
  message.includes('admin_users') && (
    message.includes('does not exist')
    || message.includes('relation')
    || message.includes('schema cache')
  )
);

export const getCurrentAdminProfile = async (user?: User | null): Promise<CurrentAdminProfile | null> => {
  let currentUser = user ?? null;

  if (!currentUser) {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      throw error;
    }

    currentUser = data.user ?? null;
  }

  if (!currentUser) {
    return null;
  }

  const normalizedEmail = currentUser.email?.trim().toLowerCase() ?? '';

  const { data, error } = await supabase
    .from('admin_users')
    .select('id, auth_user_id, full_name, email, role, is_active')
    .or(`auth_user_id.eq.${currentUser.id},email.ilike.${normalizedEmail}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    const normalizedMessage = error.message.toLowerCase();

    if (isMissingAdminUsersTableError(normalizedMessage)) {
      return null;
    }

    throw error;
  }

  if (!data || data.is_active === false) {
    return null;
  }

  return {
    id: data.id,
    authUserId: data.auth_user_id ?? null,
    fullName: data.full_name || normalizedEmail.split('@')[0] || 'Administrador',
    email: data.email || normalizedEmail,
    role: data.role || 'owner',
    isActive: data.is_active ?? true
  };
};
