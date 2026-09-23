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
import { useAdminTokens, ADMIN_TOKENS } from '../theme/adminTokens';
import { adminRadius, adminShadow, adminSpace } from '../theme/adminDesignSystem';
import {
  resolveAdminCommandItems,
  type AdminNavSectionId,
} from '../navigation/adminNavConfig';
import { globalAdminSearch } from '../../../utils/adminInsights';
import { useAdminData } from '../data/AdminDataContext';
import { Icon } from '../../../components/ui/Icon';
import { AdminBadge, AdminBrandMark, AdminText } from '../ui/adminUi';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { AdminModalSheet, adminMotion } from '../motion';
import { useAppearance } from '../../../context/AppearanceContext';

type Props = {
  open: boolean;
  onClose: () => void;
  onNavigate: (section: AdminNavSectionId, focusId?: string) => void;
};

export function AdminCommandPalette({ open, onClose, onNavigate }: Props) {
  const t = useAdminTokens();
  const data = useAdminData();
  const reduced = useReducedMotion();
  const { isEffectiveGlass, glassMode, setGlassMode, intensity, setIntensity } = useAppearance();
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

  const appearanceActions = useMemo(() => [
    {
      key: 'app-glass-auto',
      label: 'Apparence : Auto (Système)',
      sub: 'Suit la réduction de transparence iOS/OS',
      action: () => void setGlassMode('system'),
      badge: glassMode === 'system' ? 'ACTIF' : undefined,
    },
    {
      key: 'app-glass-on',
      label: 'Apparence : Activer Liquid Glass',
      sub: 'Translucidité, reflets et flou de profondeur Apple',
      action: () => void setGlassMode('glass'),
      badge: glassMode === 'glass' ? 'ACTIF' : undefined,
    },
    {
      key: 'app-glass-off',
      label: 'Apparence : Forcer Mode Opaque Solide',
      sub: 'Contraste maximal, zéro effet de transparence',
      action: () => void setGlassMode('opaque'),
      badge: glassMode === 'opaque' ? 'ACTIF' : undefined,
    },
    {
      key: 'app-int-subtle',
      label: 'Intensité Glass : Subtil (16px blur)',
      sub: 'Translucidité légère',
      action: () => void setIntensity('subtle'),
      badge: intensity === 'subtle' ? 'ACTIF' : undefined,
    },
    {
      key: 'app-int-regular',
      label: 'Intensité Glass : Standard (28px blur)',
      sub: 'Équilibre officiel Apple',
      action: () => void setIntensity('regular'),
      badge: intensity === 'regular' ? 'ACTIF' : undefined,
    },
    {
      key: 'app-int-intense',
      label: 'Intensité Glass : Intense (40px blur)',
      sub: 'Profondeur maximale',
      action: () => void setIntensity('intense'),
      badge: intensity === 'intense' ? 'ACTIF' : undefined,
    },
  ], [glassMode, intensity, setGlassMode, setIntensity]);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    const appHits = appearanceActions.filter((a) =>
      !query ? true : a.label.toLowerCase().includes(query) || a.sub.toLowerCase().includes(query) || query.includes('glass') || query.includes('theme') || query.includes('apparence') || query.includes('flou'),
    );
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
    return { appHits: appHits.slice(0, 3), cmdHits: cmdHits.slice(0, 8), entityHits };
  }, [q, commands, data, appearanceActions]);

  return (
    <AdminModalSheet
      visible={open}
      onClose={onClose}
      variant="sheet"
      gestureClose
      contentStyle={styles.sheetPad}
    >
      <Animated.View style={[styles.sheet, cardStyle, (t.glassBackdrop as any)]}>
        <View style={styles.searchRow}>
          <AdminBrandMark compact />
          <AdminBadge
            label={isEffectiveGlass ? `LIQUID GLASS · ${intensity.toUpperCase()}` : 'MODE OPAQUE'}
            tone={isEffectiveGlass ? 'accent' : 'info'}
          />
        </View>
        <View style={styles.searchRow}>
          <Icon name="search" size={18} color={t.signal} />
          <TextInput
            autoFocus
            value={q}
            onChangeText={setQ}
            placeholder="Clubs, devis, utilisateurs, apparence, glass…"
            placeholderTextColor={t.faint}
            style={[styles.input, { color: t.foreground }]}
          />
          <Pressable onPress={onClose} hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Fermer">
            <Icon name="close" size={18} color={t.muted} />
          </Pressable>
        </View>
        <FlatList
          data={[
            ...results.appHits.map((a) => ({
              key: a.key,
              label: a.label,
              sub: a.sub,
              type: 'app' as const,
              badge: a.badge,
              onRun: a.action,
            })),
            ...results.cmdHits.map((c) => ({
              key: `cmd-${c.id}`,
              label: c.label,
              sub: 'Navigation',
              type: 'cmd' as const,
              badge: undefined,
              section: c.section,
              focusId: undefined as string | undefined,
            })),
            ...results.entityHits.map((h) => ({
              key: h.id,
              label: h.title,
              sub: h.subtitle,
              type: 'entity' as const,
              badge: undefined,
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
                if (item.type === 'app') {
                  item.onRun?.();
                } else {
                  onNavigate(item.section!, item.focusId);
                  onClose();
                  setQ('');
                }
              }}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <AdminText variant="h3">{item.label}</AdminText>
                  {item.badge ? <AdminBadge label={item.badge} tone="accent" /> : null}
                </View>
                <AdminText variant="caption" color={t.muted} numberOfLines={1}>
                  {item.sub}
                </AdminText>
              </View>
              {item.type === 'app' ? (
                <Icon name="sparkles" size={16} color={t.signal} />
              ) : (
                <Icon name="chevron-forward" size={14} color={t.faint} />
              )}
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
    borderWidth: 1,
    borderColor: ADMIN_TOKENS.borderStrong,
    borderTopColor: ADMIN_TOKENS.specularTop,
    ...adminShadow.card,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
