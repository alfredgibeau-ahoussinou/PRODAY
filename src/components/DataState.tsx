import React, { useMemo } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useAppTheme } from '../context/ProductLineContext';
import { spacing } from '../theme/designTokens';
import type { AppColors } from '../theme/universeTheme';

interface DataStateProps {
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  firebaseMissing?: boolean;
  children: React.ReactNode;
}

export const DataState: React.FC<DataStateProps> = ({
  loading,
  empty,
  emptyMessage = 'Aucune donnée pour le moment.',
  firebaseMissing,
  children,
}) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  if (firebaseMissing) {
    return (
      <View style={styles.box}>
        <Text style={styles.title}>Service indisponible</Text>
        <Text style={styles.sub}>Connectez-vous pour accéder aux données en ligne.</Text>
        <Text style={styles.sub}>
          Les données ne sont pas disponibles pour le moment. Réessayez dans quelques instants.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={c.brand} />
      </View>
    );
  }

  if (empty) {
    return (
      <View style={styles.box}>
        <Text style={styles.sub}>{emptyMessage}</Text>
      </View>
    );
  }

  return <>{children}</>;
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    center: { padding: spacing.xl, alignItems: 'center' },
    box: { padding: spacing.lg },
    title: { color: c.text, fontWeight: '700', fontSize: 15 },
    sub: { color: c.textSecondary, fontSize: 14, lineHeight: 22, marginTop: spacing.sm },
  });
}
