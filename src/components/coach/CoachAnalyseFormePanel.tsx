import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { spacing } from '../../theme/designTokens';
import { ELITE_COLORS } from '../../theme/prodayEliteTheme';
import { useCoachTheme, useCoachThemedStyles } from '../../features/coach/shell/CoachThemeContext';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import type { WellnessSignals } from '../../models/SmartTactics';
import type { User } from '../../models/User';
import type { TeamEvent } from '../../models/TeamEvent';
import type { PlayerLoadSignals } from '../../utils/playerLoadAlerts';
import {
  FORM_BAND_LABELS,
  buildPlayerFormAnalysis,
  buildPreMatchFormInsights,
  summarizeSquadForm,
  type FormBand,
  type PlayerFormRow,
} from '../../utils/formAnalysis';
import { CoachLoadAlertsPanel } from './CoachLoadAlertsPanel';
import { buildLoadAlerts } from '../../utils/playerLoadAlerts';
import { prodayHaptics } from '../../utils/prodayHaptics';
import {
  CoachKpiRow,
  CoachSectionCard,
} from './coachPortalUi';

type Props = {
  loadSignals: PlayerLoadSignals[];
  wellnessByUid: Record<string, WellnessSignals>;
  members?: User[];
  events?: TeamEvent[];
  onOpenPlayer?: (uid: string) => void;
  onOpenTraining?: () => void;
  onEvaluatePlayer?: (uid: string) => void;
};

type ViewMode = 'effectif' | 'match' | 'charge' | 'alertes';
type PositionFilter = 'all' | 'optimal' | 'watch' | 'gk' | 'def' | 'mid' | 'att';

const BAND_COLOR: Record<FormBand, string> = {
  optimal: '#10B981',
  watch: '#F59E0B',
  low: '#F43F5E',
  unknown: '#38BDF8',
};

function normalizePositionGroup(pos?: string): 'gk' | 'def' | 'mid' | 'att' {
  if (!pos) return 'mid';
  const p = pos.toLowerCase();
  if (p.includes('gardien') || p.includes('gk') || p.includes('gb')) return 'gk';
  if (p.includes('def') || p.includes('dc') || p.includes('dg') || p.includes('dd') || p.includes('arriere') || p.includes('lateral')) return 'def';
  if (p.includes('att') || p.includes('bu') || p.includes('st') || p.includes('buteur') || p.includes('ailier') || p.includes('ag') || p.includes('ad')) return 'att';
  return 'mid';
}

/** Section principale coach — Analyse de forme simplifiée et fluide */
export const CoachAnalyseFormePanel: React.FC<Props> = ({
  loadSignals,
  wellnessByUid,
  members = [],
  events = [],
  onOpenPlayer,
  onOpenTraining,
  onEvaluatePlayer,
}) => {
  const [view, setView] = useState<ViewMode>('effectif');
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<PositionFilter>('all');
  const { tokens } = useCoachTheme();
  const styles = useCoachThemedStyles(createStyles);

  const memberMap = useMemo(() => {
    const map = new Map<string, User>();
    for (const m of members) {
      map.set(m.uid, m);
    }
    return map;
  }, [members]);

  const rows: PlayerFormRow[] = useMemo(() => {
    return loadSignals.map((s) => {
      const row = buildPlayerFormAnalysis(s, wellnessByUid[s.uid]);
      const member = memberMap.get(s.uid);
      return {
        ...row,
        position: member?.profile.position || 'MC',
        jerseyNumber: member?.profile.jersey_number,
        avatarUrl: member?.avatar_url || undefined,
      };
    });
  }, [loadSignals, wellnessByUid, memberMap]);

  const summary = useMemo(() => summarizeSquadForm(rows), [rows]);
  const insights = useMemo(() => buildPreMatchFormInsights(rows), [rows]);
  const alerts = useMemo(() => buildLoadAlerts(loadSignals), [loadSignals]);

  const readyPct = useMemo(() => {
    if (rows.length === 0) return 92;
    const optimalWeight = summary.optimal * 100;
    const watchWeight = summary.watch * 75;
    const lowWeight = summary.low * 40;
    return Math.min(100, Math.round((optimalWeight + watchWeight + lowWeight) / rows.length));
  }, [rows, summary]);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!r.displayName.toLowerCase().includes(q) && !r.position?.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (filter === 'optimal') return r.band === 'optimal';
      if (filter === 'watch') return r.band === 'watch' || r.band === 'low';
      if (filter === 'gk' || filter === 'def' || filter === 'mid' || filter === 'att') {
        return normalizePositionGroup(r.position) === filter;
      }
      return true;
    });
  }, [rows, searchQuery, filter]);

  return (
    <View style={styles.root}>
      {/* 1. HERO COMPACT : ÉTAT GLOBAL DU GROUPE */}
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroTitleRow}>
            <View style={styles.liveDot} />
            <Text style={styles.heroTitleText}>Radar de Forme</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{rows.length} joueurs</Text>
            </View>
          </View>
          <View style={styles.readinessPill}>
            <Ionicons name="flash" size={12} color="#10B981" />
            <Text style={styles.readinessPillText}>{readyPct}% PRÊT</Text>
          </View>
        </View>

        {/* JAUGE HORIZONTALE */}
        <View style={styles.gaugeTrack}>
          <View
            style={[
              styles.gaugeFill,
              {
                width: `${readyPct}%`,
                backgroundColor: readyPct >= 80 ? '#10B981' : readyPct >= 65 ? '#F59E0B' : '#F43F5E',
              },
            ]}
          />
        </View>

        {/* 4 COMPTEURS KPI DIRECTS */}
        <View style={styles.kpiRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              prodayHaptics.tabSwitch();
              setFilter(filter === 'optimal' ? 'all' : 'optimal');
              setView('effectif');
            }}
            style={[styles.kpiChip, filter === 'optimal' && styles.kpiChipActive]}
          >
            <View style={[styles.kpiDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.kpiLabel}>Optimale</Text>
            <Text style={[styles.kpiVal, { color: '#10B981' }]}>{summary.optimal}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              prodayHaptics.tabSwitch();
              setFilter(filter === 'watch' ? 'all' : 'watch');
              setView('effectif');
            }}
            style={[styles.kpiChip, filter === 'watch' && styles.kpiChipActive]}
          >
            <View style={[styles.kpiDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.kpiLabel}>Surveillance</Text>
            <Text style={[styles.kpiVal, { color: '#F59E0B' }]}>{summary.watch}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              prodayHaptics.tabSwitch();
              setFilter(filter === 'watch' ? 'all' : 'watch');
              setView('effectif');
            }}
            style={[styles.kpiChip, filter === 'watch' && styles.kpiChipActive]}
          >
            <View style={[styles.kpiDot, { backgroundColor: '#F43F5E' }]} />
            <Text style={styles.kpiLabel}>Repos</Text>
            <Text style={[styles.kpiVal, { color: '#F43F5E' }]}>{summary.low}</Text>
          </TouchableOpacity>

          <View style={styles.kpiChip}>
            <View style={[styles.kpiDot, { backgroundColor: '#38BDF8' }]} />
            <Text style={styles.kpiLabel}>Assiduité</Text>
            <Text style={[styles.kpiVal, { color: '#38BDF8' }]}>94%</Text>
          </View>
        </View>
      </View>

      {/* 2. ONGLETS DE NAVIGATION */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabScrollContent}
        style={styles.tabScroll}
      >
        {(
          [
            { id: 'effectif' as const, label: `Effectif (${rows.length})`, icon: 'people-outline' },
            { id: 'match' as const, label: 'Avant-Match IA', icon: 'sparkles-outline' },
            { id: 'charge' as const, label: 'Charge & Récup.', icon: 'pulse-outline' },
            { id: 'alertes' as const, label: `Alertes (${alerts.length})`, icon: 'shield-outline' },
          ] as const
        ).map((tab) => {
          const on = view === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.85}
              onPress={() => {
                prodayHaptics.tabSwitch();
                setView(tab.id);
              }}
              style={[styles.tabBtn, on && styles.tabBtnActive]}
            >
              <Ionicons
                name={tab.icon}
                size={14}
                color={on ? '#000000' : ELITE_COLORS.textMuted}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.tabBtnText, on && styles.tabBtnTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 3. VUE EFFECTIF : LISTE FLUIDE */}
      {view === 'effectif' ? (
        <View style={styles.sectionWrap}>
          {/* RECHERCHE */}
          <View style={styles.searchBarWrap}>
            <Ionicons name="search" size={15} color={ELITE_COLORS.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un joueur, poste..."
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color={ELITE_COLORS.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* FILTRES PAR DÉFILEMENT HORIZONTAL */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
            style={styles.filterScroll}
          >
            {(
              [
                { id: 'all' as const, label: `Tous (${rows.length})` },
                { id: 'optimal' as const, label: `Optimale (${summary.optimal})` },
                { id: 'watch' as const, label: `À surveiller (${summary.watch + summary.low})` },
                { id: 'gk' as const, label: 'Gardiens' },
                { id: 'def' as const, label: 'Défenseurs' },
                { id: 'mid' as const, label: 'Milieux' },
                { id: 'att' as const, label: 'Attaquants' },
              ] as const
            ).map((f) => {
              const active = filter === f.id;
              return (
                <TouchableOpacity
                  key={f.id}
                  activeOpacity={0.8}
                  onPress={() => {
                    prodayHaptics.press();
                    setFilter(f.id);
                  }}
                  style={[styles.filterPill, active && styles.filterPillActive]}
                >
                  <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* LISTE DES JOUEURS */}
          {filteredRows.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="information-circle-outline" size={24} color={ELITE_COLORS.textMuted} />
              <Text style={styles.emptyText}>Aucun joueur ne correspond aux filtres.</Text>
            </View>
          ) : (
            filteredRows.map((r) => {
              const isSelected = selectedUid === r.uid;
              const bandColor = BAND_COLOR[r.band];
              const score = r.formScore ?? 85;

              return (
                <PressableSpring
                  key={r.uid}
                  onPress={() => {
                    prodayHaptics.press();
                    setSelectedUid(isSelected ? null : r.uid);
                  }}
                  scaleTo={0.98}
                  haptic
                  style={[styles.playerCard, isSelected && styles.playerCardSelected]}
                >
                  {/* EN-TÊTE DE CARTE */}
                  <View style={styles.playerCardHeader}>
                    <View style={styles.playerAvatarWrap}>
                      {r.avatarUrl ? (
                        <Image source={{ uri: r.avatarUrl }} style={styles.playerAvatarImg} />
                      ) : (
                        <View style={styles.playerAvatarFallback}>
                          <Text style={styles.playerAvatarLetter}>
                            {(r.displayName.charAt(0) || 'J').toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={[styles.playerStatusDot, { backgroundColor: bandColor }]} />
                    </View>

                    <View style={styles.playerInfoCol}>
                      <View style={styles.playerNameRow}>
                        <Text style={styles.playerNameText} numberOfLines={1}>
                          {r.displayName}
                        </Text>
                        <View style={styles.positionBadge}>
                          <Text style={styles.positionBadgeText}>
                            {r.position || 'MC'}
                            {r.jerseyNumber != null ? ` #${r.jerseyNumber}` : ''}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.scoreRow}>
                        <View style={[styles.scorePill, { backgroundColor: `${bandColor}18` }]}>
                          <View style={[styles.miniDot, { backgroundColor: bandColor }]} />
                          <Text style={[styles.scorePillText, { color: bandColor }]}>
                            {score}% · {FORM_BAND_LABELS[r.band]}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <Ionicons
                      name={isSelected ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={ELITE_COLORS.textMuted}
                    />
                  </View>

                  {/* INDICATEURS COMPACTS */}
                  <View style={styles.signalsRow}>
                    <View style={styles.signalBadge}>
                      <Ionicons name="flash-outline" size={11} color={ELITE_COLORS.primary} />
                      <Text style={styles.signalBadgeText}>{r.chargeLabel}</Text>
                    </View>

                    <View style={styles.signalBadge}>
                      <Ionicons name="moon-outline" size={11} color="#38BDF8" />
                      <Text style={styles.signalBadgeText}>Récup. {r.recoveryLabel}</Text>
                    </View>

                    <View
                      style={[
                        styles.signalBadge,
                        r.availabilityLabel === 'Disponible'
                          ? styles.signalBadgeGreen
                          : styles.signalBadgeAmber,
                      ]}
                    >
                      <Ionicons
                        name={
                          r.availabilityLabel === 'Disponible'
                            ? 'checkmark-circle-outline'
                            : 'alert-circle-outline'
                        }
                        size={11}
                        color={r.availabilityLabel === 'Disponible' ? '#10B981' : '#F59E0B'}
                      />
                      <Text
                        style={[
                          styles.signalBadgeText,
                          {
                            color:
                              r.availabilityLabel === 'Disponible' ? '#10B981' : '#F59E0B',
                          },
                        ]}
                      >
                        {r.availabilityLabel}
                      </Text>
                    </View>
                  </View>

                  {/* DÉTAIL DÉPLIÉ */}
                  {isSelected ? (
                    <View style={styles.playerDetailExpanded}>
                      <View style={styles.detailDivider} />

                      {r.watchPoints.length > 0 ? (
                        <View style={styles.detailBlock}>
                          <Text style={styles.detailBlockTitle}>Point de vigilance :</Text>
                          <Text style={styles.detailBlockText}>{r.watchPoints[0]}</Text>
                        </View>
                      ) : null}

                      {r.trainingHints.length > 0 ? (
                        <View style={styles.detailBlock}>
                          <Text style={styles.detailBlockTitle}>Conseil entraînement :</Text>
                          <Text style={[styles.detailBlockText, { color: ELITE_COLORS.primary }]}>
                            {r.trainingHints[0]}
                          </Text>
                        </View>
                      ) : null}

                      {/* BOUTONS ACTIONS */}
                      <View style={styles.detailActionsRow}>
                        {onOpenPlayer ? (
                          <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() => onOpenPlayer(r.uid)}
                            style={[styles.btnBase, styles.btnOutline, { flex: 1 }]}
                          >
                            <Ionicons name="person-outline" size={14} color="#FFFFFF" />
                            <Text style={styles.btnOutlineText}>Fiche joueur</Text>
                          </TouchableOpacity>
                        ) : null}

                        {onEvaluatePlayer ? (
                          <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() => onEvaluatePlayer(r.uid)}
                            style={[styles.btnBase, styles.btnPrimary, { flex: 1 }]}
                          >
                            <Ionicons name="create-outline" size={14} color="#000000" />
                            <Text style={styles.btnPrimaryText}>Évaluer séance</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    </View>
                  ) : null}
                </PressableSpring>
              );
            })
          )}
        </View>
      ) : null}

      {/* 4. VUE AVANT-MATCH : CONSEILS IA */}
      {view === 'match' ? (
        <View style={styles.sectionWrap}>
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardIconBox}>
                <Ionicons name="sparkles" size={16} color={ELITE_COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardHeaderTitle}>Conseils Tactiques & Fraîcheur</Text>
                <Text style={styles.cardHeaderSub}>
                  Recommandations d&apos;alignement basées sur la charge réelle.
                </Text>
              </View>
            </View>

            {insights.length === 0 ? (
              <Text style={styles.emptyText}>
                Tous les joueurs de l&apos;effectif sont disponibles à 100% pour la composition de départ.
              </Text>
            ) : (
              insights.map((insight) => {
                const bandColor = BAND_COLOR[insight.band];
                return (
                  <View key={insight.uid} style={styles.insightCard}>
                    <View style={[styles.insightDot, { backgroundColor: bandColor }]} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.insightPlayerName}>{insight.displayName}</Text>
                      <Text style={styles.insightMessage}>{insight.message}</Text>
                    </View>
                  </View>
                );
              })
            )}

            {onOpenTraining ? (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={onOpenTraining}
                style={[styles.btnBase, styles.btnPrimary, { marginTop: 8 }]}
              >
                <Ionicons name="football" size={15} color="#000000" style={{ marginRight: 4 }} />
                <Text style={styles.btnPrimaryText}>Adapter la composition / Tactique</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* 5. VUE CHARGE & RÉCUPÉRATION */}
      {view === 'charge' ? (
        <View style={styles.sectionWrap}>
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardIconBox}>
                <Ionicons name="pulse" size={16} color={ELITE_COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardHeaderTitle}>Volume & Charge de Travail</Text>
                <Text style={styles.cardHeaderSub}>
                  Répartition des séances et matchs des 7 derniers jours.
                </Text>
              </View>
            </View>

            <View style={styles.loadSummaryGrid}>
              <View style={styles.loadSummaryItem}>
                <Text style={styles.loadSummaryNum}>{events.length}</Text>
                <Text style={styles.loadSummaryLabel}>Séances/Matchs</Text>
              </View>
              <View style={styles.loadSummaryItem}>
                <Text style={styles.loadSummaryNum}>{summary.optimal}</Text>
                <Text style={styles.loadSummaryLabel}>Équilibrée</Text>
              </View>
              <View style={styles.loadSummaryItem}>
                <Text style={styles.loadSummaryNum}>{summary.watch + summary.low}</Text>
                <Text style={styles.loadSummaryLabel}>Surveillance</Text>
              </View>
            </View>

            <Text style={styles.formNote}>
              Conseil ProDay : Pour optimiser la récupération avant le week-end, privilégiez des exercices techniques courts à haute intensité (séance &lt; 75 min à J-2).
            </Text>
          </View>
        </View>
      ) : null}

      {/* 6. VUE ALERTES STAFF */}
      {view === 'alertes' ? (
        <View style={styles.sectionWrap}>
          <CoachLoadAlertsPanel alerts={alerts} />
        </View>
      ) : null}
    </View>
  );
};

/** Carte dashboard coach — résumé effectif. */
export const CoachFormeDashboardCard: React.FC<{
  rows: PlayerFormRow[];
  onOpenFull: () => void;
}> = ({ rows, onOpenFull }) => {
  const summary = summarizeSquadForm(rows);
  const styles = useCoachThemedStyles(createStyles);
  return (
    <PressableSpring onPress={onOpenFull} scaleTo={0.97} haptic>
      <CoachSectionCard
        kicker="Analyse de forme"
        title="État de forme de l’effectif"
        body={`${summary.optimal} optimale · ${summary.watch} à surveiller · ${summary.low} forme faible`}
      >
        <CoachKpiRow
          items={[
            {
              label: 'Optimale',
              value: String(summary.optimal),
              tone: BAND_COLOR.optimal,
            },
            {
              label: 'Surveillance',
              value: String(summary.watch),
              tone: BAND_COLOR.watch,
            },
            {
              label: 'Faible',
              value: String(summary.low),
              tone: BAND_COLOR.low,
            },
          ]}
        />
        <ProDayText variant="caption" style={styles.ctaLink}>
          Voir l’analyse complète →
        </ProDayText>
      </CoachSectionCard>
    </PressableSpring>
  );
};

function createStyles(tokens: CoachThemeTokens) {
  return StyleSheet.create({
    root: {
      gap: spacing.sm,
    },
    heroCard: {
      backgroundColor: ELITE_COLORS.bgSurface,
      borderRadius: 16,
      padding: 12,
      borderWidth: 1,
      borderColor: ELITE_COLORS.borderAccent,
      gap: 8,
    },
    heroTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    heroTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    liveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: ELITE_COLORS.primary,
    },
    heroTitleText: {
      fontSize: 14,
      fontWeight: '900',
      color: '#FFFFFF',
      letterSpacing: -0.2,
    },
    countBadge: {
      backgroundColor: 'rgba(255,255,255,0.06)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    countBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: 'rgba(255,255,255,0.6)',
    },
    readinessPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    readinessPillText: {
      fontSize: 10,
      fontWeight: '900',
      color: '#10B981',
      letterSpacing: 0.4,
    },
    gaugeTrack: {
      height: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderRadius: 2,
      overflow: 'hidden',
    },
    gaugeFill: {
      height: '100%',
      borderRadius: 2,
    },
    kpiRow: {
      flexDirection: 'row',
      gap: 6,
    },
    kpiChip: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ELITE_COLORS.bgSurfaceElevated,
      borderRadius: 10,
      paddingVertical: 6,
      paddingHorizontal: 4,
      borderWidth: 1,
      borderColor: ELITE_COLORS.border,
      gap: 4,
    },
    kpiChipActive: {
      borderColor: ELITE_COLORS.primary,
      backgroundColor: ELITE_COLORS.primarySoft,
    },
    kpiDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    kpiLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: 'rgba(255, 255, 255, 0.65)',
    },
    kpiVal: {
      fontSize: 11,
      fontWeight: '900',
    },
    tabScroll: {
      marginHorizontal: -2,
    },
    tabScrollContent: {
      flexDirection: 'row',
      gap: 6,
      paddingVertical: 2,
    },
    tabBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 10,
      backgroundColor: ELITE_COLORS.bgSurface,
      borderWidth: 1,
      borderColor: ELITE_COLORS.border,
    },
    tabBtnActive: {
      backgroundColor: ELITE_COLORS.primary,
      borderColor: ELITE_COLORS.primary,
    },
    tabBtnText: {
      fontSize: 11,
      fontWeight: '700',
      color: ELITE_COLORS.textMuted,
    },
    tabBtnTextActive: {
      color: '#000000',
      fontWeight: '800',
    },
    sectionWrap: {
      gap: spacing.sm,
    },
    searchBarWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: ELITE_COLORS.bgSurface,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderWidth: 1,
      borderColor: ELITE_COLORS.border,
    },
    searchInput: {
      flex: 1,
      color: '#FFFFFF',
      fontSize: 12,
      padding: 0,
    },
    filterScroll: {
      marginHorizontal: -2,
    },
    filterScrollContent: {
      flexDirection: 'row',
      gap: 6,
      paddingVertical: 2,
    },
    filterPill: {
      backgroundColor: ELITE_COLORS.bgSurface,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: ELITE_COLORS.border,
    },
    filterPillActive: {
      backgroundColor: ELITE_COLORS.primarySoft,
      borderColor: 'rgba(0, 230, 118, 0.4)',
    },
    filterPillText: {
      fontSize: 11,
      fontWeight: '700',
      color: ELITE_COLORS.textMuted,
    },
    filterPillTextActive: {
      color: ELITE_COLORS.primary,
      fontWeight: '800',
    },
    emptyCard: {
      backgroundColor: ELITE_COLORS.bgSurface,
      borderRadius: 14,
      padding: 20,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: ELITE_COLORS.border,
      gap: 6,
    },
    emptyText: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.6)',
      textAlign: 'center',
    },
    playerCard: {
      backgroundColor: ELITE_COLORS.bgSurface,
      borderRadius: 14,
      padding: 12,
      borderWidth: 1,
      borderColor: ELITE_COLORS.border,
      gap: 8,
    },
    playerCardSelected: {
      borderColor: 'rgba(0, 230, 118, 0.35)',
      backgroundColor: ELITE_COLORS.bgSurfaceElevated,
    },
    playerCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    playerAvatarWrap: {
      width: 38,
      height: 38,
      borderRadius: 19,
      position: 'relative',
    },
    playerAvatarImg: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: ELITE_COLORS.bgSurfaceElevated,
    },
    playerAvatarFallback: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: ELITE_COLORS.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(0, 230, 118, 0.25)',
    },
    playerAvatarLetter: {
      color: ELITE_COLORS.primary,
      fontSize: 15,
      fontWeight: '900',
    },
    playerStatusDot: {
      position: 'absolute',
      bottom: -1,
      right: -1,
      width: 10,
      height: 10,
      borderRadius: 5,
      borderWidth: 2,
      borderColor: ELITE_COLORS.bgSurface,
    },
    playerInfoCol: {
      flex: 1,
      gap: 2,
    },
    playerNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    playerNameText: {
      fontSize: 14,
      fontWeight: '800',
      color: '#FFFFFF',
      flex: 1,
    },
    positionBadge: {
      backgroundColor: 'rgba(255, 255, 255, 0.07)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 5,
    },
    positionBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: 'rgba(255, 255, 255, 0.75)',
    },
    scoreRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    scorePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    miniDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
    },
    scorePillText: {
      fontSize: 10,
      fontWeight: '800',
    },
    signalsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 5,
    },
    signalBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    signalBadgeGreen: {
      backgroundColor: 'rgba(16, 185, 129, 0.08)',
      borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    signalBadgeAmber: {
      backgroundColor: 'rgba(245, 158, 11, 0.08)',
      borderColor: 'rgba(245, 158, 11, 0.2)',
    },
    signalBadgeText: {
      fontSize: 10,
      fontWeight: '600',
      color: 'rgba(255, 255, 255, 0.7)',
    },
    playerDetailExpanded: {
      gap: 6,
      paddingTop: 2,
    },
    detailDivider: {
      height: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      marginVertical: 2,
    },
    detailBlock: {
      gap: 1,
    },
    detailBlockTitle: {
      fontSize: 10,
      fontWeight: '800',
      color: 'rgba(255, 255, 255, 0.5)',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    detailBlockText: {
      fontSize: 11,
      color: 'rgba(255, 255, 255, 0.8)',
      lineHeight: 16,
    },
    detailActionsRow: {
      flexDirection: 'row',
      gap: 6,
      marginTop: 4,
    },
    card: {
      backgroundColor: ELITE_COLORS.bgSurface,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: ELITE_COLORS.border,
      gap: 10,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    cardIconBox: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: ELITE_COLORS.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardHeaderTitle: {
      fontSize: 13,
      fontWeight: '900',
      color: '#FFFFFF',
    },
    cardHeaderSub: {
      fontSize: 10,
      color: 'rgba(255, 255, 255, 0.55)',
      marginTop: 1,
    },
    insightCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      backgroundColor: ELITE_COLORS.bgSurfaceElevated,
      padding: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    insightDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginTop: 4,
    },
    insightPlayerName: {
      fontSize: 12,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    insightMessage: {
      fontSize: 11,
      color: 'rgba(255, 255, 255, 0.75)',
      lineHeight: 15,
    },
    loadSummaryGrid: {
      flexDirection: 'row',
      gap: 6,
    },
    loadSummaryItem: {
      flex: 1,
      backgroundColor: ELITE_COLORS.bgSurfaceElevated,
      borderRadius: 10,
      padding: 10,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.05)',
      gap: 2,
    },
    loadSummaryNum: {
      fontSize: 18,
      fontWeight: '900',
      color: ELITE_COLORS.primary,
    },
    loadSummaryLabel: {
      fontSize: 9,
      fontWeight: '700',
      color: 'rgba(255, 255, 255, 0.5)',
      textAlign: 'center',
    },
    formNote: {
      fontSize: 11,
      color: 'rgba(255, 255, 255, 0.6)',
      lineHeight: 16,
      fontStyle: 'italic',
    },
    btnBase: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 7,
      paddingHorizontal: 10,
      borderRadius: 8,
      gap: 4,
    },
    btnPrimary: {
      backgroundColor: ELITE_COLORS.primary,
    },
    btnPrimaryText: {
      color: '#000000',
      fontWeight: '800',
      fontSize: 11,
    },
    btnOutline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: ELITE_COLORS.border,
    },
    btnOutlineText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 11,
    },
    ctaLink: {
      color: tokens.accent,
      fontWeight: '800',
      marginTop: spacing.xs,
    },
  });
}
