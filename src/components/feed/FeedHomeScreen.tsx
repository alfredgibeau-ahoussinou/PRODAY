import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { User } from '../../models/User';
import { FEED_CHAPTERS, type FeedChapterId } from '../../content/feedChapters';
import { FeedScreen } from '../../screens/FeedScreen';
import { AppTabHeader } from '../app';
import { ProDayTabPager } from '../ui/ProDayTabPager';
import { useAppTheme } from '../../context/ProductLineContext';
import { V3TabShell } from '../v3/V3TabShell';
import { isV3ShellEnabled } from '../../config/featureFlags';
import { useSectionIntelligence } from '../../hooks/useSectionIntelligence';

interface FeedHomeScreenProps {
  profile: User;
  onOpenChat: (threadId: string) => void;
  onOpenMessages: () => void;
}

export const FeedHomeScreen: React.FC<FeedHomeScreenProps> = ({
  profile,
  onOpenChat,
  onOpenMessages,
}) => {
  const { productLine } = useAppTheme();
  const [chapter, setChapter] = useState<FeedChapterId>('actualites');
  const isWoman = productLine === 'woman';
  const useV3Header = isV3ShellEnabled();
  const intelligence = useSectionIntelligence('feed', profile, productLine);

  const pages = [
    {
      id: 'actualites' as const,
      render: () => (
        <FeedScreen
          profile={profile}
          panel="list"
          onOpenChat={onOpenChat}
          onOpenMessages={onOpenMessages}
        />
      ),
    },
    {
      id: 'publier' as const,
      render: () => (
        <FeedScreen
          profile={profile}
          panel="compose"
          onOpenChat={onOpenChat}
          onOpenMessages={onOpenMessages}
        />
      ),
    },
  ];

  const pager = (
    <ProDayTabPager
      chapters={FEED_CHAPTERS}
      pages={pages}
      activeChapter={chapter}
      onChapterChange={setChapter}
    />
  );

  const subtitle = isWoman
    ? 'Actualités et sondages du foot féminin'
    : 'Actualités et sondages de la plateforme';

  if (useV3Header) {
    return (
      <View style={styles.root}>
        <V3TabShell
          caption="Communauté"
          title="Fil"
          subtitle={subtitle}
          flat
          intelligence={intelligence}
          stats={[
            { value: profile.city ?? '—', label: 'Ville' },
            { value: profile.role === 'player' ? 'Joueur' : 'Staff', label: 'Rôle' },
            { value: 'IA', label: 'Tri actif', highlight: true },
          ]}
        >
          {pager}
        </V3TabShell>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <AppTabHeader title="Fil" subtitle={subtitle} />
      {pager}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
});
