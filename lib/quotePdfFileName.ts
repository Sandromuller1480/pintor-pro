const formatQuoteFileNameDate = (value: string | null | undefined) => {
  if (!value) {
    return '';
  }

  const normalizedValue = value.includes('T') ? value : `${value}T00:00:00`;
  const parsedDate = new Date(normalizedValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('pt-BR').format(parsedDate);
};

const sanitizeQuoteFileNamePart = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9-_ ]+/g, '')
  .trim()
  .replace(/\s+/g, '-')
  .toLowerCase();

export const buildQuotePdfFileName = (painterName: string, createdAt: string) => (
  `orcamento-${sanitizeQuoteFileNamePart(painterName || 'pintor')}-${formatQuoteFileNameDate(createdAt).replace(/\//g, '-')}.pdf`
);
