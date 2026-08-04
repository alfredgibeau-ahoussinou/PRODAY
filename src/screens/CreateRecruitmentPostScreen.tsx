import React, { useState } from 'react';
import { useTranslation } from '../context/LocaleContext';
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
import { recruitmentService } from '../services/recruitment.service';
import { guardStaffVerification } from '../utils/staffVerificationGuard';
import { SubscriptionLimitError } from '../services/subscription.service';
import { useSubscriptionOptional } from '../context/SubscriptionContext';
import { useAppSpace } from '../context/AppSpaceContext';
import { spacing, radius } from '../theme/designTokens';
import { useThemedScreen } from '../hooks/useThemedScreen';
import { canPublishRecruitmentPost } from '../utils/roleCapabilities';
import { recordV3UserAction } from '../utils/recordV3Action';
import { trackV3Event } from '../core/analytics/v3Events';
import { TabScreenShell } from '../components/app/TabScreenShell';
import { ScreenBackButton } from '../components/ui/ScreenBackButton';
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
  const { t } = useTranslation();
  const [position, setPosition] = useState('');
  const [category, setCategory] = useState('Seniors');
  const [level, setLevel] = useState('');
  const [city, setCity] = useState(profile.city ?? '');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { appSpace } = useAppSpace();
  const subscriptionCtx = useSubscriptionOptional();
  const { colors: themeColors, isWoman } = useThemedScreen();
  const defaultTitle = isWoman ? 'Recherche joueuse' : 'Recherche joueur';
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
      <TabScreenShell
        caption="Mercato"
        title="Publier une annonce"
        left={<ScreenBackButton onPress={onBack} />}
        flat
      >
        <View style={styles.deniedBody}>
          <Text style={[styles.deniedText, { color: themeColors.textSecondary }]}>
            Les joueurs et joueuses peuvent candidater aux annonces, mais pas en publier.
          </Text>
        </View>
      </TabScreenShell>
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
      Alert.alert(t('recruitment.published'), t('recruitment.publishedBody'));
      trackV3Event('mercato_post_published', { uid: profile.uid });
      recordV3UserAction(profile, 'publish_mercato');
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
        placeholder={t('recruitment.positionPlaceholder')}
        placeholderTextColor={themeColors.textMuted}
        value={position}
        onChangeText={setPosition}
      />
      <TextInput
        style={inputStyle}
        placeholder={t('recruitment.categoryPlaceholder')}
        placeholderTextColor={themeColors.textMuted}
        value={category}
        onChangeText={setCategory}
      />
      <TextInput
        style={inputStyle}
        placeholder={t('recruitment.levelPlaceholder')}
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

  return (
    <TabScreenShell
      caption="Mercato"
      title="Publier une annonce"
      subtitle="Visible dans les recherches joueurs compatibles"
      left={<ScreenBackButton onPress={onBack} />}
      flat
    >
      {form}
    </TabScreenShell>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    padding: spacing.lg,
    paddingBottom: TAB_BAR_CONTENT_INSET + spacing.lg,
    gap: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 16,
  },
  bio: { minHeight: 120, textAlignVertical: 'top' },
  primary: {
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  primaryText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  deniedBody: { padding: spacing.lg },
  deniedText: { fontSize: 15, lineHeight: 22 },
});
