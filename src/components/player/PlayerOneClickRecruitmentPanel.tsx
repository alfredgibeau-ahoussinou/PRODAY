import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import type { User } from '../../models/User';
import type { ClubApplicationStage } from '../../models/ClubApplicationPipeline';
import { OneClickRecruitmentSheet } from './OneClickRecruitmentSheet';
import { ScoutReportSheet } from './ScoutReportSheet';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';

interface PlayerOneClickRecruitmentPanelProps {
  staff: User;
  player: User;
  postId?: string;
  currentPipelineStage?: ClubApplicationStage;
  onRefresh?: () => void;
}

export const PlayerOneClickRecruitmentPanel: React.FC<PlayerOneClickRecruitmentPanelProps> = ({
  staff,
  player,
  postId,
  currentPipelineStage,
  onRefresh,
}) => {
  const clubId = staff.profile.club_id;
  const { colors: c } = useAppTheme();
  const [open, setOpen] = useState(false);
  const [scoutOpen, setScoutOpen] = useState(false);

  if (!clubId) return null;

  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={styles.row}>
        <View style={{ flex: 1, gap: 2 }}>
          <ProDayText variant="section">Recrutement 1 clic</ProDayText>
          <ProDayText variant="caption" muted>
            Shortlist → rapport → contact → essai → offre
          </ProDayText>
        </View>
        <PressableSpring
          style={[styles.cta, { backgroundColor: c.brand }]}
          onPress={() => setOpen(true)}
          scaleTo={0.96}
          haptic
        >
          <ProDayText variant="caption" inverse style={{ fontWeight: '800' }}>
            Lancer
          </ProDayText>
        </PressableSpring>
      </View>

      <OneClickRecruitmentSheet
        visible={open}
        onClose={() => setOpen(false)}
        staff={staff}
        player={player}
        postId={postId}
        currentPipelineStage={currentPipelineStage}
        onOpenScoutReport={() => setScoutOpen(true)}
        onRefresh={onRefresh}
      />
      <ScoutReportSheet
        visible={scoutOpen}
        onClose={() => setScoutOpen(false)}
        staff={staff}
        player={player}
        onSaved={onRefresh}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cta: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
});
