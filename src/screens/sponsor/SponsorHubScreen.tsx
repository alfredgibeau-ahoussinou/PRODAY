import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Icon } from '../../components/ui/Icon';
import { ProDaySymbol } from '../../components/branding/ProDaySymbol';
import { SponsorScreenHeader } from '../../components/sponsor/SponsorScreenHeader';
import { SponsorPricingScreen } from '../../components/sponsor/SponsorPricingScreen';
import {
  SPONSOR_PRICING_INTRO,
  SPONSOR_VALUE_PILLARS,
} from '../../content/sponsorPricing';
import { SPONSOR_THEME } from '../../content/sponsorExperience';
import { TAB_BAR_CONTENT_INSET } from '../../components/navigation/BottomTabBar';
import { SPONSOR_NAV_INSET } from '../../navigation/sponsorTabConfig';
import { spacing } from '../../theme/designTokens';
import { isSponsorRole } from '../../content/sponsorExperience';
import { useAuth } from '../../context/AuthContext';
import { AnimatedEntrance, PressableSpring } from '../../components/motion';

interface SponsorHubScreenProps {
  onBack?: () => void;
  onBrowseOffers?: () => void;
  shellMode?: boolean;
}

/** Formules & valeur Sponsor — éditorial, peu de CTA. */
export const SponsorHubScreen: React.FC<SponsorHubScreenProps> = ({
  onBack,
  onBrowseOffers,
  shellMode = false,
}) => {
  const { profile } = useAuth();
  const isSponsor = isSponsorRole(profile?.role);
  const bottomInset = shellMode ? SPONSOR_NAV_INSET : TAB_BAR_CONTENT_INSET;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomInset + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {onBack && !shellMode ? (
          <PressableSpring style={styles.backBtn} onPress={onBack} scaleTo={0.97}>
            <Icon name="arrow-back" size={20} color={SPONSOR_THEME.text} />
            <Text style={styles.backText}>Retour</Text>
          </PressableSpring>
        ) : null}

        {!shellMode ? (
          <SponsorScreenHeader
            title={SPONSOR_PRICING_INTRO.title}
            subtitle={SPONSOR_PRICING_INTRO.subtitle}
          />
        ) : (
          <AnimatedEntrance kind="fadeUp" index={0}>
            <View style={styles.shellIntro}>
              <View style={styles.mark}>
                <ProDaySymbol size={48} variant="sponsor" tone="white" />
              </View>
              <Text style={styles.shellIntroTitle}>{SPONSOR_PRICING_INTRO.title}</Text>
              <Text style={styles.shellIntroSub}>{SPONSOR_PRICING_INTRO.subtitle}</Text>
            </View>
          </AnimatedEntrance>
        )}

        <AnimatedEntrance kind="fadeUp" index={1}>
          <View style={styles.pillars}>
            {SPONSOR_VALUE_PILLARS.map((pillar) => (
              <View key={pillar.title} style={styles.pillarRow}>
                <Icon name={pillar.icon} size={18} color={SPONSOR_THEME.primary} />
                <View style={styles.pillarCopy}>
                  <Text style={styles.pillarTitle}>{pillar.title}</Text>
                  <Text style={styles.pillarBody}>{pillar.body}</Text>
                </View>
              </View>
            ))}
          </View>
        </AnimatedEntrance>

        {isSponsor ? (
          <Text style={styles.note}>
            Formules, offres et réseau club — le même parcours que votre tableau de bord.
          </Text>
        ) : null}

        <Text style={styles.sectionTitle}>Tarifs</Text>
        <SponsorPricingScreen embedded hideIntro onBack={onBack} />

        {onBrowseOffers ? (
          <PressableSpring style={styles.browseBtn} onPress={onBrowseOffers} scaleTo={0.98}>
            <Text style={styles.browseText}>Voir mes offres</Text>
            <Icon name="chevron-forward" size={16} color={SPONSOR_THEME.primary} />
          </PressableSpring>
        ) : null}
      </ScrollView>
    </View>
  );
};

/** @deprecated Utiliser SponsorHubScreen */
export const SponsorPartnerHubScreen = SponsorHubScreen;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SPONSOR_THEME.background },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  backText: { fontSize: 15, fontWeight: '700', color: SPONSOR_THEME.text },
  shellIntro: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SPONSOR_THEME.borderSubtle,
  },
  mark: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: SPONSOR_THEME.primarySoft,
    borderWidth: 1,
    borderColor: SPONSOR_THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shellIntroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: SPONSOR_THEME.text,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  shellIntroSub: {
    fontSize: 14,
    color: SPONSOR_THEME.textMuted,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 320,
  },
  pillars: { gap: 0 },
  pillarRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SPONSOR_THEME.borderSubtle,
  },
  pillarCopy: { flex: 1, gap: 2 },
  pillarTitle: { fontSize: 14, fontWeight: '800', color: SPONSOR_THEME.text },
  pillarBody: { fontSize: 12, color: SPONSOR_THEME.textMuted, lineHeight: 17 },
  note: {
    fontSize: 13,
    color: SPONSOR_THEME.textSecondary,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: SPONSOR_THEME.sectionLabel,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: spacing.sm,
  },
  browseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
  },
  browseText: { fontSize: 14, fontWeight: '700', color: SPONSOR_THEME.primary },
});
