import type { CurrentAdminProfile } from './adminAccess';
import { supabase } from './supabase';

export type AdminAuditLog = {
  id: string;
  admin_name: string;
  admin_email: string;
  action_type: string;
  target_table: string;
  target_id: string;
  target_label: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type AdminAuditChangeSet = Record<string, { from: unknown; to: unknown }>;

type CreateAdminAuditLogInput = {
  adminProfile: CurrentAdminProfile | null;
  actionType: string;
  targetTable: string;
  targetId: string;
  targetLabel?: string | null;
  previousRecord?: Record<string, unknown> | null;
  nextRecord?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
};

const normalizeComparableValue = (value: unknown) => {
  if (value === undefined) {
    return null;
  }

  return value;
};

const valuesAreEqual = (left: unknown, right: unknown) => (
  JSON.stringify(normalizeComparableValue(left)) === JSON.stringify(normalizeComparableValue(right))
);

export const buildAdminAuditChanges = (
  previousRecord: Record<string, unknown> | null | undefined,
  nextRecord: Record<string, unknown> | null | undefined
): AdminAuditChangeSet => {
  if (!nextRecord) {
    return {};
  }

  return Object.entries(nextRecord).reduce<AdminAuditChangeSet>((accumulator, [field, nextValue]) => {
    const previousValue = previousRecord?.[field];

    if (!valuesAreEqual(previousValue, nextValue)) {
      accumulator[field] = {
        from: normalizeComparableValue(previousValue),
        to: normalizeComparableValue(nextValue)
      };
    }

    return accumulator;
  }, {});
};

export const createAdminAuditLog = async ({
  adminProfile,
  actionType,
  targetTable,
  targetId,
  targetLabel,
  previousRecord,
  nextRecord,
  metadata
}: CreateAdminAuditLogInput) => {
  if (!adminProfile) {
    throw new Error('Perfil administrativo nao encontrado para registrar auditoria.');
  }

  const changes = buildAdminAuditChanges(previousRecord, nextRecord);

  const { error } = await supabase
    .from('admin_action_logs')
    .insert({
      admin_user_id: adminProfile.id,
      admin_auth_user_id: adminProfile.authUserId,
      admin_name: adminProfile.fullName,
      admin_email: adminProfile.email,
      action_type: actionType,
      target_table: targetTable,
      target_id: targetId,
      target_label: targetLabel ?? null,
      metadata: {
        ...(metadata ?? {}),
        changes
      }
    });

  if (error) {
    throw error;
  }
};

const AUDIT_ACTION_LABELS: Record<string, string> = {
  'application.approved': 'Aplicacao aprovada',
  'application.pending': 'Aplicacao devolvida para pendencia',
  'application.rejected': 'Aplicacao reprovada',
  'application.category_changed': 'Categoria operacional alterada',
  'application.leads_paused': 'Captacao de leads pausada',
  'application.leads_resumed': 'Captacao de leads reativada',
  'application.chat_disabled': 'Chat desativado',
  'application.chat_enabled': 'Chat reativado',
  'application.visits_disabled': 'Agendamentos bloqueados',
  'application.visits_enabled': 'Agendamentos reativados',
  'subscription.plan_changed': 'Plano alterado',
  'subscription.status_changed': 'Status da assinatura alterado',
  'portfolio.approved': 'Obra aprovada',
  'portfolio.blocked': 'Obra bloqueada',
  'portfolio.hidden': 'Obra ocultada da vitrine',
  'portfolio.shown': 'Obra exibida na vitrine',
  'portfolio.status_changed': 'Status de moderacao alterado'
};

export const getAdminAuditActionLabel = (actionType: string) => (
  AUDIT_ACTION_LABELS[actionType] ?? actionType
);

export const getAdminAuditChangesList = (metadata: unknown) => {
  if (!metadata || typeof metadata !== 'object' || !('changes' in metadata)) {
    return [] as Array<{ field: string; from: unknown; to: unknown }>;
  }

  const rawChanges = (metadata as { changes?: unknown }).changes;

  if (!rawChanges || typeof rawChanges !== 'object') {
    return [] as Array<{ field: string; from: unknown; to: unknown }>;
  }

  return Object.entries(rawChanges as Record<string, { from: unknown; to: unknown }>).map(([field, change]) => ({
    field,
    from: change?.from ?? null,
    to: change?.to ?? null
  }));
};

export const formatAdminAuditValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return 'vazio';
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : '[]';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
};
