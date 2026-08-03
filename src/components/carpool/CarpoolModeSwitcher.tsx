import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { spacing, radius } from '../../theme/designTokens';
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

/** Basculer Passager / Conducteur / Live — hub covoiturage. */
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
      {MODES.map((item) => {
        const active = mode === item.id;
        return (
          <PressableSpring
            key={item.id}
            onPress={() => {
              prodayHaptics.tabSwitch();
              onChange(item.id);
            }}
            scaleTo={0.96}
            style={[
              styles.chip,
              active && { backgroundColor: colors.accent, borderColor: colors.accent },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <View>
              <Icon
                name={item.icon}
                size={16}
                color={active ? '#000' : colors.textMuted}
                variant={active ? 'filled' : 'outline'}
              />
              {item.id === 'live' && liveActive ? (
                <View style={[styles.liveDot, { backgroundColor: colors.error ?? '#EF4444' }]} />
              ) : null}
            </View>
            <ProDayText
              variant="caption"
              style={[styles.label, active && styles.labelActive]}
              inverse={active}
            >
              {t(`carpool.hub.mode.${item.id}`)}
            </ProDayText>
          </PressableSpring>
        );
      })}
    </View>
  );
};

function createStyles(colors: { error?: string }) {
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      padding: 4,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      gap: 4,
    },
    chip: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    label: { fontWeight: '700', fontSize: 12 },
    labelActive: { fontWeight: '900' },
    liveDot: {
      position: 'absolute',
      top: -2,
      right: -4,
      width: 7,
      height: 7,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: '#000',
    },
  });
}
