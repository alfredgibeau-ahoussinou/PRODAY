import React, { useState } from 'react';
import {
  PRO_DATA_VIOLET,
  proSemantic,
} from '../../theme/professionalDesign';
import { withAlpha } from '../../utils/coachTeamTheme';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { CoachTacticalBoardScreen } from './CoachTacticalBoardScreen';
import { COACH_SITE } from '../../content/coachPageIdentity';
import { AppBackButton } from '../../components/ui/AppBackButton';

type Formation = '4-3-3' | '4-2-3-1' | '3-5-2' | '4-4-2';

export const CoachTwinMatchLabScreen: React.FC = () => {
  const [subMode, setSubMode] = useState<'twin' | 'board'>('twin');
  const [ourFormation, setOurFormation] = useState<Formation>('4-3-3');
  const [oppFormation, setOppFormation] = useState<Formation>('3-5-2');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationDone, setSimulationDone] = useState(true);
  const [simRunCount, setSimRunCount] = useState(1000);

  const runSimulation = () => {
    setIsSimulating(true);
    setSimulationDone(false);
    setTimeout(() => {
      setIsSimulating(false);
      setSimulationDone(true);
      setSimRunCount((c) => c + 1000);
    }, 900);
  };

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <View style={styles.topHeaderRow}>
        <AppBackButton fallbackNavId="plus" />
      </View>
      {/* Top Switcher Bar */}
      <View style={styles.topSwitcherBar}>
        <TouchableOpacity
          style={[styles.switcherBtn, subMode === 'twin' && styles.switcherBtnActive]}
          onPress={() => setSubMode('twin')}
        >
          <Text style={[styles.switcherBtnText, subMode === 'twin' && styles.switcherBtnTextActive]}>
            Simulation IA (Twin Lab)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.switcherBtn, subMode === 'board' && styles.switcherBtnActive]}
          onPress={() => setSubMode('board')}
        >
          <Text style={[styles.switcherBtnText, subMode === 'board' && styles.switcherBtnTextActive]}>
Tableau tactique & CPA
          </Text>
        </TouchableOpacity>
      </View>

      {subMode === 'board' ? (
        <CoachTacticalBoardScreen />
      ) : (
        <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* 1. Header: Twin Match Lab Title & AI Engine */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <MaterialCommunityIcons name="robot" size={24} color={proSemantic.info} />
            </View>
        <View style={styles.headerTextWrap}>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>PRODAY TWIN MATCH LAB · V3.2</Text>
          </View>
          <Text style={styles.headerTitle}>Simulation IA & Analyse Vulnérabilités</Text>
          <Text style={styles.headerDesc}>Moteur prédictif à 1 000 itérations algorithmiques</Text>
        </View>
      </View>

      {/* 2. Tactical Matchup Setup (Our Team vs Opponent) */}
      <View style={styles.setupCard}>
        <Text style={styles.sectionTitle}>Configuration du Matchup Tactique</Text>

        <View style={styles.matchupRow}>
          {/* Our Team Setup */}
          <View style={styles.teamSetupCol}>
            <Text style={styles.teamSetupLabel}>Mon équipe (Nous)</Text>
            <View style={styles.formationSelector}>
              {(['4-3-3', '4-2-3-1', '3-5-2'] as Formation[]).map((fmt) => (
                <TouchableOpacity
                  key={fmt}
                  style={[styles.fmtBtn, ourFormation === fmt && styles.fmtBtnActive]}
                  onPress={() => setOurFormation(fmt)}
                >
                  <Text style={[styles.fmtBtnText, ourFormation === fmt && styles.fmtBtnTextActive]}>
                    {fmt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.tacticalStyleText}>Bloc : Pressing Médian-Haut</Text>
          </View>

          <View style={styles.vsBadgeCol}>
            <Text style={styles.vsText}>VS</Text>
          </View>

          {/* Opponent Setup */}
          <View style={styles.teamSetupCol}>
            <Text style={styles.teamSetupLabel}>RC France (Adversaire)</Text>
            <View style={styles.formationSelector}>
              {(['3-5-2', '4-4-2', '4-3-3'] as Formation[]).map((fmt) => (
                <TouchableOpacity
                  key={fmt}
                  style={[styles.fmtBtn, oppFormation === fmt && styles.fmtBtnActiveOpp]}
                  onPress={() => setOppFormation(fmt)}
                >
                  <Text style={[styles.fmtBtnText, oppFormation === fmt && styles.fmtBtnTextActiveOpp]}>
                    {fmt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.tacticalStyleText}>Bloc : Contre-Attaque Directe</Text>
          </View>
        </View>

        {/* Launch Simulation CTA */}
        <TouchableOpacity
          style={[styles.simulateBtn, isSimulating && styles.simulateBtnLoading]}
          activeOpacity={0.8}
          onPress={runSimulation}
          disabled={isSimulating}
        >
          {isSimulating ? (
            <ActivityIndicator color={tokens.foreground} size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="play-speed" size={20} color={tokens.foreground} />
              <Text style={styles.simulateBtnText}>
                Lancer Simulation IA ({simRunCount} Itérations)
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* 3. Predictive Outcome Matrices */}
      {simulationDone && (
        <>
          <View style={styles.resultsCard}>
            <View style={styles.resultsHeader}>
              <MaterialCommunityIcons name="chart-pie" size={18} color={tokens.accent} />
              <Text style={styles.resultsTitle}>Matrices Prédictives & Probabilités</Text>
            </View>

            {/* Probability Bars */}
            <View style={styles.probContainer}>
              <View style={styles.probBarRow}>
                <View style={[styles.probBarSegment, { flex: 58, backgroundColor: proSemantic.success }]} />
                <View style={[styles.probBarSegment, { flex: 24, backgroundColor: tokens.muted }]} />
                <View style={[styles.probBarSegment, { flex: 18, backgroundColor: proSemantic.danger }]} />
              </View>

              <View style={styles.probLabelsRow}>
                <View style={styles.probItem}>
                  <View style={[styles.probDot, { backgroundColor: proSemantic.success }]} />
                  <Text style={styles.probName}>Victoire ProDay (58 %)</Text>
                </View>
                <View style={styles.probItem}>
                  <View style={[styles.probDot, { backgroundColor: tokens.muted }]} />
                  <Text style={styles.probName}>Nul (24 %)</Text>
                </View>
                <View style={styles.probItem}>
                  <View style={[styles.probDot, { backgroundColor: proSemantic.danger }]} />
                  <Text style={styles.probName}>Défaite (18 %)</Text>
                </View>
              </View>
            </View>

            {/* In-Depth Statistical KPIs */}
            <View style={styles.kpiGrid}>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiLabel}>xG Attendu (ProDay)</Text>
                <Text style={[styles.kpiVal, { color: proSemantic.success }]}>2.14</Text>
                <Text style={styles.kpiSub}>Occasions créées : 4.8</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiLabel}>xG Concédé (RC France)</Text>
                <Text style={[styles.kpiVal, { color: proSemantic.warning }]}>1.18</Text>
                <Text style={styles.kpiSub}>Occasions concédées : 2.2</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiLabel}>Possession Prévue</Text>
                <Text style={[styles.kpiVal, { color: proSemantic.info }]}>54 %</Text>
                <Text style={styles.kpiSub}>Avantage contrôle territorial</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiLabel}>Taux Récupération Haute</Text>
                <Text style={[styles.kpiVal, { color: tokens.accent }]}>76 %</Text>
                <Text style={styles.kpiSub}>Pressing sur relance à 3</Text>
              </View>
            </View>
          </View>

          {/* 4. AI Tactical Vulnerability Report */}
          <View style={styles.vulnerabilityCard}>
            <View style={styles.vulnHeader}>
              <MaterialCommunityIcons name="shield-alert-outline" size={18} color={proSemantic.danger} />
              <Text style={styles.vulnTitle}>Rapport de Vulnérabilité & Failles Adversaire</Text>
            </View>

            {/* Vulnerability 1 */}
            <View style={styles.vulnItem}>
              <View style={styles.vulnSeverityBadge}>
                <Text style={styles.vulnSeverityText}>FAILLE CRITIQUE</Text>
              </View>
              <Text style={styles.vulnItemTitle}>Dos des Pistons en Transition</Text>
              <Text style={styles.vulnItemDesc}>
                Dans leur 3-5-2, les latéraux montent à hauteur de la ligne médiane. À la perte de balle, 
                les 3 défenseurs centraux manquent de vitesse latérale pour couvrir l’espace. 
                <Text style={styles.vulnItemHighlight}> Action recommandée :</Text> Solliciter nos ailiers (Lucas M. & Sofiane T.) en première intention vers les coins.
              </Text>
            </View>

            {/* Vulnerability 2 */}
            <View style={styles.vulnItem}>
              <View style={[styles.vulnSeverityBadge, { backgroundColor: withAlpha('F59E0B', 0.15) }]}>
                <Text style={[styles.vulnSeverityText, { color: proSemantic.warning }]}>DANGER ADVERSE</Text>
              </View>
              <Text style={styles.vulnItemTitle}>Jeu Direct sur leur Numéro 9 (1,88 m)</Text>
              <Text style={styles.vulnItemDesc}>
                Leur relance saute fréquemment le milieu pour trouver leur avant-centre en point d’appui.
                <Text style={styles.vulnItemHighlight}> Action recommandée :</Text> Notre DC axial doit disputer le premier duel aérien, le MDC (Thomas D.) doit anticiper le second ballon.
              </Text>
            </View>
          </View>

          {/* 5. In-Game Plan-B & Dynamic Substitution Triggers */}
          <View style={styles.planBCard}>
            <View style={styles.planBHeader}>
              <MaterialCommunityIcons name="swap-horizontal" size={18} color={proSemantic.success} />
              <Text style={styles.planBTitle}>Plan B & Déclencheurs de Coaching en Direct</Text>
            </View>

            <View style={styles.planBTrigger}>
              <View style={styles.planBMinute}>
                <Text style={styles.planBMinuteText}>65’</Text>
              </View>
              <View style={styles.planBBody}>
                <Text style={styles.planBScenario}>Si égalité ou mené d’un but</Text>
                <Text style={styles.planBAction}>Basculer en 4-2-4 avec entrée d’un deuxième attaquant de pointe et pressing tout terrain.</Text>
              </View>
            </View>

            <View style={[styles.planBTrigger, { borderBottomWidth: 0 }]}>
              <View style={[styles.planBMinute, { backgroundColor: withAlpha('10B981', 0.2) }]}>
                <Text style={[styles.planBMinuteText, { color: proSemantic.success }]}>75’</Text>
              </View>
              <View style={styles.planBBody}>
                <Text style={styles.planBScenario}>Si avantage au score (&gt;= +1)</Text>
                <Text style={styles.planBAction}>Passer en 5-3-2 bloc bas compact pour fermer les demi-espaces et absorber le jeu direct.</Text>
              </View>
            </View>
          </View>
        </>
      )}
        </ScrollView>
      )}
    </View>
  );
};

const tokens = COACH_SITE;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.bg,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  topHeaderRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  topSwitcherBar: {
    flexDirection: 'row',
    backgroundColor: COACH_SITE.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: tokens.border,
    padding: 3,
    marginBottom: 14,
  },
  switcherBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 9,
  },
  switcherBtnActive: {
    backgroundColor: COACH_SITE.elevated,
    borderWidth: 1,
    borderColor: withAlpha('FFFFFF', 0.1),
  },
  switcherBtnText: {
    color: tokens.muted,
    fontSize: 11,
    fontWeight: '600',
      },
  switcherBtnTextActive: {
    color: tokens.foreground,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    backgroundColor: COACH_SITE.surface,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: withAlpha('0A84FF', 0.2),
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: withAlpha('0A84FF', 0.15),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  headerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: withAlpha('0A84FF', 0.15),
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 3,
  },
  headerBadgeText: {
    color: proSemantic.info,
    fontSize: 9,
    fontWeight: '800',
      },
  headerTitle: {
    color: tokens.foreground,
    fontSize: 15,
    fontWeight: '800',
      },
  headerDesc: {
    color: tokens.muted,
    fontSize: 11,
        marginTop: 2,
  },
  setupCard: {
    backgroundColor: COACH_SITE.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: tokens.border,
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    color: tokens.foreground,
    fontSize: 13,
    fontWeight: '700',
        marginBottom: 12,
  },
  matchupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  teamSetupCol: {
    flex: 1,
  },
  teamSetupLabel: {
    color: tokens.foreground,
    fontSize: 12,
    fontWeight: '700',
        marginBottom: 8,
  },
  formationSelector: {
    flexDirection: 'row',
    gap: 4,
  },
  fmtBtn: {
    backgroundColor: COACH_SITE.elevated,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: withAlpha('FFFFFF', 0.06),
  },
  fmtBtnActive: {
    backgroundColor: 'transparent',
    borderColor: proSemantic.info,
  },
  fmtBtnActiveOpp: {
    backgroundColor: 'transparent',
    borderColor: PRO_DATA_VIOLET,
  },
  fmtBtnText: {
    color: tokens.muted,
    fontSize: 10,
    fontWeight: '700',
      },
  fmtBtnTextActive: {
    color: tokens.foreground,
  },
  fmtBtnTextActiveOpp: {
    color: tokens.foreground,
  },
  tacticalStyleText: {
    color: tokens.muted,
    fontSize: 10,
        marginTop: 6,
  },
  vsBadgeCol: {
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  vsText: {
    color: tokens.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  simulateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: proSemantic.info,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 4,
  },
  simulateBtnLoading: {
    opacity: 0.7,
  },
  simulateBtnText: {
    color: tokens.foreground,
    fontSize: 13,
    fontWeight: '700',
      },
  resultsCard: {
    backgroundColor: COACH_SITE.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: tokens.border,
    padding: 16,
    marginBottom: 14,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  resultsTitle: {
    color: tokens.foreground,
    fontSize: 14,
    fontWeight: '700',
      },
  probContainer: {
    marginBottom: 14,
  },
  probBarRow: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: 8,
  },
  probBarSegment: {
    height: '100%',
  },
  probLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  probItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  probDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  probName: {
    color: withAlpha('FFFFFF', 0.8),
    fontSize: 11,
      },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: withAlpha('FFFFFF', 0.05),
  },
  kpiBox: {
    width: '48%',
    backgroundColor: COACH_SITE.elevated,
    borderRadius: 10,
    padding: 10,
  },
  kpiLabel: {
    color: tokens.muted,
    fontSize: 10,
      },
  kpiVal: {
    fontSize: 18,
    fontWeight: '800',
        marginVertical: 2,
  },
  kpiSub: {
    color: tokens.muted,
    fontSize: 10,
      },
  vulnerabilityCard: {
    backgroundColor: COACH_SITE.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: withAlpha('EF4444', 0.25),
    padding: 16,
    marginBottom: 14,
  },
  vulnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  vulnTitle: {
    color: tokens.foreground,
    fontSize: 14,
    fontWeight: '700',
      },
  vulnItem: {
    backgroundColor: COACH_SITE.elevated,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  vulnSeverityBadge: {
    alignSelf: 'flex-start',
    backgroundColor: withAlpha('EF4444', 0.15),
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  vulnSeverityText: {
    color: proSemantic.danger,
    fontSize: 9,
    fontWeight: '800',
      },
  vulnItemTitle: {
    color: tokens.foreground,
    fontSize: 13,
    fontWeight: '700',
        marginBottom: 4,
  },
  vulnItemDesc: {
    color: withAlpha('FFFFFF', 0.8),
    fontSize: 11,
    lineHeight: 16,
      },
  vulnItemHighlight: {
    color: tokens.accent,
    fontWeight: '700',
  },
  planBCard: {
    backgroundColor: COACH_SITE.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: withAlpha('10B981', 0.25),
    padding: 16,
  },
  planBHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  planBTitle: {
    color: tokens.foreground,
    fontSize: 14,
    fontWeight: '700',
      },
  planBTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: withAlpha('FFFFFF', 0.05),
  },
  planBMinute: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: withAlpha('0A84FF', 0.2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  planBMinuteText: {
    color: proSemantic.info,
    fontSize: 13,
    fontWeight: '800',
      },
  planBBody: {
    flex: 1,
  },
  planBScenario: {
    color: tokens.foreground,
    fontSize: 12,
    fontWeight: '700',
      },
  planBAction: {
    color: tokens.muted,
    fontSize: 11,
        marginTop: 2,
  },
});
