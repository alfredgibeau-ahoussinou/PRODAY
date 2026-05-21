import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, radius, shadows } from '../theme/designTokens';
import type { RecruitmentFilters } from '../models/Player';
import { PlayersListScreen } from './PlayersListScreen';
import { PlayerProfileScreen } from './PlayerProfileScreen';
import { CoachesListScreen } from './CoachesListScreen';
import { CoachProfileScreen } from './CoachProfileScreen';
import { CoachListCard } from '../components/CoachListCard';
import { DataState } from '../components/DataState';
import { useMercatoHome, useUserProfile } from '../hooks/useRecruitmentData';
import { formatTimeAgo } from '../services/recruitment.service';
import { isFirebaseConfigured } from '../config/firebase';

type MercatoView =
  | 'home'
  | 'players'
  | 'player_profile'
  | 'staff'
  | 'staff_profile';

export const MercatoScreen: React.FC = () => {
  const [view, setView] = useState<MercatoView>('home');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [filters, setFilters] = useState<RecruitmentFilters>({});

  const { user: selectedPlayer, loading: loadingPlayer } =
    useUserProfile(selectedPlayerId);
  const { user: selectedStaff, loading: loadingStaff } =
    useUserProfile(selectedStaffId);

  const {
    stats,
    labels,
    loading: loadingStats,
    configured,
    popularCoaches,
    recentPlayers,
    posts,
    loadingLists,
  } = useMercatoHome();

  if (view === 'players') {
    return (
      <PlayersListScreen
        onBack={() => setView('home')}
        onSelectPlayer={(p) => {
          setSelectedPlayerId(p.uid);
          setView('player_profile');
        }}
      />
    );
  }

  if (view === 'player_profile' && selectedPlayerId) {
    if (loadingPlayer) {
      return (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.bluePrimary} />
        </View>
      );
    }
    if (!selectedPlayer) {
      return (
        <View style={styles.loader}>
          <Text style={styles.muted}>Joueur introuvable.</Text>
          <TouchableOpacity onPress={() => setView('players')}>
            <Text style={styles.link}>Retour</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <PlayerProfileScreen
        player={selectedPlayer}
        onBack={() => setView('players')}
        onContact={(p) => console.log('[Mercato] Contacter joueur', p.display_name)}
      />
    );
  }

  if (view === 'staff') {
    return (
      <CoachesListScreen
        onBack={() => setView('home')}
        onSelect={(u) => {
          setSelectedStaffId(u.uid);
          setView('staff_profile');
        }}
      />
    );
  }

  if (view === 'staff_profile' && selectedStaffId) {
    if (loadingStaff) {
      return (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.bluePrimary} />
        </View>
      );
    }
    if (!selectedStaff) {
      return (
        <View style={styles.loader}>
          <Text style={styles.muted}>Profil introuvable.</Text>
          <TouchableOpacity onPress={() => setView('staff')}>
            <Text style={styles.link}>Retour</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <CoachProfileScreen
        staff={selectedStaff}
        onBack={() => setView('staff')}
        onContact={(u) => console.log('[Mercato] Contacter', u.display_name)}
        onHire={(u) => console.log('[Mercato] Engager', u.display_name)}
      />
    );
  }

  const statsLoading = loadingStats || loadingLists;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Recrutement</Text>

      {!configured && (
        <DataState firebaseMissing>
          <></>
        </DataState>
      )}

      <TextInput
        style={styles.search}
        placeholder="Rechercher un joueur, un coach…"
        placeholderTextColor={colors.textMuted}
        value={filters.position ?? ''}
        onChangeText={(position) => setFilters((f) => ({ ...f, position }))}
      />

      <View style={styles.quickRow}>
        <TouchableOpacity
          style={[styles.quickCard, shadows.card]}
          onPress={() => setView('players')}
        >
          <Text style={styles.quickEmoji}>👤</Text>
          <Text style={styles.quickTitle}>Joueurs</Text>
          {statsLoading ? (
            <ActivityIndicator size="small" color={colors.bluePrimary} />
          ) : (
            <Text style={styles.quickCount}>
              {labels?.players ?? '0 profil'}
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickCard, shadows.card]}
          onPress={() => setView('staff')}
        >
          <Text style={styles.quickEmoji}>📋</Text>
          <Text style={styles.quickTitle}>Coachs & Agents</Text>
          {statsLoading ? (
            <ActivityIndicator size="small" color={colors.bluePrimary} />
          ) : (
            <Text style={styles.quickCount}>
              {labels?.staff ?? '0 profil'}
              {stats
                ? ` (${stats.coaches} coachs · ${stats.agents} agents)`
                : ''}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {stats && stats.clubs > 0 && (
        <Text style={styles.clubsMeta}>{labels?.clubs} inscrits</Text>
      )}

      <Text style={styles.section}>Coachs populaires</Text>
      {statsLoading ? (
        <ActivityIndicator color={colors.bluePrimary} />
      ) : popularCoaches.length === 0 ? (
        <Text style={styles.empty}>
          {isFirebaseConfigured()
            ? 'Aucun coach pour le moment.'
            : 'Connectez Firebase pour afficher les profils.'}
        </Text>
      ) : (
        popularCoaches.map((c) => (
          <CoachListCard
            key={c.uid}
            user={c}
            onPress={(u) => {
              setSelectedStaffId(u.uid);
              setView('staff_profile');
            }}
          />
        ))
      )}

      <Text style={styles.section}>Joueurs récents</Text>
      {statsLoading ? (
        <ActivityIndicator color={colors.bluePrimary} />
      ) : recentPlayers.length === 0 ? (
        <Text style={styles.empty}>Aucun joueur inscrit.</Text>
      ) : (
        recentPlayers.map((p) => (
          <TouchableOpacity
            key={p.uid}
            style={[styles.playerPreview, shadows.card]}
            onPress={() => {
              setSelectedPlayerId(p.uid);
              setView('player_profile');
            }}
          >
            <View style={styles.previewAvatar}>
              <Text style={styles.previewInitial}>
                {p.display_name.charAt(0)}
              </Text>
            </View>
            <View style={styles.previewInfo}>
              <Text style={styles.previewName}>{p.display_name}</Text>
              <Text style={styles.previewMeta}>
                {[p.profile.position, p.profile.level, p.city]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </View>
            <Text style={styles.previewArrow}>›</Text>
          </TouchableOpacity>
        ))
      )}

      <Text style={styles.section}>Annonces ouvertes</Text>
      {statsLoading ? (
        <ActivityIndicator color={colors.bluePrimary} />
      ) : posts.length === 0 ? (
        <Text style={styles.empty}>Aucune annonce de recrutement.</Text>
      ) : (
        posts.map((ad) => (
          <View key={ad.id} style={[styles.adCard, shadows.card]}>
            <Text style={styles.adClub}>{ad.club_name}</Text>
            <Text style={styles.adRole}>
              {ad.title || `Recherche ${ad.position}`} · {ad.category}
            </Text>
            <Text style={styles.adMeta}>
              {ad.level} · {formatTimeAgo(ad.created_at)}
            </Text>
          </View>
        ))
      )}

      <TouchableOpacity style={[styles.fab, shadows.fab]}>
        <Text style={styles.fabText}>+ Créer une annonce</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 100 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  search: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  quickRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
  quickCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 110,
  },
  quickEmoji: { fontSize: 24 },
  quickTitle: { color: colors.text, fontWeight: '700', fontSize: 16, marginTop: spacing.sm },
  quickCount: { color: colors.textMuted, fontSize: 11, marginTop: 6, lineHeight: 16 },
  clubsMeta: { color: colors.textSecondary, fontSize: 12, marginBottom: spacing.lg },
  section: {
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  empty: { color: colors.textMuted, fontSize: 13, marginBottom: spacing.md },
  playerPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.successBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  previewInitial: { fontSize: 20, fontWeight: '700', color: colors.bluePrimary },
  previewInfo: { flex: 1 },
  previewName: { color: colors.text, fontWeight: '700', fontSize: 15 },
  previewMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  previewArrow: { color: colors.textMuted, fontSize: 22 },
  adCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  adClub: { color: colors.text, fontWeight: '700', fontSize: 15 },
  adRole: { color: colors.bluePrimary, marginTop: 4, fontSize: 14 },
  adMeta: { color: colors.textMuted, fontSize: 12, marginTop: 6 },
  fab: {
    marginTop: spacing.xl,
    backgroundColor: colors.bluePrimary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  fabText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  muted: { color: colors.textMuted },
  link: { color: colors.bluePrimary, marginTop: spacing.md, fontWeight: '600' },
});
