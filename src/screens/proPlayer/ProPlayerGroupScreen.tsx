import React, { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { usePlayerTheme, usePlayerThemeColors } from '../../context/PlayerThemeContext';
import { TabScreenShell } from '../../components/app/TabScreenShell';
import { ProDayText } from '../../components/ui/ProDayText';
import { PressableSpring } from '../../components/motion';
import { MatchNextUpCard } from '../../components/matchs/MatchNextUpCard';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { CrestWatermark } from '../joueur/PlayerSaisonIcons';
import { prodayHaptics } from '../../utils/prodayHaptics';
import type { RsvpStatus, TeamEvent } from '../../models/TeamEvent';
import type { SeasonCalendarItem } from '../../utils/seasonCalendar';
import { teamEventsService } from '../../services/teamEvents.service';

type PositionFilter = 'all' | 'gk' | 'def' | 'mid' | 'att';

interface ProSquadMember {
  id: string;
  name: string;
  num: number;
  pos: 'GB' | 'DC' | 'DG' | 'DD' | 'MDC' | 'MC' | 'MOC' | 'AG' | 'AD' | 'BU';
  group: 'gk' | 'def' | 'mid' | 'att';
  status: 'yes' | 'maybe' | 'no';
  ovr: number;
}

const PRO_SQUAD: ProSquadMember[] = [
  { id: '1', name: 'Lucas Martin', num: 1, pos: 'GB', group: 'gk', status: 'yes', ovr: 82 },
  { id: '2', name: 'Enzo Tavares', num: 4, pos: 'DC', group: 'def', status: 'yes', ovr: 85 },
  { id: '3', name: 'Alexandre Roy', num: 5, pos: 'DC', group: 'def', status: 'yes', ovr: 83 },
  { id: '4', name: 'Thomas Lefebvre', num: 3, pos: 'DG', group: 'def', status: 'yes', ovr: 81 },
  { id: '5', name: 'Yanis Benali', num: 2, pos: 'DD', group: 'def', status: 'maybe', ovr: 84 },
  { id: '6', name: 'Maxime Rousseau', num: 6, pos: 'MDC', group: 'mid', status: 'yes', ovr: 87 },
  { id: '7', name: 'Alex Moreau', num: 8, pos: 'MC', group: 'mid', status: 'yes', ovr: 86 },
  { id: '8', name: 'Samy Khelifi', num: 10, pos: 'MOC', group: 'mid', status: 'yes', ovr: 89 },
  { id: '9', name: 'Karim Belkacem', num: 7, pos: 'AD', group: 'att', status: 'yes', ovr: 88 },
  { id: '10', name: 'Hugo Dubois', num: 11, pos: 'AG', group: 'att', status: 'maybe', ovr: 84 },
  { id: '11', name: 'Lucas Démo', num: 9, pos: 'BU', group: 'att', status: 'yes', ovr: 90 },
];

const DEMO_PRO_FORM = [
  { result: 'V' as const, score: '3 - 0', opponent: 'AS Cannes', isHome: true },
  { result: 'V' as const, score: '2 - 1', opponent: 'Hyères FC', isHome: false },
  { result: 'N' as const, score: '1 - 1', opponent: 'RC Grasse', isHome: true },
  { result: 'V' as const, score: '4 - 0', opponent: 'SC Toulon', isHome: false },
  { result: 'V' as const, score: '2 - 0', opponent: 'Marignane GCB', isHome: true },
];

const PRO_STAFF = [
  { role: 'Coach Principal', name: 'Laurent Blanc', license: 'UEFA Pro' },
  { role: 'Coach Adjoint', name: 'David Fernandez', license: 'UEFA A' },
  { role: 'Préparateur Physique', name: 'Marc Voisin', license: 'DESJEPS Pro' },
  { role: 'Médecin & Kiné', name: 'Dr. Philippe Laurent', license: 'Staff Médical' },
];

/**
 * Onglet Groupe / Équipe Pro — Véritable cockpit de match, effectif et vestiaire.
 */
export const ProPlayerGroupScreen: React.FC = () => {
  const profile = useSessionProfile();
  const playerThemeCtx = usePlayerTheme();
  const themeColors = usePlayerThemeColors();
  const nav = useTabNavigationActions();
  const { data, refresh } = useDashboardData(profile);

  const [refreshing, setRefreshing] = useState(false);
  const [posFilter, setPosFilter] = useState<PositionFilter>('all');
  const [userRsvp, setUserRsvp] = useState<RsvpStatus>('yes');
  const [rsvpBusy, setRsvpBusy] = useState(false);

  const accent = themeColors.accent;
  const teamName = playerThemeCtx.clubName || 'FC ProDay Élite';

  // Identifier le prochain match pro
  const nextMatchEvent = useMemo((): TeamEvent | null => {
    const sorted = [...data.teamEvents].sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());
    return sorted.find((e) => e.starts_at.getTime() >= Date.now() - 2 * 3600 * 1000) ?? sorted[0] ?? null;
  }, [data.teamEvents]);

  const nextMatchItem = useMemo((): SeasonCalendarItem => {
    if (nextMatchEvent) {
      return {
        id: nextMatchEvent.id,
        team_event_id: nextMatchEvent.id,
        kind: 'team_event',
        title: nextMatchEvent.title || `${teamName} vs RC Grasse`,
        subtitle: 'National 2 · Journée 14',
        starts_at: nextMatchEvent.starts_at,
        city: nextMatchEvent.city || 'Stade Municipal des Lilas',
      };
    }
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 2);
    defaultDate.setHours(15, 0, 0, 0);
    return {
      id: 'demo-next-clash',
      kind: 'friendly_match',
      title: `${teamName} vs RC Grasse`,
      subtitle: 'National 2 · Choc J-14',
      starts_at: defaultDate,
      city: 'Stade Honneur · Paris',
    };
  }, [nextMatchEvent, teamName]);

  const handleRsvp = async (status: RsvpStatus) => {
    setUserRsvp(status);
    prodayHaptics.confirm();
    if (nextMatchEvent && profile?.uid) {
      setRsvpBusy(true);
      try {
        await teamEventsService.updateRsvp(nextMatchEvent.id, profile.uid, status);
      } catch {
        // Silencieux
      } finally {
        setRsvpBusy(false);
      }
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const filteredSquad = useMemo(() => {
    if (posFilter === 'all') return PRO_SQUAD;
    return PRO_SQUAD.filter((p) => p.group === posFilter);
  }, [posFilter]);

  if (!profile) return null;

  return (
    <TabScreenShell
      caption="GROUPE · ÉQUIPE PRO"
      title={teamName}
      subtitle="Effectif Pro · Choc de la Semaine · Vestiaire"
      flat
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: TAB_BAR_CONTENT_INSET + 28 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={accent} />
        }
      >
        {/* 1. HERO IDENTITÉ ÉQUIPE PRO */}
        <View style={[styles.teamHeroCard, { borderColor: `${accent}40` }]}>
          <View style={styles.heroTopRow}>
            <View style={[styles.crestContainer, { borderColor: `${accent}60`, backgroundColor: `${accent}18` }]}>
              <CrestWatermark width={34} height={40} color={accent} opacity={0.95} />
            </View>

            <View style={styles.heroMetaCol}>
              <ProDayText style={styles.heroTeamName} numberOfLines={1}>
                {teamName}
              </ProDayText>
              <ProDayText style={styles.heroSubMeta}>
                Groupe Élite · National 2
              </ProDayText>
              <View style={styles.licenseBadgeRow}>
                <View style={[styles.licensePill, { backgroundColor: '#22C55E1C', borderColor: '#22C55E60' }]}>
                  <Ionicons name="shield-checkmark" size={11} color="#22C55E" />
                  <ProDayText style={[styles.licenseText, { color: '#22C55E' }]}>
                    Effectif Professionnel Homologué FFF
                  </ProDayText>
                </View>
              </View>
            </View>
          </View>

          {/* Stats Bilan Saison */}
          <View style={styles.seasonStatsStrip}>
            <View style={styles.statCol}>
              <ProDayText style={styles.statVal}>14</ProDayText>
              <ProDayText style={styles.statLbl}>Matchs</ProDayText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <ProDayText style={[styles.statVal, { color: '#22C55E' }]}>11</ProDayText>
              <ProDayText style={styles.statLbl}>Victoires</ProDayText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <ProDayText style={[styles.statVal, { color: '#9CA3AF' }]}>2</ProDayText>
              <ProDayText style={styles.statLbl}>Nuls</ProDayText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <ProDayText style={[styles.statVal, { color: '#EF4444' }]}>1</ProDayText>
              <ProDayText style={styles.statLbl}>Défaite</ProDayText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <ProDayText style={[styles.statVal, { color: accent }]}>35</ProDayText>
              <ProDayText style={styles.statLbl}>1er (Pts)</ProDayText>
            </View>
          </View>
        </View>

        {/* 2. CHOC DE LA SEMAINE / PROCHAIN MATCH H2H */}
        <MatchNextUpCard
          item={nextMatchItem}
          onPress={() => {
            if (nextMatchEvent) nav.openTeamEvent(nextMatchEvent.id);
            else nav.setActiveTab('matchs');
          }}
          onRsvp={handleRsvp}
          onOpenCarpool={() => {
            if (nextMatchEvent) nav.openCarpool({ chapter: 'reserver', eventId: nextMatchEvent.id });
            else nav.setActiveTab('covoiturage');
          }}
          currentRsvp={userRsvp}
          rsvpBusy={rsvpBusy}
        />

        {/* 3. DYNAMIQUE & FORME (5 DERNIERS MATCHS) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <View style={styles.tagRow}>
                <Ionicons name="trending-up" size={13} color={accent} />
                <ProDayText style={[styles.sectionKicker, { color: accent }]}>
                  DYNAMIQUE DU GROUPE
                </ProDayText>
              </View>
              <ProDayText style={styles.sectionTitle}>
                5 Derniers Matchs Officiels
              </ProDayText>
            </View>

            <View style={styles.rankBadge}>
              <ProDayText style={styles.rankBadgeText}>Leader · +21 Diff</ProDayText>
            </View>
          </View>

          <View style={styles.formRow}>
            {DEMO_PRO_FORM.map((item, idx) => (
              <View key={idx} style={styles.formItem}>
                <View
                  style={[
                    styles.formBadge,
                    {
                      backgroundColor: item.result === 'V' ? '#22C55E20' : '#9CA3AF20',
                      borderColor: item.result === 'V' ? '#22C55E60' : '#9CA3AF60',
                    },
                  ]}
                >
                  <ProDayText
                    style={[
                      styles.formResultText,
                      { color: item.result === 'V' ? '#22C55E' : '#9CA3AF' },
                    ]}
                  >
                    {item.result}
                  </ProDayText>
                </View>
                <ProDayText style={styles.formScore}>{item.score}</ProDayText>
                <ProDayText numberOfLines={1} style={styles.formOpponent}>
                  {item.opponent}
                </ProDayText>
              </View>
            ))}
          </View>
        </View>

        {/* 4. EFFECTIF & CONVOCATIONS OFFICIELLES */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <View style={styles.tagRow}>
                <View style={[styles.tagDot, { backgroundColor: accent }]} />
                <ProDayText style={[styles.sectionKicker, { color: accent }]}>
                  EFFECTIF PRO
                </ProDayText>
              </View>
              <ProDayText style={styles.sectionTitle}>
                Roster du Groupe ({PRO_SQUAD.length} Joueurs)
              </ProDayText>
            </View>

            <View style={[styles.confirmedPill, { backgroundColor: `${accent}18`, borderColor: `${accent}40` }]}>
              <Ionicons name="checkmark-circle" size={12} color={accent} />
              <ProDayText style={[styles.confirmedText, { color: accent }]}>
                9/11 Confirmés
              </ProDayText>
            </View>
          </View>

          {/* Filtres par Poste */}
          <View style={styles.posFilterRow}>
            {[
              { id: 'all' as const, label: 'Tous' },
              { id: 'gk' as const, label: 'Gardiens' },
              { id: 'def' as const, label: 'Défenseurs' },
              { id: 'mid' as const, label: 'Milieux' },
              { id: 'att' as const, label: 'Attaquants' },
            ].map((tab) => {
              const active = posFilter === tab.id;
              return (
                <PressableSpring
                  key={tab.id}
                  onPress={() => {
                    prodayHaptics.press();
                    setPosFilter(tab.id);
                  }}
                  scaleTo={0.95}
                  haptic
                  style={[
                    styles.posTab,
                    active
                      ? [styles.posTabActive, { backgroundColor: `${accent}20`, borderColor: accent }]
                      : styles.posTabInactive,
                  ]}
                >
                  <ProDayText style={[styles.posTabText, active && { color: accent, fontWeight: '800' }]}>
                    {tab.label}
                  </ProDayText>
                </PressableSpring>
              );
            })}
          </View>

          {/* Liste Joueurs Pro */}
          <View style={styles.squadList}>
            {filteredSquad.map((player) => (
              <View key={player.id} style={styles.playerRow}>
                <View style={[styles.playerNumBox, { backgroundColor: '#1A1A24', borderColor: `${accent}35` }]}>
                  <ProDayText style={[styles.playerNumVal, { color: accent }]}>
                    {player.num}
                  </ProDayText>
                </View>

                <View style={styles.playerMetaCol}>
                  <ProDayText style={styles.playerRowName}>
                    {player.name}
                  </ProDayText>
                  <View style={styles.playerTagRow}>
                    <View style={[styles.playerPosTag, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
                      <ProDayText style={styles.playerPosText}>{player.pos}</ProDayText>
                    </View>
                    <ProDayText style={styles.playerOvrText}>Note {player.ovr}</ProDayText>
                  </View>
                </View>

                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor:
                        player.status === 'yes'
                          ? '#22C55E18'
                          : player.status === 'maybe'
                            ? '#F59E0B18'
                            : '#EF444418',
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      player.status === 'yes'
                        ? 'checkmark-circle'
                        : player.status === 'maybe'
                          ? 'time'
                          : 'close-circle'
                    }
                    size={12}
                    color={
                      player.status === 'yes'
                        ? '#22C55E'
                        : player.status === 'maybe'
                          ? '#F59E0B'
                          : '#EF4444'
                    }
                  />
                  <ProDayText
                    style={[
                      styles.statusPillText,
                      {
                        color:
                          player.status === 'yes'
                            ? '#22C55E'
                            : player.status === 'maybe'
                              ? '#F59E0B'
                              : '#EF4444',
                      },
                    ]}
                  >
                    {player.status === 'yes' ? 'Présent' : player.status === 'maybe' ? 'Incertain' : 'Absent'}
                  </ProDayText>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 5. DIRECTIVES & CAUSERIE DU STAFF */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <ProDayText style={[styles.sectionKicker, { color: accent }]}>
                VESTIAIRE PRO
              </ProDayText>
              <ProDayText style={styles.sectionTitle}>
                Directives & Logistique Match
              </ProDayText>
            </View>
          </View>

          <View style={styles.directiveCard}>
            <View style={styles.directiveTopRow}>
              <View style={[styles.priorityTag, { backgroundColor: '#EF444420', borderColor: '#EF444455' }]}>
                <ProDayText style={styles.priorityText}>CONSIGNES COACH</ProDayText>
              </View>
              <ProDayText style={styles.directiveDate}>Dimanche · J-J</ProDayText>
            </View>
            <ProDayText style={styles.directiveTitle}>
              Rassemblement & Causerie Vidéo Tactique
            </ProDayText>
            <ProDayText style={styles.directiveBody}>
              • 13h15 : Arrivée vestiaire & remise des dotations de match.{'\n'}
              • 13h30 : Causerie tactique et plan de jeu sur coup de pied arrêté.{'\n'}
              • 14h15 : Début de l'échauffement sur le terrain d'honneur.
            </ProDayText>
          </View>
        </View>

        {/* 6. STAFF TECHNIQUE & MÉDICAL */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <ProDayText style={[styles.sectionKicker, { color: accent }]}>
                ENCADREMENT
              </ProDayText>
              <ProDayText style={styles.sectionTitle}>
                Staff Technique & Médical
              </ProDayText>
            </View>
          </View>

          <View style={styles.staffList}>
            {PRO_STAFF.map((st, idx) => (
              <View key={idx} style={styles.staffRow}>
                <View style={[styles.staffIconCircle, { backgroundColor: `${accent}16`, borderColor: `${accent}35` }]}>
                  <Ionicons name="person" size={15} color={accent} />
                </View>
                <View style={styles.staffMetaCol}>
                  <ProDayText style={styles.staffName}>{st.name}</ProDayText>
                  <ProDayText style={styles.staffRole}>{st.role} · {st.license}</ProDayText>
                </View>
                <PressableSpring
                  onPress={() => nav.setActiveTab('messages')}
                  scaleTo={0.92}
                  haptic
                  style={styles.staffMsgBtn}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={16} color="#9CA3AF" />
                </PressableSpring>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </TabScreenShell>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 16,
    gap: 14,
    paddingTop: 6,
  },
  teamHeroCard: {
    backgroundColor: '#14141A',
    borderWidth: 1.2,
    borderRadius: 20,
    padding: 18,
    gap: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  crestContainer: {
    width: 58,
    height: 58,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroMetaCol: {
    flex: 1,
    gap: 2,
  },
  heroTeamName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  heroSubMeta: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  licenseBadgeRow: {
    marginTop: 4,
  },
  licensePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  licenseText: {
    fontSize: 10,
    fontWeight: '800',
  },
  seasonStatsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0E0E14',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statCol: {
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  statVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  statLbl: {
    fontSize: 9.5,
    color: '#71717A',
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  sectionCard: {
    backgroundColor: '#14141A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sectionKicker: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  rankBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  rankBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E5E7EB',
  },
  confirmedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  confirmedText: {
    fontSize: 11,
    fontWeight: '800',
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  formItem: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  formBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formResultText: {
    fontSize: 13,
    fontWeight: '900',
  },
  formScore: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#E5E7EB',
  },
  formOpponent: {
    fontSize: 9,
    fontWeight: '600',
    color: '#71717A',
    maxWidth: 58,
    textAlign: 'center',
  },
  posFilterRow: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 2,
  },
  posTab: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  posTabInactive: {
    backgroundColor: '#101016',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  posTabActive: {},
  posTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B8B9A',
  },
  squadList: {
    gap: 6,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E0E14',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  playerNumBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerNumVal: {
    fontSize: 13,
    fontWeight: '900',
  },
  playerMetaCol: {
    flex: 1,
    gap: 2,
  },
  playerRowName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  playerTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playerPosTag: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  playerPosText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#9CA3AF',
  },
  playerOvrText: {
    fontSize: 10,
    color: '#71717A',
    fontWeight: '600',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  directiveCard: {
    backgroundColor: '#0E0E14',
    padding: 12,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  directiveTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priorityTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#EF4444',
    letterSpacing: 0.5,
  },
  directiveDate: {
    fontSize: 10,
    color: '#71717A',
    fontWeight: '600',
  },
  directiveTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  directiveBody: {
    fontSize: 11.5,
    color: '#9CA3AF',
    lineHeight: 17,
  },
  staffList: {
    gap: 6,
  },
  staffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#0E0E14',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  staffIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffMetaCol: {
    flex: 1,
    gap: 1,
  },
  staffName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  staffRole: {
    fontSize: 10.5,
    color: '#8B8B9A',
    fontWeight: '600',
  },
  staffMsgBtn: {
    padding: 6,
  },
});

