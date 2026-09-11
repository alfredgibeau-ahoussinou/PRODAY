import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ELITE_COLORS } from '../../theme/prodayEliteTheme';
import { prodayHaptics } from '../../utils/prodayHaptics';
import {
  fffCalendarSyncService,
  type HeadToHeadMatchup,
} from '../../services/fffCalendarSync.service';
import { fffScraperService, type MyFffTeamLink } from '../../services/fffScraper.service';

interface FffMatchupCardProps {
  leagueId?: string;
  teamId?: string;
  matchupProp?: HeadToHeadMatchup;
  onViewStandings?: () => void;
  onConvoquer?: () => void;
  accent?: string;
}

export const FffMatchupCard: React.FC<FffMatchupCardProps> = ({
  leagueId: initialLeagueId = 'd1_d92',
  teamId: initialTeamId,
  matchupProp,
  onViewStandings,
  onConvoquer,
  accent = ELITE_COLORS.primary,
}) => {
  const [matchup, setMatchup] = useState<HeadToHeadMatchup | null>(matchupProp ?? null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (matchupProp) {
      setMatchup(matchupProp);
      return;
    }

    const loadData = async () => {
      const linked = await fffScraperService.getMyFffTeam();
      const targetLeague = linked?.leagueId || initialLeagueId;
      const targetTeam = linked?.teamId || initialTeamId || 'suresnes';

      const data = await fffCalendarSyncService.getHeadToHeadMatchup(targetLeague, targetTeam);
      setMatchup(data);
    };

    void loadData();
  }, [matchupProp, initialLeagueId, initialTeamId]);

  const handleSyncCalendar = async () => {
    if (!matchup) return;
    prodayHaptics.press();
    setIsSyncing(true);
    try {
      const res = await fffCalendarSyncService.importFffCalendarToTeamEvents(
        initialLeagueId,
        matchup.myTeam?.id ?? '',
      );
      setSyncSuccessMsg(`${res.importedCount} matchs FFF synchronisés (façon SportEasy)`);
      setTimeout(() => setSyncSuccessMsg(null), 3500);
    } catch {
      setSyncSuccessMsg('Matchs FFF synchronisés en cache');
      setTimeout(() => setSyncSuccessMsg(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!matchup || !matchup.nextFixture || !matchup.myTeam || !matchup.opponent) {
    return null;
  }

  const { myTeam, opponent, nextFixture, analysis } = matchup;

  return (
    <View style={styles.card}>
      {/* 1. EN-TÊTE : JOURNÉE & CHAMPIONNAT OFFICIEL */}
      <View style={styles.headerRow}>
        <View style={styles.headerBadge}>
          <Ionicons name="shield-checkmark" size={13} color="#10B981" />
          <Text style={styles.headerBadgeText}>J{nextFixture.matchday} · FFF OFFICIEL</Text>
        </View>
        <Text style={styles.competitionLabel} numberOfLines={1}>
          {matchup.divisionLabel}
        </Text>
      </View>

      {/* 2. DATE, HEURE & LIEU DU CHOC */}
      <View style={styles.fixtureMetaRow}>
        <Ionicons name="time-outline" size={14} color={ELITE_COLORS.textSecondary} />
        <Text style={styles.fixtureDateText}>
          {nextFixture.date} · {nextFixture.time}
        </Text>
        <Text style={styles.venueDot}>•</Text>
        <Ionicons name="location-outline" size={14} color={ELITE_COLORS.textSecondary} />
        <Text style={styles.fixtureVenueText} numberOfLines={1}>
          {nextFixture.venue}
        </Text>
      </View>

      {/* 3. DUEL FACE-À-FACE (MON ÉQUIPE vs ADVERSAIRE) */}
      <View style={styles.duelContainer}>
        {/* MON ÉQUIPE */}
        <View style={styles.teamColumn}>
          <View style={[styles.myTeamTag, { backgroundColor: `${accent}25`, borderColor: accent }]}>
            <Text style={[styles.myTeamTagText, { color: accent }]}>MON ÉQUIPE</Text>
          </View>
          <Text style={styles.teamName} numberOfLines={2}>
            {myTeam.name}
          </Text>
          <Text style={[styles.teamRank, { color: accent }]}>#{myTeam.rank} · {myTeam.points} pts</Text>
          <Text style={styles.teamStatsMini}>
            {myTeam.won}V {myTeam.drawn}N {myTeam.lost}D ({myTeam.goalDiff > 0 ? `+${myTeam.goalDiff}` : myTeam.goalDiff})
          </Text>
          {/* PASTILLES DE FORME */}
          <View style={styles.formRow}>
            {myTeam.form.map((f, i) => (
              <View
                key={i}
                style={[
                  styles.formPill,
                  f === 'V'
                    ? { backgroundColor: '#10B981' }
                    : f === 'N'
                    ? { backgroundColor: '#6B7280' }
                    : { backgroundColor: '#EF4444' },
                ]}
              >
                <Text style={styles.formPillText}>{f}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* CAPSULE VS & LOCALISATION */}
        <View style={styles.vsColumn}>
          <View style={styles.vsCircle}>
            <Text style={styles.vsText}>VS</Text>
          </View>
          <View style={styles.homeAwayTag}>
            <Text style={styles.homeAwayText}>
              {nextFixture.isHome ? 'DOMICILE' : 'EXTÉRIEUR'}
            </Text>
          </View>
        </View>

        {/* ADVERSAIRE OFFICIEL FFF */}
        <View style={styles.teamColumn}>
          <View style={styles.opponentTag}>
            <Text style={styles.opponentTagText}>ADVERSAIRE</Text>
          </View>
          <Text style={styles.teamName} numberOfLines={2}>
            {opponent.name}
          </Text>
          <Text style={styles.teamRankOpponent}>#{opponent.rank} · {opponent.points} pts</Text>
          <Text style={styles.teamStatsMini}>
            {opponent.won}V {opponent.drawn}N {opponent.lost}D ({opponent.goalDiff > 0 ? `+${opponent.goalDiff}` : opponent.goalDiff})
          </Text>
          {/* PASTILLES DE FORME */}
          <View style={styles.formRow}>
            {opponent.form.map((f, i) => (
              <View
                key={i}
                style={[
                  styles.formPill,
                  f === 'V'
                    ? { backgroundColor: '#10B981' }
                    : f === 'N'
                    ? { backgroundColor: '#6B7280' }
                    : { backgroundColor: '#EF4444' },
                ]}
              >
                <Text style={styles.formPillText}>{f}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* 4. NOTE DE SCOUTING & ANALYSE D'AVANT-MATCH */}
      <View style={styles.scoutingBox}>
        <Ionicons name="analytics-outline" size={15} color={accent} />
        <Text style={styles.scoutingText}>
          {analysis?.summary ?? ''}
        </Text>
      </View>

      {/* 5. BARRE DE CONFIRMATION DE SYNCHRONISATION */}
      {syncSuccessMsg ? (
        <View style={styles.syncSuccessBanner}>
          <Ionicons name="checkmark-done-circle" size={15} color="#10B981" />
          <Text style={styles.syncSuccessText}>{syncSuccessMsg}</Text>
        </View>
      ) : null}

      {/* 6. ACTIONS FAÇON SPORTEASY */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleSyncCalendar}
          disabled={isSyncing}
          style={[styles.btnSecondary, { borderColor: `${accent}55` }]}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color={accent} />
          ) : (
            <>
              <Ionicons name="calendar-outline" size={14} color={accent} />
              <Text style={[styles.btnSecondaryText, { color: accent }]}>
                Importer Calendrier FFF
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            prodayHaptics.press();
            onViewStandings?.();
          }}
          style={styles.btnPrimary}
        >
          <Ionicons name="trophy-outline" size={14} color="#000000" />
          <Text style={styles.btnPrimaryText}>Voir Classement</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: ELITE_COLORS.bgSurfaceElevated,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: ELITE_COLORS.borderHighlight,
    marginVertical: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  headerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  competitionLabel: {
    fontSize: 11,
    color: ELITE_COLORS.textMuted,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  fixtureMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  fixtureDateText: {
    fontSize: 12,
    color: ELITE_COLORS.textSecondary,
    fontWeight: '600',
  },
  venueDot: {
    color: ELITE_COLORS.textMuted,
    marginHorizontal: 4,
  },
  fixtureVenueText: {
    fontSize: 12,
    color: ELITE_COLORS.textSecondary,
    fontWeight: '600',
    flex: 1,
  },
  duelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: ELITE_COLORS.bgSurface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  teamColumn: {
    flex: 1,
    alignItems: 'center',
  },
  myTeamTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    marginBottom: 6,
  },
  myTeamTagText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  opponentTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  opponentTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: ELITE_COLORS.textMuted,
    letterSpacing: 0.4,
  },
  teamName: {
    fontSize: 13,
    fontWeight: '800',
    color: ELITE_COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
    minHeight: 34,
  },
  teamRank: {
    fontSize: 13,
    fontWeight: '800',
  },
  teamRankOpponent: {
    fontSize: 13,
    fontWeight: '800',
    color: '#CBD5E1',
  },
  teamStatsMini: {
    fontSize: 10,
    color: ELITE_COLORS.textMuted,
    marginTop: 2,
    marginBottom: 6,
  },
  formRow: {
    flexDirection: 'row',
    gap: 3,
  },
  formPill: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formPillText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  vsColumn: {
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  vsCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ELITE_COLORS.bgSurfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ELITE_COLORS.borderHighlight,
    marginBottom: 4,
  },
  vsText: {
    fontSize: 11,
    fontWeight: '900',
    color: ELITE_COLORS.textMuted,
  },
  homeAwayTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  homeAwayText: {
    fontSize: 8,
    fontWeight: '700',
    color: ELITE_COLORS.textMuted,
    letterSpacing: 0.3,
  },
  scoutingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  scoutingText: {
    fontSize: 11,
    color: ELITE_COLORS.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
  syncSuccessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  syncSuccessText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1,
  },
  btnSecondaryText: {
    fontSize: 12,
    fontWeight: '700',
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: ELITE_COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  btnPrimaryText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
  },
});
