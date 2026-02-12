
export interface Painter {
  id: string;
  name: string;
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
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface PortfolioItem {
  id: string;
  painterId: string;
  title: string;
  beforeImg: string;
  afterImg: string;
  paintType: string;
  area: string;
  duration: string;
  location: string;
  finishType: string;
  description: string;
}

export enum Page {
  Home = 'home',
  FindPainter = 'find-painter',
  PainterProfile = 'painter-profile',
  Register = 'register',
  HowItWorks = 'how-it-works',
  Plans = 'plans',
  About = 'about'
}
