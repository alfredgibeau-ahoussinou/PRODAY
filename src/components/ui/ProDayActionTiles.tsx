import React from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
} from 'react-native';
import { PressableSpring, StaggerReveal } from '../motion';
import type { IconName } from './Icon';
import { Icon } from './Icon';
import { ProDaySurface } from './ProDaySurface';
import { ProDayText } from './ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius, shadows } from '../../theme/designTokens';

export type ProDayActionTile = {
  id: string;
  label: string;
  icon?: IconName;
  subtitle?: string;
  badge?: number;
  loading?: boolean;
};

export type ProDayActionTilesProps = {
  items: ProDayActionTile[];
  /** Tuile sélectionnée (filtres) */
  activeId?: string | null;
  onPress: (id: string) => void;
  /** Padding horizontal spacing.lg */
  inset?: boolean;
  /** Tuiles plus petites (profil, filtres denses) */
  compact?: boolean;
  style?: ViewStyle;
};

/** Convertit des options { id, label } en tuiles avec icônes optionnelles. */
export function optionsToTiles<T extends string>(
  options: readonly { id: T; label: string }[],
  icons: Partial<Record<T, IconName>>,
  meta?: Partial<Record<T, Pick<ProDayActionTile, 'subtitle' | 'badge' | 'loading'>>>
): ProDayActionTile[] {
  return options.map((opt) => ({
    id: opt.id,
    label: opt.label,
    icon: icons[opt.id],
    ...meta?.[opt.id],
  }));
}

/** Grandes tuiles d'action / filtre — style unifié ProDay (Shop, Matchs, etc.). */
export const ProDayActionTiles: React.FC<ProDayActionTilesProps> = ({
  items,
  activeId,
  onPress,
  inset = true,
  compact = false,
  style,
}) => {
  const { colors } = useAppTheme();
  const multiRow = items.length > 3;

  if (items.length === 0) return null;

  return (
    <View style={[styles.wrap, inset && styles.inset, style]}>
      <View style={[styles.row, multiRow && styles.rowWrap]}>
        {items.map((item, index) => {
          const on = activeId != null && activeId === item.id;
          const cellStyle = multiRow
            ? items.length === 4 || items.length === 5
              ? styles.cellHalf
              : styles.cellThird
            : styles.cellFlex;

          return (
            <StaggerReveal key={item.id} index={index} delayStep={60} style={cellStyle}>
              <PressableSpring
                style={styles.tileFill}
                scaleTo={0.94}
                haptic
                onPress={() => onPress(item.id)}
              >
                <ProDaySurface
                  variant={on ? 'accent' : 'module'}
                  style={[
                    styles.tile,
                    compact && styles.tileCompact,
                    { borderColor: on ? colors.accent : colors.border },
                  ]}
                >
                  {item.badge != null && item.badge > 0 ? (
                    <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                      <ProDayText variant="caption" inverse style={styles.badgeText}>
                        {item.badge > 9 ? '9+' : item.badge}
                      </ProDayText>
                    </View>
                  ) : null}
                  {item.icon ? (
                    <View
                      style={[
                        styles.iconWrap,
                        compact && styles.iconWrapCompact,
                        { backgroundColor: on ? colors.accent : colors.accentSoft },
                      ]}
                    >
                      <Icon
                        name={item.icon}
                        size={compact ? 18 : 22}
                        color={on ? colors.brandInverse : colors.accent}
                        variant="filled"
                      />
                    </View>
                  ) : null}
                  <ProDayText
                    variant="caption"
                    style={[
                      styles.label,
                      compact && styles.labelCompact,
                      { color: on ? colors.ink : colors.text },
                    ]}
                    numberOfLines={2}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                  >
                    {item.label}
                  </ProDayText>
                  {item.loading ? (
                    <ActivityIndicator
                      size="small"
                      color={on ? colors.accent : colors.textMuted}
                      style={styles.loader}
                    />
                  ) : item.subtitle ? (
                    <ProDayText
                      variant="caption"
                      style={[
                        styles.subtitle,
                        { color: on ? colors.textSecondary : colors.textMuted },
                      ]}
                      numberOfLines={2}
                    >
                      {item.subtitle}
                    </ProDayText>
                  ) : null}
                </ProDaySurface>
              </PressableSpring>
            </StaggerReveal>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  inset: { paddingHorizontal: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' },
  rowWrap: { flexWrap: 'wrap', justifyContent: 'center' },
  cellFlex: { flex: 1 },
  tileFill: { flex: 1 },
  cellHalf: {
    width: '47%',
    flexGrow: 0,
    minWidth: '46%',
  },
  cellThird: {
    width: '30%',
    flexGrow: 0,
    minWidth: '29%',
  },
  tile: {
    alignItems: 'center',
    borderWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    gap: spacing.xs,
    ...shadows.soft,
  },
  tileCompact: {
    paddingVertical: spacing.sm,
    gap: 4,
  },
  badge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    zIndex: 1,
  },
  badgeText: { fontSize: 10, fontWeight: '900' },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapCompact: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
  },
  label: { fontWeight: '800', textAlign: 'center' },
  labelCompact: { fontSize: 10, lineHeight: 12 },
  subtitle: { fontSize: 10, textAlign: 'center' },
  loader: { marginTop: 2 },
});
