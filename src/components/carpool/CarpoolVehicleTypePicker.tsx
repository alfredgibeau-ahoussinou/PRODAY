import React, { useMemo } from 'react';
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
import { CARPOOL_SITE } from '../../content/carpoolSite';
import { prodayHaptics } from '../../utils/prodayHaptics';

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
}: {
  type: CarpoolVehicleType;
  active: boolean;
  disabled: boolean;
  onPress: () => void;
  label: string;
}) {
  const styles = useMemo(() => createStyles(), []);
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
            color={active ? CARPOOL_SITE.asphalt : CARPOOL_SITE.signalDeep}
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
  const styles = useMemo(() => createStyles(), []);

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
          />
        ))}
      </View>
    </View>
  );
};

function createStyles() {
  return StyleSheet.create({
    wrap: { gap: spacing.sm },
    label: {
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: CARPOOL_SITE.ink,
    },
    help: {
      fontSize: 12,
      color: CARPOOL_SITE.inkMuted,
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
      borderColor: CARPOOL_SITE.fog,
      backgroundColor: CARPOOL_SITE.surface,
      borderRadius: 16,
      minHeight: 118,
    },
    tileOn: {
      backgroundColor: CARPOOL_SITE.signalSoft,
      borderColor: CARPOOL_SITE.signal,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: CARPOOL_SITE.surfaceMuted,
    },
    iconWrapOn: {
      backgroundColor: CARPOOL_SITE.signal,
    },
    name: {
      fontSize: 12,
      lineHeight: 15,
      fontWeight: '800',
      color: CARPOOL_SITE.ink,
      textAlign: 'center',
      minHeight: 30,
    },
    nameOn: { color: CARPOOL_SITE.asphalt },
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
      backgroundColor: CARPOOL_SITE.lane,
    },
    dotOn: { backgroundColor: CARPOOL_SITE.signalDeep },
    dotHidden: { opacity: 0 },
    more: { fontSize: 9, fontWeight: '800', color: CARPOOL_SITE.inkDim },
    moreOn: { color: CARPOOL_SITE.signalDeep },
    seats: {
      fontSize: 11,
      fontWeight: '700',
      color: CARPOOL_SITE.inkMuted,
    },
    seatsOn: { color: CARPOOL_SITE.signalDeep },
  });
}
