import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { SearchBar } from '../components/ui/SearchBar';
import { colors, spacing, radius, shadows } from '../theme/designTokens';
import { friendlyMatchesService } from '../services/friendlyMatches.service';
import type { FriendlyMatch } from '../models/FriendlyMatch';
import { formatMatchDateTime } from '../utils/matchDisplay';
import { useAuth } from '../context/AuthContext';
import { useTabNavigation } from '../context/TabNavigationContext';
import { useMatchActions } from '../hooks/useMatchActions';
import { messagesService } from '../services/messages.service';
import { clubsService } from '../services/clubs.service';
import { profileService } from '../services/profile.service';
import { ROLES_REQUIRING_VERIFICATION } from '../models/User';

const CHIPS = ['Tous', 'Loisir', 'Compétition', 'Mixte'] as const;

interface SearchMatchScreenProps {
  onBack: () => void;
  onAccepted?: () => void;
}

export const SearchMatchScreen: React.FC<SearchMatchScreenProps> = ({
  onBack,
  onAccepted,
}) => {
  const { profile } = useAuth();
  const { openChat } = useTabNavigation();
  const { acceptMatch, canAccept } = useMatchActions(profile);
  const [chip, setChip] = useState<(typeof CHIPS)[number]>('Tous');
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<FriendlyMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [myClubId, setMyClubId] = useState<string | null>(null);

  useEffect(() => {
    setMyClubId(profile ? profile.profile.club_id ?? profile.uid : null);
  }, [profile]);

  const load = () => {
    setLoading(true);
    friendlyMatchesService
      .listOpenForSearch(chip === 'Tous' ? undefined : chip)
      .then(setMatches)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [chip]);

  const handleContactOrganizer = async (m: FriendlyMatch) => {
    if (!profile) {
      Alert.alert('Connexion requise', 'Connectez-vous depuis l’onglet Profil.');
      return;
    }
    if (
      ROLES_REQUIRING_VERIFICATION.includes(profile.role) &&
      !profileService.canPerformSensitiveAction(profile)
    ) {
      Alert.alert(
        'Vérification requise',
        'Validez votre diplôme ou licence pour contacter d’autres profils.'
      );
      return;
    }
    let organizerUid = m.requester_uid;
    if (!organizerUid) {
      const club = await clubsService.getById(m.requester_club_id);
      organizerUid = club?.owner_uid;
    }
    if (!organizerUid) {
      Alert.alert('Contact indisponible', 'Organisateur introuvable pour ce match.');
      return;
    }
    if (organizerUid === profile.uid) {
      Alert.alert('Information', 'Il s’agit de votre propre proposition.');
      return;
    }
    try {
      const threadId = await messagesService.getOrCreateThread(
        profile.uid,
        profile.display_name,
        organizerUid,
        m.requester_club_name
      );
      openChat(threadId);
    } catch (e) {
      Alert.alert(
        'Erreur',
        e instanceof Error ? e.message : 'Impossible d’ouvrir la conversation.'
      );
    }
  };

  const filtered = matches.filter((m) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      m.requester_club_name.toLowerCase().includes(q) ||
      m.city.toLowerCase().includes(q) ||
      (m.opponent_club_name?.toLowerCase().includes(q) ?? false) ||
      m.level.toLowerCase().includes(q)
    );
  });

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Rechercher un match"
        onBack={onBack}
        rightAction={
          <TouchableOpacity style={styles.filterBtn}>
            <Text style={styles.filterText}>Filtres</Text>
          </TouchableOpacity>
        }
      />
      <SearchBar
        placeholder="Ville, club, niveau…"
        value={query}
        onChangeText={setQuery}
      />

      <ScrollView contentContainerStyle={styles.list}>
        <View style={styles.chips}>
          {CHIPS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, chip === c && styles.chipActive]}
              onPress={() => setChip(c)}
            >
              <Text style={[styles.chipText, chip === c && styles.chipTextActive]}>
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={colors.brand} style={styles.loader} />
        ) : filtered.length === 0 ? (
          <Text style={styles.empty}>Aucun match ouvert pour ces critères.</Text>
        ) : (
          filtered.map((m) => {
            const isMine = myClubId != null && m.requester_club_id === myClubId;
            const showAccept = canAccept(m) && !isMine && profile;
            return (
              <View key={m.id} style={[styles.card, shadows.card]}>
                <View style={styles.logo}>
                  <Text style={styles.logoLetter}>
                    {m.requester_club_name.charAt(0)}
                  </Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.name}>{m.requester_club_name}</Text>
                  <Text style={styles.meta}>
                    {m.city} · {m.level} · {m.level_type}
                  </Text>
                  <Text style={styles.avail}>
                    Disponible le {formatMatchDateTime(m.date, m.time_label)}
                  </Text>
                </View>
                <View style={styles.actions}>
                  {showAccept ? (
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() =>
                        acceptMatch(m, () => {
                          load();
                          onAccepted?.();
                        })
                      }
                    >
                      <Text style={styles.acceptText}>Accepter</Text>
                    </TouchableOpacity>
                  ) : isMine ? (
                    <Text style={styles.mineLabel}>Votre proposition</Text>
                  ) : profile ? (
                    <TouchableOpacity
                      style={styles.contactBtn}
                      onPress={() => handleContactOrganizer(m)}
                    >
                      <Text style={styles.contactText}>Contacter</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  filterBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.brand,
  },
  filterText: { color: colors.brand, fontWeight: '600', fontSize: 13 },
  list: { paddingBottom: spacing.xxl },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: '#FFF' },
  loader: { marginVertical: spacing.xl },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    padding: spacing.xl,
    fontSize: 14,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    flexWrap: 'wrap',
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.brandSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  logoLetter: { fontSize: 20, fontWeight: '800', color: colors.brand },
  info: { flex: 1, minWidth: 120 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  avail: { fontSize: 12, color: colors.brand, marginTop: 4, fontWeight: '600' },
  actions: { marginTop: spacing.sm, gap: spacing.sm },
  acceptBtn: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  acceptText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  contactBtn: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.brand,
  },
  contactText: { color: colors.brand, fontWeight: '700', fontSize: 13 },
  mineLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
});
