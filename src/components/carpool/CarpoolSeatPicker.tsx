import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { useTranslation } from '../../context/LocaleContext';
import { spacing, radius } from '../../theme/designTokens';
import { prodayHaptics } from '../../utils/prodayHaptics';
import {
  type CarpoolUiPalette,
  useCarpoolThemedStyles,
  useCarpoolUi,
} from './CarpoolUiContext';

interface CarpoolSeatPickerProps {
  seats: number;
  maxSeats?: number;
  taken?: number;
  onChange: (seats: number) => void;
  label?: string;
}

export const CarpoolSeatPicker: React.FC<CarpoolSeatPickerProps> = ({
  seats,
  maxSeats = 8,
  taken = 0,
  onChange,
  label,
}) => {
  const { t } = useTranslation();
  const palette = useCarpoolUi();
  const styles = useCarpoolThemedStyles(createStyles);
  const safeSeats = Math.max(1, seats);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{label ?? t('carpool.hub.seatsTitle')}</Text>
      <View style={styles.stepperRow}>
        <PressableSpring
          onPress={() => {
            prodayHaptics.press();
            onChange(Math.max(1, safeSeats - 1));
          }}
          disabled={safeSeats <= 1}
          scaleTo={0.92}
          haptic
          style={[styles.stepBtn, safeSeats <= 1 && { opacity: 0.4 }]}
        >
          <Text style={styles.stepBtnText}>−</Text>
        </PressableSpring>

        <View style={styles.valueBox}>
          <Icon name="person" size={16} color={palette.signal} />
          <Text style={styles.valueText}>{safeSeats}</Text>
          <Text style={styles.unitText}>place{safeSeats > 1 ? 's' : ''}</Text>
        </View>

        <PressableSpring
          onPress={() => {
            prodayHaptics.press();
            onChange(Math.min(maxSeats, safeSeats + 1));
          }}
          disabled={safeSeats >= maxSeats}
          scaleTo={0.92}
          haptic
          style={[styles.stepBtn, safeSeats >= maxSeats && { opacity: 0.4 }]}
        >
          <Text style={styles.stepBtnText}>+</Text>
        </PressableSpring>
      </View>
    </View>
  );
};

function createStyles(palette: CarpoolUiPalette) {
  return StyleSheet.create({
    wrap: {
      gap: 6,
      marginVertical: 4,
    },
    title: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: '#A1A1AA',
    },
    stepperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#1C1D26',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: '#282836',
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    stepBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: '#282836',
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepBtnText: {
      fontSize: 20,
      fontWeight: '800',
      color: '#FFFFFF',
      lineHeight: 22,
    },
    valueBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    valueText: {
      fontSize: 18,
      fontWeight: '900',
      color: '#FFFFFF',
    },
    unitText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#A1A1AA',
    },
  });
}

