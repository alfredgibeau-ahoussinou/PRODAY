import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { clubEquipmentService } from '../../services/clubEquipment.service';
import {
  MARKETPLACE_PAYMENT_NOTICE,
  resolveMarketplaceContactPolicy,
  type ClubEquipmentListing,
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

  const authorIsMinor = isMinorUser(profile);

  const load = useCallback(async () => {
    setListings(await clubEquipmentService.listForClub(clubId));
  }, [clubId]);

  useEffect(() => {
    void load();
  }, [load]);

  const publish = async () => {
    if (!title.trim()) {
      Alert.alert('Titre requis');
      return;
    }
    if (authorIsMinor) {
      Alert.alert(
        'Mineur',
        'Les échanges doivent être gérés par un parent/tuteur. L’annonce sera créée ; le contact direct adulte→mineur reste bloqué.',
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
        category: 'équipement',
        size: size.trim() || undefined,
        condition: 'good',
        price_cents: kind === 'give' ? null : Math.round((parseFloat(price) || 0) * 100) || null,
        publish: true,
      });
      setTitle('');
      setDescription('');
      setPrice('');
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

  return (
    <View style={styles.wrap}>
      <ProDayText variant="section">Equipment Market</ProDayText>
      <ProDayText variant="caption" muted>
        Membres du club uniquement. Signalement & modération inclus.
      </ProDayText>
      <ProDayText variant="caption" muted>
        {MARKETPLACE_PAYMENT_NOTICE}
      </ProDayText>

      <View style={styles.row}>
        {KINDS.map((k) => (
          <PressableSpring
            key={k.id}
            onPress={() => setKind(k.id)}
            scaleTo={0.96}
            style={[
              styles.chip,
              {
                borderColor: kind === k.id ? colors.accent : colors.border,
                backgroundColor: kind === k.id ? colors.accentSoft : colors.surfaceMuted,
              },
            ]}
          >
            <ProDayText variant="caption" accent={kind === k.id}>
              {k.label}
            </ProDayText>
          </PressableSpring>
        ))}
      </View>

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

      {listings.map((l) => (
        <ProDaySurface key={l.id} variant="module" style={[styles.card, { borderColor: colors.border }]}>
          <ProDayText variant="caption" style={{ fontWeight: '800' }}>
            {l.title}
          </ProDayText>
          <ProDayText variant="caption" muted>
            {KINDS.find((k) => k.id === l.kind)?.label} · {l.size ?? 'taille —'} ·{' '}
            {l.price_cents == null ? 'Gratuit / à discuter' : `${(l.price_cents / 100).toFixed(0)} €`}
          </ProDayText>
          <ProDayText variant="caption" muted numberOfLines={2}>
            {l.description}
          </ProDayText>
          <View style={styles.row}>
            <PressableSpring onPress={() => contact(l)} scaleTo={0.96} haptic>
              <ProDayText variant="caption" accent>
                Contacter
              </ProDayText>
            </PressableSpring>
            <PressableSpring
              onPress={() => void clubEquipmentService.report(l.id).then(load)}
              scaleTo={0.96}
            >
              <ProDayText variant="caption" muted>
                Signaler
              </ProDayText>
            </PressableSpring>
            {profile.role === 'club' ? (
              <PressableSpring
                onPress={() => void clubEquipmentService.validateByClub(l.id).then(load)}
                scaleTo={0.96}
              >
                <ProDayText variant="caption" accent>
                  Valider club
                </ProDayText>
              </PressableSpring>
            ) : null}
          </View>
        </ProDaySurface>
      ))}
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
  chip: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  link: { fontWeight: '800' },
});
