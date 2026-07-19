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

export const subscriptionService = {
  async createCheckoutSession(
    params: CreateCheckoutSessionParams
  ): Promise<CreateCheckoutSessionResponse> {
    const email = normalizeEmail(params.email);
    if (!isValidEmail(email)) {
      throw new Error('Informe um e-mail valido para continuar.');
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
      throw new Error(`Não foi possível iniciar o checkout: ${error.message}`);
    }

    if (!data?.checkoutUrl || !data?.sessionId) {
      throw new Error('A função retornou uma resposta incompleta de checkout.');
    }

    return data as CreateCheckoutSessionResponse;
  }
};

