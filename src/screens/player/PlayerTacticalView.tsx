import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { teamEventsService } from '../../services/teamEvents.service';
import { matchTalkService } from '../../services/matchTalk.service';
import { pickLineupTargetEvent } from '../../utils/tacticalBoardSync';
import type { MatchTalkBrief } from '../../models/MatchTalkBrief';
import type { TeamEvent } from '../../models/TeamEvent';
import { PitchLineupView } from '../../components/team/PitchLineupView';
import { PlayerPageGuideModal, type GuideSection } from '../../components/player/PlayerPageGuideModal';
import { PlayerPageGuideBanner } from '../../components/player/PlayerPageGuideBanner';
import {
  playerColors,
  playerType,
  playerForm,
  playerCard,
  PLAYER_SURFACE_TOKENS,
} from '../../theme/playerDesignSystem';
import { CLUB_TOKENS } from '../../features/club/theme/clubTokens';

/**
 * Vestiaire Tactique — refonte Player §2/§7.
 *
 * La composition affichée est celle **publiée par le staff** (`TeamEvent.lineup`,
 * même enregistrement partagé que le Coach et le Club/Admin) et les consignes
 * viennent du brief réel du coach (`matchTalkService`). Aucun onze fictif et
 * aucune diffusion « en direct » inventée : sans donnée publiée, l'écran le dit.
 */

function formatWhen(date: Date): string {
  const day = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return `${day} · ${time}`;
}

export const PlayerTacticalView: React.FC = () => {
  const profile = useSessionProfile();
  const userId = profile?.uid || 'player-demo';

  const [showGuideModal, setShowGuideModal] = useState(false);
  const [event, setEvent] = useState<TeamEvent | null>(null);
  const [brief, setBrief] = useState<MatchTalkBrief | null>(null);

  useEffect(() => {
    if (!profile?.uid) return;
    let alive = true;
    teamEventsService
      .listForUser(profile.uid, profile.profile.club_id || undefined)
      .then((rows) => {
        if (!alive) return;
        const target = pickLineupTargetEvent(rows);
        setEvent(target);
        if (!target) return;
        return matchTalkService.getForEvent(target.id).then((talk) => {
          if (alive) setBrief(talk);
        });
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [userId]);

  const lineup = event?.lineup;
  const starters = (lineup?.slots ?? []).filter((slot) => slot.role === 'starter');
  const subs = (lineup?.slots ?? []).filter((slot) => slot.role === 'sub');
  const personalMessage = brief?.messages_by_uid?.[userId];

  const guideSections: GuideSection[] = [
    {
      icon: 'football',
      iconColor: playerColors.accent,
      title: 'Composition publiée par le staff',
      description: 'Le terrain affiche la composition officielle publiée par le coach pour le prochain rendez-vous. Ton poste et les titulaires sont ceux de la vraie feuille de match — rien n\'est simulé.',
      badge: 'OFFICIEL',
    },
    {
      icon: 'clipboard',
      iconColor: CLUB_TOKENS.secondary,
      title: 'Consignes & causerie du coach',
      description: 'Les consignes collectives, les notes sur l\'adversaire et le message qui t\'est adressé proviennent du brief réel du coach, publié pour ce rendez-vous.',
      badge: 'STAFF',
    },
    {
      icon: 'shield-checkmark',
      iconColor: playerColors.accentAlt,
      title: 'Même feuille que le Coach',
      description: 'La composition et les consignes sont partagées avec le pôle Coach et le Club : ce que tu vois ici est exactement ce que le staff a publié.',
      badge: 'SYNCHRO',
    },
    {
      icon: 'flag',
      iconColor: CLUB_TOKENS.warning,
      title: 'Coups de pied arrêtés',
      description: 'Les tireurs et les rôles défensifs apparaîtront ici dès que le staff les aura publiés — aucune attribution n\'est inventée en attendant.',
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* En-tête */}
      <View style={styles.topHeader}>
        <View style={styles.headerTextCol}>
          <Text style={styles.screenSubtitle}>Locker Room & Dispositif</Text>
          <Text style={styles.screenTitle} numberOfLines={2}>
            Vestiaire Tactique
          </Text>
        </View>

        <TouchableOpacity
          style={styles.guideIconBtn}
          onPress={() => {
            prodayHaptics.selection();
            setShowGuideModal(true);
          }}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Guide de la page"
        >
          <Ionicons name="help-circle-outline" size={16} color={playerColors.accent} />
          <Text style={styles.guideBtnText}>Guide</Text>
        </TouchableOpacity>
      </View>

      <PlayerPageGuideBanner
        pageKey="tactics"
        title="Guide Vestiaire & Dispositif Tactique"
        subtitle="Repère ton poste sur le terrain et suis les consignes du coach"
        onOpenGuide={() => setShowGuideModal(true)}
      />

      {/* Composition publiée par le staff */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>Composition du staff</Text>
        <Text style={styles.sectionSub}>
          {event ? `${event.title || 'Match'} · ${formatWhen(event.starts_at)}` : 'Prochain rendez-vous'}
        </Text>

        {starters.length > 0 && lineup ? (
          <View style={styles.pitchCard}>
            <PitchLineupView formation={lineup.formation} starters={starters} />
          </View>
        ) : (
          <View style={[styles.emptyCard, playerCard(PLAYER_SURFACE_TOKENS)]}>
            <Ionicons name="football-outline" size={22} color={playerColors.textDim} />
            <View style={styles.emptyTextCol}>
              <Text style={styles.emptyTitle}>Composition non publiée</Text>
              <Text style={styles.emptySub}>
                Le staff publiera la composition avant le coup d'envoi.
              </Text>
            </View>
          </View>
        )}

        {subs.length > 0 ? (
          <Text style={styles.benchLine} numberOfLines={3}>
            Remplaçants : {subs.map((slot) => slot.display_name).join(' · ')}
          </Text>
        ) : null}
      </View>

      {/* Consignes & causerie — brief réel du coach */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>Consignes du coach</Text>
        <Text style={styles.sectionSub}>Brief publié par le staff</Text>

        {brief ? (
          <View style={[styles.talkCard, playerCard(PLAYER_SURFACE_TOKENS)]}>
            <Text style={styles.talkTitle} numberOfLines={2}>
              {brief.title}
            </Text>

            {brief.match_objective ? (
              <Text style={styles.talkObjective}>{brief.match_objective}</Text>
            ) : null}

            {brief.key_points.map((point, idx) => (
              <View key={idx} style={styles.talkPointRow}>
                <Ionicons name="ellipse" size={6} color={playerColors.accent} />
                <Text style={styles.talkPoint}>{point}</Text>
              </View>
            ))}

            {personalMessage ? (
              <View style={styles.personalMessage}>
                <Ionicons name="chatbubble-ellipses" size={14} color={playerColors.accent} />
                <Text style={styles.personalMessageText}>{personalMessage}</Text>
              </View>
            ) : null}

            {brief.opponent_notes ? (
              <Text style={styles.talkNote}>Adversaire : {brief.opponent_notes}</Text>
            ) : null}
          </View>
        ) : (
          <Text style={styles.honestNote}>
            Aucune causerie publiée pour le moment — les consignes collectives et le message
            qui t'est adressé par le coach apparaîtront ici avant le match.
          </Text>
        )}
      </View>

      {/* Coups de pied arrêtés — aucune source réelle : état honnête */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>Coups de pied arrêtés</Text>
        <Text style={styles.honestNote}>
          Les tireurs et les rôles défensifs seront affichés dès que le staff les publiera —
          aucune attribution n'est inventée ici.
        </Text>
      </View>

      <PlayerPageGuideModal
        visible={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        pageTitle="Vestiaire & Dispositif Tactique"
        pageSubtitle="Composition publiée, terrain et consignes du staff"
        badgeLabel="GUIDE TACTIQUE & LOCKER"
        badgeColor={playerColors.accent}
        introText="Cet écran te donne la feuille de match publiée par le staff : le terrain avec la composition officielle, les consignes du coach et le message qui t'est adressé."
        sections={guideSections}
        proTip="La composition et les consignes proviennent directement du staff : ouvre cet écran après chaque publication pour ne rien manquer avant le coup d'envoi."
        ctaLabel="Prêt pour le match !"
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: playerColors.bg,
  },
  content: {
    padding: playerForm.space.lg,
    paddingBottom: playerForm.space.xxl,
  },

  /* En-tête */
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    /** 320 pt : le titre garde sa largeur, le bouton Guide passe dessous si besoin. */
    flexWrap: 'wrap',
    gap: playerForm.space.sm,
    marginBottom: playerForm.space.lg,
  },
  headerTextCol: {
    flex: 1,
    minWidth: 168,
  },
  screenSubtitle: {
    ...playerType.caption,
    color: playerColors.textMuted,
  },
  screenTitle: {
    ...playerType.title,
    color: playerColors.text,
  },
  guideIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: playerForm.chipHeight - 12,
    backgroundColor: playerColors.accentSoft,
    borderWidth: 1,
    borderColor: playerColors.border,
    paddingHorizontal: 9,
    borderRadius: playerForm.chipRadius,
  },
  guideBtnText: {
    ...playerType.micro,
    fontWeight: '800',
    color: playerColors.accent,
  },

  /* Sections */
  sectionBlock: {
    marginBottom: playerForm.space.xl,
  },
  sectionTitle: {
    ...playerType.section,
    color: playerColors.text,
  },
  sectionSub: {
    ...playerType.caption,
    color: playerColors.textDim,
    marginTop: 2,
    marginBottom: playerForm.space.md,
  },

  /* Terrain */
  pitchCard: {
    marginTop: playerForm.space.sm,
  },
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: playerForm.space.md,
    padding: playerForm.space.lg,
  },
  emptyTextCol: {
    flex: 1,
  },
  emptyTitle: {
    ...playerType.headline,
    color: playerColors.text,
  },
  emptySub: {
    ...playerType.caption,
    color: playerColors.textMuted,
    marginTop: 2,
  },
  benchLine: {
    ...playerType.caption,
    color: playerColors.textMuted,
    marginTop: playerForm.space.md,
  },

  /* Causerie */
  talkCard: {
    padding: playerForm.space.lg,
  },
  talkTitle: {
    ...playerType.headline,
    color: playerColors.text,
  },
  talkObjective: {
    ...playerType.callout,
    color: playerColors.accent,
    marginTop: playerForm.space.sm,
  },
  talkPointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: playerForm.space.sm,
    marginTop: playerForm.space.sm,
  },
  talkPoint: {
    ...playerType.caption,
    color: playerColors.textMuted,
    flex: 1,
  },
  personalMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: playerForm.space.sm,
    marginTop: playerForm.space.md,
    padding: playerForm.space.md,
    borderRadius: playerForm.fieldRadius,
    backgroundColor: playerColors.accentSoft,
  },
  personalMessageText: {
    ...playerType.caption,
    color: playerColors.text,
    flex: 1,
  },
  talkNote: {
    ...playerType.caption,
    color: playerColors.textDim,
    marginTop: playerForm.space.md,
  },
  honestNote: {
    ...playerType.caption,
    color: playerColors.textMuted,
    lineHeight: 18,
  },
});
