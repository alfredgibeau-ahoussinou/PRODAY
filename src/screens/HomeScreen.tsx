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
import { Icon, type IconName } from '../components/ui/Icon';
import { ArenaScreen } from './ArenaScreen';
import { SponsorsScreen } from './SponsorsScreen';
import { useTabNavigation } from '../context/TabNavigationContext';
import { useHomeStats } from '../hooks/useAppData';
import { formatCount } from '../services/stats.service';
import { colors, spacing, radius, shadows, BRAND } from '../theme/designTokens';

type HomeModule = 'home' | 'arena' | 'sponsors';

const MODULES: { title: string; subtitle: string; icon: IconName; action: (h: HomeHandlers) => void }[] = [
  { title: 'Recrutement', subtitle: 'Joueurs & clubs', icon: 'search', action: (h) => h.goRecrutement() },
  { title: 'Matchs', subtitle: 'Amicaux', icon: 'calendar', action: (h) => h.goMatchs() },
  { title: 'Arena', subtitle: 'Tournois', icon: 'trophy', action: (h) => h.goArena() },
  { title: 'Sponsors', subtitle: 'Partenaires', icon: 'star-four-points', action: (h) => h.goSponsors() },
];

interface HomeHandlers {
  goRecrutement: () => void;
  goMatchs: () => void;
  goArena: () => void;
  goSponsors: () => void;
}

export const HomeScreen: React.FC = () => {
  const [module, setModule] = useState<HomeModule>('home');
  const { setActiveTab } = useTabNavigation();
  const { stats, loading } = useHomeStats();

  const handlers: HomeHandlers = {
    goRecrutement: () => setActiveTab('recrutement'),
    goMatchs: () => setActiveTab('matchs'),
    goArena: () => setModule('arena'),
    goSponsors: () => setModule('sponsors'),
  };

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
        <ModuleCard {...MODULES[0]} onPress={() => MODULES[0].action(handlers)} />
        <ModuleCard {...MODULES[1]} onPress={() => MODULES[1].action(handlers)} />
      </View>
      <View style={styles.row}>
        <ModuleCard {...MODULES[2]} onPress={() => MODULES[2].action(handlers)} />
        <ModuleCard {...MODULES[3]} onPress={() => MODULES[3].action(handlers)} />
      </View>

      <Text style={styles.pillars}>Connexion · Progression · Réussite</Text>
    </ScrollView>
  );
};

const ModuleCard: React.FC<{
  title: string;
  subtitle: string;
  icon: IconName;
  onPress: () => void;
}> = ({ title, subtitle, icon, onPress }) => (
  <TouchableOpacity style={[styles.card, shadows.card]} onPress={onPress} activeOpacity={0.85}>
    <View style={styles.iconCircle}>
      <Icon name={icon} size={24} color={colors.brand} />
    </View>
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
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
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
