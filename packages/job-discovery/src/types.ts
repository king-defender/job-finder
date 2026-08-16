export interface JobSearchCriteria {
  keywords: string;
  location?: string;
  remoteOnly?: boolean;
  limit?: number;
}

export interface DiscoveredJobRaw {
  title: string;
  company: string;
  location: string;
  remote: boolean;
  salaryRange: string | null;
  description: string;
  url: string;
  source: string;
}
