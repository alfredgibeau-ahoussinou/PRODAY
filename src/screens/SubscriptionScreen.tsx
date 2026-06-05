import React from 'react';
import type { User } from '../models/User';
import { SubscriptionPlanView } from '../components/subscription/SubscriptionPlanView';

interface SubscriptionScreenProps {
  profile: User;
  onBack: () => void;
}

export const SubscriptionScreen: React.FC<SubscriptionScreenProps> = (props) => (
  <SubscriptionPlanView {...props} />
);
