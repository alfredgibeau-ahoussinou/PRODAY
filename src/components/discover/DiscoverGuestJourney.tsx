import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { spacing, radius } from '../../theme/designTokens';
import { useAppTheme } from '../../context/ProductLineContext';
import type { AppColors } from '../../theme/universeTheme';
import { useTranslation } from '../../context/LocaleContext';
import { getLocalizedGuestJourneySteps } from '../../i18n/localizedContent';
import type { DiscoverJourneyStepId } from '../../content/discoverGuestJourney';

import type { ProductLineId } from '../../models/ProductLine';

interface DiscoverGuestJourneyProps {
  productLine: ProductLineId;
  onStepPress: (id: DiscoverJourneyStepId) => void;
}

export const DiscoverGuestJourney: React.FC<DiscoverGuestJourneyProps> = ({
  productLine,
  onStepPress,
}) => {
  const { colors: c } = useAppTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(c), [c]);
  const steps = useMemo(
    () => getLocalizedGuestJourneySteps(productLine, t),
    [productLine, t]
  );

  return (
    <View style={styles.row}>
      {steps.map((step, index) => (
        <PressableSpring
          key={step.id}
          onPress={() => onStepPress(step.id)}
          scaleTo={0.98}
          style={styles.step}
        >
          <View style={styles.index}>
            <Text style={styles.indexText}>{index + 1}</Text>
          </View>
          <Icon name={step.icon} size={18} color={c.ink} variant="filled" />
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.body} numberOfLines={2}>
            {step.body}
          </Text>
        </PressableSpring>
      ))}
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    step: {
      flex: 1,
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      gap: spacing.xs,
      minHeight: 118,
    },
    index: {
      position: 'absolute',
      top: spacing.sm,
      right: spacing.sm,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: c.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    indexText: {
      fontSize: 10,
      fontWeight: '900',
      color: c.textMuted,
    },
    title: {
      fontSize: 14,
      fontWeight: '800',
      color: c.text,
      marginTop: spacing.xs,
    },
    body: {
      fontSize: 11,
      lineHeight: 15,
      fontWeight: '500',
      color: c.textMuted,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
  });
}
