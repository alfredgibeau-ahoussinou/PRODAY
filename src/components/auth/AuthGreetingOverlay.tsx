import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { BrandSessionReveal } from '../branding/intro/BrandSessionReveal';
import type { AuthGreetingPayload } from '../../services/authGreeting.controller';

interface AuthGreetingOverlayProps {
  greeting: AuthGreetingPayload;
  onDone: () => void;
}

/**
 * Overlay connect/disconnect : logo composé + Bienvenue | Au revoir
 * (remplace l’ancienne scène vidéo + scoreboard).
 */
export const AuthGreetingOverlay: React.FC<AuthGreetingOverlayProps> = ({
  greeting,
  onDone,
}) => {
  const tone = greeting.kind === 'goodbye' ? 'goodbye' : 'welcome';

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onDone}>
      <View style={styles.root}>
        <BrandSessionReveal tone={tone} onComplete={onDone} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
});
