import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CoachText } from '../../../components/coach/coachPortalUi';
import { Icon } from '../../../components/ui/Icon';
import { COACH_SITE } from '../../../content/coachPageIdentity';
import { COACH_TOOL_GROUPS, primaryTabForCoachNav, type CoachNavItemId } from '../navigation/coachNavConfig';
import type { CoachNavResolvedFolder, CoachNavResolvedItem } from '../navigation/resolveCoachNavAccess';
import { CoachNavRow } from './CoachNavRow';
import { useCoachShellNav } from './CoachShellNavContext';
import { radius, spacing } from '../../../theme/designTokens';

type Props = {
  activeId: CoachNavItemId;
  coachName: string;
  formulaLabel: string;
  folders: CoachNavResolvedFolder[];
  toolItems?: CoachNavResolvedItem[];
  onSelect: (id: CoachNavItemId) => void;
  onOpenHelp: () => void;
  onSignOut: () => void;
  width?: number;
  inDrawer?: boolean;
};

export function CoachSidebar({
  activeId,
  coachName,
  formulaLabel,
  folders,
  toolItems = [],
  onSelect,
  onOpenHelp,
  onSignOut,
  width = 268,
  inDrawer = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(width), [width]);
  const highlight = primaryTabForCoachNav(activeId);
  const items = folders.flatMap((folder) => folder.items);
  const shellNav = useCoachShellNav();
  const toolsById = useMemo(
    () => new Map(toolItems.map((item) => [item.id, item])),
    [toolItems],
  );

  return (
    <View
      style={[
        styles.root,
        inDrawer && {
          paddingTop: insets.top,
          paddingBottom: Math.max(insets.bottom, spacing.md),
        },
      ]}
    >
      <View style={styles.brand}>
        <CoachText variant="caption" accent style={styles.kicker}>
          ProDay Coach
        </CoachText>
        <CoachText variant="section" numberOfLines={2} style={styles.name}>
          {coachName}
        </CoachText>
        <View style={styles.formulaPill}>
          <CoachText variant="caption" muted style={styles.formulaText}>
            {formulaLabel}
          </CoachText>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {items.map((item) => (
          <SidebarItem
            key={item.id}
            item={item}
            on={item.id === highlight}
            onSelect={onSelect}
            styles={styles}
          />
        ))}

        {toolItems.length > 0 ? (
          <View style={styles.toolsBlock}>
            <CoachText variant="caption" muted style={styles.toolsKicker}>
              OUTILS
            </CoachText>
            <View style={styles.toolsCard}>
              {COACH_TOOL_GROUPS.flatMap((group) =>
                group.toolIds
                  .map((id) => toolsById.get(id))
                  .filter((item): item is CoachNavResolvedItem => Boolean(item)),
              ).map((item, index, arr) => (
                <CoachNavRow
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  locked={item.locked}
                  aiBadge={item.aiBadge}
                  onPress={() => {
                    if (!item.locked) shellNav?.requestNav(item.id);
                  }}
                  showSeparator={index < arr.length - 1}
                />
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={onOpenHelp}
          style={({ pressed }) => [styles.footerItem, pressed && styles.footerPressed]}
        >
          <Icon name="help" size={18} color={COACH_SITE.foreground} />
          <CoachText variant="caption" style={styles.footerLabel}>
            Aide
          </CoachText>
        </Pressable>
        <Pressable
          onPress={onSignOut}
          style={({ pressed }) => [styles.footerItem, pressed && styles.footerPressed]}
        >
          <Icon name="log-out" size={18} color="#DC2626" />
          <CoachText variant="caption" style={styles.footerSignOut}>
            Se déconnecter
          </CoachText>
        </Pressable>
      </View>
    </View>
  );
}

function SidebarItem({
  item,
  on,
  onSelect,
  styles,
}: {
  item: CoachNavResolvedItem;
  on: boolean;
  onSelect: (id: CoachNavItemId) => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      onPress={() => onSelect(item.id)}
      style={({ pressed }) => [styles.item, on && styles.itemOn, pressed && styles.itemPressed]}
    >
      <View style={[styles.iconWrap, on && styles.iconWrapOn]}>
        <Icon name={item.icon} size={18} color={on ? '#fff' : COACH_SITE.accent} />
      </View>
      <CoachText variant="section" style={[styles.itemLabel, on && styles.itemLabelOn]} numberOfLines={1}>
        {item.label}
      </CoachText>
    </Pressable>
  );
}

function createStyles(width: number) {
  return StyleSheet.create({
    root: {
      width,
      flex: 1,
      minHeight: 0,
      alignSelf: 'stretch',
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: COACH_SITE.border,
      backgroundColor: COACH_SITE.surface,
    },
    brand: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
      gap: 4,
    },
    kicker: {
      fontSize: 13,
      fontWeight: '700',
    },
    name: { color: COACH_SITE.foreground, fontWeight: '700', letterSpacing: -0.3, fontSize: 20 },
    formulaPill: {
      alignSelf: 'flex-start',
      marginTop: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radius.pill,
      backgroundColor: COACH_SITE.soft,
    },
    formulaText: {
      fontSize: 12,
      fontWeight: '700',
      color: COACH_SITE.accent,
    },
    scroll: { flex: 1, minHeight: 0 },
    scrollContent: { paddingVertical: spacing.sm, paddingBottom: spacing.xl, gap: 4 },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginHorizontal: spacing.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 10,
      minHeight: 52,
      borderRadius: radius.md,
    },
    itemOn: { backgroundColor: COACH_SITE.soft },
    itemPressed: { opacity: 0.7 },
    toolsBlock: { marginTop: spacing.md, gap: spacing.xs },
    toolsKicker: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.8,
      paddingHorizontal: spacing.md,
    },
    toolsCard: {
      marginHorizontal: spacing.sm,
      backgroundColor: COACH_SITE.bg,
      borderRadius: radius.lg,
      overflow: 'hidden',
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: COACH_SITE.bg,
    },
    iconWrapOn: { backgroundColor: COACH_SITE.accent },
    itemLabel: { flex: 1, fontWeight: '600', color: COACH_SITE.foreground, fontSize: 16 },
    itemLabelOn: { color: COACH_SITE.accent, fontWeight: '700' },
    footer: {
      flexShrink: 0,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: COACH_SITE.border,
      paddingHorizontal: spacing.sm,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
      gap: 2,
    },
    footerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 12,
      minHeight: 48,
      borderRadius: radius.md,
    },
    footerPressed: { opacity: 0.7 },
    footerLabel: { fontWeight: '600', color: COACH_SITE.foreground },
    footerSignOut: { fontWeight: '700', color: '#DC2626' },
  });
}
