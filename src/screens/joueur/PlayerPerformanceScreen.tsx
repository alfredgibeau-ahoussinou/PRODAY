import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SmartTacticsPortalScreen } from '../smartTactics/SmartTacticsPortalScreen';
import { JoueurScreenChrome } from '../../components/joueur/JoueurScreenChrome';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';

/** Performance joueur — Smart Tactics en mode player, empty states honnêtes. */
export function PlayerPerformanceScreen() {
  return (
    <JoueurScreenChrome variant="tab" hideHero>
      <View style={[styles.body, { paddingBottom: TAB_BAR_CONTENT_INSET }]}>
        <SmartTacticsPortalScreen />
      </View>
    </JoueurScreenChrome>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
});
