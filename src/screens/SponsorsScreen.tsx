import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

/**
 * Onglet 4 — Sponsors
 * Marketplace entreprises locales ↔ clubs (packs, barre de progression financement).
 */
export const SponsorsScreen: React.FC = () => (
  <ScrollView style={styles.container}>
    <Text style={styles.title}>Sponsors</Text>
    <Text style={styles.section}>Offres partenaires</Text>
    <View style={styles.offer}>
      <Text style={styles.offerTitle}>Pack équipement</Text>
      <Text style={styles.offerDesc}>
        10 ballons contre logo sur l&apos;app et maillots partenaires
      </Text>
    </View>

    <Text style={[styles.section, styles.mt]}>Financement club</Text>
    <View style={styles.progressCard}>
      <Text style={styles.progressTitle}>Survêtements saison 2026</Text>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: '60%' }]} />
      </View>
      <Text style={styles.progressMeta}>300 € / 500 € — 60 %</Text>
    </View>
  </ScrollView>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 16 },
  title: { color: '#F8FAFC', fontSize: 24, fontWeight: '800' },
  section: { color: '#94A3B8', fontSize: 14, marginTop: 20, marginBottom: 8 },
  mt: { marginTop: 28 },
  offer: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
  },
  offerTitle: { color: '#F8FAFC', fontWeight: '700', fontSize: 16 },
  offerDesc: { color: '#94A3B8', marginTop: 6, fontSize: 13 },
  progressCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
  },
  progressTitle: { color: '#F8FAFC', fontWeight: '600' },
  barBg: {
    height: 8,
    backgroundColor: '#0F172A',
    borderRadius: 4,
    marginTop: 12,
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: '#22C55E', borderRadius: 4 },
  progressMeta: { color: '#94A3B8', fontSize: 12, marginTop: 8 },
});
