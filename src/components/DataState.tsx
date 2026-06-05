import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme/designTokens';

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
        <ActivityIndicator size="large" color={colors.bluePrimary} />
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

const styles = StyleSheet.create({
  center: { padding: spacing.xl, alignItems: 'center' },
  box: { padding: spacing.lg },
  title: { color: colors.text, fontWeight: '700', fontSize: 15 },
  sub: { color: colors.textSecondary, fontSize: 14, lineHeight: 22, marginTop: spacing.sm },
});
