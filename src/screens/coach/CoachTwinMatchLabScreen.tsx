import React, { useState } from 'react';
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
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
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
            Tableau Noir 3D & CPA
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
              <MaterialCommunityIcons name="robot" size={24} color="#0A84FF" />
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
            <Text style={styles.teamSetupLabel}>FC ProDay (Nous)</Text>
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
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="play-speed" size={20} color="#FFFFFF" />
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
              <MaterialCommunityIcons name="chart-pie" size={18} color="#C5A059" />
              <Text style={styles.resultsTitle}>Matrices Prédictives & Probabilités</Text>
            </View>

            {/* Probability Bars */}
            <View style={styles.probContainer}>
              <View style={styles.probBarRow}>
                <View style={[styles.probBarSegment, { flex: 58, backgroundColor: '#30D158' }]} />
                <View style={[styles.probBarSegment, { flex: 24, backgroundColor: '#8E8E93' }]} />
                <View style={[styles.probBarSegment, { flex: 18, backgroundColor: '#FF453A' }]} />
              </View>

              <View style={styles.probLabelsRow}>
                <View style={styles.probItem}>
                  <View style={[styles.probDot, { backgroundColor: '#30D158' }]} />
                  <Text style={styles.probName}>Victoire ProDay (58 %)</Text>
                </View>
                <View style={styles.probItem}>
                  <View style={[styles.probDot, { backgroundColor: '#8E8E93' }]} />
                  <Text style={styles.probName}>Nul (24 %)</Text>
                </View>
                <View style={styles.probItem}>
                  <View style={[styles.probDot, { backgroundColor: '#FF453A' }]} />
                  <Text style={styles.probName}>Défaite (18 %)</Text>
                </View>
              </View>
            </View>

            {/* In-Depth Statistical KPIs */}
            <View style={styles.kpiGrid}>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiLabel}>xG Attendu (ProDay)</Text>
                <Text style={[styles.kpiVal, { color: '#30D158' }]}>2.14</Text>
                <Text style={styles.kpiSub}>Occasions créées : 4.8</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiLabel}>xG Concédé (RC France)</Text>
                <Text style={[styles.kpiVal, { color: '#FF9F0A' }]}>1.18</Text>
                <Text style={styles.kpiSub}>Occasions concédées : 2.2</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiLabel}>Possession Prévue</Text>
                <Text style={[styles.kpiVal, { color: '#0A84FF' }]}>54 %</Text>
                <Text style={styles.kpiSub}>Avantage contrôle territorial</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiLabel}>Taux Récupération Haute</Text>
                <Text style={[styles.kpiVal, { color: '#C5A059' }]}>76 %</Text>
                <Text style={styles.kpiSub}>Pressing sur relance à 3</Text>
              </View>
            </View>
          </View>

          {/* 4. AI Tactical Vulnerability Report */}
          <View style={styles.vulnerabilityCard}>
            <View style={styles.vulnHeader}>
              <MaterialCommunityIcons name="shield-alert-outline" size={18} color="#FF453A" />
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
              <View style={[styles.vulnSeverityBadge, { backgroundColor: 'rgba(255, 159, 10, 0.15)' }]}>
                <Text style={[styles.vulnSeverityText, { color: '#FF9F0A' }]}>DANGER ADVERSE</Text>
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
              <MaterialCommunityIcons name="swap-horizontal" size={18} color="#30D158" />
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
              <View style={[styles.planBMinute, { backgroundColor: 'rgba(48, 209, 88, 0.2)' }]}>
                <Text style={[styles.planBMinuteText, { color: '#30D158' }]}>75’</Text>
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  topSwitcherBar: {
    flexDirection: 'row',
    backgroundColor: '#141418',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
    backgroundColor: '#1C1C22',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  switcherBtnText: {
    color: '#8B8B9A',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  switcherBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    backgroundColor: '#141418',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(10, 132, 255, 0.2)',
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  headerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 3,
  },
  headerBadgeText: {
    color: '#0A84FF',
    fontSize: 9,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  headerDesc: {
    color: '#8B8B9A',
    fontSize: 11,
    fontFamily: '-apple-system',
    marginTop: 2,
  },
  setupCard: {
    backgroundColor: '#141418',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: '-apple-system',
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
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: '-apple-system',
    marginBottom: 8,
  },
  formationSelector: {
    flexDirection: 'row',
    gap: 4,
  },
  fmtBtn: {
    backgroundColor: '#1C1C22',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  fmtBtnActive: {
    backgroundColor: 'rgba(10, 132, 255, 0.2)',
    borderColor: '#0A84FF',
  },
  fmtBtnActiveOpp: {
    backgroundColor: 'rgba(255, 69, 58, 0.2)',
    borderColor: '#FF453A',
  },
  fmtBtnText: {
    color: '#8B8B9A',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  fmtBtnTextActive: {
    color: '#0A84FF',
  },
  fmtBtnTextActiveOpp: {
    color: '#FF453A',
  },
  tacticalStyleText: {
    color: '#8B8B9A',
    fontSize: 10,
    fontFamily: '-apple-system',
    marginTop: 6,
  },
  vsBadgeCol: {
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  vsText: {
    color: '#8B8B9A',
    fontSize: 12,
    fontWeight: '800',
  },
  simulateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0A84FF',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 4,
  },
  simulateBtnLoading: {
    opacity: 0.7,
  },
  simulateBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  resultsCard: {
    backgroundColor: '#141418',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: '-apple-system',
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
    color: '#D1D1D6',
    fontSize: 11,
    fontFamily: '-apple-system',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  kpiBox: {
    width: '48%',
    backgroundColor: '#1C1C22',
    borderRadius: 10,
    padding: 10,
  },
  kpiLabel: {
    color: '#8B8B9A',
    fontSize: 10,
    fontFamily: '-apple-system',
  },
  kpiVal: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: '-apple-system',
    marginVertical: 2,
  },
  kpiSub: {
    color: '#636366',
    fontSize: 10,
    fontFamily: '-apple-system',
  },
  vulnerabilityCard: {
    backgroundColor: '#141418',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.25)',
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
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  vulnItem: {
    backgroundColor: '#1C1C22',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  vulnSeverityBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 69, 58, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  vulnSeverityText: {
    color: '#FF453A',
    fontSize: 9,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  vulnItemTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: '-apple-system',
    marginBottom: 4,
  },
  vulnItemDesc: {
    color: '#D1D1D6',
    fontSize: 11,
    lineHeight: 16,
    fontFamily: '-apple-system',
  },
  vulnItemHighlight: {
    color: '#C5A059',
    fontWeight: '700',
  },
  planBCard: {
    backgroundColor: '#141418',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.25)',
    padding: 16,
  },
  planBHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  planBTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  planBTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  planBMinute: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(10, 132, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planBMinuteText: {
    color: '#0A84FF',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  planBBody: {
    flex: 1,
  },
  planBScenario: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  planBAction: {
    color: '#8B8B9A',
    fontSize: 11,
    fontFamily: '-apple-system',
    marginTop: 2,
  },
});
