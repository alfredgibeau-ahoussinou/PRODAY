import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { colors, spacing, radius, shadows } from '../theme/designTokens';
import type { RecruitmentFilters } from '../models/Player';

/**
 * Onglet Recrutement — maquette : accueil, cartes Joueurs/Clubs, annonces, FAB
 */
export const MercatoScreen: React.FC = () => {
  const [filters, setFilters] = useState<RecruitmentFilters>({});

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recrutement</Text>
      <TextInput
        style={styles.search}
        placeholder="Rechercher un joueur, un poste…"
        placeholderTextColor={colors.textMuted}
        value={filters.position ?? ''}
        onChangeText={(position) => setFilters((f) => ({ ...f, position }))}
      />

      <View style={styles.quickRow}>
        <View style={[styles.quickCard, shadows.card]}>
          <Text style={styles.quickEmoji}>👤</Text>
          <Text style={styles.quickTitle}>Joueurs</Text>
          <Text style={styles.quickCount}>1 248 profils</Text>
        </View>
        <View style={[styles.quickCard, shadows.card]}>
          <Text style={styles.quickEmoji}>🏟️</Text>
          <Text style={styles.quickTitle}>Clubs</Text>
          <Text style={styles.quickCount}>324 clubs</Text>
        </View>
      </View>

      <Text style={styles.section}>Annonces populaires</Text>
      <FlatList
        data={[]}
        keyExtractor={(item) => item}
        renderItem={() => null}
        ListEmptyComponent={
          <View style={[styles.adCard, shadows.card]}>
            <Text style={styles.adClub}>US Marseille</Text>
            <Text style={styles.adRole}>Recherche Attaquant · U19</Text>
            <Text style={styles.adMeta}>R1 · Il y a 2 j</Text>
          </View>
        }
      />

      <TouchableOpacity style={[styles.fab, shadows.fab]}>
        <Text style={styles.fabText}>+ Créer une annonce</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
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
  quickRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  quickCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickEmoji: { fontSize: 24 },
  quickTitle: { color: colors.text, fontWeight: '700', fontSize: 16, marginTop: spacing.sm },
  quickCount: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  section: { color: colors.textSecondary, fontWeight: '600', marginBottom: spacing.sm },
  adCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  adClub: { color: colors.text, fontWeight: '700', fontSize: 15 },
  adRole: { color: colors.bluePrimary, marginTop: 4, fontSize: 14 },
  adMeta: { color: colors.textMuted, fontSize: 12, marginTop: 6 },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.bluePrimary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  fabText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});
