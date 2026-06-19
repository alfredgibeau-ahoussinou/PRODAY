import React from 'react';
import type { User } from '../../models/User';
import { FeedCommunityPage } from './FeedCommunityPage';

interface FeedHomeScreenProps {
  profile: User;
  onOpenChat: (threadId: string) => void;
  onOpenMessages: () => void;
}

export const FeedHomeScreen: React.FC<FeedHomeScreenProps> = (props) => (
  <FeedCommunityPage {...props} />
);
