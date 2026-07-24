import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Alert, ActivityIndicator, TextInput } from 'react-native';
import { AnimatedModalShell } from '../components/motion/AnimatedModalShell';
import { ProDayText } from '../components/ui/ProDayText';
import { PressableSpring } from '../components/motion';
import { useAppTheme } from '../context/ProductLineContext';
import { useTranslation } from '../context/LocaleContext';
import { playerActivityService } from '../services/playerActivity.service';
import type { PlayerActivityType } from '../models/PlayerActivity';
import { PERFORMANCE_TAGS, type PerformanceTag } from '../utils/performanceTags';
import { spacing, radius } from '../theme/designTokens';

interface LogActivityScreenProps {
  visible: boolean;
  uid: string;
  highlightVideoUrls?: string[];
  highlightGalleryUrls?: string[];
  onClose: () => void;
  onSaved: () => void;
}

const TYPES: PlayerActivityType[] = ['training', 'match', 'recovery'];

/** Formulaire journal d'activité — lien vidéo highlight pour base analyse future (pas d'IA). */
export const LogActivityScreen: React.FC<LogActivityScreenProps> = ({
  visible,
  uid,
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
  const [rating, setRating] = useState('');
  const [notes, setNotes] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | undefined>();
  const [performanceTags, setPerformanceTags] = useState<PerformanceTag[]>([]);
  const [saving, setSaving] = useState(false);

  const videos = useMemo(() => highlightVideoUrls.filter(Boolean), [highlightVideoUrls]);

  useEffect(() => {
    if (!visible) {
      setType('training');
      setDuration('60');
      setGoals('');
      setAssists('');
      setRating('');
      setNotes('');
      setVideoUrl(undefined);
      setPerformanceTags([]);
    }
  }, [visible]);

  const toggleTag = (tag: PerformanceTag) => {
    setPerformanceTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = async () => {
    const durationMin = parseInt(duration, 10);
    if (!Number.isFinite(durationMin) || durationMin <= 0) {
      Alert.alert(t('activity.log.error'), t('activity.log.durationRequired'));
      return;
    }

    setSaving(true);
    try {
      await playerActivityService.create(
        {
          player_uid: uid,
          type,
          date: new Date(),
          duration_min: durationMin,
          goals: type === 'match' && goals ? parseInt(goals, 10) : undefined,
          assists: type === 'match' && assists ? parseInt(assists, 10) : undefined,
          rating_self: rating ? parseInt(rating, 10) : undefined,
          notes: notes.trim() || undefined,
          video_url: type === 'match' ? videoUrl : undefined,
          performance_tags: performanceTags.length ? performanceTags : undefined,
          source: 'manual',
        },
        {
          highlightVideoUrls: highlightVideoUrls,
          galleryUrls: highlightGalleryUrls,
        }
      );
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
                <ProDayText variant="caption" muted>{t('activity.log.goals')}</ProDayText>
                <PressableSpring onPress={() => setGoals(String((parseInt(goals, 10) || 0) + 1))}>
                  <ProDayText variant="section" accent>{goals || '0'}</ProDayText>
                </PressableSpring>
              </View>
              <View style={styles.statField}>
                <ProDayText variant="caption" muted>{t('activity.log.assists')}</ProDayText>
                <PressableSpring onPress={() => setAssists(String((parseInt(assists, 10) || 0) + 1))}>
                  <ProDayText variant="section" accent>{assists || '0'}</ProDayText>
                </PressableSpring>
              </View>
              <View style={styles.statField}>
                <ProDayText variant="caption" muted>{t('activity.log.rating')}</ProDayText>
                <PressableSpring onPress={() => setRating(String(Math.min(10, (parseInt(rating, 10) || 0) + 1)))}>
                  <ProDayText variant="section" accent>{rating || '…'}/10</ProDayText>
                </PressableSpring>
              </View>
            </View>

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
                          backgroundColor: videoUrl === url ? colors.accentSoft : colors.surfaceMuted,
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
