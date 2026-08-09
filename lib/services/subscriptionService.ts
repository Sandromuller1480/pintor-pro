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
  }
};

