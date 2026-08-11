import React, { useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { useTranslation } from '../../context/LocaleContext';
import { spacing } from '../../theme/designTokens';
import { CARPOOL_SITE } from '../../content/carpoolSite';
import { prodayHaptics } from '../../utils/prodayHaptics';

interface CarpoolSeatPickerProps {
  seats: number;
  maxSeats?: number;
  taken?: number;
  onChange: (seats: number) => void;
  label?: string;
}

/** Cabine interactive — taper une place pour régler le nombre. */
export const CarpoolSeatPicker: React.FC<CarpoolSeatPickerProps> = ({
  seats,
  maxSeats = 4,
  taken = 0,
  onChange,
  label,
}) => {
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(), []);
  const safeSeats = Math.max(0, seats);
  const free = Math.max(0, safeSeats - taken);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{label ?? t('carpool.hub.seatsTitle')}</Text>
      <View style={styles.cabin}>
        <View style={styles.driverRow}>
          <View style={styles.driver}>
            <Icon name="person" size={14} color={CARPOOL_SITE.asphalt} variant="filled" />
            <Text style={styles.seatLabel}>{t('carpool.hub.driverSeat')}</Text>
          </View>
        </View>
        <View style={styles.seatsGrid}>
          {Array.from({ length: maxSeats }, (_, i) => {
            const n = i + 1;
            const selected = n <= safeSeats;
            const occupied = n <= taken;
            return (
              <PressableSpring
                key={n}
                onPress={() => {
                  prodayHaptics.press();
                  onChange(Math.max(1, n));
                }}
                scaleTo={0.9}
                haptic
                style={[
                  styles.seat,
                  selected && styles.seatOn,
                  occupied && styles.seatTaken,
                ]}
              >
                {occupied || selected ? (
                  <Icon
                    name={occupied ? 'person' : 'checkmark-circle'}
                    size={16}
                    color={occupied ? '#fff' : CARPOOL_SITE.asphalt}
                    variant="filled"
                  />
                ) : null}
                <Text
                  style={[
                    styles.seatNum,
                    selected && styles.seatNumOn,
                    occupied && styles.seatNumTaken,
                  ]}
                >
                  {n}
                </Text>
              </PressableSpring>
            );
          })}
        </View>
        <View style={styles.stepper}>
          <PressableSpring
            onPress={() => {
              prodayHaptics.press();
              onChange(Math.max(1, safeSeats - 1));
            }}
            scaleTo={0.92}
            haptic
            style={styles.stepBtn}
          >
            <Text style={styles.stepText}>−</Text>
          </PressableSpring>
          <Text style={styles.stepValue}>{safeSeats}</Text>
          <PressableSpring
            onPress={() => {
              prodayHaptics.press();
              onChange(Math.min(maxSeats, safeSeats + 1));
            }}
            scaleTo={0.92}
            haptic
            style={styles.stepBtn}
          >
            <Text style={styles.stepText}>+</Text>
          </PressableSpring>
        </View>
      </View>
      <Text style={styles.meta}>
        {safeSeats < 1
          ? t('carpool.hub.seatsPickHint')
          : t('carpool.hub.seatsMeta', { seats: safeSeats, free })}
      </Text>
    </View>
  );
};

function createStyles() {
  return StyleSheet.create({
    wrap: { gap: spacing.sm },
    title: {
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: CARPOOL_SITE.ink,
    },
    cabin: {
      borderWidth: 1.5,
      borderColor: CARPOOL_SITE.fog,
      backgroundColor: CARPOOL_SITE.surfaceMuted,
      borderRadius: 18,
      padding: spacing.md,
      gap: spacing.sm,
    },
    driverRow: { alignItems: 'center' },
    driver: {
      minWidth: 130,
      minHeight: 44,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingHorizontal: 14,
      flexDirection: 'row',
      backgroundColor: CARPOOL_SITE.signal,
    },
    seatsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    seat: {
      width: '22%',
      maxWidth: 72,
      minWidth: 48,
      minHeight: 52,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: CARPOOL_SITE.fog,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      backgroundColor: CARPOOL_SITE.surface,
    },
    seatOn: {
      borderColor: CARPOOL_SITE.signal,
      backgroundColor: CARPOOL_SITE.signalSoft,
    },
    seatTaken: {
      backgroundColor: CARPOOL_SITE.asphalt,
      borderColor: CARPOOL_SITE.asphalt,
    },
    seatLabel: { fontWeight: '700', fontSize: 11, color: CARPOOL_SITE.asphalt },
    seatNum: { fontWeight: '800', color: CARPOOL_SITE.inkMuted, fontSize: 12 },
    seatNumOn: { color: CARPOOL_SITE.signalDeep },
    seatNumTaken: { color: '#fff' },
    stepper: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      marginTop: 4,
    },
    stepBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: CARPOOL_SITE.asphalt,
    },
    stepText: { color: '#fff', fontSize: 22, fontWeight: '700', lineHeight: 24 },
    stepValue: {
      fontFamily: CARPOOL_SITE.display,
      fontSize: 22,
      fontWeight: '800',
      color: CARPOOL_SITE.ink,
      minWidth: 28,
      textAlign: 'center',
    },
    meta: { textAlign: 'center', color: CARPOOL_SITE.inkMuted, fontSize: 12 },
  });
}
