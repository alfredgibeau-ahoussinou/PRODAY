import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ProDayScreenCanvas } from '../ui/ProDayScreenCanvas';
import { AuroraHeader } from '../aurora/AuroraHeader';
import { AppStatChips, type AppStatChip } from './AppStatChips';

export type TabScreenShellProps = {
  caption?: string;
  title: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  stats?: AppStatChip[];
  flat?: boolean;
  immersive?: boolean;
  children: React.ReactNode;
};

/** Enveloppe standard des onglets — canvas, en-tête, stats, contenu. */
export const TabScreenShell: React.FC<TabScreenShellProps> = ({
  caption,
  title,
  subtitle,
  left,
  right,
  stats,
  flat = false,
  immersive = false,
  children,
}) => (
  <ProDayScreenCanvas flat={flat} immersive={immersive}>
    <View style={styles.root}>
      <AuroraHeader
        variant="sport"
        eyebrow={caption}
        title={title}
        subtitle={subtitle}
        left={left}
        right={right}
        footer={stats && stats.length > 0 ? <AppStatChips items={stats} /> : undefined}
      />
      <View style={styles.body}>{children}</View>
    </View>
  </ProDayScreenCanvas>
);

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1, minHeight: 0 },
});
