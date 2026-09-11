import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import {
  CARPOOL_VEHICLE_DEFAULT_SEATS,
  CARPOOL_VEHICLE_TYPES,
  type CarpoolVehicleType,
} from '../../models/CarpoolVehicle';
import { PressableSpring } from '../motion';
import { Icon, type IconName } from '../ui/Icon';
import { useTranslation } from '../../context/LocaleContext';
import { spacing, radius } from '../../theme/designTokens';
import { prodayHaptics } from '../../utils/prodayHaptics';
import {
  type CarpoolUiPalette,
  useCarpoolThemedStyles,
  useCarpoolUi,
} from './CarpoolUiContext';

interface CarpoolVehicleTypePickerProps {
  value?: CarpoolVehicleType | null;
  onChange: (next: CarpoolVehicleType) => void;
  disabled?: boolean;
}

const VEHICLE_ICON: Record<CarpoolVehicleType, IconName> = {
  citadine: 'car',
  berline: 'car',
  break: 'car',
  suv: 'car',
  monospace: 'car',
  utilitaire: 'car',
  pickup: 'car',
  minibus: 'people',
  car: 'people',
};

export const CarpoolVehicleTypePicker: React.FC<CarpoolVehicleTypePickerProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const palette = useCarpoolUi();
  const styles = useCarpoolThemedStyles(createStyles);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{t('carpool.vehicle.label')}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollRow}
      >
        {CARPOOL_VEHICLE_TYPES.map((type) => {
          const active = value === type;
          const defaultSeats = CARPOOL_VEHICLE_DEFAULT_SEATS[type];
          return (
            <PressableSpring
              key={type}
              disabled={disabled}
              onPress={() => {
                prodayHaptics.confirm();
                onChange(type);
              }}
              scaleTo={0.95}
              haptic
              style={[
                styles.pill,
                active && {
                  backgroundColor: `${palette.signal}20`,
                  borderColor: palette.signal,
                },
              ]}
            >
              <Icon
                name={VEHICLE_ICON[type]}
                size={14}
                color={active ? palette.signal : '#A1A1AA'}
              />
              <Text style={[styles.pillText, active && { color: palette.signal, fontWeight: '800' }]}>
                {t(`carpool.vehicle.${type}`)}
              </Text>
              <Text style={[styles.seatsHint, active && { color: `${palette.signal}CC` }]}>
                ({defaultSeats} pl.)
              </Text>
            </PressableSpring>
          );
        })}
      </ScrollView>
    </View>
  );
};

function createStyles(palette: CarpoolUiPalette) {
  return StyleSheet.create({
    wrap: {
      gap: 6,
      marginVertical: 4,
    },
    label: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: '#A1A1AA',
    },
    scrollRow: {
      flexDirection: 'row',
      gap: 8,
      paddingVertical: 2,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: radius.pill,
      backgroundColor: '#1C1D26',
      borderWidth: 1,
      borderColor: '#282836',
    },
    pillText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    seatsHint: {
      fontSize: 11,
      color: '#71717A',
      fontWeight: '600',
    },
  });
}

