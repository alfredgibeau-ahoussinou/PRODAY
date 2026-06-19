import React from 'react';
import type { User } from '../models/User';
import { SubscriptionPlanView } from '../components/subscription/SubscriptionPlanView';
import { SponsorPricingScreen } from '../components/sponsor/SponsorPricingScreen';

interface SubscriptionScreenProps {
  profile: User;
  onBack: () => void;
}

export const SubscriptionScreen: React.FC<SubscriptionScreenProps> = ({ profile, onBack }) => {
  if (profile.role === 'sponsor') {
    return <SponsorPricingScreen onBack={onBack} />;
  }
  return <SubscriptionPlanView profile={profile} onBack={onBack} />;
};
