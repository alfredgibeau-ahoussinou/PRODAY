/**
 * Chrome Calendrier **Coach** — enveloppe de thème uniquement.
 *
 * Même composition que le pôle Club/Admin (`features/calendar/calendarChrome`),
 * seuls les jetons de surface changent. C'est la garantie que le calendrier
 * Coach et le calendrier Club gardent la même structure, les mêmes libellés
 * d'action et le même rythme typographique.
 */
import React from 'react';
import { useCoachTheme } from '../shell/CoachThemeContext';
import { CoachText } from '../../../components/coach/coachPortalUi';
import {
  CalendarAgendaRow,
  CalendarChromeProvider,
  CalendarHero,
  type CalendarChromeText,
  type CalendarHeroLabels,
} from '../../calendar/calendarChrome';
import type { CalendarItemModel } from '../../calendar/calendarModel';

/** Adaptateur stable du composant texte Coach (identité constante entre rendus). */
const CoachCalendarText: CalendarChromeText = (props) => <CoachText {...props} />;

export function CoachCalendarHero({
  model,
  onOpen,
  onOpenList,
  labels,
}: {
  model: CalendarItemModel;
  onOpen: () => void;
  onOpenList?: () => void;
  labels?: CalendarHeroLabels;
}) {
  const { tokens } = useCoachTheme();
  return (
    <CalendarChromeProvider tokens={tokens} Text={CoachCalendarText}>
      <CalendarHero model={model} onOpen={onOpen} onOpenList={onOpenList} labels={labels} />
    </CalendarChromeProvider>
  );
}

export function CoachCalendarAgendaRow({
  model,
  index,
  onPress,
}: {
  model: CalendarItemModel;
  index: number;
  onPress: () => void;
}) {
  const { tokens } = useCoachTheme();
  return (
    <CalendarChromeProvider tokens={tokens} Text={CoachCalendarText}>
      <CalendarAgendaRow model={model} index={index} onPress={onPress} />
    </CalendarChromeProvider>
  );
}
