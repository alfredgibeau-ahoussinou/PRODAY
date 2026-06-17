import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import type { User } from '../../models/User';
import type { HealthChapterId } from '../../content/healthChapters';
import { PRODAY_SANTE_BRAND } from '../../models/ProductLine';
import { HealthTabPager } from './HealthTabPager';
import { HealthFaqPanel } from './HealthFaqPanel';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { spacing } from '../../theme/designTokens';
import { TabScreenShell } from '../app/TabScreenShell';
import type { SectionIntelligence } from '../../features/v3/models/sectionIntelligence';
import type { HealthSnapshot } from '../../core/types/health';
import type { WearableHealthMetrics } from '../../services/wearableHealth/types';
import { HealthPolePage } from './HealthPolePage';

interface HealthHomeScreenProps {
  profile: User;
  onOpenChat: (threadId: string) => void;
  onOpenMessages: () => void;
  onBookPhysio: (physio: User) => void;
  intelligence?: SectionIntelligence | null;
  healthSnapshot?: HealthSnapshot;
  wearableConnected?: boolean;
  wearableMetrics?: WearableHealthMetrics | null;
  wearablePlatformLabel?: string;
  wearableSyncing?: boolean;
  wearableError?: string | null;
  onWearableConnect?: () => void;
  onWearableRefresh?: () => void;
}

const pagePad = {
  paddingHorizontal: spacing.lg,
  paddingBottom: TAB_BAR_CONTENT_INSET + spacing.sm,
};

export const HealthHomeScreen: React.FC<HealthHomeScreenProps> = ({
  profile,
  onOpenChat,
  onOpenMessages,
  onBookPhysio,
  healthSnapshot,
  wearableConnected,
  wearableMetrics,
  wearablePlatformLabel,
  wearableSyncing,
  wearableError,
  onWearableConnect,
  onWearableRefresh,
}) => {
  const [chapter, setChapter] = useState<HealthChapterId>('kine_osteo');

  const poleScroll = (child: React.ReactNode) => (
    <ScrollView
      contentContainerStyle={pagePad}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
      {child}
    </ScrollView>
  );

  const pages = [
    {
      id: 'kine_osteo' as const,
      render: () =>
        poleScroll(
          <HealthPolePage
            profile={profile}
            poleGroup="kine_osteo"
            onOpenChat={onOpenChat}
            onOpenMessages={onOpenMessages}
            onBookPhysio={onBookPhysio}
          />
        ),
    },
    {
      id: 'medecin_prepa' as const,
      render: () =>
        poleScroll(
          <HealthPolePage
            profile={profile}
            poleGroup="medecin_prepa"
            onOpenChat={onOpenChat}
            onOpenMessages={onOpenMessages}
            onBookPhysio={onBookPhysio}
          />
        ),
    },
    {
      id: 'mental' as const,
      render: () =>
        poleScroll(
          <HealthPolePage
            profile={profile}
            poleGroup="mental"
            onOpenChat={onOpenChat}
            onOpenMessages={onOpenMessages}
            onBookPhysio={onBookPhysio}
          />
        ),
    },
    {
      id: 'nutrition' as const,
      render: () =>
        poleScroll(
          <HealthPolePage
            profile={profile}
            poleGroup="nutrition"
            onOpenChat={onOpenChat}
            onOpenMessages={onOpenMessages}
            onBookPhysio={onBookPhysio}
          />
        ),
    },
    {
      id: 'podologie' as const,
      render: () =>
        poleScroll(
          <HealthPolePage
            profile={profile}
            poleGroup="podologie"
            onOpenChat={onOpenChat}
            onOpenMessages={onOpenMessages}
            onBookPhysio={onBookPhysio}
          />
        ),
    },
    {
      id: 'conseils' as const,
      render: () => (
        <ScrollView
          contentContainerStyle={pagePad}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          <HealthFaqPanel
            healthSnapshot={healthSnapshot}
            wearableConnected={wearableConnected}
            wearableMetrics={wearableMetrics}
            wearablePlatformLabel={wearablePlatformLabel}
            wearableSyncing={wearableSyncing}
            wearableError={wearableError}
            onWearableConnect={onWearableConnect}
            onWearableRefresh={onWearableRefresh}
          />
        </ScrollView>
      ),
    },
  ];

  return (
    <TabScreenShell
      caption={PRODAY_SANTE_BRAND.name}
      title="Santé"
      subtitle="Choisissez votre pôle, puis swipez pour explorer le contenu."
      flat
    >
      <HealthTabPager
        pages={pages}
        activeChapter={chapter}
        onChapterChange={setChapter}
      />
    </TabScreenShell>
  );
};

