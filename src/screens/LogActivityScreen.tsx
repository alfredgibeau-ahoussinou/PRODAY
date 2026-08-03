import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Alert, ActivityIndicator, TextInput, Switch } from 'react-native';
import { AnimatedModalShell } from '../components/motion/AnimatedModalShell';
import { ProDayText } from '../components/ui/ProDayText';
import { PressableSpring } from '../components/motion';
import { VoiceReflectionRecorder } from '../components/player/VoiceReflectionRecorder';
import { useAppTheme } from '../context/ProductLineContext';
import { useTranslation } from '../context/LocaleContext';
import { playerActivityService } from '../services/playerActivity.service';
import { playerPulseLeaderboardService } from '../services/playerPulseLeaderboard.service';
import { storageService } from '../services/storage.service';
import type { PlayerActivityType } from '../models/PlayerActivity';
import { PERFORMANCE_TAGS, type PerformanceTag } from '../utils/performanceTags';
import { computeMatchPulseRating, type MatchResult } from '../utils/prodayMatchRating';
import { spacing, radius } from '../theme/designTokens';

interface LogActivityScreenProps {
  visible: boolean;
  uid: string;
  displayName?: string;
  city?: string;
  level?: string;
  category?: string;
  clubId?: string;
  isGoalkeeper?: boolean;
  highlightVideoUrls?: string[];
  highlightGalleryUrls?: string[];
  onClose: () => void;
  onSaved: () => void;
}

const TYPES: PlayerActivityType[] = ['training', 'match', 'recovery'];
const RESULTS: MatchResult[] = ['win', 'draw', 'loss'];
const DRILL_PRESETS = ['technique', 'physique', 'tactique', 'gardien', 'set_pieces'] as const;

/** Formulaire journal d'activité — match + voix + cote. */
export const LogActivityScreen: React.FC<LogActivityScreenProps> = ({
  visible,
  uid,
  displayName,
  city,
  level,
  category,
  clubId,
  isGoalkeeper,
  highlightVideoUrls = [],
  highlightGalleryUrls = [],
  onClose,
  onSaved,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const [type, setType] = useState<PlayerActivityType>('training');
  const [duration, setDuration] = useState('60');
  const [goals, setGoals] = useState('');
  const [assists, setAssists] = useState('');
  const [yellow, setYellow] = useState('');
  const [red, setRed] = useState('');
  const [minutes, setMinutes] = useState('90');
  const [cleanSheet, setCleanSheet] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchResult | undefined>();
  const [rating, setRating] = useState('');
  const [notes, setNotes] = useState('');
  const [drills, setDrills] = useState<string[]>([]);
  const [intensity, setIntensity] = useState('3');
  const [videoUrl, setVideoUrl] = useState<string | undefined>();
  const [voiceUri, setVoiceUri] = useState<string | undefined>();
  const [performanceTags, setPerformanceTags] = useState<PerformanceTag[]>([]);
  const [saving, setSaving] = useState(false);

  const videos = useMemo(() => highlightVideoUrls.filter(Boolean), [highlightVideoUrls]);

  const previewPulse = useMemo(() => {
    if (type !== 'match') return null;
    return computeMatchPulseRating({
      goals: goals ? parseInt(goals, 10) : 0,
      assists: assists ? parseInt(assists, 10) : 0,
      yellow_cards: yellow ? parseInt(yellow, 10) : 0,
      red_cards: red ? parseInt(red, 10) : 0,
      minutes_played: minutes ? parseInt(minutes, 10) : Number(duration) || 90,
      clean_sheet: cleanSheet,
      match_result: matchResult,
      rating_self: rating ? parseInt(rating, 10) : undefined,
      is_goalkeeper: isGoalkeeper,
      performance_tags_count: performanceTags.length,
    });
  }, [
    type,
    goals,
    assists,
    yellow,
    red,
    minutes,
    duration,
    cleanSheet,
    matchResult,
    rating,
    isGoalkeeper,
    performanceTags.length,
  ]);

  useEffect(() => {
    if (!visible) {
      setType('training');
      setDuration('60');
      setGoals('');
      setAssists('');
      setYellow('');
      setRed('');
      setMinutes('90');
      setCleanSheet(false);
      setMatchResult(undefined);
      setRating('');
      setNotes('');
      setDrills([]);
      setIntensity('3');
      setVideoUrl(undefined);
      setVoiceUri(undefined);
      setPerformanceTags([]);
    }
  }, [visible]);

  const toggleTag = (tag: PerformanceTag) => {
    setPerformanceTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleDrill = (drill: string) => {
    setDrills((prev) => (prev.includes(drill) ? prev.filter((d) => d !== drill) : [...prev, drill]));
  };

  const bump = (value: string, setter: (v: string) => void, max = 20) => {
    setter(String(Math.min(max, (parseInt(value, 10) || 0) + 1)));
  };

  const handleSave = async () => {
    const durationMin = parseInt(duration, 10);
    if (!Number.isFinite(durationMin) || durationMin <= 0) {
      Alert.alert(t('activity.log.error'), t('activity.log.durationRequired'));
      return;
    }

    setSaving(true);
    try {
      const minutesPlayed =
        type === 'match'
          ? parseInt(minutes, 10) || durationMin
          : undefined;
      const ratingPulse =
        type === 'match'
          ? computeMatchPulseRating({
              goals: goals ? parseInt(goals, 10) : 0,
              assists: assists ? parseInt(assists, 10) : 0,
              yellow_cards: yellow ? parseInt(yellow, 10) : 0,
              red_cards: red ? parseInt(red, 10) : 0,
              minutes_played: minutesPlayed,
              clean_sheet: cleanSheet,
              match_result: matchResult,
              rating_self: rating ? parseInt(rating, 10) : undefined,
              is_goalkeeper: isGoalkeeper,
              performance_tags_count: performanceTags.length,
            })
          : undefined;

      const activityId = await playerActivityService.create(
        {
          player_uid: uid,
          type,
          date: new Date(),
          duration_min: durationMin,
          goals: type === 'match' && goals ? parseInt(goals, 10) : undefined,
          assists: type === 'match' && assists ? parseInt(assists, 10) : undefined,
          yellow_cards: type === 'match' && yellow ? parseInt(yellow, 10) : undefined,
          red_cards: type === 'match' && red ? parseInt(red, 10) : undefined,
          minutes_played: minutesPlayed,
          clean_sheet: type === 'match' ? cleanSheet : undefined,
          match_result: type === 'match' ? matchResult : undefined,
          rating_pulse: ratingPulse,
          rating_self: rating ? parseInt(rating, 10) : undefined,
          notes: notes.trim() || undefined,
          drills: type === 'training' && drills.length ? drills : undefined,
          intensity: type === 'training' && intensity ? parseInt(intensity, 10) : undefined,
          video_url: type === 'match' ? videoUrl : undefined,
          performance_tags: performanceTags.length ? performanceTags : undefined,
          source: 'manual',
        },
        {
          highlightVideoUrls: highlightVideoUrls,
          galleryUrls: highlightGalleryUrls,
        }
      );

      if (voiceUri && type === 'match') {
        try {
          const url = await storageService.uploadVoiceReflection(uid, activityId, voiceUri);
          await playerActivityService.setVoiceReflectionUrl(activityId, uid, url);
        } catch (voiceErr) {
          console.warn('[LogActivity] voice upload:', voiceErr);
        }
      }

      if (type === 'match' && displayName) {
        const activities = await playerActivityService.listForPlayer(uid, 40);
        await playerPulseLeaderboardService.upsertFromActivities({
          uid,
          display_name: displayName,
          city,
          level,
          category,
          club_id: clubId,
          pulse_avg: ratingPulse ?? 0,
          matches_count: 0,
          goals: 0,
          assists: 0,
          activities,
        });
      }

      onSaved();
    } catch (e) {
      Alert.alert(t('activity.log.error'), e instanceof Error ? e.message : t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const adjustDuration = (delta: number) => {
    const current = parseInt(duration, 10) || 0;
    setDuration(String(Math.max(5, current + delta)));
  };

  return (
    <AnimatedModalShell visible={visible} onClose={onClose} closeLabel={t('common.close')}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ProDayText variant="title">{t('activity.log.title')}</ProDayText>
        <ProDayText variant="body" muted style={styles.sub}>
          {t('activity.log.subtitle')}
        </ProDayText>

        <ProDayText variant="caption" accent style={styles.label}>
          {t('activity.log.type')}
        </ProDayText>
        <View style={styles.typeRow}>
          {TYPES.map((item) => (
            <Pressable
              key={item}
              onPress={() => setType(item)}
              style={[
                styles.typeChip,
                {
                  backgroundColor: type === item ? colors.accentSoft : colors.surfaceMuted,
                  borderColor: type === item ? colors.accent : colors.border,
                },
              ]}
            >
              <ProDayText variant="caption" accent={type === item}>
                {t(`activity.type.${item}`)}
              </ProDayText>
            </Pressable>
          ))}
        </View>

        <ProDayText variant="caption" accent style={styles.label}>
          {t('activity.log.duration')}
        </ProDayText>
        <View style={styles.durationRow}>
          <PressableSpring onPress={() => adjustDuration(-15)} style={styles.stepBtn}>
            <ProDayText variant="section">−</ProDayText>
          </PressableSpring>
          <ProDayText variant="hero" style={styles.durationValue}>
            {duration} min
          </ProDayText>
          <PressableSpring onPress={() => adjustDuration(15)} style={styles.stepBtn}>
            <ProDayText variant="section">+</ProDayText>
          </PressableSpring>
        </View>

        {type === 'match' ? (
          <>
            <View style={styles.statsRow}>
              <View style={styles.statField}>
                <ProDayText variant="caption" muted>
                  {t('activity.log.goals')}
                </ProDayText>
                <PressableSpring onPress={() => bump(goals, setGoals)}>
                  <ProDayText variant="section" accent>
                    {goals || '0'}
                  </ProDayText>
                </PressableSpring>
              </View>
              <View style={styles.statField}>
                <ProDayText variant="caption" muted>
                  {t('activity.log.assists')}
                </ProDayText>
                <PressableSpring onPress={() => bump(assists, setAssists)}>
                  <ProDayText variant="section" accent>
                    {assists || '0'}
                  </ProDayText>
                </PressableSpring>
              </View>
              <View style={styles.statField}>
                <ProDayText variant="caption" muted>
                  {t('activity.log.minutes')}
                </ProDayText>
                <PressableSpring onPress={() => bump(minutes, setMinutes, 120)}>
                  <ProDayText variant="section" accent>
                    {minutes || '90'}
                  </ProDayText>
                </PressableSpring>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statField}>
                <ProDayText variant="caption" muted>
                  {t('activity.log.yellow')}
                </ProDayText>
                <PressableSpring onPress={() => bump(yellow, setYellow, 2)}>
                  <ProDayText variant="section" accent>
                    {yellow || '0'}
                  </ProDayText>
                </PressableSpring>
              </View>
              <View style={styles.statField}>
                <ProDayText variant="caption" muted>
                  {t('activity.log.red')}
                </ProDayText>
                <PressableSpring onPress={() => bump(red, setRed, 1)}>
                  <ProDayText variant="section" accent>
                    {red || '0'}
                  </ProDayText>
                </PressableSpring>
              </View>
              <View style={styles.statField}>
                <ProDayText variant="caption" muted>
                  {t('activity.log.rating')}
                </ProDayText>
                <PressableSpring
                  onPress={() => setRating(String(Math.min(10, (parseInt(rating, 10) || 0) + 1)))}
                >
                  <ProDayText variant="section" accent>
                    {rating || '…'}/10
                  </ProDayText>
                </PressableSpring>
              </View>
            </View>

            <View style={styles.switchRow}>
              <ProDayText variant="caption">{t('activity.log.cleanSheet')}</ProDayText>
              <Switch value={cleanSheet} onValueChange={setCleanSheet} />
            </View>

            <ProDayText variant="caption" accent style={styles.label}>
              {t('activity.log.result')}
            </ProDayText>
            <View style={styles.typeRow}>
              {RESULTS.map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setMatchResult(matchResult === r ? undefined : r)}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor:
                        matchResult === r ? colors.accentSoft : colors.surfaceMuted,
                      borderColor: matchResult === r ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <ProDayText variant="caption" accent={matchResult === r}>
                    {t(`activity.log.result.${r}`)}
                  </ProDayText>
                </Pressable>
              ))}
            </View>

            {previewPulse != null ? (
              <View style={[styles.pulsePreview, { backgroundColor: colors.accentSoft }]}>
                <ProDayText variant="caption" accent style={{ fontWeight: '800' }}>
                  {t('activity.log.pulsePreview', { score: previewPulse.toFixed(1) })}
                </ProDayText>
              </View>
            ) : null}

            {videos.length > 0 ? (
              <>
                <ProDayText variant="caption" accent style={styles.label}>
                  {t('activity.log.video')}
                </ProDayText>
                <View style={styles.videoRow}>
                  {videos.map((url, i) => (
                    <Pressable
                      key={url}
                      onPress={() => setVideoUrl(videoUrl === url ? undefined : url)}
                      style={[
                        styles.videoChip,
                        {
                          backgroundColor:
                            videoUrl === url ? colors.accentSoft : colors.surfaceMuted,
                          borderColor: videoUrl === url ? colors.accent : colors.border,
                        },
                      ]}
                    >
                      <ProDayText variant="caption" accent={videoUrl === url}>
                        {t('activity.log.videoOption', { n: i + 1 })}
                      </ProDayText>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}

            <ProDayText variant="caption" accent style={styles.label}>
              {t('activity.performance.title')}
            </ProDayText>
            <View style={styles.typeRow}>
              {PERFORMANCE_TAGS.map((tag) => (
                <Pressable
                  key={tag}
                  onPress={() => toggleTag(tag)}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor: performanceTags.includes(tag)
                        ? colors.accentSoft
                        : colors.surfaceMuted,
                      borderColor: performanceTags.includes(tag) ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <ProDayText variant="caption" accent={performanceTags.includes(tag)}>
                    {t(`activity.performance.${tag}`)}
                  </ProDayText>
                </Pressable>
              ))}
            </View>

            <ProDayText variant="caption" accent style={styles.label}>
              {t('activity.log.voice')}
            </ProDayText>
            <VoiceReflectionRecorder
              active={visible && type === 'match'}
              uri={voiceUri}
              onUriChange={setVoiceUri}
            />
          </>
        ) : null}

        {type === 'training' ? (
          <>
            <ProDayText variant="caption" accent style={styles.label}>
              {t('activity.log.drills')}
            </ProDayText>
            <View style={styles.typeRow}>
              {DRILL_PRESETS.map((drill) => (
                <Pressable
                  key={drill}
                  onPress={() => toggleDrill(drill)}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor: drills.includes(drill)
                        ? colors.accentSoft
                        : colors.surfaceMuted,
                      borderColor: drills.includes(drill) ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <ProDayText variant="caption" accent={drills.includes(drill)}>
                    {t(`activity.log.drill.${drill}`)}
                  </ProDayText>
                </Pressable>
              ))}
            </View>
            <ProDayText variant="caption" accent style={styles.label}>
              {t('activity.log.intensity')}
            </ProDayText>
            <View style={styles.typeRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable
                  key={n}
                  onPress={() => setIntensity(String(n))}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor:
                        intensity === String(n) ? colors.accentSoft : colors.surfaceMuted,
                      borderColor: intensity === String(n) ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <ProDayText variant="caption" accent={intensity === String(n)}>
                    {n}
                  </ProDayText>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        <ProDayText variant="caption" accent style={styles.label}>
          {t('activity.log.notes')}
        </ProDayText>
        <TextInput
          style={[
            styles.notesBox,
            { backgroundColor: colors.surfaceMuted, borderColor: colors.border, color: colors.text },
          ]}
          placeholder={t('activity.log.notesPlaceholder')}
          placeholderTextColor={colors.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
          maxLength={300}
        />

        <PressableSpring
          onPress={() => void handleSave()}
          disabled={saving}
          scaleTo={0.98}
          haptic
          style={[styles.saveBtn, { backgroundColor: colors.accent }]}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <ProDayText variant="section" inverse style={styles.saveText}>
              {t('activity.log.save')}
            </ProDayText>
          )}
        </PressableSpring>
      </ScrollView>
    </AnimatedModalShell>
  );
};

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xl * 2 },
  sub: { marginBottom: spacing.sm },
  label: { fontWeight: '800', marginTop: spacing.sm },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  typeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    marginVertical: spacing.sm,
  },
  stepBtn: { padding: spacing.md },
  durationValue: { fontWeight: '800', minWidth: 100, textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  statField: { flex: 1, alignItems: 'center', gap: 4 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  pulsePreview: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  videoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  videoChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  notesBox: {
    minHeight: 72,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  saveBtn: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  saveText: { fontWeight: '800' },
});
