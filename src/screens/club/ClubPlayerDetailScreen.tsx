import React, { useMemo, useState } from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';
import { PressableSpring, AnimatedEntrance } from '../../components/motion';
import { Icon } from '../../components/ui/Icon';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import { useClubShellNav } from '../../features/club/shell/ClubShellNavContext';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import {
  ClubActionRow,
  ClubChapterScroll,
  ClubEmptyState,
  ClubLoading,
  ClubSectionCard,
  ClubText,
} from '../../features/club/ui/clubUi';
import { ClubPlayerHero } from '../../features/club/ui/ClubPlayerHero';
import { membershipsService } from '../../services/memberships.service';
import { clubLicenseService } from '../../features/club/services/clubLicenseService';
import { teamEventsService } from '../../services/teamEvents.service';
import { isCoachMatchEvent, type PlayerMatchSheetStat } from '../../models/TeamEvent';
import { formatCoachRating, formatEvaluationSourceLabel, formatEvaluationStatusLabel } from '../../utils/coachEvaluationRatings';
import { canManageTeamEvent } from '../../utils/teamEventAccess';
import { PlayerStatsRatingModal, type PlayerStatsRatingModalMode } from '../../components/coach/PlayerStatsRatingModal';
import { proSemantic, PRO_DATA_VIOLET } from '../../theme/professionalDesign';
import { clubSpace } from '../../features/club/theme/clubDesignSystem';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';

type Props = {
  playerUid: string;
  onBack: () => void;
};

/**
 * Fiche joueur club — hero maillot/crest + infos club + évaluations & stats.
 * Pas de dossier médical. Pas de score inventé. Pas de carte pôle Joueur.
 */
export function ClubPlayerDetailScreen({ playerUid, onBack }: Props) {
  const shellNav = useClubShellNav();
  const profile = useSessionProfile();
  const { tokens, logoUrl } = useClubTheme();
  const ws = useClubWorkspace();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const [busy, setBusy] = useState(false);
  const [verifyingLicense, setVerifyingLicense] = useState(false);
  const [statsRatingModal, setStatsRatingModal] = useState<{
    uid: string;
    name: string;
    stat?: PlayerMatchSheetStat;
    mode: PlayerStatsRatingModalMode;
  } | null>(null);

  if (ws.loading) return <ClubLoading />;

  const player =
    ws.members.find((m) => m.uid === playerUid) ??
    ws.players.find((m) => m.uid === playerUid);
  const membership = ws.memberships.find((m) => m.player_uid === playerUid);
  const team = ws.teams.find((t) => t.id === membership?.team_id);
  const season = player?.profile?.season_stats;

  const playerMatches = useMemo(() => {
    return ws.events
      .filter(
        (e) =>
          isCoachMatchEvent(e) &&
          (e.invitee_uids.includes(playerUid) ||
            Boolean(e.player_match_stats?.[playerUid]) ||
            Boolean(e.lineup?.slots.some((s) => s.uid === playerUid))),
      )
      .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime());
  }, [ws.events, playerUid]);

  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const activeMatch = useMemo(() => {
    if (selectedMatchId) {
      return playerMatches.find((m) => m.id === selectedMatchId) ?? playerMatches[0] ?? null;
    }
    return playerMatches[0] ?? null;
  }, [playerMatches, selectedMatchId]);

  const activeStat: PlayerMatchSheetStat | undefined = activeMatch?.player_match_stats?.[playerUid];

  const canManage = useMemo(() => {
    if (!profile) return false;
    if (profile.is_admin || profile.role === 'club') return true;
    if (activeMatch) return canManageTeamEvent(activeMatch, profile, { isAdmin: profile.is_admin });
    return profile.role === 'coach';
  }, [profile, activeMatch]);

  const handleSaveModalStat = async (patch: Partial<PlayerMatchSheetStat>) => {
    if (!activeMatch || !profile?.uid || !statsRatingModal) return;
    try {
      await teamEventsService.updatePlayerMatchStat(
        activeMatch.id,
        statsRatingModal.uid,
        patch,
        {
          user: profile,
          isAdmin: profile.is_admin || profile.role === 'club',
        },
      );
      await ws.refresh();
      Alert.alert('Enregistré', 'Statistiques et évaluation mises à jour.');
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Enregistrement impossible.');
    }
  };

  if (!player) {
    return (
      <View style={styles.root}>
        <ClubChapterScroll>
          <ClubEmptyState
            title="Joueur introuvable"
            body="Ce profil n’est plus lié au club."
            actionLabel="Retour"
            onAction={onBack}
          />
        </ClubChapterScroll>
      </View>
    );
  }

  const statusLabel =
    membership?.status === 'pending'
      ? 'En attente'
      : membership?.status === 'active'
        ? membership.license_number
          ? 'Licencié'
          : 'Actif'
        : membership?.status ?? '—';

  const statusTone =
    membership?.status === 'active'
      ? 'ok'
      : membership?.status === 'pending'
        ? 'warn'
        : 'neutral';

  const approve = async () => {
    if (!profile?.uid || !membership) return;
    setBusy(true);
    try {
      await membershipsService.approve(membership.id, profile.uid);
      await ws.refresh();
    } catch (e) {
      Alert.alert('Adhésion', e instanceof Error ? e.message : 'Validation impossible.');
    } finally {
      setBusy(false);
    }
  };

  const reject = () => {
    if (!profile?.uid || !membership) return;
    Alert.alert('Refuser cette adhésion ?', 'Le joueur restera hors effectif actif.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Refuser',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setBusy(true);
            try {
              await membershipsService.reject(membership.id, profile.uid);
              await ws.refresh();
            } catch (e) {
              Alert.alert('Adhésion', e instanceof Error ? e.message : 'Refus impossible.');
            } finally {
              setBusy(false);
            }
          })();
        },
      },
    ]);
  };

  const handleVerifyLicense = async () => {
    if (!ws.clubId || !profile?.uid) return;
    setVerifyingLicense(true);
    try {
      await clubLicenseService.verifyPlayerLicense({
        clubId: ws.clubId,
        playerUid: player.uid,
        approverUid: profile.uid,
      });
      await ws.refresh();
      Alert.alert('Licence validée', `La licence de ${player.display_name || 'ce joueur'} a été certifiée avec succès.`);
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Impossible de certifier la licence.');
    } finally {
      setVerifyingLicense(false);
    }
  };

  const isVerified = (player.profile as Record<string, unknown> | undefined)?.verification_status === 'verified';

  return (
    <View style={styles.root}>
      <ClubChapterScroll>
        <PressableSpring
          onPress={onBack}
          scaleTo={0.97}
          haptic
          style={styles.back}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="arrow-back" size={18} color={tokens.accent} />
          <ClubText variant="caption" style={{ color: tokens.accent, fontWeight: '700' }}>
            Joueurs
          </ClubText>
        </PressableSpring>

        <AnimatedEntrance kind="zoom" index={0}>
          <ClubPlayerHero
            displayName={player.display_name || 'Joueur'}
            position={player.profile?.position}
            jerseyNumber={player.profile?.jersey_number}
            photoUrl={player.avatar_url}
            clubName={ws.club?.name ?? team?.name}
            clubLogoUrl={logoUrl}
            subtitle={
              // Évite « U17 · U17 » quand le nom d'équipe reprend déjà la catégorie.
              [team?.name, player.profile?.category]
                .filter((v, i, arr) => Boolean(v) && arr.indexOf(v) === i)
                .join(' · ') || undefined
            }
            statusLabel={statusLabel}
            statusTone={statusTone}
            stats={
              season
                ? {
                    matches: season.matches,
                    goals: season.goals,
                    assists: season.assists,
                  }
                : undefined
            }
          />
        </AnimatedEntrance>

        {/* Évaluation & Statistiques de Match */}
        {activeMatch ? (
          <ClubSectionCard
            title={`Évaluation & Statistiques (${activeMatch.title})`}
            subtitle={
              activeMatch.starts_at
                ? new Date(activeMatch.starts_at).toLocaleDateString('fr-FR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })
                : undefined
            }
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <View>
                <ClubText
                  variant="title"
                  style={{ color: activeStat?.rating !== undefined ? tokens.accent : tokens.muted }}
                >
                  {formatCoachRating(activeStat?.rating)}
                </ClubText>
                <ClubText variant="caption" muted>
                  {activeStat?.rating === 0
                    ? 'Note 0.0/10 attribuée'
                    : activeStat?.rating !== undefined
                      ? 'Note enregistrée'
                      : 'Non noté sur ce match'}
                </ClubText>
              </View>

              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                {activeStat?.source ? (
                  <View
                    style={{
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 4,
                      borderWidth: 1,
                      borderColor:
                        activeStat.source === 'ai_generated'
                          ? PRO_DATA_VIOLET
                          : activeStat.source === 'coach_reviewed'
                            ? proSemantic.success
                            : tokens.accent,
                    }}
                  >
                    <ClubText
                      variant="caption"
                      style={{
                        fontSize: 10,
                        fontWeight: '700',
                        color:
                          activeStat.source === 'ai_generated'
                            ? PRO_DATA_VIOLET
                            : activeStat.source === 'coach_reviewed'
                              ? proSemantic.success
                              : tokens.accent,
                      }}
                    >
                      {formatEvaluationSourceLabel(activeStat.source)}
                    </ClubText>
                  </View>
                ) : null}

                {activeStat?.status ? (
                  <View
                    style={{
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 4,
                      borderWidth: 1,
                      borderColor:
                        activeStat.status === 'published'
                          ? proSemantic.success
                          : proSemantic.warning,
                    }}
                  >
                    <ClubText
                      variant="caption"
                      style={{
                        fontSize: 10,
                        fontWeight: '700',
                        color:
                          activeStat.status === 'published'
                            ? proSemantic.success
                            : proSemantic.warning,
                      }}
                    >
                      {formatEvaluationStatusLabel(activeStat.status)}
                    </ClubText>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Stats grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 }}>
              <View style={{ alignItems: 'center', minWidth: 50 }}>
                <ClubText variant="section">
                  {activeStat?.minutes_played != null ? `${activeStat.minutes_played}'` : '—'}
                </ClubText>
                <ClubText variant="caption" muted>
                  Minutes
                </ClubText>
              </View>
              <View style={{ alignItems: 'center', minWidth: 50 }}>
                <ClubText variant="section">{activeStat?.goals ?? 0}</ClubText>
                <ClubText variant="caption" muted>
                  Buts
                </ClubText>
              </View>
              <View style={{ alignItems: 'center', minWidth: 50 }}>
                <ClubText variant="section">{activeStat?.assists ?? 0}</ClubText>
                <ClubText variant="caption" muted>
                  Passes
                </ClubText>
              </View>
              <View style={{ alignItems: 'center', minWidth: 50 }}>
                <ClubText variant="section">{activeStat?.yellow_cards ?? 0}</ClubText>
                <ClubText variant="caption" muted>
                  Jaunes
                </ClubText>
              </View>
              <View style={{ alignItems: 'center', minWidth: 50 }}>
                <ClubText variant="section">{activeStat?.red_cards ?? 0}</ClubText>
                <ClubText variant="caption" muted>
                  Rouges
                </ClubText>
              </View>
            </View>

            {activeStat?.rating_explanation ? (
              <ClubText variant="caption" muted style={{ fontStyle: 'italic', marginVertical: 6 }}>
                « {activeStat.rating_explanation} »
              </ClubText>
            ) : null}

            {canManage ? (
              <View style={{ gap: 8, marginTop: 8 }}>
                <ClubActionRow
                  icon="stats-chart"
                  label="Modifier les statistiques"
                  hint="Temps de jeu, buts, passes, cartons, clean sheet"
                  onPress={() => {
                    setStatsRatingModal({
                      uid: playerUid,
                      name: player.display_name || 'Joueur',
                      stat: activeStat,
                      mode: 'stats',
                    });
                  }}
                />
                <ClubActionRow
                  icon="star"
                  label="Ajouter ou modifier la note"
                  hint="Échelle 0-10, appréciation et publication"
                  onPress={() => {
                    setStatsRatingModal({
                      uid: playerUid,
                      name: player.display_name || 'Joueur',
                      stat: activeStat,
                      mode: 'rating',
                    });
                  }}
                />
              </View>
            ) : null}
          </ClubSectionCard>
        ) : null}

        {membership?.status === 'pending' ? (
          <ClubSectionCard title="Adhésion">
            <ClubText variant="body" muted>
              Demande en attente de validation staff.
            </ClubText>
            <ClubActionRow
              icon="checkmark-circle"
              label="Confirmer"
              hint="Active le membre dans l’effectif"
              onPress={() => !busy && void approve()}
            />
            <ClubActionRow
              icon="close"
              label="Refuser"
              hint="Hors effectif actif"
              onPress={() => !busy && reject()}
            />
          </ClubSectionCard>
        ) : null}

        <ClubSectionCard title="Identité club">
          <ClubText variant="body" muted>
            Catégorie : {player.profile?.category || '—'}
          </ClubText>
          <ClubText variant="body" muted>
            Poste : {player.profile?.position || '—'}
          </ClubText>
          <ClubText variant="body" muted>
            Maillot :{' '}
            {player.profile?.jersey_number != null ? `#${player.profile.jersey_number}` : '—'}
          </ClubText>
          <ClubText variant="body" muted>
            Licence : {membership?.license_number || 'Non renseignée'}
          </ClubText>
          <ClubText variant="caption" muted>
            Pas de dossier médical sur cette fiche.
          </ClubText>
        </ClubSectionCard>

        <ClubSectionCard title="Contact">
          {player.email ? (
            <ClubActionRow
              icon="mail"
              label={player.email}
              hint="E-mail"
              onPress={() => void Linking.openURL(`mailto:${player.email}`)}
            />
          ) : (
            <ClubText variant="body" muted>
              Aucun e-mail renseigné.
            </ClubText>
          )}
          {player.phone ? (
            <ClubActionRow
              icon="call"
              label={player.phone}
              hint="Téléphone"
              onPress={() => void Linking.openURL(`tel:${player.phone}`)}
            />
          ) : null}
        </ClubSectionCard>

        <ClubSectionCard title="Raccourcis">
          <ClubActionRow
            icon="football"
            label="Équipes"
            hint={team?.name ? `Catégorie : ${team.name}` : 'Affectation catégories'}
            onPress={() => shellNav?.requestNav('teams')}
          />
          <ClubActionRow
            icon="mail"
            label="Inviter un membre"
            onPress={() => shellNav?.openCreate?.('invite_member')}
          />
        </ClubSectionCard>

        <ClubSectionCard title="Licence & Documents FFF">
          <ClubText variant="body" muted>
            Numéro FFF : {membership?.license_number || (player.profile as Record<string, unknown> | undefined)?.license_number as string || 'Non renseigné'}
          </ClubText>
          <ClubText variant="caption" muted style={{ marginTop: 2, marginBottom: 8 }}>
            Certification : {isVerified ? '✓ Certifié Footclubs FFF' : 'À vérifier auprès de la ligue'}
          </ClubText>
          {!isVerified && ws.clubId && profile ? (
            <ClubActionRow
              icon="checkmark-circle"
              label={verifyingLicense ? 'Certification en cours…' : 'Certifier la licence Footclubs (1 tap)'}
              hint="Marque la licence comme vérifiée pour la saison"
              onPress={() => !verifyingLicense && void handleVerifyLicense()}
            />
          ) : null}
          <ClubActionRow
            icon="document-text"
            label="Module Licences & Documents"
            hint="Imports CSV Footclubs, certificats et exports"
            onPress={() => shellNav?.requestNav('licenses')}
          />
        </ClubSectionCard>
      </ClubChapterScroll>

      {activeMatch && statsRatingModal ? (
        <PlayerStatsRatingModal
          visible={statsRatingModal !== null}
          onClose={() => setStatsRatingModal(null)}
          playerUid={statsRatingModal.uid}
          playerName={statsRatingModal.name}
          matchTitle={activeMatch.title}
          matchDateLabel={
            activeMatch.starts_at
              ? new Date(activeMatch.starts_at).toLocaleDateString('fr-FR')
              : undefined
          }
          initialStat={statsRatingModal.stat}
          initialMode={statsRatingModal.mode}
          onSave={handleSaveModalStat}
        />
      ) : null}
    </View>
  );
}

const createStyles = (_tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    back: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      paddingVertical: clubSpace.xs,
    },
  });
