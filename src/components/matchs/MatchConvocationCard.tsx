import React, { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableSpring } from '../motion/PressableSpring';
import { prodayHaptics } from '../../utils/prodayHaptics';
import type { TeamEvent } from '../../models/TeamEvent';
import type { RsvpStatus } from '../../models/TeamEvent';
import { EVENT_TYPE_LABELS, RSVP_STATUS_LABELS } from '../../models/TeamEvent';
import { userRsvp } from '../../models/TeamEvent';
import { resolveLiveState, isInMatchWindow } from '../../utils/matchLive';
import { ProDayText } from '../ui/ProDayText';
import { formatTrainingSessionTitle } from '../../utils/teamEventFormatting';
import { LateReportControl } from '../team/LateReportControl';
import { useAppTheme } from '../../context/ProductLineContext';
import { useMatchSkinTokens } from './matchCenterUi';
import { usePlayerTheme, usePlayerThemeColors } from '../../context/PlayerThemeContext';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';
import { spacing } from '../../theme/designTokens';

export interface MatchConvocationCardProps {
  event: TeamEvent;
  profileUid: string;
  playerName?: string;
  pending?: boolean;
  onOpen: () => void;
  onRsvp?: (status: RsvpStatus) => void;
  rsvpBusy?: boolean;
  onOpenCarpool?: () => void;
  onLateReported?: () => void;
  reportedByParent?: boolean;
}

const EVENT_TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  friendly: 'football-outline',
  competition: 'trophy-outline',
  tournament: 'ribbon-outline',
  training: 'shirt-outline',
  detection: 'eye-outline',
  meeting: 'chatbubbles-outline',
  other: 'calendar-outline',
};

export const MatchConvocationCard: React.FC<MatchConvocationCardProps> = ({
  event,
  profileUid,
  playerName,
  pending = false,
  onOpen,
  onRsvp,
  rsvpBusy = false,
  onOpenCarpool,
  onLateReported,
  reportedByParent,
}) => {
  const { colors } = useAppTheme();
  const skin = useMatchSkinTokens();
  const playerThemeCtx = usePlayerTheme();
  const playerTheme = usePlayerThemeColors();
  const teamPrimary = playerThemeCtx.clubColors?.primary ?? playerTheme.accent ?? skin.accent;

  const [showRsvpEdit, setShowRsvpEdit] = useState(false);

  const status = userRsvp(event, profileUid);
  const isPendingEffective = pending || status === 'pending';
  const showRsvpButtons = (isPendingEffective || showRsvpEdit) && Boolean(onRsvp);

  const live = resolveLiveState(event);
  const showScore =
    isInMatchWindow(event) ||
    (event.live_actions?.length ?? 0) > 0 ||
    Boolean(event.live_state);

  const dateLabel = event.starts_at.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  const typeIcon = EVENT_TYPE_ICONS[event.event_type] || 'calendar-outline';
  const typeLabel = EVENT_TYPE_LABELS[event.event_type] || 'Événement';

  const playerSlot = useMemo(() => {
    if (!event.lineup?.slots || !profileUid) return null;
    return event.lineup.slots.find((s) => s.uid === profileUid);
  }, [event.lineup, profileUid]);

  return (
    <PressableSpring style={styles.card} onPress={onOpen} scaleTo={0.985} haptic>
      {/* Top Accent Strip */}
      <View
        style={[
          styles.topAccentStrip,
          {
            backgroundColor: isPendingEffective
              ? skin.warn
              : status === 'yes'
                ? teamPrimary
                : 'rgba(255, 255, 255, 0.1)',
          },
        ]}
      />

      <View style={styles.body}>
        {/* Header : Type & Date */}
        <View style={styles.topRow}>
          <View
            style={[
              styles.typePill,
              {
                backgroundColor: isPendingEffective ? `${skin.warn}18` : `${teamPrimary}18`,
                borderColor: isPendingEffective ? `${skin.warn}40` : `${teamPrimary}40`,
              },
            ]}
          >
            <Ionicons
              name={typeIcon}
              size={12}
              color={isPendingEffective ? skin.warn : teamPrimary}
            />
            <ProDayText
              variant="caption"
              style={[
                styles.typeText,
                { color: isPendingEffective ? skin.warn : teamPrimary },
              ]}
            >
              {typeLabel}
            </ProDayText>
          </View>

          <View style={styles.dateBadge}>
            <Ionicons name="time-outline" size={13} color={PLAYER_DARK.textMuted} />
            <ProDayText variant="caption" style={styles.dateText}>
              {dateLabel}
            </ProDayText>
          </View>
        </View>

        {/* Titre Match / Événement */}
        <ProDayText variant="title" numberOfLines={2} style={styles.title}>
          {event.event_type === 'training' ? formatTrainingSessionTitle(event) : event.title}
        </ProDayText>

        {/* Lieu et Organisateur */}
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={14} color={teamPrimary} />
          <ProDayText variant="caption" style={styles.metaText} numberOfLines={1}>
            {event.city ? `${event.city} · ` : ''}{event.location_label || event.organizer_name}
          </ProDayText>
        </View>

        {/* Score Live si en cours */}
        {showScore ? (
          <View style={[styles.scoreBadge, { borderColor: `${teamPrimary}40` }]}>
            <View style={[styles.liveDot, { backgroundColor: teamPrimary }]} />
            <ProDayText variant="caption" style={[styles.scoreText, { color: teamPrimary }]}>
              {live.home_label} {live.home_score} — {live.away_score} {live.opponent_name}
              {isInMatchWindow(event) && live.minute != null ? ` · ${live.minute}'` : ''}
            </ProDayText>
          </View>
        ) : null}

        {/* Info Compo & Rôle du joueur */}
        {event.lineup ? (
          <View style={styles.lineupRow}>
            <Ionicons name="people-outline" size={13} color={PLAYER_DARK.textMuted} />
            <ProDayText variant="caption" style={styles.lineupText}>
              {playerSlot ? (
                <ProDayText style={{ color: teamPrimary, fontWeight: '800' }}>
                  {playerSlot.role === 'starter' ? 'Titulaire' : 'Remplaçant'}
                  {playerSlot.position_label ? ` (${playerSlot.position_label})` : ''} ·{' '}
                </ProDayText>
              ) : null}
              Compo {event.lineup.formation}
            </ProDayText>
          </View>
        ) : null}

        {/* Section RSVP : Boutons d'action immédiate */}
        {showRsvpButtons ? (
          <View style={[styles.rsvpContainer, { borderColor: `${skin.warn}40` }]}>
            <View style={styles.rsvpPromptRow}>
              <Ionicons name="notifications-outline" size={14} color={skin.warn} />
              <ProDayText variant="caption" style={[styles.rsvpPromptText, { color: skin.warn }]}>
                Réponse demandée par le coach
              </ProDayText>
            </View>

            <View style={styles.rsvpBtnRow}>
              <PressableSpring
                disabled={rsvpBusy}
                scaleTo={0.95}
                style={[
                  styles.rsvpPrimaryBtn,
                  { backgroundColor: teamPrimary },
                ]}
                onPress={() => {
                  prodayHaptics.confirm();
                  setShowRsvpEdit(false);
                  onRsvp?.('yes');
                }}
              >
                <Ionicons name="checkmark-circle" size={16} color={PLAYER_DARK.bg} />
                <ProDayText variant="caption" style={styles.rsvpPrimaryBtnText}>
                  Présent
                </ProDayText>
              </PressableSpring>

              <PressableSpring
                disabled={rsvpBusy}
                scaleTo={0.95}
                style={[
                  styles.rsvpGhostBtn,
                  {
                    borderColor: `${skin.warn}70`,
                    backgroundColor: `${skin.warn}12`,
                  },
                ]}
                onPress={() => {
                  prodayHaptics.press();
                  setShowRsvpEdit(false);
                  onRsvp?.('maybe');
                }}
              >
                <Ionicons name="help-circle-outline" size={16} color={skin.warn} />
                <ProDayText variant="caption" style={[styles.rsvpGhostBtnText, { color: skin.warn }]}>
                  Incertain
                </ProDayText>
              </PressableSpring>

              <PressableSpring
                disabled={rsvpBusy}
                scaleTo={0.95}
                style={[
                  styles.rsvpGhostBtn,
                  {
                    borderColor: 'rgba(255, 255, 255, 0.15)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  },
                ]}
                onPress={() => {
                  prodayHaptics.press();
                  setShowRsvpEdit(false);
                  onRsvp?.('no');
                }}
              >
                <Ionicons name="close-circle-outline" size={16} color={PLAYER_DARK.textMuted} />
                <ProDayText variant="caption" style={[styles.rsvpGhostBtnText, { color: PLAYER_DARK.textMuted }]}>
                  Absent
                </ProDayText>
              </PressableSpring>
            </View>
          </View>
        ) : (
          /* Statut Déjà Répondu */
          <View style={styles.statusDisplayRow}>
            <View
              style={[
                styles.statusBadge,
                status === 'yes'
                  ? { backgroundColor: `${teamPrimary}1C`, borderColor: `${teamPrimary}50` }
                  : status === 'no'
                    ? { backgroundColor: 'rgba(255, 255, 255, 0.06)', borderColor: 'rgba(255, 255, 255, 0.12)' }
                    : { backgroundColor: `${skin.warn}18`, borderColor: `${skin.warn}40` },
              ]}
            >
              <Ionicons
                name={
                  status === 'yes'
                    ? 'checkmark-circle'
                    : status === 'no'
                      ? 'close-circle'
                      : 'alert-circle'
                }
                size={14}
                color={
                  status === 'yes'
                    ? teamPrimary
                    : status === 'no'
                      ? PLAYER_DARK.textMuted
                      : skin.warn
                }
              />
              <ProDayText
                variant="caption"
                style={[
                  styles.statusText,
                  {
                    color:
                      status === 'yes'
                        ? teamPrimary
                        : status === 'no'
                          ? PLAYER_DARK.textMuted
                          : skin.warn,
                  },
                ]}
              >
                {status === 'yes'
                  ? 'Présence confirmée'
                  : status === 'no'
                    ? 'Noté absent'
                    : RSVP_STATUS_LABELS[status]}
              </ProDayText>
            </View>

            {onRsvp ? (
              <PressableSpring
                onPress={() => setShowRsvpEdit(true)}
                scaleTo={0.96}
                haptic
                style={styles.editRsvpBtn}
              >
                <ProDayText variant="caption" style={[styles.editRsvpText, { color: teamPrimary }]}>
                  Modifier
                </ProDayText>
              </PressableSpring>
            ) : null}
          </View>
        )}

        {/* Barre des raccourcis logistiques */}
        <View style={styles.footerRow}>
          {onOpenCarpool ? (
            <PressableSpring
              onPress={onOpenCarpool}
              scaleTo={0.96}
              haptic
              style={[styles.actionBtn, { borderColor: `${teamPrimary}30` }]}
            >
              <Ionicons name="car-sport-outline" size={13} color={teamPrimary} />
              <ProDayText variant="caption" style={[styles.actionBtnText, { color: teamPrimary }]}>
                Covoiturage
              </ProDayText>
            </PressableSpring>
          ) : null}

          <PressableSpring
            onPress={onOpen}
            scaleTo={0.96}
            haptic
            style={styles.actionBtnGhost}
          >
            <ProDayText variant="caption" style={styles.actionBtnGhostText}>
              Feuille de match →
            </ProDayText>
          </PressableSpring>
        </View>

        {/* Signalement de retard compact */}
        <LateReportControl
          eventId={event.id}
          playerUid={profileUid}
          playerName={playerName}
          currentRsvp={status}
          reportedByParent={reportedByParent}
          compact
          onReported={onLateReported}
        />
      </View>
    </PressableSpring>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: PLAYER_DARK.surfaceRaised,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  topAccentStrip: {
    height: 3,
    width: '100%',
  },
  body: {
    padding: 16,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  typeText: {
    fontSize: 10.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: PLAYER_DARK.textMuted,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: PLAYER_DARK.text,
    letterSpacing: -0.3,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12.5,
    color: PLAYER_DARK.textMuted,
    fontWeight: '600',
    flex: 1,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '800',
  },
  lineupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  lineupText: {
    fontSize: 12,
    color: PLAYER_DARK.textMuted,
    fontWeight: '600',
  },
  rsvpContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginTop: 6,
    gap: 8,
  },
  rsvpPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rsvpPromptText: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  rsvpBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rsvpPrimaryBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  rsvpPrimaryBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: PLAYER_DARK.bg,
  },
  rsvpGhostBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  rsvpGhostBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  editRsvpBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editRsvpText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: PLAYER_DARK.border,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  actionBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  actionBtnGhost: {
    marginLeft: 'auto',
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  actionBtnGhostText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: PLAYER_DARK.textMuted,
  },
});
