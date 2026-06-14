import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import type { MercatoSearchSuggestion } from '../../utils/mercatoSearchSuggestions';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';

interface MercatoSearchSuggestionsProps {
  suggestions: MercatoSearchSuggestion[];
  onPick: (suggestion: MercatoSearchSuggestion) => void;
}

export const MercatoSearchSuggestions: React.FC<MercatoSearchSuggestionsProps> = ({
  suggestions,
  onPick,
}) => {
  const { colors } = useAppTheme();
  if (suggestions.length === 0) return null;

  return (
    <ProDaySurface variant="elevated" style={[styles.wrap, { borderColor: colors.border }]}>
      {suggestions.map((s, index) => (
        <Pressable
          key={`${s.kind}-${index}`}
          style={({ pressed }) => [
            styles.row,
            index > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
            pressed && styles.pressed,
          ]}
          onPress={() => onPick(s)}
        >
          <Icon
            name={
              s.kind === 'club'
                ? 'business'
                : s.kind === 'city'
                  ? 'location'
                  : s.kind === 'position'
                    ? 'football'
                    : 'search'
            }
            size={16}
            color={colors.accent}
          />
          <View style={styles.copy}>
            <ProDayText variant="body" style={styles.label}>
              {s.kind === 'explorer' ? s.label : s.label}
            </ProDayText>
            {s.kind === 'explorer' ? (
              <ProDayText variant="caption" muted>
                {s.hint}
              </ProDayText>
            ) : null}
          </View>
          <Icon name="chevron-forward" size={14} color={colors.textMuted} />
        </Pressable>
      ))}
    </ProDaySurface>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.lg,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    overflow: 'hidden',
    borderRadius: radius.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  copy: { flex: 1, gap: 1 },
  label: { fontWeight: '700' },
  pressed: { opacity: 0.9 },
});
