import { supabase } from '../supabase';

const EXISTING_USER_ERROR_PATTERNS = [
  'already registered',
  'already been registered',
  'user already exists',
  'email rate limit exceeded'
] as const;

const createUuid = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const randomValue = Math.floor(Math.random() * 16);
    const value = character === 'x' ? randomValue : ((randomValue & 0x3) | 0x8);
    return value.toString(16);
  });
};

export type ClientSignupSubmission = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
};

export type ClientSignupResult = {
  clientId: string;
  requiresEmailConfirmation: boolean;
};

export type ClientLoginSubmission = {
  email: string;
  password: string;
};

export type CurrentClientProfile = {
  id: string;
  authUserId: string;
  fullName: string;
  email: string;
  phone: string;
};

export const isAnonymousSessionUser = (user: unknown) => {
  if (!user || typeof user !== 'object') {
    return false;
  }

  const candidate = user as {
    is_anonymous?: boolean;
    app_metadata?: { provider?: string };
  };

  return candidate.is_anonymous === true || candidate.app_metadata?.provider === 'anonymous';
};

const isMissingClientesTableError = (message: string) => (
  message.includes('relation') && message.includes('clientes')
) || (
  message.includes('clientes') && message.includes('does not exist')
);

export const getCurrentClientProfile = async (): Promise<CurrentClientProfile | null> => {
  const sessionResult = await supabase.auth.getSession();

  if (sessionResult.error) {
    throw sessionResult.error;
  }

  const currentUser = sessionResult.data.session?.user;

  if (!currentUser || isAnonymousSessionUser(currentUser)) {
    return null;
  }

  const { data, error } = await supabase
    .from('clientes')
    .select('id, auth_user_id, nome, email, celular')
    .eq('auth_user_id', currentUser.id)
    .maybeSingle();

  if (error) {
    const normalizedMessage = error.message.toLowerCase();

    if (isMissingClientesTableError(normalizedMessage)) {
      return null;
    }

    throw error;
  }

  if (data?.id && data?.auth_user_id && data?.nome && data?.email && data?.celular) {
    return {
      id: data.id,
      authUserId: data.auth_user_id,
      fullName: data.nome,
      email: data.email,
      phone: data.celular
    };
  }

  const metadataFullName =
    typeof currentUser.user_metadata?.full_name === 'string'
      ? currentUser.user_metadata.full_name.trim()
      : '';
  const metadataPhone =
    typeof currentUser.user_metadata?.phone === 'string'
      ? currentUser.user_metadata.phone.trim()
      : '';
  const metadataEmail = currentUser.email?.trim().toLowerCase() ?? '';

  if (metadataFullName && metadataEmail && metadataPhone) {
    return {
      id: '',
      authUserId: currentUser.id,
      fullName: metadataFullName,
      email: metadataEmail,
      phone: metadataPhone
    };
  }

  return null;
};

export const clientSignupService = {
  async registerClient(payload: ClientSignupSubmission): Promise<ClientSignupResult> {
    const normalizedFullName = payload.fullName.trim();
    const normalizedEmail = payload.email.trim().toLowerCase();
    const normalizedPhone = payload.phone.trim();

    const currentSessionResult = await supabase.auth.getSession();

    if (currentSessionResult.error) {
      throw currentSessionResult.error;
    }

    if (isAnonymousSessionUser(currentSessionResult.data.session?.user)) {
      const signOutResult = await supabase.auth.signOut();

      if (signOutResult.error) {
        throw signOutResult.error;
      }
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: payload.password,
      options: {
        data: {
          full_name: normalizedFullName,
          user_type: 'client',
          phone: normalizedPhone
        }
      }
    });

    const authErrorMessage = authError?.message?.toLowerCase() ?? '';
    const isExistingUserError = EXISTING_USER_ERROR_PATTERNS.some((pattern) => authErrorMessage.includes(pattern));

    if (isExistingUserError) {
      throw new Error('Ja existe um cadastro com esse e-mail. Use outro e-mail ou entre com a conta existente.');
    }

    if (authError) {
      throw new Error(`Não foi possível criar o acesso do cliente: ${authError.message}`);
    }

    const authUserId = authData.user?.id;

    if (!authUserId) {
      throw new Error('Não foi possível identificar o usuário criado para este cadastro.');
    }

    const clientId = createUuid();
    const { error: insertError } = await supabase.from('clientes').insert({
      id: clientId,
      auth_user_id: authUserId,
      nome: normalizedFullName,
      email: normalizedEmail,
      celular: normalizedPhone,
      status: 'active'
    });

    if (insertError) {
      const insertMessage = insertError.message.toLowerCase();

      if (insertMessage.includes('duplicate key') || insertMessage.includes('unique')) {
        throw new Error('Esse cliente ja esta cadastrado na plataforma.');
      }

      if (insertMessage.includes('relation') && insertMessage.includes('clientes')) {
        throw new Error('A tabela de clientes ainda não foi criada no banco. Rode o SQL clientes_schema.sql no Supabase.');
      }

      throw new Error(`Não foi possível salvar os dados do cliente: ${insertError.message}`);
    }

    if (authData.session) {
      const signOutResult = await supabase.auth.signOut();

      if (signOutResult.error) {
        console.error('Erro ao encerrar sessão do cliente após cadastro:', signOutResult.error);
      }
    }

    return {
      clientId,
      requiresEmailConfirmation: !authData.session
    };
  },

  async loginClient(payload: ClientLoginSubmission): Promise<CurrentClientProfile> {
    const normalizedEmail = payload.email.trim().toLowerCase();

    const currentSessionResult = await supabase.auth.getSession();

    if (currentSessionResult.error) {
      throw currentSessionResult.error;
    }

    if (isAnonymousSessionUser(currentSessionResult.data.session?.user)) {
      const signOutResult = await supabase.auth.signOut();

      if (signOutResult.error) {
        throw signOutResult.error;
      }
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: payload.password
    });

    if (signInError) {
      const normalizedMessage = signInError.message.toLowerCase();

      if (normalizedMessage.includes('email not confirmed')) {
        throw new Error('Seu e-mail ainda não foi confirmado. Abra a mensagem enviada pela plataforma e tente novamente.');
      }

      if (normalizedMessage.includes('invalid login credentials')) {
        throw new Error('E-mail ou senha inválidos.');
      }

      if (normalizedMessage.includes('too many requests')) {
        throw new Error('Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente.');
      }

      throw new Error(`Não foi possível fazer login agora: ${signInError.message}`);
    }

    const currentClientProfile = await getCurrentClientProfile();

    if (!currentClientProfile) {
      const signOutResult = await supabase.auth.signOut();

      if (signOutResult.error) {
        console.error('Erro ao encerrar sessão não-cliente após login:', signOutResult.error);
      }

      throw new Error('Esta conta não possui cadastro de cliente. Crie seu cadastro de cliente para continuar.');
    }

    return currentClientProfile;
  }
};

