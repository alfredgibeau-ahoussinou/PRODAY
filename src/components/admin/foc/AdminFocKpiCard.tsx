import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { PressableSpring } from '../../motion';
import { Icon } from '../../ui/Icon';
import type { IconName } from '../../ui/iconNames';
import { adminChrome, adminType, ADMIN_ON_ACCENT } from '../../../theme/adminTheme';
import { spacing } from '../../../theme/designTokens';

interface AdminFocKpiCardProps {
  label: string;
  value: number | string;
  icon?: IconName;
  hot?: boolean;
  onPress?: () => void;
}

const KpiContent: React.FC<AdminFocKpiCardProps> = ({ label, value, icon, hot }) => {
  const styles = useMemo(() => createStyles(), []);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;
  const countRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [displayValue, setDisplayValue] = React.useState<number | string>(
    typeof value === 'number' ? 0 : value,
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 420,
        useNativeDriver: true,
      }),
    ]).start();

    if (typeof value !== 'number') {
      setDisplayValue(value);
      return;
    }

    if (value === 0) {
      setDisplayValue(0);
      return;
    }

    const duration = 800;
    const steps = Math.min(value, 40);
    const interval = duration / steps;
    let current = 0;

    countRef.current = setInterval(() => {
      current += Math.ceil(value / steps);
      if (current >= value) {
        current = value;
        if (countRef.current) clearInterval(countRef.current);
      }
      setDisplayValue(current);
    }, interval);

    return () => {
      if (countRef.current) clearInterval(countRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      style={[
        styles.card,
        hot && styles.cardHot,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      <View style={[styles.sideRail, hot && styles.sideRailHot]} />
      <View style={styles.top}>
        {icon ? (
          <View style={[styles.iconWrap, hot && styles.iconWrapHot]}>
            <Icon name={icon} size={15} color={hot ? ADMIN_ON_ACCENT : adminChrome.accentHot} />
          </View>
        ) : null}
        {hot ? <View style={styles.hotDot} /> : null}
      </View>
      <Text style={[styles.value, hot && styles.valueHot]}>{displayValue}</Text>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </Animated.View>
  );
};

export const AdminFocKpiCard: React.FC<AdminFocKpiCardProps> = (props) => {
  if (!props.onPress) {
    return <KpiContent {...props} />;
  }
  return (
    <PressableSpring onPress={props.onPress} scaleTo={0.96} haptic>
      <KpiContent {...props} />
    </PressableSpring>
  );
};

function createStyles() {
  return StyleSheet.create({
    card: {
      backgroundColor: adminChrome.shell,
      borderRadius: adminChrome.radiusLg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.shellBorder,
      padding: spacing.md,
      paddingLeft: spacing.md + 4,
      minHeight: 112,
      gap: 4,
      overflow: 'hidden',
      shadowColor: adminChrome.cardShadow,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 1,
      shadowRadius: 14,
      elevation: 2,
    },
    cardHot: {
      borderColor: adminChrome.accentMuted,
      backgroundColor: adminChrome.overlayStrong,
    },
    sideRail: {
      position: 'absolute',
      left: 0,
      top: 12,
      bottom: 12,
      width: adminChrome.railWidth,
      borderRadius: 2,
      backgroundColor: adminChrome.shellMid,
    },
    sideRailHot: {
      backgroundColor: adminChrome.accent,
    },
    top: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 2,
    },
    iconWrap: {
      width: 30,
      height: 30,
      borderRadius: 8,
      backgroundColor: adminChrome.soft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrapHot: {
      backgroundColor: adminChrome.accent,
    },
    hotDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: adminChrome.accent,
    },
    value: {
      fontFamily: adminType.display,
      fontSize: 30,
      fontWeight: '800',
      color: adminChrome.text,
      letterSpacing: -1,
    },
    valueHot: {
      color: adminChrome.accent,
    },
    label: {
      fontFamily: adminType.bodySemi,
      fontSize: 11,
      fontWeight: '600',
      color: adminChrome.textMuted,
      lineHeight: 14,
      letterSpacing: 0.1,
    },
  });
}
