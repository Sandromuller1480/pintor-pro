export type DashboardTab = 'inicio' | 'portfolio' | 'orcamentos' | 'financeiro' | 'equipe' | 'agenda' | 'config' | 'simulador';

export type CurrentPainterProfile = {
  applicationId: string;
  fullName: string;
  email: string;
  street: string;
  neighborhood: string;
  addressNumber: string;
  city: string;
  uf: string;
  whatsapp: string;
  experienceTime: string;
  specialties: string[];
  profilePhotoPath: string | null;
  profilePhotoUrl: string | null;
  coverPhotoPath: string | null;
  coverPhotoUrl: string | null;
  applicationStatus: string | null;
  categoryLevel: string | null;
  subscriptionPlan: string | null;
  subscriptionStatus: string | null;
  allowChat: boolean;
  allowVisitRequests: boolean;
  pauseLeadIntake: boolean;
  businessHoursEnabled: boolean;
  workingDays: string[];
  workingHoursStart: string;
  workingHoursEnd: string;
  serviceTimezone: string;
  emailNotifications: boolean;
  dailySummaryEnabled: boolean;
  instagramUrl: string;
  facebookUrl: string;
};

export type PainterSettingsForm = {
  allowChat: boolean;
  allowVisitRequests: boolean;
  pauseLeadIntake: boolean;
  businessHoursEnabled: boolean;
  workingDays: string[];
  workingHoursStart: string;
  workingHoursEnd: string;
  serviceTimezone: string;
  emailNotifications: boolean;
  dailySummaryEnabled: boolean;
  instagramUrl: string;
  facebookUrl: string;
};

export type AnalyticsPeriodDays = 7 | 30 | 90;

export type ShareChannelBreakdown = {
  native: number;
  copyLink: number;
  facebook: number;
  instagram: number;
};

export type DashboardMetrics = {
  portfolioCount: number;
  quoteCount: number;
  pendingQuoteCount: number;
  totalProfileViewsCount: number;
  totalReviewsCount: number;
  averageRating: number;
  totalShareCount: number;
  totalShareChannels: ShareChannelBreakdown;
  totalContactsCount: number;
  totalChatContactsCount: number;
  totalVisitContactsCount: number;
  totalQuoteContactsCount: number;
  periodProfileViewsCount: number;
  periodShareCount: number;
  periodShareChannels: ShareChannelBreakdown;
  periodContactsCount: number;
  periodChatContactsCount: number;
  periodVisitContactsCount: number;
  periodQuoteContactsCount: number;
  previousPeriodProfileViewsCount: number;
  periodGrowthPercent: number;
};

export type PainterProfileViewMetrics = {
  totalViews: number;
  currentPeriodViews: number;
  previousPeriodViews: number;
  periodGrowthPercent: number;
};

export type PainterProfileEngagementMetrics = {
  totalReviewsCount: number;
  averageRating: number;
  totalShares: number;
  currentPeriodShares: number;
  totalShareChannels: ShareChannelBreakdown;
  currentPeriodShareChannels: ShareChannelBreakdown;
};

export type VisitRequestStatus =
  | 'pending'
  | 'confirmed'
  | 'rescheduled'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type UpdateVisitRequestInput = {
  preferredDate: string;
  preferredTime: string;
  location: string;
  status: VisitRequestStatus | string;
};

export type SavedVisitRequest = {
  id: string;
  client_name: string;
  client_phone: string;
  client_email: string;
  preferred_date: string;
  preferred_time: string;
  location: string;
  notes: string | null;
  status: VisitRequestStatus | string;
  created_at: string;
};

export type SavedChatThread = {
  id: string;
  client_name: string;
  client_phone: string;
  client_email: string;
  status: string;
  unread_for_painter: boolean;
  last_message_preview: string | null;
  last_message_at: string;
  created_at: string;
};

export type SavedChatMessage = {
  id: string;
  thread_id: string;
  sender_type: 'client' | 'painter';
  sender_name: string;
  message: string;
  created_at: string;
};

export type FeedbackMessage = {
  type: 'success' | 'error';
  message: string;
};

export type FinancialEntryType = 'entrada' | 'saida';

export type FinancialEntryStatus = 'pendente' | 'recebido' | 'pago' | 'cancelado';

export type SavedFinancialEntry = {
  id: string;
  painter_id: string;
  entry_type: FinancialEntryType | string;
  title: string;
  category: string | null;
  related_client_name: string | null;
  amount: number | null;
  entry_date: string;
  payment_method: string | null;
  status: FinancialEntryStatus | string;
  notes: string | null;
  created_at: string;
};

export type FinancialEntryForm = {
  entryType: FinancialEntryType;
  title: string;
  category: string;
  relatedClientName: string;
  amount: string;
  entryDate: string;
  paymentMethod: string;
  notes: string;
};

export type TeamMemberRole = 'pintor_profissional' | 'ajudante';

export type TeamMemberStatus = 'ativo' | 'inativo';

export type SavedTeamMember = {
  id: string;
  painter_id: string;
  full_name: string;
  role: TeamMemberRole | string;
  phone: string | null;
  daily_rate: number | null;
  has_nr35: boolean;
  nr35_expiration_date: string | null;
  status: TeamMemberStatus | string;
  specialties: string[] | null;
  notes: string | null;
  created_at: string;
};

export type TeamMemberForm = {
  fullName: string;
  role: TeamMemberRole;
  phone: string;
  dailyRate: string;
  hasNr35: boolean;
  nr35ExpirationDate: string;
  status: TeamMemberStatus;
  specialties: string;
  notes: string;
};
