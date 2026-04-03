export type DashboardTab = 'inicio' | 'portfolio' | 'orcamentos' | 'agenda' | 'config';

export type CurrentPainterProfile = {
  applicationId: string;
  fullName: string;
  email: string;
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
