import React, { useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SPONSOR_NAV_INSET } from '../../navigation/sponsorTabConfig';
import { useSponsorData } from '../../context/SponsorDataContext';
import { useSponsorStyles } from './sponsorStyles';
import { spacing } from '../../theme/designTokens';

interface SponsorPageScaffoldProps {
  children: React.ReactNode;
  loading?: boolean;
  scrollable?: boolean;
}

export const SponsorPageScaffold: React.FC<SponsorPageScaffoldProps> = ({
  children,
  loading,
  scrollable = true,
}) => {
  const { refreshing, refresh } = useSponsorData();
  const { styles, colors: c } = useSponsorStyles();
  const localStyles = useMemo(() => createScaffoldStyles(), []);

  if (loading) {
    return (
      <View style={styles.root}>
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color={c.brand} />
        </View>
      </View>
    );
  }

  if (!scrollable) {
    return <View style={[styles.root, localStyles.fill]}>{children}</View>;
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={localStyles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={c.brand} />
        }
      >
        {children}
      </ScrollView>
    </View>
  );
};

function createScaffoldStyles() {
  return StyleSheet.create({
    content: {
      padding: spacing.lg,
      paddingBottom: SPONSOR_NAV_INSET + spacing.xl,
      gap: spacing.md,
    },
    fill: { flex: 1 },
  });
}
