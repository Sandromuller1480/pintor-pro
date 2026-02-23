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
  specialtiesCount?: number;
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

function buildAnalysis(input: ProcessApplicationRequest) {
  const city = (input.applicant?.city ?? '').trim();
  const specialtiesCount = input.specialtiesCount ?? 0;
  const workPhotoCount = input.uploadedFiles?.workPhotoCount ?? 0;
  const certificationCount = input.uploadedFiles?.certificationCount ?? 0;
  const experienceTime = (input.applicant?.experienceTime ?? '').trim();

  const reasons: string[] = [];

  if (city.length < 3) reasons.push('cidade invÃ¡lida ou ausente');
  if (specialtiesCount < 1) reasons.push('especialidades nÃ£o informadas');
  if (workPhotoCount < 3) reasons.push('portfÃ³lio insuficiente (mÃ­nimo: 3 fotos)');
  if (certificationCount < 1) reasons.push('certificaÃ§Ã£o ausente');
  if (experienceTime.length < 2) reasons.push('tempo de experiÃªncia insuficiente');

  const isAccepted = reasons.length === 0;
  const status = isAccepted ? 'accepted' : 'rejected';
  const notes = isAccepted
    ? 'Aprovado via filtro tÃ©cnico automÃ¡tico: cadastro completo e evidÃªncias mÃ­nimas atendidas.'
    : `Recusado via filtro tÃ©cnico automÃ¡tico: ${reasons.join('; ')}.`;

  return { isAccepted, status, notes, reasons };
}

function buildEmailHtml(name: string, isAccepted: boolean) {
  const acceptedBlock = isAccepted
    ? `
      <div style="background:#f8fafc;padding:24px;border-radius:16px;border-left:4px solid #9A077B;margin-bottom:24px;">
        <p style="margin:0;font-weight:800;color:#1e293b;font-size:14px;text-transform:uppercase;letter-spacing:1px;">PrÃ³ximo passo</p>
        <p style="margin:8px 0 0 0;color:#64748b;">Em breve vocÃª poderÃ¡ configurar seu portfÃ³lio e comeÃ§ar a receber pedidos de obras de alto padrÃ£o.</p>
      </div>
    `
    : '';

  const mainCopy = isAccepted
    ? 'Sua solicitaÃ§Ã£o de credenciamento foi <strong>APROVADA</strong>. VocÃª agora faz parte da seleÃ§Ã£o de profissionais da PINTOR PRO.'
    : 'ApÃ³s nossa anÃ¡lise tÃ©cnica automÃ¡tica, seu perfil nÃ£o foi selecionado para o credenciamento neste momento.';

  return `
    <div style="font-family:sans-serif;padding:40px;color:#333;max-width:600px;margin:auto;border:1px solid #eee;border-radius:32px;background-color:#ffffff;box-shadow:0 10px 30px rgba(0,0,0,0.05);">
      <div style="text-align:center;margin-bottom:30px;">
        <h1 style="color:#000;font-size:24px;font-weight:900;letter-spacing:-1px;text-transform:uppercase;">PINTOR <span style="color:#9A077B;">PRO</span></h1>
      </div>
      <h2 style="color:#1e293b;font-size:20px;font-weight:800;margin-bottom:20px;">OlÃ¡, ${name}!</h2>
      <p style="font-size:16px;line-height:1.6;color:#475569;margin-bottom:24px;">${mainCopy}</p>
      ${acceptedBlock}
      <div style="border-top:1px solid #f1f5f9;padding-top:24px;margin-top:40px;">
        <p style="font-size:12px;color:#94a3b8;text-align:center;">
          Este Ã© um e-mail automÃ¡tico enviado pelo sistema de curadoria PINTOR PRO.
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
        ? 'ParabÃ©ns! VocÃª foi aprovado na PINTOR PRO'
        : 'AtualizaÃ§Ã£o sobre seu cadastro na PINTOR PRO',
      html: buildEmailHtml(params.name, params.isAccepted)
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
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const resendFromEmail = Deno.env.get('RESEND_FROM_EMAIL') ?? 'Pintor PRO <onboarding@resend.dev>';

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

  const { error: updateError } = await supabase
    .from('applications')
    .update({
      status: analysis.status,
      analysis_notes: analysis.notes
    })
    .eq('id', payload.applicationId);

  if (updateError) {
    console.error('Erro ao atualizar aplicacao:', updateError);
    return jsonResponse(500, { error: 'Failed to update application', details: updateError.message });
  }

  let emailSent = false;
  let emailWarning: string | null = null;

  if (!resendApiKey) {
    emailWarning = 'RESEND_API_KEY not configured';
    console.warn(emailWarning);
  } else {
    try {
      await sendNotificationEmail({
        apiKey: resendApiKey,
        to: applicantEmail,
        name: applicantName || 'Profissional',
        isAccepted: analysis.isAccepted,
        from: resendFromEmail
      });
      emailSent = true;
    } catch (emailError) {
      emailWarning = emailError instanceof Error ? emailError.message : 'Unknown email error';
      console.error('Erro ao enviar email:', emailError);
    }
  }

  return jsonResponse(200, {
    ok: true,
    applicationId: payload.applicationId,
    status: analysis.status,
    analysisNotes: analysis.notes,
    emailSent,
    emailWarning
  });
});

