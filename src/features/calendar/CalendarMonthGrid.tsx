import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableSpring } from '../../components/motion/PressableSpring';
import { prodayHaptics } from '../../utils/prodayHaptics';
import {
  buildCalendarMonthWeeks,
  CALENDAR_WEEK_DAYS,
  EVENT_TYPE_COLORS,
  filterEventsByMonth,
  formatCalendarMonthYear,
  formatSelectedDateHeader,
  groupCalendarEventsByDate,
  isEventOnCalendarDate,
  isSameCalendarDay,
  navigateCalendarMonth,
  normalizeCalendarEvent,
  resetToToday,
  toggleDateSelection,
  type CalendarDayCell,
  type CalendarGridEvent,
  type CalendarWeek,
} from './calendarGridLogic';

// Re-exports publics pour faciliter les tests et l'usage externe
export {
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
};
export type { CalendarDayCell, CalendarGridEvent, CalendarWeek };

export type CalendarViewMode = 'month' | 'list';

export interface CalendarGridTokens {
  bg: string;
  surface: string;
  card: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  onAccent: string;
}

const DEFAULT_TOKENS: CalendarGridTokens = {
  bg: '#0B0F19',
  surface: '#151D2E',
  card: '#1E293B',
  border: 'rgba(255, 255, 255, 0.1)',
  text: '#FFFFFF',
  muted: '#94A3B8',
  accent: '#00E676',
  onAccent: '#000000',
};

export interface CalendarMonthGridProps<T = any> {
  events: T[];
  onSelectEvent?: (event: T) => void;
  initialDate?: Date;
  selectedDate?: Date | null;
  onSelectDate?: (date: Date | null) => void;
  defaultViewMode?: CalendarViewMode;
  tokens?: Partial<CalendarGridTokens>;
  emptyMessage?: string;
  hideViewToggle?: boolean;
}

/**
 * Composant de calendrier mensuel interactif haute fidélité pour ProDay.
 * Partagé entre Coach, Club et Joueur.
 */
export function CalendarMonthGrid<T = any>({
  events,
  onSelectEvent,
  initialDate = new Date(),
  selectedDate: controlledSelectedDate,
  onSelectDate,
  defaultViewMode = 'month',
  tokens: tokensProp,
  emptyMessage = 'Aucun événement sur cette période',
  hideViewToggle = false,
}: CalendarMonthGridProps<T>) {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 600;

  const themeTokens: CalendarGridTokens = useMemo(() => {
    if (tokensProp) {
      return { ...DEFAULT_TOKENS, ...tokensProp };
    }
    return DEFAULT_TOKENS;
  }, [tokensProp]);

  const [viewMode, setViewMode] = useState<CalendarViewMode>(defaultViewMode);
  const [monthCursor, setMonthCursor] = useState(() => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  const [internalSelectedDate, setInternalSelectedDate] = useState<Date | null>(() => initialDate ?? null);

  const selectedDate = controlledSelectedDate !== undefined ? controlledSelectedDate : internalSelectedDate;

  const updateSelectedDate = (date: Date | null) => {
    if (controlledSelectedDate === undefined) {
      setInternalSelectedDate(date);
    }
    onSelectDate?.(date);
  };

  // Normalisation unifiée des événements
  const normalizedEvents: CalendarGridEvent[] = useMemo(() => {
    return (events || []).map(normalizeCalendarEvent);
  }, [events]);

  // Construction des semaines du mois actif
  const weeks: CalendarWeek[] = useMemo(() => {
    return buildCalendarMonthWeeks(monthCursor, normalizedEvents, selectedDate);
  }, [monthCursor, normalizedEvents, selectedDate]);

  // Événements du mois actif
  const monthEvents: CalendarGridEvent[] = useMemo(() => {
    return filterEventsByMonth(normalizedEvents, monthCursor);
  }, [normalizedEvents, monthCursor]);

  // Événements du jour sélectionné
  const selectedDayEvents: CalendarGridEvent[] = useMemo(() => {
    if (!selectedDate) return [];
    return normalizedEvents.filter((e) => {
      const startDay = new Date(e.startsAt.getFullYear(), e.startsAt.getMonth(), e.startsAt.getDate()).getTime();
      const endDay = e.endsAt
        ? new Date(e.endsAt.getFullYear(), e.endsAt.getMonth(), e.endsAt.getDate()).getTime()
        : startDay;
      const targetDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()).getTime();
      return targetDay >= startDay && targetDay <= endDay;
    });
  }, [normalizedEvents, selectedDate]);

  // Groupement par jour pour la vue Liste
  const listGroups = useMemo(() => {
    return groupCalendarEventsByDate(monthEvents.length > 0 ? monthEvents : normalizedEvents);
  }, [monthEvents, normalizedEvents]);

  // Actions de navigation
  const handlePrevMonth = () => {
    prodayHaptics.press();
    setMonthCursor((prev) => navigateCalendarMonth(prev, 'prev'));
  };

  const handleNextMonth = () => {
    prodayHaptics.press();
    setMonthCursor((prev) => navigateCalendarMonth(prev, 'next'));
  };

  const handleTodayPress = () => {
    prodayHaptics.press();
    const { monthCursor: m, selectedDate: s } = resetToToday();
    setMonthCursor(m);
    updateSelectedDate(s);
  };

  const handleDayPress = (cell: CalendarDayCell) => {
    prodayHaptics.press();
    // Si le jour cliqué appartient à un autre mois, on ajuste le curseur du mois
    if (!cell.isCurrentMonth) {
      setMonthCursor(new Date(cell.date.getFullYear(), cell.date.getMonth(), 1));
    }
    const next = toggleDateSelection(selectedDate, cell.date);
    updateSelectedDate(next);
  };

  const handleEventCardPress = (event: CalendarGridEvent) => {
    prodayHaptics.press();
    onSelectEvent?.(event.raw || event);
  };

  const styles = useMemo(() => createStyles(themeTokens, isLargeScreen), [themeTokens, isLargeScreen]);

  return (
    <View style={styles.container}>
      {/* 1. BARRE DE COMMANDE SUPÉRIEURE (MOIS/LISTE & AUJOURD'HUI) */}
      <View style={styles.topControlBar}>
        {!hideViewToggle ? (
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              onPress={() => {
                prodayHaptics.press();
                setViewMode('month');
              }}
              style={[styles.segmentBtn, viewMode === 'month' && styles.segmentBtnActive]}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: viewMode === 'month' }}
            >
              <Ionicons
                name="calendar-outline"
                size={13}
                color={viewMode === 'month' ? themeTokens.text : themeTokens.muted}
              />
              <Text style={[styles.segmentText, viewMode === 'month' && styles.segmentTextActive]}>
                Mois
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                prodayHaptics.press();
                setViewMode('list');
              }}
              style={[styles.segmentBtn, viewMode === 'list' && styles.segmentBtnActive]}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: viewMode === 'list' }}
            >
              <Ionicons
                name="list-outline"
                size={13}
                color={viewMode === 'list' ? themeTokens.text : themeTokens.muted}
              />
              <Text style={[styles.segmentText, viewMode === 'list' && styles.segmentTextActive]}>
                Liste
              </Text>
            </TouchableOpacity>
          </View>
        ) : <View />}

        <PressableSpring onPress={handleTodayPress} scaleTo={0.95} haptic style={styles.todayBtn}>
          <Ionicons name="today" size={13} color={themeTokens.accent} />
          <Text style={styles.todayBtnText}>Aujourd'hui</Text>
        </PressableSpring>
      </View>

      {/* 2. VUE MOIS (GRILLE 7 COLONNES L, M, M, J, V, S, D) */}
      {viewMode === 'month' ? (
        <View style={styles.monthCard}>
          {/* Navigation Mois + Titre Mois & Année */}
          <View style={styles.monthNavRow}>
            <TouchableOpacity
              onPress={handlePrevMonth}
              style={styles.navChevronBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Mois précédent"
              accessibilityRole="button"
            >
              <Ionicons name="chevron-back" size={18} color={themeTokens.text} />
            </TouchableOpacity>

            <Text style={styles.monthTitleText}>{formatCalendarMonthYear(monthCursor)}</Text>

            <TouchableOpacity
              onPress={handleNextMonth}
              style={styles.navChevronBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Mois suivant"
              accessibilityRole="button"
            >
              <Ionicons name="chevron-forward" size={18} color={themeTokens.text} />
            </TouchableOpacity>
          </View>

          {/* En-têtes des jours de la semaine (L, M, M, J, V, S, D) */}
          <View style={styles.weekDaysHeaderRow}>
            {CALENDAR_WEEK_DAYS.map((dayLabel, idx) => (
              <View key={idx} style={styles.weekDayHeaderCol}>
                <Text style={styles.weekDayHeaderText}>{dayLabel}</Text>
              </View>
            ))}
          </View>

          {/* Semaines et cellules de jours */}
          <View style={styles.weeksContainer}>
            {weeks.map((week) => (
              <View key={week.weekIndex} style={styles.weekRow}>
                {week.days.map((cell) => {
                  const isSelected = cell.isSelected;
                  const isToday = cell.isToday;

                  return (
                    <TouchableOpacity
                      key={cell.date.toISOString()}
                      onPress={() => handleDayPress(cell)}
                      activeOpacity={0.7}
                      style={[
                        styles.dayCell,
                        !cell.isCurrentMonth && styles.dayCellOutsideMonth,
                        isToday && !isSelected && styles.dayCellToday,
                        isSelected && styles.dayCellSelected,
                      ]}
                      accessibilityLabel={`${cell.dayNumber} ${formatCalendarMonthYear(cell.date)}, ${cell.eventCount} événements`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                    >
                      {/* Numéro du jour */}
                      <View
                        style={[
                          styles.dayNumberBadge,
                          isSelected && styles.dayNumberBadgeSelected,
                          isToday && !isSelected && styles.dayNumberBadgeToday,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayNumberText,
                            !cell.isCurrentMonth && styles.dayNumberTextDimmed,
                            isToday && !isSelected && styles.dayNumberTextToday,
                            isSelected && styles.dayNumberTextSelected,
                          ]}
                        >
                          {cell.dayNumber}
                        </Text>
                      </View>

                      {/* Indicateurs d'événements */}
                      {isLargeScreen ? (
                        // Tablette / Grand écran : pilules avec titres lisibles
                        <View style={styles.tabletEventPillsContainer}>
                          {cell.events.slice(0, 2).map((evt) => {
                            const evtColor = evt.isCancelled
                              ? EVENT_TYPE_COLORS.cancelled
                              : evt.isPostponed
                                ? EVENT_TYPE_COLORS.postponed
                                : EVENT_TYPE_COLORS[evt.type] || themeTokens.accent;

                            return (
                              <View
                                key={evt.id}
                                style={[
                                  styles.tabletEventPill,
                                  { backgroundColor: `${evtColor}25`, borderColor: `${evtColor}40` },
                                ]}
                              >
                                <Text
                                  numberOfLines={1}
                                  style={[
                                    styles.tabletEventPillText,
                                    { color: evtColor },
                                    evt.isCancelled && styles.strikethroughText,
                                  ]}
                                >
                                  {evt.type === 'match' || evt.type === 'tournament'
                                    ? '🏆 '
                                    : evt.type === 'training'
                                      ? '⚽ '
                                      : '📅 '}
                                  {evt.title}
                                </Text>
                              </View>
                            );
                          })}
                          {cell.eventCount > 2 ? (
                            <Text style={styles.tabletMoreText}>+{cell.eventCount - 2}</Text>
                          ) : null}
                        </View>
                      ) : (
                        // Mobile : pastilles compactes colorées par type
                        <View style={styles.mobileDotsRow}>
                          {cell.hasMatch ? (
                            <View
                              style={[
                                styles.dot,
                                { backgroundColor: EVENT_TYPE_COLORS.match },
                                cell.hasCancelled && styles.dotCancelled,
                              ]}
                            />
                          ) : null}
                          {cell.hasTraining ? (
                            <View
                              style={[
                                styles.dot,
                                { backgroundColor: EVENT_TYPE_COLORS.training },
                                cell.hasCancelled && styles.dotCancelled,
                              ]}
                            />
                          ) : null}
                          {cell.hasOther ? (
                            <View
                              style={[
                                styles.dot,
                                { backgroundColor: EVENT_TYPE_COLORS.meeting },
                              ]}
                            />
                          ) : null}
                          {cell.hasMultiDay ? (
                            <View
                              style={[
                                styles.multiDayBar,
                                { backgroundColor: EVENT_TYPE_COLORS.tournament },
                              ]}
                            />
                          ) : null}
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* 3. DÉTAIL INTERACTIF DU JOUR SÉLECTIONNÉ (OU LISTE COMPLÈTE) */}
      {viewMode === 'month' ? (
        <View style={styles.selectedDateSection}>
          {selectedDate ? (
            <View style={styles.selectedDateHeaderRow}>
              <View style={styles.selectedDateHeaderLeft}>
                <Ionicons name="calendar" size={15} color={themeTokens.accent} />
                <Text style={styles.selectedDateTitle}>
                  {formatSelectedDateHeader(selectedDate).label}
                </Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{selectedDayEvents.length}</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => updateSelectedDate(null)}
                style={styles.clearDateBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={14} color={themeTokens.muted} />
                <Text style={styles.clearDateText}>Effacer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noDateNotice}>
              <Ionicons name="information-circle-outline" size={15} color={themeTokens.muted} />
              <Text style={styles.noDateNoticeText}>
                Sélectionnez un jour sur la grille pour voir ses détails
              </Text>
            </View>
          )}

          {selectedDate && selectedDayEvents.length === 0 ? (
            <View style={styles.emptyDayCard}>
              <Ionicons name="calendar-outline" size={24} color={themeTokens.muted} />
              <Text style={styles.emptyDayTitle}>Aucun événement ce jour-ci</Text>
              <Text style={styles.emptyDaySubtitle}>
                Sélectionnez une autre date avec pastille ou consultez la vue liste.
              </Text>
            </View>
          ) : null}

          {selectedDayEvents.map((evt) => (
            <CalendarEventItemCard
              key={evt.id}
              event={evt}
              tokens={themeTokens}
              onPress={() => handleEventCardPress(evt)}
            />
          ))}
        </View>
      ) : (
        /* VUE ALTERNATIVE : LISTE CHRONOLOGIQUE (AGENDA) */
        <View style={styles.listSection}>
          {listGroups.length === 0 ? (
            <View style={styles.emptyDayCard}>
              <Ionicons name="calendar-outline" size={28} color={themeTokens.muted} />
              <Text style={styles.emptyDayTitle}>{emptyMessage}</Text>
            </View>
          ) : (
            listGroups.map((group) => {
              const header = formatSelectedDateHeader(group.date);

              return (
                <View key={group.dateKey} style={styles.listDayGroup}>
                  <View style={styles.listDayHeaderRow}>
                    <Text
                      style={[
                        styles.listDayHeaderText,
                        header.isToday && { color: themeTokens.accent, fontWeight: '800' },
                      ]}
                    >
                      {header.label}
                    </Text>
                    <Text style={styles.listDayHeaderCount}>{group.events.length} rendez-vous</Text>
                  </View>

                  {group.events.map((evt) => (
                    <CalendarEventItemCard
                      key={evt.id}
                      event={evt}
                      tokens={themeTokens}
                      onPress={() => handleEventCardPress(evt)}
                    />
                  ))}
                </View>
              );
            })
          )}
        </View>
      )}
    </View>
  );
}

/**
 * Carte interactive d'un événement de calendrier avec indicateurs visuels complets
 * (Statuts Annulé / Reporté, multi-jours, pastille de couleur, icône dédiée).
 */
function CalendarEventItemCard({
  event,
  tokens,
  onPress,
}: {
  event: CalendarGridEvent;
  tokens: CalendarGridTokens;
  onPress: () => void;
}) {
  const isCancelled = event.isCancelled;
  const isPostponed = event.isPostponed;

  const typeColor = isCancelled
    ? EVENT_TYPE_COLORS.cancelled
    : isPostponed
      ? EVENT_TYPE_COLORS.postponed
      : EVENT_TYPE_COLORS[event.type] || tokens.accent;

  const typeIcon: keyof typeof Ionicons.glyphMap =
    event.type === 'match'
      ? 'trophy'
      : event.type === 'tournament'
        ? 'trophy'
        : event.type === 'training'
          ? 'football'
          : event.type === 'meeting'
            ? 'people'
            : 'calendar';

  const typeLabel =
    event.type === 'match'
      ? 'MATCH'
      : event.type === 'tournament'
        ? 'TOURNOI'
        : event.type === 'training'
          ? 'ENTRAÎNEMENT'
          : event.type === 'meeting'
            ? 'RÉUNION'
            : 'ÉVÉNEMENT';

  return (
    <PressableSpring
      onPress={onPress}
      scaleTo={0.98}
      haptic
      style={[
        stylesCard.card,
        { backgroundColor: tokens.surface, borderColor: tokens.border },
        isCancelled && stylesCard.cardCancelled,
      ]}
    >
      <View style={stylesCard.body}>
        {/* Ligne Supérieure : Type Tag, Heure, Badges Statuts */}
        <View style={stylesCard.topRow}>
          <View style={stylesCard.topLeft}>
            <View
              style={[
                stylesCard.typeTag,
                { backgroundColor: `${typeColor}20`, borderColor: `${typeColor}40` },
              ]}
            >
              <Ionicons name={typeIcon} size={11} color={typeColor} style={stylesCard.typeIcon} />
              <Text style={[stylesCard.typeTagText, { color: typeColor }]}>{typeLabel}</Text>
            </View>

            {event.timeLabel ? (
              <View style={stylesCard.timeBadge}>
                <Ionicons name="time-outline" size={12} color={tokens.muted} />
                <Text style={[stylesCard.timeText, { color: tokens.muted }]}>{event.timeLabel}</Text>
              </View>
            ) : null}
          </View>

          <View style={stylesCard.topRight}>
            {isCancelled ? (
              <View style={stylesCard.cancelledBadge}>
                <Text style={stylesCard.cancelledBadgeText}>ANNULÉ</Text>
              </View>
            ) : isPostponed ? (
              <View style={stylesCard.postponedBadge}>
                <Text style={stylesCard.postponedBadgeText}>REPORTÉ</Text>
              </View>
            ) : event.status === 'live' ? (
              <View style={stylesCard.liveBadge}>
                <View style={stylesCard.liveDot} />
                <Text style={stylesCard.liveBadgeText}>EN DIRECT</Text>
              </View>
            ) : null}

            {event.isMultiDay ? (
              <View style={stylesCard.multiDayBadge}>
                <Text style={stylesCard.multiDayBadgeText}>Multi-jours</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Titre et Détails */}
        <View style={stylesCard.mainRow}>
          <View style={stylesCard.textBlock}>
            <Text
              numberOfLines={2}
              style={[
                stylesCard.titleText,
                { color: tokens.text },
                isCancelled && stylesCard.strikethroughText,
              ]}
            >
              {event.title}
            </Text>

            {event.location || event.city ? (
              <View style={stylesCard.locationRow}>
                <Ionicons name="location-outline" size={12} color={tokens.muted} />
                <Text numberOfLines={1} style={[stylesCard.locationText, { color: tokens.muted }]}>
                  {[event.location, event.city].filter(Boolean).join(' · ')}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={[stylesCard.chevronCircle, { backgroundColor: `${tokens.text}10` }]}>
            <Ionicons name="chevron-forward" size={14} color={tokens.text} />
          </View>
        </View>
      </View>
    </PressableSpring>
  );
}

// Re-export des modèles et fonctions purs pour commodité
export * from './calendarGridLogic';

const stylesCard = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  cardCancelled: {
    opacity: 0.65,
  },
  body: {
    padding: 12,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  typeIcon: {
    marginRight: 4,
  },
  typeTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cancelledBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  cancelledBadgeText: {
    color: '#EF4444',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  postponedBadge: {
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F97316',
  },
  postponedBadgeText: {
    color: '#F97316',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  liveBadgeText: {
    color: '#EF4444',
    fontSize: 9,
    fontWeight: '800',
  },
  multiDayBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  multiDayBadgeText: {
    color: '#F59E0B',
    fontSize: 9,
    fontWeight: '700',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  strikethroughText: {
    textDecorationLine: 'line-through',
    opacity: 0.8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 11,
  },
  chevronCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const createStyles = (tokens: CalendarGridTokens, isLargeScreen: boolean) =>
  StyleSheet.create({
    container: {
      gap: 12,
    },
    topControlBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    segmentedControl: {
      flexDirection: 'row',
      backgroundColor: tokens.surface,
      borderRadius: 12,
      padding: 3,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    segmentBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 9,
    },
    segmentBtnActive: {
      backgroundColor: `${tokens.accent}20`,
    },
    segmentText: {
      color: tokens.muted,
      fontSize: 12,
      fontWeight: '600',
    },
    segmentTextActive: {
      color: tokens.text,
      fontWeight: '700',
    },
    todayBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      backgroundColor: `${tokens.accent}15`,
      borderWidth: 1,
      borderColor: `${tokens.accent}30`,
    },
    todayBtnText: {
      color: tokens.accent,
      fontSize: 12,
      fontWeight: '700',
    },
    monthCard: {
      backgroundColor: tokens.surface,
      borderRadius: 16,
      padding: 12,
      borderWidth: 1,
      borderColor: tokens.border,
      gap: 10,
    },
    monthNavRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 4,
    },
    navChevronBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    monthTitleText: {
      color: tokens.text,
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    weekDaysHeaderRow: {
      flexDirection: 'row',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.border,
      paddingBottom: 6,
    },
    weekDayHeaderCol: {
      flex: 1,
      alignItems: 'center',
    },
    weekDayHeaderText: {
      color: tokens.muted,
      fontSize: 11,
      fontWeight: '700',
    },
    weeksContainer: {
      gap: 4,
    },
    weekRow: {
      flexDirection: 'row',
      gap: 4,
    },
    dayCell: {
      flex: 1,
      minHeight: isLargeScreen ? 72 : 46,
      borderRadius: 10,
      paddingVertical: 4,
      paddingHorizontal: 2,
      alignItems: 'center',
      justifyContent: isLargeScreen ? 'flex-start' : 'center',
      borderWidth: 1,
      borderColor: 'transparent',
    },
    dayCellOutsideMonth: {
      opacity: 0.3,
    },
    dayCellToday: {
      borderColor: `${tokens.accent}70`,
      backgroundColor: `${tokens.accent}10`,
    },
    dayCellSelected: {
      backgroundColor: tokens.accent,
      borderColor: tokens.accent,
    },
    dayNumberBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayNumberBadgeToday: {
      borderWidth: 1,
      borderColor: tokens.accent,
    },
    dayNumberBadgeSelected: {
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
    },
    dayNumberText: {
      color: tokens.text,
      fontSize: 12,
      fontWeight: '600',
    },
    dayNumberTextDimmed: {
      color: tokens.muted,
    },
    dayNumberTextToday: {
      color: tokens.accent,
      fontWeight: '800',
    },
    dayNumberTextSelected: {
      color: tokens.onAccent,
      fontWeight: '900',
    },
    mobileDotsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      marginTop: 2,
      minHeight: 6,
    },
    dot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
    },
    dotCancelled: {
      borderWidth: 1,
      borderColor: '#EF4444',
      opacity: 0.8,
    },
    multiDayBar: {
      width: 8,
      height: 3,
      borderRadius: 1.5,
    },
    tabletEventPillsContainer: {
      width: '100%',
      gap: 2,
      marginTop: 2,
    },
    tabletEventPill: {
      borderRadius: 4,
      paddingHorizontal: 3,
      paddingVertical: 1,
      borderWidth: 0.5,
    },
    tabletEventPillText: {
      fontSize: 9,
      fontWeight: '700',
    },
    tabletMoreText: {
      color: tokens.muted,
      fontSize: 8,
      fontWeight: '700',
      textAlign: 'center',
    },
    strikethroughText: {
      textDecorationLine: 'line-through',
    },
    selectedDateSection: {
      gap: 8,
      marginTop: 4,
    },
    selectedDateHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 4,
      marginBottom: 2,
    },
    selectedDateHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    selectedDateTitle: {
      color: tokens.text,
      fontSize: 14,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    countBadge: {
      backgroundColor: `${tokens.accent}20`,
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: 8,
    },
    countBadgeText: {
      color: tokens.accent,
      fontSize: 10,
      fontWeight: '800',
    },
    clearDateBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    clearDateText: {
      color: tokens.muted,
      fontSize: 11,
      fontWeight: '600',
    },
    noDateNotice: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      padding: 10,
      borderRadius: 10,
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      borderWidth: 1,
      borderColor: tokens.border,
    },
    noDateNoticeText: {
      color: tokens.muted,
      fontSize: 12,
    },
    emptyDayCard: {
      padding: 20,
      borderRadius: 14,
      backgroundColor: tokens.surface,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    emptyDayTitle: {
      color: tokens.text,
      fontSize: 14,
      fontWeight: '700',
    },
    emptyDaySubtitle: {
      color: tokens.muted,
      fontSize: 12,
      textAlign: 'center',
    },
    listSection: {
      gap: 16,
    },
    listDayGroup: {
      gap: 8,
    },
    listDayHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 4,
    },
    listDayHeaderText: {
      color: tokens.text,
      fontSize: 14,
      fontWeight: '800',
    },
    listDayHeaderCount: {
      color: tokens.muted,
      fontSize: 11,
      fontWeight: '600',
    },
  });
