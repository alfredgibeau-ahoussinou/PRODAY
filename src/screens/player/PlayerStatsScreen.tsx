import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { teamEventsService } from '../../services/teamEvents.service';
import { isCoachMatchEvent } from '../../models/TeamEvent';
import {
  formatCoachRating,
  formatEvaluationSourceLabel,
} from '../../utils/coachEvaluationRatings';
import { formatCalendarDate } from '../../utils/seasonCalendar';
import {
  playerPassportService,
  type PlayerPassportData,
} from '../../services/playerPassport.service';
import { PlayerCertifiedPassportModal } from '../../components/player/PlayerCertifiedPassportModal';
import { PlayerPageGuideModal, type GuideSection } from '../../components/player/PlayerPageGuideModal';
import { PlayerPageGuideBanner } from '../../components/player/PlayerPageGuideBanner';
import {
  playerColors,
  playerType,
  playerForm,
  playerCard,
  playerHeroCard,
  PLAYER_SURFACE_TOKENS,
} from '../../theme/playerDesignSystem';
import { CLUB_TOKENS } from '../../features/club/theme/clubTokens';

/**
 * Ma Carte — Performance & CV (refonte Player §5).
 *
 * Sections lisibles : KPI de saison · passeport certifié · notations du staff ·
 * données physiques. Toutes les valeurs affichées sont **réelles et autorisées**
 * (profil + feuilles de match saisies par le staff) ; une donnée absente reste
 * « — » et une section vide le dit honnêtement (DATA-01). Forme « Fitness
 * Park » : cartes groupées plates, typographie Apple system, 0 couleur littérale.
 */
export const PlayerStatsScreen: React.FC = () => {
  const profile = useSessionProfile();
  const [showPassport, setShowPassport] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  const guideSections: GuideSection[] = [
    {
      icon: 'star',
      iconColor: CLUB_TOKENS.secondary,
      title: 'Calcul des notes du staff (/10)',
      description: 'Après chaque match, le coach et ses adjoints évaluent ton impact selon des critères précis (implication tactique, justesse technique, volume). La note moyenne alimente ton passeport officiel.',
      badge: 'OFFICIEL',
    },
    {
      icon: 'shield-checkmark',
      iconColor: playerColors.accent,
      title: 'Passeport numérique certifié',
      description: 'Ton passeport regroupe ton numéro de licence officiel, ton club d\'affiliation, tes minutes disputées et la signature de ton entraîneur pour attester de la véracité de ton CV.',
      badge: 'SCELLÉ',
    },
    {
      icon: 'qr-code',
      iconColor: playerColors.accentAlt,
      title: 'Partage QR Code aux recruteurs',
      description: 'Présente ou partage ton QR Code sécurisé lors des détections, stages ou essais. Les recruteurs scannent le code pour consulter ta fiche de joueur certifiée.',
      badge: 'SCOUTING',
    },
    {
      icon: 'speedometer',
      iconColor: playerColors.accent,
      title: 'Données physiques & GPS',
      description: 'Suis tes performances athlétiques clés dès que les mesures de tes séances seront connectées — aucun indicateur n\'est inventé.',
    },
  ];

  /** Passeport dérivé du profil réel — aucun numéro de licence, club ou coach
   * inventé. Les champs non fournis restent « — ». */
  const passportData: PlayerPassportData = playerPassportService.buildPassport({
    playerId: profile?.uid || 'player-demo',
    fullName: profile?.display_name || 'Joueur',
    licenseNumber: '—',
    clubName: profile?.profile?.club_id || '—',
    clubAffiliation: '—',
    category: '—',
    position: profile?.profile?.position || '—',
    ovr: 0,
    matchesPlayed: 0,
    goals: 0,
    assists: 0,
    averageRating: 0,
    coachName: '—',
  });

  /** Derniers matchs réels : scores et notes saisis par le staff uniquement (visibles si publiés). */
  const [matchHistory, setMatchHistory] = useState<{
    id: string;
    opponent: string;
    score: string;
    date: string;
    rating: number | null | undefined;
    goals: number;
    assists: number;
    minutes?: number;
    source?: string;
    explanation?: string;
  }[]>([]);

  useEffect(() => {
    if (!profile?.uid) return;
    void teamEventsService
      .listForUser(profile.uid, profile.profile?.club_id)
      .then((rows) => {
        const matches = rows.filter((e) => isCoachMatchEvent(e));
        const history: typeof matchHistory = [];
        matches.forEach((m) => {
          const stat = m.player_match_stats?.[profile.uid];
          // RÈGLE DE VISIBILITÉ : Ne montrer QUE les évaluations publiées, masquer les brouillons staff !
          if (!stat || stat.status === 'draft') return;
          const opp = m.live_state?.opponent_name || m.title || 'Adversaire';
          const score = `${m.live_state?.home_score ?? 0} - ${m.live_state?.away_score ?? 0}`;
          history.push({
            id: m.id,
            opponent: opp,
            score,
            date: formatCalendarDate(m.starts_at),
            rating: stat.rating,
            goals: stat.goals ?? 0,
            assists: stat.assists ?? 0,
            minutes: stat.minutes_played,
            source: stat.source,
            explanation: stat.rating_explanation,
          });
        });
        setMatchHistory(history);
      })
      .catch(() => {});
  }, [profile?.uid, profile?.profile?.club_id]);

  const verifiedGoals = useMemo(
    () => (matchHistory.length > 0 ? matchHistory.reduce((acc, m) => acc + m.goals, 0) : passportData.goals),
    [matchHistory, passportData.goals],
  );
  const verifiedAssists = useMemo(
    () => (matchHistory.length > 0 ? matchHistory.reduce((acc, m) => acc + m.assists, 0) : passportData.assists),
    [matchHistory, passportData.assists],
  );
  const verifiedAvgRating = useMemo(() => {
    const rated = matchHistory.filter((m) => m.rating !== undefined && m.rating !== null);
    if (rated.length === 0) return passportData.averageRating > 0 ? passportData.averageRating : null;
    return rated.reduce((acc, m) => acc + (m.rating ?? 0), 0) / rated.length;
  }, [matchHistory, passportData.averageRating]);
  const verifiedMinutes = useMemo(
    () => matchHistory.reduce((acc, m) => acc + (m.minutes ?? 0), 0),
    [matchHistory],
  );

  /** Période affichée — saison en cours, libellé véridique. */
  const seasonLabel = 'Saison 2026/2027';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* En-tête + passeport */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.screenSubtitle}>{seasonLabel}</Text>
          <Text style={styles.screenTitle} numberOfLines={1}>Performance & CV</Text>
        </View>

        <View style={styles.topHeaderRight}>
          <TouchableOpacity
            style={styles.guideIconBtn}
            onPress={() => {
              prodayHaptics.selection();
              setShowGuideModal(true);
            }}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Guide de la page"
            accessibilityRole="button"
          >
            <Ionicons name="help-circle-outline" size={16} color={playerColors.accent} />
            <Text style={styles.guideBtnText}>Guide</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.passportBadgeBtn}
            onPress={() => {
              prodayHaptics.impactMedium();
              setShowPassport(true);
            }}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="shield-check" size={16} color={playerColors.accent} />
            <Text style={styles.passportBadgeText}>Passeport</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Guide d'onboarding masquable */}
      <PlayerPageGuideBanner
        pageKey="stats"
        title="Guide Performance & Passeport CV"
        subtitle="Découvre comment tes notes sont calculées et partage ton QR Code"
        onOpenGuide={() => setShowGuideModal(true)}
      />

      {/* KPI de saison — valeurs réelles, « — » quand la donnée manque */}
      <View style={styles.kpiGrid}>
        <View style={[styles.kpiCard, playerCard(PLAYER_SURFACE_TOKENS)]}>
          <View style={styles.kpiIconBox}>
            <Ionicons name="football" size={16} color={playerColors.accent} />
          </View>
          <Text style={styles.kpiVal}>{verifiedGoals > 0 ? verifiedGoals : '—'}</Text>
          <Text style={styles.kpiLbl}>BUTS</Text>
        </View>

        <View style={[styles.kpiCard, playerCard(PLAYER_SURFACE_TOKENS)]}>
          <View style={styles.kpiIconBox}>
            <Ionicons name="git-pull-request" size={16} color={playerColors.accentAlt} />
          </View>
          <Text style={styles.kpiVal}>{verifiedAssists > 0 ? verifiedAssists : '—'}</Text>
          <Text style={styles.kpiLbl}>PASSES DÉC.</Text>
        </View>

        <View style={[styles.kpiCard, playerCard(PLAYER_SURFACE_TOKENS)]}>
          <View style={styles.kpiIconBox}>
            <Ionicons name="star" size={16} color={CLUB_TOKENS.secondary} />
          </View>
          <Text style={styles.kpiVal}>
            {verifiedAvgRating !== null ? formatCoachRating(verifiedAvgRating) : '—'}
          </Text>
          <Text style={styles.kpiLbl}>NOTE STAFF /10</Text>
        </View>

        <View style={[styles.kpiCard, playerCard(PLAYER_SURFACE_TOKENS)]}>
          <View style={styles.kpiIconBox}>
            <Ionicons name="time" size={16} color={playerColors.accent} />
          </View>
          <Text style={styles.kpiVal}>{verifiedMinutes > 0 ? `${verifiedMinutes}'` : '—'}</Text>
          <Text style={styles.kpiLbl}>TEMPS DE JEU</Text>
        </View>
      </View>

      {/* Passeport certifié — hero CTA */}
      <TouchableOpacity
        style={[styles.passportHeroCard, playerHeroCard(PLAYER_SURFACE_TOKENS)]}
        onPress={() => {
          prodayHaptics.impactMedium();
          setShowPassport(true);
        }}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel="Scanner un QR code">
        <View style={styles.passportHeroInner}>
          <View style={styles.passportHeroLeft}>
            <View style={styles.passportHeroIcon}>
              <MaterialCommunityIcons name="qrcode-scan" size={24} color={playerColors.accent} />
            </View>
            <View style={styles.passportHeroText}>
              <Text style={styles.passportHeroTitle} numberOfLines={1}>
                Passeport Athlétique Certifié
              </Text>
              <Text style={styles.passportHeroSub}>
                Générer mon QR Code sécurisé pour les recruteurs
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={playerColors.textMuted} />
        </View>
      </TouchableOpacity>

      {/* Notations du staff — feuilles de match officielles */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionHeaderTitle}>Dernières notations du staff</Text>
        <Text style={styles.sectionHeaderSub}>Feuilles de match officielles</Text>

        <View style={[styles.matchList, playerCard(PLAYER_SURFACE_TOKENS)]}>
          {matchHistory.length === 0 ? (
            <Text style={styles.honestNote}>
              Aucune feuille de match saisie pour l'instant. Tes notations du staff
              apparaîtront ici dès leur enregistrement.
            </Text>
          ) : matchHistory.map((m, idx) => (
            <View key={m.id || idx} style={styles.matchRow}>
              <View style={styles.matchDateBadge}>
                <Text style={styles.matchDateText}>{m.date}</Text>
              </View>

              <View style={styles.matchInfoCol}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.matchOpponentText} numberOfLines={1}>{m.opponent}</Text>
                  {m.source ? (
                    <View style={{
                      paddingHorizontal: 5,
                      paddingVertical: 1,
                      borderRadius: 4,
                      backgroundColor: playerColors.accentSoft,
                    }}>
                      <Text style={{
                        fontSize: 9,
                        fontWeight: '700',
                        color: m.source === 'coach_reviewed' ? playerColors.accent : playerColors.accentAlt,
                      }}>
                        {formatEvaluationSourceLabel(m.source as any)}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.matchScoreText} numberOfLines={1}>
                  {m.score} · {m.goals}B · {m.assists}P{m.minutes != null ? ` · ${m.minutes}'` : ''}
                </Text>
                {m.explanation ? (
                  <Text style={{ fontSize: 11, color: playerColors.textMuted, fontStyle: 'italic', marginTop: 2 }} numberOfLines={2}>
                    « {m.explanation} »
                  </Text>
                ) : null}
              </View>

              <View style={styles.ratingBadgeBox}>
                <Text style={styles.ratingBadgeVal}>
                  {m.rating !== undefined && m.rating !== null ? (m.rating === 0 ? '0.0' : m.rating.toFixed(1)) : '—'}
                </Text>
                <Text style={styles.ratingBadgeMax}>/10</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Données physiques & GPS — honnêteté */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionHeaderTitle}>Données physiques & GPS</Text>
        <Text style={styles.sectionHeaderSub}>Mesures d'entraînement et de match</Text>

        <Text style={styles.honestNote}>
          Les mesures physiques et GPS réelles seront connectées aux données de tes
          séances — aucun indicateur n'est inventé sur cet écran.
        </Text>
      </View>

      {/* Passeport certifié */}
      <PlayerCertifiedPassportModal
        visible={showPassport}
        passport={passportData}
        onClose={() => setShowPassport(false)}
      />

      {/* Guide interactif */}
      <PlayerPageGuideModal
        visible={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        pageTitle="Performance & CV Numérique"
        pageSubtitle="Suivi athlétique officiel et dossier de recrutement"
        badgeLabel="GUIDE PERFORMANCE & CV"
        badgeColor={playerColors.accent}
        introText="Cet écran regroupe tes statistiques individuelles officielles, les notations attribuées par le staff et ton passeport certifié avec QR Code pour les recruteurs."
        sections={guideSections}
        proTip="Un dossier complet avec plusieurs notations du staff et un QR Code actif augmente tes chances d'être repéré lors des détections."
        ctaLabel="J'ai compris !"
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
    marginBottom: playerForm.space.lg,
    gap: playerForm.space.sm,
  },
  topHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: playerForm.space.sm,
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
  screenSubtitle: {
    ...playerType.caption,
    color: playerColors.textMuted,
  },
  screenTitle: {
    ...playerType.title,
    color: playerColors.text,
  },
  passportBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: playerForm.chipHeight - 12,
    backgroundColor: playerColors.accentSoft,
    borderWidth: 1,
    borderColor: playerColors.border,
    paddingHorizontal: 10,
    borderRadius: playerForm.chipRadius,
  },
  passportBadgeText: {
    ...playerType.micro,
    fontWeight: '800',
    color: playerColors.accent,
  },

  /* KPI 2 colonnes */
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: playerForm.kpiGap,
    marginBottom: playerForm.space.lg,
  },
  kpiCard: {
    width: '48%',
    minHeight: playerForm.kpiMinHeight,
    padding: playerForm.cardPaddingH,
  },
  kpiIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: playerForm.space.sm,
    backgroundColor: playerColors.surfaceRaised,
    borderWidth: 1,
    borderColor: playerColors.border,
  },
  kpiVal: {
    ...playerType.stat,
    color: playerColors.text,
  },
  kpiLbl: {
    ...playerType.micro,
    fontWeight: '800',
    color: playerColors.textDim,
    marginTop: 2,
    letterSpacing: 0.5,
  },

  /* Hero passeport */
  passportHeroCard: {
    marginBottom: playerForm.space.xl,
  },
  passportHeroInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: playerForm.cardPaddingH,
    minHeight: playerForm.rowMinHeight,
  },
  passportHeroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    minWidth: 0,
  },
  passportHeroIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: playerColors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passportHeroText: {
    flex: 1,
    minWidth: 0,
  },
  passportHeroTitle: {
    ...playerType.headline,
    color: playerColors.text,
  },
  passportHeroSub: {
    ...playerType.caption,
    color: playerColors.textMuted,
    marginTop: 2,
  },

  /* Sections */
  sectionBlock: {
    marginBottom: playerForm.space.xl,
  },
  sectionHeaderTitle: {
    ...playerType.section,
    color: playerColors.text,
  },
  sectionHeaderSub: {
    ...playerType.caption,
    color: playerColors.textDim,
    marginTop: 1,
    marginBottom: playerForm.space.md,
  },
  matchList: {
    overflow: 'hidden',
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: playerForm.rowMinHeight - 14,
    borderBottomWidth: playerForm.separatorThickness,
    borderBottomColor: playerColors.border,
  },
  matchDateBadge: {
    backgroundColor: playerColors.surfaceRaised,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: playerForm.space.md,
    borderWidth: 1,
    borderColor: playerColors.border,
  },
  matchDateText: {
    ...playerType.micro,
    fontWeight: '800',
    color: playerColors.textMuted,
  },
  matchInfoCol: {
    flex: 1,
    minWidth: 0,
  },
  matchOpponentText: {
    ...playerType.headline,
    color: playerColors.text,
  },
  matchScoreText: {
    ...playerType.caption,
    color: playerColors.textDim,
    marginTop: 2,
  },
  ratingBadgeBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: playerColors.surfaceRaised,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: playerColors.border,
  },
  ratingBadgeVal: {
    ...playerType.callout,
    fontWeight: '900',
    color: CLUB_TOKENS.secondary,
  },
  ratingBadgeMax: {
    ...playerType.micro,
    color: playerColors.textDim,
    marginLeft: 2,
  },
  honestNote: {
    ...playerType.caption,
    color: playerColors.textMuted,
    lineHeight: 18,
    fontStyle: 'italic',
    marginTop: playerForm.space.sm,
    padding: playerForm.cardPaddingH,
  },
});
