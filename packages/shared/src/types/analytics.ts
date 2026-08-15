export interface AnalyticsBucket {
  key: string;
  total: number;
  /** "Responded" means the company did something — assessment/interview/offer/rejected. A still-pending "applied" isn't a response yet. */
  responded: number;
  responseRate: number;
}

export interface ApplicationAnalytics {
  totalApplications: number;
  totalResponded: number;
  overallResponseRate: number;
  byRole: AnalyticsBucket[];
  bySkill: AnalyticsBucket[];
  byLocation: AnalyticsBucket[];
}
