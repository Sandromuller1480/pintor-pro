import { Painter } from '../../types';

export const formatPortfolioDate = (value: string) => {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(parsedDate);
};

export const getPlanLabel = (currentPainter: Painter) => {
  const subscriptionPlan = currentPainter.subscriptionPlan?.toLowerCase();
  const categoryLevel = currentPainter.categoryLevel?.toLowerCase();

  if (subscriptionPlan === 'pro') return 'PINTOR PRO';
  if (subscriptionPlan === 'silver') return 'Elite Silver';
  if (subscriptionPlan === 'bronze') return 'Bronze';
  if (categoryLevel === 'ouro') return 'Categoria Ouro';
  if (categoryLevel === 'prata') return 'Categoria Prata';
  if (categoryLevel === 'bronze') return 'Categoria Bronze';

  return 'Perfil ativo';
};

export const formatReviewAge = (value: string) => {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  const now = new Date();
  const diffMs = now.getTime() - parsedDate.getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ha 1 dia';
  if (diffDays < 30) return `Ha ${diffDays} dias`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return 'Ha 1 mes';
  if (diffMonths < 12) return `Ha ${diffMonths} meses`;

  const diffYears = Math.floor(diffMonths / 12);
  return diffYears === 1 ? 'Ha 1 ano' : `Ha ${diffYears} anos`;
};

export const getReviewInitials = (clientName: string) => {
  const parts = clientName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return 'CL';
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
};

export const buildAboutSummary = (currentPainter: Painter, publishedWorks: number) => {
  const summaryParts = [currentPainter.description || 'Perfil profissional ativo na PINTOR PRO.'];

  if (currentPainter.location) {
    summaryParts.push(`Atende principalmente em ${currentPainter.location}.`);
  }

  if (publishedWorks > 0) {
    summaryParts.push(`Ja publicou ${publishedWorks} obra(s) no portfolio publico.`);
  }

  return summaryParts.join(' ');
};

export const isUuid = (value: string) => (
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
);
