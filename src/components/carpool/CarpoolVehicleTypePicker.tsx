import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {
  CARPOOL_VEHICLE_DEFAULT_SEATS,
  CARPOOL_VEHICLE_TYPES,
  type CarpoolVehicleType,
} from '../../models/CarpoolVehicle';
import { PressableSpring } from '../motion';
import { Icon, type IconName } from '../ui/Icon';
import { useTranslation } from '../../context/LocaleContext';
import { spacing } from '../../theme/designTokens';
import { motion } from '../../theme/motion';
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

function VehicleTile({
  type,
  active,
  disabled,
  onPress,
  label,
  palette,
  styles,
}: {
  type: CarpoolVehicleType;
  active: boolean;
  disabled: boolean;
  onPress: () => void;
  label: string;
  palette: CarpoolUiPalette;
  styles: ReturnType<typeof createStyles>;
}) {
  const seats = CARPOOL_VEHICLE_DEFAULT_SEATS[type];
  const pop = useSharedValue(active ? 1 : 0);

  React.useEffect(() => {
    pop.value = withSpring(active ? 1 : 0, motion.spring.bouncy);
  }, [active, pop]);

  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + 0.04 * pop.value }],
  }));

  return (
    <PressableSpring
      disabled={disabled}
      onPress={() => {
        prodayHaptics.confirm();
        onPress();
      }}
      scaleTo={0.94}
      haptic
      style={styles.tilePress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${label}, ${seats} places`}
    >
      <Animated.View style={[styles.tile, active && styles.tileOn, anim]}>
        <View style={[styles.iconWrap, active && styles.iconWrapOn]}>
          <Icon
            name={VEHICLE_ICON[type]}
            size={22}
            color={active ? palette.onSignal : palette.signalDeep}
            variant="filled"
          />
        </View>
        <Text style={[styles.name, active && styles.nameOn]} numberOfLines={2}>
          {label}
        </Text>
        <View style={styles.seatDots}>
          {Array.from({ length: Math.min(seats, 8) }, (_, i) => (
            <View
              key={i}
              style={[styles.dot, active ? styles.dotOn : undefined, i >= seats ? styles.dotHidden : undefined]}
            />
          ))}
          {seats > 8 ? (
            <Text style={[styles.more, active && styles.moreOn]}>+{seats - 8}</Text>
          ) : null}
        </View>
        <Text style={[styles.seats, active && styles.seatsOn]}>{seats} places</Text>
      </Animated.View>
    </PressableSpring>
  );
}

/** Grille interactive Citadine → Car / Minibus. */
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
      <Text style={styles.help}>Touche pour choisir · places adaptées automatiquement</Text>
      <View style={styles.grid}>
        {CARPOOL_VEHICLE_TYPES.map((type) => (
          <VehicleTile
            key={type}
            type={type}
            active={value === type}
            disabled={disabled}
            label={t(`carpool.vehicle.${type}`)}
            onPress={() => onChange(type)}
            palette={palette}
            styles={styles}
          />
        ))}
      </View>
    </View>
  );
};

function createStyles(palette: CarpoolUiPalette) {
  return StyleSheet.create({
    wrap: { gap: spacing.sm },
    label: {
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: palette.ink,
    },
    help: {
      fontSize: 12,
      color: palette.inkMuted,
      marginTop: -4,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    tilePress: {
      width: '31%',
      minWidth: 100,
      flexGrow: 1,
    },
    tile: {
      paddingVertical: 14,
      paddingHorizontal: 8,
      gap: 8,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: palette.fog,
      backgroundColor: palette.surface,
      borderRadius: 16,
      minHeight: 118,
    },
    tileOn: {
      backgroundColor: palette.signalSoft,
      borderColor: palette.signal,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.surfaceMuted,
    },
    iconWrapOn: {
      backgroundColor: palette.signal,
    },
    name: {
      fontSize: 12,
      lineHeight: 15,
      fontWeight: '800',
      color: palette.ink,
      textAlign: 'center',
      minHeight: 30,
    },
    nameOn: { color: palette.onSignal },
    seatDots: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 3,
      minHeight: 10,
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: palette.lane,
    },
    dotOn: { backgroundColor: palette.signalDeep },
    dotHidden: { opacity: 0 },
    more: { fontSize: 9, fontWeight: '800', color: palette.inkDim },
    moreOn: { color: palette.signalDeep },
    seats: {
      fontSize: 11,
      fontWeight: '700',
      color: palette.inkMuted,
    },
    seatsOn: { color: palette.signalDeep },
  });
}
