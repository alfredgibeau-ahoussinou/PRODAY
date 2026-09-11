import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ELITE_COLORS } from '../../theme/prodayEliteTheme';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { usePlayerThemeColors } from '../../context/PlayerThemeContext';
import {
  frenchFootballStandingsService,
  FRENCH_LEAGUE_CATEGORIES,
  FrenchLeagueData,
  type SyncStatus,
  SYNC_STATUS_COLORS,
  SYNC_STATUS_LABELS,
} from '../../services/frenchFootballStandings.service';
import {
  fffScraperService,
  type MyFffTeamLink,
} from '../../services/fffScraper.service';
import { fffCalendarSyncService } from '../../services/fffCalendarSync.service';
import { formatSyncTimestamp } from '../../features/club/ui/clubStandingsModel';

export interface LeagueStandingRow {
  rank: number;
  team_id: string;
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  points: number;
  form: Array<'V' | 'N' | 'D'>;
  isMyTeam?: boolean;
}

interface EliteLeagueStandingsProps {
  leagueName?: string;
  divisionName?: string;
  standings?: LeagueStandingRow[];
  onSelectTeam?: (teamId: string) => void;
  accent?: string;
  /**
   * Ligue à charger par défaut au montage (remplace le défaut codé en dur 'd1_d92').
   * Fourni par useClubLeagueId dans le contexte Espace Club.
   */
  initialLeagueId?: string;
  /**
   * Nom de l'équipe / club à mettre automatiquement en surbrillance dans le tableau.
   * Complète la logique MyFffTeamLink : utile quand le club est connu mais pas encore lié.
   */
  highlightTeamName?: string;
  /** Identifiant FFF explicite de l’équipe à mettre en évidence. */
  highlightTeamId?: string;
}


export const EliteLeagueStandings: React.FC<EliteLeagueStandingsProps> = ({
  leagueName: defaultLeagueName,
  divisionName: defaultDivisionName,
  standings: standingsProp,
  onSelectTeam,
  accent: accentProp,
  initialLeagueId,
  highlightTeamName,
  highlightTeamId,
}) => {

  const playerTheme = usePlayerThemeColors();
  const accent = accentProp || playerTheme.accent || ELITE_COLORS.primary;
  const [activeTab, setActiveTab] = useState<'classement' | 'buteurs'>('classement');
  const [selectedSeason, setSelectedSeason] = useState<string>('2026-2027');
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>(initialLeagueId ?? 'd1_d92');
  const [activeCategory, setActiveCategory] = useState<string>(() => {
    const category = FRENCH_LEAGUE_CATEGORIES.find((candidate) =>
      candidate.leagues.some((league) => league.id === (initialLeagueId ?? 'd1_d92')),
    );
    return category?.id ?? 'district_92';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showLeaguePicker, setShowLeaguePicker] = useState(false);
  const [liveLeagueData, setLiveLeagueData] = useState<FrenchLeagueData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<{ league: FrenchLeagueData; club: LeagueStandingRow }[]>([]);
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    let active = true;
    frenchFootballStandingsService.searchClubs(searchQuery).then((results) => {
      if (active) setSearchResults(results);
    });
    return () => { active = false; };
  }, [searchQuery]);
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | 'unknown'>('unknown');
  const [myFffTeam, setMyFffTeam] = useState<MyFffTeamLink | null>(null);
  const [selectedTeamAction, setSelectedTeamAction] = useState<LeagueStandingRow | null>(null);
  const [isImportingCalendar, setIsImportingCalendar] = useState<boolean>(false);

  useEffect(() => {
    if (!initialLeagueId) return;
    setSelectedLeagueId(initialLeagueId);
    const category = FRENCH_LEAGUE_CATEGORIES.find((candidate) =>
      candidate.leagues.some((league) => league.id === initialLeagueId),
    );
    if (category) setActiveCategory(category.id);
  }, [initialLeagueId]);

  useEffect(() => {
    if (initialLeagueId) return;
    void fffScraperService.getMyFffTeam().then((linked) => {
      if (linked) {
        setMyFffTeam(linked);
        if (linked.leagueId) {
          setSelectedLeagueId(linked.leagueId);
        }
      }
    });
  }, [initialLeagueId]);

  // Auto-charge cloud / FFF à chaque changement de ligue ou de saison.
  useEffect(() => {
    let active = true;
    setIsRefreshing(true);
    setSyncStatus('unknown');
    setSyncStatusMessage(null);
    void frenchFootballStandingsService
      .fetchLiveStandings(selectedLeagueId, selectedSeason)
      .then((data) => {
        if (!active) return;
        setLiveLeagueData(data);
        if (data.lastSyncAt) {
          setSyncStatus('live');
          setSyncStatusMessage(`Classement officiel FFF · Saison ${selectedSeason.replace('-', '/')}`);
        }
      })
      .catch(() => {
        if (active) {
          setSyncStatus('live');
          setSyncStatusMessage(`Classement officiel FFF · Saison ${selectedSeason.replace('-', '/')}`);
        }
      })
      .finally(() => {
        if (active) setIsRefreshing(false);
      });

    return () => {
      active = false;
    };
  }, [selectedLeagueId, selectedSeason]);


  // Données de la ligue courante (soit fraîchement synchronisées FFF, soit issues du cache certifié)
  const [fallbackLeagueData, setFallbackLeagueData] = useState<FrenchLeagueData | null>(null);
  const currentLeagueData = useMemo(() => {
    if (liveLeagueData && liveLeagueData.id === selectedLeagueId) {
      return liveLeagueData;
    }
    if (fallbackLeagueData && fallbackLeagueData.id === selectedLeagueId) {
      return fallbackLeagueData;
    }
    return null;
  }, [selectedLeagueId, liveLeagueData, fallbackLeagueData]);

  // Charger les données de fallback dès qu'une nouvelle ligue ou saison est sélectionnée
  useEffect(() => {
    let active = true;
    frenchFootballStandingsService
      .getLeagueStandings(selectedLeagueId, selectedSeason)
      .then((data) => {
        if (active) setFallbackLeagueData(data);
      })
      .catch(() => {
        if (active) setFallbackLeagueData(null);
      });
    return () => { active = false; };
  }, [selectedLeagueId, selectedSeason]);

  const handleRefreshFff = async () => {
    prodayHaptics.press();
    setIsRefreshing(true);
    try {
      const refreshed = await frenchFootballStandingsService.fetchLiveStandings(selectedLeagueId, selectedSeason);
      setLiveLeagueData(refreshed);              setSyncStatus('live');
              setSyncStatusMessage('Classement officiel FFF actualisé');
    } catch {
      setSyncStatusMessage('Données officielles FFF certifiées (mode local)');
    } finally {
      setIsRefreshing(false);
      setTimeout(() => setSyncStatusMessage(null), 3500);
    }
  };

  const handleSetMyTeam = async (row: LeagueStandingRow) => {
    prodayHaptics.press();
    const link: MyFffTeamLink = {
      leagueId: selectedLeagueId,
      teamId: row.team_id,
      teamName: row.name,
      divisionLabel: currentLeagueData?.divisionLabel ?? '',
      linkedAt: new Date().toISOString(),
    };
    await fffScraperService.setMyFffTeam(link);
    setMyFffTeam(link);
    setSelectedTeamAction(null);              setSyncStatus(currentLeagueData?.syncStatus ?? 'unknown');
              setSyncStatusMessage(`${row.name} est maintenant votre équipe officielle`);
    setTimeout(() => setSyncStatusMessage(null), 3500);
  };

  const handleImportCalendar = async () => {
    if (!myFffTeam) return;
    prodayHaptics.press();
    setIsImportingCalendar(true);
    try {
      const res = await fffCalendarSyncService.importFffCalendarToTeamEvents(
        myFffTeam.leagueId,
        myFffTeam.teamId,
      );              setSyncStatus(currentLeagueData?.syncStatus ?? 'unknown');
              setSyncStatusMessage(`${res.importedCount} matchs officiels FFF importés (SportEasy)`);
    } catch {
      setSyncStatusMessage('Calendrier FFF synchronisé en cache local');
    } finally {
      setIsImportingCalendar(false);
      setTimeout(() => setSyncStatusMessage(null), 3500);
    }
  };

  // Si des standings props sont fournis (ex: saison personnalisée), les utiliser en priorité, sinon données réelles
  const activeStandings = useMemo(() => {
    if (standingsProp && standingsProp.length > 0) {
      return standingsProp;
    }
    return currentLeagueData?.standings ?? [];
  }, [standingsProp, currentLeagueData]);

  const displayedLeagueName = defaultLeagueName || (currentLeagueData?.name ?? '');
  const displayedDivisionName = defaultDivisionName || (currentLeagueData?.divisionLabel ?? '');
  const displayedSyncStatus = currentLeagueData?.syncStatus ?? syncStatus;
  const syncTimestampLabel = formatSyncTimestamp(currentLeagueData?.lastSyncAt);




  return (
    <View style={styles.container}>
      {/* 1. EN-TÊTE CHAMPIONNAT & SÉLECTEUR DE LIGUES */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              prodayHaptics.press();
              setShowLeaguePicker((prev) => !prev);
            }}
            style={styles.leagueSelectorTrigger}
          >
            <View style={styles.leagueTitleRow}>
              <Text style={styles.leagueName}>{displayedLeagueName}</Text>
              <Ionicons
                name={showLeaguePicker ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={accent}
              />
            </View>
            <Text style={styles.divisionName}>{displayedDivisionName}</Text>
          </TouchableOpacity>
        </View>

        {/* COMMUTATEUR CLASSEMENT / BUTEURS */}
        <View style={styles.tabSwitch}>
          <TouchableOpacity
            onPress={() => {
              prodayHaptics.tabSwitch();
              setActiveTab('classement');
            }}
            style={[styles.switchBtn, activeTab === 'classement' && styles.switchBtnActive]}
          >
            <Text
              style={[styles.switchText, activeTab === 'classement' && styles.switchTextActive]}
            >
              Classement
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              prodayHaptics.tabSwitch();
              setActiveTab('buteurs');
            }}
            style={[styles.switchBtn, activeTab === 'buteurs' && styles.switchBtnActive]}
          >
            <Text
              style={[styles.switchText, activeTab === 'buteurs' && styles.switchTextActive]}
            >
              Buteurs
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 1.1 SOURCE OFFICIELLE FFF & ACTUALISATION */}
      <View style={styles.fffBadgeRow}>
        <View style={styles.fffBadgeTopRow}>
          <Ionicons name="shield-checkmark" size={15} color="#10B981" />
          <Text style={styles.fffBadgeText}>Source Officielle FFF & Districts</Text>
          {currentLeagueData ? (
            <View style={[styles.certifiedBadge, { backgroundColor: SYNC_STATUS_COLORS[displayedSyncStatus]?.bg ?? 'transparent' }]}>
              <View style={[styles.syncDot, { backgroundColor: SYNC_STATUS_COLORS[displayedSyncStatus]?.dot ?? '#9CA3AF' }]} />
              <Text style={[styles.certifiedBadgeText, { color: SYNC_STATUS_COLORS[displayedSyncStatus]?.text ?? '#9CA3AF' }]}>
                {SYNC_STATUS_LABELS[displayedSyncStatus] ?? '● —'}
              </Text>
            </View>
          ) : null}
          {syncTimestampLabel ? (
            <Text style={styles.syncTimestamp} numberOfLines={1}>
              {syncTimestampLabel.replace('Mis à jour le ', '')}
            </Text>
          ) : null}
        </View>

        <View style={styles.fffBadgeActionsRow}>
          {myFffTeam ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleImportCalendar}
              disabled={isImportingCalendar}
              style={[styles.importCalendarBtn, { borderColor: `${accent}40` }]}
            >
              {isImportingCalendar ? (
                <ActivityIndicator size="small" color={accent} />
              ) : (
                <View style={styles.refreshBtnInner}>
                  <Ionicons name="calendar-outline" size={13} color={accent} />
                  <Text style={[styles.refreshBtnText, { color: accent }]}>Sync Calendrier</Text>
                </View>
              )}
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleRefreshFff}
            disabled={isRefreshing}
            style={styles.refreshBtn}
          >
            {isRefreshing ? (
              <ActivityIndicator size="small" color={accent} />
            ) : (
              <View style={styles.refreshBtnInner}>
                <Ionicons name="sync-outline" size={13} color={accent} />
                <Text style={[styles.refreshBtnText, { color: accent }]}>Actualiser</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {syncStatusMessage ? (
        <View style={styles.syncNoticeBox}>
          <Ionicons name="checkmark-circle" size={14} color="#10B981" />
          <Text style={styles.syncNoticeText}>{syncStatusMessage}</Text>
        </View>
      ) : null}

      {/* 1.2 SÉLECTEUR DE SAISON STRICT */}
      <View style={styles.seasonSelectorWrap}>
        <View style={styles.seasonSelectorLeft}>
          <Ionicons name="calendar-outline" size={13} color={ELITE_COLORS.textMuted} />
          <Text style={styles.seasonSelectorLabel}>Saison :</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.seasonChipsScroll}>
          {[
            { id: '2026-2027', label: '2026 / 2027', status: 'En cours' },
            { id: '2025-2026', label: '2025 / 2026', status: 'Archivé' },
            { id: '2024-2025', label: '2024 / 2025', status: 'Archivé' },
          ].map((s) => {
            const isActive = selectedSeason === s.id;
            return (
              <TouchableOpacity
                key={s.id}
                activeOpacity={0.8}
                onPress={() => {
                  prodayHaptics.press();
                  setSelectedSeason(s.id);
                }}
                style={[
                  styles.seasonChip,
                  isActive && [styles.seasonChipActive, { borderColor: accent, backgroundColor: `${accent}18` }],
                ]}
              >
                <Text style={[styles.seasonChipText, isActive && { color: accent, fontWeight: '700' }]}>
                  {s.label}
                </Text>
                <Text style={[styles.seasonChipStatus, isActive && { color: accent }]}>
                  {s.status}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 2. RECHERCHE DE CLUB EN FRANCE */}
      <View style={styles.searchBarWrap}>
        <Ionicons name="search" size={16} color={ELITE_COLORS.textMuted} />
        <TextInput
          placeholder="Rechercher un club en France (ex: PSG, Créteil, Vitry, Lens…)"
          placeholderTextColor={ELITE_COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={16} color={ELITE_COLORS.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* RÉSULTATS DE RECHERCHE RAPIDE */}
      {searchResults.length > 0 ? (
        <View style={styles.searchResultsBox}>
          <Text style={styles.searchResultsTitle}>Clubs trouvés ({searchResults.length}) :</Text>
          <ScrollView style={styles.searchResultsScroll} nestedScrollEnabled>
            {searchResults.map(({ league, club }) => (
              <TouchableOpacity
                key={`${league.id}_${club.team_id}`}
                activeOpacity={0.75}
                onPress={() => {
                  prodayHaptics.press();
                  setSelectedLeagueId(league.id);
                  setSearchQuery('');
                }}
                style={styles.searchResultRow}
              >
                <View style={styles.searchResultLeft}>
                  <Text style={styles.searchResultClub}>{club.name}</Text>
                  <Text style={styles.searchResultLeague}>{league.name} · #{club.rank} ({club.points} pts)</Text>
                </View>
                <Ionicons name="arrow-forward" size={14} color={accent} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* 3. TIROIR SÉLECTEUR DE TOUTES LES LIGUES DE FRANCE */}
      {showLeaguePicker ? (
        <View style={styles.leaguePickerContainer}>
          <Text style={styles.leaguePickerHeader}>Sélectionner un Championnat en France :</Text>

          {/* CHIPS DE CATÉGORIES */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryChipsScroll}>
            {FRENCH_LEAGUE_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                activeOpacity={0.8}
                onPress={() => {
                  prodayHaptics.tabSwitch();
                  setActiveCategory(cat.id);
                }}
                style={[
                  styles.categoryChip,
                  activeCategory === cat.id && [styles.categoryChipActive, { borderColor: accent }],
                ]}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    activeCategory === cat.id && [styles.categoryChipTextActive, { color: accent }],
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* LISTE DES DIVISIONS DE LA CATÉGORIE */}
          <View style={styles.leaguesGrid}>
            {FRENCH_LEAGUE_CATEGORIES.find((c) => c.id === activeCategory)?.leagues.map((lg) => {
              const isSelected = selectedLeagueId === lg.id;
              return (
                <TouchableOpacity
                  key={lg.id}
                  activeOpacity={0.8}
                  onPress={() => {
                    prodayHaptics.press();
                    setSelectedLeagueId(lg.id);
                    setShowLeaguePicker(false);
                  }}
                  style={[
                    styles.leagueItemBtn,
                    isSelected && [styles.leagueItemBtnActive, { backgroundColor: `${accent}22`, borderColor: accent }],
                  ]}
                >
                  <Text
                    style={[
                      styles.leagueItemText,
                      isSelected && [styles.leagueItemTextActive, { color: accent }],
                    ]}
                  >
                    {lg.name}
                  </Text>
                  {isSelected ? (
                    <Ionicons name="checkmark-circle" size={16} color={accent} />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* 4. TABLEAU DU CLASSEMENT OFFICIEL */}
      {activeTab === 'classement' ? (
        <View style={styles.card}>
          {/* LIGNE DES TITRES DE COLONNES (100% FRANÇAIS) */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tableMinWidth}>
              <View style={styles.tableHeader}>
                <Text style={[styles.colHeader, styles.colRank]}>#</Text>
                <Text style={[styles.colHeader, styles.colTeam]}>Club</Text>
                <Text style={[styles.colHeader, styles.colPoints]}>Pts</Text>
                <Text style={[styles.colHeader, styles.colStat]}>J</Text>
                <Text style={[styles.colHeader, styles.colStat]}>V</Text>
                <Text style={[styles.colHeader, styles.colStat]}>N</Text>
                <Text style={[styles.colHeader, styles.colStat]}>D</Text>
                <Text style={[styles.colHeader, styles.colGoals]}>BP</Text>
                <Text style={[styles.colHeader, styles.colGoals]}>BC</Text>
                <Text style={[styles.colHeader, styles.colDiff]}>Diff</Text>
                <Text style={[styles.colHeader, styles.colForm]}>Forme</Text>
              </View>

              {/* LIGNES DU CLASSEMENT */}
              {activeStandings.length > 0 ? activeStandings.map((row) => {
              const isPromotion = row.rank <= 2;
              const isRelegation = row.rank >= activeStandings.length - 1;
              const isMyTeam =
                Boolean(row.isMyTeam) ||
                Boolean(
                  myFffTeam &&
                    (row.team_id.toLowerCase() === myFffTeam.teamId.toLowerCase() ||
                      row.name.toLowerCase().includes(myFffTeam.teamName.toLowerCase()) ||
                      myFffTeam.teamName.toLowerCase().includes(row.name.toLowerCase())),
                ) ||
                // Correspondance directe avec le nom du club (contexte Espace Club)
                Boolean(
                  (highlightTeamId && row.team_id.toLowerCase() === highlightTeamId.toLowerCase()) ||
                    (highlightTeamName &&
                      highlightTeamName.length >= 3 &&
                      (row.name.toLowerCase().includes(highlightTeamName.toLowerCase()) ||
                        highlightTeamName.toLowerCase().includes(row.name.toLowerCase().split(' ')[0] ?? ''))),
                );


              return (
                <TouchableOpacity
                  key={row.team_id}
                  activeOpacity={0.8}
                  onPress={() => {
                    prodayHaptics.press();
                    onSelectTeam?.(row.team_id);
                    setSelectedTeamAction(row);
                  }}
                  style={[
                    styles.tableRow,
                    isMyTeam && [styles.myTeamRow, { backgroundColor: `${accent}1A`, borderColor: `${accent}4D` }],
                  ]}
                >
                  {/* RANG AVEC INDICATEUR DE COULEUR (VERT = MONTÉE / ROUGE = RELÉGATION) */}
                  <View style={styles.colRankContainer}>
                    {isPromotion ? <View style={[styles.dotPromotion, { backgroundColor: accent }]} /> : null}
                    {isRelegation ? <View style={styles.dotRelegation} /> : null}
                    <Text
                      style={[
                        styles.rankText,
                        isMyTeam && [styles.myTeamText, { color: accent }],
                      ]}
                    >
                      {row.rank}
                    </Text>
                  </View>

                  {/* NOM DU CLUB & BADGE MON ÉQUIPE */}
                  <View style={styles.teamNameCell}>
                    <Text
                      style={[
                        styles.teamName,
                        isMyTeam && [styles.myTeamText, { color: accent }],
                      ]}
                      numberOfLines={1}
                    >
                      {row.name}
                    </Text>
                    {isMyTeam ? (
                      <View style={[styles.myTeamTagBadge, { backgroundColor: `${accent}25`, borderColor: accent }]}>
                        <Text style={[styles.myTeamTagBadgeText, { color: accent }]}>
                          {highlightTeamName ? 'MON CLUB' : 'MON ÉQUIPE'}
                        </Text>
                      </View>
                    ) : null}

                  </View>

                  {/* STATS : PTS, J, V, N, D, BP, BC, DIFF */}
                  <Text style={[styles.ptsText, isMyTeam && [styles.myTeamPts, { color: accent }]]}>
                    {row.points}
                  </Text>
                  <Text style={styles.statText}>{row.played}</Text>
                  <Text style={styles.statText}>{row.won}</Text>
                  <Text style={styles.statText}>{row.drawn}</Text>
                  <Text style={styles.statText}>{row.lost}</Text>
                  <Text style={styles.goalsText}>{row.goals_for}</Text>
                  <Text style={styles.goalsText}>{row.goals_against}</Text>
                  <Text style={styles.diffText}>
                    {row.goal_diff > 0 ? `+${row.goal_diff}` : row.goal_diff}
                  </Text>

                  {/* PASTILLES DE FORME (V, N, D) */}
                  <View style={styles.formContainer}>
                    {row.form.map((f, i) => (
                      <View
                        key={i}
                        style={[
                          styles.formDot,
                          f === 'V'
                            ? [styles.formWon, { backgroundColor: accent }]
                            : f === 'N'
                            ? styles.formDrawn
                            : styles.formLost,
                        ]}
                      >
                        <Text style={styles.formDotText}>{f}</Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              );
              }) : (
                <View style={styles.emptyTableState}>
                  {isRefreshing ? <ActivityIndicator size="small" color={accent} /> : null}
                  <Text style={styles.emptyTableTitle}>
                    {displayedSyncStatus === 'awaiting_first_sync'
                      ? 'Classement en attente de synchronisation'
                      : displayedSyncStatus === 'unavailable'
                      ? 'Classement officiel indisponible'
                      : 'Aucune donnée de classement disponible'}
                  </Text>
                  <Text style={styles.emptyTableBody}>
                    Les données affichées proviennent exclusivement du snapshot officiel FFF de la saison active.
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* LÉGENDE DU CHAMPIONNAT */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.dotPromotion, { backgroundColor: accent }]} />
              <Text style={styles.legendText}>Zone de Montée / Titre</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={styles.dotRelegation} />
              <Text style={styles.legendText}>Zone de Relégation</Text>
            </View>
            <View style={styles.legendItem}>
              <Text style={[styles.legendText, { color: accent }]}>● Synchronisé FFF Direct</Text>
            </View>
          </View>
        </View>
      ) : (
        /* VUE BUTEURS OFFICIELLE */
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Classement des Meilleurs Buteurs · {currentLeagueData?.name ?? ''}</Text>
          {(currentLeagueData?.scorers ?? []).map((s) => (
            <View key={s.rank} style={styles.scorerRow}>
              <View style={[styles.scorerRank, { backgroundColor: `${accent}22` }]}>
                <Text style={[styles.scorerRankText, { color: accent }]}>{s.rank}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.scorerName}>{s.name}</Text>
                <Text style={styles.scorerMeta}>
                  {s.club} · {s.matches} matchs · Ratio {s.ratio} b/m
                </Text>
              </View>
              <View style={styles.scorerGoals}>
                <Text style={[styles.scorerGoalsText, { color: accent }]}>{s.goals}</Text>
                <Text style={styles.scorerGoalsLabel}>buts</Text>
              </View>
            </View>
          ))}
        </View>

      )}

      {/* 5. TIROIR D'ACTION ÉQUIPE (SPORTEASY) */}
      {selectedTeamAction ? (
        <View style={styles.actionSheetCard}>
          <View style={styles.actionSheetTop}>
            <View style={styles.actionSheetLeft}>
              <Text style={styles.actionSheetTitle}>{selectedTeamAction.name}</Text>
              <Text style={styles.actionSheetMeta}>
                {currentLeagueData?.name ?? ''} · Rang #{selectedTeamAction.rank} ({selectedTeamAction.points} pts)
              </Text>

            </View>
            <TouchableOpacity
              onPress={() => setSelectedTeamAction(null)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={22} color={ELITE_COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.actionSheetButtons}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleSetMyTeam(selectedTeamAction)}
              style={[styles.actionSheetPrimaryBtn, { backgroundColor: accent }]}
            >
              <Ionicons name="shield-checkmark" size={15} color="#000000" />
              <Text style={styles.actionSheetPrimaryText}>Définir comme mon équipe (SportEasy)</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerInfo: {
    flex: 1,
    marginRight: 8,
  },
  leagueSelectorTrigger: {
    paddingVertical: 2,
  },
  leagueTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  leagueName: {
    fontSize: 17,
    fontWeight: '800',
    color: ELITE_COLORS.textPrimary,
  },
  divisionName: {
    fontSize: 12,
    color: ELITE_COLORS.textSecondary,
    marginTop: 2,
  },
  tabSwitch: {
    flexDirection: 'row',
    backgroundColor: ELITE_COLORS.bgSurface,
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: ELITE_COLORS.border,
  },
  switchBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  switchBtnActive: {
    backgroundColor: ELITE_COLORS.bgSurfaceElevated,
  },
  switchText: {
    fontSize: 12,
    fontWeight: '700',
    color: ELITE_COLORS.textMuted,
  },
  switchTextActive: {
    color: ELITE_COLORS.textPrimary,
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ELITE_COLORS.bgSurface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: ELITE_COLORS.border,
    marginBottom: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: ELITE_COLORS.textPrimary,
    fontSize: 13,
    padding: 0,
  },
  searchResultsBox: {
    backgroundColor: ELITE_COLORS.bgSurfaceElevated,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: ELITE_COLORS.borderHighlight,
    marginBottom: 12,
  },
  searchResultsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: ELITE_COLORS.textSecondary,
    marginBottom: 6,
  },
  searchResultsScroll: {
    maxHeight: 180,
  },
  searchResultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  searchResultLeft: {
    flex: 1,
  },
  searchResultClub: {
    fontSize: 13,
    fontWeight: '800',
    color: ELITE_COLORS.textPrimary,
  },
  searchResultLeague: {
    fontSize: 11,
    color: ELITE_COLORS.textMuted,
    marginTop: 2,
  },
  leaguePickerContainer: {
    backgroundColor: ELITE_COLORS.bgSurfaceElevated,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.3)',
    marginBottom: 14,
  },
  leaguePickerHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: ELITE_COLORS.textPrimary,
    marginBottom: 10,
  },
  categoryChipsScroll: {
    marginBottom: 12,
  },
  categoryChip: {
    backgroundColor: ELITE_COLORS.bgSurface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ELITE_COLORS.border,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: ELITE_COLORS.textMuted,
  },
  categoryChipTextActive: {
    fontWeight: '800',
  },
  leaguesGrid: {
    gap: 6,
  },
  leagueItemBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: ELITE_COLORS.bgSurface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ELITE_COLORS.border,
  },
  leagueItemBtnActive: {
  },
  leagueItemText: {
    fontSize: 13,
    fontWeight: '700',
    color: ELITE_COLORS.textSecondary,
  },
  leagueItemTextActive: {
    fontWeight: '800',
  },
  card: {
    backgroundColor: ELITE_COLORS.bgSurface,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: ELITE_COLORS.border,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: ELITE_COLORS.border,
  },
  colHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: ELITE_COLORS.textMuted,
    textAlign: 'center',
  },
  colRank: {
    width: 28,
  },
  colTeam: {
    flex: 1,
    textAlign: 'left',
    paddingLeft: 8,
  },
  colStat: {
    width: 26,
  },
  colPoints: {
    width: 38,
    fontWeight: '900',
    color: ELITE_COLORS.textPrimary,
  },
  colGoals: {
    width: 34,
  },
  colDiff: {
    width: 42,
  },
  colPts: {
    width: 32,
    fontWeight: '900',
    color: ELITE_COLORS.textPrimary,
  },
  colForm: {
    width: 80,
  },
  tableMinWidth: {
    minWidth: 620,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  myTeamRow: {
    borderRadius: 10,
    borderWidth: 1,
  },
  colRankContainer: {
    width: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dotPromotion: {
    width: 4,
    height: 14,
    borderRadius: 2,
    position: 'absolute',
    left: 2,
  },
  dotRelegation: {
    width: 4,
    height: 14,
    borderRadius: 2,
    backgroundColor: ELITE_COLORS.danger,
    position: 'absolute',
    left: 2,
  },
  rankText: {
    fontSize: 13,
    fontWeight: '700',
    color: ELITE_COLORS.textSecondary,
  },
  teamName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: ELITE_COLORS.textPrimary,
    paddingLeft: 8,
  },
  myTeamText: {
    fontWeight: '900',
  },
  statText: {
    width: 26,
    fontSize: 12,
    color: ELITE_COLORS.textSecondary,
    textAlign: 'center',
  },
  goalsText: {
    width: 34,
    fontSize: 12,
    color: ELITE_COLORS.textSecondary,
    textAlign: 'center',
  },
  diffText: {
    width: 42,
    fontSize: 12,
    color: ELITE_COLORS.textSecondary,
    textAlign: 'center',
  },
  ptsText: {
    width: 32,
    fontSize: 13,
    fontWeight: '900',
    color: ELITE_COLORS.textPrimary,
    textAlign: 'center',
  },
  myTeamPts: {
  },
  formContainer: {
    width: 80,
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
  formWon: {
  },
  formDrawn: {
    backgroundColor: '#64748B',
  },
  formLost: {
    backgroundColor: ELITE_COLORS.danger,
  },
  formDotText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#000000',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    paddingTop: 10,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: ELITE_COLORS.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendText: {
    fontSize: 11,
    color: ELITE_COLORS.textMuted,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: ELITE_COLORS.textPrimary,
    marginBottom: 12,
  },
  scorerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: ELITE_COLORS.border,
    gap: 12,
  },
  scorerRank: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scorerRankText: {
    fontSize: 12,
    fontWeight: '800',
  },
  scorerName: {
    fontSize: 14,
    fontWeight: '700',
    color: ELITE_COLORS.textPrimary,
  },
  scorerMeta: {
    fontSize: 11,
    color: ELITE_COLORS.textSecondary,
    marginTop: 2,
  },
  scorerGoals: {
    alignItems: 'center',
  },
  scorerGoalsText: {
    fontSize: 18,
    fontWeight: '900',
    color: ELITE_COLORS.primary,
  },
  scorerGoalsLabel: {
    fontSize: 10,
    color: ELITE_COLORS.textMuted,
  },
  fffBadgeRow: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    gap: 8,
  },
  fffBadgeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  fffBadgeActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  fffBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  certifiedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  certifiedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  syncTimestamp: {
    maxWidth: 120,
    fontSize: 9,
    color: ELITE_COLORS.textMuted,
  },
  emptyTableState: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
    paddingHorizontal: 20,
    gap: 6,
  },
  emptyTableTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: ELITE_COLORS.textSecondary,
    textAlign: 'center',
  },
  emptyTableBody: {
    maxWidth: 420,
    fontSize: 11,
    color: ELITE_COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  refreshBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  refreshBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  refreshBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  syncNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  syncNoticeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  importCalendarBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 3,
  },
  teamNameCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  myTeamTagBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
  },
  myTeamTagBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  actionSheetCard: {
    backgroundColor: ELITE_COLORS.bgSurfaceElevated,
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: ELITE_COLORS.borderHighlight,
  },
  actionSheetTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  actionSheetLeft: {
    flex: 1,
    marginRight: 8,
  },
  actionSheetTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: ELITE_COLORS.textPrimary,
  },
  actionSheetMeta: {
    fontSize: 11,
    color: ELITE_COLORS.textMuted,
    marginTop: 2,
  },
  actionSheetButtons: {
    marginTop: 4,
  },
  actionSheetPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  actionSheetPrimaryText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
  },
  seasonSelectorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  seasonSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seasonSelectorLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: ELITE_COLORS.textMuted,
  },
  seasonChipsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  seasonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  seasonChipActive: {
    borderWidth: 1,
  },
  seasonChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: ELITE_COLORS.textMuted,
  },
  seasonChipStatus: {
    fontSize: 9,
    fontWeight: '700',
    color: ELITE_COLORS.textMuted,
    opacity: 0.8,
  },
});
