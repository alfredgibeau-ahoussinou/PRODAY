import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { Icon, type IconName } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { spacing } from '../../theme/designTokens';
import { CarpoolHero } from './CarpoolHero';

interface CarpoolGuestPromptProps {
  onLogin: () => void;
  onSignup: () => void;
}

const VALUE_ITEMS: { icon: IconName; key: string }[] = [
  { icon: 'car', key: 'carpool.guest.value.rides' },
  { icon: 'location', key: 'carpool.guest.value.live' },
  { icon: 'people', key: 'carpool.guest.value.crew' },
];

export const CarpoolGuestPrompt: React.FC<CarpoolGuestPromptProps> = ({ onLogin, onSignup }) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <CarpoolHero
        eyebrow={t('carpool.caption')}
        headline={t('carpool.hero.guest.headline')}
        support={t('carpool.hero.guest.support')}
        minHeight={340}
        actions={[
          { label: t('common.login'), icon: 'chevron-forward', onPress: onLogin },
          { label: t('common.guest.signup'), tone: 'ghost', onPress: onSignup },
        ]}
      />

      <View style={styles.values}>
        {VALUE_ITEMS.map((item) => (
          <View key={item.key} style={styles.valueItem}>
            <View style={[styles.valueIcon, { borderColor: colors.border }]}>
              <Icon name={item.icon} size={18} color={colors.accent} />
            </View>
            <ProDayText variant="caption" muted style={styles.valueLabel}>
              {t(item.key)}
            </ProDayText>
          </View>
        ))}
      </View>
    </View>
  );
};

function createStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    wrap: { flex: 1 },
    values: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.md,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xl,
    },
    valueItem: { flex: 1, alignItems: 'center', gap: spacing.sm },
    valueIcon: {
      width: 46,
      height: 46,
      borderRadius: 8,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceMuted,
    },
    valueLabel: { textAlign: 'center', lineHeight: 16 },
  });
}
