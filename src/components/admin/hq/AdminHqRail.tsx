import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableSpring } from '../../motion';
import { Icon } from '../../ui/Icon';
import {
  ADMIN_HQ_MODES,
  ADMIN_RAIL_WIDTH,
  type AdminHqModeId,
} from '../../../navigation/adminTabConfig';
import { adminChrome } from '../../../theme/adminTheme';
import { spacing } from '../../../theme/designTokens';

type Props = {
  activeMode: AdminHqModeId;
  queueCount: number;
  onSelect: (mode: AdminHqModeId) => void;
  onSearch: () => void;
};

/** Narrow icon rail — primary HQ navigation. */
export function AdminHqRail({ activeMode, queueCount, onSelect, onSearch }: Props) {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={[styles.rail, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.sm }]}>
      <Text style={styles.mark}>PD</Text>
      <View style={styles.modes}>
        {ADMIN_HQ_MODES.map((mode) => {
          const on = mode.id === activeMode;
          const badge = mode.id === 'decisions' ? queueCount : 0;
          return (
            <PressableSpring
              key={mode.id}
              onPress={() => onSelect(mode.id)}
              scaleTo={0.94}
              haptic
              style={[styles.modeBtn, on && styles.modeBtnOn]}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={mode.label}
            >
              <Icon name={mode.icon} size={20} color={on ? adminChrome.accent : adminChrome.textMuted} />
              <Text style={[styles.modeLabel, on && styles.modeLabelOn]} numberOfLines={1}>
                {mode.short}
              </Text>
              {badge > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
                </View>
              ) : null}
            </PressableSpring>
          );
        })}
      </View>
      <Pressable onPress={onSearch} style={styles.searchBtn} accessibilityLabel="Recherche">
        <Icon name="search" size={18} color={adminChrome.textMuted} />
      </Pressable>
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    rail: {
      width: ADMIN_RAIL_WIDTH,
      backgroundColor: adminChrome.rail,
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: adminChrome.shellBorder,
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    mark: {
      color: adminChrome.accent,
      fontWeight: '900',
      fontSize: 13,
      letterSpacing: 1,
      fontFamily: adminChrome.mono,
      marginBottom: spacing.md,
    },
    modes: { flex: 1, gap: 4, width: '100%', paddingHorizontal: 6 },
    modeBtn: {
      alignItems: 'center',
      paddingVertical: 10,
      borderRadius: 0,
      gap: 4,
      borderLeftWidth: 2,
      borderLeftColor: 'transparent',
    },
    modeBtnOn: {
      backgroundColor: adminChrome.rowActive,
      borderLeftColor: adminChrome.accent,
    },
    modeLabel: {
      fontSize: 9,
      fontWeight: '700',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: adminChrome.textMuted,
    },
    modeLabelOn: { color: adminChrome.accent },
    badge: {
      position: 'absolute',
      top: 4,
      right: 6,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: adminChrome.accent,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
    },
    badgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
    searchBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.shellBorder,
      marginTop: spacing.sm,
    },
  });
}
