import React, { useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Icon } from '../ui/Icon';
import { globalAdminSearch, type GlobalSearchResult } from '../../utils/adminInsights';
import { useAdminData } from '../../context/AdminDataContext';
import type { AdminHqRoute } from '../../navigation/adminTabConfig';
import { ADMIN_SEARCH_KIND_LABELS, hqRouteFromLegacyTab } from '../../navigation/adminTabConfig';
import type { AdminFocSectionId } from '../../navigation/adminFocConfig';
import { adminChrome } from '../../theme/adminTheme';
import { spacing } from '../../theme/designTokens';

interface AdminGlobalSearchProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (route: AdminHqRoute) => void;
  onNavigateSection?: (section: AdminFocSectionId) => void;
}

const QUICK_JUMPS: {
  section: AdminFocSectionId;
  label: string;
  icon: 'home' | 'mail' | 'people' | 'football' | 'bag' | 'settings';
}[] = [
  { section: 'dashboard', label: 'Accueil', icon: 'home' },
  { section: 'personnes', label: 'Personnes', icon: 'people' },
  { section: 'competition', label: 'Compétition', icon: 'football' },
  { section: 'operations', label: 'Opérations', icon: 'mail' },
  { section: 'finances', label: 'Finances', icon: 'bag' },
  { section: 'plateforme', label: 'Plateforme', icon: 'settings' },
];

export const AdminGlobalSearch: React.FC<AdminGlobalSearchProps> = ({
  visible,
  onClose,
  onNavigate,
  onNavigateSection,
}) => {
  const { users, clubs, posts, events } = useAdminData();
  const styles = useMemo(() => createStyles(), []);
  const [query, setQuery] = useState('');

  const results = useMemo(
    () => globalAdminSearch(query, { users, clubs, posts, events }),
    [query, users, clubs, posts, events],
  );

  const handlePick = (item: GlobalSearchResult) => {
    const mapped = hqRouteFromLegacyTab(item.targetTab, item.targetSegment);
    onNavigate(mapped);
    onClose();
    setQuery('');
  };

  const handleJump = (section: AdminFocSectionId) => {
    if (onNavigateSection) onNavigateSection(section);
    else {
      const map: Partial<Record<AdminFocSectionId, AdminHqRoute>> = {
        dashboard: { mode: 'pilotage' },
        personnes: { mode: 'gestion', atelier: 'comptes' },
        competition: { mode: 'gestion', atelier: 'matchs' },
        operations: { mode: 'decisions' },
        finances: { mode: 'abonnements' },
        plateforme: { mode: 'systeme' },
      };
      onNavigate(map[section] ?? { mode: 'pilotage' });
    }
    onClose();
    setQuery('');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.title}>Recherche</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Icon name="close" size={22} color={adminChrome.text} />
          </Pressable>
        </View>

        <View style={styles.inputWrap}>
          <Icon name="search" size={18} color={adminChrome.textMuted} />
          <TextInput
            style={styles.input}
            placeholder="Compte, club, match, annonce…"
            placeholderTextColor={adminChrome.textMuted}
            value={query}
            onChangeText={setQuery}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {query.trim().length < 2 ? (
          <View style={styles.quick}>
            <Text style={styles.section}>Raccourcis</Text>
            {QUICK_JUMPS.map((j) => (
              <Pressable key={j.section} onPress={() => handleJump(j.section)} style={styles.row}>
                <Icon name={j.icon} size={18} color={adminChrome.accent} />
                <Text style={styles.rowTitle}>{j.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={styles.empty}>Aucun résultat pour « {query.trim()} »</Text>
            }
            renderItem={({ item }) => (
              <Pressable onPress={() => handlePick(item)} style={styles.row}>
                <Text style={styles.kind}>
                  {ADMIN_SEARCH_KIND_LABELS[item.kind] ?? item.kind}
                </Text>
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.rowSub} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                </View>
              </Pressable>
            )}
          />
        )}
      </View>
    </Modal>
  );
};

function createStyles() {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: adminChrome.shell, paddingTop: spacing.lg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.md,
    },
    title: { fontSize: 22, fontWeight: '800', color: adminChrome.text },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginHorizontal: spacing.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.shellBorder,
      backgroundColor: adminChrome.shellElevated,
      borderRadius: 12,
    },
    input: { flex: 1, color: adminChrome.text, fontSize: 15, paddingVertical: 4 },
    quick: { padding: spacing.lg, gap: spacing.sm },
    section: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      color: adminChrome.textMuted,
      marginBottom: spacing.xs,
    },
    list: { padding: spacing.lg },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: adminChrome.shellBorder,
    },
    kind: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: adminChrome.accent,
      minWidth: 64,
    },
    rowCopy: { flex: 1, minWidth: 0, gap: 2 },
    rowTitle: { color: adminChrome.text, fontSize: 15, fontWeight: '700' },
    rowSub: { color: adminChrome.textMuted, fontSize: 12 },
    empty: { color: adminChrome.textMuted, textAlign: 'center', marginTop: spacing.xl },
  });
}
