import React from 'react';
import { StyleSheet, View } from 'react-native';
import { JoueurScreenChrome } from '../../components/joueur/JoueurScreenChrome';
import { PlayerCoachAiChat } from '../../components/joueur/PlayerCoachAiChat';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';

/** Page plein écran Mon Coach IA. */
export function PlayerCoachAiScreen() {
  return (
    <JoueurScreenChrome variant="page" kicker="Coach IA" title="Mon Coach IA">
      <View style={[styles.body, { paddingBottom: TAB_BAR_CONTENT_INSET }]}>
        <PlayerCoachAiChat />
      </View>
    </JoueurScreenChrome>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
});
