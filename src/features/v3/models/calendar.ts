import type { MainTabId } from '../../../navigation/mainTabConfig';

export type SmartCalendarSource = 'match' | 'training' | 'goal' | 'event';

export interface SmartCalendarEntry {
  id: string;
  title: string;
  subtitle: string;
  startsAt: Date;
  source: SmartCalendarSource;
  city: string;
  tab: MainTabId;
  priority: number;
}
