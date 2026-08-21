import React, { useMemo, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableSpring, AnimatedEntrance } from '../../components/motion';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { usePresidentHealth } from '../../features/president/hooks/usePresidentHealth';
import { usePresidentShellNav } from '../../features/president/shell/PresidentShellNavContext';
import { usePresidentTheme } from '../../features/president/shell/PresidentThemeContext';
import { PresidentHealthBoard } from '../../features/president/ui/PresidentHealthBoard';
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

/** Cockpit Accueil — composition héro santé + centre de décision (pas une liste de cartes). */
export function PresidentDashboardScreen() {
  const profile = useSessionProfile();
  const ws = useClubWorkspace();
  const health = usePresidentHealth(ws);
  const shellNav = usePresidentShellNav();
  const { tokens } = usePresidentTheme();
  const { width } = useWindowDimensions();
  const tablet = width >= presidentChrome.tabletBreakpoint;
  const styles = useMemo(() => createStyles(tokens, tablet), [tokens, tablet]);
  const [search, setSearch] = useState('');

  if (ws.loading) return <PresidentLoading label="Ouverture du cockpit exécutif…" />;

  const firstName = profile?.display_name?.split(/\s+/)[0] || 'Président';

  return (
    <View style={styles.root}>
      <PresidentChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
        <PresidentHeroBanner
          greeting={`Bonjour ${firstName}`}
          clubName={ws.club?.name ?? 'Votre club'}
          subtitle="Cockpit exécutif — l’état de votre club, en un regard."
          overall={health.overall}
        />

        <PresidentSearchField
          value={search}
          onChangeText={setSearch}
          placeholder="Commande directionnelle…"
          onFocus={() => shellNav?.openCommandPalette?.()}
        />

        {/* Composition héro : santé immersive */}
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
                Santé & direction
              </PresidentText>
              <PresidentText variant="caption" muted numberOfLines={2}>
                Touchez un axe pour ouvrir la section correspondante.
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
                Lecture éditoriale
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

        {/* Centre de décision — une composition, pas une carte isolée */}
        <AnimatedEntrance kind="fadeUp" index={2}>
          <View style={styles.decision}>
            <View style={styles.decisionHead}>
              <PresidentBrandMark compact />
              <PresidentText variant="h2" numberOfLines={1}>
                Centre de décision
              </PresidentText>
              <PresidentText variant="caption" muted numberOfLines={2}>
                Priorités heuristiques pour la direction.
              </PresidentText>
            </View>
            <View style={styles.insightList}>
              {health.insights.map((line, i) => (
                <View key={i} style={styles.insightRow}>
                  <View style={styles.insightIndex}>
                    <PresidentText
                      variant="caption"
                      style={{ color: tokens.accentText, fontWeight: '800' }}
                    >
                      {i + 1}
                    </PresidentText>
                  </View>
                  <PresidentText variant="body" style={{ flex: 1, minWidth: 0 }}>
                    {line}
                  </PresidentText>
                </View>
              ))}
            </View>
            <PressableSpring
              onPress={() => shellNav?.requestNav('ai')}
              scaleTo={0.98}
              haptic
              style={styles.aiCta}
            >
              <LinearGradient
                colors={[tokens.accent, '#B8955A']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
              <PresidentText
                variant="body"
                style={{ color: tokens.accentText, fontWeight: '800' }}
              >
                Ouvrir l’assistant exécutif
              </PresidentText>
              <PresidentText variant="caption" style={{ color: tokens.accentText, opacity: 0.75 }}>
                Dialogue Mistral · confirmation d’actions
              </PresidentText>
            </PressableSpring>
          </View>
        </AnimatedEntrance>

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
        </PresidentSectionCard>
      </PresidentChapterScroll>
    </View>
  );
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
    insightList: { gap: presidentSpace.sm },
    insightRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: presidentLayout.gridGap,
      paddingVertical: presidentSpace.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.hairline,
    },
    insightIndex: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: tokens.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
      flexShrink: 0,
    },
    aiCta: {
      marginTop: presidentSpace.sm,
      paddingVertical: presidentSpace.md + 2,
      paddingHorizontal: presidentLayout.cardPad,
      borderRadius: presidentRadius.lg,
      overflow: 'hidden',
      gap: 2,
      ...presidentShadow.glow(tokens),
    },
  });
}
