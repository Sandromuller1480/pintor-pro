import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type ProcessApplicationRequest = {
  applicationId: string;
  applicant?: {
    fullName?: string;
    email?: string;
    city?: string;
    experienceTime?: string;
  };
  uploadedFiles?: {
    workPhotoCount?: number;
    certificationCount?: number;
  };
  specialties?: string[];
  specialtiesCount?: number;
};

type CategoryLevel = 'ouro' | 'prata' | 'bronze';

type AnalysisResult = {
  isAccepted: boolean;
  status: 'accepted' | 'rejected';
  category: CategoryLevel | null;
  notes: string;
  reasons: string[];
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

const BRONZE_REQUIRED_SPECIALTIES = [
  'Preparo do reboco (Limpeza, Lixa, Selador/Fundo Preparador)',
  'Preparo do Acartonado (Lixa e Fundo Preparador)',
  'Massa Corrida (Aplicação e lixamento)',
  'Massa Acrílica (Aplicação e lixamento)'
];

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function hasSpecialty(specialties: string[], expected: string) {
  const normalizedExpected = normalizeText(expected);
  return specialties.some((item) => normalizeText(item) === normalizedExpected);
}

function buildAnalysis(input: ProcessApplicationRequest): AnalysisResult {
  const city = (input.applicant?.city ?? '').trim();
  const specialties = input.specialties ?? [];
  const specialtiesCount = specialties.length || (input.specialtiesCount ?? 0);
  const workPhotoCount = input.uploadedFiles?.workPhotoCount ?? 0;
  const certificationCount = input.uploadedFiles?.certificationCount ?? 0;
  const experienceTime = (input.applicant?.experienceTime ?? '').trim();

  const reasons: string[] = [];
  const hasEpis = hasSpecialty(specialties, 'EPIs');
  const hasNr35 = specialties.some((item) => normalizeText(item).includes('nr-35'));
  const hasAllBronzeSpecialties = BRONZE_REQUIRED_SPECIALTIES.every((required) =>
    hasSpecialty(specialties, required)
  );
  const hasTechnicalCertification = certificationCount > 0;

  if (city.length < 3) reasons.push('cidade inválida ou ausente');
  if (specialtiesCount < 1) reasons.push('especialidades não informadas');
  if (workPhotoCount < 5) reasons.push('portfólio insuficiente (mínimo: 5 fotos para categoria Bronze)');
  if (experienceTime.length < 2) reasons.push('tempo de experiência insuficiente');

  // Regras de categoria (avaliadas da mais alta para a mais baixa)
  const qualifiesOuro =
    reasons.length === 0 &&
    hasTechnicalCertification &&
    hasEpis &&
    hasNr35 &&
    workPhotoCount >= 10;

  const qualifiesPrata =
    reasons.length === 0 &&
    hasTechnicalCertification &&
    hasEpis &&
    workPhotoCount > 10;

  const qualifiesBronze =
    reasons.length === 0 &&
    workPhotoCount >= 5 &&
    hasAllBronzeSpecialties;

  let category: CategoryLevel | null = null;
  if (qualifiesOuro) category = 'ouro';
  else if (qualifiesPrata) category = 'prata';
  else if (qualifiesBronze) category = 'bronze';

  if (!category) {
    if (!hasAllBronzeSpecialties) reasons.push('faltam especialidades mínimas da categoria Bronze');
    if (workPhotoCount < 10) reasons.push('menos de 10 fotos para categoria Ouro');
    if (workPhotoCount <= 10) reasons.push('não atende requisito de mais de 10 fotos para categoria Prata');
    if (!hasTechnicalCertification) reasons.push('certificados técnicos de pintura não enviados (necessário para Ouro/Prata)');
    if (!hasEpis) reasons.push('especialidade EPIs não informada (necessário para Ouro/Prata)');
    if (!hasNr35) reasons.push('NR-35 não informado (necessário para Ouro)');
  }

  const isAccepted = category !== null;
  const status = isAccepted ? 'accepted' : 'rejected';
  const notes = isAccepted
    ? `Aprovado via filtro técnico automático na categoria ${category.toUpperCase()}.`
    : `Recusado via filtro técnico automático: ${Array.from(new Set(reasons)).join('; ')}.`;

  return { isAccepted, status, category, notes, reasons: Array.from(new Set(reasons)) };
}

function buildEmailHtml(name: string, isAccepted: boolean, category: CategoryLevel | null) {
  const categoryLabel = category ? category.toUpperCase() : null;
  const acceptedBlock = isAccepted
    ? `
      <div style="background:#f8fafc;padding:24px;border-radius:16px;border-left:4px solid #9A077B;margin-bottom:24px;">
        <p style="margin:0;font-weight:800;color:#1e293b;font-size:14px;text-transform:uppercase;letter-spacing:1px;">Categoria aprovada</p>
        <p style="margin:8px 0 0 0;color:#1e293b;font-weight:800;">${categoryLabel ?? 'NÃO DEFINIDA'}</p>
      </div>
      <div style="background:#f8fafc;padding:24px;border-radius:16px;border:1px solid #e2e8f0;margin-bottom:24px;">
        <p style="margin:0;font-weight:800;color:#1e293b;font-size:14px;text-transform:uppercase;letter-spacing:1px;">Próximo passo</p>
        <p style="margin:8px 0 0 0;color:#64748b;">Em breve você poderá configurar seu portfólio e começar a receber pedidos de obras de alto padrão.</p>
      </div>
    `
    : '';

  const mainCopy = isAccepted
    ? `Sua solicitação de credenciamento foi <strong>APROVADA</strong>${categoryLabel ? ` na categoria <strong>${categoryLabel}</strong>` : ''}. Você agora faz parte da seleção de profissionais da PINTOR PRO.`
    : 'Após nossa análise técnica automática, seu perfil não foi selecionado para o credenciamento neste momento.';

  return `
    <div style="font-family:sans-serif;padding:40px;color:#333;max-width:600px;margin:auto;border:1px solid #eee;border-radius:32px;background-color:#ffffff;box-shadow:0 10px 30px rgba(0,0,0,0.05);">
      <div style="text-align:center;margin-bottom:30px;">
        <h1 style="color:#000;font-size:24px;font-weight:900;letter-spacing:-1px;text-transform:uppercase;">PINTOR <span style="color:#9A077B;">PRO</span></h1>
      </div>
      <h2 style="color:#1e293b;font-size:20px;font-weight:800;margin-bottom:20px;">Olá, ${name}!</h2>
      <p style="font-size:16px;line-height:1.6;color:#475569;margin-bottom:24px;">${mainCopy}</p>
      ${acceptedBlock}
      <div style="border-top:1px solid #f1f5f9;padding-top:24px;margin-top:40px;">
        <p style="font-size:12px;color:#94a3b8;text-align:center;">
          Este é um e-mail automático enviado pelo sistema de curadoria PINTOR PRO.
        </p>
      </div>
    </div>
  `;
}

async function sendNotificationEmail(params: {
  apiKey: string;
  to: string;
  name: string;
  isAccepted: boolean;
  category: CategoryLevel | null;
  from: string;
}) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.apiKey}`
    },
    body: JSON.stringify({
      from: params.from,
      to: params.to,
      subject: params.isAccepted
        ? `Parabéns! Você foi aprovado${params.category ? ` (${params.category.toUpperCase()})` : ''} na PINTOR PRO`
        : 'Atualização sobre seu cadastro na PINTOR PRO',
      html: buildEmailHtml(params.name, params.isAccepted, params.category)
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend error ${response.status}: ${errorText}`);
  }

  return response.json();
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
  const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? Deno.env.get('VITE_RESEND_API_KEY');
  const resendFromEmail =
    Deno.env.get('RESEND_FROM_EMAIL') ??
    Deno.env.get('VITE_RESEND_FROM_EMAIL') ??
    'Pintor PRO <onboarding@resend.dev>';

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return jsonResponse(500, { error: 'Missing Supabase server environment variables' });
  }

  let payload: ProcessApplicationRequest;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON body' });
  }

  if (!payload?.applicationId) {
    return jsonResponse(400, { error: 'applicationId is required' });
  }

  const applicantName = (payload.applicant?.fullName ?? '').trim();
  const applicantEmail = (payload.applicant?.email ?? '').trim();

  if (!applicantEmail) {
    return jsonResponse(400, { error: 'applicant.email is required' });
  }

  const analysis = buildAnalysis(payload);

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false }
  });

  const updatePayload = {
    status: analysis.status,
    analysis_notes: analysis.notes,
    category_level: analysis.category
  };

  let { error: updateError } = await supabase
    .from('applications')
    .update(updatePayload)
    .eq('id', payload.applicationId);

  // Fallback para projetos que ainda não aplicaram a migration da coluna category_level.
  if (updateError && updateError.message?.toLowerCase().includes('category_level')) {
    ({ error: updateError } = await supabase
      .from('applications')
      .update({
        status: analysis.status,
        analysis_notes: analysis.notes
      })
      .eq('id', payload.applicationId));
  }

  if (updateError) {
    console.error('Erro ao atualizar aplicação:', updateError);
    return jsonResponse(500, { error: 'Failed to update application', details: updateError.message });
  }

  let emailSent = false;
  let emailWarning: string | null = null;
  let emailProviderId: string | null = null;
  const emailAttemptedAt = new Date().toISOString();

  if (!resendApiKey) {
    emailWarning = 'RESEND_API_KEY or VITE_RESEND_API_KEY not configured';
    console.warn(emailWarning);
  } else {
    try {
      const emailResponse = await sendNotificationEmail({
        apiKey: resendApiKey,
        to: applicantEmail,
        name: applicantName || 'Profissional',
        isAccepted: analysis.isAccepted,
        category: analysis.category,
        from: resendFromEmail
      });
      emailProviderId =
        emailResponse && typeof emailResponse.id === 'string'
          ? emailResponse.id
          : null;
      emailSent = true;
    } catch (emailError) {
      emailWarning = emailError instanceof Error ? emailError.message : 'Unknown email error';
      console.error('Erro ao enviar email:', emailError);
    }
  }

  const notificationPayload = {
    notification_email_status: emailSent ? 'sent' : 'failed',
    notification_email_provider: 'resend',
    notification_email_provider_id: emailProviderId,
    notification_email_error: emailWarning,
    notification_email_sent_at: emailSent ? emailAttemptedAt : null,
    notification_email_last_attempt_at: emailAttemptedAt
  };

  const { error: notificationUpdateError } = await supabase
    .from('applications')
    .update(notificationPayload)
    .eq('id', payload.applicationId);

  if (notificationUpdateError) {
    const message = notificationUpdateError.message?.toLowerCase() ?? '';
    const isLegacySchema =
      message.includes('notification_email_status') ||
      message.includes('notification_email_provider') ||
      message.includes('notification_email_error') ||
      message.includes('notification_email_sent_at') ||
      message.includes('notification_email_last_attempt_at') ||
      message.includes('notification_email_provider_id');

    if (isLegacySchema) {
      console.warn('Colunas de rastreamento de e-mail ainda não existem em applications.');
    } else {
      console.error('Erro ao salvar status do e-mail na aplicação:', notificationUpdateError);
    }
  }

  return jsonResponse(200, {
    ok: true,
    applicationId: payload.applicationId,
    status: analysis.status,
    category: analysis.category,
    analysisNotes: analysis.notes,
    emailSent,
    emailWarning,
    emailProviderId
  });
});


