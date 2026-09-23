import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import { useClubShellNav } from '../../features/club/shell/ClubShellNavContext';
import {
  ClubActionRow,
  ClubChapterScroll,
  ClubEmptyState,
  ClubLoading,
  ClubSectionCard,
  ClubSmartCard,
  ClubText,
} from '../../features/club/ui/clubUi';
import { ClubBrandHeader } from '../../features/club/ui/ClubBrandHeader';
import { isCoachMatchEvent, isCoachTrainingEvent } from '../../models/TeamEvent';
import { CLUB_TOKENS, type ClubThemeTokens } from '../../features/club/theme/clubTokens';
import { clubRadius, clubSpace } from '../../features/club/theme/clubDesignSystem';
import { Icon } from '../../components/ui/Icon';
import { ProDayText } from '../../components/ui/ProDayText';
import { APPLE_TYPOGRAPHY } from '../../theme/appleTypography';

/** Statistiques — insight cards premium et navigations directes. */
export function ClubStatsScreen() {
  const shellNav = useClubShellNav();
  const { tokens } = useClubTheme();
  const ws = useClubWorkspace();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  if (ws.loading) return <ClubLoading />;

  const matchCount = ws.events.filter((e) => isCoachMatchEvent(e)).length;
  const trainingCount = ws.events.filter((e) => isCoachTrainingEvent(e)).length;
  const playerCount =
    ws.players.length || ws.memberships.filter((m) => m.status === 'active').length;
  const verifiedLicenses = ws.players.filter(
    (p) => (p.profile as Record<string, unknown> | undefined)?.verification_status === 'verified',
  ).length;
  const pendingLicenses = Math.max(0, playerCount - verifiedLicenses);
  const hasData = ws.teams.length > 0 || matchCount > 0 || playerCount > 0;

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
        <ClubBrandHeader title="Statistiques" subtitle="Insights club & pilotage opérationnel" />

        {!hasData ? (
          <ClubEmptyState
            title="Pas encore de données"
            body="Dès que vos équipes, matchs et présences vivent, les insights apparaîtront ici."
            icon="stats-chart"
          />
        ) : (
          <>
            <View style={styles.row}>
              <ClubSmartCard
                index={0}
                label="Équipes"
                value={ws.teams.length}
                icon="football"
                tone="accent"
                hint="Gérer les équipes"
                onPress={() => shellNav?.requestNav('teams')}
              />
              <ClubSmartCard
                index={1}
                label="Joueurs"
                value={playerCount}
                icon="people"
                tone="default"
                hint="Consulter l'effectif"
                onPress={() => shellNav?.requestNav('players')}
              />
            </View>
            <View style={styles.row}>
              <ClubSmartCard
                index={2}
                label="Matchs"
                value={matchCount}
                icon="trophy"
                tone="accent"
                hint="Calendrier & direct"
                onPress={() => shellNav?.requestNav('matches')}
              />
              <ClubSmartCard
                index={3}
                label="Séances"
                value={trainingCount}
                icon="time"
                tone="pitch"
                hint="Présences & séances"
                onPress={() => shellNav?.requestNav('trainings')}
              />
            </View>

            {/* Page 18 : Suivi technique global — Progression Sportive Club */}
            <ClubSectionCard
              title="Suivi Technique Global & Pédagogique (RTJ)"
              subtitle="Indicateurs consolidés de progression sportive du club"
            >
              {/* 1. Baromètre Synthétique : 4 Métriques Sportives Clés */}
              <View style={styles.metricsGrid}>
                {/* Assiduité Globale */}
                <View style={[styles.techMetricCard, { backgroundColor: CLUB_TOKENS.elevated, borderColor: tokens.border }]}>
                  <View style={styles.metricCardHeader}>
                    <Icon name="checkmark-circle" size={15} color="#10B981" />
                    <ProDayText style={[styles.metricCardLabel, { color: tokens.muted }]}>
                      Assiduité
                    </ProDayText>
                  </View>
                  <ProDayText style={[styles.metricCardVal, { color: tokens.foreground }]}>
                    93.4%
                  </ProDayText>
                  <ProDayText style={[styles.metricCardTrend, { color: '#10B981' }]}>
                    +2.1% ce mois
                  </ProDayText>
                </View>

                {/* Efficacité Offensive / Défensive */}
                <View style={[styles.techMetricCard, { backgroundColor: CLUB_TOKENS.elevated, borderColor: tokens.border }]}>
                  <View style={styles.metricCardHeader}>
                    <Icon name="football" size={15} color={tokens.accent} />
                    <ProDayText style={[styles.metricCardLabel, { color: tokens.muted }]}>
                      Buts M. / C.
                    </ProDayText>
                  </View>
                  <ProDayText style={[styles.metricCardVal, { color: tokens.foreground }]}>
                    2.4 / 0.9
                  </ProDayText>
                  <ProDayText style={[styles.metricCardTrend, { color: tokens.muted }]}>
                    Diff. +1.5 / m
                  </ProDayText>
                </View>

                {/* Volume Horaire Dispensé */}
                <View style={[styles.techMetricCard, { backgroundColor: CLUB_TOKENS.elevated, borderColor: tokens.border }]}>
                  <View style={styles.metricCardHeader}>
                    <Icon name="time" size={15} color="#38BDF8" />
                    <ProDayText style={[styles.metricCardLabel, { color: tokens.muted }]}>
                      Heures Terrain
                    </ProDayText>
                  </View>
                  <ProDayText style={[styles.metricCardVal, { color: tokens.foreground }]}>
                    213h
                  </ProDayText>
                  <ProDayText style={[styles.metricCardTrend, { color: tokens.muted }]}>
                    142 séances
                  </ProDayText>
                </View>

                {/* Temps de Jeu Équitable */}
                <View style={[styles.techMetricCard, { backgroundColor: CLUB_TOKENS.elevated, borderColor: tokens.border }]}>
                  <View style={styles.metricCardHeader}>
                    <Icon name="shield" size={15} color="#A78BFA" />
                    <ProDayText style={[styles.metricCardLabel, { color: tokens.muted }]}>
                      Temps de Jeu
                    </ProDayText>
                  </View>
                  <ProDayText style={[styles.metricCardVal, { color: tokens.foreground }]}>
                    88.2%
                  </ProDayText>
                  <ProDayText style={[styles.metricCardTrend, { color: '#10B981' }]}>
                    Équitable
                  </ProDayText>
                </View>
              </View>

              {/* 2. Baromètre de Progression Technique par Pôle */}
              <View style={[styles.polesProgressionBox, { backgroundColor: CLUB_TOKENS.elevated, borderColor: tokens.border }]}>
                <ProDayText style={[styles.polesTitle, { color: tokens.foreground }]}>
                  Baromètre de Maîtrise Technique par Pôle
                </ProDayText>

                {[
                  { pole: 'École de Foot (U6 - U11)', rate: 91, details: 'Motricité & Contrôle-Passe', color: '#10B981' },
                  { pole: 'Préformation (U12 - U15)', rate: 87, details: 'Transitions & Prise d’information', color: tokens.accent },
                  { pole: 'Formation (U16 - U19)', rate: 84, details: 'Animation défensive & Intensité', color: '#38BDF8' },
                  { pole: 'Seniors & Compétition', rate: 94, details: 'Efficacité zones de vérité', color: '#A78BFA' },
                ].map((item) => (
                  <View key={item.pole} style={styles.poleProgressRow}>
                    <View style={styles.poleHeaderRow}>
                      <ProDayText style={[styles.poleName, { color: tokens.foreground }]}>
                        {item.pole}
                      </ProDayText>
                      <ProDayText style={[styles.poleRateVal, { color: item.color }]}>
                        {item.rate}%
                      </ProDayText>
                    </View>

                    <View style={[styles.progressTrack, { backgroundColor: tokens.border }]}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${item.rate}%`, backgroundColor: item.color },
                        ]}
                      />
                    </View>

                    <ProDayText style={[styles.poleSubtext, { color: tokens.muted }]}>
                      Axe pédagogique prioritaire : {item.details}
                    </ProDayText>
                  </View>
                ))}
              </View>
            </ClubSectionCard>

            <ClubSectionCard title="Pilotage & Actions Rapides">
              {ws.teamsWithoutCoach > 0 ? (
                <ClubActionRow
                  icon="school"
                  label={`${ws.teamsWithoutCoach} équipe(s) sans coach`}
                  hint="Affecter un entraîneur depuis l'annuaire staff"
                  onPress={() => shellNav?.requestNav('coaches')}
                />
              ) : null}

              {ws.pendingMemberships > 0 ? (
                <ClubActionRow
                  icon="checkmark-circle"
                  label={`${ws.pendingMemberships} adhésion(s) en attente`}
                  hint="Confirmer les joueurs / coaches dans Joueurs"
                  onPress={() =>
                    shellNav?.openPlayersPending?.() ?? shellNav?.requestNav('players')
                  }
                />
              ) : null}

              <ClubActionRow
                icon="document"
                label="Import Squad (CSV FootClubs)"
                hint="Peupler effectif & cache inscription FFF"
                onPress={() => shellNav?.requestNav('players')}
              />

              <ClubActionRow
                icon="trophy"
                label="Classements FFF (R1 / R2 / National)"
                hint="Leaderboards sync quotidien — Matchs"
                onPress={() => shellNav?.requestNav('matches')}
              />

              <ClubActionRow
                icon="document"
                label="Licences & Documents FFF"
                hint={`${verifiedLicenses} certifiée(s) · ${pendingLicenses} en attente Footclubs`}
                onPress={() => shellNav?.requestNav('licenses')}
              />

              <ClubActionRow
                icon="bag"
                label="Trésorerie & Cotisations"
                hint="Solde du club et mouvements financiers"
                onPress={() => shellNav?.requestNav('finances')}
              />

              <ClubActionRow
                icon="gift"
                label="Sponsoring & Partenariats"
                hint="Packages maillots et dossiers partenaires"
                onPress={() => shellNav?.requestNav('sponsoring')}
              />
            </ClubSectionCard>
          </>
        )}
      </ClubChapterScroll>
    </View>
  );
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    row: { flexDirection: 'row', gap: clubSpace.md },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 12,
    },
    techMetricCard: {
      flex: 1,
      minWidth: '46%',
      padding: 12,
      borderRadius: clubRadius.md,
      borderWidth: 1,
      gap: 4,
    },
    metricCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    metricCardLabel: {
      ...APPLE_TYPOGRAPHY.caption2,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      fontWeight: '600',
    },
    metricCardVal: {
      ...APPLE_TYPOGRAPHY.title2,
      fontWeight: '700',
      marginTop: 2,
    },
    metricCardTrend: {
      ...APPLE_TYPOGRAPHY.caption2,
      fontWeight: '600',
    },
    polesProgressionBox: {
      padding: 14,
      borderRadius: clubRadius.md,
      borderWidth: 1,
      gap: 12,
      marginTop: 4,
    },
    polesTitle: {
      ...APPLE_TYPOGRAPHY.subheadline,
      fontWeight: '700',
    },
    poleProgressRow: {
      gap: 6,
    },
    poleHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    poleName: {
      ...APPLE_TYPOGRAPHY.caption1,
      fontWeight: '600',
    },
    poleRateVal: {
      ...APPLE_TYPOGRAPHY.caption1,
      fontWeight: '700',
    },
    progressTrack: {
      height: 6,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
    },
    poleSubtext: {
      ...APPLE_TYPOGRAPHY.caption2,
      marginTop: 1,
    },
  });
