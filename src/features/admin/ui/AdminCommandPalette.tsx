import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import { adminRadius, adminShadow, adminSpace } from '../theme/adminDesignSystem';
import {
  resolveAdminCommandItems,
  type AdminNavSectionId,
} from '../navigation/adminNavConfig';
import { globalAdminSearch } from '../../../utils/adminInsights';
import { useAdminData } from '../data/AdminDataContext';
import { Icon } from '../../../components/ui/Icon';
import { AdminBrandMark, AdminText } from '../ui/adminUi';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { AdminModalSheet, adminMotion } from '../motion';

type Props = {
  open: boolean;
  onClose: () => void;
  onNavigate: (section: AdminNavSectionId, focusId?: string) => void;
};

export function AdminCommandPalette({ open, onClose, onNavigate }: Props) {
  const t = ADMIN_TOKENS;
  const data = useAdminData();
  const reduced = useReducedMotion();
  const [q, setQ] = useState('');
  const commands = useMemo(() => resolveAdminCommandItems(), []);
  const sheetY = useSharedValue(open ? 0 : 24);
  const opacity = useSharedValue(open ? 1 : 0);

  useEffect(() => {
    if (!open) {
      setQ('');
      return;
    }
    if (reduced) {
      sheetY.value = 0;
      opacity.value = 1;
      return;
    }
    opacity.value = withTiming(1, { duration: adminMotion.duration.fast });
    sheetY.value = withSpring(0, adminMotion.spring.smooth);
  }, [open, reduced, sheetY, opacity]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: sheetY.value }],
  }));

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    const cmdHits = commands.filter((c) =>
      !query ? true : c.keywords.some((k) => k.includes(query)) || c.label.toLowerCase().includes(query),
    );
    const entityHits = globalAdminSearch(q, {
      users: data.users,
      clubs: data.clubs.map((c) => ({ id: c.id, name: c.name, city: c.city ?? '' })),
      posts: data.posts.map((p) => ({
        id: p.id,
        title: p.title,
        club_name: p.club_name,
        city: p.city,
      })),
      events: data.events.map((e) => ({
        id: e.id,
        title: e.title,
        city: e.city ?? '',
      })),
    });
    return { cmdHits: cmdHits.slice(0, 8), entityHits };
  }, [q, commands, data]);

  return (
    <AdminModalSheet
      visible={open}
      onClose={onClose}
      variant="sheet"
      gestureClose
      contentStyle={styles.sheetPad}
    >
      <Animated.View style={[styles.sheet, cardStyle]}>
        <View style={styles.searchRow}>
          <AdminBrandMark compact />
        </View>
        <View style={styles.searchRow}>
          <Icon name="search" size={18} color={t.accent} />
          <TextInput
            autoFocus
            value={q}
            onChangeText={setQ}
            placeholder="Clubs, devis, utilisateurs, domaines…"
            placeholderTextColor={t.faint}
            style={[styles.input, { color: t.foreground }]}
          />
          <Pressable onPress={onClose}>
            <Icon name="close" size={18} color={t.muted} />
          </Pressable>
        </View>
        <FlatList
          data={[
            ...results.cmdHits.map((c) => ({
              key: `cmd-${c.id}`,
              label: c.label,
              sub: 'Navigation',
              section: c.section,
              focusId: undefined as string | undefined,
            })),
            ...results.entityHits.map((h) => ({
              key: h.id,
              label: h.title,
              sub: h.subtitle,
              section: h.targetSection,
              focusId: h.entityId,
            })),
          ]}
          keyExtractor={(item) => item.key}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => {
                onNavigate(item.section, item.focusId);
                onClose();
                setQ('');
              }}
            >
              <View style={{ flex: 1 }}>
                <AdminText variant="h3">{item.label}</AdminText>
                <AdminText variant="caption" color={t.muted} numberOfLines={1}>
                  {item.sub}
                </AdminText>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={{ padding: 16 }}>
              <AdminText variant="body" color={t.muted}>
                Aucun résultat
              </AdminText>
            </View>
          }
        />
      </Animated.View>
    </AdminModalSheet>
  );
}

const styles = StyleSheet.create({
  sheetPad: {
    backgroundColor: ADMIN_TOKENS.surfaceRaised,
  },
  sheet: {
    flex: 1,
    backgroundColor: ADMIN_TOKENS.surfaceRaised,
    borderRadius: adminRadius.lg,
    overflow: 'hidden',
    ...adminShadow.soft,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: adminSpace.lg,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ADMIN_TOKENS.hairline,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpace.lg,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ADMIN_TOKENS.hairline,
  },
});
