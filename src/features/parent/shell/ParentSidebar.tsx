import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { PressableSpring } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import { ProDayText } from '../../../components/ui/ProDayText';
import { ShellAccountSection } from '../../../components/shell/ShellAccountSection';
import { spacing } from '../../../theme/designTokens';
import { useThemedScreen } from '../../../hooks/useThemedScreen';
import {
  PARENT_MENU_TOOLS,
  PARENT_PRIMARY_TABS,
  primaryTabForParentNav,
  type ParentTabId,
} from '../navigation/parentNavConfig';
import { parentChrome } from '../theme/parentDesignSystem';

type Props = {
  activeId: ParentTabId;
  parentName?: string;
  onSelect: (id: ParentTabId) => void;
  onSignOut: () => void;
};

/** Sidebar desktop Parent — onglets primaires + outils menu. */
export function ParentSidebar({
  activeId,
  parentName = 'Parent',
  onSelect,
  onSignOut,
}: Props) {
  const { colors: c } = useThemedScreen();
  const styles = useMemo(() => createStyles(c), [c]);
  const highlight = primaryTabForParentNav(activeId);

  return (
    <View style={[styles.root, { width: parentChrome.sidebarWidth, borderRightColor: c.border }]}>
      <View style={styles.brand}>
        <ProDayText variant="caption" muted>
          Parent
        </ProDayText>
        <ProDayText variant="section" numberOfLines={1}>
          {parentName}
        </ProDayText>
      </View>
      <View style={styles.nav}>
        {PARENT_PRIMARY_TABS.map((item) => {
          const on = item.id === highlight || item.id === activeId;
          return (
            <PressableSpring
              key={item.id}
              onPress={() => onSelect(item.id)}
              scaleTo={0.97}
              haptic
              style={[styles.row, on && { backgroundColor: c.brandSoft }]}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
            >
              <Icon
                name={item.icon}
                size={20}
                color={on ? c.brand : c.textMuted}
                variant={on ? 'filled' : 'outline'}
              />
              <ProDayText
                variant="body"
                style={{ color: on ? c.brand : c.text, fontWeight: on ? '700' : '500' }}
              >
                {item.label}
              </ProDayText>
            </PressableSpring>
          );
        })}
        <ProDayText variant="caption" muted style={styles.toolsLabel}>
          Outils
        </ProDayText>
        {PARENT_MENU_TOOLS.map((tool) => {
          const on = tool.id === activeId;
          return (
            <PressableSpring
              key={tool.id}
              onPress={() => onSelect(tool.id)}
              scaleTo={0.97}
              haptic
              style={[styles.row, on && { backgroundColor: c.brandSoft }]}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
            >
              <Icon
                name={tool.icon}
                size={18}
                color={on ? c.brand : c.textMuted}
                variant="outline"
              />
              <ProDayText
                variant="caption"
                style={{ color: on ? c.brand : c.textMuted, fontWeight: on ? '700' : '500' }}
              >
                {tool.label}
              </ProDayText>
            </PressableSpring>
          );
        })}
      </View>
      <ShellAccountSection
        tone={{
          foreground: c.text,
          muted: c.textMuted,
          faint: c.textMuted,
          surface: c.surface,
          border: c.border,
          destructive: '#DC2626',
          iconBg: c.brandSoft,
        }}
        onSignOut={onSignOut}
        safeBottom={false}
      />
    </View>
  );
}

function createStyles(c: { background: string; border: string; surface: string }) {
  return StyleSheet.create({
    root: {
      backgroundColor: c.background,
      borderRightWidth: StyleSheet.hairlineWidth,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
      paddingHorizontal: spacing.sm,
      gap: spacing.sm,
    },
    brand: {
      paddingHorizontal: spacing.sm,
      paddingBottom: spacing.sm,
      gap: 2,
    },
    nav: { flex: 1, gap: 4 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderRadius: 12,
    },
    toolsLabel: {
      marginTop: spacing.md,
      marginBottom: spacing.xs,
      paddingHorizontal: spacing.sm,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
  });
}
