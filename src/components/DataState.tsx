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
        <Text style={styles.title}>Firebase non configuré</Text>
        <Text style={styles.sub}>
          Copiez .env.example vers .env et renseignez les clés du projet ProDay.
          Les statistiques afficheront alors les vrais comptages Firestore.
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
