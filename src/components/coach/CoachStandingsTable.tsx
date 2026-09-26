import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { proSemantic } from '../../theme/professionalDesign';
import { withAlpha, COACH_CLEAR_SURFACES as CLEAR } from '../../utils/coachTeamTheme';
import { COACH_SITE } from '../../content/coachPageIdentity';
import {
  frenchFootballStandingsService,
  type SyncStatus,
} from '../../services/frenchFootballStandings.service';
import { teamsService } from '../../services/teams.service';
import { clubsService } from '../../services/clubs.service';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { isClubStandingRow, formatSyncTimestamp } from '../../features/club/ui/clubStandingsModel';
import {
  standingsVerificationService,
} from '../../services/standingsVerification.service';

export interface StandingsRow {
  rank: number;
  clubName: string;
  clubCode?: string;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  form: ('W' | 'D' | 'L')[];
  isCurrentTeam?: boolean;
  penaltyPoints?: number;
}

interface Props {
  data?: StandingsRow[];
  compact?: boolean;
  divisionName?: string;
  onSelectTeam?: (row: StandingsRow) => void;
  lightMode?: boolean;
  teamId?: string;
  teamName?: string;
  leagueId?: string;
}

export const QUICK_COMPETITIONS = [
  { id: 'd2_d94_b', label: 'D2 Val-de-Marne (Ormesson)' },
  { id: 'r1_idf_b', label: 'R1 IDF (B)' },
  { id: 'r1_idf_a', label: 'R1 IDF (A)' },
  { id: 'r2_idf', label: 'R2 IDF' },
  { id: 'd1_d92', label: 'D1 District 92' },
  { id: 'u19_nat_a', label: 'U19 National' },
  { id: 'national1', label: 'National 1' },
  { id: 'ligue2', label: 'Ligue 2' },
  { id: 'ligue1', label: 'Ligue 1' },
];

const EMPTY_DATA: StandingsRow[] = [];

export const CoachStandingsTable: React.FC<Props> = ({
  data = EMPTY_DATA,
  compact = false,
  divisionName = 'Compétition officielle rattachée',
  onSelectTeam,
  lightMode = false,
  teamId,
  teamName,
  leagueId,
}) => {
  const profile = useSessionProfile();
  const [filter, setFilter] = useState<'all' | 'home' | 'away'>('all');
  const [manualOverrideActive, setManualOverrideActive] = useState(false);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [resolvedLeagueId, setResolvedLeagueId] = useState<string | null>(null);
  const [fetchedRows, setFetchedRows] = useState<StandingsRow[]>([]);
  const [fetchedDivision, setFetchedDivision] = useState<string | null>(null);
  const [fetchedGroup, setFetchedGroup] = useState<string | null>(null);
  const [fetchedPhase, setFetchedPhase] = useState<string | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [lastSyncDate, setLastSyncDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [verificationStatus, setVerificationStatus] = useState<'verified' | 'unverified'>('unverified');
  const [unverifiedReason, setUnverifiedReason] = useState<string | null>(null);
  const [resolvedTeamLabel, setResolvedTeamLabel] = useState<string>(teamName || 'Équipe');
  const [resolvedSeason, setResolvedSeason] = useState<string>('2026-2027');

  const hasExternalData = Boolean(data && data.length > 0);

  useEffect(() => {
    if (hasExternalData) {
      return;
    }

    let active = true;
    setIsLoading(true);

    async function loadStandings() {
      try {
        // 1. Si le coach sélectionne manuellement une compétition dans le bandeau
        if (selectedLeagueId) {
          const leagueData = await frenchFootballStandingsService.getLeagueStandings(selectedLeagueId, undefined, true);
          if (!active) return;

          if (leagueData && leagueData.standings && leagueData.standings.length > 0) {
            const mapped: StandingsRow[] = leagueData.standings.map((r) => ({
              rank: r.rank,
              clubName: r.name,
              clubCode: r.team_id,
              points: r.points,
              played: r.played,
              won: r.won,
              drawn: r.drawn,
              lost: r.lost,
              goalsFor: r.goals_for,
              goalsAgainst: r.goals_against,
              goalDiff: r.goal_diff,
              form: (r.form || []).map((f) => (f === 'V' ? 'W' : f === 'N' ? 'D' : 'L')),
              isCurrentTeam: isClubStandingRow(r, { teamId, teamName }),
            }));

            setFetchedRows(mapped);
            setFetchedDivision(leagueData.divisionLabel || leagueData.name);
            setFetchedGroup(leagueData.groupLabel || null);
            setFetchedPhase(leagueData.phase || 'Phase 1');
            setSourceUrl(leagueData.sourceUrl || null);
            setResolvedSeason(leagueData.season || '2026-2027');
            setLastSyncDate(leagueData.lastSyncAt ?? new Date().toISOString());
            setVerificationStatus('verified');
            setUnverifiedReason(null);
          } else {
            setFetchedRows([]);
            setVerificationStatus('unverified');
            setUnverifiedReason('Aucune donnée de classement officielle n’a été publiée pour cette compétition.');
          }
          return;
        }

        // 2. Si une équipe est ciblée : rapprochement officiel multi-attributs
        if (teamId) {
          const team = await teamsService.getById(teamId);
          const clubId = team?.club_id || profile?.profile.club_id;
          const club = clubId ? await clubsService.getById(clubId) : null;

          if (team) {
            setResolvedTeamLabel(`${team.name}${team.category ? ` (${team.category})` : ''}`);
            const resolution = standingsVerificationService.resolveTeamCompetition(team, club);

            if (resolution.verificationStatus === 'unverified' || !resolution.leagueId) {
              setFetchedRows([]);
              setVerificationStatus('unverified');
              setUnverifiedReason(resolution.verificationReason || 'Aucune compétition officielle FFF homologuée n’est rattachée à cette équipe.');
              setFetchedDivision(resolution.divisionLabel);
              setSourceUrl(null);
              return;
            }

            // Rattachement valide : récupération du snapshot officiel
            const targetId = resolution.leagueId;
            setResolvedLeagueId(targetId);
            const leagueData = await frenchFootballStandingsService.getLeagueStandings(targetId);
            if (!active) return;

            // Règle d'intégrité : validation formelle du tableau par rapport à l'équipe
            const validation = standingsVerificationService.validateStandingsTable(leagueData, {
              teamId: team.id,
              teamName: team.name,
              category: team.category,
              genderScope: team.gender_scope,
              season: resolution.season,
              clubName: club?.name,
            });

            if (!validation.isValid || !leagueData.standings || leagueData.standings.length === 0) {
              setFetchedRows([]);
              setVerificationStatus('unverified');
              setUnverifiedReason(validation.errors.join(' · ') || 'Tableau non conforme à l’intégrité sportive officielle.');
              setFetchedDivision(resolution.divisionLabel);
              return;
            }

            const mapped: StandingsRow[] = leagueData.standings.map((r) => {
              const isCurrent = isClubStandingRow(r, {
                teamId: team.id,
                teamName: team.name,
                clubName: club?.name,
              });
              const form: ('W' | 'D' | 'L')[] = (r.form || []).map((f) => {
                if (f === 'V') return 'W';
                if (f === 'N') return 'D';
                return 'L';
              });
              return {
                rank: r.rank,
                clubName: r.name,
                clubCode: r.team_id,
                points: r.points,
                played: r.played,
                won: r.won,
                drawn: r.drawn,
                lost: r.lost,
                goalsFor: r.goals_for,
                goalsAgainst: r.goals_against,
                goalDiff: r.goal_diff,
                form,
                isCurrentTeam: isCurrent,
              };
            });

            setFetchedRows(mapped);
            setFetchedDivision(leagueData.divisionLabel || resolution.divisionLabel);
            setFetchedGroup(leagueData.groupLabel || resolution.groupLabel || null);
            setFetchedPhase(leagueData.phase || 'Phase 1');
            setSourceUrl(leagueData.sourceUrl || null);
            setResolvedSeason(leagueData.season || resolution.season);
            setLastSyncDate(leagueData.lastSyncAt ?? new Date().toISOString());
            setVerificationStatus('verified');
            setUnverifiedReason(null);
            return;
          }
        }

        // 3. Si un leagueId direct est passé en prop
        if (leagueId) {
          const leagueData = await frenchFootballStandingsService.getLeagueStandings(leagueId);
          if (!active) return;

          if (leagueData && leagueData.standings && leagueData.standings.length > 0) {
            const mapped: StandingsRow[] = leagueData.standings.map((r) => ({
              rank: r.rank,
              clubName: r.name,
              clubCode: r.team_id,
              points: r.points,
              played: r.played,
              won: r.won,
              drawn: r.drawn,
              lost: r.lost,
              goalsFor: r.goals_for,
              goalsAgainst: r.goals_against,
              goalDiff: r.goal_diff,
              form: (r.form || []).map((f) => (f === 'V' ? 'W' : f === 'N' ? 'D' : 'L')),
              isCurrentTeam: isClubStandingRow(r, { teamId, teamName }),
            }));

            setFetchedRows(mapped);
            setFetchedDivision(leagueData.divisionLabel || leagueData.name);
            setFetchedGroup(leagueData.groupLabel || null);
            setFetchedPhase(leagueData.phase || 'Phase 1');
            setSourceUrl(leagueData.sourceUrl || null);
            setResolvedSeason(leagueData.season || '2026-2027');
            setLastSyncDate(leagueData.lastSyncAt ?? new Date().toISOString());
            setVerificationStatus('verified');
            setUnverifiedReason(null);
            return;
          }
        }

        // 4. Aucun identifiant ni équipe : état non vérifié honnête (zéro fallback forcé vers R1 IDF)
        setFetchedRows([]);
        setVerificationStatus('unverified');
        setUnverifiedReason('Aucune équipe ni compétition officielle sélectionnée. Sélectionnez un championnat ci-dessous.');
      } catch {
        if (active) {
          setFetchedRows([]);
          setVerificationStatus('unverified');
          setUnverifiedReason('Source officielle momentanément indisponible.');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadStandings();

    return () => {
      active = false;
    };
  }, [hasExternalData, leagueId, teamId, teamName, divisionName, selectedLeagueId, profile?.profile?.club_id]);

  const activeRows = hasExternalData ? data : fetchedRows;
  const rows = compact ? activeRows.slice(0, 5) : activeRows;
  const hasNoData = rows.length === 0;
  const isVerified = (hasExternalData && !hasNoData) || (verificationStatus === 'verified' && !hasNoData);

  const toggleSyncMode = async () => {
    const nextMode = !manualOverrideActive;
    setManualOverrideActive(nextMode);
    setIsLoading(true);
    try {
      const activeId = selectedLeagueId || resolvedLeagueId || 'd2_d94_b';
      const fresh = await frenchFootballStandingsService.getLeagueStandings(activeId, undefined, true);
      if (fresh && fresh.standings && fresh.standings.length > 0) {
        const mapped: StandingsRow[] = fresh.standings.map((r) => {
          const isCurrent = isClubStandingRow(r, { teamId, teamName });
          const form: ('W' | 'D' | 'L')[] = (r.form || []).map((f) => {
            if (f === 'V') return 'W';
            if (f === 'N') return 'D';
            return 'L';
          });
          return {
            rank: r.rank,
            clubName: r.name,
            clubCode: r.team_id,
            points: r.points,
            played: r.played,
            won: r.won,
            drawn: r.drawn,
            lost: r.lost,
            goalsFor: r.goals_for,
            goalsAgainst: r.goals_against,
            goalDiff: r.goal_diff,
            form,
            isCurrentTeam: isCurrent,
          };
        });
        setFetchedRows(mapped);
        setFetchedDivision(fresh.divisionLabel || fresh.name);
        setSourceUrl(fresh.sourceUrl || null);
        setLastSyncDate(new Date().toISOString());
        setVerificationStatus('verified');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.card, lightMode && styles.cardLight]}>
      {/* 1. Statut du Flux FFF Officiel & Synchronisation */}
      {!compact && (
        <View style={[styles.officialFeedBanner, lightMode && styles.officialFeedBannerLight]}>
          <View style={styles.officialFeedLeft}>
            <View
              style={[
                styles.liveSyncDot,
                hasNoData && styles.liveSyncDotOffline,
                manualOverrideActive && styles.liveSyncDotManual,
              ]}
            />
            <View style={styles.officialFeedTextContainer}>
              <Text style={[styles.officialFeedTitle, lightMode && styles.textDark]}>
                {manualOverrideActive
                  ? 'Mode Manuel Actif (Contestation)'
                  : hasNoData
                  ? 'Classement non encore vérifié'
                  : 'Flux Officiel FFF Actif'}
              </Text>
              <Text style={[styles.officialFeedSubtitle, lightMode && styles.textMutedDark]} numberOfLines={2}>
                {manualOverrideActive
                  ? 'Modifications locales autorisées · Synchronisation suspendue'
                  : hasNoData
                  ? unverifiedReason || 'Le classement réel de la compétition rattachée s’affichera ici — aucun tableau fictif n’est montré.'
                  : lastSyncDate
                  ? formatSyncTimestamp(lastSyncDate) ?? 'Synchronisé avec les serveurs officiels FFF'
                  : 'Synchronisé avec les serveurs officiels FFF'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.overrideBtn, manualOverrideActive && styles.overrideBtnActive]}
            onPress={toggleSyncMode}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={manualOverrideActive ? 'sync-alert' : 'shield-sync-outline'}
              size={13}
              color={manualOverrideActive ? proSemantic.warning : proSemantic.success}
            />
            <Text style={[styles.overrideBtnText, manualOverrideActive && styles.overrideBtnTextActive]}>
              {manualOverrideActive ? 'Auto' : 'Actualiser'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 2. Bandeau de Traçabilité & Exactitude FFF */}
      {!compact && (
        <View style={[styles.traceabilityCard, lightMode && styles.traceabilityCardLight]}>
          <View style={styles.traceabilityTopRow}>
            <View style={styles.teamIdentityBadge}>
              <MaterialCommunityIcons name="shield-outline" size={13} color={tokens.accent} />
              <Text style={[styles.teamIdentityText, lightMode && styles.textDark]} numberOfLines={1}>
                {resolvedTeamLabel}
              </Text>
            </View>

            <View
              style={[
                styles.verificationBadge,
                isVerified ? styles.verificationBadgeOk : styles.verificationBadgeWarn,
              ]}
            >
              <View
                style={[
                  styles.verificationDot,
                  { backgroundColor: isVerified ? proSemantic.success : proSemantic.warning },
                ]}
              />
              <Text
                style={[
                  styles.verificationText,
                  { color: isVerified ? proSemantic.success : proSemantic.warning },
                ]}
              >
                {isVerified ? 'Vérifié officiel FFF' : 'Non encore vérifié'}
              </Text>
            </View>
          </View>

          <View style={styles.competitionDetailsArea}>
            <Text style={[styles.divisionTitle, lightMode && styles.textDark]}>
              {fetchedDivision || divisionName}
            </Text>
            <Text style={[styles.groupSubtitle, lightMode && styles.textMutedDark]}>
              {fetchedGroup ? `${fetchedGroup} · ` : ''}{fetchedPhase ? `${fetchedPhase} · ` : ''}Saison {resolvedSeason}
            </Text>
          </View>

          <View style={styles.sourceRow}>
            {sourceUrl ? (
              <TouchableOpacity
                style={styles.sourceLink}
                onPress={() => Linking.openURL(sourceUrl).catch(() => {})}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="open-in-new" size={12} color={tokens.accent} />
                <Text style={styles.sourceLinkText}>Consulter la publication officielle ↗</Text>
              </TouchableOpacity>
            ) : (
              <Text style={[styles.sourceUnverifiedText, lightMode && styles.textMutedDark]}>
                Source : En attente d’homologation FFF
              </Text>
            )}

            {lastSyncDate ? (
              <Text style={[styles.syncTimeText, lightMode && styles.textMutedDark]}>
                {formatSyncTimestamp(lastSyncDate)}
              </Text>
            ) : null}
          </View>
        </View>
      )}

      {/* 3. Sélecteur de Compétitions Officielles Rapides */}
      {!compact && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.competitionScroll}
          contentContainerStyle={styles.competitionScrollContent}
        >
          {QUICK_COMPETITIONS.map((c) => {
            const isChipActive = selectedLeagueId === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                onPress={() => setSelectedLeagueId(c.id)}
                activeOpacity={0.7}
                style={[
                  styles.competitionChip,
                  lightMode && styles.competitionChipLight,
                  isChipActive && (lightMode ? styles.competitionChipActiveLight : styles.competitionChipActive),
                ]}
              >
                <Text
                  style={[
                    styles.competitionChipText,
                    isChipActive && (lightMode ? styles.competitionChipTextActiveLight : styles.competitionChipTextActive),
                  ]}
                >
                  {c.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* 4. En-tête des Filtres Général / Domicile / Extérieur */}
      {!compact && !hasNoData && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons name="trophy-outline" size={16} color={tokens.accent} />
            <Text style={[styles.title, lightMode && styles.textDark]}>Tableau de la poule</Text>
          </View>

          <View style={[styles.filterPills, lightMode && styles.filterPillsLight]}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.pill, filter === 'all' && styles.pillActive]}
              onPress={() => setFilter('all')}
            >
              <Text style={[styles.pillText, lightMode && styles.textMutedDark, filter === 'all' && styles.pillTextActive]}>Général</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.pill, filter === 'home' && styles.pillActive]}
              onPress={() => setFilter('home')}
            >
              <Text style={[styles.pillText, lightMode && styles.textMutedDark, filter === 'home' && styles.pillTextActive]}>Dom.</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.pill, filter === 'away' && styles.pillActive]}
              onPress={() => setFilter('away')}
            >
              <Text style={[styles.pillText, lightMode && styles.textMutedDark, filter === 'away' && styles.pillTextActive]}>Ext.</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 5. Corps Principal : Chargement, Non Vérifié, ou Tableau Officiel */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={tokens.accent} />
          <Text style={[styles.loadingText, lightMode && styles.textMutedDark]}>
            Vérification de la publication officielle FFF…
          </Text>
        </View>
      ) : hasNoData ? (
        <View style={[styles.emptyContainer, lightMode && styles.emptyContainerLight]}>
          <View style={[styles.emptyIconCircle, lightMode && styles.emptyIconCircleLight]}>
            <MaterialCommunityIcons name="shield-alert-outline" size={26} color={proSemantic.warning} />
          </View>
          <Text style={[styles.emptyRowsTitle, lightMode && styles.textDark]}>
            Aucun classement disponible
          </Text>
          <Text style={[styles.emptyRowsText, lightMode && styles.textMutedDark]}>
            {unverifiedReason ||
              `Le classement officiel de cette équipe (${resolvedTeamLabel}) n'a pas encore été homologué par la FFF. Aucun tableau fictif ou substitué n'est affiché.`}
          </Text>
        </View>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tableContainer}>
              {/* En-tête des colonnes du tableau */}
              <View style={[styles.tableRowHeader, lightMode && styles.tableRowHeaderLight]}>
                <Text style={[styles.th, styles.colRank, lightMode && styles.textMutedDark]}>Pl</Text>
                <Text style={[styles.th, styles.colClub, { textAlign: 'left' }, lightMode && styles.textMutedDark]}>Club</Text>
                <Text style={[styles.th, styles.colPts, lightMode && styles.textMutedDark]}>Pts</Text>
                <Text style={[styles.th, styles.colStat, lightMode && styles.textMutedDark]}>J</Text>
                <Text style={[styles.th, styles.colStat, lightMode && styles.textMutedDark]}>G</Text>
                <Text style={[styles.th, styles.colStat, lightMode && styles.textMutedDark]}>N</Text>
                <Text style={[styles.th, styles.colStat, lightMode && styles.textMutedDark]}>P</Text>
                <Text style={[styles.th, styles.colStat, lightMode && styles.textMutedDark]}>BP</Text>
                <Text style={[styles.th, styles.colStat, lightMode && styles.textMutedDark]}>BC</Text>
                <Text style={[styles.th, styles.colStat, lightMode && styles.textMutedDark]}>Diff</Text>
                {!compact && <Text style={[styles.th, styles.colForm, lightMode && styles.textMutedDark]}>Forme</Text>}
              </View>

              {/* Lignes du tableau officiel */}
              {rows.map((row) => {
                const isPromo = row.rank <= 2;
                const isRelegation = row.rank >= rows.length - 1 && rows.length >= 8;

                return (
                  <TouchableOpacity
                    key={`${row.rank}-${row.clubName}`}
                    activeOpacity={0.7}
                    onPress={() => onSelectTeam && onSelectTeam(row)}
                    style={[
                      styles.tableRow,
                      lightMode && styles.tableRowLight,
                      row.isCurrentTeam && (lightMode ? styles.currentTeamRowLight : styles.currentTeamRow),
                    ]}
                  >
                    <View
                      style={[
                        styles.rankBadge,
                        lightMode && styles.rankBadgeLight,
                        isPromo && styles.rankPromo,
                        isRelegation && styles.rankRelegation,
                      ]}
                    >
                      <Text
                        style={[
                          styles.rankText,
                          lightMode && styles.textDark,
                          isPromo && { color: proSemantic.success },
                          isRelegation && { color: proSemantic.danger },
                        ]}
                      >
                        {row.rank}
                      </Text>
                    </View>

                    <View style={styles.colClub}>
                      <Text
                        style={[
                          styles.clubNameText,
                          lightMode && styles.textDark,
                          row.isCurrentTeam && styles.currentTeamText,
                        ]}
                        numberOfLines={1}
                      >
                        {row.clubName}
                      </Text>
                      {row.isCurrentTeam && (
                        <View style={styles.myTeamBadge}>
                          <Text style={styles.myTeamBadgeText}>NOTRE ÉQUIPE</Text>
                        </View>
                      )}
                    </View>

                    <Text style={[styles.td, styles.colPts, styles.boldWhite, lightMode && styles.textDark]}>
                      {row.points}
                    </Text>
                    <Text style={[styles.td, styles.colStat, lightMode && styles.textDark]}>{row.played}</Text>
                    <Text style={[styles.td, styles.colStat, lightMode && styles.textDark]}>{row.won}</Text>
                    <Text style={[styles.td, styles.colStat, lightMode && styles.textDark]}>{row.drawn}</Text>
                    <Text style={[styles.td, styles.colStat, lightMode && styles.textDark]}>{row.lost}</Text>
                    <Text style={[styles.td, styles.colStat, lightMode && styles.textDark]}>{row.goalsFor}</Text>
                    <Text style={[styles.td, styles.colStat, lightMode && styles.textDark]}>{row.goalsAgainst}</Text>
                    <Text
                      style={[
                        styles.td,
                        styles.colStat,
                        row.goalDiff > 0
                          ? { color: proSemantic.success }
                          : row.goalDiff < 0
                          ? { color: proSemantic.danger }
                          : lightMode ? styles.textDark : styles.boldWhite,
                      ]}
                    >
                      {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                    </Text>

                    {!compact && (
                      <View style={[styles.colForm, styles.formContainer]}>
                        {(row.form || []).slice(-5).map((result, i) => (
                          <View
                            key={i}
                            style={[
                              styles.formDot,
                              result === 'W'
                                ? styles.formWin
                                : result === 'D'
                                ? styles.formDraw
                                : styles.formLoss,
                            ]}
                          >
                            <Text style={styles.formText}>{result}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Légende Bas de Page */}
          <View style={[styles.footerLegend, lightMode && styles.footerLegendLight]}>
            <View style={styles.legendItem}>
              <View style={[styles.legendBar, { backgroundColor: proSemantic.success }]} />
              <Text style={[styles.legendLabel, lightMode && styles.textMutedDark]}>Montée</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBar, { backgroundColor: proSemantic.info }]} />
              <Text style={[styles.legendLabel, lightMode && styles.textMutedDark]}>Barrages</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBar, { backgroundColor: proSemantic.danger }]} />
              <Text style={[styles.legendLabel, lightMode && styles.textMutedDark]}>Relégation</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
};

const tokens = COACH_SITE;

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: tokens.border,
    padding: 16,
    marginVertical: 8,
  },
  cardLight: {
    backgroundColor: CLEAR.surface,
    borderColor: CLEAR.border,
  },
  officialFeedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
    backgroundColor: tokens.elevated,
    borderWidth: 1,
    borderColor: tokens.border,
    marginBottom: 10,
  },
  officialFeedBannerLight: {
    backgroundColor: CLEAR.elevated,
    borderColor: CLEAR.border,
  },
  officialFeedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  liveSyncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: proSemantic.success,
  },
  liveSyncDotOffline: {
    backgroundColor: proSemantic.warning,
  },
  liveSyncDotManual: {
    backgroundColor: tokens.accent,
  },
  officialFeedTextContainer: {
    flex: 1,
    gap: 2,
  },
  officialFeedTitle: {
    color: tokens.foreground,
    fontSize: 12,
    fontWeight: '700',
  },
  officialFeedSubtitle: {
    color: tokens.muted,
    fontSize: 10,
    fontWeight: '500',
  },
  traceabilityCard: {
    backgroundColor: tokens.elevated,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: tokens.border,
  },
  traceabilityCardLight: {
    backgroundColor: CLEAR.elevated,
    borderColor: CLEAR.border,
  },
  traceabilityTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  teamIdentityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  teamIdentityText: {
    color: tokens.foreground,
    fontSize: 13,
    fontWeight: '700',
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  verificationBadgeOk: {
    backgroundColor: withAlpha('10B981', 0.12),
    borderColor: withAlpha('10B981', 0.25),
  },
  verificationBadgeWarn: {
    backgroundColor: withAlpha('F59E0B', 0.12),
    borderColor: withAlpha('F59E0B', 0.25),
  },
  verificationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  verificationText: {
    fontSize: 10,
    fontWeight: '700',
  },
  competitionDetailsArea: {
    marginBottom: 6,
  },
  divisionTitle: {
    color: tokens.foreground,
    fontSize: 13,
    fontWeight: '700',
  },
  groupSubtitle: {
    color: tokens.muted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: tokens.border,
  },
  sourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sourceLinkText: {
    color: tokens.accent,
    fontSize: 11,
    fontWeight: '600',
  },
  sourceUnverifiedText: {
    color: tokens.muted,
    fontSize: 11,
    fontWeight: '500',
  },
  syncTimeText: {
    color: tokens.muted,
    fontSize: 10,
    fontWeight: '500',
  },
  feedActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  feedActionInfo: {
    color: tokens.muted,
    fontSize: 11,
    fontWeight: '500',
  },
  overrideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: withAlpha('10B981', 0.12),
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: withAlpha('10B981', 0.3),
  },
  overrideBtnActive: {
    backgroundColor: withAlpha('F59E0B', 0.12),
    borderColor: withAlpha('F59E0B', 0.3),
  },
  overrideBtnText: {
    color: proSemantic.success,
    fontSize: 10,
    fontWeight: '700',
  },
  overrideBtnTextActive: {
    color: proSemantic.warning,
  },
  competitionScroll: {
    marginHorizontal: -4,
    marginBottom: 12,
  },
  competitionScrollContent: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 4,
  },
  competitionChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: tokens.elevated,
    borderWidth: 1,
    borderColor: tokens.border,
  },
  competitionChipLight: {
    backgroundColor: CLEAR.elevated,
    borderColor: CLEAR.border,
  },
  competitionChipActive: {
    backgroundColor: withAlpha(tokens.accent, 0.2),
    borderColor: tokens.accent,
  },
  competitionChipActiveLight: {
    backgroundColor: withAlpha(tokens.accent, 0.15),
    borderColor: tokens.accent,
  },
  competitionChipText: {
    color: tokens.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  competitionChipTextActive: {
    color: tokens.accent,
    fontWeight: '700',
  },
  competitionChipTextActiveLight: {
    color: tokens.accent,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    color: tokens.foreground,
    fontSize: 13,
    fontWeight: '700',
  },
  filterPills: {
    flexDirection: 'row',
    backgroundColor: COACH_SITE.elevated,
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  filterPillsLight: {
    backgroundColor: CLEAR.elevated,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pillActive: {
    backgroundColor: tokens.surface,
  },
  pillText: {
    color: tokens.muted,
    fontSize: 10,
    fontWeight: '600',
  },
  pillTextActive: {
    color: tokens.accent,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 10,
  },
  loadingText: {
    color: tokens.muted,
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
    gap: 8,
    backgroundColor: tokens.elevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: tokens.border,
    marginVertical: 4,
  },
  emptyContainerLight: {
    backgroundColor: CLEAR.elevated,
    borderColor: CLEAR.border,
  },
  emptyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: withAlpha('F59E0B', 0.12),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  emptyIconCircleLight: {
    backgroundColor: withAlpha('F59E0B', 0.15),
  },
  emptyRowsTitle: {
    color: tokens.foreground,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyRowsText: {
    color: tokens.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 340,
  },
  tableContainer: {
    minWidth: 360,
  },
  tableRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: tokens.border,
    marginBottom: 4,
  },
  tableRowHeaderLight: {
    borderBottomColor: CLEAR.border,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: withAlpha('FFFFFF', 0.04),
    borderRadius: 8,
  },
  tableRowLight: {
    borderBottomColor: CLEAR.surface,
  },
  currentTeamRow: {
    backgroundColor: withAlpha('F59E0B', 0.12),
    borderLeftWidth: 3,
    borderLeftColor: tokens.accent,
    paddingLeft: 4,
  },
  currentTeamRowLight: {
    backgroundColor: withAlpha('F59E0B', 0.15),
    borderLeftColor: tokens.accent,
    paddingLeft: 4,
  },
  th: {
    color: tokens.muted,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  td: {
    color: tokens.foreground,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  colRank: {
    width: 28,
    textAlign: 'center',
  },
  colClub: {
    width: 140,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    backgroundColor: COACH_SITE.elevated,
  },
  rankBadgeLight: {
    backgroundColor: CLEAR.surface,
  },
  rankPromo: {
    backgroundColor: withAlpha('10B981', 0.2),
  },
  rankRelegation: {
    backgroundColor: withAlpha('EF4444', 0.2),
  },
  rankText: {
    color: tokens.foreground,
    fontSize: 11,
    fontWeight: '700',
  },
  boldWhite: {
    color: tokens.foreground,
  },
  clubNameText: {
    color: tokens.foreground,
    fontSize: 12,
    fontWeight: '600',
  },
  currentTeamText: {
    color: tokens.accent,
    fontWeight: '700',
  },
  myTeamBadge: {
    backgroundColor: withAlpha(tokens.accent, 0.2),
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginLeft: 6,
  },
  myTeamBadgeText: {
    color: tokens.accent,
    fontSize: 8,
    fontWeight: '800',
  },
  colPts: {
    width: 32,
    fontWeight: '700',
  },
  colStat: {
    width: 26,
  },
  colForm: {
    width: 90,
    alignItems: 'center',
  },
  formContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 3,
  },
  formDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formWin: {
    backgroundColor: proSemantic.success,
  },
  formDraw: {
    backgroundColor: proSemantic.warning,
  },
  formLoss: {
    backgroundColor: proSemantic.danger,
  },
  formText: {
    color: tokens.foreground,
    fontSize: 8,
    fontWeight: '800',
  },
  footerLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: withAlpha('FFFFFF', 0.05),
  },
  footerLegendLight: {
    borderTopColor: CLEAR.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBar: {
    width: 10,
    height: 3,
    borderRadius: 2,
  },
  legendLabel: {
    color: tokens.muted,
    fontSize: 10,
    fontWeight: '500',
  },
  textDark: {
    color: CLEAR.foreground,
  },
  textMutedDark: {
    color: CLEAR.muted,
  },
});
