import type { MainTabId } from '../../../navigation/mainTabConfig';

export type HabitSignal = 'positive' | 'neutral' | 'negative';

export interface HabitInsight {
  id: string;
  label: string;
  detail: string;
  signal: HabitSignal;
}

export interface DailyBriefing {
  headline: string;
  summary: string;
  focusLabel: string;
  insights: string[];
  habits: HabitInsight[];
  generatedAt: Date;
}

export type SmartActionKind =
  | 'match'
  | 'mercato'
  | 'health'
  | 'carpool'
  | 'profile'
  | 'message'
  | 'reels'
  | 'geo';

export interface SmartAction {
  id: string;
  kind: SmartActionKind;
  title: string;
  subtitle: string;
  priority: number;
  tab?: MainTabId;
  reason: string;
}
