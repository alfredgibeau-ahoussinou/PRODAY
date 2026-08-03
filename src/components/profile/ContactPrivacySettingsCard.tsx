import React, { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import type { User } from '../../models/User';
import type { ContactFieldId, ContactVisibilityAudience } from '../../models/ContactPrivacy';
import { DEFAULT_CONTACT_PRIVACY } from '../../models/ContactPrivacy';
import { normalizeContactPrivacy } from '../../utils/contactPrivacyVisibility';
import { profileService } from '../../services/profile.service';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';

const FIELD_LABELS: Record<ContactFieldId, string> = {
  phone: 'Téléphone',
  email: 'E-mail',
  other: 'Autre contact',
};

const AUDIENCE_OPTIONS: { id: ContactVisibilityAudience; label: string }[] = [
  { id: 'nobody', label: 'Personne' },
  { id: 'club_staff', label: 'Staff club' },
  { id: 'agents', label: 'Agents' },
  { id: 'recruiters', label: 'Recruteurs' },
  { id: 'connections', label: 'Connexions' },
  { id: 'everyone', label: 'Tout le monde' },
];

type Props = {
  profile: User;
  onUpdated?: (privacy: User['contact_privacy']) => void;
};

/** Qui peut voir téléphone / e-mail / autre contact. */
export function ContactPrivacySettingsCard({ profile, onUpdated }: Props) {
  const { colors } = useAppTheme();
  const [privacy, setPrivacy] = useState(() =>
    normalizeContactPrivacy(profile.contact_privacy),
  );
  const [saving, setSaving] = useState(false);

  const summary = useMemo(
    () =>
      (Object.keys(FIELD_LABELS) as ContactFieldId[]).map((field) => {
        const audiences = privacy[field];
        const labels = audiences
          .map((a) => AUDIENCE_OPTIONS.find((o) => o.id === a)?.label ?? a)
          .join(', ');
        return `${FIELD_LABELS[field]}: ${labels || '—'}`;
      }),
    [privacy],
  );

  const cycleAudience = useCallback(
    async (field: ContactFieldId) => {
      const current = privacy[field][0] ?? DEFAULT_CONTACT_PRIVACY[field][0];
      const idx = AUDIENCE_OPTIONS.findIndex((o) => o.id === current);
      const next = AUDIENCE_OPTIONS[(idx + 1) % AUDIENCE_OPTIONS.length]!.id;
      const nextPrivacy = { ...privacy, [field]: [next] };
      setPrivacy(nextPrivacy);
      setSaving(true);
      try {
        await profileService.updateProfile(profile.uid, { contact_privacy: nextPrivacy });
        onUpdated?.(nextPrivacy);
      } catch (e) {
        setPrivacy(privacy);
        Alert.alert(
          'Erreur',
          e instanceof Error ? e.message : 'Impossible d’enregistrer la confidentialité.',
        );
      } finally {
        setSaving(false);
      }
    },
    [onUpdated, privacy, profile.uid],
  );

  return (
    <ProDaySurface style={styles.card}>
      <ProDayText variant="section" style={{ color: colors.text }}>
        Confidentialité des contacts
      </ProDayText>
      <ProDayText variant="caption" muted style={styles.sub}>
        Choisissez qui peut voir vos coordonnées. Vous les voyez toujours.
        {saving ? ' · Enregistrement…' : ''}
      </ProDayText>
      {(Object.keys(FIELD_LABELS) as ContactFieldId[]).map((field, i) => (
        <PressableSpring
          key={field}
          onPress={() => void cycleAudience(field)}
          scaleTo={0.98}
          haptic
          style={[
            styles.row,
            { borderColor: colors.border, backgroundColor: colors.surfaceMuted },
          ]}
        >
          <View style={styles.rowCopy}>
            <ProDayText variant="body" style={{ color: colors.text, fontWeight: '600' }}>
              {FIELD_LABELS[field]}
            </ProDayText>
            <ProDayText variant="caption" muted numberOfLines={2}>
              {summary[i]}
            </ProDayText>
          </View>
          <ProDayText variant="caption" accent>
            Modifier
          </ProDayText>
        </PressableSpring>
      ))}
    </ProDaySurface>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm, padding: spacing.md },
  sub: { marginBottom: spacing.xs, lineHeight: 18 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowCopy: { flex: 1, gap: 2 },
});
