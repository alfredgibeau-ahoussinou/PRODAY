import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../context/ProductLineContext';

type Props = {
  title: string;
  subtitle?: string;
};

/** Écran vide — terrain pour le rebuild supporter (pas d’UX héritée). */
export const SupporterPlaceholderScreen: React.FC<Props> = ({
  title,
  subtitle = 'Espace en préparation. Contenu à venir.',
}) => {
  const { colors } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: colors.background,
          paddingHorizontal: 24,
          paddingTop: 48,
          justifyContent: 'center',
        },
        title: {
          color: colors.text,
          fontSize: 22,
          fontWeight: '700',
          marginBottom: 8,
        },
        subtitle: {
          color: colors.textMuted,
          fontSize: 15,
          lineHeight: 22,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.root} accessibilityRole="summary">
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
};
