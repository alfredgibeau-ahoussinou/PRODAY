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
import { clubsService } from '../services/clubs.service';
import { profileService } from '../services/profile.service';
import { colors, spacing, radius } from '../theme/designTokens';

interface CreateClubScreenProps {
  profile: User;
  onBack: () => void;
  onCreated: () => void;
}

export const CreateClubScreen: React.FC<CreateClubScreenProps> = ({
  profile,
  onBack,
  onCreated,
}) => {
  const [name, setName] = useState('');
  const [city, setCity] = useState(profile.city ?? '');
  const [department, setDepartment] = useState(profile.department ?? '');
  const [categoriesText, setCategoriesText] = useState('Seniors, U19');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !city.trim()) {
      Alert.alert('Champs requis', 'Nom du club et ville sont obligatoires.');
      return;
    }
    const categories = categoriesText
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    if (categories.length === 0) {
      Alert.alert('Catégories', 'Indiquez au moins une catégorie (ex. Seniors).');
      return;
    }

    setSubmitting(true);
    try {
      const clubId = await clubsService.create({
        name: name.trim(),
        city: city.trim(),
        department: department.trim() || undefined,
        categories,
        owner_uid: profile.uid,
      });
      await profileService.updateProfile(profile.uid, {
        profile: { club_id: clubId },
      });
      Alert.alert('Club créé', `${name.trim()} est enregistré sur ProDay.`);
      onCreated();
      onBack();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Création impossible.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="Créer un club" onBack={onBack} centered />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.hint}>
          Votre club sera lié à votre profil pour publier des annonces et des matchs.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Nom du club *"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
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
          placeholder="Département (ex. 13)"
          placeholderTextColor={colors.textMuted}
          value={department}
          onChangeText={setDepartment}
        />
        <TextInput
          style={styles.input}
          placeholder="Catégories (séparées par des virgules)"
          placeholderTextColor={colors.textMuted}
          value={categoriesText}
          onChangeText={setCategoriesText}
        />
        <TouchableOpacity
          style={styles.primary}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.primaryText}>Créer le club</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  hint: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 15,
  },
  primary: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  primaryText: { color: '#FFFFFF', fontWeight: '700' },
});
