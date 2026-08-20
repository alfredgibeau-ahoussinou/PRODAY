import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView, type VideoSource } from 'expo-video';
import { ProDayText } from '../../../components/ui/ProDayText';
import { SUPPORTER_SITE } from '../../../content/supporterPageIdentity';
import type { SupporterReplayChapter } from '../../../models/SupporterVideo';
import { spacing, radius } from '../../../theme/designTokens';

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

type Props = {
  watchUrl: string;
  chapters?: SupporterReplayChapter[];
  title?: string;
  onProgress?: (progressMs: number) => void;
};

export const SupporterReplayPlayer: React.FC<Props> = ({
  watchUrl,
  chapters = [],
  title,
  onProgress,
}) => {
  const [playing, setPlaying] = useState(true);
  const [speedIdx, setSpeedIdx] = useState(2);
  const [activeChapter, setActiveChapter] = useState<string | null>(null);

  const source = useMemo((): VideoSource => watchUrl, [watchUrl]);

  const player = useVideoPlayer(source, (instance) => {
    instance.loop = false;
    instance.playbackRate = SPEEDS[speedIdx];
  });

  useEffect(() => {
    player.playbackRate = SPEEDS[speedIdx];
  }, [player, speedIdx]);

  useEffect(() => {
    if (playing) player.play();
    else player.pause();
  }, [playing, player]);

  useEffect(() => {
    const sub = player.addListener('timeUpdate', ({ currentTime }) => {
      onProgress?.(Math.round(currentTime * 1000));
    });
    return () => sub.remove();
  }, [onProgress, player]);

  const seekTo = useCallback(
    (offsetMs: number, chapterId?: string) => {
      player.currentTime = offsetMs / 1000;
      setActiveChapter(chapterId ?? null);
      setPlaying(true);
      player.play();
    },
    [player],
  );

  const cycleSpeed = () => {
    setSpeedIdx((i) => (i + 1) % SPEEDS.length);
  };

  return (
    <View style={styles.root}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="contain"
        nativeControls={false}
        fullscreenOptions={{ enable: true }}
        allowsPictureInPicture
      />

      {title ? (
        <ProDayText variant="caption" style={styles.title}>
          {title}
        </ProDayText>
      ) : null}

      <View style={styles.controls}>
        <Pressable onPress={() => setPlaying((p) => !p)} style={styles.controlBtn} hitSlop={8}>
          <ProDayText variant="caption" style={styles.playLabel}>
            {playing ? '⏸' : '▶'}
          </ProDayText>
        </Pressable>
        <Pressable onPress={cycleSpeed} style={styles.speedBtn}>
          <ProDayText variant="caption" style={styles.speedText}>
            {SPEEDS[speedIdx]}x
          </ProDayText>
        </Pressable>
        <ProDayText variant="caption" style={styles.hint}>
          Timeline : minute match → offset vidéo (mi-temps +15 min)
        </ProDayText>
      </View>

      {chapters.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chapters}>
          {chapters.map((ch) => (
            <Pressable
              key={ch.id}
              onPress={() => seekTo(ch.offsetMs, ch.id)}
              style={[styles.chapter, activeChapter === ch.id && styles.chapterOn]}
            >
              <ProDayText variant="caption" style={styles.chapterMin}>
                {ch.minute}'
              </ProDayText>
              <ProDayText variant="caption" style={styles.chapterLabel} numberOfLines={2}>
                {ch.label}
              </ProDayText>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: radius.md,
    backgroundColor: SUPPORTER_SITE.deep,
  },
  title: { color: SUPPORTER_SITE.muted, paddingHorizontal: spacing.xs },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  controlBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SUPPORTER_SITE.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playLabel: { color: SUPPORTER_SITE.foreground, fontSize: 16 },
  speedBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SUPPORTER_SITE.border,
  },
  speedText: { color: SUPPORTER_SITE.accent, fontVariant: ['tabular-nums'] },
  hint: { flex: 1, color: SUPPORTER_SITE.muted, fontSize: 10, lineHeight: 14 },
  chapters: { gap: spacing.sm, paddingVertical: spacing.sm },
  chapter: {
    width: 120,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: SUPPORTER_SITE.elevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SUPPORTER_SITE.border,
    gap: 4,
  },
  chapterOn: { borderColor: SUPPORTER_SITE.accent, backgroundColor: SUPPORTER_SITE.soft },
  chapterMin: { color: SUPPORTER_SITE.accent, fontWeight: '700', fontVariant: ['tabular-nums'] },
  chapterLabel: { color: SUPPORTER_SITE.foreground, fontSize: 10, lineHeight: 13 },
});
