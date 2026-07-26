import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { PressableSpring } from '../../components/motion';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { clubsService } from '../../services/clubs.service';
import {
  CLUB_OFFICIAL_CONTACT_KIND_LABELS,
  type ClubOfficialContact,
  type ClubOfficialContactKind,
} from '../../models/ClubOfficialContact';
import { radius, spacing } from '../../theme/designTokens';
import { useThemedScreen } from '../../hooks/useThemedScreen';

type Props = {
  clubId: string;
  canEdit?: boolean;
  onBack: () => void;
};

export const ClubContactsScreen: React.FC<Props> = ({ clubId, canEdit = false, onBack }) => {
  const { colors: c, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createStyles(c), [c]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contacts, setContacts] = useState<ClubOfficialContact[]>([]);
  const [kind, setKind] = useState<ClubOfficialContactKind>('arbitre');
  const [name, setName] = useState('');
  const [roleLabel, setRoleLabel] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const club = await clubsService.getById(clubId);
      setContacts(club?.official_contacts ?? []);
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    void load();
  }, [load]);

  const addContact = async () => {
    if (!name.trim()) {
      Alert.alert('Nom requis', 'Indiquez le nom du contact.');
      return;
    }
    setSaving(true);
    try {
      const next = await clubsService.upsertOfficialContact(clubId, {
        kind,
        name: name.trim(),
        role_label: roleLabel.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
      });
      setContacts(next);
      setName('');
      setRoleLabel('');
      setPhone('');
      setEmail('');
    } catch (error) {
      Alert.alert(
        'Erreur',
        error instanceof Error ? error.message : 'Impossible d’enregistrer le contact.',
      );
    } finally {
      setSaving(false);
    }
  };

  const removeContact = (contactId: string) => {
    Alert.alert('Supprimer ce contact ?', undefined, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              const next = await clubsService.removeOfficialContact(clubId, contactId);
              setContacts(next);
            } catch (error) {
              Alert.alert(
                'Erreur',
                error instanceof Error ? error.message : 'Suppression impossible.',
              );
            }
          })();
        },
      },
    ]);
  };

  return (
    <View style={[styles.root, rootStyle]}>
      <ScreenHeader title="Arbitres & dirigeants" onBack={onBack} centered />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.lead}>
          Gardez sous la main les contacts utiles du club : arbitres et dirigeants.
        </Text>

        {loading ? <ActivityIndicator color={c.accent} style={{ marginTop: 24 }} /> : null}

        {!loading && contacts.length === 0 ? (
          <Text style={styles.empty}>Aucun contact pour l’instant.</Text>
        ) : null}

        {contacts.map((contact) => (
          <View key={contact.id} style={styles.card}>
            <Text style={styles.kind}>
              {CLUB_OFFICIAL_CONTACT_KIND_LABELS[contact.kind]}
              {contact.role_label ? ` · ${contact.role_label}` : ''}
            </Text>
            <Text style={styles.name}>{contact.name}</Text>
            {contact.phone ? (
              <PressableSpring onPress={() => void Linking.openURL(`tel:${contact.phone}`)}>
                <Text style={styles.link}>{contact.phone}</Text>
              </PressableSpring>
            ) : null}
            {contact.email ? (
              <PressableSpring onPress={() => void Linking.openURL(`mailto:${contact.email}`)}>
                <Text style={styles.link}>{contact.email}</Text>
              </PressableSpring>
            ) : null}
            {canEdit ? (
              <PressableSpring style={styles.deleteBtn} onPress={() => removeContact(contact.id)}>
                <Text style={styles.deleteText}>Supprimer</Text>
              </PressableSpring>
            ) : null}
          </View>
        ))}

        {canEdit ? (
          <View style={styles.form}>
            <Text style={styles.formTitle}>Ajouter un contact</Text>
            <View style={styles.kindRow}>
              {(['arbitre', 'dirigeant'] as ClubOfficialContactKind[]).map((k) => (
                <PressableSpring
                  key={k}
                  style={[styles.kindChip, kind === k && styles.kindChipActive]}
                  onPress={() => setKind(k)}
                >
                  <Text style={[styles.kindChipText, kind === k && styles.kindChipTextActive]}>
                    {CLUB_OFFICIAL_CONTACT_KIND_LABELS[k]}
                  </Text>
                </PressableSpring>
              ))}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Nom"
              placeholderTextColor={c.textMuted}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="Fonction (ex. Président, Arbitre central)"
              placeholderTextColor={c.textMuted}
              value={roleLabel}
              onChangeText={setRoleLabel}
            />
            <TextInput
              style={styles.input}
              placeholder="Téléphone"
              placeholderTextColor={c.textMuted}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={c.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <PressableSpring
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={() => void addContact()}
              disabled={saving}
            >
              <Text style={styles.saveText}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Text>
            </PressableSpring>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
};

function createStyles(c: {
  accent: string;
  text: string;
  textMuted: string;
  surface: string;
  border: string;
  background: string;
}) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 },
    lead: { color: c.textMuted, fontSize: 14, lineHeight: 20 },
    empty: { color: c.textMuted, fontSize: 14, marginTop: 8 },
    card: {
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      padding: spacing.md,
      gap: 4,
    },
    kind: {
      color: c.accent,
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    name: { color: c.text, fontSize: 17, fontWeight: '700' },
    link: { color: c.accent, fontSize: 14, fontWeight: '600', marginTop: 2 },
    deleteBtn: { marginTop: 8, alignSelf: 'flex-start' },
    deleteText: { color: '#ef4444', fontSize: 13, fontWeight: '700' },
    form: {
      marginTop: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      padding: spacing.md,
      gap: 10,
    },
    formTitle: { color: c.text, fontSize: 16, fontWeight: '800' },
    kindRow: { flexDirection: 'row', gap: 8 },
    kindChip: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    kindChipActive: {
      backgroundColor: c.accent,
      borderColor: c.accent,
    },
    kindChipText: { color: c.textMuted, fontSize: 13, fontWeight: '700' },
    kindChipTextActive: { color: '#fff' },
    input: {
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: c.text,
      fontSize: 15,
    },
    saveBtn: {
      marginTop: 4,
      borderRadius: 999,
      backgroundColor: c.accent,
      paddingVertical: 12,
      alignItems: 'center',
    },
    saveText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  });
}
