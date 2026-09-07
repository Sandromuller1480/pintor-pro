
import type { PortfolioStageMediaMap } from './lib/portfolioStages';

export interface Painter {
  id: string;
  applicationId?: string;
  name: string;
  gender?: 'feminino' | 'masculino';
  whatsapp?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  street?: string;
  neighborhood?: string;
  addressNumber?: string;
  location: string;
  rating: number;
  reviewsCount: number;
  description: string;
  verified: boolean;
  topRated: boolean;
  responseTime: string;
  avatar: string;
  banner: string;
  specialties: string[];
  experienceTime?: string;
  categoryLevel?: string;
  subscriptionPlan?: string;
  portfolioOwnerId?: string;
  isOnline?: boolean;
  lastSeenAt?: string;
  allowChat?: boolean;
  allowVisitRequests?: boolean;
  pauseLeadIntake?: boolean;
  businessHoursEnabled?: boolean;
  workingDays?: string[];
  workingHoursStart?: string;
  workingHoursEnd?: string;
  serviceTimezone?: string;
  createdAt?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface PortfolioItem {
  id: string;
  painterId: string;
  title: string;
  location: string;
  propertyType: string;
  paintType: string;
  status: string;
  imageUrl: string | null;
  videoUrl: string | null;
  stageMedia: PortfolioStageMediaMap;
  totalMediaCount: number;
  createdAt: string;
}

export interface PainterReview {
  id: string;
  applicationId: string;
  clientAuthUserId?: string | null;
  clientName: string;
  clientAvatarUrl: string | null;
  rating: number;
  comment: string;
  createdAt: string;
}

export enum Page {
  Home = 'home',
  PainterProfile = 'painter-profile',
  Register = 'register',
  HowItWorks = 'how-it-works',
  Plans = 'plans',
  About = 'about',
  Help = 'help',
  PaintingCategories = 'painting-categories',
  InspirationGallery = 'inspiration-gallery',
  Terms = 'terms',
  Privacy = 'privacy',
  Cookies = 'cookies',
  PrivacyRequest = 'privacy-request',
  Login = 'login',
  Dashboard = 'dashboard',
  Admin = 'admin',
  Academy = 'academy',
  PartnerCenter = 'partner-center'
}

export type PageNavigationParams = {
  painterId?: string;
};

export type NavigateToPage = (page: Page, params?: PageNavigationParams) => void;

export type AppRoute = {
  page: Page;
  painterId?: string;
};
