import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { User } from '../../models/User';
import type { FeedChapterId } from '../../content/feedChapters';
import { getFeedChapters } from '../../i18n/localizedChapters';
import { FeedScreen } from '../../screens/FeedScreen';
import { ProDayTabPager } from '../ui/ProDayTabPager';
import { useAppTheme } from '../../context/ProductLineContext';
import { TabScreenShell } from '../app/TabScreenShell';
import { useTranslation } from '../../context/LocaleContext';

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
  const { t } = useTranslation();
  const chapters = useMemo(() => getFeedChapters(t), [t]);
  const [chapter, setChapter] = useState<FeedChapterId>('actualites');
  const isWoman = productLine === 'woman';

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
      chapters={chapters}
      pages={pages}
      activeChapter={chapter}
      onChapterChange={setChapter}
    />
  );

  const subtitle = isWoman ? t('feed.subtitle.woman') : t('feed.subtitle.default');

  return (
    <View style={styles.root}>
      <TabScreenShell
        caption={t('feed.caption')}
        title={t('feed.title')}
        subtitle={subtitle}
        flat
      >
        {pager}
      </TabScreenShell>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
});
