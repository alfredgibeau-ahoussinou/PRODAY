import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Logo } from '../components/Logo';
import { colors, spacing, radius, shadows, BRAND } from '../theme/designTokens';

/**
 * Accueil — hub ProDay (aligné maquette : cartes rapides vers modules)
 */
export const HomeScreen: React.FC = () => (
  <ScrollView style={styles.container} contentContainerStyle={styles.content}>
    <Logo variant="wordmark" showTagline />
    <Text style={styles.hero}>
      {BRAND.name}, l&apos;application qui connecte les passionnés de sport.
    </Text>

    <View style={styles.row}>
      <QuickCard title="Recrutement" subtitle="Joueurs & clubs" emoji="👤" />
      <QuickCard title="Matchs" subtitle="Amicaux" emoji="🤝" />
    </View>
    <View style={styles.row}>
      <QuickCard title="Arena" subtitle="Tournois" emoji="🏆" />
      <QuickCard title="Sponsors" subtitle="Partenaires" emoji="🤝" />
    </View>

    <Text style={styles.pillars}>Connexion · Progression · Réussite</Text>
  </ScrollView>
);

const QuickCard: React.FC<{
  title: string;
  subtitle: string;
  emoji: string;
}> = ({ title, subtitle, emoji }) => (
  <View style={[styles.card, shadows.card]}>
    <Text style={styles.emoji}>{emoji}</Text>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardSub}>{subtitle}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  hero: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  row: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emoji: { fontSize: 28, marginBottom: spacing.sm },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  cardSub: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  pillars: {
    textAlign: 'center',
    color: colors.bluePrimary,
    fontWeight: '600',
    marginTop: spacing.xl,
    fontSize: 13,
  },
});
