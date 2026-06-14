import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { User } from '../../models/User';
import { HEALTH_CHAPTERS, type HealthChapterId } from '../../content/healthChapters';
import { PRODAY_SANTE_BRAND } from '../../models/ProductLine';
import { PhysioCarePanel } from '../feed/PhysioCarePanel';
import { AppTabHeader, AppStatChips } from '../app';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { ProDayTabPager } from '../ui/ProDayTabPager';
import { useAppTheme } from '../../context/ProductLineContext';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { spacing, radius } from '../../theme/designTokens';
import { V3TabShell } from '../v3/V3TabShell';
import { HealthSummaryCard } from '../../features/home/components/HealthSummaryCard';
import { isV3ShellEnabled } from '../../config/featureFlags';
import type { SectionIntelligence } from '../../features/v3/models/sectionIntelligence';
import type { HealthSnapshot } from '../../core/types/health';

const TIPS = [
  {
    icon: 'heart' as const,
    title: 'Échauffement',
    body: '15 min avant l’effort : mobilité, activation musculaire et montée progressive en intensité.',
  },
  {
    icon: 'time' as const,
    title: 'Récupération',
    body: 'Sommeil, hydratation et étirements légers dans les 24 h après un match ou entraînement intense.',
  },
  {
    icon: 'shield' as const,
    title: 'Prévention',
    body: 'Signalez toute douleur persistante à votre kiné — mieux vaut consulter tôt qu’après une blessure.',
  },
];

interface HealthHomeScreenProps {
  profile: User;
  onOpenChat: (threadId: string) => void;
  onOpenMessages: () => void;
  onBookPhysio: (physio: User) => void;
  intelligence?: SectionIntelligence | null;
  healthSnapshot?: HealthSnapshot;
}

const pagePad = {
  paddingHorizontal: spacing.lg,
  paddingBottom: TAB_BAR_CONTENT_INSET + spacing.sm,
};

export const HealthHomeScreen: React.FC<HealthHomeScreenProps> = ({
  profile,
  onOpenChat,
  onOpenMessages,
  onBookPhysio,
  intelligence,
  healthSnapshot,
}) => {
  const { colors } = useAppTheme();
  const [chapter, setChapter] = useState<HealthChapterId>('annuaire');
  const useV3Header = isV3ShellEnabled();

  const pages = [
    {
      id: 'annuaire' as const,
      render: () => (
        <ScrollView
          contentContainerStyle={pagePad}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          <ProDaySurface variant="accent" style={[styles.hero, { borderColor: colors.border }]}>
            <View style={[styles.heroIcon, { backgroundColor: colors.accentSoft }]}>
              <Icon name="heart" size={22} color={colors.accent} variant="filled" />
            </View>
            <View style={styles.heroCopy}>
              <ProDayText variant="section">Annuaire santé</ProDayText>
              <ProDayText variant="body" muted>
                Kinés, coach mental, nutrition — réservez un créneau ou envoyez un message.
              </ProDayText>
            </View>
          </ProDaySurface>
          <PhysioCarePanel
            profile={profile}
            onOpenChat={onOpenChat}
            onOpenMessages={onOpenMessages}
            onBookPhysio={onBookPhysio}
            expanded
            hideHeader
          />
        </ScrollView>
      ),
    },
    {
      id: 'conseils' as const,
      render: () => (
        <ScrollView
          contentContainerStyle={pagePad}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {healthSnapshot ? <HealthSummaryCard health={healthSnapshot} /> : null}
          <ProDayText variant="eyebrow" accent style={styles.lead}>
            Bien-être sportif
          </ProDayText>
          <ProDayText variant="body" muted style={styles.sub}>
            Quelques repères pour rester en forme tout au long de la saison.
          </ProDayText>
          {TIPS.map((tip) => (
            <ProDaySurface
              key={tip.title}
              variant="module"
              style={[styles.tip, { borderColor: colors.borderStrong }]}
            >
              <View style={[styles.tipIcon, { backgroundColor: colors.accentSoft }]}>
                <Icon name={tip.icon} size={20} color={colors.accent} variant="filled" />
              </View>
              <View style={styles.tipCopy}>
                <ProDayText variant="section">{tip.title}</ProDayText>
                <ProDayText variant="body" muted>
                  {tip.body}
                </ProDayText>
              </View>
            </ProDaySurface>
          ))}
        </ScrollView>
      ),
    },
  ];

  const pager = (
    <ProDayTabPager
      chapters={HEALTH_CHAPTERS}
      pages={pages}
      activeChapter={chapter}
      onChapterChange={setChapter}
    />
  );

  if (useV3Header) {
    return (
      <V3TabShell
        caption={PRODAY_SANTE_BRAND.name}
        title="Santé"
        subtitle="Kinés, coach mental, nutrition — RDV ou messagerie."
        flat
        intelligence={intelligence}
        stats={[
          { value: healthSnapshot ? String(healthSnapshot.fatigueScore) : '—', label: 'Fatigue' },
          { value: healthSnapshot ? String(healthSnapshot.recoveryScore) : '—', label: 'Récup.' },
          { value: 'RDV', label: 'En ligne' },
        ]}
      >
        {pager}
      </V3TabShell>
    );
  }

  return (
    <View style={styles.root}>
      <AppTabHeader
        caption={PRODAY_SANTE_BRAND.name}
        title="Santé"
        subtitle="Kinés, coach mental, nutrition — RDV ou messagerie."
        footer={
          <AppStatChips
            items={[
              { value: '3', label: 'Spécialités' },
              { value: 'RDV', label: 'En ligne' },
              { value: '24h', label: 'Messagerie' },
            ]}
          />
        }
      />
      {pager}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: { flex: 1, gap: 4 },
  lead: { marginBottom: 4 },
  sub: { marginBottom: spacing.lg },
  tip: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1.5,
  },
  tipIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipCopy: { flex: 1, gap: 4 },
});
