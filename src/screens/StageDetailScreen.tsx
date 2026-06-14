import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { User } from '../models/User';
import type { StageOffer } from '../models/Stage';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { stagesService } from '../services/stages.service';
import { formatCalendarDate } from '../utils/seasonCalendar';
import { spacing, radius } from '../theme/designTokens';
import { useThemedScreen } from '../hooks/useThemedScreen';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { MAX_STAGE_MESSAGE } from '../utils/stageValidation';

interface StageDetailScreenProps {
  stageId: string;
  profile: User | null;
  onBack: () => void;
}

export const StageDetailScreen: React.FC<StageDetailScreenProps> = ({
  stageId,
  profile,
  onBack,
}) => {
  const [stage, setStage] = useState<StageOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [applied, setApplied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { colors: themeColors, rootStyle } = useThemedScreen();
  const { requireAuth } = useRequireAuth();

  const load = useCallback(async () => {
    setLoading(true);
    const offer = await stagesService.getOfferById(stageId);
    setStage(offer);
    if (profile?.uid && offer) {
      setApplied(await stagesService.hasPlayerApplied(stageId, profile.uid));
    }
    setLoading(false);
  }, [stageId, profile?.uid]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleApply = async () => {
    if (!requireAuth('Connectez-vous pour vous inscrire à ce stage.') || !profile) return;
    if (profile.role !== 'player') {
      Alert.alert('Réservé aux joueurs', 'Seuls les joueurs peuvent s’inscrire à un stage.');
      return;
    }
    if (!message.trim()) {
      Alert.alert('Message requis', 'Présentez-vous brièvement au club organisateur.');
      return;
    }
    if (!stage) return;

    setSubmitting(true);
    try {
      await stagesService.apply(
        {
          stage_id: stage.id,
          stage_author_uid: stage.author_uid,
          player_uid: profile.uid,
          player_name: profile.display_name,
          message: message.trim(),
        },
        profile,
      );
      setApplied(true);
      Alert.alert('Demande envoyée', 'Le club examinera votre inscription.');
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Inscription impossible.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !stage) {
    return (
      <View style={[styles.root, rootStyle]}>
        <ScreenHeader title="Stage" onBack={onBack} centered />
        <ActivityIndicator color={themeColors.brand} style={styles.loader} />
      </View>
    );
  }

  const spotsLeft = stage.spots_total - stage.spots_taken;

  return (
    <View style={[styles.root, rootStyle]}>
      <ScreenHeader title={stage.title} onBack={onBack} centered />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.club, { color: themeColors.brand }]}>{stage.club_name}</Text>
        <Text style={[styles.meta, { color: themeColors.textMuted }]}>
          {stage.category} · {stage.city}
        </Text>
        <Text style={[styles.dates, { color: themeColors.text }]}>
          Du {formatCalendarDate(stage.start_date)} au {formatCalendarDate(stage.end_date)}
        </Text>
        <Text style={[styles.spots, { color: themeColors.text }]}>
          {spotsLeft} place{spotsLeft !== 1 ? 's' : ''} disponible{spotsLeft !== 1 ? 's' : ''}
          {stage.price_eur != null ? ` · ${stage.price_eur} €` : ''}
        </Text>
        {stage.description ? (
          <Text style={[styles.body, { color: themeColors.text }]}>{stage.description}</Text>
        ) : null}

        {profile?.role === 'player' && stage.status === 'OPEN' && spotsLeft > 0 ? (
          applied ? (
            <Text style={[styles.applied, { color: themeColors.brand }]}>
              Vous avez déjà demandé une inscription.
            </Text>
          ) : (
            <>
              <TextInput
                style={[
                  styles.input,
                  styles.bio,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                    color: themeColors.text,
                  },
                ]}
                placeholder="Message au club *"
                placeholderTextColor={themeColors.textMuted}
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={MAX_STAGE_MESSAGE}
              />
              <TouchableOpacity
                style={[styles.primary, { backgroundColor: themeColors.brand }]}
                onPress={handleApply}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.primaryText}>Demander une inscription</Text>
                )}
              </TouchableOpacity>
            </>
          )
        ) : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  loader: { marginTop: spacing.xl },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  club: { fontSize: 14, fontWeight: '800' },
  meta: { fontSize: 13, marginTop: 4 },
  dates: { fontSize: 14, marginTop: spacing.sm },
  spots: { fontSize: 13, fontWeight: '700', marginTop: spacing.sm },
  body: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.lg,
  },
  applied: {
    marginTop: spacing.lg,
    fontWeight: '700',
    textAlign: 'center',
  },
  input: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  bio: { minHeight: 90, textAlignVertical: 'top' },
  primary: {
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  primaryText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
});
