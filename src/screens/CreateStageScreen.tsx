import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { User } from '../models/User';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { stagesService } from '../services/stages.service';
import { canPublishStages } from '../utils/roleCapabilities';
import { useAppSpace } from '../context/AppSpaceContext';
import { colors, spacing, radius } from '../theme/designTokens';

interface CreateStageScreenProps {
  profile: User;
  onBack: () => void;
  onCreated: () => void;
}

function parseDateInput(value: string): Date | null {
  const m = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

export const CreateStageScreen: React.FC<CreateStageScreenProps> = ({
  profile,
  onBack,
  onCreated,
}) => {
  const { appSpace } = useAppSpace();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState(profile.city ?? '');
  const [category, setCategory] = useState('U15');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [spots, setSpots] = useState('20');
  const [price, setPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!canPublishStages(profile.role)) {
    return (
      <View style={styles.root}>
        <ScreenHeader title="Publier un stage" onBack={onBack} centered />
        <Text style={styles.denied}>
          Réservé aux clubs, coachs et organisateurs vérifiés.
        </Text>
      </View>
    );
  }

  const handleSubmit = async () => {
    const start = parseDateInput(startDate);
    const end = parseDateInput(endDate);
    if (!title.trim() || !city.trim() || !category.trim() || !start || !end) {
      Alert.alert(
        'Champs requis',
        'Titre, ville, catégorie et dates (AAAA-MM-JJ) sont obligatoires.'
      );
      return;
    }
    if (end < start) {
      Alert.alert('Dates invalides', 'La date de fin doit être après le début.');
      return;
    }
    const spotsTotal = Number(spots);
    if (!spotsTotal || spotsTotal < 1) {
      Alert.alert('Places', 'Indiquez un nombre de places valide.');
      return;
    }

    setSubmitting(true);
    try {
      await stagesService.createOffer({
        author_uid: profile.uid,
        club_id: profile.profile.club_id ?? profile.uid,
        club_name: profile.display_name,
        title: title.trim(),
        description: description.trim(),
        city: city.trim(),
        category: category.trim(),
        start_date: start,
        end_date: end,
        price_eur: price.trim() ? Number(price) : undefined,
        spots_total: spotsTotal,
        target_space: appSpace,
      });
      Alert.alert('Stage publié', 'Visible dans Stages & camps du Mercato.');
      onCreated();
      onBack();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Publication impossible.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="Publier un stage" onBack={onBack} centered />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.hint}>Format date : AAAA-MM-JJ (ex. 2026-07-14)</Text>
        <TextInput
          style={styles.input}
          placeholder="Titre du stage *"
          placeholderTextColor={colors.textMuted}
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={styles.input}
          placeholder="Catégorie (ex. U15, Seniors) *"
          placeholderTextColor={colors.textMuted}
          value={category}
          onChangeText={setCategory}
        />
        <TextInput
          style={styles.input}
          placeholder="Ville *"
          placeholderTextColor={colors.textMuted}
          value={city}
          onChangeText={setCity}
        />
        <TextInput
          style={styles.input}
          placeholder="Date début *"
          placeholderTextColor={colors.textMuted}
          value={startDate}
          onChangeText={setStartDate}
        />
        <TextInput
          style={styles.input}
          placeholder="Date fin *"
          placeholderTextColor={colors.textMuted}
          value={endDate}
          onChangeText={setEndDate}
        />
        <TextInput
          style={styles.input}
          placeholder="Nombre de places *"
          placeholderTextColor={colors.textMuted}
          value={spots}
          onChangeText={setSpots}
          keyboardType="number-pad"
        />
        <TextInput
          style={styles.input}
          placeholder="Prix € (optionnel)"
          placeholderTextColor={colors.textMuted}
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
        />
        <TextInput
          style={[styles.input, styles.bio]}
          placeholder="Description du programme"
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <TouchableOpacity style={styles.primary} onPress={handleSubmit} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.primaryText}>Publier</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  hint: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.sm },
  denied: { padding: spacing.lg, color: colors.textMuted, textAlign: 'center' },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    color: colors.text,
    fontSize: 15,
  },
  bio: { minHeight: 100, textAlignVertical: 'top' },
  primary: {
    backgroundColor: colors.brand,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  primaryText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
});
