import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { PressableSpring } from '../../components/motion';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useSponsorDashboard } from '../../hooks/useSponsorDashboard';
import { useTranslation } from '../../context/LocaleContext';
import { openSponsorProspectChat } from '../../utils/openSponsorProspectChat';
import { SPONSOR_NAV_INSET } from '../../navigation/sponsorTabConfig';
import { SPONSOR_THEME } from '../../content/sponsorExperience';
import { spacing, radius } from '../../theme/designTokens';
import type { SponsorProspect } from '../../models/SponsorOffer';

interface SponsorContactsScreenProps {
  shellMode?: boolean;
  onOpenChat?: (prospect: SponsorProspect) => void;
}

/** Clubs partenaires / prospects pour activation terrain. */
export const SponsorContactsScreen: React.FC<SponsorContactsScreenProps> = ({
  shellMode = true,
  onOpenChat,
}) => {
  const { t } = useTranslation();
  const profile = useSessionProfile();
  const company = profile?.profile.job_title ?? profile?.display_name;
  const { prospects, loading } = useSponsorDashboard(profile?.uid, company);

  const handleContact = (prospect: SponsorProspect) => {
    if (!profile) return;
    if (onOpenChat) {
      onOpenChat(prospect);
      return;
    }
    void openSponsorProspectChat(profile, prospect, () => {
      Alert.alert(t('sponsor.contacts.chatOpened'));
    });
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: (shellMode ? SPONSOR_NAV_INSET : 24) + spacing.xl },
      ]}
    >
      <Text style={styles.subtitle}>{t('sponsor.contacts.subtitle')}</Text>

      {loading ? (
        <ActivityIndicator color={SPONSOR_THEME.primary} style={styles.loader} />
      ) : prospects.length === 0 ? (
        <Text style={styles.empty}>{t('sponsor.contacts.empty')}</Text>
      ) : (
        prospects.map((prospect) => (
          <View key={prospect.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.clubName}>{prospect.name}</Text>
              <Text style={styles.badge}>{t('sponsor.contacts.statusProspect')}</Text>
            </View>
            <Text style={styles.meta}>
              {prospect.city} · {prospect.category}
            </Text>
            <Text style={styles.reason}>{prospect.reason}</Text>
            <Text style={styles.score}>
              {t('sponsor.contacts.matchScore', { n: String(prospect.match_score) })}
            </Text>
            <PressableSpring
              style={styles.cta}
              onPress={() => handleContact(prospect)}
              scaleTo={0.97}
              haptic
            >
              <Text style={styles.ctaText}>{t('sponsor.contacts.activateCta')}</Text>
            </PressableSpring>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SPONSOR_THEME.background },
  content: { padding: spacing.lg, gap: spacing.sm },
  subtitle: { color: SPONSOR_THEME.textSecondary, fontSize: 14, marginBottom: spacing.sm },
  loader: { marginTop: spacing.xl },
  empty: { color: SPONSOR_THEME.textMuted, textAlign: 'center', marginTop: spacing.xl },
  card: {
    backgroundColor: SPONSOR_THEME.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: SPONSOR_THEME.border,
    gap: spacing.xs,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clubName: { color: SPONSOR_THEME.text, fontWeight: '800', fontSize: 16, flex: 1 },
  badge: {
    color: SPONSOR_THEME.primary,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  meta: { color: SPONSOR_THEME.textMuted, fontSize: 12 },
  reason: { color: SPONSOR_THEME.textSecondary, fontSize: 13, lineHeight: 18 },
  score: { color: SPONSOR_THEME.textMuted, fontSize: 11, fontWeight: '700' },
  cta: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: SPONSOR_THEME.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  ctaText: { color: SPONSOR_THEME.primary, fontWeight: '800', fontSize: 12 },
});
