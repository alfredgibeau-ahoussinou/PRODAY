import React, { useMemo, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimatedEntrance, PressableSpring } from '../../components/motion';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { useClubFinance } from '../../features/club/hooks/useClubFinance';
import { usePresidentHealth } from '../../features/president/hooks/usePresidentHealth';
import { usePresidentShellNav } from '../../features/president/shell/PresidentShellNavContext';
import { usePresidentTheme } from '../../features/president/shell/PresidentThemeContext';
import { PresidentHealthBoard } from '../../features/president/ui/PresidentHealthBoard';
import {
  PresidentClubBridgeCard,
  PresidentCockpitShortcutRow,
  PresidentFinanceSnapshotCard,
  PresidentPriorityCard,
} from '../../features/president/ui/PresidentCockpitChrome';
import {
  buildPresidentCockpitPriorities,
  buildPresidentFinanceSnapshot,
} from '../../features/president/ui/presidentCockpitModel';
import {
  PresidentActionRow,
  PresidentBrandMark,
  PresidentChapterScroll,
  PresidentHeroBanner,
  PresidentLoading,
  PresidentSearchField,
  PresidentSectionCard,
  PresidentText,
} from '../../features/president/ui/presidentUi';
import { PRESIDENT_HEALTH_AXIS_NAV } from '../../features/president/navigation/presidentNavConfig';
import {
  presidentChrome,
  presidentLayout,
  presidentRadius,
  presidentShadow,
  presidentSpace,
} from '../../features/president/theme/presidentDesignSystem';
import type { PresidentThemeTokens } from '../../features/president/theme/presidentTokens';

/** Cockpit Accueil — santé, priorités actionnables, finance, pont Club. */
export function PresidentDashboardScreen() {
  const profile = useSessionProfile();
  const ws = useClubWorkspace();
  const health = usePresidentHealth(ws);
  const finance = useClubFinance(ws.clubId);
  const shellNav = usePresidentShellNav();
  const { tokens } = usePresidentTheme();
  const { width } = useWindowDimensions();
  const tablet = width >= presidentChrome.tabletBreakpoint;
  const styles = useMemo(() => createStyles(tokens, tablet), [tokens, tablet]);
  const [search, setSearch] = useState('');

  const financeSnapshot = useMemo(
    () =>
      buildPresidentFinanceSnapshot({
        soldeEur: finance.totals.solde_eur,
        recettesEur: finance.totals.recettes_eur,
        depensesEur: finance.totals.depenses_eur,
        entryCount: finance.totals.count,
      }),
    [finance.totals],
  );

  const priorities = useMemo(
    () =>
      buildPresidentCockpitPriorities({
        health,
        pendingMemberships: ws.pendingMemberships,
        teamsWithoutCoach: ws.teamsWithoutCoach,
        matchesToday: ws.todayMatches.length,
        financeEntryCount: finance.totals.count,
      }),
    [
      health,
      ws.pendingMemberships,
      ws.teamsWithoutCoach,
      ws.todayMatches.length,
      finance.totals.count,
    ],
  );

  if (ws.loading) {
    return <PresidentLoading label="Ouverture du cockpit…" />;
  }

  const firstName = profile?.display_name?.split(/\s+/)[0] || 'Président';
  const clubName = ws.club?.name ?? 'Votre club';

  return (
    <View style={styles.root}>
      <PresidentChapterScroll
        refreshing={ws.refreshing || finance.refreshing}
        onRefresh={() => {
          void ws.refresh();
          void finance.refresh();
        }}
      >
        <PresidentHeroBanner
          greeting={`Bonjour ${firstName}`}
          clubName={clubName}
          subtitle="État du club, priorités et finances — en un regard."
          overall={health.overall}
        />

        <PresidentSearchField
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher une section…"
          onFocus={() => shellNav?.openCommandPalette?.()}
        />

        <PresidentCockpitShortcutRow
          items={[
            {
              id: 'finance',
              label: 'Finances',
              icon: 'bag',
              onPress: () => shellNav?.requestNav('finance'),
            },
            {
              id: 'members',
              label: 'Adhérents',
              icon: 'people',
              onPress: () => shellNav?.requestNav('members'),
            },
            {
              id: 'club',
              label: 'Club',
              icon: 'football',
              onPress: () => shellNav?.openClubDeepLink('today'),
            },
            {
              id: 'ai',
              label: 'Conseils',
              icon: 'star-four-points',
              onPress: () => shellNav?.requestNav('ai'),
            },
          ]}
        />

        <PresidentFinanceSnapshotCard
          snapshot={financeSnapshot}
          loading={finance.loading && finance.totals.count === 0}
          onOpenFinance={() => shellNav?.requestNav('finance')}
        />

        <View style={styles.heroDeck}>
          <LinearGradient
            colors={[tokens.champagneSoft, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0.6 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroDeckHeader}>
            <View style={styles.heroDeckCopy}>
              <PresidentText variant="label" champagne numberOfLines={1}>
                Tableau de bord
              </PresidentText>
              <PresidentText variant="h2" numberOfLines={1}>
                Santé du club
              </PresidentText>
              <PresidentText variant="caption" muted numberOfLines={2}>
                Touchez un axe pour ouvrir la section.
              </PresidentText>
            </View>
            <View style={styles.kpiCluster}>
              <KpiPill label="Équipes" value={String(ws.teams.length)} />
              <KpiPill label="Licenciés" value={String(ws.players.length)} />
              <KpiPill label="À faire" value={String(ws.todoCount)} accent={ws.todoCount > 0} />
            </View>
          </View>

          <PresidentHealthBoard
            health={health}
            immersive
            onAxisPress={(axis) => {
              shellNav?.requestNav(PRESIDENT_HEALTH_AXIS_NAV[axis.id]);
            }}
          />

          {(ws.briefingHeadline || ws.briefingSummary) && (
            <View style={styles.briefStrip}>
              <PresidentText variant="label" champagne>
                En bref
              </PresidentText>
              <PresidentText variant="body" style={{ fontWeight: '600' }}>
                {ws.briefingHeadline || 'Structure opérationnelle'}
              </PresidentText>
              <PresidentText variant="caption" muted>
                {ws.briefingSummary ||
                  `${ws.teams.length} équipes · ${ws.players.length} licenciés · ${ws.coaches.length} coachs.`}
              </PresidentText>
            </View>
          )}
        </View>

        <AnimatedEntrance kind="fadeUp" index={2}>
          <View style={styles.decision}>
            <View style={styles.decisionHead}>
              <PresidentBrandMark compact />
              <PresidentText variant="h2" numberOfLines={1}>
                Priorités du jour
              </PresidentText>
              <PresidentText variant="caption" muted numberOfLines={2}>
                Actions concretes pour la direction.
              </PresidentText>
            </View>
            <View style={styles.priorityList}>
              {priorities.map((priority, i) => (
                <PresidentPriorityCard
                  key={priority.id}
                  priority={priority}
                  index={i}
                  onPress={() => shellNav?.requestNav(priority.nav)}
                />
              ))}
            </View>
            <PressableAiCta onPress={() => shellNav?.requestNav('ai')} />
          </View>
        </AnimatedEntrance>

        <PresidentClubBridgeCard
          clubName={clubName}
          onOpenClub={() => shellNav?.openClubDeepLink('today')}
        />

        <PresidentSectionCard
          eyebrow="Raccourcis"
          title="Piloter sans quitter la direction"
          index={3}
        >
          <PresidentActionRow
            label="Équipes"
            hint="Structure sportive"
            icon="football"
            onPress={() => shellNav?.requestNav('teams')}
          />
          <PresidentActionRow
            label="Sportif"
            hint="Matchs & entraînements"
            icon="trophy"
            onPress={() => shellNav?.requestNav('sport')}
          />
          <PresidentActionRow
            label="Recrutement"
            hint="Vivier & suivi"
            icon="briefcase"
            onPress={() => shellNav?.requestNav('recruitment')}
          />
          <PresidentActionRow
            label="Vidéo"
            hint="Captation club"
            icon="videocam"
            onPress={() => shellNav?.requestNav('video')}
          />
          <PresidentActionRow
            label="Adhérents en attente"
            hint={
              ws.pendingMemberships > 0
                ? `${ws.pendingMemberships} à valider`
                : 'Aucune validation en cours'
            }
            icon="people"
            onPress={() => shellNav?.requestNav('members')}
          />
          <PresidentActionRow
            label="Finances"
            hint={financeSnapshot.hint}
            icon="bag"
            onPress={() => shellNav?.requestNav('finance')}
          />
        </PresidentSectionCard>
      </PresidentChapterScroll>
    </View>
  );
}

function PressableAiCta({ onPress }: { onPress: () => void }) {
  const { tokens } = usePresidentTheme();
  return (
    <PressableSpring onPress={onPress} scaleTo={0.98} haptic style={aiCtaStyle(tokens)}>
      <LinearGradient
        colors={[tokens.accent, '#B8955A']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      <PresidentText variant="body" style={{ color: tokens.accentText, fontWeight: '800' }}>
        Conseils direction
      </PresidentText>
      <PresidentText variant="caption" style={{ color: tokens.accentText, opacity: 0.8 }}>
        Suggestions locales — vous confirmez chaque action
      </PresidentText>
    </PressableSpring>
  );
}

function aiCtaStyle(tokens: PresidentThemeTokens) {
  return {
    marginTop: presidentSpace.sm,
    paddingVertical: presidentSpace.md + 2,
    paddingHorizontal: presidentLayout.cardPad,
    borderRadius: presidentRadius.lg,
    overflow: 'hidden' as const,
    gap: 2,
    ...presidentShadow.glow(tokens),
  };
}

function KpiPill({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  const { tokens } = usePresidentTheme();
  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        paddingHorizontal: presidentSpace.md,
        paddingVertical: presidentSpace.sm,
        borderRadius: presidentRadius.md,
        backgroundColor: accent ? tokens.accentSoft : tokens.ink,
        borderWidth: 1,
        borderColor: accent ? tokens.borderStrong : tokens.border,
        gap: 2,
      }}
    >
      <PresidentText
        variant="statSm"
        style={{ color: accent ? tokens.champagneBright : tokens.foreground }}
        numberOfLines={1}
      >
        {value}
      </PresidentText>
      <PresidentText variant="caption" muted numberOfLines={1}>
        {label}
      </PresidentText>
    </View>
  );
}

function createStyles(tokens: PresidentThemeTokens, tablet: boolean) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: tokens.bg },
    heroDeck: {
      borderRadius: presidentRadius.hero,
      borderWidth: 1,
      borderColor: tokens.borderStrong,
      backgroundColor: tokens.surface,
      padding: presidentLayout.heroPad,
      gap: presidentLayout.stackGap,
      overflow: 'hidden',
      ...presidentShadow.card,
    },
    heroDeckHeader: {
      flexDirection: tablet ? 'row' : 'column',
      alignItems: tablet ? 'flex-start' : 'stretch',
      justifyContent: 'space-between',
      gap: presidentLayout.stackGap,
    },
    heroDeckCopy: {
      gap: 4,
      flex: tablet ? 1 : undefined,
      minWidth: 0,
      paddingRight: tablet ? presidentSpace.md : 0,
    },
    kpiCluster: {
      flexDirection: 'row',
      flexWrap: 'nowrap',
      gap: presidentLayout.gridGap,
      alignSelf: 'stretch',
      width: tablet ? 280 : '100%',
      maxWidth: tablet ? 280 : undefined,
    },
    briefStrip: {
      padding: presidentLayout.cardPad,
      borderRadius: presidentRadius.md,
      borderWidth: 1,
      borderColor: tokens.hairline,
      backgroundColor: tokens.surfaceMuted,
      gap: 4,
    },
    decision: {
      borderRadius: presidentRadius.hero,
      borderWidth: 1,
      borderColor: tokens.borderLuxury,
      backgroundColor: tokens.surfaceRaised,
      padding: presidentLayout.heroPad,
      gap: presidentLayout.stackGap,
      overflow: 'hidden',
      ...presidentShadow.deep,
    },
    decisionHead: { gap: 6, minWidth: 0 },
    priorityList: { gap: presidentSpace.sm },
  });
}
