import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { TournamentCard } from '../components/TournamentCard';

/**
 * Onglet 2 — Arena (tournois)
 * Calendrier, inscription clubs, tableau d'honneur (meilleur joueur / buteur / gardien).
 */
export const ArenaScreen: React.FC = () => (
  <ScrollView style={styles.container}>
    <Text style={styles.title}>Arena</Text>
    <Text style={styles.section}>Tournois proches</Text>
    {/* [FIREBASE] liste tournaments orderBy date_start */}
    <Text style={styles.hint}>Aucun tournoi chargé — branchez Firestore.</Text>

    <Text style={[styles.section, styles.mt]}>Tableau d&apos;honneur</Text>
    <View style={styles.honor}>
      <HonorSlot label="Meilleur joueur" name="—" />
      <HonorSlot label="Buteur" name="—" />
      <HonorSlot label="Gardien" name="—" />
    </View>
  </ScrollView>
);

const HonorSlot: React.FC<{ label: string; name: string }> = ({ label, name }) => (
  <View style={styles.honorItem}>
    <Text style={styles.honorLabel}>{label}</Text>
    <Text style={styles.honorName}>{name}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 16 },
  title: { color: '#F8FAFC', fontSize: 24, fontWeight: '800' },
  section: { color: '#94A3B8', fontSize: 14, marginTop: 20, marginBottom: 8 },
  mt: { marginTop: 32 },
  hint: { color: '#64748B', fontSize: 13 },
  honor: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  honorItem: {
    flex: 1,
    minWidth: 100,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  honorLabel: { color: '#94A3B8', fontSize: 11 },
  honorName: { color: '#F8FAFC', fontSize: 16, fontWeight: '700', marginTop: 4 },
});
