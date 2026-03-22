import { supabase } from './supabase';

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

const isAnonymousSession = (user: unknown) => {
  if (!user || typeof user !== 'object') {
    return false;
  }

  const candidate = user as {
    is_anonymous?: boolean;
    app_metadata?: { provider?: string };
  };

  return candidate.is_anonymous === true || candidate.app_metadata?.provider === 'anonymous';
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

    if (isAnonymousSession(currentSessionResult.data.session?.user)) {
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
          user_type: 'client'
        }
      }
    });

    const authErrorMessage = authError?.message?.toLowerCase() ?? '';
    const isExistingUserError = EXISTING_USER_ERROR_PATTERNS.some((pattern) => authErrorMessage.includes(pattern));

    if (isExistingUserError) {
      throw new Error('Ja existe um cadastro com esse e-mail. Use outro e-mail ou entre com a conta existente.');
    }

    if (authError) {
      throw new Error(`Nao foi possivel criar o acesso do cliente: ${authError.message}`);
    }

    const authUserId = authData.user?.id;

    if (!authUserId) {
      throw new Error('Nao foi possivel identificar o usuario criado para este cadastro.');
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
        throw new Error('A tabela de clientes ainda nao foi criada no banco. Rode o SQL clientes_schema.sql no Supabase.');
      }

      throw new Error(`Nao foi possivel salvar os dados do cliente: ${insertError.message}`);
    }

    if (authData.session) {
      const signOutResult = await supabase.auth.signOut();

      if (signOutResult.error) {
        console.error('Erro ao encerrar sessao do cliente apos cadastro:', signOutResult.error);
      }
    }

    return {
      clientId,
      requiresEmailConfirmation: !authData.session
    };
  }
};
