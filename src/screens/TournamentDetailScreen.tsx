import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { Icon } from '../components/ui/Icon';
import { useAuth } from '../context/AuthContext';
import { tournamentService } from '../services/tournament.service';
import { teamEventsService } from '../services/teamEvents.service';
import { usersService } from '../services/users.service';
import { clubsService } from '../services/clubs.service';
import type { Tournament, TournamentStatus, TournamentMatch } from '../models/Tournament';
import { colors, spacing, radius, shadows } from '../theme/designTokens';

interface TournamentDetailScreenProps {
  tournamentId: string;
  onBack: () => void;
  onRegistered?: () => void;
}

const STATUS_LABEL: Record<TournamentStatus, string> = {
  OPEN: 'Inscriptions ouvertes',
  IN_PROGRESS: 'En cours',
  FINISHED: 'Terminé',
};

export const TournamentDetailScreen: React.FC<TournamentDetailScreenProps> = ({
  tournamentId,
  onBack,
  onRegistered,
}) => {
  const { profile } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [publishingAwards, setPublishingAwards] = useState(false);
  const [bestPlayer, setBestPlayer] = useState('');
  const [topScorer, setTopScorer] = useState('');
  const [bestGoalkeeper, setBestGoalkeeper] = useState('');
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [matchTeamA, setMatchTeamA] = useState('');
  const [matchTeamB, setMatchTeamB] = useState('');
  const [matchPhase, setMatchPhase] = useState<'poule' | 'elimination'>('poule');
  const [addingMatch, setAddingMatch] = useState(false);
  const [scoreDrafts, setScoreDrafts] = useState<Record<string, { a: string; b: string }>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, matchList] = await Promise.all([
        tournamentService.getById(tournamentId),
        tournamentService.listMatches(tournamentId),
      ]);
      setTournament(t);
      setMatches(matchList);
      if (t?.awards_names) {
        setBestPlayer(t.awards_names.best_player ?? '');
        setTopScorer(t.awards_names.top_scorer ?? '');
        setBestGoalkeeper(t.awards_names.best_goalkeeper ?? '');
      }
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    load();
  }, [load]);

  const clubUid = profile?.profile.club_id ?? profile?.uid;
  const isRegistered =
    !!clubUid && !!tournament?.subscriber_uids?.includes(clubUid);
  const isOrganizer = !!profile && tournament?.organizer_id === profile.uid;

  const handleRegister = async () => {
    if (!profile || !tournament) {
      Alert.alert('Connexion requise', 'Connectez-vous depuis l’onglet Profil.');
      return;
    }
    if (!clubUid) return;
    if (isRegistered) {
      Alert.alert('Déjà inscrit', 'Votre club est déjà inscrit à ce tournoi.');
      return;
    }
    setRegistering(true);
    try {
      await tournamentService.registerClub(tournament.id, clubUid);
      let convocationMsg = '';
      const clubId = profile.profile.club_id;
      if (clubId) {
        const club = await clubsService.getById(clubId);
        const members = await usersService.listMembersByClubId(clubId);
        const inviteeUids = members.map((m) => m.uid).filter((uid) => uid !== profile.uid);
        const eventId = await teamEventsService.createTournamentConvocation(
          tournament,
          profile.uid,
          profile.display_name,
          clubId,
          club?.name ?? profile.display_name,
          inviteeUids
        );
        if (eventId && inviteeUids.length > 0) {
          convocationMsg = ` Convocation envoyée à ${inviteeUids.length} membre(s).`;
        }
      }
      Alert.alert(
        'Inscription enregistrée',
        `Vous êtes inscrit à ${tournament.name}.${convocationMsg}`
      );
      await load();
      onRegistered?.();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Inscription impossible.');
    } finally {
      setRegistering(false);
    }
  };

  const handleStatusChange = async (status: TournamentStatus) => {
    if (!tournament) return;
    setStatusUpdating(true);
    try {
      await tournamentService.updateStatus(tournament.id, status);
      await load();
      onRegistered?.();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Mise à jour impossible.');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handlePublishAwards = async () => {
    if (!tournament) return;
    if (!bestPlayer.trim() || !topScorer.trim() || !bestGoalkeeper.trim()) {
      Alert.alert('Palmarès incomplet', 'Renseignez les trois lauréats.');
      return;
    }
    setPublishingAwards(true);
    try {
      await tournamentService.submitAwards(
        tournament.id,
        {
          best_player_uid: '',
          top_scorer_uid: '',
          best_goalkeeper_uid: '',
        },
        {
          best_player: bestPlayer.trim(),
          top_scorer: topScorer.trim(),
          best_goalkeeper: bestGoalkeeper.trim(),
        }
      );
      Alert.alert('Palmarès publié', 'Le tournoi est marqué comme terminé.');
      await load();
      onRegistered?.();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Publication impossible.');
    } finally {
      setPublishingAwards(false);
    }
  };

  const handleAddMatch = async () => {
    if (!tournament) return;
    if (!matchTeamA.trim() || !matchTeamB.trim()) {
      Alert.alert('Champs requis', 'Indiquez les deux équipes.');
      return;
    }
    setAddingMatch(true);
    try {
      await tournamentService.createMatch(tournament.id, {
        team_a_name: matchTeamA.trim(),
        team_b_name: matchTeamB.trim(),
        phase: matchPhase,
        scheduled_at: tournament.date_start,
      });
      setMatchTeamA('');
      setMatchTeamB('');
      await load();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Création impossible.');
    } finally {
      setAddingMatch(false);
    }
  };

  const handleSaveScore = async (match: TournamentMatch) => {
    if (!tournament) return;
    const draft = scoreDrafts[match.id] ?? {
      a: String(match.score_a),
      b: String(match.score_b),
    };
    const scoreA = parseInt(draft.a, 10);
    const scoreB = parseInt(draft.b, 10);
    if (!Number.isFinite(scoreA) || !Number.isFinite(scoreB)) {
      Alert.alert('Scores invalides', 'Saisissez des nombres entiers.');
      return;
    }
    try {
      await tournamentService.updateScore(tournament.id, match.id, scoreA, scoreB, true);
      await load();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Mise à jour impossible.');
    }
  };

  if (loading) {
    return (
      <View style={styles.root}>
        <ScreenHeader title="Tournoi" onBack={onBack} centered />
        <ActivityIndicator color={colors.brand} style={styles.loader} />
      </View>
    );
  }

  if (!tournament) {
    return (
      <View style={styles.root}>
        <ScreenHeader title="Tournoi" onBack={onBack} centered />
        <Text style={styles.missing}>Tournoi introuvable.</Text>
      </View>
    );
  }

  const dateRange = formatRange(tournament.date_start, tournament.date_end);
  const awards = tournament.awards_names;

  return (
    <View style={styles.root}>
      <ScreenHeader title="Arena" subtitle={tournament.name} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.hero, shadows.card]}>
          <View style={styles.heroBadge}>
            <Icon name="trophy" size={28} color={colors.accent} />
          </View>
          <Text style={styles.heroTitle}>{tournament.name}</Text>
          <Text style={styles.heroMeta}>
            {tournament.city} · {dateRange}
          </Text>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>{STATUS_LABEL[tournament.status]}</Text>
          </View>
        </View>

        <DetailBlock title="Catégories" icon="people">
          <Text style={styles.blockBody}>{tournament.categories.join(' · ')}</Text>
        </DetailBlock>

        <DetailBlock title="Clubs inscrits" icon="shield">
          <Text style={styles.blockBody}>
            {tournament.subscriber_uids?.length ?? 0} inscription(s)
          </Text>
        </DetailBlock>

        {!isOrganizer && matches.length > 0 ? (
          <DetailBlock title="Résultats & calendrier" icon="football">
            {matches.map((m) => (
              <View key={m.id} style={styles.matchRow}>
                <Text style={styles.matchTeams}>
                  {m.team_a_name} vs {m.team_b_name}
                </Text>
                <Text style={styles.blockBody}>
                  {m.played ? `${m.score_a} – ${m.score_b}` : 'À jouer'}
                  {m.scheduled_at
                    ? ` · ${m.scheduled_at.toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}`
                    : ''}
                </Text>
              </View>
            ))}
          </DetailBlock>
        ) : null}

        {isOrganizer && tournament.status !== 'OPEN' ? (
          <DetailBlock title="Calendrier & scores" icon="football">
            {matches.length === 0 ? (
              <Text style={styles.blockBody}>Aucun match programmé.</Text>
            ) : (
              matches.map((m) => {
                const draft = scoreDrafts[m.id] ?? {
                  a: String(m.score_a),
                  b: String(m.score_b),
                };
                return (
                  <View key={m.id} style={styles.matchRow}>
                    <Text style={styles.matchTeams}>
                      {m.team_a_name} vs {m.team_b_name}
                      {m.phase === 'elimination' ? ' · élim.' : ''}
                    </Text>
                    <View style={styles.scoreRow}>
                      <TextInput
                        style={styles.scoreInput}
                        value={draft.a}
                        onChangeText={(v) =>
                          setScoreDrafts((prev) => ({
                            ...prev,
                            [m.id]: { ...draft, a: v },
                          }))
                        }
                        keyboardType="number-pad"
                        placeholder="0"
                        placeholderTextColor={colors.textMuted}
                      />
                      <Text style={styles.scoreSep}>—</Text>
                      <TextInput
                        style={styles.scoreInput}
                        value={draft.b}
                        onChangeText={(v) =>
                          setScoreDrafts((prev) => ({
                            ...prev,
                            [m.id]: { ...draft, b: v },
                          }))
                        }
                        keyboardType="number-pad"
                        placeholder="0"
                        placeholderTextColor={colors.textMuted}
                      />
                      <TouchableOpacity
                        style={styles.scoreSaveBtn}
                        onPress={() => void handleSaveScore(m)}
                      >
                        <Text style={styles.scoreSaveText}>OK</Text>
                      </TouchableOpacity>
                    </View>
                    {m.played ? (
                      <Text style={styles.matchPlayed}>Joué</Text>
                    ) : null}
                  </View>
                );
              })
            )}
            {tournament.status !== 'FINISHED' ? (
              <>
                <AwardField label="Équipe A" value={matchTeamA} onChange={setMatchTeamA} />
                <AwardField label="Équipe B" value={matchTeamB} onChange={setMatchTeamB} />
                <View style={styles.phaseRow}>
                  <TouchableOpacity
                    style={[styles.phaseChip, matchPhase === 'poule' && styles.phaseChipOn]}
                    onPress={() => setMatchPhase('poule')}
                  >
                    <Text
                      style={[
                        styles.phaseChipText,
                        matchPhase === 'poule' && styles.phaseChipTextOn,
                      ]}
                    >
                      Poule
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.phaseChip,
                      matchPhase === 'elimination' && styles.phaseChipOn,
                    ]}
                    onPress={() => setMatchPhase('elimination')}
                  >
                    <Text
                      style={[
                        styles.phaseChipText,
                        matchPhase === 'elimination' && styles.phaseChipTextOn,
                      ]}
                    >
                      Élimination
                    </Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={[styles.orgBtn, addingMatch && styles.orgBtnDisabled]}
                  onPress={() => void handleAddMatch()}
                  disabled={addingMatch}
                >
                  <Text style={styles.orgBtnText}>
                    {addingMatch ? 'Ajout…' : 'Ajouter un match'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : null}
          </DetailBlock>
        ) : null}

        {isOrganizer && tournament.status !== 'FINISHED' && (
          <DetailBlock title="Gestion organisateur" icon="settings">
            <Text style={styles.organizerHint}>
              Passez le tournoi en cours puis publiez le palmarès pour le clôturer.
            </Text>
            {tournament.status === 'OPEN' ? (
              <TouchableOpacity
                style={[styles.orgBtn, statusUpdating && styles.orgBtnDisabled]}
                onPress={() => handleStatusChange('IN_PROGRESS')}
                disabled={statusUpdating}
              >
                <Text style={styles.orgBtnText}>
                  {statusUpdating ? 'Mise à jour…' : 'Démarrer le tournoi'}
                </Text>
              </TouchableOpacity>
            ) : null}
            {tournament.status === 'IN_PROGRESS' ? (
              <>
                <AwardField label="Meilleur joueur" value={bestPlayer} onChange={setBestPlayer} />
                <AwardField label="Buteur" value={topScorer} onChange={setTopScorer} />
                <AwardField
                  label="Gardien"
                  value={bestGoalkeeper}
                  onChange={setBestGoalkeeper}
                />
                <TouchableOpacity
                  style={[styles.orgBtnAccent, publishingAwards && styles.orgBtnDisabled]}
                  onPress={handlePublishAwards}
                  disabled={publishingAwards}
                >
                  <Text style={styles.orgBtnText}>
                    {publishingAwards ? 'Publication…' : 'Publier le palmarès'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : null}
          </DetailBlock>
        )}

        {tournament.status === 'FINISHED' && awards && (
          <DetailBlock title="Palmarès" icon="star-four-points">
            <HonorLine label="Meilleur joueur" value={awards.best_player ?? '—'} />
            <HonorLine label="Buteur" value={awards.top_scorer ?? '—'} />
            <HonorLine label="Gardien" value={awards.best_goalkeeper ?? '—'} />
          </DetailBlock>
        )}

        {tournament.status === 'OPEN' && profile && (
          <TouchableOpacity
            style={[
              styles.cta,
              isRegistered && styles.ctaDone,
              registering && styles.ctaDisabled,
            ]}
            onPress={handleRegister}
            disabled={registering || isRegistered}
          >
            <Text style={styles.ctaText}>
              {isRegistered
                ? 'Club déjà inscrit'
                : registering
                  ? 'Inscription…'
                  : 'Inscrire mon club'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const AwardField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
}> = ({ label, value, onChange }) => (
  <View style={styles.awardField}>
    <Text style={styles.awardLabel}>{label}</Text>
    <TextInput
      style={styles.awardInput}
      value={value}
      onChangeText={onChange}
      placeholder="Nom du lauréat"
      placeholderTextColor={colors.textMuted}
    />
  </View>
);

const DetailBlock: React.FC<{
  title: string;
  icon: 'people' | 'shield' | 'star-four-points' | 'settings' | 'football';
  children: React.ReactNode;
}> = ({ title, icon, children }) => (
  <View style={[styles.block, shadows.card]}>
    <View style={styles.blockHead}>
      <Icon name={icon} size={20} color={colors.brand} />
      <Text style={styles.blockTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

const HonorLine: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.honorRow}>
    <Text style={styles.honorLabel}>{label}</Text>
    <Text style={styles.honorValue}>{value}</Text>
  </View>
);

function formatRange(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const a = start.toLocaleDateString('fr-FR', opts);
  const b = end.toLocaleDateString('fr-FR', opts);
  return a === b ? a : `${a} – ${b}`;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  loader: { marginTop: spacing.xxl },
  missing: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  heroBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
  },
  heroMeta: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  statusPill: {
    marginTop: spacing.md,
    backgroundColor: colors.brandSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  statusText: { fontSize: 12, fontWeight: '800', color: colors.brand },
  block: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  blockHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  blockTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  blockBody: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  organizerHint: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  orgBtn: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  orgBtnAccent: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  orgBtnDisabled: { opacity: 0.65 },
  orgBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  awardField: { marginBottom: spacing.sm },
  awardLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, marginBottom: 4 },
  awardInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.background,
  },
  honorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  honorLabel: { fontSize: 13, color: colors.textMuted },
  honorValue: { fontSize: 14, fontWeight: '700', color: colors.text },
  matchRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
  matchTeams: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  scoreInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    fontSize: 14,
    textAlign: 'center',
    color: colors.text,
    backgroundColor: colors.background,
  },
  scoreSep: { fontSize: 14, fontWeight: '700', color: colors.textMuted },
  scoreSaveBtn: {
    backgroundColor: colors.ink,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  scoreSaveText: { color: colors.brandInverse, fontWeight: '800', fontSize: 12 },
  matchPlayed: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  phaseRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.sm },
  phaseChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  phaseChipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  phaseChipText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  phaseChipTextOn: { color: colors.brandInverse },
  cta: {
    marginTop: spacing.md,
    backgroundColor: colors.brand,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  ctaDone: { backgroundColor: colors.textMuted },
  ctaDisabled: { opacity: 0.7 },
  ctaText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
});
