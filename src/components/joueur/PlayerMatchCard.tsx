import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { JOUEUR_SURFACES, JOUEUR_RADIUS } from '../../theme/joueurDesignSystem';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';
import { spacing } from '../../theme/designTokens';
import type { TeamEvent } from '../../models/TeamEvent';
import { EVENT_TYPE_LABELS } from '../../models/TeamEvent';

type Props = {
  event: TeamEvent;
  accent?: string;
  subtitle?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

function formatWhen(d: Date): string {
  return d.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Carte événement match / entraînement — données teamEvents. */
export function PlayerMatchCard({
  event,
  accent = PLAYER_DARK.accent,
  subtitle,
  onPress,
  style,
}: Props) {
  const typeLabel = EVENT_TYPE_LABELS[event.event_type] ?? event.event_type;
  const body = (
    <View style={[styles.card, style]}>
      <View style={[styles.rail, { backgroundColor: accent }]} />
      <View style={styles.body}>
        <ProDayText variant="caption" style={styles.kicker}>
          {typeLabel.toUpperCase()}
        </ProDayText>
        <ProDayText variant="section" style={styles.title} numberOfLines={2}>
          {event.title}
        </ProDayText>
        <ProDayText variant="caption" style={styles.meta} numberOfLines={2}>
          {formatWhen(event.starts_at)}
          {event.location_label ? ` · ${event.location_label}` : ''}
        </ProDayText>
        {subtitle ? (
          <ProDayText variant="caption" style={[styles.sub, { color: accent }]} numberOfLines={2}>
            {subtitle}
          </ProDayText>
        ) : null}
      </View>
      {onPress ? <Icon name="chevron-forward" size={18} color={PLAYER_DARK.textMuted} /> : null}
    </View>
  );

  if (!onPress) return body;
  return (
    <PressableSpring onPress={onPress} scaleTo={0.98} haptic>
      {body}
    </PressableSpring>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: JOUEUR_RADIUS.md,
    backgroundColor: JOUEUR_SURFACES.card,
    borderWidth: 1,
    borderColor: JOUEUR_SURFACES.cardBorder,
  },
  rail: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: 2,
  },
  body: { flex: 1, minWidth: 0, gap: 2 },
  kicker: { color: PLAYER_DARK.textMuted, letterSpacing: 0.8 },
  title: { color: PLAYER_DARK.text },
  meta: { color: PLAYER_DARK.textDim },
  sub: { marginTop: 4 },
});
