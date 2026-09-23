import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { PressableSpring, LivePulseDot } from '../motion';
import { Icon } from '../ui/Icon';
import { useTranslation } from '../../context/LocaleContext';
import { prodayHaptics } from '../../utils/prodayHaptics';
import type { CarpoolHubMode } from '../../content/carpoolChapters';
import {
  type CarpoolUiPalette,
  useCarpoolThemedStyles,
  useCarpoolUi,
} from './CarpoolUiContext';
import { CARPOOL_SITE } from '../../content/carpoolSite';

export type { CarpoolHubMode };

interface CarpoolModeSwitcherProps {
  mode: CarpoolHubMode;
  onChange: (mode: CarpoolHubMode) => void;
  liveActive?: boolean;
  badges?: Partial<Record<CarpoolHubMode, number>>;
}

const MODES: { id: CarpoolHubMode; icon: 'walk' | 'car' | 'time' }[] = [
  { id: 'ride', icon: 'walk' },
  { id: 'drive', icon: 'car' },
  { id: 'trips', icon: 'time' },
];

export const CarpoolModeSwitcher: React.FC<CarpoolModeSwitcherProps> = ({
  mode,
  onChange,
  liveActive,
  badges,
}) => {
  const { t } = useTranslation();
  const palette = useCarpoolUi();
  const styles = useCarpoolThemedStyles(createStyles);

  return (
    <View style={styles.track}>
      {MODES.map((item) => {
        const active = mode === item.id;
        const badge = badges?.[item.id];
        const label = t(`carpool.hub.mode.${item.id}`);

        return (
          <PressableSpring
            key={item.id}
            onPress={() => {
              prodayHaptics.tabSwitch();
              onChange(item.id);
            }}
            scaleTo={0.96}
            haptic
            style={[
              styles.segment,
              active && [styles.segmentActive, { borderColor: `${palette.signal}50` }],
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={label}
          >
            <View style={styles.segmentInner}>
              <Icon
                name={item.icon}
                size={16}
                color={active ? palette.signal : '#8B8B9A'}
                variant="filled"
              />
              <Text
                style={[
                  styles.label,
                  active ? [styles.labelActive, { color: '#FFFFFF' }] : styles.labelInactive,
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
              {item.id === 'trips' && liveActive ? (
                <LivePulseDot active size={6} color={palette.signal} />
              ) : null}
              {badge != null && badge > 0 ? (
                <View style={[styles.badge, { backgroundColor: palette.signal }]}>
                  <Text style={[styles.badgeText, { color: palette.onSignal }]}>
                    {badge > 9 ? '9+' : String(badge)}
                  </Text>
                </View>
              ) : null}
            </View>
          </PressableSpring>
        );
      })}
    </View>
  );
};

function createStyles(palette: CarpoolUiPalette) {
  return StyleSheet.create({
    track: {
      flexDirection: 'row',
      backgroundColor: CARPOOL_SITE.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: CARPOOL_SITE.lane,
      padding: 4,
      gap: 6,
    },
    segment: {
      flex: 1,
      height: 40,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'transparent',
      paddingHorizontal: 2,
    },
    segmentActive: {
      backgroundColor: '#1C1D26',
    },
    segmentInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingHorizontal: 2,
    },
    label: {
      fontSize: 11,
      fontWeight: '700',
    },
    labelActive: {
      fontWeight: '800',
    },
    labelInactive: {
      color: '#8B8B9A',
    },
    badge: {
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 8,
      minWidth: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '900',
    },
  });
}
