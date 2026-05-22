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
import { recruitmentService } from '../services/recruitment.service';
import { colors, spacing, radius } from '../theme/designTokens';

interface CreateRecruitmentPostScreenProps {
  profile: User;
  onBack: () => void;
  onCreated: () => void;
}

export const CreateRecruitmentPostScreen: React.FC<CreateRecruitmentPostScreenProps> = ({
  profile,
  onBack,
  onCreated,
}) => {
  const [title, setTitle] = useState('Recherche joueur');
  const [position, setPosition] = useState('');
  const [category, setCategory] = useState('Seniors');
  const [level, setLevel] = useState('');
  const [city, setCity] = useState(profile.city ?? '');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!position.trim() || !level.trim() || !city.trim()) {
      Alert.alert('Champs requis', 'Poste, niveau et ville sont obligatoires.');
      return;
    }
    setSubmitting(true);
    try {
      await recruitmentService.createPost({
        author_uid: profile.uid,
        club_id: profile.profile.club_id ?? profile.uid,
        club_name: profile.display_name,
        title: title.trim(),
        position: position.trim(),
        category: category.trim(),
        level: level.trim(),
        city: city.trim(),
        description: description.trim() || undefined,
      });
      Alert.alert('Annonce publiée', 'Visible dans Recrutements populaires.');
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
      <ScreenHeader title="Publier une annonce" onBack={onBack} centered />
      <ScrollView contentContainerStyle={styles.content}>
        <TextInput
          style={styles.input}
          placeholder="Titre de l'annonce"
          placeholderTextColor={colors.textMuted}
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={styles.input}
          placeholder="Poste recherché *"
          placeholderTextColor={colors.textMuted}
          value={position}
          onChangeText={setPosition}
        />
        <TextInput
          style={styles.input}
          placeholder="Catégorie (ex. U19, Seniors)"
          placeholderTextColor={colors.textMuted}
          value={category}
          onChangeText={setCategory}
        />
        <TextInput
          style={styles.input}
          placeholder="Niveau (ex. R2, Départemental) *"
          placeholderTextColor={colors.textMuted}
          value={level}
          onChangeText={setLevel}
        />
        <TextInput
          style={styles.input}
          placeholder="Ville *"
          placeholderTextColor={colors.textMuted}
          value={city}
          onChangeText={setCity}
        />
        <TextInput
          style={[styles.input, styles.bio]}
          placeholder="Description (optionnel)"
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <TouchableOpacity
          style={styles.primary}
          onPress={handleSubmit}
          disabled={submitting}
        >
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
  bio: { minHeight: 100, textAlignVertical: 'top' },
  primary: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  primaryText: { color: '#FFFFFF', fontWeight: '700' },
});
