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
import { ProDayText } from '../../../components/ui/ProDayText';
import { useClubTheme } from '../shell/ClubThemeContext';
import { useClubShellNav } from '../shell/ClubShellNavContext';
import type { LeagueStandingRow } from '../../../components/matchs/EliteLeagueStandings';
import { APPLE_TYPOGRAPHY } from '../../../theme/appleTypography';
import { clubRadius, clubSpace } from '../theme/clubDesignSystem';
import { ClubPill } from './clubUi';
import { CLUB_TOKENS } from '../theme/clubTokens';

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

export type FriendlyStatusV4 = 'brouillon' | 'proposition' | 'confirme' | 'reporte' | 'termine';
export type FriendlyTerritory =
  | 'Métropole'
  | 'Guadeloupe (971)'
  | 'Martinique (972)'
  | 'Guyane (973)'
  | 'La Réunion (974)'
  | 'Mayotte (976)'
  | 'Autre Outre-mer';

export type FriendlyMatchV4 = {
  id: string;
  opponentClub: string;
  category: string;
  territory: FriendlyTerritory;
  dateStr: string;
  timeStr: string;
  venue: string;
  status: FriendlyStatusV4;
  homeOrAway: 'Domicile' | 'Extérieur';
  format: string;
  refereeType: string;
  notes?: string;
};


type Props = {
  fixtures?: FixtureItem[];
  topScorers?: LeaderboardPlayer[];
  onSelectFixture?: (fixtureId: string) => void;
};

export function getFriendlyStatusLabel(st: FriendlyStatusV4): string {
  switch (st) {
    case 'brouillon':
      return 'Brouillon';
    case 'proposition':
      return 'Proposition';
    case 'confirme':
      return 'Confirmé';
    case 'reporte':
      return 'Reporté';
    case 'termine':
      return 'Terminé';
  }
}

export function getFriendlyStatusColor(st: FriendlyStatusV4): { bg: string; text: string } {
  switch (st) {
    case 'brouillon':
      return { bg: 'rgba(156, 163, 175, 0.2)', text: '#9CA3AF' };
    case 'proposition':
      return { bg: 'rgba(59, 130, 246, 0.2)', text: '#3B82F6' };
    case 'confirme':
      return { bg: 'rgba(16, 185, 129, 0.2)', text: '#10B981' };
    case 'reporte':
      return { bg: 'rgba(245, 158, 11, 0.2)', text: '#F59E0B' };
    case 'termine':
      return { bg: 'rgba(107, 114, 128, 0.2)', text: '#6B7280' };
  }
}

export function ClubMatchesCenter({
  fixtures = [],
  topScorers = [],
  onSelectFixture,
}: Props) {
  const { tokens } = useClubTheme();
  const shellNav = useClubShellNav();
  // Classement réel de la compétition du club ; aucun championnat fictif n'est dérivé d'une seed.
  const poolStandings = useMemo<LeagueStandingRow[]>(() => [], []);
  const [filter, setFilter] = useState<MatchCategoryType>('all');
  const [activeTab, setActiveTab] = useState<'fixtures' | 'friendly' | 'matrix' | 'scorers'>('fixtures');
  const [friendlyModalOpen, setFriendlyModalOpen] = useState(false);

  // Live Score outdoor state (Page 15)
  const [liveHomeScore, setLiveHomeScore] = useState(0);
  const [liveAwayScore, setLiveAwayScore] = useState(0);
  const [liveMinute, setLiveMinute] = useState(0);
  const [liveStatus, setLiveStatus] = useState<'1ère MT' | 'Mi-temps' | '2ème MT' | 'Terminé'>('1ère MT');

  // Friendly matches state (Page 16)
  const [friendlyMatchesList, setFriendlyMatchesList] = useState<FriendlyMatchV4[]>([]);
  const [friendlyStatusFilter, setFriendlyStatusFilter] = useState<'all' | FriendlyStatusV4>('all');
  const [friendlyCategory, setFriendlyCategory] = useState('U17 R2');
  const [friendlyOpponent, setFriendlyOpponent] = useState('');
  const [friendlyTerritory, setFriendlyTerritory] = useState<FriendlyTerritory>('Métropole');
  const [friendlyDate, setFriendlyDate] = useState('Mercredi 23 Septembre 2026');
  const [friendlyVenue, setFriendlyVenue] = useState('Domicile (Synthétique A)');
  const [friendlyFormat, setFriendlyFormat] = useState('2x45 min');
  const [friendlyReferee, setFriendlyReferee] = useState('Arbitrage officiel désigné');
  const [friendlyInitialStatus, setFriendlyInitialStatus] = useState<FriendlyStatusV4>('proposition');

  const filteredFixtures = useMemo(() => {
    if (filter === 'all') return fixtures;
    return fixtures.filter((f) => f.type === filter);
  }, [fixtures, filter]);

  const updateFriendlyStatus = (id: string, newStatus: FriendlyStatusV4) => {
    setFriendlyMatchesList((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m)),
    );
    Alert.alert('Statut mis à jour', `Le statut du match a été mis à jour : ${getFriendlyStatusLabel(newStatus)}`);
  };

  const handleCreateFriendly = () => {
    if (!friendlyOpponent.trim()) {
      Alert.alert('Club adverse requis', 'Veuillez saisir le nom du club adverse.');
      return;
    }
    const newMatch: FriendlyMatchV4 = {
      id: `fr-${Date.now()}`,
      opponentClub: friendlyOpponent.trim(),
      category: friendlyCategory,
      territory: friendlyTerritory,
      dateStr: friendlyDate,
      timeStr: '19:00',
      venue: friendlyVenue,
      status: friendlyInitialStatus,
      homeOrAway: friendlyVenue.toLowerCase().includes('domicile') ? 'Domicile' : 'Extérieur',
      format: friendlyFormat,
      refereeType: friendlyReferee,
    };
    setFriendlyMatchesList((prev) => [newMatch, ...prev]);
    Alert.alert(
      'Aperçu local',
      `Ce match contre ${friendlyOpponent.trim()} (${friendlyTerritory}) n’est pas encore persisté. Créez une invitation réelle depuis « Matchs amicaux » (Menu → Sport) — le parcours Firestore accepte/ refuse/ contre-propose y est branché.`,
    );
    setFriendlyOpponent('');
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
            Championnats FFF, amicaux autonomes, score en direct
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

      {/* 2. Onglets Principaux (Matchs & Direct · Vrais Amicaux · Classements · Buteurs) */}
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
            Direct & Matchs
          </ProDayText>
        </PressableSpring>

        <PressableSpring
          onPress={() => setActiveTab('friendly')}
          style={[styles.tabItem, activeTab === 'friendly' && { backgroundColor: tokens.accentSoft }]}
          scaleTo={0.97}
        >
          <ProDayText
            style={[
              styles.tabText,
              { color: activeTab === 'friendly' ? tokens.accent : tokens.muted },
            ]}
          >
            Vrais Amicaux
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
            Buteurs
          </ProDayText>
        </PressableSpring>
      </View>

      {/* VUE 1 : FIXTURES & DIRECT (PAGE 15 SPÉCIFICATIONS V4) */}
      {activeTab === 'fixtures' ? (
        <>
          {/* SECTION CAPTURE VIVE — honnête : aucune diffusion en cours n'est inventée.
              La saisie manuelle bord de touche (page 15) reste toujours disponible. */}
          <View style={[styles.liveOutdoorCard, { backgroundColor: tokens.surface, borderColor: `${tokens.accent}50` }]}>
            <View style={styles.liveHeaderRow}>
              <View style={[styles.liveBadge, { backgroundColor: tokens.accentSoft, borderColor: tokens.accent }]}>
                <Icon name="flash" size={13} color={tokens.accent} />
                <ProDayText style={[styles.liveBadgeText, { color: tokens.accent }]}>
                  SAISIE LIVE — BORD DE TOUCHE
                </ProDayText>
              </View>
            </View>

            <ProDayText style={[styles.liveHintText, { color: tokens.muted }]}>
              Aucune diffusion en cours. Le score saisi ici est local à cet écran : ouvrez le hub d’un match pour enregistrer un score réel en base.
            </ProDayText>

            {/* Secours bord de touche & statut diffusion */}
            <View style={[styles.touchlineFooter, { borderTopColor: tokens.border }]}>
              <View style={styles.touchlineInfoRow}>
                <Icon name="checkmark-circle" size={13} color="#10B981" />
                <ProDayText style={[styles.touchlineInfoText, { color: tokens.muted }]}>
                  Saisie manuelle bord de touche toujours disponible en secours
                </ProDayText>
              </View>
              <PressableSpring
                onPress={() => onSelectFixture?.(filteredFixtures[0]?.id ?? '')}
                style={[styles.liveHubBtn, { backgroundColor: tokens.accent }]}
                scaleTo={0.96}
              >
                <Icon name="trophy" size={13} color="#000000" />
                <ProDayText style={styles.liveHubBtnText}>Feuille de match</ProDayText>
              </PressableSpring>
            </View>
          </View>

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
                <ClubPill
                  key={p.id}
                  label={p.label}
                  active={active}
                  onPress={() => setFilter(p.id)}
                />
              );
            })}
          </ScrollView>

          {/* Liste des Cartes de Matchs */}
          <View style={styles.fixturesList}>
            {filteredFixtures.length === 0 ? (
              <View style={[styles.emptyStateCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
                <Icon name="calendar" size={22} color={tokens.muted} />
                <ProDayText style={[styles.emptyStateTitle, { color: tokens.foreground }]}>
                  Aucun match programmé
                </ProDayText>
                <ProDayText style={[styles.emptyStateBody, { color: tokens.muted }]}>
                  Les rencontres du club apparaissent ici dès qu’elles sont créées dans le calendrier — aucune donnée de démonstration n’est affichée.
                </ProDayText>
              </View>
            ) : null}
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

      {/* VUE VRAIS MATCHS AMICAUX (PAGE 16 SPÉCIFICATIONS V4) */}
      {activeTab === 'friendly' ? (
        <View style={styles.friendlySection}>
          {/* Bannière Organisation Autonome */}
          <View style={[styles.friendlyBannerCard, { backgroundColor: tokens.surface, borderColor: `${tokens.accent}40` }]}>
            <View style={[styles.friendlyBannerIcon, { backgroundColor: tokens.accentSoft }]}>
              <Icon name="football" size={18} color={tokens.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <ProDayText style={[styles.friendlyBannerTitle, { color: tokens.foreground }]}>
                Organisation Autonome Inter-Clubs
              </ProDayText>
              <ProDayText style={[styles.friendlyBannerSubtitle, { color: tokens.muted }]}>
                Organisation autonome sans dépendance FFF obligatoire · Métropole & Outre-mer
              </ProDayText>
            </View>
          </View>

          {/* Filtre de Statuts v4 */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsScroll}
          >
            {[
              { id: 'all', label: `Tous (${friendlyMatchesList.length})` },
              { id: 'brouillon', label: 'Brouillon' },
              { id: 'proposition', label: 'Proposition' },
              { id: 'confirme', label: 'Confirmé' },
              { id: 'reporte', label: 'Reporté' },
              { id: 'termine', label: 'Terminé' },
            ].map((st) => {
              const active = friendlyStatusFilter === st.id;
              return (
                <ClubPill
                  key={st.id}
                  label={st.label}
                  active={active}
                  onPress={() => setFriendlyStatusFilter(st.id as any)}
                />
              );
            })}
          </ScrollView>

          {/* Liste des Rencontres Amicales */}
          <View style={styles.fixturesList}>
            {friendlyMatchesList
              .filter((m) => friendlyStatusFilter === 'all' || m.status === friendlyStatusFilter)
              .map((match) => {
                const colors = getFriendlyStatusColor(match.status);
                return (
                  <View
                    key={match.id}
                    style={[styles.fixtureCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
                  >
                    <View style={styles.cardTopRow}>
                      <View style={[styles.badgeType, { backgroundColor: tokens.accentSoft }]}>
                        <Icon name="people" size={13} color={tokens.accent} />
                        <ProDayText style={[styles.badgeTypeText, { color: tokens.accent }]}>
                          {match.category} · {match.format}
                        </ProDayText>
                      </View>

                      <View style={[styles.friendlyStatusBadge, { backgroundColor: colors.bg }]}>
                        <ProDayText style={[styles.friendlyStatusText, { color: colors.text }]}>
                          {getFriendlyStatusLabel(match.status)}
                        </ProDayText>
                      </View>
                    </View>

                    <View style={styles.friendlyMatchInfo}>
                      <ProDayText style={[styles.friendlyOpponentText, { color: tokens.foreground }]}>
                        vs {match.opponentClub} ({match.homeOrAway})
                      </ProDayText>
                      <View style={styles.friendlyMetaRow}>
                        <View style={[styles.territoryPill, { backgroundColor: tokens.elevated }]}>
                          <Icon name="location" size={11} color={tokens.accent} />
                          <ProDayText style={[styles.territoryText, { color: tokens.foreground }]}>
                            {match.territory}
                          </ProDayText>
                        </View>
                        <ProDayText style={[styles.friendlyDateText, { color: tokens.muted }]}>
                          {match.dateStr} à {match.timeStr}
                        </ProDayText>
                      </View>
                      <ProDayText style={[styles.friendlyVenueText, { color: tokens.muted }]}>
                        Terrain : {match.venue} · {match.refereeType}
                      </ProDayText>
                      {match.notes ? (
                        <ProDayText style={[styles.friendlyNotesText, { color: tokens.muted }]}>
                          « {match.notes} »
                        </ProDayText>
                      ) : null}
                    </View>

                    {/* Actions de Changement de Statut v4 */}
                    <View style={[styles.cardFooter, { borderTopColor: tokens.border }]}>
                      <TouchableOpacity
                        onPress={() => updateFriendlyStatus(match.id, 'confirme')}
                        style={[styles.quickStatusBtn, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}
                      >
                        <ProDayText style={[styles.quickStatusText, { color: '#10B981' }]}>Confirmer</ProDayText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => updateFriendlyStatus(match.id, 'reporte')}
                        style={[styles.quickStatusBtn, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}
                      >
                        <ProDayText style={[styles.quickStatusText, { color: '#F59E0B' }]}>Reporter</ProDayText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => updateFriendlyStatus(match.id, 'termine')}
                        style={[styles.quickStatusBtn, { backgroundColor: tokens.elevated }]}
                      >
                        <ProDayText style={[styles.quickStatusText, { color: tokens.muted }]}>Clôturer</ProDayText>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
          </View>
        </View>
      ) : null}

      {/* VUE 2 : CLASSEMENTS FFF */}
      {activeTab === 'matrix' ? (
        <View style={[styles.matrixCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          <View style={styles.matrixHeader}>
            <View>
              <ProDayText style={[styles.matrixTitle, { color: tokens.foreground }]}>
                Classement de la compétition du club
              </ProDayText>
              <ProDayText style={[styles.matrixUpdated, { color: tokens.accent, marginTop: 2 }]}>
                Source officielle à confirmer — aucun championnat fictif
              </ProDayText>
            </View>

            <TouchableOpacity
              onPress={() => shellNav?.requestNav('standings')}
              style={[styles.matrixHubBtn, { backgroundColor: tokens.accentSoft, borderColor: `${tokens.accent}40` }]}
              activeOpacity={0.8}
            >
              <ProDayText style={[styles.matrixHubBtnText, { color: tokens.accent }]}>
                Hub Complet →
              </ProDayText>
            </TouchableOpacity>
          </View>

          <View style={[styles.matrixTableRow, styles.matrixTableHead, { borderBottomColor: tokens.border }]}>
            <ProDayText style={[styles.colRank, { color: tokens.muted }]}>#</ProDayText>
            <ProDayText style={[styles.colTeam, { color: tokens.muted }]}>Club</ProDayText>
            <ProDayText style={[styles.colPts, { color: tokens.muted }]}>Pts</ProDayText>
            <ProDayText style={[styles.colJ, { color: tokens.muted }]}>J</ProDayText>
            <ProDayText style={[styles.colDiff, { color: tokens.muted }]}>Diff</ProDayText>
          </View>

          {poolStandings.map((row) => {
            const isProDay = row.isMyTeam === true;
            return (
              <View
                key={row.team_id || row.rank}
                style={[
                  styles.matrixTableRow,
                  isProDay && { backgroundColor: tokens.accentSoft },
                  { borderBottomColor: tokens.border },
                ]}
              >
                <ProDayText
                  style={[
                    styles.colRank,
                    { color: isProDay ? tokens.accent : tokens.foreground, fontWeight: isProDay ? '800' : '600' },
                  ]}
                >
                  {row.rank}
                </ProDayText>
                <View style={{ flex: 1, paddingRight: 6 }}>
                  <ProDayText
                    style={[
                      styles.colTeam,
                      { color: isProDay ? tokens.accent : tokens.foreground, fontWeight: isProDay ? '800' : '500' },
                    ]}
                    numberOfLines={1}
                  >
                    {row.name}
                  </ProDayText>
                </View>
                <ProDayText
                  style={[
                    styles.colPts,
                    { color: isProDay ? tokens.accent : tokens.foreground, fontWeight: '800' },
                  ]}
                >
                  {row.points}
                </ProDayText>
                <ProDayText style={[styles.colJ, { color: tokens.muted }]}>{row.played}</ProDayText>
                <ProDayText
                  style={[
                    styles.colDiff,
                    row.goal_diff > 0
                      ? { color: '#10B981' }
                      : row.goal_diff < 0
                      ? { color: '#EF4444' }
                      : { color: tokens.muted },
                  ]}
                >
                  {row.goal_diff > 0 ? `+${row.goal_diff}` : row.goal_diff}
                </ProDayText>
              </View>
            );
          })}

          {poolStandings.length === 0 ? (
            <ProDayText style={[styles.matrixUpdated, { color: tokens.muted, paddingVertical: 12, textAlign: 'center' }]}>
              Aucun classement officiel relié au club. Le classement de la compétition du club apparaît ici une fois la source FFF confirmée — aucun championnat fictif n’est affiché.
            </ProDayText>
          ) : null}

          {/* CTA vers toutes les ligues */}
          <TouchableOpacity
            onPress={() => shellNav?.requestNav('standings')}
            style={[styles.matrixAllLeaguesCta, { backgroundColor: tokens.elevated, borderColor: `${tokens.accent}40` }]}
            activeOpacity={0.8}
          >
            <Icon name="globe" size={18} color={tokens.accent} />
            <View style={{ flex: 1 }}>
              <ProDayText style={[styles.matrixCtaTitle, { color: tokens.foreground }]}>
                Explorer tous les championnats de France
              </ProDayText>
              <ProDayText style={[styles.matrixCtaSub, { color: tokens.muted }]}>
                Ligue 1, L2, N1-N3, Régionaux LPIFF & Districts (92, 93, 75…)
              </ProDayText>
            </View>
            <Icon name="chevron-forward" size={16} color={tokens.accent} />
          </TouchableOpacity>
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

          {topScorers.length === 0 ? (
            <ProDayText style={[styles.matrixUpdated, { color: tokens.muted, paddingVertical: 12 }]}>
              Aucun buteur enregistré pour le club : les classements individuels apparaissent dès que des buts sont saisis sur des matchs réels.
            </ProDayText>
          ) : null}
          {topScorers.map((s) => (
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

      {/* Modal Match Amical Inter-Clubs (Page 16 Spécifications v4) */}
      <Modal
        visible={friendlyModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setFriendlyModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[styles.modalBox, { backgroundColor: CLUB_TOKENS.surface, borderColor: tokens.border }]}>
            <View style={styles.modalHeader}>
              <View>
                <ProDayText style={[styles.modalTitle, { color: tokens.foreground }]}>
                  Organiser un Match Amical
                </ProDayText>
                <ProDayText style={[styles.modalSubtitle, { color: tokens.muted }]}>
                  Organisation autonome · Métropole & Outre-mer
                </ProDayText>
              </View>
              <TouchableOpacity onPress={() => setFriendlyModalOpen(false)}>
                <Icon name="close" size={24} color={tokens.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={styles.modalBody}>
              <View style={styles.formGroup}>
                <ProDayText style={[styles.formLabel, { color: tokens.muted }]}>
                  Club adverse *
                </ProDayText>
                <TextInput
                  placeholder="Ex: FC Courbevoie, CS Moulien..."
                  placeholderTextColor="#6B7280"
                  value={friendlyOpponent}
                  onChangeText={setFriendlyOpponent}
                  style={[styles.formInput, { backgroundColor: CLUB_TOKENS.elevated, borderColor: tokens.border, color: tokens.foreground }]}
                />
              </View>

              <View style={styles.formGroup}>
                <ProDayText style={[styles.formLabel, { color: tokens.muted }]}>
                  Territoire géographique
                </ProDayText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
                  {(['Métropole', 'Guadeloupe (971)', 'Martinique (972)', 'Guyane (973)', 'La Réunion (974)', 'Mayotte (976)'] as FriendlyTerritory[]).map((terr) => (
                    <ClubPill
                      key={terr}
                      label={terr}
                      active={friendlyTerritory === terr}
                      onPress={() => setFriendlyTerritory(terr)}
                    />
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <ProDayText style={[styles.formLabel, { color: tokens.muted }]}>
                  Catégorie
                </ProDayText>
                <TextInput
                  value={friendlyCategory}
                  onChangeText={setFriendlyCategory}
                  style={[styles.formInput, { backgroundColor: CLUB_TOKENS.elevated, borderColor: tokens.border, color: tokens.foreground }]}
                />
              </View>

              <View style={styles.formGroup}>
                <ProDayText style={[styles.formLabel, { color: tokens.muted }]}>
                  Date & Heure souhaitée
                </ProDayText>
                <TextInput
                  value={friendlyDate}
                  onChangeText={setFriendlyDate}
                  style={[styles.formInput, { backgroundColor: CLUB_TOKENS.elevated, borderColor: tokens.border, color: tokens.foreground }]}
                />
              </View>

              <View style={styles.formGroup}>
                <ProDayText style={[styles.formLabel, { color: tokens.muted }]}>
                  Lieu (Terrain & Vestiaires)
                </ProDayText>
                <TextInput
                  value={friendlyVenue}
                  onChangeText={setFriendlyVenue}
                  style={[styles.formInput, { backgroundColor: CLUB_TOKENS.elevated, borderColor: tokens.border, color: tokens.foreground }]}
                />
              </View>

              <View style={styles.formGroup}>
                <ProDayText style={[styles.formLabel, { color: tokens.muted }]}>
                  Format & Arbitrage
                </ProDayText>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    value={friendlyFormat}
                    onChangeText={setFriendlyFormat}
                    style={[styles.formInput, { flex: 1, backgroundColor: CLUB_TOKENS.elevated, borderColor: tokens.border, color: tokens.foreground }]}
                  />
                  <TextInput
                    value={friendlyReferee}
                    onChangeText={setFriendlyReferee}
                    style={[styles.formInput, { flex: 1, backgroundColor: CLUB_TOKENS.elevated, borderColor: tokens.border, color: tokens.foreground }]}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <ProDayText style={[styles.formLabel, { color: tokens.muted }]}>
                  Statut initial
                </ProDayText>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {(['brouillon', 'proposition', 'confirme'] as FriendlyStatusV4[]).map((st) => (
                    <View key={st} style={{ flex: 1 }}>
                      <ClubPill
                        label={getFriendlyStatusLabel(st)}
                        active={friendlyInitialStatus === st}
                        onPress={() => setFriendlyInitialStatus(st)}
                      />
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <PressableSpring
                onPress={handleCreateFriendly}
                style={[styles.publishBtn, { backgroundColor: tokens.accent }]}
                scaleTo={0.97}
              >
                <ProDayText style={styles.publishBtnText}>Enregistrer le match amical</ProDayText>
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
  matrixHubBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  matrixHubBtnText: {
    ...APPLE_TYPOGRAPHY.caption1,
    fontWeight: '700',
  },
  matrixAllLeaguesCta: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: clubRadius.md,
    borderWidth: 1,
    gap: 10,
    marginTop: 8,
  },
  matrixCtaTitle: {
    ...APPLE_TYPOGRAPHY.subheadline,
    fontWeight: '700',
  },
  matrixCtaSub: {
    ...APPLE_TYPOGRAPHY.caption1,
    marginTop: 2,
  },
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
  liveOutdoorCard: {
    borderRadius: clubRadius.lg,
    borderWidth: 1.5,
    padding: 16,
    gap: 14,
    marginBottom: 6,
  },
  liveHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  liveBadgeText: {
    ...APPLE_TYPOGRAPHY.caption1,
    color: '#EF4444',
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  liveTimerText: {
    ...APPLE_TYPOGRAPHY.subheadline,
    fontWeight: '700',
  },
  outdoorScoreBoard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: clubRadius.md,
    paddingHorizontal: 12,
  },
  outdoorTeamCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  outdoorTeamName: {
    ...APPLE_TYPOGRAPHY.caption1,
    fontWeight: '700',
    textAlign: 'center',
  },
  outdoorScoreNum: {
    fontSize: 54,
    lineHeight: 60,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  touchlineBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  touchlineBtn: {
    width: 38,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchlineBtnText: {
    ...APPLE_TYPOGRAPHY.subheadline,
    fontWeight: '800',
  },
  outdoorSepCol: {
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 4,
  },
  outdoorSepText: {
    fontSize: 32,
    fontWeight: '900',
  },
  outdoorDaylightTag: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  liveHintText: {
    ...APPLE_TYPOGRAPHY.caption1,
    lineHeight: 17,
  },
  emptyStateCard: {
    alignItems: 'center',
    gap: 8,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  emptyStateTitle: {
    ...APPLE_TYPOGRAPHY.subheadline,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyStateBody: {
    ...APPLE_TYPOGRAPHY.caption1,
    textAlign: 'center',
    lineHeight: 17,
    maxWidth: 420,
  },
  touchlineFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  touchlineInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  touchlineInfoText: {
    fontSize: 10,
  },
  liveHubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  liveHubBtnText: {
    ...APPLE_TYPOGRAPHY.caption1,
    fontWeight: '700',
    color: '#000000',
  },
  friendlySection: {
    gap: 12,
  },
  friendlyBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: clubRadius.lg,
    borderWidth: 1,
  },
  friendlyBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendlyBannerTitle: {
    ...APPLE_TYPOGRAPHY.subheadline,
    fontWeight: '700',
  },
  friendlyBannerSubtitle: {
    ...APPLE_TYPOGRAPHY.caption1,
    marginTop: 2,
  },
  friendlyStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  friendlyStatusText: {
    ...APPLE_TYPOGRAPHY.caption1,
    fontWeight: '700',
    fontSize: 11,
  },
  friendlyMatchInfo: {
    gap: 6,
    paddingVertical: 4,
  },
  friendlyOpponentText: {
    ...APPLE_TYPOGRAPHY.headline,
  },
  friendlyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  territoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  territoryText: {
    fontSize: 10,
    fontWeight: '600',
  },
  friendlyDateText: {
    ...APPLE_TYPOGRAPHY.caption1,
  },
  friendlyVenueText: {
    ...APPLE_TYPOGRAPHY.caption1,
  },
  friendlyNotesText: {
    ...APPLE_TYPOGRAPHY.caption1,
    fontStyle: 'italic',
  },
  quickStatusBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
