import { supabase } from '../supabase';

export type PaidPlanCode = 'monthly' | 'annual';

type CreateCheckoutSessionParams = {
  planCode: PaidPlanCode;
  email: string;
  fullName?: string;
  applicationId?: string;
};

type CreateCheckoutSessionResponse = {
  checkoutUrl: string;
  sessionId: string;
  customerId: string;
};

export type TrialSubscriptionUpdate = {
  subscriptionPlan: string | null;
  subscriptionStatus: string | null;
  subscriptionEndsAt: string | null;
};

type StartPainterTrialResponse = {
  subscription_plan: string | null;
  subscription_status: string | null;
  subscription_ends_at: string | null;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function buildCheckoutErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes('failed to send a request to the edge function')
    || normalizedMessage.includes('failed to fetch')
    || normalizedMessage.includes('fetch failed')
  ) {
    return 'A Edge Function create-checkout-session nao esta publicada ou nao esta acessivel no Supabase. Publique a funcao e confira os secrets do Stripe.';
  }

  if (normalizedMessage.includes('non-2xx status code')) {
    return 'A Edge Function respondeu com erro. Confira os logs da funcao create-checkout-session no Supabase.';
  }

  return `Nao foi possivel iniciar o checkout: ${message}`;
}

export const subscriptionService = {
  async createCheckoutSession(
    params: CreateCheckoutSessionParams
  ): Promise<CreateCheckoutSessionResponse> {
    const email = normalizeEmail(params.email);
    if (!isValidEmail(email)) {
      throw new Error('Informe um e-mail válido para continuar.');
    }

    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        planCode: params.planCode,
        email,
        fullName: params.fullName?.trim() || undefined,
        applicationId: params.applicationId?.trim() || undefined
      }
    });

    if (error) {
      throw new Error(buildCheckoutErrorMessage(error));
    }

    if (!data?.checkoutUrl || !data?.sessionId) {
      throw new Error('A função retornou uma resposta incompleta de checkout.');
    }

    return data as CreateCheckoutSessionResponse;
  },

  async startPainterTrial(applicationId: string): Promise<TrialSubscriptionUpdate> {
    const normalizedApplicationId = applicationId.trim();
    if (!normalizedApplicationId) {
      throw new Error('Nao encontramos os dados do seu cadastro para ativar o teste gratuito.');
    }

    const { data, error } = await supabase.rpc('start_painter_trial', {
      p_application_id: normalizedApplicationId
    });

    if (error) {
      throw new Error(error.message || 'Nao foi possivel ativar o teste gratuito agora.');
    }

    const payload = Array.isArray(data) ? data[0] : data;
    if (!payload) {
      throw new Error('O Supabase nao retornou os dados do teste gratuito.');
    }

    const trialUpdate = payload as StartPainterTrialResponse;

    return {
      subscriptionPlan: trialUpdate.subscription_plan,
      subscriptionStatus: trialUpdate.subscription_status,
      subscriptionEndsAt: trialUpdate.subscription_ends_at
    };
  }
};

