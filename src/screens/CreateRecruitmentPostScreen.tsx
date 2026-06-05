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
import { SubscriptionLimitError } from '../services/subscription.service';
import { useSubscriptionOptional } from '../context/SubscriptionContext';
import { useAppSpace } from '../context/AppSpaceContext';
import { spacing, radius } from '../theme/designTokens';
import { useThemedScreen } from '../hooks/useThemedScreen';
import { canPublishRecruitmentPost } from '../utils/roleCapabilities';

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
  const [position, setPosition] = useState('');
  const [category, setCategory] = useState('Seniors');
  const [level, setLevel] = useState('');
  const [city, setCity] = useState(profile.city ?? '');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { appSpace } = useAppSpace();
  const subscriptionCtx = useSubscriptionOptional();
  const { colors: themeColors, productLine, rootStyle } = useThemedScreen();
  const defaultTitle = productLine === 'woman' ? 'Recherche joueuse' : 'Recherche joueur';
  const [title, setTitle] = useState(defaultTitle);
  const inputStyle = [
    styles.input,
    {
      backgroundColor: themeColors.surface,
      borderColor: themeColors.border,
      color: themeColors.text,
    },
  ];

  if (!canPublishRecruitmentPost(profile.role)) {
    return (
      <View style={[styles.denied, rootStyle]}>
        <ScreenHeader title="Publier une annonce" onBack={onBack} centered />
        <Text style={[styles.deniedText, { color: themeColors.textSecondary }]}>
          Les joueurs et joueuses peuvent candidater aux annonces, mais pas en publier.
        </Text>
      </View>
    );
  }

  const handleSubmit = async () => {
    if (!position.trim() || !level.trim() || !city.trim()) {
      Alert.alert('Champs requis', 'Poste, niveau et ville sont obligatoires.');
      return;
    }
    setSubmitting(true);
    try {
      await recruitmentService.createPost(
        {
          author_uid: profile.uid,
          club_id: profile.profile.club_id ?? profile.uid,
          club_name: profile.display_name,
          title: title.trim(),
          position: position.trim(),
          category: category.trim(),
          level: level.trim(),
          city: city.trim(),
          description: description.trim() || undefined,
          target_space: appSpace,
        },
        profile
      );
      Alert.alert('Annonce publiée', 'Visible dans Recrutements populaires.');
      onCreated();
      onBack();
    } catch (e) {
      if (e instanceof SubscriptionLimitError) {
        subscriptionCtx?.openUpgradeForFeature(e.feature);
        return;
      }
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Publication impossible.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.root, rootStyle]}>
      <ScreenHeader title="Publier une annonce" onBack={onBack} centered />
      <ScrollView contentContainerStyle={styles.content}>
        <TextInput
          style={inputStyle}
          placeholder="Titre de l'annonce"
          placeholderTextColor={themeColors.textMuted}
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={inputStyle}
          placeholder="Poste recherché *"
          placeholderTextColor={themeColors.textMuted}
          value={position}
          onChangeText={setPosition}
        />
        <TextInput
          style={inputStyle}
          placeholder="Catégorie (ex. U19, Seniors)"
          placeholderTextColor={themeColors.textMuted}
          value={category}
          onChangeText={setCategory}
        />
        <TextInput
          style={inputStyle}
          placeholder="Niveau (ex. R2, Départemental) *"
          placeholderTextColor={themeColors.textMuted}
          value={level}
          onChangeText={setLevel}
        />
        <TextInput
          style={inputStyle}
          placeholder="Ville *"
          placeholderTextColor={themeColors.textMuted}
          value={city}
          onChangeText={setCity}
        />
        <TextInput
          style={[...inputStyle, styles.bio]}
          placeholder="Description (optionnel)"
          placeholderTextColor={themeColors.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <TouchableOpacity
          style={[styles.primary, { backgroundColor: themeColors.brand }]}
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
  root: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  input: {
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    fontSize: 15,
  },
  bio: { minHeight: 100, textAlignVertical: 'top' },
  primary: {
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  primaryText: { color: '#FFFFFF', fontWeight: '700' },
  denied: {
    flex: 1,
    padding: spacing.lg,
  },
  deniedText: {
    marginTop: spacing.lg,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
});
