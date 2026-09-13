import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { playerRsvpService, type PlayerRsvpStatus } from '../../services/playerRsvp.service';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';

export type SaisonTabId = 'matchs' | 'classement' | 'objectifs';

export function PlayerSaisonScreen() {
  const insets = useSafeAreaInsets();
  const profile = useSessionProfile();
  const userId = profile?.uid || 'player-demo';

  const [activeTab, setActiveTab] = useState<SaisonTabId>('matchs');
  const [rsvp, setRsvp] = useState<PlayerRsvpStatus>('present');

  useEffect(() => {
    void playerRsvpService.getRsvp(userId, 'match-j17').then(setRsvp);
  }, [userId]);

  const handleRsvpChange = (status: PlayerRsvpStatus) => {
    prodayHaptics.impactMedium();
    setRsvp(status);
    void playerRsvpService.setRsvp(userId, 'match-j17', status);
  };

  const handleTabChange = (tabId: SaisonTabId) => {
    prodayHaptics.selection();
    setActiveTab(tabId);
  };

  const pastMatches = [
    {
      id: 'm16',
      round: 'J16',
      date: 'Sam. 14 Sept',
      opponent: 'AS Meudon',
      home: true,
      scoreClub: 3,
      scoreOpp: 1,
      result: 'V',
      started: true,
      minutes: 90,
      goals: 2,
      assists: 0,
      rating: 8.5,
      isMotm: true,
    },
    {
      id: 'm15',
      round: 'J15',
      date: 'Dim. 7 Sept',
      opponent: 'ES Colombes',
      home: false,
      scoreClub: 2,
      scoreOpp: 2,
      result: 'N',
      started: true,
      minutes: 85,
      goals: 1,
      assists: 1,
      rating: 7.8,
      isMotm: false,
    },
    {
      id: 'm14',
      round: 'J14',
      date: 'Sam. 31 Août',
      opponent: 'FC Rueil',
      home: true,
      scoreClub: 4,
      scoreOpp: 0,
      result: 'V',
      started: true,
      minutes: 78,
      goals: 2,
      assists: 2,
      rating: 8.2,
      isMotm: true,
    },
    {
      id: 'm13',
      round: 'J13',
      date: 'Dim. 24 Août',
      opponent: 'US Suresnes',
      home: false,
      scoreClub: 1,
      scoreOpp: 0,
      result: 'V',
      started: true,
      minutes: 90,
      goals: 0,
      assists: 1,
      rating: 7.4,
      isMotm: false,
    },
    {
      id: 'm12',
      round: 'J12',
      date: 'Sam. 17 Août',
      opponent: 'Racing CFF',
      home: true,
      scoreClub: 2,
      scoreOpp: 1,
      result: 'V',
      started: true,
      minutes: 90,
      goals: 1,
      assists: 0,
      rating: 8.0,
      isMotm: false,
    },
    {
      id: 'm11',
      round: 'J11',
      date: 'Dim. 10 Août',
      opponent: 'Red Star FC B',
      home: false,
      scoreClub: 2,
      scoreOpp: 1,
      result: 'V',
      started: true,
      minutes: 90,
      goals: 1,
      assists: 0,
      rating: 7.9,
      isMotm: false,
    },
  ];

  const upcomingMatches = [
    { round: 'J18', date: 'Sam. 27 Sept · 18:00', opponent: 'Entente SSG', home: false },
    { round: 'J19', date: 'Sam. 4 Oct · 18:00', opponent: 'US Créteil B', home: true },
    { round: 'J20', date: 'Dim. 12 Oct · 15:00', opponent: 'Paris 13 Atletico B', home: false },
  ];

  const standingsData = [
    { rank: 1, name: 'FC ProDay', pts: 39, m: 16, v: 12, n: 3, d: 1, diff: '+22', form: ['V', 'V', 'V', 'N', 'V'], isMyClub: true },
    { rank: 2, name: 'RC France', pts: 36, m: 16, v: 11, n: 3, d: 2, diff: '+15', form: ['V', 'D', 'V', 'V', 'V'], isMyClub: false },
    { rank: 3, name: 'Entente SSG', pts: 31, m: 16, v: 9, n: 4, d: 3, diff: '+8', form: ['D', 'V', 'N', 'V', 'N'], isMyClub: false },
    { rank: 4, name: 'US Créteil B', pts: 28, m: 16, v: 8, n: 4, d: 4, diff: '+4', form: ['V', 'N', 'V', 'V', 'D'], isMyClub: false },
    { rank: 5, name: 'Red Star FC B', pts: 26, m: 16, v: 7, n: 5, d: 4, diff: '+2', form: ['D', 'N', 'V', 'D', 'V'], isMyClub: false },
    { rank: 6, name: 'Paris 13 Atletico B', pts: 24, m: 16, v: 6, n: 6, d: 4, diff: '0', form: ['V', 'D', 'V', 'N', 'N'], isMyClub: false },
    { rank: 7, name: 'AS Meudon', pts: 22, m: 16, v: 6, n: 4, d: 6, diff: '-2', form: ['N', 'V', 'V', 'D', 'D'], isMyClub: false },
    { rank: 8, name: 'ES Colombes', pts: 20, m: 16, v: 5, n: 5, d: 6, diff: '-4', form: ['D', 'N', 'D', 'V', 'N'], isMyClub: false },
    { rank: 9, name: 'FC Rueil', pts: 17, m: 16, v: 4, n: 5, d: 7, diff: '-7', form: ['D', 'V', 'D', 'N', 'D'], isMyClub: false },
    { rank: 10, name: 'US Suresnes', pts: 14, m: 16, v: 3, n: 5, d: 8, diff: '-11', form: ['V', 'D', 'N', 'D', 'D'], isMyClub: false },
    { rank: 11, name: 'Montrouge FC', pts: 11, m: 16, v: 2, n: 5, d: 9, diff: '-14', form: ['D', 'D', 'D', 'N', 'D'], isMyClub: false },
    { rank: 12, name: 'CS Brétigny B', pts: 7, m: 16, v: 1, n: 4, d: 11, diff: '-13', form: ['N', 'D', 'D', 'D', 'D'], isMyClub: false },
  ];

  return (
    <View style={[styles.root, { paddingTop: Math.max(insets.top, 12) }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_CONTENT_INSET + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header : Identité de la Saison */}
        <View style={styles.header}>
          <View>
            <View style={styles.seasonBadge}>
              <Ionicons name="shield" size={13} color="#30D158" />
              <Text style={styles.seasonBadgeText}>FFF · SENIORS R1 · POULE B</Text>
            </View>
            <Text style={styles.headerTitle}>Saison 2025/2026</Text>
            <Text style={styles.headerSub}>FC ProDay · Championnat Régional</Text>
          </View>

          <View style={styles.roundPill}>
            <Text style={styles.roundPillVal}>J17 / 26</Text>
            <Text style={styles.roundPillSub}>65% ÉCOULÉ</Text>
          </View>
        </View>

        {/* Hero Banner Équipe : Bilan Saison en Direct */}
        <LinearGradient
          colors={['#161E2E', '#0F172A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroTeamBanner}
        >
          <View style={styles.heroBannerHeader}>
            <View style={styles.heroRankPill}>
              <MaterialCommunityIcons name="trophy" size={14} color="#FFD700" />
              <Text style={styles.heroRankText}>1er du Championnat</Text>
            </View>
            <Text style={styles.heroPromotionTag}>Zone Montée N3</Text>
          </View>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatCol}>
              <Text style={[styles.heroStatVal, { color: '#30D158' }]}>39</Text>
              <Text style={styles.heroStatLbl}>POINTS</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatCol}>
              <Text style={styles.heroStatVal}>12 - 3 - 1</Text>
              <Text style={styles.heroStatLbl}>V - N - D</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatCol}>
              <Text style={[styles.heroStatVal, { color: '#0A84FF' }]}>+22</Text>
              <Text style={styles.heroStatLbl}>DIFF. BUTS</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatCol}>
              <Text style={[styles.heroStatVal, { color: '#FFD700' }]}>7.9</Text>
              <Text style={styles.heroStatLbl}>NOTE MOY.</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Apple Segmented Pill Rail */}
        <View style={styles.pillRail}>
          {(
            [
              { id: 'matchs', label: 'Matchs & Calendrier', icon: 'football' },
              { id: 'classement', label: 'Classement FFF', icon: 'trophy' },
              { id: 'objectifs', label: 'Objectifs Saison', icon: 'flag' },
            ] as const
          ).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => handleTabChange(tab.id)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={13}
                  color={isActive ? '#000000' : '#94A3B8'}
                />
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* TAB 1: MATCHS & CALENDRIER */}
        {activeTab === 'matchs' ? (
          <View style={styles.tabContent}>
            {/* Prochain Match Immédiat (Hero Card J17) */}
            <LinearGradient
              colors={['#181822', '#101016']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.nextMatchCard}
            >
              <View style={styles.nextMatchHeader}>
                <View style={styles.matchTagGreen}>
                  <Ionicons name="flame" size={13} color="#30D158" />
                  <Text style={styles.matchTagGreenText}>PROCHAIN MATCH · J17 AU SOMMET</Text>
                </View>
                <View style={styles.countdownBadge}>
                  <Ionicons name="time" size={12} color="#FBBF24" />
                  <Text style={styles.countdownText}>J-2 · 18:00</Text>
                </View>
              </View>

              <View style={styles.clashRow}>
                <View style={styles.teamCol}>
                  <Text style={styles.teamName}>FC ProDay</Text>
                  <Text style={styles.teamRankLeader}>1er · Domicile</Text>
                </View>

                <View style={styles.vsBadge}>
                  <Text style={styles.vsText}>VS</Text>
                </View>

                <View style={styles.teamCol}>
                  <Text style={styles.teamName}>RC France</Text>
                  <Text style={styles.teamRankChallenger}>2e · Extérieur</Text>
                </View>
              </View>

              <View style={styles.matchInfoLine}>
                <Ionicons name="location" size={12} color="#94A3B8" />
                <Text style={styles.matchInfoText}>Stade Municipal · ☀️ 18°C · Pelouse Synthétique</Text>
              </View>

              {/* RSVP Convocations */}
              <View style={styles.rsvpSection}>
                <Text style={styles.rsvpSectionTitle}>MA CONVOCATION / DISPONIBILITÉ :</Text>
                <View style={styles.rsvpBar}>
                  <TouchableOpacity
                    style={[styles.rsvpBtn, rsvp === 'present' && styles.rsvpBtnPresent]}
                    onPress={() => handleRsvpChange('present')}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color={rsvp === 'present' ? '#FFFFFF' : '#30D158'}
                    />
                    <Text
                      style={[styles.rsvpBtnText, rsvp === 'present' && styles.rsvpBtnTextActive]}
                    >
                      Présent
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.rsvpBtn, rsvp === 'pending' && styles.rsvpBtnUncertain]}
                    onPress={() => handleRsvpChange('pending')}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="help-circle"
                      size={14}
                      color={rsvp === 'pending' ? '#FFFFFF' : '#FBBF24'}
                    />
                    <Text
                      style={[styles.rsvpBtnText, rsvp === 'pending' && styles.rsvpBtnTextActive]}
                    >
                      Incertain
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.rsvpBtn, rsvp === 'absent' && styles.rsvpBtnAbsent]}
                    onPress={() => handleRsvpChange('absent')}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="close-circle"
                      size={14}
                      color={rsvp === 'absent' ? '#FFFFFF' : '#FF453A'}
                    />
                    <Text
                      style={[styles.rsvpBtnText, rsvp === 'absent' && styles.rsvpBtnTextActive]}
                    >
                      Absent
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>

            {/* Historique des Journées Passées avec Notes Staff */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Feuilles de Match & Notations du Staff</Text>
              <Text style={styles.sectionSub}>Officiel FFF</Text>
            </View>

            <View style={styles.matchList}>
              {pastMatches.map((m) => (
                <View key={m.id} style={styles.matchCard}>
                  <View style={styles.matchCardTop}>
                    <View style={styles.matchRoundBadge}>
                      <Text style={styles.matchRoundText}>{m.round}</Text>
                      <Text style={styles.matchDateSub}>{m.date}</Text>
                    </View>

                    <View style={styles.matchCenterCol}>
                      <View style={styles.opponentRow}>
                        <Text style={styles.matchOpponent}>{m.opponent}</Text>
                        <Text style={styles.matchLocation}>({m.home ? 'Dom.' : 'Ext.'})</Text>
                      </View>
                      <Text style={styles.matchPlayerPerformance}>
                        {m.started ? 'Titulaire' : 'Remplaçant'} · {m.minutes}' ·{' '}
                        {m.goals > 0 ? `⚽ ${m.goals} but${m.goals > 1 ? 's' : ''}` : ''}
                        {m.goals > 0 && m.assists > 0 ? ' · ' : ''}
                        {m.assists > 0 ? `🎯 ${m.assists} passe${m.assists > 1 ? 's' : ''}` : ''}
                        {m.goals === 0 && m.assists === 0 ? 'Actif' : ''}
                      </Text>
                    </View>

                    <View style={styles.matchRightScore}>
                      <View
                        style={[
                          styles.resultScoreBadge,
                          m.result === 'V'
                            ? styles.resScoreWin
                            : m.result === 'N'
                            ? styles.resScoreDraw
                            : styles.resScoreLoss,
                        ]}
                      >
                        <Text style={styles.resScoreText}>
                          {m.scoreClub} - {m.scoreOpp}
                        </Text>
                      </View>

                      <View style={styles.ratingBox}>
                        <Text style={styles.ratingVal}>{m.rating}</Text>
                        <Text style={styles.ratingMax}>/10</Text>
                      </View>
                    </View>
                  </View>

                  {m.isMotm ? (
                    <View style={styles.motmTag}>
                      <MaterialCommunityIcons name="star" size={13} color="#FFD700" />
                      <Text style={styles.motmTagText}>ÉLU HOMME DU MATCH PAR LE COACH</Text>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>

            {/* Matchs à Venir */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Calendrier des Journées Suivantes</Text>
            </View>

            <View style={styles.upcomingList}>
              {upcomingMatches.map((up, idx) => (
                <View key={idx} style={styles.upcomingRow}>
                  <View style={styles.upcomingRoundBadge}>
                    <Text style={styles.upcomingRoundText}>{up.round}</Text>
                  </View>
                  <View style={styles.upcomingInfo}>
                    <Text style={styles.upcomingOpponent}>{up.opponent}</Text>
                    <Text style={styles.upcomingDate}>
                      {up.date} · {up.home ? 'À Domicile' : 'En Déplacement'}
                    </Text>
                  </View>
                  <Ionicons name="calendar-outline" size={16} color="#64748B" />
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* TAB 2: CLASSEMENT FFF OFFICIEL */}
        {activeTab === 'classement' ? (
          <View style={styles.tabContent}>
            <View style={styles.standingsHeaderBlock}>
              <View style={styles.seasonBadge}>
                <Ionicons name="trophy" size={12} color="#FFD700" />
                <Text style={styles.seasonBadgeText}>CLASSEMENT GÉNÉRAL · SENIORS R1 POULE B</Text>
              </View>
              <Text style={styles.standingsNotice}>
                Mise à jour en temps réel après la 16e journée.
              </Text>
            </View>

            {/* Table Header */}
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.thText, { width: 30 }]}>#</Text>
              <Text style={[styles.thText, { flex: 1 }]}>CLUB</Text>
              <Text style={[styles.thText, { width: 40, textAlign: 'center' }]}>PTS</Text>
              <Text style={[styles.thText, { width: 30, textAlign: 'center' }]}>J</Text>
              <Text style={[styles.thText, { width: 36, textAlign: 'center' }]}>DIFF</Text>
              <Text style={[styles.thText, { width: 68, textAlign: 'right' }]}>FORME</Text>
            </View>

            {/* Standings Table Rows */}
            <View style={styles.tableBody}>
              {standingsData.map((item) => (
                <View
                  key={item.rank}
                  style={[
                    styles.tableRow,
                    item.isMyClub && styles.myClubRow,
                    item.rank === 1 && styles.firstPlaceBorder,
                  ]}
                >
                  <View style={styles.rankCol}>
                    <View
                      style={[
                        styles.rankBadge,
                        item.rank === 1
                          ? styles.rankGold
                          : item.rank === 2
                          ? styles.rankSilver
                          : item.rank >= 10
                          ? styles.rankRelegation
                          : styles.rankStandard,
                      ]}
                    >
                      <Text style={styles.rankNum}>{item.rank}</Text>
                    </View>
                  </View>

                  <View style={styles.clubNameCol}>
                    <Text
                      style={[
                        styles.clubNameText,
                        item.isMyClub && styles.myClubNameText,
                      ]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    {item.isMyClub ? (
                      <View style={styles.myClubIndicator}>
                        <Text style={styles.myClubIndicatorText}>MON CLUB</Text>
                      </View>
                    ) : null}
                  </View>

                  <Text style={[styles.ptsText, item.isMyClub && { color: '#30D158' }]}>
                    {item.pts}
                  </Text>
                  <Text style={styles.mText}>{item.m}</Text>
                  <Text style={styles.diffText}>{item.diff}</Text>

                  <View style={styles.formRow}>
                    {item.form.slice(-3).map((f, i) => (
                      <View
                        key={i}
                        style={[
                          styles.formDot,
                          f === 'V'
                            ? styles.formWin
                            : f === 'N'
                            ? styles.formDraw
                            : styles.formLoss,
                        ]}
                      >
                        <Text style={styles.formLetter}>{f}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>

            {/* Standings Legend */}
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#30D158' }]} />
                <Text style={styles.legendLabel}>1er : Montée directe N3</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#0A84FF' }]} />
                <Text style={styles.legendLabel}>2e : Barrage N3</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#FF453A' }]} />
                <Text style={styles.legendLabel}>10-12e : Descente R2</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* TAB 3: OBJECTIFS & QUÊTES DE LA SAISON */}
        {activeTab === 'objectifs' ? (
          <View style={styles.tabContent}>
            {/* Snapshot Individuel */}
            <View style={styles.kpiGrid}>
              <View style={styles.kpiCard}>
                <Text style={[styles.kpiVal, { color: '#30D158' }]}>14</Text>
                <Text style={styles.kpiLbl}>BUTS EN SAISON</Text>
                <Text style={styles.kpiSub}>1er Buteur R1</Text>
              </View>

              <View style={styles.kpiCard}>
                <Text style={[styles.kpiVal, { color: '#0A84FF' }]}>8</Text>
                <Text style={styles.kpiLbl}>PASSES DÉCISIVES</Text>
                <Text style={styles.kpiSub}>2e Passeur R1</Text>
              </View>

              <View style={styles.kpiCard}>
                <Text style={[styles.kpiVal, { color: '#FFD700' }]}>7.9</Text>
                <Text style={styles.kpiLbl}>NOTE MOYENNE</Text>
                <Text style={styles.kpiSub}>Sur 16 feuilles</Text>
              </View>

              <View style={styles.kpiCard}>
                <Text style={[styles.kpiVal, { color: '#A855F7' }]}>1 440'</Text>
                <Text style={styles.kpiLbl}>TEMPS DE JEU</Text>
                <Text style={styles.kpiSub}>16 Titularisations</Text>
              </View>
            </View>

            {/* Jauges d'Objectifs Fixés avec le Coach */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Objectifs Annuels du Joueur</Text>
              <Text style={styles.sectionSub}>Fixés au début de saison</Text>
            </View>

            <View style={styles.goalCard}>
              <View style={styles.goalHeaderRow}>
                <Text style={styles.goalTitle}>⚽ Objectif Buts en Championnat</Text>
                <Text style={styles.goalProgressVal}>14 / 20 Buts (70%)</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: '70%', backgroundColor: '#30D158' }]} />
              </View>
              <Text style={styles.goalRemark}>Plus que 6 buts pour atteindre le Palier Or.</Text>
            </View>

            <View style={styles.goalCard}>
              <View style={styles.goalHeaderRow}>
                <Text style={styles.goalTitle}>🎯 Objectif Passes Décisives</Text>
                <Text style={styles.goalProgressVal}>8 / 10 Passes (80%)</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: '80%', backgroundColor: '#0A84FF' }]} />
              </View>
              <Text style={styles.goalRemark}>En excellente voie pour dépasser la cible.</Text>
            </View>

            <View style={styles.goalCard}>
              <View style={styles.goalHeaderRow}>
                <Text style={styles.goalTitle}>⏱️ Temps de Jeu & Titularisations</Text>
                <Text style={styles.goalProgressVal}>1 440' / 2 000' (72%)</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: '72%', backgroundColor: '#A855F7' }]} />
              </View>
              <Text style={styles.goalRemark}>100% de titularisations lors des 16 journées.</Text>
            </View>

            <View style={styles.goalCard}>
              <View style={styles.goalHeaderRow}>
                <Text style={styles.goalTitle}>⭐ Note Moyenne Staff Cible</Text>
                <Text style={[styles.goalProgressVal, { color: '#FFD700' }]}>7.9 / 8.0 (98%)</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: '98%', backgroundColor: '#FFD700' }]} />
              </View>
              <Text style={styles.goalRemark}>Objectif atteint et consolidé depuis 5 matchs.</Text>
            </View>

            {/* Quêtes & Défis Hebdomadaires */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Quêtes de la Semaine</Text>
              <Text style={styles.sectionSub}>+XP de Saison</Text>
            </View>

            <View style={styles.questCard}>
              <View style={styles.questLeft}>
                <View style={[styles.questIconBox, { backgroundColor: 'rgba(48, 209, 88, 0.12)' }]}>
                  <Ionicons name="football" size={16} color="#30D158" />
                </View>
                <View style={styles.questTextWrap}>
                  <Text style={styles.questTitle}>Cadre au moins 3 tirs au prochain match</Text>
                  <Text style={styles.questDesc}>Contre le RC France lors du choc J17</Text>
                </View>
              </View>
              <View style={styles.xpBadge}>
                <Text style={styles.xpBadgeText}>+150 XP</Text>
              </View>
            </View>

            <View style={styles.questCard}>
              <View style={styles.questLeft}>
                <View style={[styles.questIconBox, { backgroundColor: 'rgba(10, 132, 255, 0.12)' }]}>
                  <Ionicons name="pulse" size={16} color="#0A84FF" />
                </View>
                <View style={styles.questTextWrap}>
                  <Text style={styles.questTitle}>Check-in forme 5 jours d'affilée</Text>
                  <Text style={styles.questDesc}>Progression actuelle : 4 / 5 jours</Text>
                </View>
              </View>
              <View style={styles.xpBadge}>
                <Text style={styles.xpBadgeText}>+200 XP</Text>
              </View>
            </View>

            <View style={styles.questCard}>
              <View style={styles.questLeft}>
                <View style={[styles.questIconBox, { backgroundColor: 'rgba(255, 215, 0, 0.12)' }]}>
                  <Ionicons name="checkmark-done" size={16} color="#FFD700" />
                </View>
                <View style={styles.questTextWrap}>
                  <Text style={styles.questTitle}>Séance tactique vidéo validée</Text>
                  <Text style={styles.questDesc}>Consignes d'attaque intégrées avec le coach</Text>
                </View>
              </View>
              <View style={styles.completedTag}>
                <Ionicons name="checkmark" size={12} color="#30D158" />
                <Text style={styles.completedTagText}>Validée</Text>
              </View>
            </View>

            {/* Distinctions & Trophées de la Saison */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Distinctions de la Saison</Text>
            </View>

            <View style={styles.trophiesRow}>
              <View style={styles.trophyCard}>
                <MaterialCommunityIcons name="star-circle" size={24} color="#FFD700" />
                <Text style={styles.trophyCount}>4x</Text>
                <Text style={styles.trophyTitle}>Homme du Match</Text>
                <Text style={styles.trophySub}>J3, J8, J14, J16</Text>
              </View>

              <View style={styles.trophyCard}>
                <MaterialCommunityIcons name="medal" size={24} color="#30D158" />
                <Text style={styles.trophyCount}>1x</Text>
                <Text style={styles.trophyTitle}>Joueur du Mois</Text>
                <Text style={styles.trophySub}>Novembre 2025</Text>
              </View>

              <View style={styles.trophyCard}>
                <MaterialCommunityIcons name="shield-star" size={24} color="#0A84FF" />
                <Text style={styles.trophyCount}>3x</Text>
                <Text style={styles.trophyTitle}>Équipe Type</Text>
                <Text style={styles.trophySub}>Seniors R1 FFF</Text>
              </View>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

export default PlayerSaisonScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0B0B0E',
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  seasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(48, 209, 88, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  seasonBadgeText: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 10.5,
    fontWeight: '800',
    color: '#30D158',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  headerSub: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  roundPill: {
    backgroundColor: '#16161E',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  roundPillVal: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 14,
    fontWeight: '900',
    color: '#30D158',
  },
  roundPillSub: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 2,
  },

  /* Hero Banner */
  heroTeamBanner: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    marginBottom: 16,
  },
  heroBannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  heroRankPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  heroRankText: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 12,
    fontWeight: '800',
    color: '#FFD700',
  },
  heroPromotionTag: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11,
    fontWeight: '700',
    color: '#30D158',
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroStatCol: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatVal: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  heroStatLbl: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },

  /* Pill Rail */
  pillRail: {
    flexDirection: 'row',
    backgroundColor: '#141418',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: '#30D158',
    shadowColor: '#30D158',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  tabLabel: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  tabLabelActive: {
    color: '#000000',
    fontWeight: '900',
  },
  tabContent: {
    gap: 16,
  },

  /* Prochain Match Card */
  nextMatchCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
  },
  nextMatchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  matchTagGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  matchTagGreenText: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 10.5,
    fontWeight: '800',
    color: '#30D158',
    letterSpacing: 0.5,
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  countdownText: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11,
    fontWeight: '800',
    color: '#FBBF24',
  },
  clashRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  teamCol: {
    flex: 1,
  },
  teamName: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  teamRankLeader: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11,
    fontWeight: '700',
    color: '#30D158',
    marginTop: 2,
  },
  teamRankChallenger: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 2,
  },
  vsBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
  },
  vsText: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 10,
    fontWeight: '900',
    color: '#94A3B8',
  },
  matchInfoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  matchInfoText: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11,
    color: '#94A3B8',
  },
  rsvpSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  rsvpSectionTitle: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  rsvpBar: {
    flexDirection: 'row',
    backgroundColor: '#121218',
    borderRadius: 14,
    padding: 3,
    gap: 4,
  },
  rsvpBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    borderRadius: 11,
  },
  rsvpBtnPresent: {
    backgroundColor: '#30D158',
  },
  rsvpBtnUncertain: {
    backgroundColor: '#FBBF24',
  },
  rsvpBtnAbsent: {
    backgroundColor: '#FF453A',
  },
  rsvpBtnText: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  rsvpBtnTextActive: {
    color: '#000000',
    fontWeight: '900',
  },

  /* Section Titles */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 2,
  },
  sectionTitle: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sectionSub: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11,
    color: '#64748B',
  },

  /* Match Cards */
  matchList: {
    gap: 10,
  },
  matchCard: {
    backgroundColor: '#141418',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
  },
  matchCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchRoundBadge: {
    backgroundColor: '#1C1C24',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
    marginRight: 10,
    width: 52,
  },
  matchRoundText: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 12,
    fontWeight: '900',
    color: '#30D158',
  },
  matchDateSub: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 8.5,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  matchCenterCol: {
    flex: 1,
  },
  opponentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  matchOpponent: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  matchLocation: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11,
    color: '#64748B',
  },
  matchPlayerPerformance: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  matchRightScore: {
    alignItems: 'flex-end',
    gap: 4,
  },
  resultScoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  resScoreWin: {
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
  },
  resScoreDraw: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
  },
  resScoreLoss: {
    backgroundColor: 'rgba(255, 69, 58, 0.15)',
  },
  resScoreText: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  ratingVal: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 13,
    fontWeight: '900',
    color: '#FFD700',
  },
  ratingMax: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 9,
    color: '#64748B',
  },
  motmTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  motmTagText: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFD700',
    letterSpacing: 0.3,
  },

  /* Upcoming list */
  upcomingList: {
    gap: 8,
  },
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141418',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  upcomingRoundBadge: {
    backgroundColor: '#1E1E28',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 10,
  },
  upcomingRoundText: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
  },
  upcomingInfo: {
    flex: 1,
  },
  upcomingOpponent: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  upcomingDate: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },

  /* STANDINGS */
  standingsHeaderBlock: {
    marginBottom: 10,
  },
  standingsNotice: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#121218',
    borderRadius: 10,
    marginBottom: 6,
  },
  thText: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  tableBody: {
    gap: 4,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141418',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  myClubRow: {
    backgroundColor: '#132018',
    borderColor: '#30D158',
    borderWidth: 1.5,
  },
  firstPlaceBorder: {
    borderColor: 'rgba(48, 209, 88, 0.4)',
  },
  rankCol: {
    width: 30,
  },
  rankBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankGold: {
    backgroundColor: '#FFD700',
  },
  rankSilver: {
    backgroundColor: '#0A84FF',
  },
  rankRelegation: {
    backgroundColor: 'rgba(255, 69, 58, 0.2)',
  },
  rankStandard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  rankNum: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 10,
    fontWeight: '900',
    color: '#000000',
  },
  clubNameCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clubNameText: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  myClubNameText: {
    color: '#30D158',
    fontWeight: '900',
  },
  myClubIndicator: {
    backgroundColor: 'rgba(48, 209, 88, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  myClubIndicatorText: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 8,
    fontWeight: '900',
    color: '#30D158',
  },
  ptsText: {
    width: 40,
    textAlign: 'center',
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 12.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  mText: {
    width: 30,
    textAlign: 'center',
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11,
    color: '#94A3B8',
  },
  diffText: {
    width: 36,
    textAlign: 'center',
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11,
    color: '#94A3B8',
  },
  formRow: {
    width: 68,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 3,
  },
  formDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formWin: {
    backgroundColor: '#30D158',
  },
  formDraw: {
    backgroundColor: '#64748B',
  },
  formLoss: {
    backgroundColor: '#FF453A',
  },
  formLetter: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 8,
    fontWeight: '900',
    color: '#000000',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 9.5,
    color: '#64748B',
  },

  /* OBJECTIFS & QUÊTES */
  kpiGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#141418',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 10,
    alignItems: 'center',
  },
  kpiVal: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  kpiLbl: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 8.5,
    fontWeight: '800',
    color: '#94A3B8',
    marginTop: 2,
    textAlign: 'center',
  },
  kpiSub: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 8,
    color: '#64748B',
    marginTop: 1,
    textAlign: 'center',
  },
  goalCard: {
    backgroundColor: '#141418',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    gap: 6,
  },
  goalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalTitle: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  goalProgressVal: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11,
    fontWeight: '800',
    color: '#30D158',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  goalRemark: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 10.5,
    color: '#64748B',
  },
  questCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#141418',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  questLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  questIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questTextWrap: {
    flex: 1,
  },
  questTitle: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  questDesc: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  xpBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  xpBadgeText: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFD700',
  },
  completedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(48, 209, 88, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  completedTagText: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 10.5,
    fontWeight: '800',
    color: '#30D158',
  },
  trophiesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  trophyCard: {
    flex: 1,
    backgroundColor: '#141418',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    alignItems: 'center',
  },
  trophyCount: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 4,
  },
  trophyTitle: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 10.5,
    fontWeight: '800',
    color: '#94A3B8',
    marginTop: 2,
    textAlign: 'center',
  },
  trophySub: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 9,
    color: '#64748B',
    marginTop: 1,
    textAlign: 'center',
  },
});

