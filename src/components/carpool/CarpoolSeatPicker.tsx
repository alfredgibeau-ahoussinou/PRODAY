import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { spacing, radius } from '../../theme/designTokens';
import { prodayHaptics } from '../../utils/prodayHaptics';

interface CarpoolSeatPickerProps {
  seats: number;
  maxSeats?: number;
  taken?: number;
  onChange: (seats: number) => void;
  label?: string;
}

/**
 * Sélecteur de places interactif — schéma voiture (conducteur fixe + places).
 */
export const CarpoolSeatPicker: React.FC<CarpoolSeatPickerProps> = ({
  seats,
  maxSeats = 4,
  taken = 0,
  onChange,
  label,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const free = Math.max(0, seats - taken);

  return (
    <View style={styles.wrap}>
      <ProDayText variant="caption" accent style={styles.title}>
        {label ?? t('carpool.hub.seatsTitle')}
      </ProDayText>
      <View style={[styles.cabin, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}>
        <View style={styles.row}>
          <View style={[styles.seat, styles.driver, { backgroundColor: colors.accentSoft, borderColor: colors.accent }]}>
            <Icon name="person" size={14} color={colors.accent} variant="filled" />
            <ProDayText variant="caption" accent style={styles.seatLabel}>
              {t('carpool.hub.driverSeat')}
            </ProDayText>
          </View>
        </View>
        <View style={styles.row}>
          {Array.from({ length: maxSeats }, (_, i) => {
            const n = i + 1;
            const selected = n <= seats;
            const occupied = n <= taken;
            return (
              <PressableSpring
                key={n}
                onPress={() => {
                  prodayHaptics.press();
                  onChange(Math.max(1, n));
                }}
                scaleTo={0.92}
                style={[
                  styles.seat,
                  {
                    borderColor: selected ? colors.accent : colors.border,
                    backgroundColor: occupied
                      ? colors.accent
                      : selected
                        ? colors.accentSoft
                        : colors.background,
                  },
                ]}
              >
                <Icon
                  name={occupied ? 'person' : selected ? 'checkmark-circle' : 'add'}
                  size={16}
                  color={occupied ? '#000' : selected ? colors.accent : colors.textMuted}
                  variant={selected ? 'filled' : 'outline'}
                />
                <ProDayText
                  variant="caption"
                  style={{ fontWeight: '800', color: occupied ? '#000' : colors.text }}
                >
                  {n}
                </ProDayText>
              </PressableSpring>
            );
          })}
        </View>
      </View>
      <ProDayText variant="caption" muted style={styles.meta}>
        {t('carpool.hub.seatsMeta', { seats, free })}
      </ProDayText>
    </View>
  );
};

function createStyles(_colors: unknown) {
  return StyleSheet.create({
    wrap: { gap: spacing.sm },
    title: { fontWeight: '800' },
    cabin: {
      borderWidth: 1,
      borderRadius: radius.xl,
      padding: spacing.md,
      gap: spacing.sm,
    },
    row: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
    seat: {
      width: 64,
      minHeight: 56,
      borderRadius: radius.md,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      paddingVertical: spacing.xs,
    },
    driver: { width: 120 },
    seatLabel: { fontWeight: '700', fontSize: 10 },
    meta: { textAlign: 'center' },
  });
}
