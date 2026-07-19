import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type StripeEvent = {
  id: string;
  type: string;
  livemode: boolean;
  data: {
    object: Record<string, unknown>;
  };
};

type StripeSubscription = {
  id: string;
  customer: string | { id: string; email?: string | null };
  status: string;
  cancel_at_period_end: boolean;
  current_period_start: number | null;
  current_period_end: number | null;
  canceled_at: number | null;
  metadata?: Record<string, string>;
  items?: {
    data?: Array<{
      price?: {
        id?: string | null;
      } | null;
    }>;
  };
};

type StripeCheckoutSession = {
  id: string;
  customer?: string | null;
  subscription?: string | null;
  customer_email?: string | null;
  customer_details?: {
    email?: string | null;
  } | null;
  metadata?: Record<string, string>;
};

type StripeCustomer = {
  id: string;
  email: string | null;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
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

function normalizeEmail(value: string | null | undefined) {
  return (value ?? '').trim().toLowerCase();
}

function unixToIso(unix: number | null | undefined) {
  if (!unix) return null;
  return new Date(unix * 1000).toISOString();
}

function getStringRecordValue(obj: Record<string, unknown>, key: string) {
  const value = obj[key];
  return typeof value === 'string' ? value : null;
}

function getPlanCodeFromPriceId(priceId: string | null, envMap: Record<string, string>) {
  if (!priceId) return null;

  const entries = Object.entries(envMap);
  for (const [planCode, envPriceId] of entries) {
    if (envPriceId && envPriceId === priceId) return planCode;
  }

  return null;
}

function isSupportedPlanCode(value: string | null | undefined) {
  return value === 'monthly' || value === 'annual';
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function hmacSha256Hex(secret: string, payload: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function parseStripeSignatureHeader(header: string) {
  const values = header.split(',').map((part) => part.trim());
  let timestamp: string | null = null;
  const signatures: string[] = [];

  for (const value of values) {
    const [key, ...rest] = value.split('=');
    const joined = rest.join('=');
    if (key === 't') timestamp = joined;
    if (key === 'v1') signatures.push(joined);
  }

  return { timestamp, signatures };
}

async function verifyStripeSignature(params: {
  rawBody: string;
  stripeSignatureHeader: string;
  webhookSecret: string;
  toleranceSeconds?: number;
}) {
  const toleranceSeconds = params.toleranceSeconds ?? 300;
  const { timestamp, signatures } = parseStripeSignatureHeader(params.stripeSignatureHeader);

  if (!timestamp || signatures.length === 0) return false;

  const now = Math.floor(Date.now() / 1000);
  const ts = Number(timestamp);
  if (Number.isNaN(ts)) return false;
  if (Math.abs(now - ts) > toleranceSeconds) return false;

  const signedPayload = `${timestamp}.${params.rawBody}`;
  const expected = await hmacSha256Hex(params.webhookSecret, signedPayload);

  return signatures.some((signature) => timingSafeEqual(signature, expected));
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

async function fetchStripeSubscription(params: {
  stripeSecretKey: string;
  subscriptionId: string;
}) {
  return stripeRequest<StripeSubscription>({
    stripeSecretKey: params.stripeSecretKey,
    method: 'GET',
    path: `/subscriptions/${params.subscriptionId}?expand[]=customer`
  });
}

async function fetchStripeCustomer(params: {
  stripeSecretKey: string;
  customerId: string;
}) {
  return stripeRequest<StripeCustomer>({
    stripeSecretKey: params.stripeSecretKey,
    method: 'GET',
    path: `/customers/${params.customerId}`
  });
}

async function resolveCustomerEmail(params: {
  supabase: ReturnType<typeof createClient>;
  stripeSecretKey: string;
  customerId: string;
  fallbackEmail?: string | null;
}) {
  const fallbackEmail = normalizeEmail(params.fallbackEmail);
  if (fallbackEmail) return fallbackEmail;

  const { data: dbCustomer } = await params.supabase
    .from('billing_customers')
    .select('email')
    .eq('stripe_customer_id', params.customerId)
    .maybeSingle();

  const dbEmail = normalizeEmail(dbCustomer?.email);
  if (dbEmail) return dbEmail;

  const { data: checkoutSession } = await params.supabase
    .from('billing_checkout_sessions')
    .select('customer_email')
    .eq('provider_customer_id', params.customerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const checkoutEmail = normalizeEmail(checkoutSession?.customer_email);
  if (checkoutEmail) return checkoutEmail;

  const stripeCustomer = await fetchStripeCustomer({
    stripeSecretKey: params.stripeSecretKey,
    customerId: params.customerId
  });

  const stripeEmail = normalizeEmail(stripeCustomer.email);
  return stripeEmail || null;
}

async function syncSubscriptionFromStripe(params: {
  supabase: ReturnType<typeof createClient>;
  stripeSecretKey: string;
  subscriptionId: string;
  planPriceMap: Record<string, string>;
  fallbackEmail?: string | null;
  checkoutSessionId?: string | null;
}) {
  const subscription = await fetchStripeSubscription({
    stripeSecretKey: params.stripeSecretKey,
    subscriptionId: params.subscriptionId
  });

  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer?.id ?? null;

  if (!customerId) {
    throw new Error(`Subscription ${subscription.id} does not include customer id`);
  }

  const customerEmail =
    typeof subscription.customer === 'object'
      ? normalizeEmail(subscription.customer.email)
      : normalizeEmail(params.fallbackEmail);

  const email = await resolveCustomerEmail({
    supabase: params.supabase,
    stripeSecretKey: params.stripeSecretKey,
    customerId,
    fallbackEmail: customerEmail || params.fallbackEmail
  });

  if (!email) {
    throw new Error(`Could not resolve customer email for Stripe customer ${customerId}`);
  }

  const firstPriceId = subscription.items?.data?.[0]?.price?.id ?? null;
  const metadataPlanCode = normalizeEmail(subscription.metadata?.plan_code).replace(/[^a-z]/g, '');
  const mappedPlanCode = getPlanCodeFromPriceId(firstPriceId, params.planPriceMap);
  const planCode = mappedPlanCode || (isSupportedPlanCode(metadataPlanCode) ? metadataPlanCode : 'monthly');

  const { error: customerError } = await params.supabase.from('billing_customers').upsert(
    {
      email,
      stripe_customer_id: customerId
    },
    { onConflict: 'email' }
  );

  if (customerError) {
    throw new Error(`Failed to upsert billing customer: ${customerError.message}`);
  }

  const { error: subscriptionError } = await params.supabase
    .from('billing_subscriptions')
    .upsert(
      {
        provider: 'stripe',
        provider_subscription_id: subscription.id,
        provider_customer_id: customerId,
        customer_email: email,
        plan_code: planCode,
        status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end,
        current_period_start: unixToIso(subscription.current_period_start),
        current_period_end: unixToIso(subscription.current_period_end),
        canceled_at: unixToIso(subscription.canceled_at),
        metadata: {
          checkout_session_id: params.checkoutSessionId ?? null,
          price_id: firstPriceId
        }
      },
      { onConflict: 'provider_subscription_id' }
    );

  if (subscriptionError) {
    throw new Error(`Failed to upsert subscription: ${subscriptionError.message}`);
  }

  const { error: appUpdateError } = await params.supabase
    .from('applications')
    .update({
      subscription_plan: planCode,
      subscription_status: subscription.status,
      subscription_started_at: unixToIso(subscription.current_period_start),
      subscription_ends_at: unixToIso(subscription.current_period_end),
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id
    })
    .eq('email', email);

  if (appUpdateError) {
    throw new Error(`Failed to sync applications subscription fields: ${appUpdateError.message}`);
  }
}

async function handleCheckoutCompleted(params: {
  supabase: ReturnType<typeof createClient>;
  stripeSecretKey: string;
  planPriceMap: Record<string, string>;
  eventObject: Record<string, unknown>;
}) {
  const session = params.eventObject as unknown as StripeCheckoutSession;
  const sessionId = session.id;
  const customerId = session.customer ?? null;
  const subscriptionId = session.subscription ?? null;
  const email =
    normalizeEmail(session.customer_email) ||
    normalizeEmail(session.customer_details?.email) ||
    normalizeEmail(session.metadata?.customer_email) ||
    null;
  const planCode = normalizeEmail(session.metadata?.plan_code) || null;

  const updatePayload: Record<string, unknown> = {
    status: 'completed',
    provider_customer_id: customerId,
    plan_code: isSupportedPlanCode(planCode) ? planCode : 'monthly'
  };

  if (email) {
    updatePayload.customer_email = email;
  }

  await params.supabase
    .from('billing_checkout_sessions')
    .update(updatePayload)
    .eq('provider_session_id', sessionId);

  if (subscriptionId) {
    await syncSubscriptionFromStripe({
      supabase: params.supabase,
      stripeSecretKey: params.stripeSecretKey,
      subscriptionId,
      planPriceMap: params.planPriceMap,
      fallbackEmail: email,
      checkoutSessionId: sessionId
    });
  }
}

async function handleSubscriptionEvent(params: {
  supabase: ReturnType<typeof createClient>;
  stripeSecretKey: string;
  planPriceMap: Record<string, string>;
  eventObject: Record<string, unknown>;
}) {
  const subscription = params.eventObject as unknown as StripeSubscription;
  await syncSubscriptionFromStripe({
    supabase: params.supabase,
    stripeSecretKey: params.stripeSecretKey,
    subscriptionId: subscription.id,
    planPriceMap: params.planPriceMap
  });
}

async function handleInvoiceEvent(params: {
  supabase: ReturnType<typeof createClient>;
  stripeSecretKey: string;
  planPriceMap: Record<string, string>;
  eventObject: Record<string, unknown>;
}) {
  const subscriptionId = getStringRecordValue(params.eventObject, 'subscription');
  if (!subscriptionId) return;

  await syncSubscriptionFromStripe({
    supabase: params.supabase,
    stripeSecretKey: params.stripeSecretKey,
    subscriptionId,
    planPriceMap: params.planPriceMap,
    fallbackEmail: getStringRecordValue(params.eventObject, 'customer_email')
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
  const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!stripeSecretKey || !stripeWebhookSecret || !supabaseUrl || !supabaseServiceRoleKey) {
    return jsonResponse(500, {
      error: 'Missing environment variables',
      required: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
    });
  }

  const stripeSignatureHeader = req.headers.get('stripe-signature');
  if (!stripeSignatureHeader) {
    return jsonResponse(400, { error: 'Missing stripe-signature header' });
  }

  const rawBody = await req.text();
  const signatureIsValid = await verifyStripeSignature({
    rawBody,
    stripeSignatureHeader,
    webhookSecret: stripeWebhookSecret
  });

  if (!signatureIsValid) {
    return jsonResponse(400, { error: 'Invalid Stripe signature' });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(rawBody) as StripeEvent;
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON payload' });
  }

  const planPriceMap = {
    monthly: Deno.env.get('STRIPE_PRICE_MONTHLY') ?? '',
    annual: Deno.env.get('STRIPE_PRICE_ANNUAL') ?? ''
  };

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false }
  });

  const { error: insertEventError } = await supabase.from('billing_webhook_events').insert({
    provider: 'stripe',
    provider_event_id: event.id,
    event_type: event.type,
    livemode: event.livemode,
    payload: event
  });

  if (insertEventError?.code === '23505') {
    return jsonResponse(200, { ok: true, duplicate: true });
  }

  if (insertEventError) {
    console.error('Failed to persist webhook event:', insertEventError);
    return jsonResponse(500, {
      error: 'Failed to persist webhook event',
      details: insertEventError.message
    });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      await handleCheckoutCompleted({
        supabase,
        stripeSecretKey,
        planPriceMap,
        eventObject: event.data.object
      });
    } else if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      await handleSubscriptionEvent({
        supabase,
        stripeSecretKey,
        planPriceMap,
        eventObject: event.data.object
      });
    } else if (event.type === 'invoice.paid' || event.type === 'invoice.payment_failed') {
      await handleInvoiceEvent({
        supabase,
        stripeSecretKey,
        planPriceMap,
        eventObject: event.data.object
      });
    }
  } catch (processingError) {
    const errorMessage = processingError instanceof Error ? processingError.message : 'Unknown processing error';

    await supabase
      .from('billing_webhook_events')
      .update({
        processing_error: errorMessage
      })
      .eq('provider_event_id', event.id);

    console.error('Webhook processing error:', processingError);
    return jsonResponse(500, {
      error: 'Webhook processing failed',
      details: errorMessage
    });
  }

  return jsonResponse(200, { ok: true });
});
