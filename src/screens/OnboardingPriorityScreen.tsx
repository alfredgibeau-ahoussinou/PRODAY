import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '../components/ui/Icon';
import { ProDayGradient } from '../components/ui/ProDayGradient';
import { useThemedScreen } from '../hooks/useThemedScreen';
import { useTranslation } from '../context/LocaleContext';
import { spacing, radius, shadows } from '../theme/designTokens';
import type { ProductLineId } from '../models/ProductLine';

export interface OnboardingPriorityChoice {
  id: string;
  title: string;
  description: string;
  icon: string;
  targetProductLine: ProductLineId;
  targetRole?: 'player' | 'coach' | 'club' | 'organizer';
}

interface OnboardingPriorityScreenProps {
  onChoice: (choice: OnboardingPriorityChoice) => void;
  onSkip: () => void;
}

export const ONBOARDING_CHOICES: OnboardingPriorityChoice[] = [
  {
    id: 'find_club',
    title: 'Trouver un club / être recruté',
    description: 'Créez votre CV, postulez aux offres et soyez repéré par les recruteurs',
    icon: 'person-running',
    targetProductLine: 'amateur',
    targetRole: 'player',
  },
  {
    id: 'manage_team',
    title: 'Gérer mon équipe et recruter',
    description: 'Organisez vos entraînements, gérez votre effectif et recrutez de nouveaux talents',
    icon: 'people',
    targetProductLine: 'amateur',
    targetRole: 'coach',
  },
  {
    id: 'manage_club',
    title: 'Gérer un club',
    description: 'Développez l\'image de votre club, gérez les annonces et les partenariats',
    icon: 'business',
    targetProductLine: 'pro_club',
    targetRole: 'club',
  },
  {
    id: 'organize_tournament',
    title: 'Organiser un tournoi',
    description: 'Créez et gérez vos événements, trouvez des équipes et des arbitres',
    icon: 'trophy',
    targetProductLine: 'pro_staff',
    targetRole: 'organizer',
  },
];

export const OnboardingPriorityScreen: React.FC<OnboardingPriorityScreenProps> = ({
  onChoice,
  onSkip,
}) => {
  const { rootStyle, colors } = useThemedScreen();
  const { t } = useTranslation();

  return (
    <View style={[styles.root, rootStyle]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Icon name="star-four-points" size={48} color={colors.brand} variant="filled" />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('onboarding.priority.title') || 'Quelle est votre priorité cette saison ?'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('onboarding.priority.subtitle') || 'Répondez pour accéder directement aux fonctionnalités qui vous concernent'}
          </Text>
        </View>

        <View style={styles.choicesContainer}>
          {ONBOARDING_CHOICES.map((choice) => (
            <Pressable
              key={choice.id}
              style={({ pressed }) => [
                styles.choiceCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  opacity: pressed ? 0.9 : 1,
                },
                shadows.soft,
              ]}
              onPress={() => onChoice(choice)}
            >
              <View style={[styles.choiceIcon, { backgroundColor: colors.surfaceMuted }]}>
                <Icon name={choice.icon as any} size={24} color={colors.brand} variant="filled" />
              </View>
              <View style={styles.choiceContent}>
                <Text style={[styles.choiceTitle, { color: colors.text }]}>
                  {choice.title}
                </Text>
                <Text style={[styles.choiceDescription, { color: colors.textSecondary }]}>
                  {choice.description}
                </Text>
              </View>
              <Icon name="chevron-forward" size={20} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>

        <Pressable onPress={onSkip} style={styles.skipButton}>
          <Text style={[styles.skipText, { color: colors.textMuted }]}>
            {t('onboarding.priority.skip') || 'Passer cette étape'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xl * 2,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl * 2,
    paddingHorizontal: spacing.md,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.sm,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  choicesContainer: {
    gap: spacing.md,
  },
  choiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    gap: spacing.md,
  },
  choiceIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceContent: {
    flex: 1,
  },
  choiceTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.xs,
    lineHeight: 22,
  },
  choiceDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  skipButton: {
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
