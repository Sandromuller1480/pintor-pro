export const DEFAULT_WORKING_DAYS = ['1', '2', '3', '4', '5'];
export const DEFAULT_WORKING_HOURS_START = '08:00';
export const DEFAULT_WORKING_HOURS_END = '18:00';
export const DEFAULT_SERVICE_TIMEZONE = 'America/Cuiaba';

export const WEEK_DAY_OPTIONS = [
  { value: '1', shortLabel: 'Seg', fullLabel: 'Segunda' },
  { value: '2', shortLabel: 'Ter', fullLabel: 'Terca' },
  { value: '3', shortLabel: 'Qua', fullLabel: 'Quarta' },
  { value: '4', shortLabel: 'Qui', fullLabel: 'Quinta' },
  { value: '5', shortLabel: 'Sex', fullLabel: 'Sexta' },
  { value: '6', shortLabel: 'Sab', fullLabel: 'Sabado' },
  { value: '7', shortLabel: 'Dom', fullLabel: 'Domingo' }
] as const;

export const BRAZIL_TIMEZONE_OPTIONS = [
  { value: 'America/Rio_Branco', label: 'Acre (UTC-05)' },
  { value: 'America/Manaus', label: 'Amazonas (UTC-04)' },
  { value: 'America/Cuiaba', label: 'Mato Grosso (UTC-04)' },
  { value: 'America/Sao_Paulo', label: 'Brasilia / Sudeste (UTC-03)' }
] as const;

type PainterBusinessHoursSettings = {
  businessHoursEnabled?: boolean;
  workingDays?: string[];
  workingHoursStart?: string;
  workingHoursEnd?: string;
  serviceTimezone?: string;
};

const VALID_WORKING_DAY_VALUES = new Set<string>(WEEK_DAY_OPTIONS.map((option) => option.value));
const VALID_SERVICE_TIMEZONES = new Set<string>(BRAZIL_TIMEZONE_OPTIONS.map((option) => option.value));
const WEEKDAY_SHORT_LABELS = Object.fromEntries(
  WEEK_DAY_OPTIONS.map((option) => [option.value, option.shortLabel])
) as Record<string, string>;
const TIMEZONE_LABELS = Object.fromEntries(
  BRAZIL_TIMEZONE_OPTIONS.map((option) => [option.value, option.label])
) as Record<string, string>;
const WEEKDAY_TO_VALUE: Record<string, string> = {
  Mon: '1',
  Tue: '2',
  Wed: '3',
  Thu: '4',
  Fri: '5',
  Sat: '6',
  Sun: '7'
};

const TIME_VALUE_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const timeToMinutes = (value: string) => {
  const [hours, minutes] = value.split(':').map((part) => Number(part));
  return (hours * 60) + minutes;
};

export const normalizeWorkingDays = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [...DEFAULT_WORKING_DAYS];
  }

  const normalizedDays = Array.from(
    new Set(
      value
        .map((item) => String(item).trim())
        .filter((item) => VALID_WORKING_DAY_VALUES.has(item))
    )
  ).sort((first, second) => Number(first) - Number(second));

  return normalizedDays.length > 0 ? normalizedDays : [...DEFAULT_WORKING_DAYS];
};

export const sanitizeWorkingTime = (value: unknown, fallback: string) => {
  const normalizedValue = typeof value === 'string' ? value.trim() : '';
  return TIME_VALUE_PATTERN.test(normalizedValue) ? normalizedValue : fallback;
};

export const normalizeServiceTimezone = (value: unknown) => {
  const normalizedValue = typeof value === 'string' ? value.trim() : '';
  return VALID_SERVICE_TIMEZONES.has(normalizedValue) ? normalizedValue : DEFAULT_SERVICE_TIMEZONE;
};

export const isWorkingHoursRangeValid = (start: string, end: string) => (
  TIME_VALUE_PATTERN.test(start) && TIME_VALUE_PATTERN.test(end) && timeToMinutes(start) < timeToMinutes(end)
);

export const getTimezoneLabel = (timeZone: string) => TIMEZONE_LABELS[timeZone] ?? timeZone;

export const buildWorkingDaysSummary = (value: unknown) => {
  const workingDays = normalizeWorkingDays(value);

  if (workingDays.length === 7) {
    return 'Todos os dias';
  }

  if (workingDays.join(',') === DEFAULT_WORKING_DAYS.join(',')) {
    return 'Seg a Sex';
  }

  return workingDays.map((day) => WEEKDAY_SHORT_LABELS[day] ?? day).join(', ');
};

export const buildBusinessHoursSummary = ({
  businessHoursEnabled,
  workingDays,
  workingHoursStart,
  workingHoursEnd,
  serviceTimezone
}: PainterBusinessHoursSettings) => {
  if (!businessHoursEnabled) {
    return 'Sem restricao por horario';
  }

  const normalizedWorkingDays = normalizeWorkingDays(workingDays);
  const normalizedStart = sanitizeWorkingTime(workingHoursStart, DEFAULT_WORKING_HOURS_START);
  const normalizedEnd = sanitizeWorkingTime(workingHoursEnd, DEFAULT_WORKING_HOURS_END);
  const normalizedTimezone = normalizeServiceTimezone(serviceTimezone);

  return `${buildWorkingDaysSummary(normalizedWorkingDays)}, ${normalizedStart} as ${normalizedEnd} (${getTimezoneLabel(normalizedTimezone)})`;
};

export const getBusinessHoursAvailability = (
  {
    businessHoursEnabled,
    workingDays,
    workingHoursStart,
    workingHoursEnd,
    serviceTimezone
  }: PainterBusinessHoursSettings,
  now = new Date()
) => {
  if (!businessHoursEnabled) {
    return {
      withinBusinessHours: true,
      reason: null as 'outside_day' | 'outside_hours' | null,
      message: '',
      summary: buildBusinessHoursSummary({
        businessHoursEnabled,
        workingDays,
        workingHoursStart,
        workingHoursEnd,
        serviceTimezone
      })
    };
  }

  const normalizedWorkingDays = normalizeWorkingDays(workingDays);
  const normalizedStart = sanitizeWorkingTime(workingHoursStart, DEFAULT_WORKING_HOURS_START);
  const normalizedEnd = sanitizeWorkingTime(workingHoursEnd, DEFAULT_WORKING_HOURS_END);
  const normalizedTimezone = normalizeServiceTimezone(serviceTimezone);
  const summary = buildBusinessHoursSummary({
    businessHoursEnabled: true,
    workingDays: normalizedWorkingDays,
    workingHoursStart: normalizedStart,
    workingHoursEnd: normalizedEnd,
    serviceTimezone: normalizedTimezone
  });

  const currentDayLabel = new Intl.DateTimeFormat('en-US', {
    timeZone: normalizedTimezone,
    weekday: 'short'
  }).format(now);
  const currentDay = WEEKDAY_TO_VALUE[currentDayLabel] ?? DEFAULT_WORKING_DAYS[0];
  const currentTime = new Intl.DateTimeFormat('en-GB', {
    timeZone: normalizedTimezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(now);

  if (!normalizedWorkingDays.includes(currentDay)) {
    return {
      withinBusinessHours: false,
      reason: 'outside_day' as const,
      message: `Fora dos dias de atendimento. Expediente: ${summary}.`,
      summary
    };
  }

  if (
    !isWorkingHoursRangeValid(normalizedStart, normalizedEnd)
    || timeToMinutes(currentTime) < timeToMinutes(normalizedStart)
    || timeToMinutes(currentTime) > timeToMinutes(normalizedEnd)
  ) {
    return {
      withinBusinessHours: false,
      reason: 'outside_hours' as const,
      message: `Fora do horario de atendimento. Expediente: ${summary}.`,
      summary
    };
  }

  return {
    withinBusinessHours: true,
    reason: null as 'outside_day' | 'outside_hours' | null,
    message: '',
    summary
  };
};
