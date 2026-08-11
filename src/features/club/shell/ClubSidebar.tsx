import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableSpring } from '../../../components/motion';
import { ProDayText } from '../../../components/ui/ProDayText';
import { Icon } from '../../../components/ui/Icon';
import { CLUB_SITE } from '../../../content/clubPageIdentity';
import type { ClubNavFolderId, ClubNavItemId } from '../navigation/clubNavConfig';
import type { ClubNavResolvedFolder } from '../navigation/resolveClubNavAccess';
import { spacing } from '../../../theme/designTokens';

type Props = {
  activeId: ClubNavItemId;
  clubName: string;
  formulaLabel: string;
  folders: ClubNavResolvedFolder[];
  onSelect: (id: ClubNavItemId) => void;
  onOpenHelp: () => void;
  onSignOut: () => void;
  width?: number;
  inDrawer?: boolean;
};

/**
 * Sidebar terminal — même langage que `/pro-club` (noir, mono, accent #006CFC).
 */
export function ClubSidebar({
  activeId,
  clubName,
  formulaLabel,
  folders,
  onSelect,
  onOpenHelp,
  onSignOut,
  width = 268,
  inDrawer = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(width), [width]);
  const [openFolders, setOpenFolders] = useState<Record<ClubNavFolderId, boolean>>({
    accueil: true,
    organisation: true,
    sport: true,
    communication: true,
    ressources: true,
  });

  const toggleFolder = (id: ClubNavFolderId) => {
    setOpenFolders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

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
        <ProDayText variant="caption" style={styles.kicker}>
          Pro Day Club
        </ProDayText>
        <ProDayText variant="section" numberOfLines={2} style={styles.clubName}>
          {clubName}
        </ProDayText>
        <View style={styles.formulaPill}>
          <ProDayText variant="caption" style={styles.formulaText}>
            {formulaLabel}
          </ProDayText>
        </View>
        <View style={styles.brandRule} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {folders.map((folder) => {
          const open = openFolders[folder.id] ?? true;
          return (
            <View key={folder.id} style={styles.folder}>
              <Pressable
                onPress={() => toggleFolder(folder.id)}
                style={styles.folderHeader}
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
              >
                <Icon
                  name={open ? 'chevron-down' : 'chevron-forward'}
                  size={12}
                  color={CLUB_SITE.muted}
                />
                <ProDayText variant="caption" style={styles.folderLabel}>
                  {folder.label}
                </ProDayText>
              </Pressable>

              {open
                ? folder.items.map((item) => {
                    const on = item.id === activeId;
                    return (
                      <PressableSpring
                        key={item.id}
                        onPress={() => onSelect(item.id)}
                        scaleTo={0.98}
                        haptic
                        style={[styles.item, on && styles.itemOn, item.locked && !on && styles.itemLocked]}
                      >
                        <Icon
                          name={item.icon}
                          size={15}
                          color={item.locked ? CLUB_SITE.muted : on ? CLUB_SITE.accent : CLUB_SITE.foreground}
                        />
                        <View style={styles.itemText}>
                          <View style={styles.itemTitleRow}>
                            <ProDayText
                              variant="caption"
                              style={[
                                styles.itemLabel,
                                on && styles.itemLabelOn,
                                item.locked && styles.itemLabelLocked,
                              ]}
                              numberOfLines={1}
                            >
                              {item.label}
                            </ProDayText>
                            {item.aiBadge ? (
                              <View style={styles.aiBadge}>
                                <ProDayText variant="caption" style={styles.aiBadgeText}>
                                  IA
                                </ProDayText>
                              </View>
                            ) : null}
                            {item.locked ? (
                              <Icon name="lock" size={11} color={CLUB_SITE.muted} />
                            ) : null}
                          </View>
                          {item.hint ? (
                            <ProDayText variant="caption" numberOfLines={1} style={styles.hint}>
                              {item.hint}
                            </ProDayText>
                          ) : null}
                        </View>
                      </PressableSpring>
                    );
                  })
                : null}
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <PressableSpring
          onPress={onOpenHelp}
          scaleTo={0.98}
          haptic
          style={styles.footerItem}
          accessibilityRole="button"
          accessibilityLabel="Aide"
        >
          <Icon name="help" size={15} color={CLUB_SITE.foreground} />
          <ProDayText variant="caption" style={styles.footerLabel}>
            Aide
          </ProDayText>
        </PressableSpring>
        <PressableSpring
          onPress={onSignOut}
          scaleTo={0.98}
          haptic
          style={styles.footerItem}
          accessibilityRole="button"
          accessibilityLabel="Se déconnecter"
        >
          <Icon name="log-out" size={15} color="#F87171" />
          <ProDayText variant="caption" style={styles.footerSignOut}>
            Se déconnecter
          </ProDayText>
        </PressableSpring>
      </View>
    </View>
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
      borderRightColor: CLUB_SITE.border,
      backgroundColor: CLUB_SITE.bg,
    },
    brand: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      gap: 4,
    },
    kicker: {
      color: CLUB_SITE.accent,
      textTransform: 'uppercase',
      letterSpacing: 2.8,
      fontSize: 10,
      fontWeight: '800',
    },
    clubName: {
      color: CLUB_SITE.foreground,
      fontWeight: '800',
      letterSpacing: -0.4,
    },
    formulaPill: {
      alignSelf: 'flex-start',
      marginTop: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: CLUB_SITE.border,
      backgroundColor: 'rgba(255,255,255,0.03)',
    },
    formulaText: {
      color: CLUB_SITE.muted,
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1.2,
    },
    brandRule: {
      marginTop: spacing.sm,
      height: StyleSheet.hairlineWidth,
      backgroundColor: CLUB_SITE.border,
    },
    scroll: { flex: 1, minHeight: 0 },
    scrollContent: { paddingVertical: spacing.sm, paddingBottom: spacing.xl * 2 },
    folder: {
      marginBottom: spacing.xs,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: 'rgba(255,255,255,0.06)',
      paddingBottom: spacing.xs,
    },
    folderHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
    },
    folderLabel: {
      color: CLUB_SITE.muted,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 1.6,
      fontSize: 10,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      marginHorizontal: spacing.sm,
      marginVertical: 1,
      paddingHorizontal: spacing.sm,
      paddingVertical: 10,
      borderRadius: 2,
      borderLeftWidth: 2,
      borderLeftColor: 'transparent',
    },
    itemOn: {
      backgroundColor: CLUB_SITE.soft,
      borderLeftColor: CLUB_SITE.accent,
    },
    itemLocked: { opacity: 0.7 },
    itemText: { flex: 1, minWidth: 0, gap: 1 },
    itemTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    itemLabel: {
      flexShrink: 1,
      fontWeight: '600',
      color: CLUB_SITE.foreground,
    },
    itemLabelOn: { color: CLUB_SITE.accent, fontWeight: '800' },
    itemLabelLocked: { color: CLUB_SITE.muted },
    hint: { fontSize: 10, lineHeight: 13, color: CLUB_SITE.muted },
    aiBadge: {
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: CLUB_SITE.accent,
      backgroundColor: CLUB_SITE.soft,
    },
    aiBadgeText: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.6,
      color: CLUB_SITE.accent,
    },
    footer: {
      flexShrink: 0,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: CLUB_SITE.border,
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
      paddingVertical: 10,
      borderRadius: 2,
    },
    footerLabel: {
      fontWeight: '600',
      color: CLUB_SITE.foreground,
    },
    footerSignOut: {
      fontWeight: '700',
      color: '#F87171',
    },
  });
}
