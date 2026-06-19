import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { User } from '../../models/User';
import { AnimatedModalShell } from '../motion/AnimatedModalShell';
import { FeedScreen } from '../../screens/FeedScreen';
import { useTranslation } from '../../context/LocaleContext';

interface FeedPublishModalProps {
  visible: boolean;
  profile: User;
  onClose: () => void;
  onOpenChat: (threadId: string) => void;
  onOpenMessages: () => void;
}

export const FeedPublishModal: React.FC<FeedPublishModalProps> = ({
  visible,
  profile,
  onClose,
  onOpenChat,
  onOpenMessages,
}) => {
  const { t } = useTranslation();

  return (
    <AnimatedModalShell visible={visible} onClose={onClose} closeLabel={t('common.close')}>
      <View style={styles.root}>
        <FeedScreen
          profile={profile}
          panel="compose"
          onBack={onClose}
          onOpenChat={onOpenChat}
          onOpenMessages={onOpenMessages}
        />
      </View>
    </AnimatedModalShell>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
});
