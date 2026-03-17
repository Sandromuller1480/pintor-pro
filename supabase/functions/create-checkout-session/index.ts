import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type CheckoutPlanCode = 'silver' | 'pro';

type CreateCheckoutSessionRequest = {
  planCode?: string;
  email?: string;
  fullName?: string;
  applicationId?: string;
  successPath?: string;
  cancelPath?: string;
};

type StripeCustomer = {
  id: string;
  email: string | null;
};

type StripeCustomerList = {
  data: StripeCustomer[];
};

type StripeCheckoutSession = {
  id: string;
  url: string | null;
  customer: string | null;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const PLAN_PRICE_ENV_MAP: Record<CheckoutPlanCode, string> = {
  silver: 'STRIPE_PRICE_SILVER_MONTHLY',
  pro: 'STRIPE_PRICE_PRO_MONTHLY'
};

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });
}

function isCheckoutPlanCode(value: string): value is CheckoutPlanCode {
  return value === 'silver' || value === 'pro';
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizePath(path: string | undefined, fallbackPath: string) {
  const trimmed = (path ?? '').trim();
  if (!trimmed) return fallbackPath;
  if (!trimmed.startsWith('/')) return fallbackPath;
  return trimmed;
}

function resolveBaseUrl(req: Request, fallback?: string) {
  const configured = (fallback ?? '').trim();
  if (configured) return configured.replace(/\/+$/, '');

  const origin = (req.headers.get('origin') ?? '').trim();
  if (origin) return origin.replace(/\/+$/, '');

  return 'http://localhost:5173';
}

async function stripeRequest<T>(params: {
  stripeSecretKey: string;
  method: 'GET' | 'POST';
  path: string;
  body?: URLSearchParams;
}): Promise<T> {
  const response = await fetch(`https://api.stripe.com/v1${params.path}`, {
    method: params.method,
    headers: {
      Authorization: `Bearer ${params.stripeSecretKey}`,
      ...(params.body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {})
    },
    body: params.body ? params.body.toString() : undefined
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Stripe API ${params.path} -> ${response.status}: ${errorText}`);
  }

  return (await response.json()) as T;
}

async function findOrCreateStripeCustomer(params: {
  stripeSecretKey: string;
  email: string;
  fullName?: string;
}): Promise<StripeCustomer> {
  const customerList = await stripeRequest<StripeCustomerList>({
    stripeSecretKey: params.stripeSecretKey,
    method: 'GET',
    path: `/customers?email=${encodeURIComponent(params.email)}&limit=1`
  });

  if (customerList.data.length > 0) {
    return customerList.data[0];
  }

  const body = new URLSearchParams();
  body.append('email', params.email);
  if (params.fullName) {
    body.append('name', params.fullName);
  }
  body.append('metadata[source]', 'pintor-pro');

  return stripeRequest<StripeCustomer>({
    stripeSecretKey: params.stripeSecretKey,
    method: 'POST',
    path: '/customers',
    body
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
  const appBaseUrl = Deno.env.get('APP_BASE_URL');

  if (!supabaseUrl || !supabaseServiceRoleKey || !stripeSecretKey) {
    return jsonResponse(500, {
      error: 'Missing environment variables',
      required: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'STRIPE_SECRET_KEY']
    });
  }

  let payload: CreateCheckoutSessionRequest;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON body' });
  }

  const planCode = (payload.planCode ?? '').trim().toLowerCase();
  const email = normalizeEmail(payload.email ?? '');
  const fullName = (payload.fullName ?? '').trim();
  const applicationId = (payload.applicationId ?? '').trim() || null;

  if (!planCode || !isCheckoutPlanCode(planCode)) {
    return jsonResponse(400, {
      error: 'planCode must be one of: silver, pro'
    });
  }

  if (!email || !isValidEmail(email)) {
    return jsonResponse(400, {
      error: 'A valid email is required'
    });
  }

  const priceEnvName = PLAN_PRICE_ENV_MAP[planCode];
  const priceId = Deno.env.get(priceEnvName);

  if (!priceId) {
    return jsonResponse(500, {
      error: `Missing ${priceEnvName} in function environment`
    });
  }

  const baseUrl = resolveBaseUrl(req, appBaseUrl);
  const successPath = normalizePath(payload.successPath, '/planos?checkout=success&session_id={CHECKOUT_SESSION_ID}');
  const cancelPath = normalizePath(payload.cancelPath, '/planos?checkout=canceled');
  const successUrl = `${baseUrl}${successPath}`;
  const cancelUrl = `${baseUrl}${cancelPath}`;

  try {
    const customer = await findOrCreateStripeCustomer({
      stripeSecretKey,
      email,
      fullName: fullName || undefined
    });

    const sessionBody = new URLSearchParams();
    sessionBody.append('mode', 'subscription');
    sessionBody.append('customer', customer.id);
    sessionBody.append('line_items[0][price]', priceId);
    sessionBody.append('line_items[0][quantity]', '1');
    sessionBody.append('success_url', successUrl);
    sessionBody.append('cancel_url', cancelUrl);
    sessionBody.append('allow_promotion_codes', 'true');
    sessionBody.append('billing_address_collection', 'required');
    sessionBody.append('locale', 'pt-BR');
    sessionBody.append('metadata[plan_code]', planCode);
    sessionBody.append('metadata[customer_email]', email);

    if (applicationId) {
      sessionBody.append('client_reference_id', applicationId);
      sessionBody.append('metadata[application_id]', applicationId);
    }

    const session = await stripeRequest<StripeCheckoutSession>({
      stripeSecretKey,
      method: 'POST',
      path: '/checkout/sessions',
      body: sessionBody
    });

    if (!session.url) {
      throw new Error('Stripe checkout session returned without URL');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false }
    });

    const { error: customerDbError } = await supabase.from('billing_customers').upsert(
      {
        email,
        full_name: fullName || null,
        stripe_customer_id: customer.id
      },
      { onConflict: 'email' }
    );

    if (customerDbError) {
      throw new Error(`Failed to persist billing customer: ${customerDbError.message}`);
    }

    const { error: checkoutDbError } = await supabase
      .from('billing_checkout_sessions')
      .upsert(
        {
          provider: 'stripe',
          provider_session_id: session.id,
          provider_customer_id: customer.id,
          customer_email: email,
          plan_code: planCode,
          status: 'created',
          checkout_url: session.url,
          application_id: applicationId,
          metadata: {
            source: 'create-checkout-session',
            request_origin: req.headers.get('origin')
          }
        },
        { onConflict: 'provider_session_id' }
      );

    if (checkoutDbError) {
      throw new Error(`Failed to persist checkout session: ${checkoutDbError.message}`);
    }

    return jsonResponse(200, {
      checkoutUrl: session.url,
      sessionId: session.id,
      customerId: customer.id
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return jsonResponse(500, {
      error: 'Failed to create checkout session',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
