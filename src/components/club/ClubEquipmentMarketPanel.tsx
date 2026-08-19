import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { clubEquipmentService } from '../../services/clubEquipment.service';
import {
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_CONDITIONS,
  MARKETPLACE_PAYMENT_NOTICE,
  filterEquipmentListings,
  resolveMarketplaceContactPolicy,
  type ClubEquipmentListing,
  type EquipmentCategory,
  type EquipmentCondition,
  type EquipmentListingFilter,
  type EquipmentListingKind,
} from '../../models/ClubEquipmentListing';
import type { User } from '../../models/User';
import { useAppTheme } from '../../context/ProductLineContext';
import { radius, spacing } from '../../theme/designTokens';
import { isMinorUser } from '../../utils/minor';

const KINDS: { id: EquipmentListingKind; label: string }[] = [
  { id: 'sell', label: 'Vendre' },
  { id: 'give', label: 'Donner' },
  { id: 'wanted', label: 'Rechercher' },
];

export const ClubEquipmentMarketPanel: React.FC<{ clubId: string; profile: User }> = ({
  clubId,
  profile,
}) => {
  const { colors } = useAppTheme();
  const [listings, setListings] = useState<ClubEquipmentListing[]>([]);
  const [kind, setKind] = useState<EquipmentListingKind>('sell');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [size, setSize] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<EquipmentCategory>('autre');
  const [condition, setCondition] = useState<EquipmentCondition>('good');

  const [filter, setFilter] = useState<EquipmentListingFilter>({});
  const [showFilters, setShowFilters] = useState(false);

  const authorIsMinor = isMinorUser(profile);

  const load = useCallback(async () => {
    setListings(await clubEquipmentService.listForClub(clubId));
  }, [clubId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () => filterEquipmentListings(listings, filter),
    [listings, filter],
  );

  const publish = async () => {
    if (!title.trim()) {
      Alert.alert('Titre requis');
      return;
    }
    if (authorIsMinor) {
      Alert.alert(
        'Mineur',
        "Les échanges doivent être gérés par un parent/tuteur. L'annonce sera créée ; le contact direct adulte→mineur reste bloqué.",
      );
    }
    try {
      const row = await clubEquipmentService.create({
        club_id: clubId,
        author_uid: profile.uid,
        author_is_minor: authorIsMinor,
        guardian_uid: null,
        kind,
        title: title.trim(),
        description: description.trim() || '—',
        category,
        size: size.trim() || undefined,
        condition,
        price_cents: kind === 'give' ? null : Math.round((parseFloat(price) || 0) * 100) || null,
        publish: true,
      });
      setTitle('');
      setDescription('');
      setPrice('');
      setSize('');
      setListings((prev) => [row, ...prev]);
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Publication impossible');
    }
  };

  const contact = (listing: ClubEquipmentListing) => {
    const policy = resolveMarketplaceContactPolicy({
      listingAuthorUid: listing.author_uid,
      listingAuthorIsMinor: listing.author_is_minor,
      guardianUid: listing.guardian_uid,
      viewerUid: profile.uid,
      viewerIsMinor: authorIsMinor,
      viewerIsClubStaff: profile.role === 'club' || profile.role === 'coach',
    });
    Alert.alert(
      policy.allowDirectContact ? 'Contact autorisé' : 'Contact restreint',
      policy.reason,
    );
  };

  const markSold = (listing: ClubEquipmentListing) => {
    const action = listing.kind === 'give' ? 'donné' : 'vendu';
    Alert.alert(
      `Marquer comme ${action} ?`,
      "L'annonce sera retirée de la marketplace.",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              if (listing.kind === 'give') {
                await clubEquipmentService.markAsGiven(listing.id);
              } else {
                await clubEquipmentService.markAsSold(listing.id);
              }
              await load();
            } catch (e) {
              Alert.alert('Erreur', e instanceof Error ? e.message : 'Action impossible');
            }
          },
        },
      ],
    );
  };

  const statusLabel = (s: ClubEquipmentListing['status']) => {
    switch (s) {
      case 'sold': return 'Vendu';
      case 'given': return 'Donné';
      case 'draft': return 'Brouillon';
      case 'removed': return 'Retiré';
      case 'reported': return 'Signalé';
      default: return '';
    }
  };

  const chipStyle = (active: boolean) => [
    styles.chip,
    {
      borderColor: active ? colors.accent : colors.border,
      backgroundColor: active ? colors.accentSoft : colors.surfaceMuted,
    },
  ];

  return (
    <View style={styles.wrap}>
      <ProDayText variant="section">Marketplace Équipements</ProDayText>
      <ProDayText variant="caption" muted>
        Membres du club uniquement. Signalement & modération inclus.
      </ProDayText>

      {/* Type d'annonce */}
      <View style={styles.row}>
        {KINDS.map((k) => (
          <PressableSpring key={k.id} onPress={() => setKind(k.id)} scaleTo={0.96} style={chipStyle(kind === k.id)}>
            <ProDayText variant="caption" accent={kind === k.id}>{k.label}</ProDayText>
          </PressableSpring>
        ))}
      </View>

      {/* Formulaire de création */}
      <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
        <TextInput
          placeholder="Titre (ex. Crampons Nike 40)"
          value={title}
          onChangeText={setTitle}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { borderColor: colors.border, color: colors.ink }]}
        />
        <TextInput
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { borderColor: colors.border, color: colors.ink }]}
        />

        {/* Catégorie */}
        <ProDayText variant="caption" muted>Catégorie</ProDayText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollRow}>
          <View style={styles.row}>
            {EQUIPMENT_CATEGORIES.map((c) => (
              <PressableSpring key={c.id} onPress={() => setCategory(c.id)} scaleTo={0.96} style={chipStyle(category === c.id)}>
                <ProDayText variant="caption" accent={category === c.id}>{c.label}</ProDayText>
              </PressableSpring>
            ))}
          </View>
        </ScrollView>

        {/* État */}
        <ProDayText variant="caption" muted>État</ProDayText>
        <View style={styles.row}>
          {EQUIPMENT_CONDITIONS.map((c) => (
            <PressableSpring key={c.id} onPress={() => setCondition(c.id)} scaleTo={0.96} style={chipStyle(condition === c.id)}>
              <ProDayText variant="caption" accent={condition === c.id}>{c.label}</ProDayText>
            </PressableSpring>
          ))}
        </View>

        <TextInput
          placeholder="Taille"
          value={size}
          onChangeText={setSize}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { borderColor: colors.border, color: colors.ink }]}
        />
        {kind !== 'give' ? (
          <TextInput
            placeholder="Prix € (vide = à discuter)"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { borderColor: colors.border, color: colors.ink }]}
          />
        ) : null}
        <PressableSpring onPress={() => void publish()} scaleTo={0.96} haptic>
          <ProDayText variant="caption" accent style={styles.link}>
            Publier (club)
          </ProDayText>
        </PressableSpring>
      </ProDaySurface>

      {/* Filtres */}
      <PressableSpring onPress={() => setShowFilters((v) => !v)} scaleTo={0.96}>
        <ProDayText variant="caption" accent>
          {showFilters ? 'Masquer les filtres' : 'Filtrer les annonces'}
        </ProDayText>
      </PressableSpring>

      {showFilters ? (
        <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
          <ProDayText variant="caption" muted>Catégorie</ProDayText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollRow}>
            <View style={styles.row}>
              <PressableSpring
                onPress={() => setFilter((f) => ({ ...f, category: undefined }))}
                scaleTo={0.96}
                style={chipStyle(!filter.category)}
              >
                <ProDayText variant="caption" accent={!filter.category}>Toutes</ProDayText>
              </PressableSpring>
              {EQUIPMENT_CATEGORIES.map((c) => (
                <PressableSpring
                  key={c.id}
                  onPress={() => setFilter((f) => ({ ...f, category: c.id }))}
                  scaleTo={0.96}
                  style={chipStyle(filter.category === c.id)}
                >
                  <ProDayText variant="caption" accent={filter.category === c.id}>{c.label}</ProDayText>
                </PressableSpring>
              ))}
            </View>
          </ScrollView>

          <ProDayText variant="caption" muted>État</ProDayText>
          <View style={styles.row}>
            <PressableSpring
              onPress={() => setFilter((f) => ({ ...f, condition: undefined }))}
              scaleTo={0.96}
              style={chipStyle(!filter.condition)}
            >
              <ProDayText variant="caption" accent={!filter.condition}>Tous</ProDayText>
            </PressableSpring>
            {EQUIPMENT_CONDITIONS.map((c) => (
              <PressableSpring
                key={c.id}
                onPress={() => setFilter((f) => ({ ...f, condition: c.id }))}
                scaleTo={0.96}
                style={chipStyle(filter.condition === c.id)}
              >
                <ProDayText variant="caption" accent={filter.condition === c.id}>{c.label}</ProDayText>
              </PressableSpring>
            ))}
          </View>
        </ProDaySurface>
      ) : null}

      <ProDayText variant="caption" muted>
        {MARKETPLACE_PAYMENT_NOTICE}
      </ProDayText>

      {/* Liste des annonces */}
      {filtered.map((l) => {
        const isMine = l.author_uid === profile.uid;
        const isClosed = l.status === 'sold' || l.status === 'given' || l.status === 'removed' || l.status === 'reported';
        const catLabel = EQUIPMENT_CATEGORIES.find((c) => c.id === l.category)?.label ?? l.category;
        const condLabel = EQUIPMENT_CONDITIONS.find((c) => c.id === l.condition)?.label ?? l.condition;

        return (
          <ProDaySurface key={l.id} variant="module" style={[styles.card, { borderColor: colors.border }]}>
            {isClosed ? (
              <View style={[styles.statusBadge, { backgroundColor: colors.accentSoft }]}>
                <ProDayText variant="caption" accent>{statusLabel(l.status)}</ProDayText>
              </View>
            ) : null}
            <ProDayText variant="caption" style={{ fontWeight: '800' }}>
              {l.title}
            </ProDayText>
            <ProDayText variant="caption" muted>
              {KINDS.find((k) => k.id === l.kind)?.label} · {catLabel} · {condLabel} · {l.size ?? 'taille —'} ·{' '}
              {l.price_cents == null ? 'Gratuit / à discuter' : `${(l.price_cents / 100).toFixed(0)} €`}
            </ProDayText>
            <ProDayText variant="caption" muted numberOfLines={2}>
              {l.description}
            </ProDayText>
            {!isClosed ? (
              <View style={styles.row}>
                {!isMine ? (
                  <PressableSpring onPress={() => contact(l)} scaleTo={0.96} haptic>
                    <ProDayText variant="caption" accent>Contacter</ProDayText>
                  </PressableSpring>
                ) : null}
                {isMine ? (
                  <PressableSpring onPress={() => markSold(l)} scaleTo={0.96} haptic>
                    <ProDayText variant="caption" accent>
                      {l.kind === 'give' ? 'Marquer donné' : 'Marquer vendu'}
                    </ProDayText>
                  </PressableSpring>
                ) : null}
                {isMine ? (
                  <PressableSpring
                    onPress={() => void clubEquipmentService.remove(l.id).then(load)}
                    scaleTo={0.96}
                  >
                    <ProDayText variant="caption" muted>Retirer</ProDayText>
                  </PressableSpring>
                ) : null}
                <PressableSpring
                  onPress={() => void clubEquipmentService.report(l.id).then(load)}
                  scaleTo={0.96}
                >
                  <ProDayText variant="caption" muted>Signaler</ProDayText>
                </PressableSpring>
                {profile.role === 'club' && l.status === 'draft' ? (
                  <PressableSpring
                    onPress={() => void clubEquipmentService.validateByClub(l.id).then(load)}
                    scaleTo={0.96}
                  >
                    <ProDayText variant="caption" accent>Valider club</ProDayText>
                  </PressableSpring>
                ) : null}
              </View>
            ) : null}
          </ProDaySurface>
        );
      })}

      {filtered.length === 0 ? (
        <ProDayText variant="caption" muted>Aucune annonce pour ces filtres.</ProDayText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: 4 },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: 4 },
  scrollRow: { marginTop: 4 },
  chip: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  link: { fontWeight: '800' },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
});
