import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { SearchBar } from '../components/ui/SearchBar';
import { PressableSpring, StaggerReveal, InteractiveListItem } from '../components/motion';
import { prodayHaptics } from '../utils/prodayHaptics';
import { spacing, radius, shadows } from '../theme/designTokens';
import { useThemedScreen } from '../hooks/useThemedScreen';
import type { AppColors } from '../theme/universeTheme';
import { friendlyMatchesService } from '../services/friendlyMatches.service';
import type { FriendlyMatch } from '../models/FriendlyMatch';
import { formatMatchDateTime } from '../utils/matchDisplay';
import { useAuth } from '../context/AuthContext';
import { useTabNavigation } from '../context/TabNavigationContext';
import { useMatchActions } from '../hooks/useMatchActions';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { messagesService } from '../services/messages.service';
import { clubsService } from '../services/clubs.service';
import { usersService } from '../services/users.service';
import { openContactConversation } from '../utils/openContactConversation';
import { suggestFieldSlots } from '../features/v3/engines/playtomicFields.engine';

const CHIPS = ['Tous', 'Loisir', 'Compétition', 'Mixte'] as const;
type SortMode = 'date' | 'city' | 'club';

interface SearchMatchScreenProps {
  onBack: () => void;
  onAccepted?: () => void;
}

export const SearchMatchScreen: React.FC<SearchMatchScreenProps> = ({
  onBack,
  onAccepted,
}) => {
  const { profile } = useAuth();
  const { requireAuth } = useRequireAuth();
  const { colors: c, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createStyles(c), [c]);
  const { openChat } = useTabNavigation();
  const { acceptMatch, canAccept } = useMatchActions(profile);
  const [chip, setChip] = useState<(typeof CHIPS)[number]>('Tous');
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<FriendlyMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [myClubId, setMyClubId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [cityFilter, setCityFilter] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('date');
  const [onlyWithOpponent, setOnlyWithOpponent] = useState(false);

  const fieldSlots = useMemo(
    () =>
      suggestFieldSlots({ userLocation: profile?.location, city: profile?.city, limit: 3 }),
    [profile?.location, profile?.city]
  );

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
    if (!requireAuth('Connectez-vous pour contacter l’organisateur.') || !profile) return;
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
    const organizer = await usersService.getPublicById(organizerUid);
    if (!organizer) {
      Alert.alert('Contact indisponible', 'Profil organisateur introuvable.');
      return;
    }
    await openContactConversation(
      profile,
      organizer,
      m.requester_club_name,
      openChat
    );
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const city = cityFilter.trim().toLowerCase();
    let list = matches.filter((m) => {
      if (q) {
        const hit =
          m.requester_club_name.toLowerCase().includes(q) ||
          m.city.toLowerCase().includes(q) ||
          (m.opponent_club_name?.toLowerCase().includes(q) ?? false) ||
          m.level.toLowerCase().includes(q);
        if (!hit) return false;
      }
      if (city && !m.city.toLowerCase().includes(city)) return false;
      if (onlyWithOpponent && !m.opponent_club_name?.trim()) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sortMode === 'city') return a.city.localeCompare(b.city, 'fr');
      if (sortMode === 'club') return a.requester_club_name.localeCompare(b.requester_club_name, 'fr');
      return a.date.getTime() - b.date.getTime();
    });
    return list;
  }, [matches, query, cityFilter, onlyWithOpponent, sortMode]);

  return (
    <View style={[styles.root, rootStyle]}>
      <ScreenHeader
        title="Rechercher un match"
        onBack={onBack}
        rightAction={
          <PressableSpring
            style={styles.filterBtn}
            scaleTo={0.96}
            haptic
            onPress={() => setFiltersOpen(true)}
          >
            <Text style={styles.filterText}>Filtres</Text>
          </PressableSpring>
        }
      />
      <SearchBar
        placeholder="Ville, club, niveau…"
        value={query}
        onChangeText={setQuery}
      />

      {fieldSlots.length > 0 ? (
        <View style={styles.fieldsBlock}>
          <Text style={styles.fieldsTitle}>Terrains à proximité</Text>
          {fieldSlots.map((f) => (
            <View key={f.id} style={[styles.fieldCard, { borderColor: c.border, backgroundColor: c.surface }]}>
              <Text style={styles.fieldName}>{f.name}</Text>
              <Text style={styles.fieldMeta}>
                {f.city} · {f.surface}
                {f.distanceKm != null ? ` · ${f.distanceKm.toFixed(1)} km` : ''}
              </Text>
              <Text style={styles.fieldSlot}>Créneau : {f.nextSlotLabel}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={[styles.fieldsBlock, styles.fieldsEmpty, { borderColor: c.border, backgroundColor: c.surface }]}>
          <Text style={styles.fieldsTitle}>Réservation de terrains</Text>
          <Text style={styles.fieldsEmptyText}>Bientôt disponible — créneaux Playtomic en préparation.</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.list}>
        <View style={styles.chips}>
          {CHIPS.map((chipId, index) => (
            <StaggerReveal key={chipId} index={index} delayStep={35}>
              <PressableSpring
                style={[styles.chip, chip === chipId && styles.chipActive]}
                onPress={() => {
                  prodayHaptics.tabSwitch();
                  setChip(chipId);
                }}
                scaleTo={0.94}
                haptic
              >
                <Text style={[styles.chipText, chip === chipId && styles.chipTextActive]}>
                  {chipId}
                </Text>
              </PressableSpring>
            </StaggerReveal>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={c.brand} style={styles.loader} />
        ) : filtered.length === 0 ? (
          <Text style={styles.empty}>Aucun match ouvert pour ces critères.</Text>
        ) : (
          filtered.map((m, index) => {
            const isMine = myClubId != null && m.requester_club_id === myClubId;
            const showAccept = canAccept(m) && !isMine && profile;
            return (
              <InteractiveListItem key={m.id} index={index}>
                <View style={[styles.card, shadows.card]}>
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
                      <PressableSpring
                        style={styles.acceptBtn}
                        onPress={() =>
                          acceptMatch(m, () => {
                            load();
                            onAccepted?.();
                          })
                        }
                        scaleTo={0.96}
                        haptic
                      >
                        <Text style={styles.acceptText}>Accepter</Text>
                      </PressableSpring>
                    ) : isMine ? (
                      <Text style={styles.mineLabel}>Votre proposition</Text>
                    ) : (
                      <PressableSpring
                        style={styles.contactBtn}
                        onPress={() => handleContactOrganizer(m)}
                        scaleTo={0.96}
                        haptic
                      >
                        <Text style={styles.contactText}>
                          {profile ? 'Contacter' : 'Se connecter'}
                        </Text>
                      </PressableSpring>
                    )}
                  </View>
                </View>
              </InteractiveListItem>
            );
          })
        )}
      </ScrollView>

      <Modal visible={filtersOpen} transparent animationType="fade" onRequestClose={() => setFiltersOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setFiltersOpen(false)}>
          <View style={[styles.modalCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.modalTitle, { color: c.text }]}>Filtres avancés</Text>
            <Text style={[styles.modalLabel, { color: c.textSecondary }]}>Ville</Text>
            <TextInput
              style={[styles.modalInput, { borderColor: c.border, color: c.text }]}
              placeholder="Filtrer par ville…"
              placeholderTextColor={c.textMuted}
              value={cityFilter}
              onChangeText={setCityFilter}
            />
            <Text style={[styles.modalLabel, { color: c.textSecondary }]}>Tri</Text>
            <View style={styles.modalChips}>
              {(
                [
                  { id: 'date' as const, label: 'Date' },
                  { id: 'city' as const, label: 'Ville' },
                  { id: 'club' as const, label: 'Club' },
                ] as const
              ).map((opt) => (
                <PressableSpring
                  key={opt.id}
                  style={[styles.chip, sortMode === opt.id && styles.chipActive]}
                  onPress={() => setSortMode(opt.id)}
                  scaleTo={0.94}
                  haptic
                >
                  <Text style={[styles.chipText, sortMode === opt.id && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </PressableSpring>
              ))}
            </View>
            <PressableSpring
              style={[styles.toggleRow, onlyWithOpponent && styles.chipActive]}
              onPress={() => setOnlyWithOpponent((v) => !v)}
              scaleTo={0.98}
              haptic
            >
              <Text style={[styles.chipText, onlyWithOpponent && styles.chipTextActive]}>
                Adversaire déjà renseigné
              </Text>
            </PressableSpring>
            <PressableSpring
              style={[styles.applyBtn, { backgroundColor: c.brand }]}
              onPress={() => setFiltersOpen(false)}
              scaleTo={0.96}
              haptic
            >
              <Text style={styles.applyText}>Appliquer</Text>
            </PressableSpring>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
  root: { flex: 1 },
  filterBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: c.brand,
  },
  filterText: { color: c.brand, fontWeight: '600', fontSize: 13 },
  list: { paddingBottom: spacing.xxl },
  fieldsBlock: { paddingHorizontal: spacing.lg, marginBottom: spacing.md, gap: spacing.sm },
  fieldsTitle: { fontSize: 12, fontWeight: '800', color: c.textMuted, textTransform: 'uppercase' },
  fieldsEmpty: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  fieldsEmptyText: { fontSize: 13, color: c.textSecondary, lineHeight: 18 },
  fieldCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: 2,
  },
  fieldName: { fontSize: 14, fontWeight: '700', color: c.text },
  fieldMeta: { fontSize: 12, color: c.textSecondary },
  fieldSlot: { fontSize: 12, fontWeight: '700', color: c.brand, marginTop: 2 },
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
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
  },
  chipActive: { backgroundColor: c.brand, borderColor: c.brand },
  chipText: { fontSize: 12, fontWeight: '600', color: c.textSecondary },
  chipTextActive: { color: '#FFF' },
  loader: { marginVertical: spacing.xl },
  empty: {
    textAlign: 'center',
    color: c.textMuted,
    padding: spacing.xl,
    fontSize: 14,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: c.border,
    flexWrap: 'wrap',
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: c.brandSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  logoLetter: { fontSize: 20, fontWeight: '800', color: c.brand },
  info: { flex: 1, minWidth: 120 },
  name: { fontSize: 16, fontWeight: '700', color: c.text },
  meta: { fontSize: 13, color: c.textSecondary, marginTop: 2 },
  avail: { fontSize: 12, color: c.brand, marginTop: 4, fontWeight: '600' },
  actions: { marginTop: spacing.sm, gap: spacing.sm },
  acceptBtn: {
    backgroundColor: c.brand,
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
    borderColor: c.brand,
  },
  contactText: { color: c.brand, fontWeight: '700', fontSize: 13 },
  mineLabel: {
    color: c.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  modalCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  modalTitle: { fontSize: 18, fontWeight: '900', marginBottom: spacing.xs },
  modalLabel: { fontSize: 12, fontWeight: '700' },
  modalInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
  },
  modalChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  toggleRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    alignSelf: 'flex-start',
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  resetBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  applyBtn: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  applyText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  });
}
