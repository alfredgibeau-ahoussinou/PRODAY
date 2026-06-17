import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { spacing, radius } from '../../theme/designTokens';

interface MessagesNetworkIntroProps {
  savedCount: number;
}

export const MessagesNetworkIntro: React.FC<MessagesNetworkIntroProps> = ({ savedCount }) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
        <Icon name="people" size={20} color={colors.accent} />
      </View>
      <View style={styles.copy}>
        <ProDayText variant="section" style={styles.title}>
          {t('messages.network.intro.title')}
        </ProDayText>
        <ProDayText variant="caption" muted style={styles.body}>
          {t('messages.network.intro.body')}
        </ProDayText>
        {savedCount > 0 ? (
          <ProDayText variant="caption" accent style={styles.saved}>
            {t('messages.network.savedCount', { n: savedCount })}
          </ProDayText>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.lg,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 4 },
  title: { fontWeight: '800', fontSize: 15 },
  body: { lineHeight: 18 },
  saved: { marginTop: 4, fontWeight: '700' },
});
