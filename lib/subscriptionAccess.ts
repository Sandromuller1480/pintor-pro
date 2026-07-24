import { PINTOR_PRO_LEGAL_CONFIG } from './legalConfig';

export type SubscriptionAccessState = 'active' | 'grace_period' | 'blocked';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const parseDateTime = (value?: string | null) => {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

export const getSubscriptionAccessState = (
  status?: string | null,
  subscriptionEndsAt?: string | null,
  now = new Date()
): SubscriptionAccessState => {
  const normalizedStatus = (status || '').toLowerCase();

  if (normalizedStatus === 'active' || normalizedStatus === 'trialing') {
    return 'active';
  }

  const endsAtMs = parseDateTime(subscriptionEndsAt);
  const graceEndsAtMs = endsAtMs === null
    ? null
    : endsAtMs + PINTOR_PRO_LEGAL_CONFIG.subscriptionGracePeriodDays * DAY_IN_MS;

  if (normalizedStatus === 'past_due' && (graceEndsAtMs === null || now.getTime() <= graceEndsAtMs)) {
    return 'grace_period';
  }

  if (endsAtMs !== null && now.getTime() <= graceEndsAtMs!) {
    return 'grace_period';
  }

  return 'blocked';
};

export const isSubscriptionAccessBlocked = (status?: string | null, subscriptionEndsAt?: string | null) => (
  getSubscriptionAccessState(status, subscriptionEndsAt) === 'blocked'
);

export const formatSubscriptionGraceEndDate = (subscriptionEndsAt?: string | null) => {
  const endsAtMs = parseDateTime(subscriptionEndsAt);
  if (endsAtMs === null) return '';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(endsAtMs + PINTOR_PRO_LEGAL_CONFIG.subscriptionGracePeriodDays * DAY_IN_MS));
};
