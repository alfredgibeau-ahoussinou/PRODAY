import React, { useMemo, useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { ProDayText } from './ProDayText';
import { Icon } from './Icon';
import { ProDaySurface } from './ProDaySurface';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius, shadows } from '../../theme/designTokens';

export type ProDaySelectOption<T extends string = string> = {
  id: T;
  label: string;
  hint?: string;
};

export type ProDaySelectProps<T extends string = string> = {
  label?: string;
  placeholder: string;
  options: readonly ProDaySelectOption<T>[];
  value?: T | null;
  onChange: (id: T) => void;
  /** Réinitialise l’affichage après sélection (menus d’action). */
  resetOnSelect?: boolean;
  inset?: boolean;
};

export function ProDaySelect<T extends string = string>({
  label,
  placeholder,
  options,
  value = null,
  onChange,
  resetOnSelect = false,
  inset = true,
}: ProDaySelectProps<T>) {
  const { colors } = useAppTheme();
  const [open, setOpen] = useState(false);
  const [actionValue, setActionValue] = useState<T | null>(null);

  const displayId = resetOnSelect ? actionValue : value;
  const selected = useMemo(
    () => options.find((o) => o.id === displayId) ?? null,
    [options, displayId]
  );

  const pick = (id: T) => {
    onChange(id);
    if (resetOnSelect) {
      setActionValue(id);
      setTimeout(() => setActionValue(null), 400);
    }
    setOpen(false);
  };

  return (
    <View style={[styles.wrap, inset && styles.inset]}>
      {label ? (
        <ProDayText variant="caption" muted style={styles.label}>
          {label}
        </ProDayText>
      ) : null}
      <Pressable
        style={({ pressed }) => [
          styles.trigger,
          {
            backgroundColor: colors.surface,
            borderColor: open ? colors.accent : colors.border,
          },
          shadows.soft,
          pressed && styles.pressed,
        ]}
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <View style={styles.triggerCopy}>
          <ProDayText
            variant="body"
            style={[
              styles.triggerText,
              { color: selected ? colors.text : colors.textMuted },
            ]}
            numberOfLines={1}
          >
            {selected ? selected.label : placeholder}
          </ProDayText>
          {selected?.hint ? (
            <ProDayText variant="caption" muted numberOfLines={1}>
              {selected.hint}
            </ProDayText>
          ) : null}
        </View>
        <Icon
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.textMuted}
        />
      </Pressable>

      {open ? (
        <ProDaySurface
          variant="elevated"
          style={[styles.menu, { borderColor: colors.border }]}
        >
          {options.map((opt, index) => {
            const on = opt.id === displayId;
            return (
              <Pressable
                key={opt.id}
                style={({ pressed }) => [
                  styles.option,
                  index > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
                  on && { backgroundColor: colors.accentSoft },
                  pressed && styles.pressed,
                ]}
                onPress={() => pick(opt.id)}
              >
                <View style={styles.optionCopy}>
                  <ProDayText
                    variant="body"
                    style={[
                      styles.optionLabel,
                      { color: on ? colors.ink : colors.text },
                    ]}
                  >
                    {opt.label}
                  </ProDayText>
                  {opt.hint ? (
                    <ProDayText variant="caption" muted numberOfLines={1}>
                      {opt.hint}
                    </ProDayText>
                  ) : null}
                </View>
                {on ? (
                  <Icon name="checkmark-circle" size={18} color={colors.accent} variant="filled" />
                ) : null}
              </Pressable>
            );
          })}
        </ProDaySurface>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm, zIndex: 1 },
  inset: { paddingHorizontal: spacing.lg },
  label: {
    fontWeight: '700',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    minHeight: 48,
  },
  triggerCopy: { flex: 1, gap: 1 },
  triggerText: { fontWeight: '600' },
  pressed: { opacity: 0.92 },
  menu: {
    marginTop: spacing.xs,
    borderWidth: 1,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  optionCopy: { flex: 1, gap: 1 },
  optionLabel: { fontWeight: '700' },
});
