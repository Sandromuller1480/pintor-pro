
export interface Painter {
  id: string;
  applicationId?: string;
  name: string;
  gender?: 'feminino' | 'masculino';
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
  createdAt: string;
}

export interface PainterReview {
  id: string;
  applicationId: string;
  clientName: string;
  clientAvatarUrl: string | null;
  rating: number;
  comment: string;
  createdAt: string;
}

export enum Page {
  Home = 'home',
  FindPainter = 'find-painter',
  PainterProfile = 'painter-profile',
  Register = 'register',
  HowItWorks = 'how-it-works',
  Plans = 'plans',
  About = 'about',
  Login = 'login',
  Dashboard = 'dashboard'
}

export type PageNavigationParams = {
  painterId?: string;
};

export type NavigateToPage = (page: Page, params?: PageNavigationParams) => void;

export type AppRoute = {
  page: Page;
  painterId?: string;
};
