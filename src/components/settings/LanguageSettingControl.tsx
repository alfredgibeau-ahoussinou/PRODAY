import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { PressableSpring } from '../motion';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { LanguagePickerModal } from './LanguagePickerModal';
import { spacing, radius } from '../../theme/designTokens';

type LanguageSettingVariant = 'row' | 'chip' | 'card';

interface LanguageSettingControlProps {
  variant?: LanguageSettingVariant;
}

/** Sélecteur de langue réutilisable — invité, profil et préférences. */
export const LanguageSettingControl: React.FC<LanguageSettingControlProps> = ({
  variant = 'row',
}) => {
  const { colors } = useAppTheme();
  const { t, locale, languageLabel, setLocale } = useTranslation();
  const [open, setOpen] = useState(false);

  const modal = (
    <LanguagePickerModal
      visible={open}
      value={locale}
      onClose={() => setOpen(false)}
      onSelect={(code) => void setLocale(code)}
    />
  );

  if (variant === 'chip') {
    return (
      <>
        <PressableSpring
          onPress={() => setOpen(true)}
          scaleTo={0.96}
          haptic
          style={[
            styles.chip,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          accessibilityLabel={t('preferences.language')}
        >
          <Icon name="globe" size={14} color={colors.accent} />
          <ProDayText variant="caption" numberOfLines={1} style={styles.chipLabel}>
            {languageLabel}
          </ProDayText>
          <Icon name="chevron-down" size={14} color={colors.textMuted} />
        </PressableSpring>
        {modal}
      </>
    );
  }

  if (variant === 'card') {
    return (
      <>
        <PressableSpring onPress={() => setOpen(true)} scaleTo={0.99} haptic>
          <ProDaySurface
            variant="module"
            style={[styles.card, { borderColor: colors.border }]}
          >
            <View style={styles.cardRow}>
              <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
                <Icon name="globe" size={18} color={colors.accent} />
              </View>
              <View style={styles.copy}>
                <ProDayText variant="body">{t('preferences.language')}</ProDayText>
                <ProDayText variant="caption" muted>
                  {t('preferences.languageHint')}
                </ProDayText>
              </View>
              <View style={styles.value}>
                <ProDayText variant="caption" accent numberOfLines={1} style={styles.valueLabel}>
                  {languageLabel}
                </ProDayText>
                <Icon name="chevron-forward" size={16} color={colors.textMuted} />
              </View>
            </View>
          </ProDaySurface>
        </PressableSpring>
        {modal}
      </>
    );
  }

  return (
    <>
      <PressableSpring
        onPress={() => setOpen(true)}
        scaleTo={0.99}
        haptic
        style={[styles.row, { borderTopColor: colors.border }]}
      >
        <View style={styles.copy}>
          <ProDayText variant="body">{t('preferences.language')}</ProDayText>
          <ProDayText variant="caption" muted>
            {t('preferences.languageHint')}
          </ProDayText>
        </View>
        <View style={styles.value}>
          <ProDayText variant="caption" accent numberOfLines={1} style={styles.valueLabel}>
            {languageLabel}
          </ProDayText>
          <Icon name="chevron-forward" size={16} color={colors.textMuted} />
        </View>
      </PressableSpring>
      {modal}
    </>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    maxWidth: 168,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipLabel: { fontWeight: '800', flexShrink: 1 },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  copy: { flex: 1, gap: 2 },
  value: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '46%',
  },
  valueLabel: { fontWeight: '800', flexShrink: 1 },
});
