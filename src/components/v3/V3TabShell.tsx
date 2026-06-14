import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ProDayScreenCanvas } from '../ui/ProDayScreenCanvas';
import { AuroraHeader } from '../aurora/AuroraHeader';
import { AppStatChips, type AppStatChip } from '../app/AppStatChips';
import { SectionIntelligencePanel } from '../../features/v3/components/SectionIntelligencePanel';
import type { SectionIntelligence } from '../../features/v3/engines/sectionIntelligence.engine';

export type V3TabShellProps = {
  caption?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  stats?: AppStatChip[];
  intelligence?: SectionIntelligence | null;
  onInsightPress?: (insightId: string) => void;
  flat?: boolean;
  immersive?: boolean;
  children: React.ReactNode;
};

/** Shell V3 Neo Sport — canvas, header, IA, stats, contenu. */
export const V3TabShell: React.FC<V3TabShellProps> = ({
  caption,
  title,
  subtitle,
  right,
  stats,
  intelligence,
  onInsightPress,
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
        right={right}
        footer={stats && stats.length > 0 ? <AppStatChips items={stats} /> : undefined}
      />
      {intelligence ? (
        <View style={styles.intel}>
          <SectionIntelligencePanel
            data={intelligence}
            compact
            onInsightPress={onInsightPress}
          />
        </View>
      ) : null}
      <View style={styles.body}>{children}</View>
    </View>
  </ProDayScreenCanvas>
);

const styles = StyleSheet.create({
  root: { flex: 1 },
  intel: { paddingHorizontal: 0 },
  body: { flex: 1, minHeight: 0 },
});
