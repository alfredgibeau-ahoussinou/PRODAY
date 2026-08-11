import React, { useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { PressableSpring } from '../../../components/motion';
import { AdminDataRow } from '../../../components/admin/hq/AdminDataRow';
import { AdminInspector } from '../../../components/admin/hq/AdminInspector';
import { useAdminData } from '../../../context/AdminDataContext';
import { recruitmentService } from '../../../services/recruitment.service';
import { adminChrome } from '../../../theme/adminTheme';
import { spacing } from '../../../theme/designTokens';
import { getRoleLabel } from '../../signup/signupFlowConfig';
import { Alert, useWindowDimensions } from 'react-native';
import { ADMIN_INSPECTOR_WIDTH, ADMIN_WIDE_BREAKPOINT } from '../../../navigation/adminTabConfig';

type FilterId = 'bassin' | 'annonces' | 'candidatures' | 'joueurs';

type RecRow = {
  id: string;
  title: string;
  subtitle: string;
  trailing: string;
  kind: 'post' | 'app' | 'player';
};

/**
 * Bassin de recrutement — annonces, candidatures, joueurs filtrables.
 */
export function AdminFocRecrutementScreen() {
  const data = useAdminData();
  const { width } = useWindowDimensions();
  const wide = width >= ADMIN_WIDE_BREAKPOINT;
  const styles = useMemo(() => createStyles(wide), [wide]);
  const [filter, setFilter] = useState<FilterId>('bassin');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const q = query.trim().toLowerCase();

  const rows = useMemo((): RecRow[] => {
    if (filter === 'annonces' || filter === 'bassin') {
      return data.posts
        .filter((p) => !q || [p.title, p.club_name, p.city, p.status].some((x) => x?.toLowerCase().includes(q)))
        .map((p) => ({
          id: p.id,
          title: p.title,
          subtitle: `${p.club_name} · ${p.city}`,
          trailing: p.status === 'OPEN' ? 'Ouverte' : 'Fermée',
          kind: 'post',
        }));
    }
    if (filter === 'candidatures') {
      return data.applications
        .filter((a) => !q || [a.player_name, a.status, a.cover_letter].some((x) => x?.toLowerCase().includes(q)))
        .map((a) => ({
          id: a.id,
          title: a.player_name ?? a.player_uid,
          subtitle: a.cover_letter.slice(0, 80),
          trailing: a.status === 'PENDING' ? 'En attente' : a.status === 'ACCEPTED' ? 'Acceptée' : 'Refusée',
          kind: 'app',
        }));
    }
    return data.users
      .filter((u) => u.role === 'player')
      .filter((u) => !q || [u.display_name, u.city, u.email].some((x) => x?.toLowerCase().includes(q)))
      .map((u) => ({
        id: u.uid,
        title: u.display_name,
        subtitle: `${getRoleLabel(u.role)} · ${u.city || 'Sans ville'}`,
        trailing: 'Joueur',
        kind: 'player',
      }));
  }, [data.posts, data.applications, data.users, filter, q]);

  const selected = rows.find((r) => r.id === selectedId) ?? null;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
      await data.refresh();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Action impossible');
    } finally {
      setBusy(false);
    }
  };

  const actions =
    selected?.kind === 'app'
      ? [
          {
            id: 'ok',
            label: 'Accepter',
            tone: 'primary' as const,
            disabled: busy,
            onPress: () =>
              void run(() => recruitmentService.updateApplicationStatus(selected.id, 'ACCEPTED')),
          },
          {
            id: 'no',
            label: 'Refuser',
            tone: 'danger' as const,
            disabled: busy,
            onPress: () =>
              void run(() => recruitmentService.updateApplicationStatus(selected.id, 'REJECTED')),
          },
        ]
      : [];

  return (
    <View style={styles.root}>
      <View style={styles.listPane}>
        <View style={styles.header}>
          <Text style={styles.title}>Bassin de recrutement</Text>
          <Text style={styles.sub}>
            Annonces, candidatures et joueurs disponibles — filtrez puis agissez.
          </Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Poste, club, joueur, ville…"
            placeholderTextColor={adminChrome.textMuted}
            style={styles.search}
            autoCapitalize="none"
          />
          <View style={styles.chips}>
            {(
              [
                ['bassin', 'Bassin'],
                ['annonces', 'Annonces'],
                ['candidatures', 'Candidatures'],
                ['joueurs', 'Joueurs'],
              ] as const
            ).map(([id, label]) => (
              <PressableSpring
                key={id}
                onPress={() => {
                  setFilter(id);
                  setSelectedId(null);
                }}
                scaleTo={0.97}
                haptic
                style={[styles.chip, filter === id && styles.chipOn]}
              >
                <Text style={[styles.chipText, filter === id && styles.chipTextOn]}>{label}</Text>
              </PressableSpring>
            ))}
          </View>
        </View>
        <FlatList
          data={rows}
          keyExtractor={(r) => r.id}
          refreshControl={
            <RefreshControl
              refreshing={data.refreshing}
              onRefresh={data.refresh}
              tintColor={adminChrome.accent}
            />
          }
          ListEmptyComponent={<Text style={styles.empty}>Aucun résultat.</Text>}
          renderItem={({ item }) => (
            <AdminDataRow
              title={item.title}
              subtitle={item.subtitle}
              trailing={item.trailing}
              selected={item.id === selectedId}
              onPress={() => setSelectedId(item.id)}
            />
          )}
        />
      </View>
      {wide ? (
        <View style={styles.inspector}>
          {selected ? (
            <AdminInspector
              eyebrow={
                selected.kind === 'app'
                  ? 'Candidature'
                  : selected.kind === 'post'
                    ? 'Annonce'
                    : 'Joueur'
              }
              title={selected.title}
              body={selected.subtitle}
              meta={[selected.trailing]}
              actions={actions}
            />
          ) : (
            <AdminInspector eyebrow="" title="" emptyLabel="Sélectionne une ligne pour agir." />
          )}
        </View>
      ) : null}
    </View>
  );
}

function createStyles(wide: boolean) {
  return StyleSheet.create({
    root: { flex: 1, flexDirection: wide ? 'row' : 'column', backgroundColor: adminChrome.shell },
    listPane: { flex: 1, minWidth: 0 },
    header: { padding: spacing.md, gap: spacing.sm },
    title: { color: adminChrome.text, fontSize: 22, fontWeight: '800' },
    sub: { color: adminChrome.textMuted, fontSize: 13, lineHeight: 18 },
    search: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.shellBorder,
      backgroundColor: adminChrome.shellElevated,
      color: adminChrome.text,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      borderRadius: adminChrome.radius,
      fontSize: 14,
    },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.shellBorder,
      backgroundColor: adminChrome.shellElevated,
    },
    chipOn: { borderColor: adminChrome.accent, backgroundColor: adminChrome.soft },
    chipText: { color: adminChrome.textMuted, fontWeight: '700', fontSize: 12 },
    chipTextOn: { color: adminChrome.accent },
    empty: { padding: spacing.lg, color: adminChrome.textMuted },
    inspector: { width: ADMIN_INSPECTOR_WIDTH },
  });
}
