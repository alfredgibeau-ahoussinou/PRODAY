import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, ScrollView, TextInput } from 'react-native';
import type { CoachChapterCommonProps } from './coachPortalUi';
import { CoachText } from './coachPortalUi';
import { Icon } from '../ui/Icon';
import type { TeamEvent } from '../../models/TeamEvent';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { useCoachShellNav } from "../../features/coach/shell/CoachShellNavContext";

import { useTranslation } from '../../context/LocaleContext';
import { radius, spacing } from '../../theme/designTokens';
import { useCoachTheme } from '../../features/coach/shell/CoachThemeContext';
import { CoachScreenHeader } from './CoachScreenHeader';
import { useUnreadMessageCount } from '../../hooks/useUnreadMessages';
import { PressableSpring } from '../motion';
import { formatCalendarDate } from '../../utils/seasonCalendar';
import { EliteAiQuickBar } from '../home/EliteAiQuickBar';
import { EliteStandingsBoard } from '../competition/EliteStandingsBoard';

export const CoachCockpitChapter: React.FC<CoachChapterCommonProps> = ({
  profile,
  events,
  members,
  onOpenChapter,
  onRefresh,
}) => {
  const { t } = useTranslation();
  const { tokens } = useCoachTheme();
  const tabNav = useTabNavigation();
  const shellNav = useCoachShellNav();
  const [searchQuery, setSearchQuery] = useState("");
  const { count: unreadMessages } = useUnreadMessageCount();

  
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    const foundMembers = members.filter(m => m.display_name?.toLowerCase().includes(q));
    const foundEvents = events.filter(e => e.title?.toLowerCase().includes(q));
    return { members: foundMembers, events: foundEvents };
  }, [searchQuery, members, events]);

  const nextEvent = events.find(e => new Date(e.starts_at) >= new Date()) || events[events.length - 1];

  const shortcuts = [
    { id: 'matchs', label: 'Matchs', icon: 'trophy', color: '#F5C518', nav: 'match_center' },
    { id: 'trainings', label: 'Séances', icon: 'football', color: tokens.accent, nav: 'entrainements' },
    { id: 'effectif', label: 'Effectif', icon: 'people', color: '#10B981', nav: 'equipe' },
    { id: 'planning', label: 'Planning', icon: 'calendar', color: '#3B82F6', nav: 'planning' },
  ] as const;

  return (
    <View style={[styles.root, { backgroundColor: tokens.bg }]}>
      <CoachScreenHeader
        title="Tableau de bord"
        unreadMessages={unreadMessages}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          <Icon name="search" size={20} color={tokens.muted} />
          <TextInput
            style={[styles.searchInput, { color: tokens.foreground }]}
            placeholder="Rechercher un joueur, un match..."
            placeholderTextColor={tokens.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <PressableSpring onPress={() => setSearchQuery('')}>
              <Icon name="close" size={20} color={tokens.muted} />
            </PressableSpring>
          )}
        </View>
  
        {searchResults ? (
          <View style={styles.searchResults}>
            {searchResults.members.length === 0 && searchResults.events.length === 0 ? (
              <CoachText style={{ color: tokens.muted, textAlign: 'center', marginTop: spacing.xl }}>Aucun résultat trouvé.</CoachText>
            ) : null}
            
            {searchResults.members.length > 0 && (
              <View style={styles.resultSection}>
                <CoachText style={[styles.sectionTitle, { color: tokens.foreground }]}>Joueurs & Staff</CoachText>
                {searchResults.members.map(m => (
                  <PressableSpring key={m.uid} style={[styles.resultItem, { borderColor: tokens.border }]} onPress={() => {}}>
                    <Icon name="person" size={20} color={tokens.accent} />
                    <CoachText style={{ color: tokens.foreground, marginLeft: spacing.sm }}>{m.display_name}</CoachText>
                  </PressableSpring>
                ))}
              </View>
            )}

            {searchResults.events.length > 0 && (
              <View style={styles.resultSection}>
                <CoachText style={[styles.sectionTitle, { color: tokens.foreground }]}>Événements</CoachText>
                {searchResults.events.map(e => (
                  <PressableSpring 
                    key={e.id} 
                    style={[styles.resultItem, { borderColor: tokens.border }]} 
                    onPress={() => tabNav.openMatchs({ eventId: e.id })}
                  >
                    <Icon name="calendar" size={20} color={tokens.accent} />
                    <CoachText style={{ color: tokens.foreground, marginLeft: spacing.sm }}>{e.title} - {formatCalendarDate(e.starts_at)}</CoachText>
                  </PressableSpring>
                ))}
              </View>
            )}
          </View>
        ) : (
          <>
            {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <CoachText style={[styles.welcomeTitle, { color: tokens.foreground }]}>
            Bonjour Coach {profile?.display_name?.split(" ")[0]},
          </CoachText>
          <CoachText style={[styles.welcomeSub, { color: tokens.muted }]}>
            Prêt pour une nouvelle semaine de succès ?
          </CoachText>
        </View>

        {/* Hero Next Event */}
        <View style={styles.sectionHeader}>
          <CoachText style={[styles.sectionTitle, { color: tokens.foreground }]}>Prochaine échéance</CoachText>
        </View>
        {nextEvent ? (
          <PressableSpring 
            style={[styles.heroCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
            onPress={() => tabNav.openMatchs({ eventId: nextEvent.id })}
          >
            <View style={styles.heroTop}>
              <View style={[styles.eventTypeBadge, { backgroundColor: (nextEvent.title || "").toLowerCase().includes("match") ? '#F5C51822' : tokens.accent + '22' }]}>
                <Icon name={(nextEvent.title || "").toLowerCase().includes("match") ? 'trophy' : 'football'} size={14} color={(nextEvent.title || "").toLowerCase().includes("match") ? '#F5C518' : tokens.accent} />
                <CoachText style={[styles.eventTypeText, { color: (nextEvent.title || "").toLowerCase().includes("match") ? '#F5C518' : tokens.accent }]}>
                  {(nextEvent.title || "").toLowerCase().includes("match") ? 'Match' : 'Entraînement'}
                </CoachText>
              </View>
              <CoachText style={[styles.heroDate, { color: tokens.muted }]}>
                {formatCalendarDate(nextEvent.starts_at)}
              </CoachText>
            </View>
            <CoachText style={[styles.heroTitle, { color: tokens.foreground }]}>{nextEvent.title}</CoachText>
            
            <View style={styles.heroActions}>
              <Pressable style={[styles.heroBtnPrimary, { backgroundColor: tokens.accent }]}>
                <CoachText style={[styles.heroBtnText, { color: tokens.onAccent }]}>Pointer les présences</CoachText>
              </Pressable>
              {(nextEvent.title || "").toLowerCase().includes("match") && (
                <Pressable style={[styles.heroBtnSecondary, { borderColor: tokens.border }]}>
                  <CoachText style={[styles.heroBtnText, { color: tokens.foreground }]}>Composition</CoachText>
                </Pressable>
              )}
            </View>
          </PressableSpring>
        ) : (
          <View style={[styles.heroCard, { backgroundColor: tokens.surface, alignItems: 'center' }]}>
            <CoachText style={{ color: tokens.muted }}>Aucun événement prévu.</CoachText>
          </View>
        )}

        {/* Quick Actions Grid */}
        <View style={styles.sectionHeader}>
          <CoachText style={[styles.sectionTitle, { color: tokens.foreground }]}>Raccourcis</CoachText>
        </View>
        <View style={styles.grid}>
          {shortcuts.map((s) => (
            <PressableSpring 
              key={s.id} 
              style={[styles.widgetTile, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
              onPress={() => shellNav?.requestNav(s.nav as any)}
            >
              <View style={[styles.widgetIconBg, { backgroundColor: s.color + '22' }]}>
                <Icon name={s.icon} size={24} color={s.color} />
              </View>
              <CoachText style={[styles.widgetLabel, { color: tokens.foreground }]}>{s.label}</CoachText>
            </PressableSpring>
          ))}
        </View>

        {/* Focus Effectif */}
        <View style={styles.sectionHeader}>
          <CoachText style={[styles.sectionTitle, { color: tokens.foreground }]}>Vue d'ensemble</CoachText>
        </View>
        <View style={[styles.statsCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          <View style={styles.statCol}>
            <CoachText style={[styles.statValue, { color: tokens.foreground }]}>{members.length}</CoachText>
            <CoachText style={[styles.statLabel, { color: tokens.muted }]}>Joueurs</CoachText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: tokens.border }]} />
          <View style={styles.statCol}>
            <CoachText style={[styles.statValue, { color: tokens.foreground }]}>{events.filter(e => (e.title || "").toLowerCase().includes("match")).length}</CoachText>
            <CoachText style={[styles.statLabel, { color: tokens.muted }]}>Matchs</CoachText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: tokens.border }]} />
          <View style={styles.statCol}>
            <CoachText style={[styles.statValue, { color: tokens.accent }]}>100%</CoachText>
            <CoachText style={[styles.statLabel, { color: tokens.muted }]}>Forme</CoachText>
          </View>
        </View>

        {/* Copilote IA Entraîneur */}
        <EliteAiQuickBar
          role="coach"
          onOpenAssistant={() => shellNav?.requestNav('coach_ia' as any)}
        />

        {/* Classement de la Poule (FFF / MyCoach style) */}
        <EliteStandingsBoard
          leagueName="Départemental 1 · Poule A"
          onTeamPress={() => {}}
        />

        </>
        )} 
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  resultSection: { marginTop: spacing.lg },
  resultItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1 },
  searchResults: { flex: 1 },
  searchBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md, height: 48, borderRadius: radius.pill, borderWidth: 1, marginBottom: spacing.md },
  searchInput: { flex: 1, marginLeft: spacing.sm, fontSize: 15 },
  root: { flex: 1 },
  scrollContent: { padding: spacing.md, paddingBottom: 120 },
  
  welcomeSection: { marginBottom: spacing.lg, marginTop: spacing.sm },
  welcomeTitle: { fontSize: 24, fontWeight: '800' },
  welcomeSub: { fontSize: 14, marginTop: 4 },
  
  sectionHeader: { marginBottom: spacing.sm, marginTop: spacing.lg },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  
  heroCard: { padding: spacing.lg, borderRadius: radius.xl, borderWidth: 1, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  eventTypeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, gap: 6 },
  eventTypeText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  heroDate: { fontSize: 13, fontWeight: '600' },
  heroTitle: { fontSize: 22, fontWeight: '800', marginBottom: spacing.xl },
  heroActions: { flexDirection: 'row', gap: spacing.sm },
  heroBtnPrimary: { flex: 1, paddingVertical: 14, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  heroBtnSecondary: { flex: 1, paddingVertical: 14, borderRadius: radius.lg, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  heroBtnText: { fontSize: 14, fontWeight: '700' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  widgetTile: { width: '48%', padding: spacing.lg, borderRadius: radius.xl, borderWidth: 1, alignItems: 'flex-start' },
  widgetIconBg: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  widgetLabel: { fontSize: 16, fontWeight: '700' },

  statsCard: { flexDirection: 'row', padding: spacing.lg, borderRadius: radius.xl, borderWidth: 1, alignItems: 'center' },
  statCol: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 40 },
  statValue: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  statLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
});
