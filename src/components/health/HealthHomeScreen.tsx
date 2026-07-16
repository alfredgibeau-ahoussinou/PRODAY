import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import type { User } from '../../models/User';
import type { HealthChapterId } from '../../content/healthChapters';
import { healthChapterToPoleGroup } from '../../content/healthChapters';
import { PhysioCarePanel } from '../feed/PhysioCarePanel';
import { HealthChapterRail } from './HealthChapterRail';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { spacing } from '../../theme/designTokens';
import { TabScreenShell } from '../app/TabScreenShell';

interface HealthHomeScreenProps {
  profile: User;
  onOpenChat: (threadId: string) => void;
  onOpenMessages: () => void;
  onBookPhysio: (physio: User) => void;
}

const pagePad = {
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.sm,
  paddingBottom: TAB_BAR_CONTENT_INSET + spacing.lg,
  gap: spacing.md,
};

/** Page RDV santé — spécialité puis praticien, sans contenu verbeux. */
export const HealthHomeScreen: React.FC<HealthHomeScreenProps> = ({
  profile,
  onOpenChat,
  onOpenMessages,
  onBookPhysio,
}) => {
  const [chapter, setChapter] = useState<HealthChapterId>('kine_osteo');
  const poleGroup = healthChapterToPoleGroup(chapter);

  return (
    <TabScreenShell title="RDV Santé" subtitle="Choisissez une spécialité" flat>
      <ScrollView
        contentContainerStyle={[pagePad, styles.scroll]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <HealthChapterRail active={chapter} onSelect={setChapter} minimal />

        {poleGroup ? (
          <PhysioCarePanel
            profile={profile}
            onOpenChat={onOpenChat}
            onOpenMessages={onOpenMessages}
            onBookPhysio={onBookPhysio}
            poleGroup={poleGroup}
            expanded
            hideHeader
            minimal
          />
        ) : null}
      </ScrollView>
    </TabScreenShell>
  );
};

const styles = StyleSheet.create({
  scroll: { flexGrow: 1 },
});
