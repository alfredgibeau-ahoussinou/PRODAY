import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { User } from '../../models/User';
import { useSubscription } from '../../context/SubscriptionContext';
import { UpgradePaywall } from './UpgradePaywall';
import { SubscriptionScreen } from '../../screens/SubscriptionScreen';
import { PushScreenTransition } from '../motion';
import { SubscriptionCheckoutBridge } from './SubscriptionCheckoutBridge';

interface SubscriptionShellProps {
  profile: User;
  children: React.ReactNode;
}

/** Paywall global + écran plans (au-dessus des onglets). */
export const SubscriptionShell: React.FC<SubscriptionShellProps> = ({
  profile,
  children,
}) => {
  const {
    upgradeFeature,
    clearUpgradePrompt,
    openPlansScreen,
    showPlansScreen,
    closePlansScreen,
  } = useSubscription();

  return (
    <View style={styles.root}>
      <SubscriptionCheckoutBridge />
      {children}
      <UpgradePaywall
        visible={upgradeFeature != null}
        feature={upgradeFeature}
        profile={profile}
        onClose={clearUpgradePrompt}
        onViewPlans={openPlansScreen}
      />
      <PushScreenTransition active={showPlansScreen}>
        {showPlansScreen ? (
          <SubscriptionScreen profile={profile} onBack={closePlansScreen} />
        ) : null}
      </PushScreenTransition>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
});
