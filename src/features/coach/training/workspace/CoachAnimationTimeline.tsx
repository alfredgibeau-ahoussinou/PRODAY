import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { Drill, DrillFrame } from './trainingWorkspaceModel';
import { getDrillTotalDurationMs } from './CoachDrillAnimationEngine';

interface Props {
  drill: Drill;
  activeFrameIndex: number;
  onSelectFrame: (index: number) => void;
  onAddFrame: () => void;
  onDuplicateFrame: (index: number) => void;
  onDeleteFrame: (index: number) => void;
  onAdjustDuration: (index: number, deltaMs: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onRestart: () => void;
  onStepFrame: (direction: -1 | 1) => void;
  playbackSpeed: 0.5 | 1.0 | 2.0;
  onChangeSpeed: (speed: 0.5 | 1.0 | 2.0) => void;
  currentTimeMs: number;
  onScrubTime: (targetTimeMs: number) => void;
  showGhosts: boolean;
  onToggleGhosts: () => void;
}

export const CoachAnimationTimeline: React.FC<Props> = ({
  drill,
  activeFrameIndex,
  onSelectFrame,
  onAddFrame,
  onDuplicateFrame,
  onDeleteFrame,
  onAdjustDuration,
  isPlaying,
  onTogglePlay,
  onRestart,
  onStepFrame,
  playbackSpeed,
  onChangeSpeed,
  currentTimeMs,
  onScrubTime,
  showGhosts,
  onToggleGhosts,
}) => {
  const totalDurationMs = getDrillTotalDurationMs(drill);
  const activeFrame = drill.frames[activeFrameIndex] || drill.frames[0];
  const progressRatio = totalDurationMs > 0 ? Math.min(1, currentTimeMs / totalDurationMs) : 0;

  return (
    <View style={styles.root}>
      {/* 1. Barre de progression scrubbing & durée */}
      <View style={styles.scrubberRow}>
        <TouchableOpacity
          style={styles.scrubberTrack}
          activeOpacity={0.9}
          onPress={(e) => {
            const { locationX } = e.nativeEvent;
            // estimation proportionnelle
            const target = Math.max(0, Math.min(totalDurationMs, (locationX / 300) * totalDurationMs));
            onScrubTime(target);
          }}
        >
          <View style={[styles.scrubberFill, { width: `${progressRatio * 100}%` }]} />
        </TouchableOpacity>
        <Text style={styles.timeLabel}>
          {(currentTimeMs / 1000).toFixed(1)}s / {(totalDurationMs / 1000).toFixed(1)}s
        </Text>
      </View>

      {/* 2. Contrôles de lecture & Cadence */}
      <View style={styles.controlsRow}>
        <View style={styles.playbackBtnGroup}>
          <TouchableOpacity onPress={onRestart} style={styles.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="refresh" size={16} color="#E2E8F0" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => onStepFrame(-1)} style={styles.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="play-skip-back" size={16} color="#E2E8F0" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onTogglePlay}
            style={[styles.playBtn, isPlaying && styles.playBtnActive]}
            activeOpacity={0.85}
          >
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={18} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => onStepFrame(1)} style={styles.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="play-skip-forward" size={16} color="#E2E8F0" />
          </TouchableOpacity>
        </View>

        {/* Vitesse de lecture (0.5x, 1x, 2x) */}
        <View style={styles.speedGroup}>
          {([0.5, 1.0, 2.0] as const).map((spd) => (
            <TouchableOpacity
              key={`spd-${spd}`}
              onPress={() => onChangeSpeed(spd)}
              style={[styles.speedChip, playbackSpeed === spd && styles.speedChipActive]}
            >
              <Text style={[styles.speedText, playbackSpeed === spd && styles.speedTextActive]}>
                {spd}x
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Toggle des positions fantômes */}
        <TouchableOpacity
          onPress={onToggleGhosts}
          style={[styles.ghostToggle, showGhosts && styles.ghostToggleActive]}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name={showGhosts ? 'ghost' : 'ghost-off'}
            size={16}
            color={showGhosts ? '#38BDF8' : '#94A3B8'}
          />
          <Text style={[styles.ghostText, showGhosts && styles.ghostTextActive]}>Fantômes</Text>
        </TouchableOpacity>
      </View>

      {/* 3. Carrousel des Phases (Frames) */}
      <View style={styles.framesRow}>
        {drill.frames.map((frame, idx) => {
          const isActive = activeFrameIndex === idx;
          return (
            <View key={frame.id || idx} style={[styles.frameCard, isActive && styles.frameCardActive]}>
              <TouchableOpacity
                onPress={() => onSelectFrame(idx)}
                style={styles.frameHeaderTap}
                activeOpacity={0.8}
              >
                <Text style={[styles.frameTitle, isActive && styles.frameTitleActive]}>
                  {frame.title || `Phase ${idx + 1}`}
                </Text>
                <Text style={styles.frameDurationText}>
                  {((frame.durationMs || 2500) / 1000).toFixed(1)}s
                </Text>
              </TouchableOpacity>

              {isActive && (
                <View style={styles.frameActionsRow}>
                  <TouchableOpacity onPress={() => onAdjustDuration(idx, -500)} style={styles.durationBtn}>
                    <Text style={styles.durationBtnText}>-0.5s</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onAdjustDuration(idx, 500)} style={styles.durationBtn}>
                    <Text style={styles.durationBtnText}>+0.5s</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onDuplicateFrame(idx)} style={styles.microBtn}>
                    <Feather name="copy" size={12} color="#94A3B8" />
                  </TouchableOpacity>
                  {drill.frames.length > 1 && (
                    <TouchableOpacity onPress={() => onDeleteFrame(idx)} style={styles.microBtn}>
                      <Ionicons name="trash-outline" size={12} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          );
        })}

        {/* Bouton d'ajout de phase */}
        <TouchableOpacity onPress={onAddFrame} style={styles.addFrameBtn} activeOpacity={0.85}>
          <Ionicons name="add" size={16} color="#38BDF8" />
          <Text style={styles.addFrameText}>+ Nouvelle phase</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
  },
  scrubberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  scrubberTrack: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  scrubberFill: {
    height: '100%',
    backgroundColor: '#38BDF8',
  },
  timeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    fontVariant: ['tabular-nums'],
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  playbackBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    padding: 4,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#15803D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnActive: {
    backgroundColor: '#DC2626',
  },
  speedGroup: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  speedChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  speedChipActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  speedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  speedTextActive: {
    color: '#FFFFFF',
  },
  ghostToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  ghostToggleActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
  },
  ghostText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  ghostTextActive: {
    color: '#38BDF8',
  },
  framesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    overflow: 'scroll',
  },
  frameCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: 8,
    paddingVertical: 5,
    minWidth: 80,
  },
  frameCardActive: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  frameHeaderTap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  frameTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  frameTitleActive: {
    color: '#38BDF8',
    fontWeight: '800',
  },
  frameDurationText: {
    fontSize: 10,
    color: '#64748B',
  },
  frameActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  durationBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationBtnText: {
    fontSize: 9,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  microBtn: {
    padding: 2,
  },
  addFrameBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  addFrameText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
  },
});
