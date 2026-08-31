import React, { useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { PlayerShieldCardCompact } from './PlayerShieldCardCompact';
import type { ProDayCardData } from '../../models/ProDayCard';
import { useJoueurTheme } from '../../hooks/useJoueurTheme';
import { JOUEUR_SURFACES } from '../../theme/joueurDesignSystem';
import { spacing } from '../../theme/designTokens';

type ListCardProps = {
  variant: 'list';
  kicker?: string;
  title: string;
  subtitle?: string;
  meta?: string;
  accentBar?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

type FutCardProps = {
  variant: 'fut';
  card: ProDayCardData;
  width?: number;
  onPress?: () => void;
};

type PlayerCardVariant = {
  variant: 'player';
  displayName: string;
  position?: string | null;
  photoUrl?: string | null;
  clubName?: string | null;
  stats?: {
    matches?: number | null;
    rating?: number | null;
    goals?: number | null;
    assists?: number | null;
  };
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

type Props = ListCardProps | FutCardProps | PlayerCardVariant;

/** Carte unifiée pôle joueur — liste premium ou FUT statique. */
export function JoueurCard(props: Props) {
  if (props.variant === 'fut') {
    const { card, width, onPress } = props;
    const playerStats =
      card.role === 'player'
        ? {
            matches: card.matches,
            goals: card.goals,
            assists: card.assists,
            rating: card.overall > 0 ? card.overall / 10 : null,
          }
        : undefined;
    return (
      <PlayerShieldCardCompact
        displayName={card.displayName}
        position={card.role === 'player' ? card.primaryPosition : undefined}
        photoUrl={card.photoUrl}
        clubName={card.role === 'player' ? card.clubName : undefined}
        stats={playerStats}
        onPress={onPress}
        style={width ? { width } : undefined}
      />
    );
  }
  if (props.variant === 'player') {
    const { displayName, position, photoUrl, clubName, stats, onPress, style } = props;
    return (
      <PlayerShieldCardCompact
        displayName={displayName}
        position={position}
        photoUrl={photoUrl}
        clubName={clubName}
        stats={stats}
        onPress={onPress}
        style={style}
      />
    );
  }
  return <JoueurListCard {...props} />;
}

function JoueurListCard({
  kicker,
  title,
  subtitle,
  meta,
  accentBar = true,
  onPress,
  style,
  children,
}: ListCardProps) {
  const theme = useJoueurTheme();
  const styles = useMemo(
    () => createListStyles(theme.accent, theme.cardRadius, theme.border),
    [theme.accent, theme.cardRadius, theme.border],
  );

  const inner = (
    <View style={[styles.card, style]}>
      {accentBar ? <View style={[styles.bar, { backgroundColor: theme.accent }]} /> : null}
      <View style={styles.body}>
        {(kicker || meta) && (
          <View style={styles.top}>
            {kicker ? (
              <ProDayText variant="caption" style={[styles.kicker, { color: theme.accent }]}>
                {kicker}
              </ProDayText>
            ) : (
              <View />
            )}
            {meta ? (
              <ProDayText variant="caption" style={[styles.meta, { color: theme.inkMuted }]}>
                {meta}
              </ProDayText>
            ) : null}
          </View>
        )}
        <ProDayText variant="section" numberOfLines={2} style={[styles.title, { color: theme.ink }]}>
          {title}
        </ProDayText>
        {subtitle ? (
          <ProDayText variant="caption" numberOfLines={2} style={[styles.subtitle, { color: theme.inkMuted }]}>
            {subtitle}
          </ProDayText>
        ) : null}
        {children}
      </View>
      <LinearGradient
        colors={['rgba(255,255,255,0.04)', 'transparent']}
        style={styles.shine}
        pointerEvents="none"
      />
    </View>
  );

  if (onPress) {
    return (
      <PressableSpring onPress={onPress} scaleTo={0.98} haptic>
        {inner}
      </PressableSpring>
    );
  }
  return inner;
}

function createListStyles(accent: string, cardRadius: number, border: string) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: border,
      borderRadius: cardRadius,
      backgroundColor: JOUEUR_SURFACES.card,
      marginBottom: spacing.xs,
      overflow: 'hidden',
    },
    bar: { width: 3 },
    body: {
      flex: 1,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      gap: 4,
    },
    top: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    kicker: {
      textTransform: 'uppercase',
      letterSpacing: 1.4,
      fontSize: 9,
      fontWeight: '800',
    },
    meta: { fontSize: 10, fontWeight: '600' },
    title: { fontWeight: '800', letterSpacing: -0.2 },
    subtitle: { lineHeight: 17 },
    shine: {
      ...StyleSheet.absoluteFillObject,
      height: 24,
    },
  });
}
