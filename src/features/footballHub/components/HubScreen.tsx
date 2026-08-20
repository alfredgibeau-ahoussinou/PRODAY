import React from 'react';
import { ScrollView, StyleSheet, View, type RefreshControlProps } from 'react-native';
import { FOOTBALL_HUB } from '../theme/footballHubTheme';

type Props = {
  children: React.ReactNode;
  scroll?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  footer?: React.ReactNode;
};

export const HubScreen: React.FC<Props> = ({
  children,
  scroll = true,
  refreshControl,
  footer,
}) => {
  if (!scroll) {
    return (
      <View style={styles.root}>
        <View style={styles.body}>{children}</View>
        {footer}
      </View>
    );
  }
  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      >
        {children}
      </ScrollView>
      {footer}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: FOOTBALL_HUB.bg,
  },
  body: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
    gap: 22,
  },
});
