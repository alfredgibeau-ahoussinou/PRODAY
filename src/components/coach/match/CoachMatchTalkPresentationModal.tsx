import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { TeamEvent, EventLineupSlot } from '../../../models/TeamEvent';
import type { User } from '../../../models/User';
import type { MatchTalkBrief, SetPieceTakers } from '../../../models/MatchTalkBrief';
import type { PlayerEligibilityResult, MatchEligibilityContext } from '../../../models/PlayerDisciplinary';
import { playerDisciplinaryService } from '../../../services/playerDisciplinary.service';
import { PlayerSuspensionBadge } from '../../discipline/PlayerSuspensionBadge';
import { DisciplinaryCheckModal } from '../../discipline/DisciplinaryCheckModal';
import { exportOrPrintMatchSheet } from '../../../utils/coachMatchSheetExport';
import { assignStartersToPitch, parseFormationLines } from '../../../utils/formationPitch';

export interface CoachMatchTalkPresentationModalProps {
  visible: boolean;
  onClose: () => void;
  event: TeamEvent;
  lineup: { starterUids: string[]; subUids: string[] };
  members: User[];
  talkBrief?: MatchTalkBrief;
  coachProfile?: User;
}

type TabType = 'lineup' | 'principles' | 'setpieces';

interface PlayerDetails {
  uid: string;
  name: string;
  number: number;
  position: string;
  tacticalRole?: string;
  coachMessage?: string;
  isStarter: boolean;
}

export const CoachMatchTalkPresentationModal: React.FC<CoachMatchTalkPresentationModalProps> = ({
  visible,
  onClose,
  event,
  lineup,
  members,
  talkBrief,
  coachProfile,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('lineup');
  const [selectedPlayerUid, setSelectedPlayerUid] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [viewMode, setViewMode] = useState<'pitch' | 'list'>('pitch');

  // Discipline et éligibilité FFF
  const [eligibilityMap, setEligibilityMap] = useState<Map<string, PlayerEligibilityResult>>(new Map());
  const [disciplinaryState, setDisciplinaryState] = useState<{
    hasSuspended: boolean;
    hasVerificationRequired: boolean;
    canSubmitOfficial: boolean;
    blockingPlayers: PlayerEligibilityResult[];
  } | null>(null);
  const [inspectedDisciplinaryResult, setInspectedDisciplinaryResult] = useState<PlayerEligibilityResult | null>(null);

  const clubId = event.club_id || coachProfile?.profile?.club_id || 'club_default';

  const matchContext: MatchEligibilityContext = useMemo(
    () => ({
      match_id: event.id,
      event_type: event.event_type,
      match_date: event.starts_at || new Date(),
      is_official: event.event_type === 'competition' || !event.friendly_match_id,
    }),
    [event.id, event.event_type, event.starts_at, event.friendly_match_id]
  );

  const loadEligibility = useCallback(async () => {
    const allUids = [...lineup.starterUids, ...lineup.subUids];
    if (allUids.length === 0) return;

    try {
      const evalReport = await playerDisciplinaryService.evaluateLineupEligibility(
        allUids,
        members,
        matchContext,
        clubId
      );

      const map = new Map<string, PlayerEligibilityResult>();
      for (const res of evalReport.results) {
        map.set(res.player_uid, res);
      }
      setEligibilityMap(map);
      setDisciplinaryState({
        hasSuspended: evalReport.hasSuspended,
        hasVerificationRequired: evalReport.hasVerificationRequired,
        canSubmitOfficial: evalReport.canSubmitOfficial,
        blockingPlayers: evalReport.blockingPlayers,
      });
    } catch {
      // repli gracieux
    }
  }, [lineup.starterUids, lineup.subUids, members, matchContext, clubId]);

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      const allUids = [...lineup.starterUids, ...lineup.subUids];
      if (allUids.length === 0) return;

      try {
        const evalReport = await playerDisciplinaryService.evaluateLineupEligibility(
          allUids,
          members,
          matchContext,
          clubId
        );

        if (!isMounted) return;
        const map = new Map<string, PlayerEligibilityResult>();
        for (const res of evalReport.results) {
          map.set(res.player_uid, res);
        }
        setEligibilityMap(map);
        setDisciplinaryState({
          hasSuspended: evalReport.hasSuspended,
          hasVerificationRequired: evalReport.hasVerificationRequired,
          canSubmitOfficial: evalReport.canSubmitOfficial,
          blockingPlayers: evalReport.blockingPlayers,
        });
      } catch {
        // repli gracieux
      }
    };
    run();
    return () => {
      isMounted = false;
    };
  }, [lineup.starterUids, lineup.subUids, members, matchContext, clubId]);

  const membersMap = useMemo(() => new Map(members.map((m) => [m.uid, m])), [members]);
  const slotsMap = useMemo(
    () => new Map((event.lineup?.slots || []).map((s) => [s.uid, s])),
    [event.lineup?.slots],
  );

  const formation = talkBrief?.formation || event.lineup?.formation || '4-3-3';

  // Résolution des joueurs titulaires
  const starters: PlayerDetails[] = useMemo(() => {
    return lineup.starterUids.map((uid, idx) => {
      const user = membersMap.get(uid);
      const slot = slotsMap.get(uid);
      return {
        uid,
        name: user?.display_name || slot?.display_name || `Titulaire ${idx + 1}`,
        number: user?.profile?.jersey_number ?? (idx + 1),
        position: slot?.position_label || user?.profile?.position || 'Titulaire',
        tacticalRole: getTacticalRoleForPosition(slot?.position_label || user?.profile?.position, idx),
        coachMessage: talkBrief?.messages_by_uid?.[uid],
        isStarter: true,
      };
    });
  }, [lineup.starterUids, membersMap, slotsMap, talkBrief?.messages_by_uid]);

  // Résolution des remplaçants
  const subs: PlayerDetails[] = useMemo(() => {
    return lineup.subUids.map((uid, idx) => {
      const user = membersMap.get(uid);
      const slot = slotsMap.get(uid);
      return {
        uid,
        name: user?.display_name || slot?.display_name || `Remplaçant ${idx + 1}`,
        number: user?.profile?.jersey_number ?? (12 + idx),
        position: slot?.position_label || user?.profile?.position || 'Remplaçant',
        tacticalRole: 'Impact Player / Remplaçant prêt',
        coachMessage: talkBrief?.messages_by_uid?.[uid],
        isStarter: false,
      };
    });
  }, [lineup.subUids, membersMap, slotsMap, talkBrief?.messages_by_uid]);

  // Match teams
  const homeTeam = event.live_state?.home_label || event.club_name || 'Notre Équipe';
  const awayTeam = talkBrief?.opponent_notes?.trim() || event.live_state?.opponent_name || 'Adversaire';

  // 3 principes de jeu clés
  const keyPrinciples = useMemo(() => {
    const raw = [
      ...(talkBrief?.key_points || []),
      ...(talkBrief?.match_objective ? [talkBrief.match_objective] : []),
    ].filter(Boolean);

    if (raw.length >= 3) {
      return raw.slice(0, 3);
    }
    return [
      raw[0] || 'Intensité & pressing haut : récupération sous 5 secondes dès la perte.',
      raw[1] || 'Largeur et transition rapide : orienter le jeu vers nos ailiers lancés.',
      raw[2] || 'Bloc compact & communication : fermer l’axe et protéger la profondeur.',
    ];
  }, [talkBrief?.key_points, talkBrief?.match_objective]);

  // Tireurs coups arrêtés
  const setPieces: SetPieceTakers = useMemo(() => {
    if (talkBrief?.set_pieces) return talkBrief.set_pieces;
    return {
      penalties: starters[0] ? [`${starters[0].name} (N°${starters[0].number})`] : ['Attaquant désigné'],
      free_kicks_direct: starters[1] ? [`${starters[1].name} (N°${starters[1].number}) - Axe`] : ['Milieu offensif'],
      corners_left: starters[2] ? [`${starters[2].name} (N°${starters[2].number}) - Pied droit`] : ['Ailier gauche'],
      corners_right: starters[3] ? [`${starters[3].name} (N°${starters[3].number}) - Pied gauche`] : ['Ailier droit'],
      first_post_roles: starters[4] ? [`${starters[4].name} (Coupe agressive au premier poteau)`] : ['Coupe au premier poteau'],
    };
  }, [talkBrief?.set_pieces, starters]);

  // Placements terrain
  const pitchSlots: EventLineupSlot[] = useMemo(() => {
    return starters.map((s) => ({
      uid: s.uid,
      display_name: s.name,
      role: 'starter' as const,
      position_label: s.position,
    }));
  }, [starters]);

  const placements = useMemo(() => {
    return assignStartersToPitch(pitchSlots, formation);
  }, [pitchSlots, formation]);

  const lineIndices = useMemo(() => {
    return [...new Set(placements.map((p) => p.lineIndex))].sort((a, b) => b - a);
  }, [placements]);

  const selectedPlayer = useMemo(() => {
    if (!selectedPlayerUid) return null;
    return [...starters, ...subs].find((p) => p.uid === selectedPlayerUid) || null;
  }, [selectedPlayerUid, starters, subs]);

  const handleExport = async () => {
    // Guardrail réglementaire FFF
    if (disciplinaryState && !disciplinaryState.canSubmitOfficial && disciplinaryState.hasSuspended) {
      const suspendedNames = disciplinaryState.blockingPlayers
        .map((p) => `• ${p.player_name} (${p.license_number || 'Sans licence'})`)
        .join('\n');

      Alert.alert(
        'Joueur(s) Suspendu(s) Détecté(s)',
        `Conformément aux règlements FFF, la feuille de match officielle ne peut être homologuée avec des joueurs sous suspension ferme :\n\n${suspendedNames}\n\nQue souhaitez-vous faire ?`,
        [
          {
            text: 'Exporter en Brouillon de travail',
            onPress: async () => {
              try {
                setIsExporting(true);
                await exportOrPrintMatchSheet(event, lineup, members, talkBrief, coachProfile, {
                  isDraft: true,
                  draftWarning: `Brouillon de travail tactique • Joueur(s) suspendu(s) : ${disciplinaryState.blockingPlayers.map((p) => p.player_name).join(', ')}`,
                });
              } finally {
                setIsExporting(false);
              }
            },
          },
          {
            text: 'Examiner les sanctions',
            onPress: () => {
              if (disciplinaryState.blockingPlayers[0]) {
                setInspectedDisciplinaryResult(disciplinaryState.blockingPlayers[0]);
              }
            },
          },
          {
            text: 'Annuler',
            style: 'cancel',
          },
        ]
      );
      return;
    }

    try {
      setIsExporting(true);
      await exportOrPrintMatchSheet(event, lineup, members, talkBrief, coachProfile);
    } catch (err) {
      Alert.alert('Exportation', 'Impossible de générer la feuille de match.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <StatusBar barStyle="light-content" backgroundColor="#060913" />
      <SafeAreaView style={styles.container}>
        
        {/* En-tête Haute Définition Vestiaire */}
        <View style={styles.topHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.liveIndicator}>
              <View style={styles.livePulseDot} />
              <Text style={styles.liveText}>VESTIAIRE LIVE</Text>
            </View>
            <Text style={styles.matchTitleText} numberOfLines={1}>
              {homeTeam} <Text style={styles.versusColor}>VS</Text> {awayTeam}
            </Text>
            <View style={styles.formationBadgeRow}>
              <View style={styles.formationPill}>
                <Text style={styles.formationPillText}>Schéma {formation}</Text>
              </View>
              <Text style={styles.metaSubText}>
                {event.location_label || event.location || event.city || 'Stade'}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.printButton, isExporting && styles.printButtonDisabled]}
              onPress={handleExport}
              disabled={isExporting}
              accessibilityLabel="Imprimer la feuille de match"
              accessibilityRole="button"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="print-outline" size={18} color="#060913" />
              <Text style={styles.printButtonText}>
                {isExporting ? 'Génération...' : 'Imprimer la feuille de match'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityLabel="Fermer la causerie"
              accessibilityRole="button"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={24} color="#F8FAFC" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Alerte Disciplinaire Officielle si joueur suspendu */}
        {disciplinaryState?.hasSuspended && (
          <View style={styles.disciplinaryWarningBanner}>
            <Ionicons name="alert-circle" size={18} color="#EF4444" />
            <Text style={styles.disciplinaryWarningText} numberOfLines={1}>
              {disciplinaryState.blockingPlayers.length} joueur(s) suspendu(s) dans la composition officielle
            </Text>
            <TouchableOpacity
              style={styles.disciplinaryInspectBtn}
              onPress={() => {
                if (disciplinaryState.blockingPlayers[0]) {
                  setInspectedDisciplinaryResult(disciplinaryState.blockingPlayers[0]);
                }
              }}
            >
              <Text style={styles.disciplinaryInspectBtnText}>Détails</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Barre des Onglets Tactiques */}
        <View style={styles.tabNav}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'lineup' && styles.tabItemActive]}
            onPress={() => setActiveTab('lineup')}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'lineup' }}
          >
            <MaterialCommunityIcons
              name="soccer-field"
              size={18}
              color={activeTab === 'lineup' ? '#00F59B' : '#64748B'}
            />
            <Text style={[styles.tabText, activeTab === 'lineup' && styles.tabTextActive]}>
              Le Onze
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'principles' && styles.tabItemActive]}
            onPress={() => setActiveTab('principles')}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'principles' }}
          >
            <Ionicons
              name="bulb-outline"
              size={18}
              color={activeTab === 'principles' ? '#00F59B' : '#64748B'}
            />
            <Text style={[styles.tabText, activeTab === 'principles' && styles.tabTextActive]}>
              Consignes clés
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'setpieces' && styles.tabItemActive]}
            onPress={() => setActiveTab('setpieces')}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'setpieces' }}
          >
            <Ionicons
              name="flag-outline"
              size={18}
              color={activeTab === 'setpieces' ? '#00F59B' : '#64748B'}
            />
            <Text style={[styles.tabText, activeTab === 'setpieces' && styles.tabTextActive]}>
              Coups Arrêtés
            </Text>
          </TouchableOpacity>
        </View>

        {/* Contenu de l'onglet actif */}
        <View style={styles.contentArea}>
          {activeTab === 'lineup' && (
            <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
              
              {/* Sélecteur Vue Terrain / Vue Liste */}
              <View style={styles.viewModeToggleRow}>
                <View style={styles.segmentedControl}>
                  <TouchableOpacity
                    style={[styles.segmentBtn, viewMode === 'pitch' && styles.segmentBtnActive]}
                    onPress={() => setViewMode('pitch')}
                  >
                    <Ionicons
                      name="grid-outline"
                      size={14}
                      color={viewMode === 'pitch' ? '#060913' : '#94A3B8'}
                    />
                    <Text style={[styles.segmentText, viewMode === 'pitch' && styles.segmentTextActive]}>
                      Terrain Tactique
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.segmentBtn, viewMode === 'list' && styles.segmentBtnActive]}
                    onPress={() => setViewMode('list')}
                  >
                    <Ionicons
                      name="list-outline"
                      size={14}
                      color={viewMode === 'list' ? '#060913' : '#94A3B8'}
                    />
                    <Text style={[styles.segmentText, viewMode === 'list' && styles.segmentTextActive]}>
                      Liste Détaillée
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.formationInfoText}>Schéma : {formation}</Text>
              </View>

              {viewMode === 'pitch' ? (
                /* Terrain interactif HD */
                <View style={styles.pitchWrapper}>
                  <View style={styles.stadiumPitch}>
                    {/* Lignes réglementaires */}
                    <View style={styles.pitchCenterLine} />
                    <View style={styles.pitchCenterCircle} />
                    <View style={styles.pitchCenterSpot} />
                    <View style={styles.penaltyBoxTop} />
                    <View style={styles.penaltyBoxBottom} />

                    {/* Dispositions des lignes de jeu */}
                    {lineIndices.map((lineIndex) => {
                      const row = placements.filter((p) => p.lineIndex === lineIndex);
                      return (
                        <View key={lineIndex} style={styles.pitchLineRow}>
                          {row.map((placement) => {
                            const player = starters.find((s) => s.uid === placement.slot.uid);
                            const isSelected = selectedPlayerUid === placement.slot.uid;
                            return (
                              <TouchableOpacity
                                key={placement.slot.uid}
                                style={[styles.playerToken, isSelected && styles.playerTokenSelected]}
                                onPress={() => setSelectedPlayerUid(placement.slot.uid)}
                                activeOpacity={0.8}
                              >
                                <View
                                  style={[
                                    styles.playerJerseyCircle,
                                    lineIndex === 0 && styles.gkJerseyCircle,
                                    isSelected && styles.playerJerseySelected,
                                  ]}
                                >
                                  <Text style={styles.playerJerseyNumber}>
                                    {player?.number ?? 1}
                                  </Text>
                                </View>
                                <View style={styles.playerNamePill}>
                                  <Text style={styles.playerNameText} numberOfLines={1}>
                                    {player?.name.split(' ')[0] || 'Joueur'}
                                  </Text>
                                  {player?.position ? (
                                    <Text style={styles.playerPositionText} numberOfLines={1}>
                                      {player.position}
                                    </Text>
                                  ) : null}
                                </View>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      );
                    })}

                    {starters.length === 0 && (
                      <View style={styles.emptyPitchOverlay}>
                        <Text style={styles.emptyPitchText}>
                          Aucun joueur dans la composition de départ.
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ) : (
                /* Liste détaillée des titulaires */
                <View style={styles.listCard}>
                  <Text style={styles.cardSectionTitle}>XI Titulaires ({starters.length})</Text>
                  {starters.map((p) => (
                    <TouchableOpacity
                      key={p.uid}
                      style={[styles.playerListItem, selectedPlayerUid === p.uid && styles.playerListItemActive]}
                      onPress={() => setSelectedPlayerUid(p.uid)}
                    >
                      <View style={styles.numberBadge}>
                        <Text style={styles.numberBadgeText}>{p.number}</Text>
                      </View>
                      <View style={styles.playerInfoCol}>
                        <Text style={styles.playerListName}>{p.name}</Text>
                        <Text style={styles.playerListPos}>{p.position}</Text>
                      </View>
                      <View style={styles.roleCol}>
                        <Text style={styles.playerRoleLabel}>{p.tacticalRole}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Fiche Joueur sélectionné (Focus Tactique) */}
              {selectedPlayer && (
                <View style={styles.selectedPlayerCard}>
                  <View style={styles.selectedPlayerHeader}>
                    <View style={styles.selectedPlayerBadge}>
                      <Text style={styles.selectedPlayerBadgeNumber}>{selectedPlayer.number}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.selectedPlayerName}>{selectedPlayer.name}</Text>
                      <Text style={styles.selectedPlayerPoste}>
                        {selectedPlayer.position} • {selectedPlayer.isStarter ? 'Titulaire' : 'Remplaçant'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setSelectedPlayerUid(null)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close-circle-outline" size={22} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.selectedPlayerBody}>
                    <Text style={styles.selectedPlayerRoleTitle}>Rôle dans le système :</Text>
                    <Text style={styles.selectedPlayerRoleDesc}>{selectedPlayer.tacticalRole}</Text>
                    {selectedPlayer.coachMessage ? (
                      <View style={styles.coachIndividualNote}>
                        <Text style={styles.coachNoteTitle}>Consigne individuelle du coach :</Text>
                        <Text style={styles.coachNoteText}>{selectedPlayer.coachMessage}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              )}

              {/* Banc des remplaçants */}
              <View style={styles.benchSection}>
                <View style={styles.benchHeader}>
                  <Text style={styles.benchTitle}>Banc des Remplaçants ({subs.length})</Text>
                  <Text style={styles.benchSubtitle}>Prêts à entrer en jeu</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.benchScroll}>
                  {subs.map((p) => (
                    <TouchableOpacity
                      key={p.uid}
                      style={[styles.subCard, selectedPlayerUid === p.uid && styles.subCardSelected]}
                      onPress={() => setSelectedPlayerUid(p.uid)}
                    >
                      <View style={styles.subNumberBadge}>
                        <Text style={styles.subNumberText}>{p.number}</Text>
                      </View>
                      <Text style={styles.subName} numberOfLines={1}>{p.name.split(' ')[0]}</Text>
                      <Text style={styles.subPos} numberOfLines={1}>{p.position}</Text>
                    </TouchableOpacity>
                  ))}
                  {subs.length === 0 && (
                    <Text style={styles.emptyBenchText}>Aucun remplaçant sur la feuille de match.</Text>
                  )}
                </ScrollView>
              </View>

            </ScrollView>
          )}

          {activeTab === 'principles' && (
            <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
              
              {/* Objectif Global du Match */}
              <View style={styles.objectiveBanner}>
                <View style={styles.objectiveHeaderRow}>
                  <Ionicons name="trophy-outline" size={20} color="#00F59B" />
                  <Text style={styles.objectiveBannerTitle}>OBJECTIF PRIORITAIRE</Text>
                </View>
                <Text style={styles.objectiveBannerText}>
                  {talkBrief?.match_objective || 'Prendre l’initiative dès l’entame, imposer notre rythme et maîtriser le tempo du match.'}
                </Text>
              </View>

              {/* 3 Principes de jeu prioritaires */}
              <Text style={styles.sectionHeaderTitle}>Les 3 Principes de Jeu Clés</Text>
              
              <View style={styles.principlesContainer}>
                {keyPrinciples.map((principle, index) => {
                  const colors = ['#00F59B', '#00E5FF', '#F59E0B'];
                  const color = colors[index % colors.length];
                  return (
                    <View key={index} style={[styles.principleCard, { borderLeftColor: color }]}>
                      <View style={[styles.principleNumberCircle, { backgroundColor: color }]}>
                        <Text style={styles.principleNumberText}>{index + 1}</Text>
                      </View>
                      <View style={styles.principleContent}>
                        <Text style={styles.principleTitle}>
                          {index === 0 ? 'Intensité & Récupération Immédiate' : index === 1 ? 'Utilisation de la Largeur & Verticalité' : 'Compacité du Bloc & Sérénité'}
                        </Text>
                        <Text style={styles.principleDesc}>{principle}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Consignes par Phase de Jeu */}
              <Text style={styles.sectionHeaderTitle}>Consignes par Phase de Jeu</Text>
              
              <View style={styles.phasesGrid}>
                {/* Phase Attaque */}
                <View style={styles.phaseCard}>
                  <View style={styles.phaseCardHeader}>
                    <Ionicons name="flash-outline" size={18} color="#00E5FF" />
                    <Text style={[styles.phaseCardTitle, { color: '#00E5FF' }]}>Phase Offensive</Text>
                  </View>
                  <View style={styles.phaseBulletItem}>
                    <Text style={styles.phaseBulletDot}>•</Text>
                    <Text style={styles.phaseBulletText}>Écarter le bloc adverse dès la relance et trouver les intervalles axiaux.</Text>
                  </View>
                  <View style={styles.phaseBulletItem}>
                    <Text style={styles.phaseBulletDot}>•</Text>
                    <Text style={styles.phaseBulletText}>Dédoublements rapides sur les ailes et projection des milieux dans les 16m.</Text>
                  </View>
                  <View style={styles.phaseBulletItem}>
                    <Text style={styles.phaseBulletDot}>•</Text>
                    <Text style={styles.phaseBulletText}>Attaquer le premier poteau à la course lors de chaque centre.</Text>
                  </View>
                </View>

                {/* Phase Défense */}
                <View style={styles.phaseCard}>
                  <View style={styles.phaseCardHeader}>
                    <Ionicons name="shield-outline" size={18} color="#FF5C5C" />
                    <Text style={[styles.phaseCardTitle, { color: '#FF5C5C' }]}>Phase Défensive</Text>
                  </View>
                  <View style={styles.phaseBulletItem}>
                    <Text style={styles.phaseBulletDot}>•</Text>
                    <Text style={styles.phaseBulletText}>Bloc compact à mi-terrain, réduire la distance entre défenseurs et attaquants à 25m.</Text>
                  </View>
                  <View style={styles.phaseBulletItem}>
                    <Text style={styles.phaseBulletDot}>•</Text>
                    <Text style={styles.phaseBulletText}>Cadrer sans se jeter, orienter l'adversaire vers les lignes de touche.</Text>
                  </View>
                  <View style={styles.phaseBulletItem}>
                    <Text style={styles.phaseBulletDot}>•</Text>
                    <Text style={styles.phaseBulletText}>Agression tactique sur le second ballon après chaque dégagement.</Text>
                  </View>
                </View>
              </View>

              {/* Notes adversaires si existantes */}
              {talkBrief?.opponent_notes ? (
                <View style={styles.opponentNotesBox}>
                  <Text style={styles.opponentNotesTitle}>🔍 Analyse de l'Adversaire</Text>
                  <Text style={styles.opponentNotesText}>{talkBrief.opponent_notes}</Text>
                </View>
              ) : null}

            </ScrollView>
          )}

          {activeTab === 'setpieces' && (
            <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
              
              <View style={styles.setpieceIntroBanner}>
                <Ionicons name="locate-outline" size={24} color="#00F59B" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.setpieceIntroTitle}>COUPS DE PIED ARRÊTÉS</Text>
                  <Text style={styles.setpieceIntroDesc}>
                    30% des buts se marquent sur coup de pied arrêté. Rigueur absolue sur les marquages et agressivité dans les zones cibles.
                  </Text>
                </View>
              </View>

              {/* Grille des tireurs */}
              <View style={styles.setpiecesCardGrid}>
                
                {/* Penaltys */}
                <View style={styles.setpieceCard}>
                  <View style={styles.setpieceCardHeader}>
                    <Ionicons name="football-outline" size={18} color="#00F59B" />
                    <Text style={styles.setpieceCardTitle}>Penaltys</Text>
                  </View>
                  <Text style={styles.setpieceLabel}>Tireur N°1 :</Text>
                  <Text style={styles.setpieceValue}>
                    {setPieces.penalties?.[0] || 'Attaquant désigné'}
                  </Text>
                  <Text style={styles.setpieceLabel}>Tireur N°2 :</Text>
                  <Text style={styles.setpieceValue}>
                    {setPieces.penalties?.[1] || 'Capitaine'}
                  </Text>
                  <Text style={styles.setpieceNote}>Frappe choisie à l'avance, pas d'hésitation.</Text>
                </View>

                {/* Coups Francs Directs */}
                <View style={styles.setpieceCard}>
                  <View style={styles.setpieceCardHeader}>
                    <Ionicons name="flash-outline" size={18} color="#FFD166" />
                    <Text style={styles.setpieceCardTitle}>Coups Francs Directs</Text>
                  </View>
                  <Text style={styles.setpieceLabel}>Axe &amp; Distance (&lt; 25m) :</Text>
                  <Text style={styles.setpieceValue}>
                    {setPieces.free_kicks_direct?.[0] || 'Milieu Offensif'}
                  </Text>
                  <Text style={styles.setpieceLabel}>Côté Droit / Gauche :</Text>
                  <Text style={styles.setpieceValue}>
                    {setPieces.free_kicks_direct?.[1] || 'Pied opposé enroulé'}
                  </Text>
                  <Text style={styles.setpieceNote}>Cadrer au-dessus du mur ou côté ouvert.</Text>
                </View>

                {/* Corners */}
                <View style={styles.setpieceCard}>
                  <View style={styles.setpieceCardHeader}>
                    <Ionicons name="flag-outline" size={18} color="#00E5FF" />
                    <Text style={styles.setpieceCardTitle}>Corners (G / D)</Text>
                  </View>
                  <Text style={styles.setpieceLabel}>Corner Gauche :</Text>
                  <Text style={styles.setpieceValue}>
                    {setPieces.corners_left?.[0] || 'Pied droit (rentrant)'}
                  </Text>
                  <Text style={styles.setpieceLabel}>Corner Droit :</Text>
                  <Text style={styles.setpieceValue}>
                    {setPieces.corners_right?.[0] || 'Pied gauche (rentrant)'}
                  </Text>
                  <Text style={styles.setpieceNote}>Trajectoire tendue entre les 6m et le point de penalty.</Text>
                </View>

                {/* Rôles 1er poteau & Surface */}
                <View style={styles.setpieceCard}>
                  <View style={styles.setpieceCardHeader}>
                    <Ionicons name="people-outline" size={18} color="#A78BFA" />
                    <Text style={styles.setpieceCardTitle}>Rôles &amp; 1er Poteau</Text>
                  </View>
                  <Text style={styles.setpieceLabel}>Coupe au premier poteau :</Text>
                  <Text style={styles.setpieceValue}>
                    {setPieces.first_post_roles?.[0] || 'Attaquant ou Défenseur Central'}
                  </Text>
                  <Text style={styles.setpieceLabel}>Présence 2nd poteau :</Text>
                  <Text style={styles.setpieceValue}>Ailier opposé &amp; Arrière latéral</Text>
                  <Text style={styles.setpieceNote}>2 joueurs restent systématiquement en couverture arrière.</Text>
                </View>

              </View>

              {/* Disposition Tactique visuelle sur corner */}
              <View style={styles.setpieceDiagramBox}>
                <Text style={styles.setpieceDiagramTitle}>Schéma Type : Corner Offensif</Text>
                <View style={styles.setpieceDiagramVisual}>
                  <View style={styles.diagramGoalArea} />
                  <View style={styles.diagramCornerSpot} />
                  <View style={[styles.diagramPlayerDot, { top: 20, left: '38%', backgroundColor: '#00F59B' }]}>
                    <Text style={styles.diagramDotText}>1er Pot.</Text>
                  </View>
                  <View style={[styles.diagramPlayerDot, { top: 35, left: '50%', backgroundColor: '#00E5FF' }]}>
                    <Text style={styles.diagramDotText}>Point Pen.</Text>
                  </View>
                  <View style={[styles.diagramPlayerDot, { top: 22, right: '28%', backgroundColor: '#FFD166' }]}>
                    <Text style={styles.diagramDotText}>2nd Pot.</Text>
                  </View>
                  <View style={[styles.diagramPlayerDot, { top: 80, left: '46%', backgroundColor: '#A78BFA' }]}>
                    <Text style={styles.diagramDotText}>16m Retrait</Text>
                  </View>
                </View>
              </View>

            </ScrollView>
          )}
        </View>

        {/* Barre inférieure : Rappel tactique et Bouton d'export */}
        <View style={styles.bottomBar}>
          <View style={styles.bottomBarInfo}>
            <Text style={styles.bottomBarTitle}>PRODAY TACTICAL SUITE</Text>
            <Text style={styles.bottomBarSubtitle}>Causerie interactive &amp; projection vestiaire</Text>
          </View>
          <TouchableOpacity
            style={styles.quickExportBtn}
            onPress={handleExport}
            disabled={isExporting}
          >
            <Ionicons name="document-text-outline" size={16} color="#060913" />
            <Text style={styles.quickExportBtnText}>Exporter PDF / Imprimer</Text>
          </TouchableOpacity>
        </View>

        {/* Modale de vérification disciplinaire et override */}
        <DisciplinaryCheckModal
          visible={Boolean(inspectedDisciplinaryResult)}
          onClose={() => setInspectedDisciplinaryResult(null)}
          result={inspectedDisciplinaryResult}
          matchContext={matchContext}
          clubId={clubId}
          currentUserName={coachProfile?.display_name || 'Coach Principal'}
          currentUserUid={coachProfile?.uid || 'coach_uid'}
          canOverride={true}
          onOverrideSaved={() => {
            loadEligibility();
            setInspectedDisciplinaryResult(null);
          }}
        />

      </SafeAreaView>
    </Modal>
  );
};

function getTacticalRoleForPosition(position?: string, idx: number = 0): string {
  if (!position) return idx === 0 ? 'Gardien moderne / Relanceur' : 'Joueur de couloir';
  const pos = position.toLowerCase();
  if (pos.includes('gardien') || pos.includes('gk') || pos.includes('gb')) {
    return 'Gardien libéro : communication et relance rapide';
  }
  if (pos.includes('défenseur central') || pos.includes('dc') || pos.includes('cb')) {
    return 'Défenseur central : duel, couverture et première relance propre';
  }
  if (pos.includes('latéral') || pos.includes('dd') || pos.includes('dg') || pos.includes('lb') || pos.includes('rb')) {
    return 'Latéral moderne : animation du couloir et solidité dans le dos';
  }
  if (pos.includes('milieu défensif') || pos.includes('mdc') || pos.includes('cdm')) {
    return 'Sentinelle : équilibre équipe, protection axe et transition';
  }
  if (pos.includes('milieu') || pos.includes('mc') || pos.includes('cm') || pos.includes('mo') || pos.includes('cam')) {
    return 'Milieu relayeur : projection, tempo et orientation du jeu';
  }
  if (pos.includes('ailier') || pos.includes('ag') || pos.includes('ad') || pos.includes('lw') || pos.includes('rw')) {
    return 'Ailier percutant : provocation en 1v1 et appels dans le dos';
  }
  if (pos.includes('attaquant') || pos.includes('bu') || pos.includes('st') || pos.includes('avant')) {
    return 'Avant-centre : fixation axiale, profondeur et efficacité chirurgicale';
  }
  return 'Rôle clé dans l’équilibre tactique du collectif';
}

const styles = StyleSheet.create({
  disciplinaryWarningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(239, 68, 68, 0.35)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  disciplinaryWarningText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#F87171',
  },
  disciplinaryInspectBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  disciplinaryInspectBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#060913',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#0B132B',
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00F59B',
    marginRight: 6,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00F59B',
    letterSpacing: 0.1,
  },
  matchTitleText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 0.02,
  },
  versusColor: {
    color: '#00F59B',
  },
  formationBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  formationPill: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  formationPillText: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '800',
  },
  metaSubText: {
    color: '#94A3B8',
    fontSize: 11,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  printButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00F59B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  printButtonDisabled: {
    opacity: 0.6,
  },
  printButtonText: {
    color: '#060913',
    fontWeight: '800',
    fontSize: 12,
  },
  closeButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#1E293B',
  },
  tabNav: {
    flexDirection: 'row',
    backgroundColor: '#0A0F1D',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#00F59B',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#00F59B',
  },
  contentArea: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  viewModeToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  segmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 5,
  },
  segmentBtnActive: {
    backgroundColor: '#00F59B',
  },
  segmentText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: '#060913',
  },
  formationInfoText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  pitchWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16,
  },
  stadiumPitch: {
    aspectRatio: 0.72,
    backgroundColor: '#064E3B',
    position: 'relative',
    paddingVertical: 16,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  pitchCenterLine: {
    position: 'absolute',
    top: '50%',
    left: 10,
    right: 10,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  pitchCenterCircle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 70,
    height: 70,
    marginLeft: -35,
    marginTop: -35,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  pitchCenterSpot: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 6,
    height: 6,
    marginLeft: -3,
    marginTop: -3,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  penaltyBoxTop: {
    position: 'absolute',
    top: 0,
    left: '26%',
    width: '48%',
    height: 48,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  penaltyBoxBottom: {
    position: 'absolute',
    bottom: 0,
    left: '26%',
    width: '48%',
    height: 48,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  pitchLineRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    zIndex: 2,
  },
  playerToken: {
    alignItems: 'center',
    padding: 4,
  },
  playerTokenSelected: {
    transform: [{ scale: 1.15 }],
  },
  playerJerseyCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0F172A',
    borderWidth: 2,
    borderColor: '#00F59B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  gkJerseyCircle: {
    borderColor: '#FFD166',
    backgroundColor: '#1E1B4B',
  },
  playerJerseySelected: {
    borderColor: '#FFFFFF',
    backgroundColor: '#00F59B',
  },
  playerJerseyNumber: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  playerNamePill: {
    backgroundColor: 'rgba(11, 19, 43, 0.85)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 3,
    alignItems: 'center',
    maxWidth: 75,
  },
  playerNameText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  playerPositionText: {
    color: '#00F59B',
    fontSize: 8.5,
    fontWeight: '700',
  },
  emptyPitchOverlay: {
    position: 'absolute',
    top: '45%',
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  emptyPitchText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  listCard: {
    backgroundColor: '#0B132B',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16,
  },
  cardSectionTitle: {
    color: '#00F59B',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  playerListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  playerListItemActive: {
    backgroundColor: '#111827',
    borderRadius: 6,
  },
  numberBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  numberBadgeText: {
    color: '#00F59B',
    fontWeight: '800',
    fontSize: 12,
  },
  playerInfoCol: {
    flex: 1,
  },
  playerListName: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  playerListPos: {
    color: '#94A3B8',
    fontSize: 11,
  },
  roleCol: {
    maxWidth: 160,
  },
  playerRoleLabel: {
    color: '#00E5FF',
    fontSize: 11,
    textAlign: 'right',
  },
  selectedPlayerCard: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#00F59B',
    marginBottom: 16,
  },
  selectedPlayerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
    paddingBottom: 10,
    marginBottom: 10,
  },
  selectedPlayerBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00F59B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedPlayerBadgeNumber: {
    color: '#060913',
    fontWeight: '900',
    fontSize: 16,
  },
  selectedPlayerName: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
  },
  selectedPlayerPoste: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  selectedPlayerBody: {},
  selectedPlayerRoleTitle: {
    color: '#00F59B',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  selectedPlayerRoleDesc: {
    color: '#E2E8F0',
    fontSize: 13,
    marginTop: 3,
    lineHeight: 18,
  },
  coachIndividualNote: {
    marginTop: 10,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#00E5FF',
  },
  coachNoteTitle: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '800',
  },
  coachNoteText: {
    color: '#F8FAFC',
    fontSize: 12,
    marginTop: 2,
  },
  benchSection: {
    backgroundColor: '#0B132B',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  benchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  benchTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  benchSubtitle: {
    color: '#64748B',
    fontSize: 11,
  },
  benchScroll: {
    flexDirection: 'row',
  },
  subCard: {
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
    width: 85,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  subCardSelected: {
    borderColor: '#00F59B',
    backgroundColor: '#1E293B',
  },
  subNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  subNumberText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
  },
  subName: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '700',
  },
  subPos: {
    color: '#94A3B8',
    fontSize: 9.5,
    marginTop: 2,
  },
  emptyBenchText: {
    color: '#64748B',
    fontSize: 12,
    paddingVertical: 6,
  },
  objectiveBanner: {
    backgroundColor: '#0B132B',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#00F59B',
    marginBottom: 16,
  },
  objectiveHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  objectiveBannerTitle: {
    color: '#00F59B',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.05,
  },
  objectiveBannerText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  sectionHeaderTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.05,
    marginBottom: 10,
  },
  principlesContainer: {
    gap: 10,
    marginBottom: 16,
  },
  principleCard: {
    flexDirection: 'row',
    backgroundColor: '#0B132B',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
  },
  principleNumberCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  principleNumberText: {
    color: '#060913',
    fontWeight: '900',
    fontSize: 15,
  },
  principleContent: {
    flex: 1,
  },
  principleTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  principleDesc: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
  },
  phasesGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  phaseCard: {
    flex: 1,
    backgroundColor: '#0B132B',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  phaseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingBottom: 6,
  },
  phaseCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  phaseBulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  phaseBulletDot: {
    color: '#64748B',
    marginRight: 6,
    fontSize: 14,
    lineHeight: 16,
  },
  phaseBulletText: {
    flex: 1,
    color: '#CBD5E1',
    fontSize: 11,
    lineHeight: 15,
  },
  opponentNotesBox: {
    backgroundColor: '#111827',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  opponentNotesTitle: {
    color: '#FFD166',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  opponentNotesText: {
    color: '#E2E8F0',
    fontSize: 12,
    lineHeight: 18,
  },
  setpieceIntroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B132B',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16,
  },
  setpieceIntroTitle: {
    color: '#00F59B',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.05,
  },
  setpieceIntroDesc: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  setpiecesCardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  setpieceCard: {
    width: '48%',
    backgroundColor: '#0B132B',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  setpieceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingBottom: 6,
    marginBottom: 8,
  },
  setpieceCardTitle: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  setpieceLabel: {
    color: '#64748B',
    fontSize: 9.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  setpieceValue: {
    color: '#00F59B',
    fontSize: 11.5,
    fontWeight: '800',
    marginBottom: 6,
  },
  setpieceNote: {
    color: '#94A3B8',
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 2,
  },
  setpieceDiagramBox: {
    backgroundColor: '#0B132B',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  setpieceDiagramTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
  },
  setpieceDiagramVisual: {
    height: 120,
    backgroundColor: '#064E3B',
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  diagramGoalArea: {
    position: 'absolute',
    top: 0,
    left: '30%',
    width: '40%',
    height: 35,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  diagramCornerSpot: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 20,
    height: 20,
    borderBottomRightRadius: 20,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#00F59B',
  },
  diagramPlayerDot: {
    position: 'absolute',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  diagramDotText: {
    color: '#060913',
    fontSize: 8.5,
    fontWeight: '800',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0B132B',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  bottomBarInfo: {},
  bottomBarTitle: {
    color: '#00F59B',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.1,
  },
  bottomBarSubtitle: {
    color: '#64748B',
    fontSize: 10,
  },
  quickExportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00F59B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
  },
  quickExportBtnText: {
    color: '#060913',
    fontWeight: '800',
    fontSize: 11,
  },
});
