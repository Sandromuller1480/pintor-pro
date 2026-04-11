import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type DeletePainterAccountRequest = {
  applicationId?: string;
};

type PainterApplicationRow = {
  id: string;
  email: string | null;
  auth_user_id: string | null;
  work_photo_paths: string[] | null;
  certification_paths: string[] | null;
  profile_photo_path: string | null;
  foto_perfil: string | null;
  foto_capa: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
};

type StorageListItem = {
  name: string;
  id?: string | null;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

function toTextArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function chunkArray<T>(items: T[], chunkSize: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }

  return chunks;
}

async function stripeRequest(params: {
  stripeSecretKey: string;
  method: 'DELETE';
  path: string;
}) {
  const response = await fetch(`https://api.stripe.com/v1${params.path}`, {
    method: params.method,
    headers: {
      Authorization: `Bearer ${params.stripeSecretKey}`
    }
  });

  if (response.status === 404) {
    return;
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Stripe API ${params.path} -> ${response.status}: ${errorText}`);
  }
}

async function cancelStripeSubscriptionIfNeeded(params: {
  stripeSecretKey: string | null;
  applications: PainterApplicationRow[];
}) {
  const cancellableStatuses = new Set(['active', 'trialing', 'past_due', 'incomplete', 'unpaid']);
  const subscriptionIds = Array.from(new Set(
    params.applications
      .filter((application) => (
        Boolean(application.stripe_subscription_id)
        && cancellableStatuses.has((application.subscription_status ?? '').trim().toLowerCase())
      ))
      .map((application) => application.stripe_subscription_id as string)
  ));

  if (subscriptionIds.length === 0) {
    return;
  }

  if (!params.stripeSecretKey) {
    throw new Error('Não foi possível cancelar a assinatura ativa porque STRIPE_SECRET_KEY não está configurada.');
  }

  for (const subscriptionId of subscriptionIds) {
    await stripeRequest({
      stripeSecretKey: params.stripeSecretKey,
      method: 'DELETE',
      path: `/subscriptions/${subscriptionId}`
    });
  }
}

async function listBucketFilesRecursively(params: {
  supabase: ReturnType<typeof createClient>;
  bucket: string;
  prefix: string;
}) {
  const normalizedPrefix = params.prefix.replace(/^\/+|\/+$/g, '');

  if (!normalizedPrefix) {
    return [] as string[];
  }

  const files: string[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await params.supabase.storage
      .from(params.bucket)
      .list(normalizedPrefix, {
        limit: 100,
        offset,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      console.error(`Erro ao listar arquivos do bucket ${params.bucket} em ${normalizedPrefix}:`, error);
      return files;
    }

    if (!data?.length) {
      break;
    }

    for (const item of data as StorageListItem[]) {
      const fullPath = `${normalizedPrefix}/${item.name}`;

      if (item.id) {
        files.push(fullPath);
      } else {
        const nestedFiles = await listBucketFilesRecursively({
          supabase: params.supabase,
          bucket: params.bucket,
          prefix: fullPath
        });

        files.push(...nestedFiles);
      }
    }

    if (data.length < 100) {
      break;
    }

    offset += data.length;
  }

  return files;
}

async function removeStorageFiles(params: {
  supabase: ReturnType<typeof createClient>;
  bucket: string;
  paths: string[];
}) {
  const uniquePaths = Array.from(new Set(
    params.paths
      .map((path) => path.trim())
      .filter(Boolean)
  ));

  for (const pathsChunk of chunkArray(uniquePaths, 100)) {
    const { error } = await params.supabase.storage
      .from(params.bucket)
      .remove(pathsChunk);

    if (error) {
      console.error(`Erro ao remover arquivos do bucket ${params.bucket}:`, error);
    }
  }
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
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') ?? null;
  const authorizationHeader = req.headers.get('Authorization') ?? '';

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return jsonResponse(500, {
      error: 'Missing environment variables',
      required: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
    });
  }

  if (!authorizationHeader) {
    return jsonResponse(401, { error: 'Missing authorization header' });
  }

  const privilegedSupabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false }
  });

  const userSupabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
    global: {
      headers: {
        Authorization: authorizationHeader
      }
    }
  });

  const {
    data: { user },
    error: authError
  } = await userSupabase.auth.getUser();

  if (authError || !user) {
    return jsonResponse(401, {
      error: 'Unauthorized',
      details: authError?.message ?? 'User not found'
    });
  }

  let payload: DeletePainterAccountRequest = {};

  try {
    payload = await req.json();
  } catch {
    payload = {};
  }

  const requestedApplicationId = (payload.applicationId ?? '').trim();
  const normalizedEmail = normalizeEmail(user.email);

  let { data: applications, error: applicationsError } = await privilegedSupabase
    .from('applications')
    .select('id, email, auth_user_id, work_photo_paths, certification_paths, profile_photo_path, foto_perfil, foto_capa, stripe_subscription_id, subscription_status')
    .eq('auth_user_id', user.id);

  if ((!applications || applications.length === 0) && normalizedEmail) {
    const fallbackResult = await privilegedSupabase
      .from('applications')
      .select('id, email, auth_user_id, work_photo_paths, certification_paths, profile_photo_path, foto_perfil, foto_capa, stripe_subscription_id, subscription_status')
      .ilike('email', normalizedEmail);

    applications = fallbackResult.data ?? [];
    applicationsError = fallbackResult.error;
  }

  if (applicationsError) {
    return jsonResponse(500, {
      error: 'Failed to load painter application',
      details: applicationsError.message
    });
  }

  const painterApplications = ((applications ?? []) as PainterApplicationRow[]).filter((application) => {
    if (!requestedApplicationId) {
      return true;
    }

    return application.id === requestedApplicationId;
  });

  if (requestedApplicationId && painterApplications.length === 0) {
    return jsonResponse(403, { error: 'Application does not belong to authenticated painter' });
  }

  if (painterApplications.length === 0) {
    return jsonResponse(404, { error: 'Painter application not found for authenticated user' });
  }

  try {
    await cancelStripeSubscriptionIfNeeded({
      stripeSecretKey,
      applications: painterApplications
    });
  } catch (error) {
    console.error('Erro ao cancelar assinatura antes de excluir conta do pintor:', error);
    return jsonResponse(500, {
      error: 'Failed to cancel active subscription before deleting account',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  const applicationIds = painterApplications.map((application) => application.id);
  const onboardingWorkPaths = painterApplications.flatMap((application) => (
    toTextArray(application.work_photo_paths)
  ));
  const onboardingCertificationPaths = painterApplications.flatMap((application) => (
    toTextArray(application.certification_paths)
  ));
  const publicPainterMediaPaths = painterApplications.flatMap((application) => (
    [application.foto_perfil, application.foto_capa].filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
  ));

  const [portfolioMediaPaths, quoteMediaPaths, painterMediaByPrefix, onboardingWorkByPrefix, onboardingCertByPrefix] = await Promise.all([
    listBucketFilesRecursively({
      supabase: privilegedSupabase,
      bucket: 'portfolio-obras',
      prefix: `obras/${user.id}`
    }),
    listBucketFilesRecursively({
      supabase: privilegedSupabase,
      bucket: 'orcamentos-media',
      prefix: user.id
    }),
    Promise.all([
      listBucketFilesRecursively({
        supabase: privilegedSupabase,
        bucket: 'painters-media',
        prefix: `foto-perfil/${user.id}`
      }),
      listBucketFilesRecursively({
        supabase: privilegedSupabase,
        bucket: 'painters-media',
        prefix: `foto-capa/${user.id}`
      })
    ]).then((results) => results.flat()),
    Promise.all(applicationIds.map((applicationId) => (
      listBucketFilesRecursively({
        supabase: privilegedSupabase,
        bucket: 'application-work-photos',
        prefix: applicationId
      })
    ))).then((results) => results.flat()),
    Promise.all(applicationIds.map((applicationId) => (
      listBucketFilesRecursively({
        supabase: privilegedSupabase,
        bucket: 'application-certifications',
        prefix: applicationId
      })
    ))).then((results) => results.flat())
  ]);

  await Promise.all([
    removeStorageFiles({
      supabase: privilegedSupabase,
      bucket: 'application-work-photos',
      paths: [...onboardingWorkPaths, ...onboardingWorkByPrefix]
    }),
    removeStorageFiles({
      supabase: privilegedSupabase,
      bucket: 'application-certifications',
      paths: [...onboardingCertificationPaths, ...onboardingCertByPrefix]
    }),
    removeStorageFiles({
      supabase: privilegedSupabase,
      bucket: 'painters-media',
      paths: [...publicPainterMediaPaths, ...painterMediaByPrefix]
    }),
    removeStorageFiles({
      supabase: privilegedSupabase,
      bucket: 'portfolio-obras',
      paths: portfolioMediaPaths
    }),
    removeStorageFiles({
      supabase: privilegedSupabase,
      bucket: 'orcamentos-media',
      paths: quoteMediaPaths
    })
  ]);

  const { error: applicationsDeleteError } = await privilegedSupabase
    .from('applications')
    .delete()
    .in('id', applicationIds);

  if (applicationsDeleteError) {
    return jsonResponse(500, {
      error: 'Failed to delete painter application',
      details: applicationsDeleteError.message
    });
  }

  const { error: adminUsersDeleteError } = await privilegedSupabase
    .from('admin_users')
    .delete()
    .eq('auth_user_id', user.id);

  if (adminUsersDeleteError && !adminUsersDeleteError.message.toLowerCase().includes('admin_users')) {
    console.error('Erro ao remover vinculo admin do pintor excluido:', adminUsersDeleteError);
  }

  const { error: deleteUserError } = await privilegedSupabase.auth.admin.deleteUser(user.id);

  if (deleteUserError) {
    return jsonResponse(500, {
      error: 'Failed to delete auth user',
      details: deleteUserError.message
    });
  }

  return jsonResponse(200, {
    ok: true,
    deletedApplicationIds: applicationIds
  });
});

