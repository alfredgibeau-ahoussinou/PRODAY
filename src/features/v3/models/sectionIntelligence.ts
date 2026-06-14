import type { MainTabId } from '../../../navigation/mainTabConfig';

export interface SectionInsight {
  id: string;
  label: string;
  detail: string;
  priority: number;
  tab?: MainTabId;
}

export interface SectionIntelligence {
  tab: MainTabId;
  headline: string;
  summary: string;
  primaryAction?: { label: string; insightId: string };
  insights: SectionInsight[];
}
