import React, { useMemo, useState } from 'react';
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
import { tournamentService } from '../services/tournament.service';
import { parseFrenchDate } from '../utils/parseFrenchDate';
import { spacing, radius } from '../theme/designTokens';
import { useThemedScreen } from '../hooks/useThemedScreen';
import type { AppColors } from '../theme/universeTheme';

interface CreateTournamentScreenProps {
  profile: User;
  onBack: () => void;
  onCreated: () => void;
}

export const CreateTournamentScreen: React.FC<CreateTournamentScreenProps> = ({
  profile,
  onBack,
  onCreated,
}) => {
  const { colors: c, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createStyles(c), [c]);
  const [name, setName] = useState('');
  const [city, setCity] = useState(profile.city ?? '');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [categoriesText, setCategoriesText] = useState('U15, U17, Seniors');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !city.trim()) {
      Alert.alert('Champs requis', 'Nom et ville sont obligatoires.');
      return;
    }
    const start = parseFrenchDate(dateStart);
    const end = parseFrenchDate(dateEnd || dateStart);
    if (!start || !end) {
      Alert.alert('Dates invalides', 'Utilisez le format jj/mm/aaaa.');
      return;
    }
    if (end < start) {
      Alert.alert('Dates', 'La date de fin doit être après le début.');
      return;
    }
    const categories = categoriesText
      .split(',')
      .map((cat) => cat.trim())
      .filter(Boolean);
    if (categories.length === 0) {
      Alert.alert('Catégories', 'Indiquez au moins une catégorie.');
      return;
    }

    setSubmitting(true);
    try {
      await tournamentService.create({
        name: name.trim(),
        organizer_id: profile.profile.club_id ?? profile.uid,
        city: city.trim(),
        location: profile.location ?? { latitude: 0, longitude: 0 },
        date_start: start,
        date_end: end,
        categories,
      });
      Alert.alert('Tournoi créé', `${name.trim()} est ouvert aux inscriptions.`);
      onCreated();
      onBack();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Création impossible.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.root, rootStyle]}>
      <ScreenHeader title="Créer un tournoi" onBack={onBack} centered />
      <ScrollView contentContainerStyle={styles.content}>
        <TextInput
          style={styles.input}
          placeholder="Nom du tournoi *"
          placeholderTextColor={c.textMuted}
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Ville *"
          placeholderTextColor={c.textMuted}
          value={city}
          onChangeText={setCity}
        />
        <TextInput
          style={styles.input}
          placeholder="Date début (jj/mm/aaaa) *"
          placeholderTextColor={c.textMuted}
          value={dateStart}
          onChangeText={setDateStart}
        />
        <TextInput
          style={styles.input}
          placeholder="Date fin (jj/mm/aaaa)"
          placeholderTextColor={c.textMuted}
          value={dateEnd}
          onChangeText={setDateEnd}
        />
        <TextInput
          style={styles.input}
          placeholder="Catégories (U15, Seniors…)"
          placeholderTextColor={c.textMuted}
          value={categoriesText}
          onChangeText={setCategoriesText}
        />
        <TouchableOpacity
          style={styles.primary}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={c.brandInverse} />
          ) : (
            <Text style={styles.primaryText}>Publier le tournoi</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1 },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    input: {
      backgroundColor: c.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      color: c.text,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      fontSize: 15,
    },
    primary: {
      backgroundColor: c.brand,
      borderRadius: radius.md,
      padding: spacing.lg,
      alignItems: 'center',
      marginTop: spacing.md,
    },
    primaryText: { color: c.brandInverse, fontWeight: '700' },
  });
}
