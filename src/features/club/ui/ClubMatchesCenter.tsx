/**
 * Pôle Club — Centralisateur des Matchs, Amicaux & Compétitions
 * Design System Apple Obsidian Glass · Zéro émoji unicode.
 */
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { PressableSpring } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import type { IconName } from '../../../components/ui/iconNames';
import { ProDayText } from '../../../components/ui/ProDayText';
import { useClubTheme } from '../shell/ClubThemeContext';
import { APPLE_TYPOGRAPHY } from '../../../theme/appleTypography';
import { clubRadius, clubSpace } from '../theme/clubDesignSystem';

export type MatchCategoryType = 'all' | 'fff' | 'friendly' | 'cup' | 'plateau';

export type FixtureItem = {
  id: string;
  type: 'fff' | 'friendly' | 'cup' | 'plateau';
  typeLabel: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  dateStr: string;
  timeStr: string;
  venue: string;
  isHome: boolean;
  status: 'upcoming' | 'live' | 'finished';
  competition: string;
  refereeAssigned: boolean;
  convocationsSent: boolean;
};

export type LeaderboardPlayer = {
  rank: number;
  name: string;
  team: string;
  goals: number;
  cleanSheets?: number;
  matches: number;
};

export const DEMO_FIXTURES: FixtureItem[] = [
  {
    id: 'fix-1',
    type: 'fff',
    typeLabel: 'Championnat R1',
    homeTeam: 'ProDay FC (Seniors A)',
    awayTeam: 'RC France Colombes',
    dateStr: 'Samedi 12 Sept.',
    timeStr: '18:00',
    venue: 'Stade Municipal · Terrain d’Honneur',
    isHome: true,
    status: 'upcoming',
    competition: 'Régional 1 - Poule B',
    refereeAssigned: true,
    convocationsSent: true,
  },
  {
    id: 'fix-2',
    type: 'fff',
    typeLabel: 'Championnat U17',
    homeTeam: 'FC Versailles 78',
    awayTeam: 'ProDay FC (U17 R2)',
    dateStr: 'Dimanche 13 Sept.',
    timeStr: '13:30',
    venue: 'Stade Montbauron · Terrain Synthétique',
    isHome: false,
    status: 'upcoming',
    competition: 'U17 Régional 2',
    refereeAssigned: true,
    convocationsSent: true,
  },
  {
    id: 'fix-3',
    type: 'friendly',
    typeLabel: 'Match Amical',
    homeTeam: 'ProDay FC (U15)',
    awayTeam: 'AC Boulogne-Billancourt',
    dateStr: 'Mercredi 16 Sept.',
    timeStr: '16:00',
    venue: 'Complexe Sportif ProDay · Synthétique A',
    isHome: true,
    status: 'upcoming',
    competition: 'Préparation mi-saison',
    refereeAssigned: false,
    convocationsSent: false,
  },
  {
    id: 'fix-4',
    type: 'plateau',
    typeLabel: 'Plateau U9',
    homeTeam: 'Plateau Inter-Clubs (4 équipes)',
    awayTeam: 'Puteaux, Nanterre, ProDay FC',
    dateStr: 'Samedi 19 Sept.',
    timeStr: '10:00',
    venue: 'Stade Municipal · Terrains Réduits',
    isHome: true,
    status: 'upcoming',
    competition: 'Rassemblement District 92',
    refereeAssigned: false,
    convocationsSent: true,
  },
];

export const DEMO_TOP_SCORERS: LeaderboardPlayer[] = [
  { rank: 1, name: 'Lucas Moreau', team: 'U17 R2', goals: 9, matches: 6 },
  { rank: 2, name: 'Yanis Benali', team: 'Seniors R1', goals: 7, matches: 5 },
  { rank: 3, name: 'Adam Touré', team: 'U15 R2', goals: 6, matches: 6 },
  { rank: 4, name: 'Enzo Vallet', team: 'Seniors B', goals: 4, matches: 4 },
];

export const DEMO_STANDINGS_PREVIEW = [
  { rank: 1, team: 'ProDay FC (Seniors)', pts: 15, j: 5, diff: '+8' },
  { rank: 2, team: 'RC France', pts: 12, j: 5, diff: '+5' },
  { rank: 3, team: 'US Torcy', pts: 10, j: 5, diff: '+2' },
  { rank: 4, team: 'CS Meaux', pts: 7, j: 5, diff: '-1' },
];

type Props = {
  fixtures?: FixtureItem[];
  onSelectFixture?: (fixtureId: string) => void;
};

export function ClubMatchesCenter({
  fixtures = DEMO_FIXTURES,
  onSelectFixture,
}: Props) {
  const { tokens } = useClubTheme();
  const [filter, setFilter] = useState<MatchCategoryType>('all');
  const [activeTab, setActiveTab] = useState<'fixtures' | 'matrix' | 'scorers'>('fixtures');
  const [friendlyModalOpen, setFriendlyModalOpen] = useState(false);

  // Friendly match form
  const [friendlyCategory, setFriendlyCategory] = useState('U17 R2');
  const [friendlyDate, setFriendlyDate] = useState('Mercredi 23 Septembre 2026');
  const [friendlyVenue, setFriendlyVenue] = useState('Domicile (Synthétique A)');
  const [friendlyReferee, setFriendlyReferee] = useState(true);

  const filteredFixtures = useMemo(() => {
    if (filter === 'all') return fixtures;
    return fixtures.filter((f) => f.type === filter);
  }, [fixtures, filter]);

  const handleCreateFriendly = () => {
    Alert.alert(
      'Annonce amicale publiée',
      `Votre proposition de match amical pour ${friendlyCategory} le ${friendlyDate} (${friendlyVenue}) a été transmise aux clubs partenaires du district.`,
    );
    setFriendlyModalOpen(false);
  };

  return (
    <View style={styles.container}>
      {/* 1. Bouton Action : Créer un Match Amical Inter-Clubs */}
      <View style={styles.topBanner}>
        <View style={styles.bannerInfo}>
          <ProDayText style={[styles.bannerTitle, { color: tokens.foreground }]}>
            Organisation des Rencontres
          </ProDayText>
          <ProDayText style={[styles.bannerSubtitle, { color: tokens.muted }]}>
            Championnats FFF, amicaux, tournois & rassemblements
          </ProDayText>
        </View>

        <PressableSpring
          onPress={() => setFriendlyModalOpen(true)}
          style={[styles.createFriendlyBtn, { backgroundColor: tokens.accent }]}
          scaleTo={0.97}
        >
          <Icon name="add" size={16} color="#000000" />
          <ProDayText style={styles.createFriendlyBtnText}>Proposer Amical</ProDayText>
        </PressableSpring>
      </View>

      {/* 2. Onglets Principaux (Matchs · Classements · Buteurs) */}
      <View style={[styles.tabBar, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
        <PressableSpring
          onPress={() => setActiveTab('fixtures')}
          style={[styles.tabItem, activeTab === 'fixtures' && { backgroundColor: tokens.accentSoft }]}
          scaleTo={0.97}
        >
          <ProDayText
            style={[
              styles.tabText,
              { color: activeTab === 'fixtures' ? tokens.accent : tokens.muted },
            ]}
          >
            Rencontres
          </ProDayText>
        </PressableSpring>

        <PressableSpring
          onPress={() => setActiveTab('matrix')}
          style={[styles.tabItem, activeTab === 'matrix' && { backgroundColor: tokens.accentSoft }]}
          scaleTo={0.97}
        >
          <ProDayText
            style={[
              styles.tabText,
              { color: activeTab === 'matrix' ? tokens.accent : tokens.muted },
            ]}
          >
            Classements FFF
          </ProDayText>
        </PressableSpring>

        <PressableSpring
          onPress={() => setActiveTab('scorers')}
          style={[styles.tabItem, activeTab === 'scorers' && { backgroundColor: tokens.accentSoft }]}
          scaleTo={0.97}
        >
          <ProDayText
            style={[
              styles.tabText,
              { color: activeTab === 'scorers' ? tokens.accent : tokens.muted },
            ]}
          >
            Buteurs Club
          </ProDayText>
        </PressableSpring>
      </View>

      {/* VUE 1 : FIXTURES */}
      {activeTab === 'fixtures' ? (
        <>
          {/* Filtres Pilules */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsScroll}
          >
            {(
              [
                { id: 'all', label: 'Tous les matchs' },
                { id: 'fff', label: 'Championnats FFF' },
                { id: 'friendly', label: 'Matchs Amicaux' },
                { id: 'cup', label: 'Coupes & Tournois' },
                { id: 'plateau', label: 'Plateaux École de Foot' },
              ] as { id: MatchCategoryType; label: string }[]
            ).map((p) => {
              const active = filter === p.id;
              return (
                <PressableSpring
                  key={p.id}
                  onPress={() => setFilter(p.id)}
                  style={[
                    styles.filterPill,
                    active
                      ? { backgroundColor: tokens.accent, borderColor: tokens.accent }
                      : { backgroundColor: tokens.surface, borderColor: tokens.border },
                  ]}
                  scaleTo={0.96}
                >
                  <ProDayText
                    style={[
                      styles.filterPillText,
                      active ? { color: '#000000', fontWeight: '700' } : { color: tokens.muted },
                    ]}
                  >
                    {p.label}
                  </ProDayText>
                </PressableSpring>
              );
            })}
          </ScrollView>

          {/* Liste des Cartes de Matchs */}
          <View style={styles.fixturesList}>
            {filteredFixtures.map((fixture) => (
              <PressableSpring
                key={fixture.id}
                onPress={() => onSelectFixture?.(fixture.id)}
                style={[styles.fixtureCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
                scaleTo={0.98}
              >
                <View style={styles.cardTopRow}>
                  <View style={[styles.badgeType, { backgroundColor: tokens.accentSoft }]}>
                    <Icon name="trophy" size={13} color={tokens.accent} />
                    <ProDayText style={[styles.badgeTypeText, { color: tokens.accent }]}>
                      {fixture.typeLabel}
                    </ProDayText>
                  </View>

                  <View style={styles.dateTimeBadge}>
                    <Icon name="calendar" size={13} color={tokens.muted} />
                    <ProDayText style={[styles.dateTimeText, { color: tokens.muted }]}>
                      {fixture.dateStr} à {fixture.timeStr}
                    </ProDayText>
                  </View>
                </View>

                {/* Score / Affiche */}
                <View style={styles.matchupRow}>
                  <View style={styles.teamSide}>
                    <ProDayText style={[styles.teamName, { color: tokens.foreground }]} numberOfLines={1}>
                      {fixture.homeTeam}
                    </ProDayText>
                    {fixture.isHome ? (
                      <View style={styles.homePill}>
                        <ProDayText style={styles.homePillText}>DOMICILE</ProDayText>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.vsBox}>
                    <ProDayText style={[styles.vsText, { color: tokens.muted }]}>VS</ProDayText>
                  </View>

                  <View style={[styles.teamSide, { alignItems: 'flex-end' }]}>
                    <ProDayText style={[styles.teamName, { color: tokens.foreground }]} numberOfLines={1}>
                      {fixture.awayTeam}
                    </ProDayText>
                    {!fixture.isHome ? (
                      <View style={[styles.homePill, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                        <ProDayText style={[styles.homePillText, { color: '#3B82F6' }]}>
                          EXTÉRIEUR
                        </ProDayText>
                      </View>
                    ) : null}
                  </View>
                </View>

                {/* Lieu & Statuts */}
                <View style={[styles.cardFooter, { borderTopColor: tokens.border }]}>
                  <View style={styles.venueRow}>
                    <Icon name="location" size={14} color={tokens.muted} />
                    <ProDayText style={[styles.venueText, { color: tokens.muted }]}>
                      {fixture.venue}
                    </ProDayText>
                  </View>

                  <View style={styles.indicatorsRow}>
                    <View
                      style={[
                        styles.indicatorTag,
                        {
                          backgroundColor: fixture.refereeAssigned
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(239, 68, 68, 0.15)',
                        },
                      ]}
                    >
                      <Icon
                        name="shield"
                        size={12}
                        color={fixture.refereeAssigned ? '#10B981' : '#EF4444'}
                      />
                      <ProDayText
                        style={[
                          styles.indicatorTagText,
                          { color: fixture.refereeAssigned ? '#10B981' : '#EF4444' },
                        ]}
                      >
                        {fixture.refereeAssigned ? 'Arbitre désigné' : 'Sans arbitre'}
                      </ProDayText>
                    </View>

                    <View
                      style={[
                        styles.indicatorTag,
                        {
                          backgroundColor: fixture.convocationsSent
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(245, 158, 11, 0.15)',
                        },
                      ]}
                    >
                      <Icon
                        name="checkmark-circle"
                        size={12}
                        color={fixture.convocationsSent ? '#10B981' : '#F59E0B'}
                      />
                      <ProDayText
                        style={[
                          styles.indicatorTagText,
                          { color: fixture.convocationsSent ? '#10B981' : '#F59E0B' },
                        ]}
                      >
                        {fixture.convocationsSent ? 'Convocs prêtes' : 'À préparer'}
                      </ProDayText>
                    </View>
                  </View>
                </View>
              </PressableSpring>
            ))}
          </View>
        </>
      ) : null}

      {/* VUE 2 : CLASSEMENTS FFF */}
      {activeTab === 'matrix' ? (
        <View style={[styles.matrixCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          <View style={styles.matrixHeader}>
            <ProDayText style={[styles.matrixTitle, { color: tokens.foreground }]}>
              Régional 1 - Poule B
            </ProDayText>
            <ProDayText style={[styles.matrixUpdated, { color: tokens.accent }]}>
              Synchro FFF Direct
            </ProDayText>
          </View>

          <View style={[styles.matrixTableRow, styles.matrixTableHead, { borderBottomColor: tokens.border }]}>
            <ProDayText style={[styles.colRank, { color: tokens.muted }]}>#</ProDayText>
            <ProDayText style={[styles.colTeam, { color: tokens.muted }]}>Club</ProDayText>
            <ProDayText style={[styles.colPts, { color: tokens.muted }]}>Pts</ProDayText>
            <ProDayText style={[styles.colJ, { color: tokens.muted }]}>J</ProDayText>
            <ProDayText style={[styles.colDiff, { color: tokens.muted }]}>Diff</ProDayText>
          </View>

          {DEMO_STANDINGS_PREVIEW.map((row) => (
            <View
              key={row.rank}
              style={[
                styles.matrixTableRow,
                row.team.includes('ProDay FC') && { backgroundColor: tokens.accentSoft },
                { borderBottomColor: tokens.border },
              ]}
            >
              <ProDayText style={[styles.colRank, { color: tokens.foreground }]}>{row.rank}</ProDayText>
              <ProDayText style={[styles.colTeam, { color: tokens.foreground }]}>{row.team}</ProDayText>
              <ProDayText style={[styles.colPts, { color: tokens.accent, fontWeight: '700' }]}>
                {row.pts}
              </ProDayText>
              <ProDayText style={[styles.colJ, { color: tokens.muted }]}>{row.j}</ProDayText>
              <ProDayText style={[styles.colDiff, { color: tokens.foreground }]}>{row.diff}</ProDayText>
            </View>
          ))}
        </View>
      ) : null}

      {/* VUE 3 : BUTEURS & CLEAN SHEETS */}
      {activeTab === 'scorers' ? (
        <View style={[styles.matrixCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          <View style={styles.matrixHeader}>
            <ProDayText style={[styles.matrixTitle, { color: tokens.foreground }]}>
              Classement des Buteurs du Club
            </ProDayText>
            <ProDayText style={[styles.matrixUpdated, { color: tokens.muted }]}>
              Toutes équipes
            </ProDayText>
          </View>

          {DEMO_TOP_SCORERS.map((s) => (
            <View key={s.rank} style={[styles.scorerRow, { borderBottomColor: tokens.border }]}>
              <View style={styles.scorerRankBox}>
                <ProDayText style={[styles.scorerRankNum, { color: tokens.accent }]}>
                  {s.rank}
                </ProDayText>
              </View>
              <View style={styles.scorerInfo}>
                <ProDayText style={[styles.scorerName, { color: tokens.foreground }]}>{s.name}</ProDayText>
                <ProDayText style={[styles.scorerTeam, { color: tokens.muted }]}>
                  {s.team} · {s.matches} matchs joués
                </ProDayText>
              </View>
              <View style={[styles.goalPill, { backgroundColor: tokens.accentSoft }]}>
                <Icon name="football" size={14} color={tokens.accent} />
                <ProDayText style={[styles.goalPillText, { color: tokens.accent }]}>
                  {s.goals} buts
                </ProDayText>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {/* Modal Match Amical Inter-Clubs */}
      <Modal
        visible={friendlyModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setFriendlyModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[styles.modalBox, { backgroundColor: '#12151C', borderColor: tokens.border }]}>
            <View style={styles.modalHeader}>
              <View>
                <ProDayText style={[styles.modalTitle, { color: tokens.foreground }]}>
                  Organiser un Match Amical
                </ProDayText>
                <ProDayText style={[styles.modalSubtitle, { color: tokens.muted }]}>
                  Diffuser une invitation aux clubs de la ligue
                </ProDayText>
              </View>
              <TouchableOpacity onPress={() => setFriendlyModalOpen(false)}>
                <Icon name="close" size={24} color={tokens.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <ProDayText style={[styles.formLabel, { color: tokens.muted }]}>
                  Équipe concernée
                </ProDayText>
                <TextInput
                  value={friendlyCategory}
                  onChangeText={setFriendlyCategory}
                  style={[styles.formInput, { backgroundColor: '#181C26', borderColor: tokens.border, color: tokens.foreground }]}
                />
              </View>

              <View style={styles.formGroup}>
                <ProDayText style={[styles.formLabel, { color: tokens.muted }]}>
                  Date & Heure souhaitée
                </ProDayText>
                <TextInput
                  value={friendlyDate}
                  onChangeText={setFriendlyDate}
                  style={[styles.formInput, { backgroundColor: '#181C26', borderColor: tokens.border, color: tokens.foreground }]}
                />
              </View>

              <View style={styles.formGroup}>
                <ProDayText style={[styles.formLabel, { color: tokens.muted }]}>
                  Lieu
                </ProDayText>
                <TextInput
                  value={friendlyVenue}
                  onChangeText={setFriendlyVenue}
                  style={[styles.formInput, { backgroundColor: '#181C26', borderColor: tokens.border, color: tokens.foreground }]}
                />
              </View>

              <View style={[styles.switchRow, { backgroundColor: '#181C26', borderColor: tokens.border }]}>
                <View>
                  <ProDayText style={[styles.switchLabel, { color: tokens.foreground }]}>
                    Arbitre officiel demandé
                  </ProDayText>
                  <ProDayText style={[styles.switchHint, { color: tokens.muted }]}>
                    Déclaration FFF Footclubs
                  </ProDayText>
                </View>
                <TouchableOpacity
                  onPress={() => setFriendlyReferee((v) => !v)}
                  style={[
                    styles.toggleBtn,
                    { backgroundColor: friendlyReferee ? tokens.accent : '#2A2F3D' },
                  ]}
                >
                  <View
                    style={[
                      styles.toggleKnob,
                      friendlyReferee ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' },
                    ]}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <PressableSpring
                onPress={handleCreateFriendly}
                style={[styles.publishBtn, { backgroundColor: tokens.accent }]}
                scaleTo={0.97}
              >
                <ProDayText style={styles.publishBtnText}>Diffuser l'annonce</ProDayText>
              </PressableSpring>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: clubSpace.lg,
    paddingTop: 8,
    gap: 14,
  },
  topBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerInfo: {
    flex: 1,
  },
  bannerTitle: {
    ...APPLE_TYPOGRAPHY.headline,
  },
  bannerSubtitle: {
    ...APPLE_TYPOGRAPHY.caption1,
    marginTop: 2,
  },
  createFriendlyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  createFriendlyBtnText: {
    ...APPLE_TYPOGRAPHY.footnote,
    fontWeight: '700',
    color: '#000000',
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabText: {
    ...APPLE_TYPOGRAPHY.footnote,
    fontWeight: '600',
  },
  pillsScroll: {
    gap: 8,
    paddingBottom: 4,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterPillText: {
    ...APPLE_TYPOGRAPHY.footnote,
  },
  fixturesList: {
    gap: 12,
    paddingBottom: 40,
  },
  fixtureCard: {
    borderRadius: clubRadius.lg,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeTypeText: {
    ...APPLE_TYPOGRAPHY.caption1,
    fontWeight: '700',
  },
  dateTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateTimeText: {
    ...APPLE_TYPOGRAPHY.caption1,
  },
  matchupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  teamSide: {
    flex: 1,
    gap: 4,
  },
  teamName: {
    ...APPLE_TYPOGRAPHY.headline,
  },
  homePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  homePillText: {
    ...APPLE_TYPOGRAPHY.caption1,
    color: '#10B981',
    fontWeight: '700',
    fontSize: 10,
  },
  vsBox: {
    paddingHorizontal: 12,
  },
  vsText: {
    ...APPLE_TYPOGRAPHY.caption1,
    fontWeight: '800',
  },
  cardFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  venueText: {
    ...APPLE_TYPOGRAPHY.caption1,
  },
  indicatorsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  indicatorTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  indicatorTagText: {
    ...APPLE_TYPOGRAPHY.caption1,
    fontWeight: '600',
  },
  matrixCard: {
    borderRadius: clubRadius.lg,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  matrixHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  matrixTitle: {
    ...APPLE_TYPOGRAPHY.headline,
  },
  matrixUpdated: {
    ...APPLE_TYPOGRAPHY.caption1,
    fontWeight: '600',
  },
  matrixTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  matrixTableHead: {
    paddingBottom: 6,
  },
  colRank: { width: 30, ...APPLE_TYPOGRAPHY.footnote, fontWeight: '600' },
  colTeam: { flex: 1, ...APPLE_TYPOGRAPHY.subheadline },
  colPts: { width: 45, textAlign: 'center', ...APPLE_TYPOGRAPHY.subheadline },
  colJ: { width: 35, textAlign: 'center', ...APPLE_TYPOGRAPHY.footnote },
  colDiff: { width: 45, textAlign: 'right', ...APPLE_TYPOGRAPHY.footnote },
  scorerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 12,
  },
  scorerRankBox: {
    width: 24,
    alignItems: 'center',
  },
  scorerRankNum: {
    ...APPLE_TYPOGRAPHY.headline,
  },
  scorerInfo: {
    flex: 1,
  },
  scorerName: {
    ...APPLE_TYPOGRAPHY.subheadline,
    fontWeight: '700',
  },
  scorerTeam: {
    ...APPLE_TYPOGRAPHY.caption1,
    marginTop: 2,
  },
  goalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  goalPillText: {
    ...APPLE_TYPOGRAPHY.caption1,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: { ...APPLE_TYPOGRAPHY.title2 },
  modalSubtitle: { ...APPLE_TYPOGRAPHY.caption1, marginTop: 2 },
  modalBody: { gap: 10 },
  formGroup: { gap: 4 },
  formLabel: { ...APPLE_TYPOGRAPHY.caption1 },
  formInput: {
    height: 42,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    ...APPLE_TYPOGRAPHY.body,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  switchLabel: { ...APPLE_TYPOGRAPHY.subheadline, fontWeight: '600' },
  switchHint: { ...APPLE_TYPOGRAPHY.caption1, marginTop: 2 },
  toggleBtn: {
    width: 44,
    height: 26,
    borderRadius: 13,
    padding: 2,
    justifyContent: 'center',
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },
  modalFooter: { marginTop: 6 },
  publishBtn: {
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  publishBtnText: {
    ...APPLE_TYPOGRAPHY.subheadline,
    fontWeight: '700',
    color: '#000000',
  },
});
