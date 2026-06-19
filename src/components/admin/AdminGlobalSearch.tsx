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
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { globalAdminSearch, type GlobalSearchResult } from '../../utils/adminInsights';
import { useAdminData } from '../../context/AdminDataContext';
import type { AdminMainTabId } from '../../navigation/adminTabConfig';
import { useAdminStyles, adminChrome } from './adminStyles';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

interface AdminGlobalSearchProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (tab: AdminMainTabId) => void;
}

export const AdminGlobalSearch: React.FC<AdminGlobalSearchProps> = ({
  visible,
  onClose,
  onNavigate,
}) => {
  const { users, clubs, posts, events } = useAdminData();
  const { colors: c } = useAdminStyles();
  const styles = useMemo(() => createStyles(c), [c]);
  const [query, setQuery] = useState('');

  const results = useMemo(
    () =>
      globalAdminSearch(query, {
        users,
        clubs,
        posts,
        events,
      }),
    [query, users, clubs, posts, events],
  );

  const handlePick = (item: GlobalSearchResult) => {
    onNavigate(item.targetTab);
    onClose();
    setQuery('');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.title}>Recherche</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Icon name="close" size={22} color={adminChrome.text} />
          </Pressable>
        </View>
        <View style={styles.inputWrap}>
          <Icon name="search" size={18} color={c.textMuted} />
          <TextInput
            style={styles.input}
            placeholder="Utilisateur, club, annonce, événement…"
            placeholderTextColor={c.textMuted}
            value={query}
            onChangeText={setQuery}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text style={styles.hint}>
              {query.trim().length < 2
                ? 'Saisissez au moins 2 caractères.'
                : 'Aucun résultat.'}
            </Text>
          }
          renderItem={({ item }) => (
            <PressableSpring onPress={() => handlePick(item)} scaleTo={0.98} haptic>
              <View style={styles.row}>
                <View style={styles.copy}>
                  <Text style={styles.rowTitle}>{item.title}</Text>
                  <Text style={styles.rowSub}>{item.subtitle}</Text>
                </View>
                <View style={styles.kindBadge}>
                  <Text style={styles.kind}>{item.kind}</Text>
                </View>
              </View>
            </PressableSpring>
          )}
        />
      </View>
    </Modal>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.backgroundAlt },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: adminChrome.shell,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: adminChrome.shellBorder,
    },
    title: { color: adminChrome.text, fontSize: 18, fontWeight: '800' },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      margin: spacing.md,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: spacing.md,
    },
    input: {
      flex: 1,
      paddingVertical: spacing.sm + 2,
      fontSize: 15,
      color: c.text,
    },
    hint: { textAlign: 'center', color: c.textMuted, padding: spacing.xl, fontSize: 13 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
      gap: spacing.sm,
      backgroundColor: c.surface,
    },
    copy: { flex: 1 },
    rowTitle: { fontSize: 14, fontWeight: '800', color: c.text },
    rowSub: { fontSize: 12, color: c.textMuted, marginTop: 2 },
    kindBadge: {
      backgroundColor: c.brandSoft,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.pill,
    },
    kind: {
      fontSize: 10,
      fontWeight: '800',
      color: c.brand,
      textTransform: 'uppercase',
    },
  });
}
