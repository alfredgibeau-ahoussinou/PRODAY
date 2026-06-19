import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import type { User } from '../models/User';
import { tournamentsService } from '../services/tournaments.service';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { PressableSpring } from '../components/motion';
import { ProDayText } from '../components/ui/ProDayText';
import { useThemedScreen } from '../hooks/useThemedScreen';
import { spacing, radius } from '../theme/designTokens';
import type { AppColors } from '../theme/universeTheme';
import { useTranslation } from '../context/LocaleContext';

interface CreateTournamentScreenProps {
  profile: User;
  onBack: () => void;
  onCreated: (id: string) => void;
}

export const CreateTournamentScreen: React.FC<CreateTournamentScreenProps> = ({
  profile,
  onBack,
  onCreated,
}) => {
  const { t } = useTranslation();
  const { colors: c, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createStyles(c), [c]);
  const [title, setTitle] = useState('');
  const [city, setCity] = useState(profile.city ?? '');
  const [description, setDescription] = useState('');
  const [maxTeams, setMaxTeams] = useState('8');
  const [fee, setFee] = useState('0');
  const [categories, setCategories] = useState('U15');
  const [submitting, setSubmitting] = useState(false);

  const publish = async () => {
    if (!title.trim() || !city.trim()) {
      Alert.alert(t('tournament.alert.required.title'), t('tournament.alert.required.body'));
      return;
    }
    setSubmitting(true);
    try {
      const startsAt = new Date();
      startsAt.setDate(startsAt.getDate() + 14);
      const id = await tournamentsService.create({
        title: title.trim(),
        description: description.trim() || undefined,
        city: city.trim(),
        starts_at: startsAt,
        max_teams: Math.max(4, parseInt(maxTeams, 10) || 8),
        entry_fee_cents: Math.max(0, Math.round(parseFloat(fee.replace(',', '.')) * 100)),
        categories: categories
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        organizer_uid: profile.uid,
        organizer_name: profile.display_name,
      });
      onCreated(id);
    } catch (e) {
      Alert.alert(
        t('feed.alert.error'),
        e instanceof Error ? e.message : t('tournament.alert.createFailed')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = [
    styles.input,
    { color: c.text, borderColor: c.border, backgroundColor: c.surface },
  ];

  return (
    <View style={[styles.root, rootStyle]}>
      <ScreenHeader
        label={t('tournament.create.label')}
        title={t('tournament.create.title')}
        subtitle={t('tournament.create.subtitle')}
        onBack={onBack}
      />
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <ProDayText variant="caption" muted style={styles.label}>
          {t('tournament.field.title')}
        </ProDayText>
        <TextInput style={inputStyle} value={title} onChangeText={setTitle} placeholder="Open Foot Paris" placeholderTextColor={c.textMuted} />

        <ProDayText variant="caption" muted style={styles.label}>
          {t('tournament.field.city')}
        </ProDayText>
        <TextInput style={inputStyle} value={city} onChangeText={setCity} placeholderTextColor={c.textMuted} />

        <ProDayText variant="caption" muted style={styles.label}>
          {t('tournament.field.description')}
        </ProDayText>
        <TextInput
          style={[inputStyle, styles.multiline]}
          value={description}
          onChangeText={setDescription}
          multiline
          placeholderTextColor={c.textMuted}
        />

        <View style={styles.row}>
          <View style={styles.half}>
            <ProDayText variant="caption" muted style={styles.label}>
              {t('tournament.field.maxTeams')}
            </ProDayText>
            <TextInput style={inputStyle} value={maxTeams} onChangeText={setMaxTeams} keyboardType="number-pad" placeholderTextColor={c.textMuted} />
          </View>
          <View style={styles.half}>
            <ProDayText variant="caption" muted style={styles.label}>
              {t('tournament.field.fee')}
            </ProDayText>
            <TextInput style={inputStyle} value={fee} onChangeText={setFee} keyboardType="decimal-pad" placeholderTextColor={c.textMuted} />
          </View>
        </View>

        <ProDayText variant="caption" muted style={styles.label}>
          {t('tournament.field.categories')}
        </ProDayText>
        <TextInput style={inputStyle} value={categories} onChangeText={setCategories} placeholder="U17, Loisir" placeholderTextColor={c.textMuted} />

        <PressableSpring
          style={[styles.submit, { backgroundColor: c.brand }, submitting && { opacity: 0.7 }]}
          disabled={submitting}
          onPress={() => void publish()}
          scaleTo={0.98}
          haptic={!submitting}
        >
          {submitting ? (
            <ActivityIndicator color={c.brandInverse} />
          ) : (
            <ProDayText variant="caption" inverse style={styles.submitText}>
              {t('tournament.create.publish')}
            </ProDayText>
          )}
        </PressableSpring>
      </ScrollView>
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1 },
    form: { padding: spacing.lg, gap: spacing.xs, paddingBottom: spacing.xl },
    label: { fontWeight: '700', marginTop: spacing.sm },
    input: {
      borderWidth: 1,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: 15,
    },
    multiline: { minHeight: 90, textAlignVertical: 'top' },
    row: { flexDirection: 'row', gap: spacing.sm },
    half: { flex: 1 },
    submit: {
      marginTop: spacing.lg,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    submitText: { fontWeight: '800' },
  });
}
