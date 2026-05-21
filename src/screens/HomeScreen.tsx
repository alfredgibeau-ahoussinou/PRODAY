import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Logo } from '../components/Logo';
import { ArenaScreen } from './ArenaScreen';
import { SponsorsScreen } from './SponsorsScreen';
import { useTabNavigation } from '../context/TabNavigationContext';
import { useHomeStats } from '../hooks/useAppData';
import { formatCount } from '../services/stats.service';
import { colors, spacing, radius, shadows, BRAND } from '../theme/designTokens';
type HomeModule = 'home' | 'arena' | 'sponsors';

export const HomeScreen: React.FC = () => {
  const [module, setModule] = useState<HomeModule>('home');
  const { setActiveTab } = useTabNavigation();
  const { stats, loading } = useHomeStats();

  if (module === 'arena') {
    return <ArenaScreen onBack={() => setModule('home')} />;
  }
  if (module === 'sponsors') {
    return <SponsorsScreen onBack={() => setModule('home')} />;
  }

  const statLine = stats
    ? `${formatCount(stats.players, 'joueur', 'joueurs')} · ${formatCount(stats.clubs, 'club')} · ${formatCount(stats.recruitment_posts_open, 'annonce', 'annonces')}`
    : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Logo variant="wordmark" showTagline />
      <Text style={styles.hero}>
        {BRAND.name}, l&apos;application qui connecte les passionnés de sport.
      </Text>

      {loading ? (
        <ActivityIndicator color={colors.brand} style={styles.loader} />
      ) : statLine ? (
        <Text style={styles.stats}>{statLine}</Text>
      ) : null}

      <View style={styles.row}>
        <ModuleCard
          title="Recrutement"
          subtitle="Joueurs & clubs"
          emoji="🔍"
          onPress={() => setActiveTab('recrutement')}
        />
        <ModuleCard
          title="Matchs"
          subtitle="Amicaux"
          emoji="🤝"
          onPress={() => setActiveTab('matchs')}
        />
      </View>
      <View style={styles.row}>
        <ModuleCard
          title="Arena"
          subtitle="Tournois"
          emoji="🏆"
          onPress={() => setModule('arena')}
        />
        <ModuleCard
          title="Sponsors"
          subtitle="Partenaires"
          emoji="⭐"
          onPress={() => setModule('sponsors')}
        />
      </View>

      <Text style={styles.pillars}>Connexion · Progression · Réussite</Text>
    </ScrollView>
  );
};

const ModuleCard: React.FC<{
  title: string;
  subtitle: string;
  emoji: string;
  onPress: () => void;
}> = ({ title, subtitle, emoji, onPress }) => (
  <TouchableOpacity style={[styles.card, shadows.card]} onPress={onPress} activeOpacity={0.85}>
    <Text style={styles.emoji}>{emoji}</Text>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardSub}>{subtitle}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  hero: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  stats: {
    color: colors.brand,
    fontWeight: '600',
    fontSize: 13,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  loader: { marginBottom: spacing.lg },
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
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  cardSub: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  pillars: {
    textAlign: 'center',
    color: colors.brand,
    fontWeight: '600',
    marginTop: spacing.xl,
    fontSize: 13,
  },
});
