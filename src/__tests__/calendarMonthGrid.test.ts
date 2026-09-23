import {
  buildCalendarMonthWeeks,
  formatCalendarMonthYear,
  formatSelectedDateHeader,
  groupCalendarEventsByDate,
  isEventOnCalendarDate,
  isSameCalendarDay,
  navigateCalendarMonth,
  normalizeCalendarEvent,
  resetToToday,
  toggleDateSelection,
  type CalendarGridEvent,
} from '../features/calendar/CalendarMonthGrid';

describe('CalendarMonthGrid Architecture & Foundation', () => {
  const sampleNow = new Date('2026-09-19T10:00:00.000Z');

  describe('1. Découpage des semaines (début Lundi)', () => {
    it('découpe le mois en semaines de 7 jours, chacune commençant un Lundi et finissant un Dimanche', () => {
      // Octobre 2026
      const anchor = new Date(2026, 9, 1);
      const weeks = buildCalendarMonthWeeks(anchor, [], null, sampleNow);

      expect(weeks.length).toBeGreaterThanOrEqual(5);
      expect(weeks.length).toBeLessThanOrEqual(6);

      for (const week of weeks) {
        expect(week.days.length).toBe(7);

        // Premier jour de la semaine = Lundi (getDay() === 1)
        expect(week.days[0].date.getDay()).toBe(1);

        // Dernier jour de la semaine = Dimanche (getDay() === 0)
        expect(week.days[6].date.getDay()).toBe(0);
      }
    });

    it('gère un mois commençant un Dimanche ou un Lundi', () => {
      // Mai 2023 commence un Lundi (1er mai = lundi)
      const may2023 = new Date(2023, 4, 1);
      const weeksMay = buildCalendarMonthWeeks(may2023, [], null, sampleNow);
      expect(weeksMay[0].days[0].dayNumber).toBe(1);
      expect(weeksMay[0].days[0].isCurrentMonth).toBe(true);

      // Février 2026 commence un Dimanche (1er février = dimanche)
      const feb2026 = new Date(2026, 1, 1);
      const weeksFeb = buildCalendarMonthWeeks(feb2026, [], null, sampleNow);
      // Le 1er février est à l'index 6 (dimanche) de la première semaine
      expect(weeksFeb[0].days[6].dayNumber).toBe(1);
      expect(weeksFeb[0].days[6].isCurrentMonth).toBe(true);
      expect(weeksFeb[0].days[6].date.getDay()).toBe(0);
      // Les index 0 à 5 appartiennent à janvier
      expect(weeksFeb[0].days[0].isCurrentMonth).toBe(false);
    });
  });

  describe('2. Positionnement du 1er du mois', () => {
    it('positionne correctement le 1er Octobre 2026 (Jeudi -> index 3)', () => {
      const anchor = new Date(2026, 9, 1); // Octobre 2026
      const weeks = buildCalendarMonthWeeks(anchor, [], null, sampleNow);

      const firstWeek = weeks[0];
      // Index 0: Lun 28 Septembre (isCurrentMonth: false)
      expect(firstWeek.days[0].dayNumber).toBe(28);
      expect(firstWeek.days[0].isCurrentMonth).toBe(false);

      // Index 1: Mar 29 Septembre (isCurrentMonth: false)
      expect(firstWeek.days[1].dayNumber).toBe(29);
      expect(firstWeek.days[1].isCurrentMonth).toBe(false);

      // Index 2: Mer 30 Septembre (isCurrentMonth: false)
      expect(firstWeek.days[2].dayNumber).toBe(30);
      expect(firstWeek.days[2].isCurrentMonth).toBe(false);

      // Index 3: Jeu 1er Octobre (isCurrentMonth: true, dayNumber: 1)
      expect(firstWeek.days[3].dayNumber).toBe(1);
      expect(firstWeek.days[3].isCurrentMonth).toBe(true);
      expect(firstWeek.days[3].date.getDay()).toBe(4); // Jeudi = 4
    });

    it('positionne correctement le 1er Septembre 2026 (Mardi -> index 1)', () => {
      const anchor = new Date(2026, 8, 1); // Septembre 2026
      const weeks = buildCalendarMonthWeeks(anchor, [], null, sampleNow);

      const firstWeek = weeks[0];
      // Index 0: Lun 31 Août (isCurrentMonth: false)
      expect(firstWeek.days[0].dayNumber).toBe(31);
      expect(firstWeek.days[0].isCurrentMonth).toBe(false);

      // Index 1: Mar 1er Septembre (isCurrentMonth: true)
      expect(firstWeek.days[1].dayNumber).toBe(1);
      expect(firstWeek.days[1].isCurrentMonth).toBe(true);
      expect(firstWeek.days[1].date.getDay()).toBe(2); // Mardi = 2
    });
  });

  describe('3. Changement de mois (navigation précédente / suivante)', () => {
    it('navigue d’un mois en arrière et en avant', () => {
      const oct2026 = new Date(2026, 9, 15);

      const sep2026 = navigateCalendarMonth(oct2026, 'prev');
      expect(sep2026.getFullYear()).toBe(2026);
      expect(sep2026.getMonth()).toBe(8); // Septembre

      const nov2026 = navigateCalendarMonth(oct2026, 'next');
      expect(nov2026.getFullYear()).toBe(2026);
      expect(nov2026.getMonth()).toBe(10); // Novembre
    });

    it('gère le passage d’une année à l’autre (décembre -> janvier et janvier -> décembre)', () => {
      const dec2026 = new Date(2026, 11, 20);
      const jan2027 = navigateCalendarMonth(dec2026, 'next');
      expect(jan2027.getFullYear()).toBe(2027);
      expect(jan2027.getMonth()).toBe(0);

      const jan2026 = new Date(2026, 0, 5);
      const dec2025 = navigateCalendarMonth(jan2026, 'prev');
      expect(dec2025.getFullYear()).toBe(2025);
      expect(dec2025.getMonth()).toBe(11);
    });

    it('formate lisiblement le titre Mois + Année', () => {
      expect(formatCalendarMonthYear(new Date(2026, 9, 1))).toBe('Octobre 2026');
      expect(formatCalendarMonthYear(new Date(2026, 8, 1))).toBe('Septembre 2026');
    });
  });

  describe('4. Bouton Aujourd’hui', () => {
    it('repositionne le curseur sur le mois courant et sélectionne le jour J', () => {
      const ref = new Date(2026, 8, 19, 14, 30);
      const { monthCursor, selectedDate } = resetToToday(ref);

      expect(monthCursor.getFullYear()).toBe(2026);
      expect(monthCursor.getMonth()).toBe(8);
      expect(monthCursor.getDate()).toBe(1);

      expect(selectedDate.getFullYear()).toBe(2026);
      expect(selectedDate.getMonth()).toBe(8);
      expect(selectedDate.getDate()).toBe(19);

      expect(isSameCalendarDay(selectedDate, ref)).toBe(true);
    });
  });

  describe('5. Sélection de date et toggle', () => {
    it('sélectionne une nouvelle date et la désélectionne en recliquant dessus', () => {
      const target = new Date(2026, 9, 14);

      // Sélection initiale
      const selected = toggleDateSelection(null, target);
      expect(selected).not.toBeNull();
      expect(isSameCalendarDay(selected, target)).toBe(true);

      // Clic sur une autre date -> change la sélection
      const another = new Date(2026, 9, 15);
      const changed = toggleDateSelection(selected, another);
      expect(isSameCalendarDay(changed, another)).toBe(true);

      // Clic sur la même date -> désélectionne (toggle)
      const deselected = toggleDateSelection(changed, another);
      expect(deselected).toBeNull();
    });

    it('génère un libellé adapté pour la date sélectionnée (Aujourd’hui, Demain, Date complète)', () => {
      const today = new Date(2026, 8, 19);
      const tomorrow = new Date(2026, 8, 20);
      const otherDay = new Date(2026, 8, 25);

      expect(formatSelectedDateHeader(today, today).label).toBe("Aujourd'hui");
      expect(formatSelectedDateHeader(today, today).isToday).toBe(true);

      expect(formatSelectedDateHeader(tomorrow, today).label).toBe('Demain');
      expect(formatSelectedDateHeader(tomorrow, today).isTomorrow).toBe(true);

      const otherHeader = formatSelectedDateHeader(otherDay, today);
      expect(otherHeader.label.toLowerCase()).toContain('septembre');
      expect(otherHeader.isToday).toBe(false);
    });
  });

  describe('6. Événements multi-jours et tournois', () => {
    const tournament = normalizeCalendarEvent({
      id: 'tournoi-paris',
      title: 'Tournoi International de Paris U17',
      event_type: 'tournament',
      starts_at: new Date(2026, 9, 10, 9, 0), // 10 Octobre
      ends_at: new Date(2026, 9, 12, 18, 0),  // 12 Octobre
      city: 'Paris',
    });

    it('détecte le caractère multi-jours d’un événement', () => {
      expect(tournament.isMultiDay).toBe(true);
      expect(tournament.type).toBe('tournament');
    });

    it('fait apparaître l’événement sur tous les jours couverts (J1, J2, J3)', () => {
      const d10 = new Date(2026, 9, 10);
      const d11 = new Date(2026, 9, 11);
      const d12 = new Date(2026, 9, 12);
      const d9 = new Date(2026, 9, 9);
      const d13 = new Date(2026, 9, 13);

      expect(isEventOnCalendarDate(tournament, d10)).toBe(true);
      expect(isEventOnCalendarDate(tournament, d11)).toBe(true);
      expect(isEventOnCalendarDate(tournament, d12)).toBe(true);

      // Hors période
      expect(isEventOnCalendarDate(tournament, d9)).toBe(false);
      expect(isEventOnCalendarDate(tournament, d13)).toBe(false);
    });

    it('alimente l’indicateur hasMultiDay sur la grille mensuelle', () => {
      const anchor = new Date(2026, 9, 1);
      const weeks = buildCalendarMonthWeeks(anchor, [tournament], null, sampleNow);

      const allDays = weeks.flatMap((w) => w.days);
      const day11 = allDays.find((d) => d.isCurrentMonth && d.dayNumber === 11);

      expect(day11).toBeDefined();
      expect(day11?.hasMultiDay).toBe(true);
      expect(day11?.eventCount).toBe(1);
      expect(day11?.events[0].title).toBe('Tournoi International de Paris U17');
    });
  });

  describe('7. Gestion des statuts Annulé et Reporté', () => {
    it('détecte et normalise un match annulé', () => {
      const cancelledMatch = normalizeCalendarEvent({
        id: 'm-cancelled',
        title: 'Match vs Red Star FC',
        event_type: 'friendly',
        starts_at: new Date(2026, 9, 15, 15, 0),
        status: 'cancelled',
        cancel_reason: 'Intempéries',
      });

      expect(cancelledMatch.isCancelled).toBe(true);
      expect(cancelledMatch.status).toBe('cancelled');
    });

    it('détecte et normalise un entraînement reporté', () => {
      const postponedTraining = normalizeCalendarEvent({
        id: 't-postponed',
        title: 'Séance Tactique',
        event_type: 'training',
        starts_at: new Date(2026, 9, 16, 18, 30),
        status: 'postponed',
      });

      expect(postponedMatchOrTraining(postponedTraining)).toBe(true);
      expect(postponedTraining.isPostponed).toBe(true);
      expect(postponedTraining.status).toBe('postponed');
    });

    function postponedMatchOrTraining(evt: CalendarGridEvent) {
      return evt.isPostponed;
    }
  });

  describe('8. Bascule Mois / Liste (agenda chronologique)', () => {
    const events = [
      normalizeCalendarEvent({
        id: 'e1',
        title: 'Séance Tactique',
        event_type: 'training',
        starts_at: new Date(2026, 9, 5, 18, 0),
      }),
      normalizeCalendarEvent({
        id: 'e2',
        title: 'Séance Physique',
        event_type: 'training',
        starts_at: new Date(2026, 9, 5, 19, 30),
      }),
      normalizeCalendarEvent({
        id: 'e3',
        title: 'Match de Coupe',
        event_type: 'competition',
        starts_at: new Date(2026, 9, 10, 15, 0),
      }),
    ];

    it('regroupe les événements chronologiquement par jour pour la vue Liste', () => {
      const groups = groupCalendarEventsByDate(events);

      expect(groups.length).toBe(2);

      // Groupe 1 : 5 Octobre avec 2 séances
      expect(groups[0].dateKey).toBe('2026-10-05');
      expect(groups[0].events.length).toBe(2);
      expect(groups[0].events[0].title).toBe('Séance Tactique');
      expect(groups[0].events[1].title).toBe('Séance Physique');

      // Groupe 2 : 10 Octobre avec 1 match
      expect(groups[1].dateKey).toBe('2026-10-10');
      expect(groups[1].events.length).toBe(1);
      expect(groups[1].events[0].title).toBe('Match de Coupe');
    });

    it('ordonne strictement les événements par date et heure', () => {
      const unsorted = [events[2], events[1], events[0]];
      const groups = groupCalendarEventsByDate(unsorted);

      expect(groups[0].dateKey).toBe('2026-10-05');
      expect(groups[0].events[0].startsAt.getTime()).toBeLessThan(
        groups[0].events[1].startsAt.getTime(),
      );
      expect(groups[1].dateKey).toBe('2026-10-10');
    });
  });

  describe('9. Indicateurs visuels (Match, Entraînement, Autre, Aujourd’hui, Sélection)', () => {
    it('attribue correctement les flags hasMatch, hasTraining, hasOther sur les cellules de jour', () => {
      const match = normalizeCalendarEvent({
        id: 'm1',
        title: 'Match Amical',
        event_type: 'friendly',
        starts_at: new Date(2026, 9, 7, 15, 0),
      });
      const training = normalizeCalendarEvent({
        id: 't1',
        title: 'Séance U17',
        event_type: 'training',
        starts_at: new Date(2026, 9, 8, 18, 0),
      });
      const meeting = normalizeCalendarEvent({
        id: 'meet1',
        title: 'Réunion Staff',
        event_type: 'meeting',
        starts_at: new Date(2026, 9, 9, 20, 0),
      });

      const anchor = new Date(2026, 9, 1);
      const selected = new Date(2026, 9, 7);
      const todayRef = new Date(2026, 9, 8);

      const weeks = buildCalendarMonthWeeks(anchor, [match, training, meeting], selected, todayRef);
      const days = weeks.flatMap((w) => w.days).filter((d) => d.isCurrentMonth);

      const day7 = days.find((d) => d.dayNumber === 7);
      expect(day7?.hasMatch).toBe(true);
      expect(day7?.hasTraining).toBe(false);
      expect(day7?.isSelected).toBe(true);

      const day8 = days.find((d) => d.dayNumber === 8);
      expect(day8?.hasTraining).toBe(true);
      expect(day8?.hasMatch).toBe(false);
      expect(day8?.isToday).toBe(true);
      expect(day8?.isSelected).toBe(false);

      const day9 = days.find((d) => d.dayNumber === 9);
      expect(day9?.hasOther).toBe(true);
    });
  });
});
