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
};

export type DashboardMetrics = {
  portfolioCount: number;
  quoteCount: number;
  pendingQuoteCount: number;
  profileViewsCount: number;
  contactsCount: number;
  currentWeekProfileViews: number;
  previousWeekProfileViews: number;
  weeklyGrowthPercent: number;
};

export type PainterProfileViewMetrics = {
  totalViews: number;
  currentWeekViews: number;
  previousWeekViews: number;
  weeklyGrowthPercent: number;
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
  status: string;
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
