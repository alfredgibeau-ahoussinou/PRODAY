import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { TournamentCard } from '../components/TournamentCard';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { Icon } from '../components/ui/Icon';
import { useArenaData } from '../hooks/useAppData';
import { useAuth } from '../context/AuthContext';
import { tournamentService } from '../services/tournament.service';
import { CreateTournamentScreen } from './CreateTournamentScreen';
import type { Tournament } from '../models/Tournament';
import { colors, spacing, radius, shadows } from '../theme/designTokens';

interface ArenaScreenProps {
  onBack?: () => void;
}

type ArenaView = 'list' | 'create';

export const ArenaScreen: React.FC<ArenaScreenProps> = ({ onBack }) => {
  const { profile } = useAuth();
  const [view, setView] = useState<ArenaView>('list');
  const { tournaments, honorTournament, loading, refresh } = useArenaData();
  const awards = honorTournament?.awards_names;

  const handleRegister = async (t: Tournament) => {
    if (!profile) {
      Alert.alert('Connexion requise', 'Connectez-vous depuis l’onglet Profil.');
      return;
    }
    const clubUid = profile.profile.club_id ?? profile.uid;
    if (t.subscriber_uids?.includes(clubUid)) {
      Alert.alert('Déjà inscrit', 'Votre club est déjà inscrit à ce tournoi.');
      return;
    }
    try {
      await tournamentService.registerClub(t.id, clubUid);
      Alert.alert('Inscription enregistrée', `Vous êtes inscrit à ${t.name}.`);
      refresh();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Inscription impossible.');
    }
  };

  if (view === 'create' && profile) {
    return (
      <CreateTournamentScreen
        profile={profile}
        onBack={() => setView('list')}
        onCreated={refresh}
      />
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {onBack ? (
          <ScreenHeader title="Arena" subtitle="Tournois & tableau d'honneur" onBack={onBack} />
        ) : (
          <ScreenHeader
            title="Arena"
            subtitle="Tournois & tableau d'honneur"
            showBrandLogo
          />
        )}

        <Text style={styles.section}>Tournois proches</Text>
        {loading ? (
          <ActivityIndicator color={colors.brand} style={styles.loader} />
        ) : tournaments.length === 0 ? (
          <Text style={styles.hint}>
            Aucun tournoi pour le moment. Créez le premier avec le bouton ci-dessous.
          </Text>
        ) : (
          tournaments.map((t) => (
            <TournamentCard
              key={t.id}
              tournament={t}
              onRegister={t.status === 'OPEN' ? handleRegister : undefined}
            />
          ))
        )}

        <Text style={[styles.section, styles.mt]}>Tableau d&apos;honneur</Text>
        <View style={styles.honor}>
          <HonorSlot label="Meilleur joueur" name={awards?.best_player ?? '—'} />
          <HonorSlot label="Buteur" name={awards?.top_scorer ?? '—'} />
          <HonorSlot label="Gardien" name={awards?.best_goalkeeper ?? '—'} />
        </View>
        {!loading && !honorTournament && (
          <Text style={styles.hintSmall}>Publié après clôture d&apos;un tournoi.</Text>
        )}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {profile && (
        <TouchableOpacity
          style={[styles.fab, shadows.fab]}
          onPress={() => setView('create')}
        >
          <Icon name="add" size={20} color="#FFFFFF" />
          <Text style={styles.fabText}>Créer un tournoi</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const HonorSlot: React.FC<{ label: string; name: string }> = ({ label, name }) => (
  <View style={styles.honorItem}>
    <Text style={styles.honorLabel}>{label}</Text>
    <Text style={styles.honorName}>{name}</Text>
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.md },
  section: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  mt: { marginTop: spacing.xl },
  hint: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
  hintSmall: { color: colors.textMuted, fontSize: 12, marginTop: spacing.sm },
  loader: { marginVertical: spacing.lg },
  honor: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  honorItem: {
    flex: 1,
    minWidth: 100,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  honorLabel: { color: colors.textMuted, fontSize: 11 },
  honorName: { color: colors.text, fontSize: 16, fontWeight: '700', marginTop: 4 },
  bottomSpacer: { height: 88 },
  fab: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.md,
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  fabText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});
