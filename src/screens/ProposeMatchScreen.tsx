import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { Icon, type IconName } from '../components/ui/Icon';
import { colors, spacing, radius, shadows } from '../theme/designTokens';
import { friendlyMatchesService } from '../services/friendlyMatches.service';
import { useAuth } from '../context/AuthContext';

const LEVELS = ['Loisir', 'Compétition', 'Mixte'] as const;
const LEVEL_MAP: Record<(typeof LEVELS)[number], 'loisir' | 'competition' | 'mixte'> = {
  Loisir: 'loisir',
  Compétition: 'competition',
  Mixte: 'mixte',
};

interface ProposeMatchScreenProps {
  onBack: () => void;
  onCreated?: () => void;
}

export const ProposeMatchScreen: React.FC<ProposeMatchScreenProps> = ({
  onBack,
  onCreated,
}) => {
  const [level, setLevel] = useState<(typeof LEVELS)[number]>('Loisir');
  const { profile } = useAuth();
  const [clubName, setClubName] = useState(profile?.display_name ?? '');
  const [opponent, setOpponent] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('14:00');
  const [city, setCity] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!clubName.trim() || !city.trim()) {
      Alert.alert('Champs requis', 'Indiquez votre club et la ville.');
      return;
    }
    const parsed = parseFrenchDate(dateStr);
    if (!parsed) {
      Alert.alert('Date invalide', 'Utilisez le format jj/mm/aaaa.');
      return;
    }

    if (!profile) {
      Alert.alert('Connexion requise', 'Connectez-vous depuis l’onglet Profil.');
      return;
    }

    setSubmitting(true);
    try {
      await friendlyMatchesService.create({
        requester_club_id: profile.profile.club_id ?? profile.uid,
        requester_club_name: clubName.trim(),
        opponent_club_name: opponent.trim() || undefined,
        city: city.trim(),
        date: parsed,
        time_label: timeStr.trim() || '14:00',
        category: 'Seniors',
        level: 'Amical',
        level_type: LEVEL_MAP[level],
        message: message.trim() || undefined,
      });
      Alert.alert('Demande envoyée', 'Votre match a été publié sur Firestore.');
      onCreated?.();
    } catch (e) {
      Alert.alert(
        'Erreur',
        e instanceof Error ? e.message : 'Impossible de créer le match. Connectez-vous.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="Proposer un match" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.form}>
        <Field label="Votre club" value={clubName} onChangeText={setClubName} />
        <Field
          label="Adversaire"
          placeholder="Nom du club (optionnel)"
          value={opponent}
          onChangeText={setOpponent}
        />
        <Field
          label="Date souhaitée"
          placeholder="jj/mm/aaaa"
          value={dateStr}
          onChangeText={setDateStr}
          icon="calendar"
        />
        <Field
          label="Heure"
          placeholder="14:00"
          value={timeStr}
          onChangeText={setTimeStr}
          icon="time"
        />
        <Field
          label="Lieu / ville"
          placeholder="Stade, ville…"
          value={city}
          onChangeText={setCity}
          icon="location"
        />

        <Text style={styles.label}>Niveau souhaité</Text>
        <View style={styles.segment}>
          {LEVELS.map((l) => (
            <TouchableOpacity
              key={l}
              style={[styles.segBtn, level === l && styles.segBtnActive]}
              onPress={() => setLevel(l)}
            >
              <Text style={[styles.segText, level === l && styles.segTextActive]}>
                {l}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Message (optionnel)</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Infos complémentaires…"
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={4}
          value={message}
          onChangeText={setMessage}
        />
      </ScrollView>

      <TouchableOpacity
        style={[styles.submit, shadows.fab, submitting && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.submitText}>Envoyer la demande</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

function parseFrenchDate(input: string): Date | null {
  const m = input.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]) - 1;
  const year = Number(m[3]);
  const d = new Date(year, month, day);
  if (d.getFullYear() !== year || d.getMonth() !== month || d.getDate() !== day) {
    return null;
  }
  return d;
}

const Field: React.FC<{
  label: string;
  value?: string;
  placeholder?: string;
  icon?: IconName;
  onChangeText?: (t: string) => void;
}> = ({ label, value, placeholder, icon, onChangeText }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.fieldInput}>
      <TextInput
        style={styles.input}
        value={value}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        onChangeText={onChangeText}
      />
      {icon ? <Icon name={icon} size={18} color={colors.textMuted} /> : null}
    </View>
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  form: { padding: spacing.lg, paddingBottom: 100 },
  field: { marginBottom: spacing.lg },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  fieldInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  input: { flex: 1, paddingVertical: spacing.md, fontSize: 15, color: colors.text },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.lg,
  },
  segBtn: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.sm },
  segBtnActive: { backgroundColor: colors.surface },
  segText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  segTextActive: { color: colors.brand },
  textArea: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 15,
    color: colors.text,
  },
  submit: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.md,
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});
