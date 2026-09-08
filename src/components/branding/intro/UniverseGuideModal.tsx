import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeOut,
  FadeInDown,
} from 'react-native-reanimated';
import { Icon } from '../../ui/Icon';
import { ProDayText } from '../../ui/ProDayText';
import { PressableSpring } from '../../motion';
import { useReducedMotion } from '../../../motion';
import type { CarouselPoleId } from '../../../models/CarouselPole';
import { UNIVERSE_ACCENT } from './universeIntroAccents';
import { resolveUniverseCtaAccent } from './universeEntryAuth';
import { brandVariantForCarouselPole } from './universePoleBrand';
import { poleOnAccent } from '../../../theme/prodayBrand';
import {
  filterGuideLeadBranchForLines,
  filterGuideRootForLines,
  resolveGuidePoleInLines,
  universeGuideResultCopy,
  type UniverseGuideRootChoice,
} from './universeGuideContent';

type GuidePhase = 'root' | 'lead' | 'result';

interface UniverseGuideModalProps {
  visible: boolean;
  lines: CarouselPoleId[];
  onClose: () => void;
  /** Aligne le carousel sur le pôle recommandé (source de vérité = univers). */
  onSelectPole: (pole: CarouselPoleId) => void;
}

/**
 * Guide d’orientation plein écran — 1 à 2 questions, sans doubler le carousel.
 * Remplace l’ancien modal dense « Orientation Express ».
 */
export const UniverseGuideModal: React.FC<UniverseGuideModalProps> = ({
  visible,
  lines,
  onClose,
  onSelectPole,
}) => {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<GuidePhase>('root');
  const [resultPole, setResultPole] = useState<CarouselPoleId | null>(null);

  const rootChoices = useMemo(() => filterGuideRootForLines(lines), [lines]);
  const leadChoices = useMemo(() => filterGuideLeadBranchForLines(lines), [lines]);

  useEffect(() => {
    if (!visible) {
      setPhase('root');
      setResultPole(null);
    }
  }, [visible]);

  const pickPole = useCallback(
    (pole: CarouselPoleId) => {
      const resolved = resolveGuidePoleInLines(pole, lines);
      if (!resolved) return;
      setResultPole(resolved);
      setPhase('result');
    },
    [lines],
  );

  const onRoot = useCallback(
    (choice: UniverseGuideRootChoice) => {
      if (choice.branch === 'lead') {
        setPhase('lead');
        return;
      }
      if (choice.pole) pickPole(choice.pole);
    },
    [pickPole],
  );

  const confirm = useCallback(() => {
    if (!resultPole) return;
    onSelectPole(resultPole);
    onClose();
  }, [resultPole, onSelectPole, onClose]);

  const goBack = useCallback(() => {
    if (phase === 'result') {
      setResultPole(null);
      setPhase('root');
      return;
    }
    if (phase === 'lead') {
      setPhase('root');
      return;
    }
    onClose();
  }, [phase, onClose]);

  if (!visible) return null;

  const accent = resultPole
    ? resolveUniverseCtaAccent(resultPole)
    : '#C5A059';
  const onAccent = resultPole
    ? poleOnAccent(brandVariantForCarouselPole(resultPole))
    : '#07100C';
  const resultCopy = resultPole ? universeGuideResultCopy(resultPole) : null;

  const enter = reduced ? undefined : FadeIn.duration(220);
  const exit = reduced ? undefined : FadeOut.duration(160);
  const stepIn = reduced ? undefined : FadeInDown.duration(280).springify().damping(18);

  return (
    <Animated.View
      entering={enter}
      exiting={exit}
      style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 20 }]}
      accessibilityViewIsModal
      accessibilityLabel="Aide au choix d’univers"
    >
      <View style={styles.topBar}>
        <Pressable
          onPress={goBack}
          hitSlop={16}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel={phase === 'root' ? 'Fermer le guide' : 'Retour'}
        >
          <Icon name={phase === 'root' ? 'close' : 'arrow-back'} size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={styles.stage}>
        {phase === 'root' ? (
          <Animated.View key="root" entering={stepIn} style={styles.block}>
            <ProDayText variant="eyebrow" style={styles.kicker}>
              Aide au choix
            </ProDayText>
            <ProDayText variant="title" style={styles.title}>
              Quelle est votre place dans le football ?
            </ProDayText>
            <ProDayText variant="body" style={styles.sub}>
              Une réponse, et on vous place sur le bon univers.
            </ProDayText>
            <View style={styles.choices}>
              {rootChoices.map((choice) => {
                const poleAccent = choice.pole
                  ? UNIVERSE_ACCENT[choice.pole]
                  : '#C5A059';
                return (
                  <PressableSpring
                    key={choice.id}
                    onPress={() => onRoot(choice)}
                    scaleTo={0.98}
                    haptic
                    style={styles.choiceRow}
                    accessibilityRole="button"
                    accessibilityLabel={choice.label}
                  >
                    <View style={[styles.choiceDot, { backgroundColor: poleAccent }]} />
                    <View style={styles.choiceCopy}>
                      <ProDayText variant="section" style={styles.choiceLabel}>
                        {choice.label}
                      </ProDayText>
                      <ProDayText variant="caption" style={styles.choiceHint}>
                        {choice.hint}
                      </ProDayText>
                    </View>
                    <Icon name="chevron-forward" size={16} color="rgba(255,255,255,0.35)" />
                  </PressableSpring>
                );
              })}
            </View>
          </Animated.View>
        ) : null}

        {phase === 'lead' ? (
          <Animated.View key="lead" entering={stepIn} style={styles.block}>
            <ProDayText variant="eyebrow" style={styles.kicker}>
              Encadrement
            </ProDayText>
            <ProDayText variant="title" style={styles.title}>
              Sous quel angle ?
            </ProDayText>
            <ProDayText variant="body" style={styles.sub}>
              Coach, structure club, ou direction.
            </ProDayText>
            <View style={styles.choices}>
              {leadChoices.map((choice) => {
                const poleAccent = UNIVERSE_ACCENT[choice.pole];
                return (
                  <PressableSpring
                    key={choice.pole}
                    onPress={() => pickPole(choice.pole)}
                    scaleTo={0.98}
                    haptic
                    style={styles.choiceRow}
                    accessibilityRole="button"
                    accessibilityLabel={choice.label}
                  >
                    <View style={[styles.choiceDot, { backgroundColor: poleAccent }]} />
                    <View style={styles.choiceCopy}>
                      <ProDayText variant="section" style={styles.choiceLabel}>
                        {choice.label}
                      </ProDayText>
                      <ProDayText variant="caption" style={styles.choiceHint}>
                        {choice.hint}
                      </ProDayText>
                    </View>
                    <Icon name="chevron-forward" size={16} color="rgba(255,255,255,0.35)" />
                  </PressableSpring>
                );
              })}
            </View>
          </Animated.View>
        ) : null}

        {phase === 'result' && resultPole && resultCopy ? (
          <Animated.View key="result" entering={stepIn} style={styles.resultBlock}>
            <View style={[styles.resultMark, { backgroundColor: `${accent}22` }]}>
              <Icon name={resultCopy.icon} size={28} color={accent} />
            </View>
            <ProDayText variant="eyebrow" style={[styles.kicker, { color: accent }]}>
              Votre univers
            </ProDayText>
            <ProDayText variant="hero" style={styles.resultTitle}>
              {resultCopy.title}
            </ProDayText>
            <ProDayText variant="body" style={styles.resultLine}>
              {resultCopy.line}
            </ProDayText>
            <PressableSpring
              onPress={confirm}
              scaleTo={0.97}
              haptic
              style={[styles.confirmBtn, { backgroundColor: accent }]}
              accessibilityRole="button"
              accessibilityLabel={resultCopy.cta}
            >
              <ProDayText
                variant="section"
                style={[styles.confirmText, { color: onAccent }]}
              >
                {resultCopy.cta}
              </ProDayText>
            </PressableSpring>
            <Pressable onPress={() => { setResultPole(null); setPhase('root'); }} hitSlop={12}>
              <ProDayText variant="caption" style={styles.retry}>
                Ce n’est pas ça — recommencer
              </ProDayText>
            </Pressable>
          </Animated.View>
        ) : null}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    zIndex: 40,
    paddingHorizontal: 24,
  },
  topBar: {
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stage: {
    flex: 1,
    justifyContent: 'center',
  },
  block: {
    gap: 10,
  },
  kicker: {
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
    lineHeight: 34,
  },
  sub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  choices: {
    gap: 4,
  },
  choiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  choiceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  choiceCopy: {
    flex: 1,
    gap: 2,
  },
  choiceLabel: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  choiceHint: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    lineHeight: 18,
  },
  resultBlock: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
  },
  resultMark: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  resultTitle: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  resultLine: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: 16,
  },
  confirmBtn: {
    minHeight: 54,
    borderRadius: 27,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    maxWidth: 360,
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  retry: {
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    marginTop: 14,
    fontWeight: '600',
  },
});
