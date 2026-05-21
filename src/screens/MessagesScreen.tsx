import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme/designTokens';

export const MessagesScreen: React.FC = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Messages</Text>
    <Text style={styles.sub}>
      Disponible pour les profils vérifiés (coach, agent). Les conversations avec les
      mineurs nécessitent un badge vert.
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  sub: { color: colors.textSecondary, marginTop: spacing.md, lineHeight: 22 },
});
