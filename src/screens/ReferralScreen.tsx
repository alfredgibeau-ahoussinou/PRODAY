import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Share,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { PressableSpring } from '../components/motion';
import { Icon } from '../components/ui/Icon';
import { ProDayText } from '../components/ui/ProDayText';
import { ProDaySurface } from '../components/ui/ProDaySurface';
import { useSessionProfile } from '../hooks/useSessionProfile';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ProductLineContext';
import { TAB_BAR_CONTENT_INSET } from '../components/navigation/BottomTabBar';
import { spacing, radius } from '../theme/designTokens';
import {
  referralService,
  type ReferralInvitee,
  type ReferralReward,
} from '../services/referral.service';
import {
  REFERRAL_REQUIRED_FOR_REWARD,
  buildReferralLink,
  referralProgressLabel,
} from '../utils/referralLogic';
import type { AppColors } from '../theme/universeTheme';

interface ReferralScreenProps {
  onBack: () => void;
}

function formatDate(d?: Date): string {
  if (!d) return '—';
  try {
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

export const ReferralScreen: React.FC<ReferralScreenProps> = ({ onBack }) => {
  const profile = useSessionProfile();
  const { refreshProfile } = useAuth();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [code, setCode] = useState(profile?.referral_code ?? '');
  const [link, setLink] = useState(
    profile?.referral_code ? buildReferralLink(profile.referral_code) : ''
  );
  const [invitees, setInvitees] = useState<ReferralInvitee[]>([]);
  const [rewards, setRewards] = useState<ReferralReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const progress = profile?.referral_progress ?? 0;
  const totalSubscribed = profile?.referral_total_subscribed ?? 0;
  const rewardsEarned = profile?.referral_rewards_earned ?? 0;

  const load = useCallback(async () => {
    if (!profile?.uid) return;
    try {
      const ensured = await referralService.ensureCode();
      setCode(ensured.referral_code);
      setLink(ensured.referral_link);
      await refreshProfile();
      const [list, history] = await Promise.all([
        referralService.listInvitees(profile.uid),
        referralService.listRewards(profile.uid),
      ]);
      setInvitees(list);
      setRewards(history);
    } catch (e) {
      Alert.alert(
        'Parrainage',
        e instanceof Error ? e.message : 'Impossible de charger le parrainage.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile?.uid, refreshProfile]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleShare = async (value: string, title?: string) => {
    try {
      await Share.share({ message: value, title });
    } catch {
      /* annulé */
    }
  };

  if (!profile) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Parrainage" onBack={onBack} centered />
        <Text style={[styles.empty, { color: colors.textMuted }]}>Connexion requise.</Text>
      </View>
    );
  }

  if (!referralService.isEligibleRole(profile.role)) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Parrainage" onBack={onBack} centered />
        <Text style={[styles.empty, { color: colors.textMuted }]}>
          Le parrainage n’est pas disponible pour ce rôle.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void load();
          }}
          tintColor={colors.accent}
        />
      }
    >
      <ScreenHeader title="Parrainage" onBack={onBack} centered />

      <ProDayText variant="body" muted style={styles.intro}>
        Invitez 2 nouveaux utilisateurs qui créent un compte et s’abonnent à une offre payante :
        vous gagnez 1 mois Pro offert. Le compteur repart ensuite à 0/2.
      </ProDayText>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />
      ) : (
        <>
          <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
            <ProDayText variant="eyebrow" muted>
              Mon code
            </ProDayText>
            <ProDayText variant="title" style={styles.code}>
              {code || '—'}
            </ProDayText>
            <ProDayText variant="caption" muted numberOfLines={2}>
              {link}
            </ProDayText>
            <View style={styles.rowActions}>
              <PressableSpring
                style={[styles.btn, { backgroundColor: colors.accentSoft, borderColor: colors.accent }]}
                onPress={() => void handleShare(code, 'Code parrainage')}
                scaleTo={0.97}
              >
                <Icon name="document" size={16} color={colors.accent} />
                <Text style={[styles.btnText, { color: colors.accent }]}>Partager le code</Text>
              </PressableSpring>
              <PressableSpring
                style={[styles.btn, { backgroundColor: colors.accentSoft, borderColor: colors.accent }]}
                onPress={() => void handleShare(link, 'Lien parrainage')}
                scaleTo={0.97}
              >
                <Icon name="share" size={16} color={colors.accent} />
                <Text style={[styles.btnText, { color: colors.accent }]}>Partager le lien</Text>
              </PressableSpring>
            </View>
            <PressableSpring
              style={[styles.shareBtn, { backgroundColor: colors.accent }]}
              onPress={() =>
                void handleShare(
                  `Rejoins ProDay avec mon code ${code} : ${link}`,
                  'Inviter sur ProDay'
                )
              }
              scaleTo={0.97}
              haptic
            >
              <Text style={styles.shareText}>Inviter un ami</Text>
            </PressableSpring>
          </ProDaySurface>

          <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
            <ProDayText variant="eyebrow" muted>
              Progression
            </ProDayText>
            <ProDayText variant="title">{referralProgressLabel(progress)}</ProDayText>
            <View style={styles.progressTrack}>
              {[0, 1].map((slot) => (
                <View
                  key={slot}
                  style={[
                    styles.progressSlot,
                    {
                      backgroundColor:
                        progress > slot ? colors.accent : colors.border,
                    },
                  ]}
                />
              ))}
            </View>
            <ProDayText variant="caption" muted>
              {progress}/{REFERRAL_REQUIRED_FOR_REWARD} filleuls abonnés vers le prochain mois
              offert · {totalSubscribed} abonné{totalSubscribed === 1 ? '' : 's'} au total ·{' '}
              {rewardsEarned} récompense{rewardsEarned === 1 ? '' : 's'}
            </ProDayText>
          </ProDaySurface>

          <ProDayText variant="section" style={styles.sectionTitle}>
            Mes filleuls ({invitees.length})
          </ProDayText>
          {invitees.length === 0 ? (
            <ProDayText variant="caption" muted>
              Aucun filleul pour le moment. Partagez votre code pour commencer.
            </ProDayText>
          ) : (
            invitees.map((item) => (
              <ProDaySurface
                key={item.id}
                variant="module"
                style={[styles.listCard, { borderColor: colors.border }]}
              >
                <View style={styles.listRow}>
                  <View style={{ flex: 1 }}>
                    <ProDayText variant="body">
                      {item.invitee_display_name?.trim() || 'Nouveau membre'}
                    </ProDayText>
                    <ProDayText variant="caption" muted>
                      {item.status === 'subscribed' ? 'Abonné' : 'Inscrit'} ·{' '}
                      {formatDate(item.subscribed_at ?? item.created_at)}
                    </ProDayText>
                  </View>
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor:
                          item.status === 'subscribed' ? colors.accentSoft : colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        {
                          color:
                            item.status === 'subscribed' ? colors.accent : colors.textMuted,
                        },
                      ]}
                    >
                      {item.status === 'subscribed' ? 'Pro' : 'Compte'}
                    </Text>
                  </View>
                </View>
              </ProDaySurface>
            ))
          )}

          <ProDayText variant="section" style={styles.sectionTitle}>
            Historique des récompenses
          </ProDayText>
          {rewards.length === 0 ? (
            <ProDayText variant="caption" muted>
              Aucune récompense pour l’instant. 2 filleuls abonnés = 1 mois Pro.
            </ProDayText>
          ) : (
            rewards.map((reward) => (
              <ProDaySurface
                key={reward.id}
                variant="module"
                style={[styles.listCard, { borderColor: colors.border }]}
              >
                <ProDayText variant="body">
                  +{reward.months_granted} mois Pro offert
                </ProDayText>
                <ProDayText variant="caption" muted>
                  {formatDate(reward.created_at)}
                  {reward.period_end_after
                    ? ` · valable jusqu’au ${formatDate(new Date(reward.period_end_after))}`
                    : ''}
                </ProDayText>
              </ProDaySurface>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
};

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    root: { flex: 1 },
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl,
      gap: spacing.sm,
    },
    intro: { marginBottom: spacing.sm },
    empty: { padding: spacing.lg, textAlign: 'center' },
    card: {
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      gap: spacing.xs,
    },
    code: { letterSpacing: 2 },
    rowActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
    btn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
    },
    btnText: { fontWeight: '700', fontSize: 13 },
    shareBtn: {
      marginTop: spacing.sm,
      paddingVertical: spacing.sm + 2,
      borderRadius: radius.md,
      alignItems: 'center',
    },
    shareText: { color: '#fff', fontWeight: '800', fontSize: 14 },
    progressTrack: { flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.sm },
    progressSlot: { flex: 1, height: 8, borderRadius: 4 },
    sectionTitle: { marginTop: spacing.md, marginBottom: spacing.xs },
    listCard: {
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      marginBottom: spacing.xs,
    },
    listRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
    },
    badgeText: { fontSize: 11, fontWeight: '800' },
  });
}
