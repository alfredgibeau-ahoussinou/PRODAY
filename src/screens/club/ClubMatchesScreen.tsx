import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { useClubShellNav } from '../../features/club/shell/ClubShellNavContext';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import {
  ClubChapterScroll,
  ClubLoading,
  ClubSegmentedControl,
} from '../../features/club/ui/clubUi';
import { ClubBrandHeader } from '../../features/club/ui/ClubBrandHeader';
import { ClubMatchDayHero, ClubMatchListRow } from '../../features/club/ui/ClubMatchesDay';
import {
  buildClubMatchCardModel,
  resolveClubMatchHero,
  resolveMatchHubActions,
  sortClubMatches,
} from '../../features/club/ui/clubMatchesModel';
import { ClubMatchInvitePanel } from '../../components/club/ClubMatchInvitePanel';
import { ClubFriendlyMatchesPanel } from '../../components/club/ClubFriendlyMatchesPanel';
import { PressableSpring, PushScreenTransition } from '../../components/motion';
import { MatchEventHubScreen } from '../MatchEventHubScreen';
import type { MatchHubChapterId } from '../../content/matchHubChapters';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';
import { teamEventsService } from '../../services/teamEvents.service';
import { Icon } from '../../components/ui/Icon';
import type { IconName } from '../../components/ui/iconNames';
import { ProDayText } from '../../components/ui/ProDayText';

type Tab = 'list' | 'invites';

type AiPresetChip = {
  id: string;
  label: string;
  prompt: string;
  icon: IconName;
};

const AI_TACTICAL_CHIPS: AiPresetChip[] = [
  {
    id: 'derby',
    label: 'Derby & Intensité',
    prompt: 'Préparation derby haute intensité, duels engagés et agressivité positive',
    icon: 'trophy',
  },
  {
    id: 'high-press',
    label: 'Bloc Haut & Pressing',
    prompt: 'Pressing tout terrain, récupération haute et étouffement de la relance adverse',
    icon: 'flash',
  },
  {
    id: 'counter',
    label: 'Transition Rapide',
    prompt: 'Bloc médian compact et projection ultra-rapide sur les ailes en contre',
    icon: 'refresh',
  },
  {
    id: 'rotation',
    label: 'Rotation & Temps de jeu',
    prompt: 'Gestion équilibrée des temps de jeu, intégration des remplaçants et maintien du rythme',
    icon: 'people',
  },
  {
    id: 'set-pieces',
    label: 'Coups de Pied Arrêtés',
    prompt: 'Focus corners offensifs au premier poteau, coups francs directs et marquage strict',
    icon: 'star',
  },
  {
    id: 'speech',
    label: 'Causerie Motivation',
    prompt: 'Causerie d’avant-match galvanisante axée sur la fierté du club et la solidarité',
    icon: 'mic',
  },
];

type GeneratedMatchPlan = {
  title: string;
  formation: string;
  instructions: string[];
  talk: string;
  teamId?: string;
};

/**
 * Écran Matchs Club — Studio Match & Tactique IA mis en avant,
 * calendrier officiel, direct live et invitations inter-clubs.
 */
export function ClubMatchesScreen() {
  const shellNav = useClubShellNav();
  const profile = useSessionProfile();
  const { tokens } = useClubTheme();
  const ws = useClubWorkspace();
  const [tab, setTab] = useState<Tab>('list');
  const [hubEventId, setHubEventId] = useState<string | null>(null);
  const [hubChapter, setHubChapter] = useState<MatchHubChapterId>('apercu');
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  // État IA & Calendrier
  const [aiStudioOpen, setAiStudioOpen] = useState(false);
  const [matchFilter, setMatchFilter] = useState<'all' | 'upcoming' | 'finished'>('all');
  const [aiPrompt, setAiPrompt] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    ws.teamRows[0]?.teamId ?? '',
  );
  const [aiLoading, setAiLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedMatchPlan | null>(null);
  const [submittingMatch, setSubmittingMatch] = useState(false);

  // État Modal Création Manuelle
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualOpponent, setManualOpponent] = useState('');
  const [manualLocation, setManualLocation] = useState('');
  const [manualIsHome, setManualIsHome] = useState(true);
  const [manualCreating, setManualCreating] = useState(false);

  const matches = useMemo(() => sortClubMatches(ws.events), [ws.events]);

  const filteredMatches = useMemo(() => {
    if (matchFilter === 'all') return matches;
    const now = Date.now();
    if (matchFilter === 'upcoming') {
      return matches.filter((m) => {
        const t = m.starts_at ? new Date(m.starts_at).getTime() : 0;
        return t >= now - 2 * 3600_000;
      });
    }
    return matches.filter((m) => {
      const t = m.starts_at ? new Date(m.starts_at).getTime() : 0;
      return t < now - 2 * 3600_000;
    });
  }, [matches, matchFilter]);

  const heroEvent = useMemo(() => resolveClubMatchHero(filteredMatches), [filteredMatches]);
  const heroModel = useMemo(
    () => (heroEvent ? buildClubMatchCardModel(heroEvent, ws.teamRows) : null),
    [heroEvent, ws.teamRows],
  );
  const listModels = useMemo(
    () =>
      filteredMatches
        .filter((m) => m.id !== heroEvent?.id)
        .map((m) => buildClubMatchCardModel(m, ws.teamRows)),
    [filteredMatches, heroEvent?.id, ws.teamRows],
  );

  const openHub = (eventId: string, chapter: MatchHubChapterId = 'apercu') => {
    setHubChapter(chapter);
    setHubEventId(eventId);
  };

  // Génération IA du plan de match
  const handleGenerateAiPlan = (customPrompt?: string) => {
    const text = customPrompt || aiPrompt.trim();
    if (!text) {
      Alert.alert('Consigne requise', 'Saisissez une consigne ou sélectionnez un objectif tactique ci-dessous.');
      return;
    }
    setAiLoading(true);

    const targetTeam = ws.teamRows.find((t) => t.teamId === selectedTeamId) || ws.teamRows[0];
    const teamName = targetTeam?.name || 'Équipe 1';

    setTimeout(() => {
      let formation = '4-3-3 Équilibré';
      if (text.toLowerCase().includes('contre') || text.toLowerCase().includes('transition')) {
        formation = '3-5-2 Contre-attaque';
      } else if (text.toLowerCase().includes('press') || text.toLowerCase().includes('haut')) {
        formation = '4-2-3-1 Pressing haut';
      } else if (text.toLowerCase().includes('derby') || text.toLowerCase().includes('intensit')) {
        formation = '4-3-3 Densité axiale';
      }

      setGeneratedPlan({
        title: `Match ${teamName} - ${text.slice(0, 32)}`,
        formation,
        instructions: [
          'Récupération active : déclenchement du pressing dès la première passe axiale.',
          'Largeur offensive : dédoublement constant des latéraux pour étirer le bloc adverse.',
          'Sécurité défensive : marquage individuel strict sur les transitions adverses.',
        ],
        talk: `« Messieurs, l'objectif est clair aujourd'hui : rigueur, solidarité et fierté du maillot. Respectez le plan de jeu dès la première minute ! »`,
        teamId: targetTeam?.teamId,
      });
      setAiLoading(false);
    }, 600);
  };

  // Validation & Création du match généré par l'IA
  const handleValidateAiMatch = async () => {
    if (!generatedPlan || !profile) return;
    setSubmittingMatch(true);
    try {
      const matchDate = new Date();
      matchDate.setDate(matchDate.getDate() + 3);
      matchDate.setHours(15, 0, 0, 0);

      const endDate = new Date(matchDate.getTime() + 2 * 3600_000);

      await teamEventsService.create({
        title: generatedPlan.title,
        event_type: 'competition',
        starts_at: matchDate,
        ends_at: endDate,
        city: ws.club?.city || 'Paris',
        location_label: 'Stade Municipal (Terrain Honneur)',
        organizer_uid: profile.uid,
        organizer_name: profile.display_name,
        team_id: generatedPlan.teamId || ws.teamRows[0]?.teamId,
        club_id: ws.clubId ?? undefined,
        club_name: ws.club?.name ?? profile.display_name,
        description: `Plan Tactique : ${generatedPlan.formation}\n\nConsignes :\n- ${generatedPlan.instructions.join('\n- ')}\n\nCauserie :\n${generatedPlan.talk}`,
        invitee_uids: ws.players.slice(0, 16).map((p) => p.uid),
      });

      Alert.alert('Match programmé', 'Le match a été créé et planifié avec succès dans le calendrier du club.');
      setGeneratedPlan(null);
      setAiPrompt('');
      await ws.refresh();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Impossible de planifier le match.');
    } finally {
      setSubmittingMatch(false);
    }
  };

  // Création Manuelle de Match
  const handleCreateManualMatch = async () => {
    const opp = manualOpponent.trim();
    if (!opp) {
      Alert.alert('Adversaire requis', 'Indiquez le nom du club adverse.');
      return;
    }
    if (!profile) return;

    setManualCreating(true);
    try {
      const matchDate = new Date();
      matchDate.setDate(matchDate.getDate() + 2);
      matchDate.setHours(15, 30, 0, 0);

      const targetTeam = ws.teamRows.find((t) => t.teamId === selectedTeamId) || ws.teamRows[0];
      const teamTitle = targetTeam ? `${targetTeam.name} vs ${opp}` : `Match vs ${opp}`;

      await teamEventsService.create({
        title: teamTitle,
        event_type: 'competition',
        starts_at: matchDate,
        city: ws.club?.city || 'Paris',
        location_label: manualLocation.trim() || (manualIsHome ? 'À Domicile' : 'À l’Extérieur'),
        organizer_uid: profile.uid,
        organizer_name: profile.display_name,
        team_id: targetTeam?.teamId,
        club_id: ws.clubId ?? undefined,
        club_name: ws.club?.name ?? profile.display_name,
        invitee_uids: ws.players.slice(0, 16).map((p) => p.uid),
      });

      setManualModalOpen(false);
      setManualOpponent('');
      setManualLocation('');
      await ws.refresh();
      Alert.alert('Match créé', 'La rencontre a été ajoutée au calendrier officiel du club.');
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Création impossible.');
    } finally {
      setManualCreating(false);
    }
  };

  if (ws.loading) return <ClubLoading />;

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
        {/* Header Moderne */}
        <ClubBrandHeader
          title="Matchs"
          subtitle={
            heroModel?.isLive
              ? 'Match en direct — score et gestion'
              : 'Studio tactique IA · Calendrier · Compétitions'
          }
        />

        {/* Onglets Calendrier / Invitations */}
        <ClubSegmentedControl
          options={[
            { id: 'list' as const, label: `Calendrier Club (${matches.length})` },
            { id: 'invites' as const, label: 'Invitations Amicales' },
          ]}
          value={tab}
          onChange={setTab}
        />

        {tab === 'invites' ? (
          <View style={styles.invitesWrap}>
            <View style={styles.sectionCard}>
              <ProDayText variant="section" style={styles.sectionCardTitle}>
                Inter-clubs & Défis
              </ProDayText>
              {ws.clubId ? (
                <ClubMatchInvitePanel
                  onOrganize={() => shellNav?.openCreate?.('invite_club')}
                  onPropose={() => shellNav?.openCreate?.('invite_club')}
                  onOpenConvocations={() => setTab('list')}
                />
              ) : (
                <ProDayText variant="body" style={{ color: '#8E8E9F' }}>
                  Liez un club à votre compte pour envoyer ou recevoir des invitations.
                </ProDayText>
              )}
            </View>

            {ws.clubId && profile ? (
              <View style={styles.sectionCard}>
                <ProDayText variant="section" style={styles.sectionCardTitle}>
                  Invitations reçues & Réponses
                </ProDayText>
                <ClubFriendlyMatchesPanel
                  clubId={ws.clubId}
                  clubName={ws.club?.name ?? profile.display_name}
                  profile={profile}
                />
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.mainTabContent}>
            {/* Bannière Teaser Studio IA (Repliée par défaut) */}
            {!aiStudioOpen ? (
              <PressableSpring
                onPress={() => setAiStudioOpen(true)}
                scaleTo={0.98}
                haptic
                style={styles.aiStudioTeaser}
              >
                <LinearGradient
                  colors={['rgba(139, 92, 246, 0.16)', 'rgba(18, 18, 28, 0.95)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                  pointerEvents="none"
                />
                <View style={styles.aiTeaserLeft}>
                  <View style={styles.aiTeaserIcon}>
                    <Icon name="star-four-points" size={16} color="#A78BFA" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.aiTeaserTitleRow}>
                      <ProDayText variant="caption" style={styles.aiTeaserTitle}>
                        Studio Tactique & Plan de Match
                      </ProDayText>
                      <View style={styles.geminiBadge}>
                        <ProDayText variant="caption" style={styles.geminiBadgeText}>
                          GEMINI
                        </ProDayText>
                      </View>
                    </View>
                    <ProDayText variant="caption" style={styles.aiTeaserSub} numberOfLines={1}>
                      Dispositifs, causeries et consignes en 1 clic
                    </ProDayText>
                  </View>
                </View>
                <View style={styles.aiTeaserOpenBtn}>
                  <ProDayText variant="caption" style={styles.aiTeaserOpenText}>
                    Ouvrir
                  </ProDayText>
                  <Icon name="chevron-forward" size={13} color="#A78BFA" />
                </View>
              </PressableSpring>
            ) : (
              /* Carte Studio IA dépliée */
              <View style={styles.aiStudioCard}>
                <LinearGradient
                  colors={['rgba(139, 92, 246, 0.16)', 'rgba(10, 10, 16, 0.95)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                  pointerEvents="none"
                />

                <View style={styles.aiHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={styles.aiBadge}>
                      <Icon name="star-four-points" size={13} color="#A78BFA" />
                      <ProDayText variant="caption" style={styles.aiBadgeText}>
                        COPILOTE MATCH IA
                      </ProDayText>
                    </View>
                    <View style={styles.geminiBadge}>
                      <ProDayText variant="caption" style={styles.geminiBadgeText}>
                        GEMINI
                      </ProDayText>
                    </View>
                  </View>
                  <PressableSpring
                    onPress={() => setAiStudioOpen(false)}
                    scaleTo={0.92}
                    haptic
                    style={styles.closeAiCardBtn}
                  >
                    <Icon name="close" size={15} color="#8E8E9F" />
                  </PressableSpring>
                </View>

                {/* Champ de saisie prompt IA */}
                <View style={styles.promptInputWrap}>
                  <TextInput
                    style={styles.promptInput}
                    placeholder="Ex: Plan de match contre rival bloc bas, rotation U17..."
                    placeholderTextColor="#6B6B7F"
                    value={aiPrompt}
                    onChangeText={setAiPrompt}
                    multiline
                  />
                  {aiPrompt.length > 0 ? (
                    <PressableSpring
                      onPress={() => setAiPrompt('')}
                      style={styles.clearPromptBtn}
                    >
                      <Icon name="close" size={14} color="#8E8E9F" />
                    </PressableSpring>
                  ) : null}
                </View>

                {/* Sélecteur d'équipe cible si plusieurs équipes */}
                {ws.teamRows.length > 0 ? (
                  <View style={styles.teamSelectRow}>
                    <ProDayText variant="caption" style={styles.teamSelectLabel}>
                      Équipe :
                    </ProDayText>
                    <View style={styles.teamChipsList}>
                      {ws.teamRows.map((t) => {
                        const selected = t.teamId === selectedTeamId;
                        return (
                          <PressableSpring
                            key={t.teamId}
                            onPress={() => setSelectedTeamId(t.teamId)}
                            scaleTo={0.96}
                            haptic
                            style={[
                              styles.teamChip,
                              selected && styles.teamChipSelected,
                            ]}
                          >
                            <ProDayText
                              variant="caption"
                              style={[
                                styles.teamChipText,
                                selected && styles.teamChipTextSelected,
                              ]}
                            >
                              {t.name}
                            </ProDayText>
                          </PressableSpring>
                        );
                      })}
                    </View>
                  </View>
                ) : null}

                {/* 6 Chips Tactiques IA */}
                <View style={styles.chipsWrap}>
                  {AI_TACTICAL_CHIPS.map((chip) => (
                    <PressableSpring
                      key={chip.id}
                      onPress={() => {
                        setAiPrompt(chip.prompt);
                        handleGenerateAiPlan(chip.prompt);
                      }}
                      scaleTo={0.95}
                      haptic
                      style={styles.chipTile}
                    >
                      <Icon name={chip.icon} size={12} color="#A78BFA" />
                      <ProDayText variant="caption" style={styles.chipTileText}>
                        {chip.label}
                      </ProDayText>
                    </PressableSpring>
                  ))}
                </View>

                {/* Bouton de génération IA */}
                <PressableSpring
                  onPress={() => handleGenerateAiPlan()}
                  disabled={aiLoading}
                  scaleTo={0.96}
                  haptic
                  style={styles.generateBtn}
                >
                  {aiLoading ? (
                    <ActivityIndicator size="small" color="#000000" />
                  ) : (
                    <>
                      <Icon name="star-four-points" size={15} color="#000000" />
                      <ProDayText variant="caption" style={styles.generateBtnText}>
                        Générer le Plan de Match IA
                      </ProDayText>
                    </>
                  )}
                </PressableSpring>

                {/* Résultat IA Généré */}
                {generatedPlan ? (
                  <View style={styles.resultBox}>
                    <View style={styles.resultHeader}>
                      <View style={styles.formationPill}>
                        <Icon name="shield" size={12} color="#10B981" />
                        <ProDayText variant="caption" style={styles.formationText}>
                          Dispositif : {generatedPlan.formation}
                        </ProDayText>
                      </View>
                      <PressableSpring
                        onPress={() => setGeneratedPlan(null)}
                        style={styles.closePlanBtn}
                      >
                        <Icon name="close" size={14} color="#8E8E9F" />
                      </PressableSpring>
                    </View>

                    <ProDayText variant="section" style={styles.resultTitle}>
                      {generatedPlan.title}
                    </ProDayText>

                    <View style={styles.instructionsBlock}>
                      {generatedPlan.instructions.map((inst, i) => (
                        <View key={i} style={styles.instructionRow}>
                          <View style={styles.instDot} />
                          <ProDayText variant="caption" style={styles.instText}>
                            {inst}
                          </ProDayText>
                        </View>
                      ))}
                    </View>

                    <View style={styles.talkBlock}>
                      <Icon name="chat" size={13} color="#A78BFA" />
                      <ProDayText variant="caption" style={styles.talkText}>
                        {generatedPlan.talk}
                      </ProDayText>
                    </View>

                    <PressableSpring
                      onPress={handleValidateAiMatch}
                      disabled={submittingMatch}
                      scaleTo={0.96}
                      haptic
                      style={styles.validatePlanBtn}
                    >
                      {submittingMatch ? (
                        <ActivityIndicator size="small" color="#000000" />
                      ) : (
                        <>
                          <Icon name="checkmark-circle" size={15} color="#000000" />
                          <ProDayText variant="caption" style={styles.validatePlanText}>
                            Valider & Programmer ce Match
                          </ProDayText>
                        </>
                      )}
                    </PressableSpring>
                  </View>
                ) : null}
              </View>
            )}

            {/* Barre de Filtres & Création Manuelle */}
            <View style={styles.filterBar}>
              <View style={styles.filterChipsRow}>
                {(
                  [
                    { id: 'all' as const, label: `Tous (${matches.length})` },
                    { id: 'upcoming' as const, label: 'À venir' },
                    { id: 'finished' as const, label: 'Terminés' },
                  ]
                ).map((f) => {
                  const active = matchFilter === f.id;
                  return (
                    <PressableSpring
                      key={f.id}
                      onPress={() => setMatchFilter(f.id)}
                      scaleTo={0.95}
                      haptic
                      style={[styles.filterChip, active && styles.filterChipActive]}
                    >
                      <ProDayText
                        variant="caption"
                        style={[
                          styles.filterChipText,
                          active && styles.filterChipTextActive,
                        ]}
                      >
                        {f.label}
                      </ProDayText>
                    </PressableSpring>
                  );
                })}
              </View>
              <PressableSpring
                onPress={() => setManualModalOpen(true)}
                scaleTo={0.95}
                haptic
                style={styles.addMatchBtn}
              >
                <Icon name="add" size={14} color="#FFFFFF" />
                <ProDayText variant="caption" style={styles.addMatchBtnText}>
                  + Nouveau Match
                </ProDayText>
              </PressableSpring>
            </View>

            {/* Liste des Matchs ou État Vide */}
            {filteredMatches.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconWrap}>
                  <Icon name="trophy" size={26} color="#8E8E9F" />
                </View>
                <ProDayText variant="section" style={styles.emptyTitle}>
                  {matchFilter === 'all'
                    ? 'Aucun match au calendrier'
                    : matchFilter === 'upcoming'
                    ? 'Aucun match à venir'
                    : 'Aucun match terminé'}
                </ProDayText>
                <ProDayText variant="caption" style={styles.emptySub}>
                  {matchFilter === 'all'
                    ? 'Planifiez vos matchs de championnat ou amicaux, ou générez une rencontre avec le Studio IA.'
                    : 'Aucune rencontre ne correspond à ce filtre.'}
                </ProDayText>
                <View style={styles.emptyActionsRow}>
                  <PressableSpring
                    onPress={() => setManualModalOpen(true)}
                    scaleTo={0.96}
                    haptic
                    style={styles.emptyActionBtn}
                  >
                    <Icon name="add" size={14} color="#000000" />
                    <ProDayText variant="caption" style={styles.emptyActionText}>
                      Créer un match manuellement
                    </ProDayText>
                  </PressableSpring>
                  {!aiStudioOpen ? (
                    <PressableSpring
                      onPress={() => setAiStudioOpen(true)}
                      scaleTo={0.96}
                      haptic
                      style={styles.emptyAiBtn}
                    >
                      <Icon name="star-four-points" size={14} color="#A78BFA" />
                      <ProDayText variant="caption" style={styles.emptyAiBtnText}>
                        Studio IA
                      </ProDayText>
                    </PressableSpring>
                  ) : null}
                </View>
              </View>
            ) : (
              <View style={styles.list}>
                {heroModel && heroEvent ? (
                  <ClubMatchDayHero
                    model={heroModel}
                    actions={resolveMatchHubActions(heroModel)}
                    onAction={(chapter) => openHub(heroEvent.id, chapter)}
                  />
                ) : null}

                {listModels.length > 0 ? (
                  <View style={styles.sectionHead}>
                    <ProDayText variant="section" style={styles.sectionLabel}>
                      {heroModel ? 'Autres rencontres' : 'Calendrier des rencontres'}
                    </ProDayText>
                    <ProDayText variant="caption" style={{ color: '#8E8E9F' }}>
                      {listModels.length} match(s)
                    </ProDayText>
                  </View>
                ) : null}

                {listModels.map((model, index) => (
                  <ClubMatchListRow
                    key={model.id}
                    model={model}
                    index={index}
                    onOpen={() => openHub(model.id, 'apercu')}
                    onConvocations={
                      model.presence.pending > 0
                        ? () => openHub(model.id, 'effectif')
                        : undefined
                    }
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </ClubChapterScroll>

      {/* Modal Création Manuelle de Match */}
      <Modal
        visible={manualModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setManualModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ProDayText variant="title" style={styles.modalTitle}>
                Nouveau Match
              </ProDayText>
              <PressableSpring onPress={() => setManualModalOpen(false)}>
                <Icon name="close" size={20} color="#8E8E9F" />
              </PressableSpring>
            </View>

            <View style={styles.formGroup}>
              <ProDayText variant="caption" style={styles.inputLabel}>
                Adversaire
              </ProDayText>
              <TextInput
                style={styles.modalInput}
                placeholder="Ex: FC Versailles, AS Meudon..."
                placeholderTextColor="#6B6B7F"
                value={manualOpponent}
                onChangeText={setManualOpponent}
              />
            </View>

            <View style={styles.formGroup}>
              <ProDayText variant="caption" style={styles.inputLabel}>
                Lieu / Terrain
              </ProDayText>
              <TextInput
                style={styles.modalInput}
                placeholder="Ex: Stade Municipal, Terrain Honneur..."
                placeholderTextColor="#6B6B7F"
                value={manualLocation}
                onChangeText={setManualLocation}
              />
            </View>

            <View style={styles.toggleRow}>
              <PressableSpring
                onPress={() => setManualIsHome(true)}
                style={[styles.toggleBtn, manualIsHome && styles.toggleBtnActive]}
              >
                <ProDayText
                  variant="caption"
                  style={[styles.toggleBtnText, manualIsHome && styles.toggleBtnTextActive]}
                >
                  Domicile
                </ProDayText>
              </PressableSpring>
              <PressableSpring
                onPress={() => setManualIsHome(false)}
                style={[styles.toggleBtn, !manualIsHome && styles.toggleBtnActive]}
              >
                <ProDayText
                  variant="caption"
                  style={[styles.toggleBtnText, !manualIsHome && styles.toggleBtnTextActive]}
                >
                  Extérieur
                </ProDayText>
              </PressableSpring>
            </View>

            <PressableSpring
              onPress={handleCreateManualMatch}
              disabled={manualCreating}
              scaleTo={0.96}
              haptic
              style={styles.modalSubmitBtn}
            >
              {manualCreating ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <ProDayText variant="caption" style={styles.modalSubmitText}>
                  Créer et planifier
                </ProDayText>
              )}
            </PressableSpring>
          </View>
        </View>
      </Modal>

      {/* Hub Match Détail / Feuilles / Direct */}
      <PushScreenTransition active={hubEventId != null} backgroundColor={tokens.bg}>
        {hubEventId ? (
          <MatchEventHubScreen
            eventId={hubEventId}
            initialChapter={hubChapter}
            onBack={() => {
              setHubEventId(null);
              void ws.refresh();
            }}
          />
        ) : null}
      </PushScreenTransition>
    </View>
  );
}

const createStyles = (_tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: '#09090D' },
    mainTabContent: {
      paddingBottom: 24,
    },
    aiStudioTeaser: {
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 10,
      backgroundColor: '#12121B',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: 'rgba(139, 92, 246, 0.28)',
      paddingHorizontal: 14,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      overflow: 'hidden',
    },
    aiTeaserLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    aiTeaserIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: 'rgba(139, 92, 246, 0.18)',
      borderWidth: 1,
      borderColor: 'rgba(139, 92, 246, 0.35)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    aiTeaserTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    aiTeaserTitle: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '800',
    },
    geminiBadge: {
      backgroundColor: 'rgba(139, 92, 246, 0.25)',
      borderRadius: 4,
      paddingHorizontal: 5,
      paddingVertical: 1,
    },
    geminiBadgeText: {
      color: '#C4B5FD',
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
    aiTeaserSub: {
      color: '#8E8E9F',
      fontSize: 11,
      marginTop: 1,
    },
    aiTeaserOpenBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(139, 92, 246, 0.12)',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'rgba(139, 92, 246, 0.25)',
    },
    aiTeaserOpenText: {
      color: '#A78BFA',
      fontSize: 11,
      fontWeight: '700',
    },
    closeAiCardBtn: {
      padding: 4,
    },
    topActionsRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    manualBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: '#181820',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.12)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    manualBtnText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '700',
    },
    aiStudioCard: {
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 12,
      backgroundColor: '#141418',
      borderRadius: 18,
      borderWidth: 1,
      borderColor: 'rgba(139, 92, 246, 0.3)',
      padding: 16,
      gap: 12,
      overflow: 'hidden',
    },
    aiHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    aiBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: 'rgba(139, 92, 246, 0.2)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: 'rgba(139, 92, 246, 0.4)',
    },
    aiBadgeText: {
      color: '#C4B5FD',
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 0.6,
    },
    aiHeaderSub: {
      color: '#8B8B9A',
      fontSize: 11,
    },
    promptInputWrap: {
      backgroundColor: '#181820',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
      paddingHorizontal: 12,
      paddingVertical: 10,
      position: 'relative',
    },
    promptInput: {
      color: '#FFFFFF',
      fontSize: 13,
      minHeight: 44,
      paddingRight: 24,
    },
    clearPromptBtn: {
      position: 'absolute',
      top: 10,
      right: 10,
      padding: 4,
    },
    teamSelectRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    teamSelectLabel: {
      color: '#8E8E9F',
      fontSize: 11,
      fontWeight: '700',
    },
    teamChipsList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      flex: 1,
    },
    teamChip: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: '#141418',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    teamChipSelected: {
      backgroundColor: 'rgba(139, 92, 246, 0.25)',
      borderColor: '#A78BFA',
    },
    teamChipText: {
      color: '#8E8E9F',
      fontSize: 11,
    },
    teamChipTextSelected: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    chipsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    chipTile: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: '#141418',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
      paddingHorizontal: 8,
      paddingVertical: 5,
    },
    chipTileText: {
      color: '#D1D5DB',
      fontSize: 11,
      fontWeight: '600',
    },
    generateBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      backgroundColor: '#A78BFA',
      borderRadius: 12,
      paddingVertical: 11,
    },
    generateBtnText: {
      color: '#000000',
      fontSize: 13,
      fontWeight: '800',
    },
    resultBox: {
      backgroundColor: '#141418',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: 'rgba(139, 92, 246, 0.35)',
      padding: 14,
      gap: 10,
    },
    resultHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    formationPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    formationText: {
      color: '#10B981',
      fontSize: 11,
      fontWeight: '800',
    },
    closePlanBtn: {
      padding: 4,
    },
    resultTitle: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '800',
    },
    instructionsBlock: {
      gap: 4,
    },
    instructionRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
    },
    instDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: '#A78BFA',
      marginTop: 5,
    },
    instText: {
      color: '#9CA3AF',
      fontSize: 12,
      flex: 1,
    },
    talkBlock: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      backgroundColor: 'rgba(139, 92, 246, 0.08)',
      padding: 10,
      borderRadius: 8,
    },
    talkText: {
      color: '#D1D5DB',
      fontSize: 11,
      fontStyle: 'italic',
      flex: 1,
    },
    validatePlanBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: '#10B981',
      borderRadius: 10,
      paddingVertical: 10,
    },
    validatePlanText: {
      color: '#000000',
      fontSize: 12,
      fontWeight: '800',
    },
    list: { gap: 12, paddingHorizontal: 16, paddingTop: 12 },
    sectionHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    sectionLabel: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '800',
    },
    filterBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      marginTop: 6,
      marginBottom: 6,
      gap: 8,
    },
    filterChipsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flex: 1,
    },
    filterChip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: '#141418',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    filterChipActive: {
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
      borderColor: '#FFFFFF',
    },
    filterChipText: {
      color: '#8E8E9F',
      fontSize: 11,
      fontWeight: '600',
    },
    filterChipTextActive: {
      color: '#FFFFFF',
      fontWeight: '800',
    },
    addMatchBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: '#181820',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: 8,
    },
    addMatchBtnText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '700',
    },
    invitesWrap: {
      paddingHorizontal: 16,
      paddingTop: 12,
      gap: 12,
    },
    sectionCard: {
      backgroundColor: '#141418',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
      padding: 14,
      gap: 8,
    },
    sectionCardTitle: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '800',
    },
    emptyCard: {
      marginHorizontal: 16,
      marginTop: 16,
      backgroundColor: '#141418',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
      padding: 24,
      alignItems: 'center',
      gap: 10,
    },
    emptyIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyTitle: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '800',
    },
    emptySub: {
      color: '#8E8E9F',
      fontSize: 12,
      textAlign: 'center',
      lineHeight: 16,
    },
    emptyActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 6,
    },
    emptyActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 10,
    },
    emptyActionText: {
      color: '#000000',
      fontSize: 12,
      fontWeight: '800',
    },
    emptyAiBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(139, 92, 246, 0.15)',
      borderWidth: 1,
      borderColor: 'rgba(139, 92, 246, 0.3)',
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 10,
    },
    emptyAiBtnText: {
      color: '#C4B5FD',
      fontSize: 12,
      fontWeight: '800',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: '#141418',
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      padding: 20,
      gap: 14,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    modalTitle: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '800',
    },
    formGroup: {
      gap: 6,
    },
    inputLabel: {
      color: '#8E8E9F',
      fontSize: 12,
      fontWeight: '700',
    },
    modalInput: {
      backgroundColor: '#181820',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: '#FFFFFF',
      fontSize: 14,
    },
    toggleRow: {
      flexDirection: 'row',
      gap: 10,
    },
    toggleBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
      backgroundColor: '#141418',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    toggleBtnActive: {
      backgroundColor: 'rgba(16, 185, 129, 0.2)',
      borderColor: '#10B981',
    },
    toggleBtnText: {
      color: '#8E8E9F',
      fontSize: 12,
      fontWeight: '700',
    },
    toggleBtnTextActive: {
      color: '#10B981',
    },
    modalSubmitBtn: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
      marginTop: 6,
    },
    modalSubmitText: {
      color: '#000000',
      fontSize: 13,
      fontWeight: '800',
    },
  });
