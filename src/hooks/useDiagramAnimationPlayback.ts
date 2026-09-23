import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DiagramElement, ExerciseDiagramData } from '../models/ExerciseDiagram';
import type {
  ElementMovementAction,
  ExerciseAnimationStage,
  ExerciseDiagramAnimationData,
} from '../models/ExerciseDiagramAnimation';
import {
  computeStageInterpolation,
  getTotalAnimationDurationMs,
  resolveStageAndElapsedFromTotalMs,
} from '../utils/diagramAnimationEngine';

export interface UseDiagramAnimationPlaybackOptions {
  autoPlay?: boolean;
  initialSpeed?: number;
}

export interface DiagramAnimationPlaybackState {
  isPlaying: boolean;
  currentStageIndex: number;
  currentStage: ExerciseAnimationStage | null;
  stageCount: number;
  elapsedStageMs: number;
  stageDurationMs: number;
  stageProgress: number; // 0 à 1
  totalElapsedMs: number;
  totalDurationMs: number;
  totalProgress: number; // 0 à 1
  playbackSpeed: number;
  isLooping: boolean;
  interpolatedElements: DiagramElement[];
  activeMovements: ElementMovementAction[];
  ballCarrierId?: string;
  hasAnimation: boolean;
}

export interface DiagramAnimationPlaybackActions {
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  restart: () => void;
  nextStage: () => void;
  prevStage: () => void;
  goToStage: (index: number) => void;
  seekToStageProgress: (progressRatio: number) => void;
  seekToTotalProgress: (progressRatio: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  setIsLooping: (loop: boolean) => void;
}

export function useDiagramAnimationPlayback(
  diagram: ExerciseDiagramData,
  options: UseDiagramAnimationPlaybackOptions = {},
): [DiagramAnimationPlaybackState, DiagramAnimationPlaybackActions] {
  const animation: ExerciseDiagramAnimationData | undefined = diagram.animation;
  const stages = useMemo(() => animation?.stages || [], [animation?.stages]);
  const hasAnimation = stages.length > 0;

  const totalDurationMs = useMemo(() => {
    return animation ? getTotalAnimationDurationMs(animation) : 0;
  }, [animation]);

  const [isPlaying, setIsPlaying] = useState<boolean>(Boolean(options.autoPlay && hasAnimation));
  const [currentStageIdx, setCurrentStageIdx] = useState<number>(0);
  const [elapsedStageMs, setElapsedStageMs] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeedState] = useState<number>(
    options.initialSpeed || animation?.playbackSpeed || 1.0,
  );
  const [isLooping, setIsLoopingState] = useState<boolean>(animation?.loop !== false);

  const isPlayingRef = useRef<boolean>(isPlaying);
  isPlayingRef.current = isPlaying;

  const playbackSpeedRef = useRef<number>(playbackSpeed);
  playbackSpeedRef.current = playbackSpeed;

  const isLoopingRef = useRef<boolean>(isLooping);
  isLoopingRef.current = isLooping;

  const currentStageIdxRef = useRef<number>(currentStageIdx);
  currentStageIdxRef.current = currentStageIdx;

  const elapsedStageMsRef = useRef<number>(elapsedStageMs);
  elapsedStageMsRef.current = elapsedStageMs;

  const rafIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const currentStage = stages[currentStageIdx] || null;
  const currentStageDuration = currentStage
    ? currentStage.durationMs + (currentStage.pauseAfterMs || 0)
    : 3000;

  // Calcul instantané des éléments interpolés
  const interpolation = useMemo(() => {
    if (!currentStage) {
      return {
        elements: diagram.elements || [],
        activeMovements: [],
        ballCarrierId: undefined,
        stageProgress: 0,
      };
    }
    return computeStageInterpolation(currentStage, elapsedStageMs, diagram.elements || []);
  }, [currentStage, elapsedStageMs, diagram.elements]);

  // Calcul du temps total écoulé
  const totalElapsedMs = useMemo(() => {
    if (!hasAnimation || stages.length === 0) return 0;
    let acc = 0;
    for (let i = 0; i < currentStageIdx; i++) {
      acc += stages[i].durationMs + (stages[i].pauseAfterMs || 0);
    }
    return acc + elapsedStageMs;
  }, [hasAnimation, stages, currentStageIdx, elapsedStageMs]);

  const totalProgress = totalDurationMs > 0 ? Math.min(1, totalElapsedMs / totalDurationMs) : 0;

  // Boucle d'animation avec requestAnimationFrame
  const animateTick = useCallback((now: number) => {
    if (!isPlayingRef.current) return;

    if (lastTimeRef.current === null) {
      lastTimeRef.current = now;
    }

    const deltaRealMs = now - lastTimeRef.current;
    lastTimeRef.current = now;

    // Plafonner deltaRealMs à 100ms pour éviter les sauts si l'onglet était inactif
    const cappedDelta = Math.min(100, Math.max(0, deltaRealMs));
    const deltaSimulatedMs = cappedDelta * playbackSpeedRef.current;

    const currentIdx = currentStageIdxRef.current;
    const stage = stages[currentIdx];

    if (!stage) {
      setIsPlaying(false);
      return;
    }

    const stageTotalMs = stage.durationMs + (stage.pauseAfterMs || 0);
    const nextElapsed = elapsedStageMsRef.current + deltaSimulatedMs;

    if (nextElapsed < stageTotalMs) {
      setElapsedStageMs(nextElapsed);
    } else {
      // Fin de l'étape courante
      if (currentIdx < stages.length - 1) {
        // Passage à l'étape suivante
        const nextIdx = currentIdx + 1;
        setCurrentStageIdx(nextIdx);
        setElapsedStageMs(0);
        if (animation?.autoPauseBetweenStages) {
          setIsPlaying(false);
        }
      } else {
        // Fin de la dernière étape
        if (isLoopingRef.current) {
          setCurrentStageIdx(0);
          setElapsedStageMs(0);
        } else {
          setElapsedStageMs(stageTotalMs);
          setIsPlaying(false);
        }
      }
    }

    rafIdRef.current = requestAnimationFrame(animateTick);
  }, [stages, animation?.autoPauseBetweenStages]);

  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = null;
      rafIdRef.current = requestAnimationFrame(animateTick);
    } else {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      lastTimeRef.current = null;
    }

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [isPlaying, animateTick]);

  // Actions utilisateur
  const play = useCallback(() => {
    if (!hasAnimation) return;
    // Si on est à la fin sans boucle, redémarrer
    const isAtEnd =
      currentStageIdx === stages.length - 1 &&
      elapsedStageMs >= currentStageDuration;
    if (isAtEnd) {
      setCurrentStageIdx(0);
      setElapsedStageMs(0);
    }
    setIsPlaying(true);
  }, [hasAnimation, currentStageIdx, stages.length, elapsedStageMs, currentStageDuration]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, pause, play]);

  const restart = useCallback(() => {
    setCurrentStageIdx(0);
    setElapsedStageMs(0);
    setIsPlaying(true);
  }, []);

  const goToStage = useCallback((index: number) => {
    const validIdx = Math.max(0, Math.min(stages.length - 1, index));
    setCurrentStageIdx(validIdx);
    setElapsedStageMs(0);
  }, [stages.length]);

  const nextStage = useCallback(() => {
    if (currentStageIdx < stages.length - 1) {
      goToStage(currentStageIdx + 1);
    }
  }, [currentStageIdx, stages.length, goToStage]);

  const prevStage = useCallback(() => {
    if (currentStageIdx > 0) {
      goToStage(currentStageIdx - 1);
    } else {
      setElapsedStageMs(0);
    }
  }, [currentStageIdx, goToStage]);

  const seekToStageProgress = useCallback(
    (progressRatio: number) => {
      if (!currentStage) return;
      const clamped = Math.max(0, Math.min(1, progressRatio));
      const targetMs = clamped * (currentStage.durationMs + (currentStage.pauseAfterMs || 0));
      setElapsedStageMs(targetMs);
    },
    [currentStage],
  );

  const seekToTotalProgress = useCallback(
    (progressRatio: number) => {
      if (!animation || totalDurationMs <= 0) return;
      const clamped = Math.max(0, Math.min(1, progressRatio));
      const targetTotalMs = clamped * totalDurationMs;
      const resolved = resolveStageAndElapsedFromTotalMs(animation, targetTotalMs);
      setCurrentStageIdx(resolved.stageIndex);
      setElapsedStageMs(resolved.stageElapsedMs);
    },
    [animation, totalDurationMs],
  );

  const setPlaybackSpeed = useCallback((speed: number) => {
    setPlaybackSpeedState(speed);
  }, []);

  const setIsLooping = useCallback((loop: boolean) => {
    setIsLoopingState(loop);
  }, []);

  const state: DiagramAnimationPlaybackState = {
    isPlaying,
    currentStageIndex: currentStageIdx,
    currentStage,
    stageCount: stages.length,
    elapsedStageMs,
    stageDurationMs: currentStageDuration,
    stageProgress: interpolation.stageProgress,
    totalElapsedMs,
    totalDurationMs,
    totalProgress,
    playbackSpeed,
    isLooping,
    interpolatedElements: interpolation.elements,
    activeMovements: interpolation.activeMovements,
    ballCarrierId: interpolation.ballCarrierId,
    hasAnimation,
  };

  const actions: DiagramAnimationPlaybackActions = {
    play,
    pause,
    togglePlay,
    restart,
    nextStage,
    prevStage,
    goToStage,
    seekToStageProgress,
    seekToTotalProgress,
    setPlaybackSpeed,
    setIsLooping,
  };

  return [state, actions];
}
