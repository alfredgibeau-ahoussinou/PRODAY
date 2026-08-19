import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProDayText } from '../../components/ui/ProDayText';
import { PressableSpring } from '../../components/motion';
import { Icon } from '../../components/ui/Icon';
import { JoueurTacticsCoachChat } from '../../components/player/JoueurTacticsCoachChat';
import { JoueurArcadeShell } from '../../features/joueur/JoueurGameFx';
import { useJoueurSession } from '../../context/JoueurSessionContext';
import { JOUEUR_SITE } from '../../content/joueurPageIdentity';
import { joueurGamePress } from '../../features/joueur/joueurSfx';
import { spacing } from '../../theme/designTokens';

type Props = {
  onBack: () => void;
};

/** Écran plein Coach IA — football & tactique. */
export function JoueurTacticsCoachScreen({ onBack }: Props) {
  const session = useJoueurSession();
  const insets = useSafeAreaInsets();
  const identity = session?.identity;
  const accent = identity?.accent ?? '#4C8BFF';

  if (!identity) {
    return (
      <View style={[styles.fallback, { paddingTop: insets.top }]}>
        <ProDayText variant="section" style={{ color: JOUEUR_SITE.foreground }}>
          Coach IA
        </ProDayText>
        <JoueurTacticsCoachChat />
        <PressableSpring
          onPress={() => {
            joueurGamePress();
            onBack();
          }}
          style={styles.backFab}
        >
          <ProDayText variant="caption" style={{ color: accent, fontWeight: '800' }}>
            Fermer
          </ProDayText>
        </PressableSpring>
      </View>
    );
  }

  return (
    <JoueurArcadeShell identity={identity} liveLabel="COACH IA" bootSound={false}>
      <View style={[styles.head, { paddingTop: Math.max(insets.top, 12) }]}>
        <PressableSpring
          onPress={() => {
            joueurGamePress();
            onBack();
          }}
          scaleTo={0.97}
          haptic
          style={[styles.backBtn, { borderColor: JOUEUR_SITE.border }]}
          accessibilityLabel="Retour"
        >
          <Icon name="arrow-back" size={18} color={JOUEUR_SITE.foreground} />
        </PressableSpring>
        <View style={styles.headCopy}>
          <ProDayText variant="caption" style={[styles.kicker, { color: accent }]}>
            PASS IA · TACTIQUE
          </ProDayText>
          <ProDayText variant="title" style={styles.title}>
            Coach IA
          </ProDayText>
          <ProDayText variant="caption" style={styles.sub}>
            Football, principes de jeu, drills pour progresser.
          </ProDayText>
        </View>
      </View>
      <View style={styles.chat}>
        <JoueurTacticsCoachChat />
      </View>
    </JoueurArcadeShell>
  );
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    backgroundColor: JOUEUR_SITE.bg,
    padding: spacing.md,
    gap: spacing.md,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: JOUEUR_SITE.surface,
    marginTop: 4,
  },
  headCopy: { flex: 1, gap: 2 },
  kicker: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  title: {
    color: JOUEUR_SITE.foreground,
    fontWeight: '800',
    fontSize: 28,
    letterSpacing: -0.8,
  },
  sub: { color: JOUEUR_SITE.muted, fontSize: 13 },
  chat: { flex: 1, minHeight: 0 },
  backFab: {
    alignSelf: 'flex-start',
    padding: spacing.sm,
  },
});
