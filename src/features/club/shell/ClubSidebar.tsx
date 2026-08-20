import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../../components/ui/Icon';
import { ClubText } from '../ui/clubUi';
import { primaryTabForClubNav, type ClubNavItemId } from '../navigation/clubNavConfig';
import type { ClubNavResolvedFolder } from '../navigation/resolveClubNavAccess';
import { spacing } from '../../../theme/designTokens';
import { useClubTheme } from './ClubThemeContext';
import type { ClubThemeTokens } from '../theme/clubTokens';

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

/** Sidebar desktop — liste complète Pôle Club. */
export function ClubSidebar({
  activeId,
  clubName,
  formulaLabel,
  folders,
  onSelect,
  onOpenHelp,
  onSignOut,
  width = 248,
  inDrawer = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const { tokens } = useClubTheme();
  const styles = useMemo(() => createStyles(width, tokens), [width, tokens]);
  const highlight = primaryTabForClubNav(activeId);

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
        <ClubText variant="caption" muted style={styles.kicker}>
          Pro Day Club
        </ClubText>
        <ClubText variant="section" numberOfLines={2}>
          {clubName}
        </ClubText>
        <View style={styles.formulaPill}>
          <ClubText variant="caption" style={{ color: tokens.accent, fontWeight: '700' }}>
            {formulaLabel}
          </ClubText>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {folders.map((folder) => (
          <View key={folder.id} style={styles.folder}>
            <ClubText variant="caption" muted style={styles.folderLabel}>
              {folder.label}
            </ClubText>
            {folder.items.map((item) => {
              const on = item.id === activeId || (highlight === item.id && item.id === activeId);
              const selected = item.id === activeId;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => onSelect(item.id)}
                  style={[styles.row, selected && styles.rowOn]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Icon
                    name={item.icon}
                    size={18}
                    color={selected ? tokens.accent : tokens.muted}
                  />
                  <View style={styles.rowText}>
                    <ClubText
                      variant="body"
                      numberOfLines={1}
                      style={{
                        fontWeight: selected ? '700' : '500',
                        color: selected ? tokens.foreground : tokens.muted,
                      }}
                    >
                      {item.label}
                    </ClubText>
                    {item.locked ? (
                      <Icon name="lock" size={12} color={tokens.muted} />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable onPress={onOpenHelp} style={styles.footerBtn}>
          <Icon name="help" size={16} color={tokens.muted} />
          <ClubText variant="caption" muted>
            Aide
          </ClubText>
        </Pressable>
        <Pressable onPress={onSignOut} style={styles.footerBtn}>
          <Icon name="log-out" size={16} color={tokens.muted} />
          <ClubText variant="caption" muted>
            Quitter
          </ClubText>
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(width: number, tokens: ClubThemeTokens) {
  return StyleSheet.create({
    root: {
      width,
      backgroundColor: tokens.surface,
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: tokens.border,
      flexShrink: 0,
    },
    brand: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
      gap: 6,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.border,
    },
    kicker: {
      textTransform: 'uppercase',
      letterSpacing: 1.4,
      fontWeight: '800',
      fontSize: 10,
    },
    formulaPill: {
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: tokens.accentSoft,
    },
    scroll: { flex: 1 },
    scrollContent: { paddingVertical: spacing.md, paddingBottom: spacing.xl },
    folder: { marginBottom: spacing.md, paddingHorizontal: spacing.sm },
    folderLabel: {
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      fontWeight: '800',
      fontSize: 10,
      marginBottom: 6,
      marginLeft: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: spacing.sm,
      borderRadius: 10,
    },
    rowOn: { backgroundColor: tokens.accentSoft },
    rowText: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
    footer: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: tokens.border,
      padding: spacing.md,
      gap: spacing.sm,
    },
    footerBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  });
}
