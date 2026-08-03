import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { spacing } from '../../theme/designTokens';
import { prodayHaptics } from '../../utils/prodayHaptics';

export type CarpoolHubMode = 'ride' | 'drive' | 'live';

interface CarpoolModeSwitcherProps {
  mode: CarpoolHubMode;
  onChange: (mode: CarpoolHubMode) => void;
  liveActive?: boolean;
}

const MODES: { id: CarpoolHubMode; icon: 'car' | 'walk' | 'location' }[] = [
  { id: 'ride', icon: 'walk' },
  { id: 'drive', icon: 'car' },
  { id: 'live', icon: 'location' },
];

/**
 * Sélecteur Passager / Conducteur / Live — voies droites façon marquage au sol,
 * repère actif souligné (pas de pilule pleine).
 */
export const CarpoolModeSwitcher: React.FC<CarpoolModeSwitcherProps> = ({
  mode,
  onChange,
  liveActive,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.wrap, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
      {MODES.map((item, index) => {
        const active = mode === item.id;
        return (
          <PressableSpring
            key={item.id}
            onPress={() => {
              prodayHaptics.tabSwitch();
              onChange(item.id);
            }}
            scaleTo={0.97}
            style={[styles.lane, index > 0 && { borderLeftColor: colors.border, borderLeftWidth: StyleSheet.hairlineWidth }]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <View style={styles.laneInner}>
              <View>
                <Icon
                  name={item.icon}
                  size={16}
                  color={active ? colors.accent : colors.textMuted}
                  variant={active ? 'filled' : 'outline'}
                />
                {item.id === 'live' && liveActive ? (
                  <View style={[styles.liveDot, { backgroundColor: colors.error ?? '#EF4444' }]} />
                ) : null}
              </View>
              <ProDayText
                variant="caption"
                style={[styles.label, active ? { color: colors.accent } : { color: colors.textMuted }]}
              >
                {t(`carpool.hub.mode.${item.id}`)}
              </ProDayText>
            </View>
            <View
              style={[
                styles.marker,
                { backgroundColor: active ? colors.accent : 'transparent' },
              ]}
            />
          </PressableSpring>
        );
      })}
    </View>
  );
};

function createStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      borderRadius: 6,
      borderWidth: StyleSheet.hairlineWidth,
      overflow: 'hidden',
    },
    lane: {
      flex: 1,
      paddingTop: 12,
    },
    laneInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingBottom: 10,
    },
    label: {
      fontWeight: '800',
      fontSize: 12,
      letterSpacing: 0.3,
    },
    marker: {
      height: 3,
      width: '100%',
    },
    liveDot: {
      position: 'absolute',
      top: -2,
      right: -4,
      width: 7,
      height: 7,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.surfaceMuted,
    },
  });
}
