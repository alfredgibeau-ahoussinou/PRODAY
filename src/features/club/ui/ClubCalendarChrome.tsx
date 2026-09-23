/**
 * Composition visuelle Calendrier Club — enveloppe de **thème** uniquement.
 *
 * La composition (hero prochain RDV + lignes agenda) vit dans
 * `features/calendar/calendarChrome.tsx` et est partagée avec le pôle Coach :
 * le pôle Club n'apporte ici que ses jetons de surface et son composant texte.
 * Conséquence voulue : impossible de faire dériver les deux calendriers.
 */
import React from 'react';
import { useClubTheme } from '../shell/ClubThemeContext';
import {
  CalendarAgendaRow,
  CalendarChromeProvider,
  CalendarHero,
  type CalendarChromeText,
  type CalendarHeroLabels,
} from '../../calendar/calendarChrome';
import { ClubText } from './clubUi';
import type { ClubCalendarItemModel } from './clubCalendarModel';

/** Adaptateur stable du composant texte Club (identité constante entre rendus). */
const ClubCalendarText: CalendarChromeText = (props) => <ClubText {...props} />;

export function ClubCalendarHero({
  model,
  onOpen,
  onOpenList,
  labels,
}: {
  model: ClubCalendarItemModel;
  onOpen: () => void;
  onOpenList?: () => void;
  labels?: CalendarHeroLabels;
}) {
  const { tokens } = useClubTheme();
  return (
    <CalendarChromeProvider tokens={tokens} Text={ClubCalendarText} faintText={tokens.faint}>
      <CalendarHero model={model} onOpen={onOpen} onOpenList={onOpenList} labels={labels} />
    </CalendarChromeProvider>
  );
}

export function ClubCalendarAgendaRow({
  model,
  index,
  onPress,
}: {
  model: ClubCalendarItemModel;
  index: number;
  onPress: () => void;
}) {
  const { tokens } = useClubTheme();
  return (
    <CalendarChromeProvider tokens={tokens} Text={ClubCalendarText} faintText={tokens.faint}>
      <CalendarAgendaRow model={model} index={index} onPress={onPress} />
    </CalendarChromeProvider>
  );
}
