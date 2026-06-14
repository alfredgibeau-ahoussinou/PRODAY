import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { User } from '../models/User';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { recruitmentService } from '../services/recruitment.service';
import { guardStaffVerification } from '../utils/staffVerificationGuard';
import { SubscriptionLimitError } from '../services/subscription.service';
import { useSubscriptionOptional } from '../context/SubscriptionContext';
import { useAppSpace } from '../context/AppSpaceContext';
import { spacing, radius } from '../theme/designTokens';
import { useThemedScreen } from '../hooks/useThemedScreen';
import { canPublishRecruitmentPost } from '../utils/roleCapabilities';
import { isV3ShellEnabled } from '../config/featureFlags';
import { recordV3UserAction } from '../utils/recordV3Action';
import { trackV3Event } from '../core/analytics/v3Events';
import { V3TabShell } from '../components/v3/V3TabShell';
import { V3ScreenBack } from '../components/v3/V3ScreenBack';
import { useSectionIntelligence } from '../hooks/useSectionIntelligence';
import { PressableSpring } from '../components/motion';
import { TAB_BAR_CONTENT_INSET } from '../navigation/tabBarLayout';

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
  const useV3Header = isV3ShellEnabled();
  const intelligence = useSectionIntelligence('recrutement', profile, productLine, {
    staffMode: true,
    mercatoPosts: 0,
  });
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
    const denied = (
      <View style={styles.deniedBody}>
        <Text style={[styles.deniedText, { color: themeColors.textSecondary }]}>
          Les joueurs et joueuses peuvent candidater aux annonces, mais pas en publier.
        </Text>
      </View>
    );
    if (useV3Header) {
      return (
        <V3TabShell
          caption="Mercato"
          title="Publier une annonce"
          right={<V3ScreenBack onPress={onBack} />}
          intelligence={intelligence}
          flat
        >
          {denied}
        </V3TabShell>
      );
    }
    return (
      <View style={[styles.root, rootStyle]}>
        <ScreenHeader title="Publier une annonce" onBack={onBack} centered />
        {denied}
      </View>
    );
  }

  const handleSubmit = async () => {
    if (!guardStaffVerification(profile)) return;
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
      if (isV3ShellEnabled()) {
        trackV3Event('mercato_post_published', { uid: profile.uid });
        recordV3UserAction(profile, 'publish_mercato');
      }
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

  const form = (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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
      <PressableSpring
        style={[styles.primary, { backgroundColor: themeColors.brand }]}
        onPress={handleSubmit}
        disabled={submitting}
        scaleTo={0.98}
        haptic
      >
        {submitting ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.primaryText}>Publier</Text>
        )}
      </PressableSpring>
    </ScrollView>
  );

  if (useV3Header) {
    return (
      <V3TabShell
        caption="Mercato"
        title="Publier une annonce"
        subtitle="Visible dans les recherches joueurs compatibles"
        right={<V3ScreenBack onPress={onBack} />}
        intelligence={intelligence}
        flat
      >
        {form}
      </V3TabShell>
    );
  }

  return (
    <View style={[styles.root, rootStyle]}>
      <ScreenHeader title="Publier une annonce" onBack={onBack} centered />
      {form}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    padding: spacing.lg,
    paddingBottom: TAB_BAR_CONTENT_INSET + spacing.lg,
  },
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
  deniedBody: { padding: spacing.lg },
  deniedText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
});
