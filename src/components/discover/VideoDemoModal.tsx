import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { AnimatedModalShell } from '../motion/AnimatedModalShell';
import { Icon } from '../ui/Icon';
import { useThemedScreen } from '../../hooks/useThemedScreen';
import { useTranslation } from '../../context/LocaleContext';
import { spacing, radius, shadows } from '../../theme/designTokens';
import { ProDayGradient } from '../ui/ProDayGradient';

interface VideoDemoModalProps {
  visible: boolean;
  onClose: () => void;
}

export const VideoDemoModal: React.FC<VideoDemoModalProps> = ({ visible, onClose }) => {
  const { colors } = useThemedScreen();
  const { t } = useTranslation();

  return (
    <AnimatedModalShell visible={visible} onClose={onClose} closeLabel={t('common.close')}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('videoDemo.title') || 'Découvrez ProDay en 45 secondes'}
          </Text>
        </View>

        <View style={[styles.videoPlaceholder, { backgroundColor: colors.surfaceMuted }]}>
          <Icon name="football" size={64} color={colors.brand} variant="filled" />
          <Text style={[styles.videoPlaceholderText, { color: colors.textSecondary }]}>
            {t('videoDemo.placeholder') || 'Vidéo de démonstration'}
          </Text>
        </View>

        <View style={styles.content}>
          <Text style={[styles.description, { color: colors.text }]}>
            {t('videoDemo.description') || 'Découvrez rapidement comment ProDay peut vous aider à atteindre vos objectifs cette saison.'}
          </Text>
          
          <View style={styles.features}>
            <View style={styles.feature}>
              <Icon name="checkmark-circle" size={20} color={colors.accent} />
              <Text style={[styles.featureText, { color: colors.text }]}>
                {t('videoDemo.feature1') || 'Trouvez un club ou recrutez des talents'}
              </Text>
            </View>
            <View style={styles.feature}>
              <Icon name="checkmark-circle" size={20} color={colors.accent} />
              <Text style={[styles.featureText, { color: colors.text }]}>
                {t('videoDemo.feature2') || 'Gérez votre équipe et organisez vos matchs'}
              </Text>
            </View>
            <View style={styles.feature}>
              <Icon name="checkmark-circle" size={20} color={colors.accent} />
              <Text style={[styles.featureText, { color: colors.text }]}>
                {t('videoDemo.feature3') || 'Connectez-vous avec la communauté football'}
              </Text>
            </View>
          </View>
        </View>

        <Pressable onPress={onClose} style={styles.buttonWrap}>
          <ProDayGradient kind="cta" style={styles.button}>
            <Text style={styles.buttonText}>{t('videoDemo.button') || 'Compris, commencer'}</Text>
          </ProDayGradient>
        </Pressable>
      </View>
    </AnimatedModalShell>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.lg,
    ...shadows.soft,
  },
  header: {
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  videoPlaceholder: {
    aspectRatio: 16 / 9,
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  videoPlaceholderText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    gap: spacing.md,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    textAlign: 'center',
  },
  features: {
    gap: spacing.sm,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  buttonWrap: {
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
