import React from 'react';
import { ScrollView, StyleSheet, View, type RefreshControlProps } from 'react-native';
import { SUPPORTER_SPACE } from '../theme/supporterSpaceTheme';

type Props = {
  children: React.ReactNode;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  padded?: boolean;
};

export const SpaceScreen: React.FC<Props> = ({ children, refreshControl, padded = true }) => (
  <ScrollView
    style={styles.root}
    contentContainerStyle={[styles.content, padded && styles.padded]}
    refreshControl={refreshControl}
    showsVerticalScrollIndicator={false}
  >
    {children}
    <View style={styles.bottomPad} />
  </ScrollView>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SUPPORTER_SPACE.bg },
  content: { flexGrow: 1 },
  padded: { paddingHorizontal: 16, paddingTop: 8 },
  bottomPad: { height: 28 },
});
