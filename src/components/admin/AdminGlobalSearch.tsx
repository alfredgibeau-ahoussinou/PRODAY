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
import {
  ADMIN_NAV,
  ADMIN_SEARCH_KIND_LABELS,
  type AdminSectionId,
} from '../../navigation/adminNavConfig';
import { adminChrome } from '../../theme/adminTheme';
import { spacing } from '../../theme/designTokens';

interface AdminGlobalSearchProps {
  visible: boolean;
  onClose: () => void;
  onNavigateSection: (section: AdminSectionId, tab?: string) => void;
}

const QUICK_JUMPS = ADMIN_NAV.filter((n) =>
  ['accueil', 'utilisateurs', 'clubs', 'matchs_events', 'signalements', 'abonnements', 'parametres'].includes(
    n.id,
  ),
);

export const AdminGlobalSearch: React.FC<AdminGlobalSearchProps> = ({
  visible,
  onClose,
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
    onNavigateSection(item.targetSection, item.targetTab);
    onClose();
    setQuery('');
  };

  const handleJump = (section: AdminSectionId, tab?: string) => {
    onNavigateSection(section, tab);
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
          <Text style={styles.title}>Recherche globale</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Icon name="close" size={22} color={adminChrome.text} />
          </Pressable>
        </View>

        <View style={styles.inputWrap}>
          <Icon name="search" size={18} color={adminChrome.textMuted} />
          <TextInput
            style={styles.input}
            placeholder="Compte, club, annonce, événement…"
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
              <Pressable
                key={j.id}
                onPress={() => handleJump(j.id, j.route.tab)}
                style={styles.row}
              >
                <Icon name={j.icon} size={18} color={adminChrome.accent} />
                <Text style={styles.rowTitle}>{j.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable onPress={() => handlePick(item)} style={styles.row}>
                <View style={styles.kindBadge}>
                  <Text style={styles.kindText}>
                    {ADMIN_SEARCH_KIND_LABELS[item.kind] ?? item.kind}
                  </Text>
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>{item.title}</Text>
                  <Text style={styles.rowSub} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                </View>
                <Icon name="chevron-forward" size={14} color={adminChrome.textMuted} />
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>Aucun résultat pour « {query.trim()} ».</Text>
            }
          />
        )}
      </View>
    </Modal>
  );
};

function createStyles() {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: adminChrome.shellElevated },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: adminChrome.shellBorder,
    },
    title: { flex: 1, fontSize: 18, fontWeight: '800', color: adminChrome.text },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      margin: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: adminChrome.shell,
      borderRadius: adminChrome.radius,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.shellBorder,
    },
    input: { flex: 1, fontSize: 16, color: adminChrome.text, paddingVertical: 6 },
    quick: { paddingHorizontal: spacing.md, gap: spacing.xs },
    section: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: adminChrome.textMuted,
      marginBottom: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: 12,
      paddingHorizontal: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: adminChrome.shellBorder,
    },
    rowBody: { flex: 1, minWidth: 0 },
    rowTitle: { fontSize: 15, fontWeight: '700', color: adminChrome.text },
    rowSub: { fontSize: 12, color: adminChrome.textMuted, marginTop: 2 },
    kindBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: adminChrome.soft,
    },
    kindText: {
      fontSize: 10,
      fontWeight: '800',
      color: adminChrome.accent,
      textTransform: 'uppercase',
    },
    empty: {
      padding: spacing.xl,
      textAlign: 'center',
      color: adminChrome.textMuted,
      fontSize: 14,
    },
  });
}
