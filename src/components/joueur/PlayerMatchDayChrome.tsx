/**
 * Composition visuelle Accueil Joueur — hero match day + RSVP.
 * Univers Joueur (PLAYER_DARK / accent thème), pas navy Club.
 */
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableSpring, AnimatedEntrance } from '../motion';
import { Icon } from '../ui/Icon';
import type { IconName } from '../ui/iconNames';
import { ProDayText } from '../ui/ProDayText';
import { JOUEUR_RADIUS, JOUEUR_SURFACES } from '../../theme/joueurDesignSystem';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';
import { spacing } from '../../theme/designTokens';
import type { RsvpStatus } from '../../models/TeamEvent';
import {
  formatPlayerEventType,
  formatPlayerEventWhen,
  isPlayerRsvpYesSelected,
  needsPlayerRsvpResponse,
  playerDayPriorityKicker,
  playerRsvpStatusLabel,
  playerRsvpSuccessCopy,
  resolvePlayerEventRsvp,
  type PlayerDayPriority,
  type PlayerRsvpChoice,
} from '../../utils/amateurPlayerHome';

export type PlayerHubShortcut = {
  id: string;
  label: string;
  icon: IconName;
  onPress: () => void;
};

export const PlayerHubShortcutRow = React.memo(function PlayerHubShortcutRow({
  items,
  accent,
}: {
  items: PlayerHubShortcut[];
  accent: string;
}) {
  return (
    <View style={styles.shortcutRow}>
      {items.map((item) => (
        <PressableSpring
          key={item.id}
          onPress={item.onPress}
          scaleTo={0.97}
          haptic
          style={styles.shortcut}
          accessibilityRole="button"
          accessibilityLabel={item.label}
        >
          <Icon name={item.icon} size={14} color={accent} />
          <ProDayText variant="caption" style={styles.shortcutLabel}>
            {item.label}
          </ProDayText>
        </PressableSpring>
      ))}
    </View>
  );
});


export function PlayerMatchDayHero({
  priority,
  playerUid,
  accent,
  busy,
  onOpen,
  onChooseRsvp,
  showRsvp,
}: {
  priority: Exclude<PlayerDayPriority, { kind: 'calm' }>;
  playerUid: string;
  accent: string;
  busy?: boolean;
  onOpen: () => void;
  onChooseRsvp?: (choice: PlayerRsvpChoice) => void;
  showRsvp?: boolean;
}) {
  const event = priority.event;
  const rsvp = resolvePlayerEventRsvp(event, playerUid);
  const needs = needsPlayerRsvpResponse(rsvp);
  const isLive = priority.kind === 'live';
  const where = [event.location_label, event.city].filter(Boolean).join(' · ');

  return (
    <AnimatedEntrance kind="fadeUp" index={0} delayStep={36}>
      <View style={styles.hero}>
        <LinearGradient
          colors={[`${accent}33`, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={[styles.rail, { backgroundColor: isLive ? '#FF3B30' : accent }]} />

        <PressableSpring onPress={onOpen} scaleTo={0.98} haptic style={styles.heroHead}>
          <View style={[styles.iconBadge, { backgroundColor: `${accent}28` }]}>
            <Icon
              name={priority.kind === 'training' ? 'football' : 'trophy'}
              size={22}
              color={isLive ? '#FF3B30' : accent}
            />
          </View>
          <View style={styles.heroCopy}>
            <ProDayText variant="caption" style={[styles.kicker, { color: accent }]}>
              {playerDayPriorityKicker(priority.kind)}
            </ProDayText>
            <ProDayText variant="section" numberOfLines={2} style={styles.title}>
              {event.title}
            </ProDayText>
            <ProDayText variant="caption" style={styles.meta} numberOfLines={2}>
              {formatPlayerEventType(event)} · {formatPlayerEventWhen(event.starts_at)}
              {where ? ` · ${where}` : ''}
            </ProDayText>
          </View>
          {isLive ? (
            <View style={styles.livePill}>
              <ProDayText variant="caption" style={styles.livePillText}>
                LIVE
              </ProDayText>
            </View>
          ) : (
            <View style={[styles.statusPill, { borderColor: `${accent}55` }]}>
              <ProDayText variant="caption" style={{ color: accent, fontWeight: '800' }}>
                {playerRsvpStatusLabel(rsvp)}
              </ProDayText>
            </View>
          )}
        </PressableSpring>

        {showRsvp && onChooseRsvp ? (
          <>
            {!needs && rsvp ? (
              <View style={styles.success}>
                <Icon name="checkmark-circle" size={16} color={accent} />
                <ProDayText variant="caption" style={styles.successText}>
                  {playerRsvpSuccessCopy(rsvp)}
                </ProDayText>
              </View>
            ) : (
              <ProDayText variant="caption" style={styles.prompt}>
                Confirme en un tap — le coach est notifié.
              </ProDayText>
            )}
            <PlayerRsvpChoiceRow
              current={rsvp}
              accent={accent}
              busy={busy}
              onChoose={onChooseRsvp}
            />
          </>
        ) : null}

        <PressableSpring onPress={onOpen} scaleTo={0.97} haptic style={[styles.openCta, { backgroundColor: accent }]}>
          <ProDayText variant="caption" style={styles.openCtaLabel}>
            {isLive ? 'Ouvrir le live' : 'Voir la fiche'}
          </ProDayText>
          <Icon name="chevron-forward" size={12} color="#042f2e" />
        </PressableSpring>
      </View>
    </AnimatedEntrance>
  );
}

export function PlayerRsvpChoiceRow({
  current,
  accent,
  busy,
  onChoose,
}: {
  current?: RsvpStatus;
  accent: string;
  busy?: boolean;
  onChoose: (choice: PlayerRsvpChoice) => void;
}) {
  const choices: { id: PlayerRsvpChoice; label: string; selected: boolean }[] = [
    { id: 'yes', label: 'Je viens', selected: isPlayerRsvpYesSelected(current) },
    { id: 'no', label: 'Absent', selected: current === 'no' },
    { id: 'maybe', label: 'Peut-être', selected: current === 'maybe' },
  ];

  return (
    <View style={styles.rsvpRow}>
      {choices.map((choice) => {
        const on = choice.selected;
        const primary = choice.id === 'yes';
        return (
          <PressableSpring
            key={choice.id}
            onPress={() => onChoose(choice.id)}
            disabled={busy}
            scaleTo={0.97}
            haptic
            style={[
              styles.rsvpBtn,
              on && primary ? { backgroundColor: accent, borderColor: accent } : null,
              on && choice.id === 'no' ? styles.rsvpNoOn : null,
              on && choice.id === 'maybe' ? styles.rsvpMaybeOn : null,
              !on ? styles.rsvpOff : null,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: on, disabled: busy }}
            accessibilityLabel={choice.label}
          >
            {busy && on ? (
              <ActivityIndicator color={primary ? '#042f2e' : PLAYER_DARK.text} />
            ) : (
              <ProDayText
                variant="caption"
                style={[
                  styles.rsvpLabel,
                  on && primary ? styles.rsvpLabelOn : null,
                  on && choice.id === 'no' ? styles.rsvpLabelNo : null,
                ]}
              >
                {choice.label}
              </ProDayText>
            )}
          </PressableSpring>
        );
      })}
    </View>
  );
}

export function PlayerMatchDayEmpty({
  accent,
  onOpenMatchs,
  onOpenTrain,
}: {
  accent: string;
  onOpenMatchs: () => void;
  onOpenTrain?: () => void;
}) {
  return (
    <AnimatedEntrance kind="fadeUp" index={0} delayStep={36}>
      <View style={styles.empty}>
        <LinearGradient
          colors={[`${accent}22`, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={[styles.iconBadge, { backgroundColor: `${accent}28` }]}>
          <Icon name="calendar" size={22} color={accent} />
        </View>
        <ProDayText variant="section" style={styles.title}>
          Rien de prévu pour l’instant
        </ProDayText>
        <ProDayText variant="caption" style={styles.meta}>
          Dès qu’une convocation arrive, tu pourras répondre « Je viens » ou « Absent » ici.
        </ProDayText>
        <View style={styles.emptyCtas}>
          <PressableSpring
            onPress={onOpenMatchs}
            scaleTo={0.97}
            haptic
            style={[styles.openCta, { backgroundColor: accent }]}
          >
            <ProDayText variant="caption" style={styles.openCtaLabel}>
              Voir Matchs
            </ProDayText>
          </PressableSpring>
          {onOpenTrain ? (
            <PressableSpring onPress={onOpenTrain} scaleTo={0.97} haptic style={styles.emptyGhost}>
              <ProDayText variant="caption" style={styles.shortcutLabel}>
                S’entraîner
              </ProDayText>
            </PressableSpring>
          ) : null}
        </View>
      </View>
    </AnimatedEntrance>
  );
}

const styles = StyleSheet.create({
  shortcutRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  shortcut: {
    flexGrow: 1,
    flexBasis: '22%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: JOUEUR_SURFACES.card,
    borderWidth: 1,
    borderColor: JOUEUR_SURFACES.cardBorder,
  },
  shortcutLabel: {
    color: PLAYER_DARK.text,
    fontWeight: '800',
  },
  hero: {
    borderRadius: JOUEUR_RADIUS.lg,
    borderWidth: 1,
    borderColor: JOUEUR_SURFACES.cardBorder,
    backgroundColor: JOUEUR_SURFACES.card,
    padding: spacing.md,
    gap: spacing.sm,
    overflow: 'hidden',
  },
  rail: {
    position: 'absolute',
    left: 0,
    top: 16,
    bottom: 16,
    width: 4,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  heroHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: JOUEUR_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  heroCopy: { flex: 1, minWidth: 0, gap: 4 },
  kicker: {
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    fontSize: 11,
  },
  title: { color: PLAYER_DARK.text, fontWeight: '800' },
  meta: { color: PLAYER_DARK.textDim },
  livePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: JOUEUR_RADIUS.pill,
    backgroundColor: '#FF3B30',
    flexShrink: 0,
  },
  livePillText: { color: '#fff', fontWeight: '800', fontSize: 10 },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: JOUEUR_RADIUS.pill,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    flexShrink: 0,
  },
  prompt: { color: PLAYER_DARK.textMuted },
  success: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  successText: { flex: 1, color: PLAYER_DARK.text, fontWeight: '600' },
  rsvpRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  rsvpBtn: {
    flexGrow: 1,
    flexBasis: '28%',
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: spacing.md,
    borderRadius: JOUEUR_RADIUS.pill,
    borderWidth: 1,
  },
  rsvpOff: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: JOUEUR_SURFACES.cardBorder,
  },
  rsvpNoOn: {
    backgroundColor: 'rgba(239, 68, 68, 0.22)',
    borderColor: 'rgba(239, 68, 68, 0.45)',
  },
  rsvpMaybeOn: {
    backgroundColor: 'rgba(148, 163, 184, 0.24)',
    borderColor: JOUEUR_SURFACES.cardBorder,
  },
  rsvpLabel: { fontWeight: '800', color: PLAYER_DARK.text },
  rsvpLabelOn: { color: '#042f2e' },
  rsvpLabelNo: { color: '#FCA5A5' },
  openCta: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: JOUEUR_RADIUS.pill,
  },
  openCtaLabel: { color: '#042f2e', fontWeight: '800', fontSize: 12 },
  empty: {
    borderRadius: JOUEUR_RADIUS.lg,
    borderWidth: 1,
    borderColor: JOUEUR_SURFACES.cardBorder,
    backgroundColor: JOUEUR_SURFACES.card,
    padding: spacing.xl,
    gap: spacing.sm,
    overflow: 'hidden',
  },
  emptyCtas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  emptyGhost: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: JOUEUR_RADIUS.pill,
    borderWidth: 1,
    borderColor: JOUEUR_SURFACES.cardBorder,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
});
