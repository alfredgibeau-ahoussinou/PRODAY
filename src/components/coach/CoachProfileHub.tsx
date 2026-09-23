import React, { useEffect, useMemo, useState } from 'react';
import { PRO_DATA_VIOLET, proSemantic } from '../../theme/professionalDesign';
import { withAlpha } from '../../utils/coachTeamTheme';
import { COACH_SITE } from '../../content/coachPageIdentity';

const tokens = COACH_SITE;
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { User } from '../../models/User';
import type { TeamEvent } from '../../models/TeamEvent';
import { ELITE_COLORS } from '../../theme/prodayEliteTheme';
import { useCoachShellNav } from '../../features/coach/shell/CoachShellNavContext';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { buildCoachCvHtmlFromUser } from '../../utils/pdfGenerator';
import { openPlayerCvHtml } from '../../utils/openCvHtml';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { useAccountDeletion } from '../../hooks/useAccountDeletion';
import { buildCoachProfileStats, type CoachProfileStats } from '../../utils/coachProfileStats';
import { buildCoachAiNowActions } from '../../utils/coachAiInsights';
import { teamEventsService } from '../../services/teamEvents.service';
import { usersService } from '../../services/users.service';
import { useCoachTheme } from '../../features/coach/shell/CoachThemeContext';

interface CoachProfileHubProps {
  profile: User;
  subscriptionTier?: 'free' | 'pro';
  onBack?: () => void;
  onEdit?: () => void;
  onPublicProfile?: () => void;
  onAvatarPress?: () => void;
  onSubscriptionPress?: () => void;
  /** Aperçu actions assistant IA */
  aiActionPreview?: { title: string; detail: string }[];
  selfLoadClubData?: boolean;
  coachStats?: CoachProfileStats;
  clubName?: string;
  teamName?: string;
}

type TabKey = 'fiche' | 'stats' | 'parcours';

function splitDisplayName(name: string): { first: string; last: string } {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return { first: parts[0] ?? 'Coach', last: '' };
  return { first: parts[0]!, last: parts.slice(1).join(' ') };
}

export const CoachProfileHub: React.FC<CoachProfileHubProps> = ({
  profile,
  subscriptionTier = 'free',
  onBack,
  onEdit,
  onPublicProfile,
  onAvatarPress,
  onSubscriptionPress,
  aiActionPreview,
  selfLoadClubData = true,
  coachStats: coachStatsProp,
  clubName,
  teamName,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('fiche');
  const shellNav = useCoachShellNav();
  const nav = useTabNavigationActions();
  const { teamName: themeTeamName } = useCoachTheme();
  const { confirmDeleteAccount, deleting: deletingAccount } = useAccountDeletion();

  const p = profile.profile;
  const verified = profile.is_verified && profile.verification_status === 'VERIFIED';
  const title = p.job_title?.trim() || 'Entraîneur principal';
  const diploma = p.diploma?.trim() || 'Diplôme à renseigner';
  const specialties = p.specialties ?? ['Animation tactique', 'Jeu de transition', 'Management'];
  const experiences = p.experiences ?? [];
  const diplomasList =
    p.diplomas_list ??
    (p.diploma
      ? [{ id: '1', name: p.diploma, institution: 'FFF / Fédéral', verified }]
      : []);
  const initial = (profile.display_name?.trim()?.charAt(0) || 'C').toUpperCase();
  const { first, last } = splitDisplayName(profile.display_name ?? 'Coach');
  const category = p.category?.trim() || 'Senior';
  const clubLabel = clubName?.trim() || (profile.profile.club_id ? 'Club rattaché' : 'Non rattaché');
  const teamLabel = teamName?.trim() || themeTeamName?.trim() || 'Équipe 1ère';

  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [members, setMembers] = useState<User[]>([]);

  useEffect(() => {
    if (!selfLoadClubData || !profile.profile.club_id) return;
    const clubId = profile.profile.club_id;
    void Promise.all([
      teamEventsService.listForClub(clubId).catch(() => [] as TeamEvent[]),
      usersService.listMembersByClubId(clubId).catch(() => [] as User[]),
    ]).then(([ev, mem]) => {
      setEvents(ev);
      setMembers(mem);
    });
  }, [selfLoadClubData, profile.profile.club_id, profile.uid]);

  const coachStats = useMemo(
    () =>
      coachStatsProp ??
      buildCoachProfileStats(events, members, profile.uid),
    [coachStatsProp, events, members, profile.uid],
  );

  const nextEvent = useMemo(() => {
    if (!events || events.length === 0) return null;
    const now = new Date();
    return (
      events
        .filter((e) => new Date(e.starts_at) >= now)
        .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())[0] ?? null
    );
  }, [events]);

  const resolvedAiPreview = useMemo(() => {
    if (aiActionPreview && aiActionPreview.length > 0) return aiActionPreview;
    return buildCoachAiNowActions({
      events,
      members,
      hasClub: Boolean(profile.profile.club_id),
    })
      .slice(0, 3)
      .map((a) => ({ title: a.title, detail: a.detail }));
  }, [aiActionPreview, events, members, profile.profile.club_id]);

  const eventLocation = nextEvent?.location_label || nextEvent?.city;

  const handleOpenGps = () => {
    if (!eventLocation) return;
    prodayHaptics.press();
    const query = encodeURIComponent(eventLocation);
    const url = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://www.google.com/maps/search/?api=1&query=${query}`,
    });
    if (url) Linking.openURL(url);
  };

  const handleExportCv = () => {
    prodayHaptics.confirm();
    const html = buildCoachCvHtmlFromUser(profile);
    openPlayerCvHtml(html, profile.display_name);
  };

  const openNav = (
    id:
      | 'today'
      | 'entrainements'
      | 'match_center'
      | 'equipe'
      | 'joueurs'
      | 'smart_tactics'
      | 'forme'
      | 'coach_ia'
      | 'gestion'
      | 'messages',
  ) => {
    prodayHaptics.press();
    if (shellNav) shellNav.requestNav(id);
    else if (id === 'match_center') nav.openMatchs();
    else if (id === 'smart_tactics' || id === 'forme') nav.openDashboard('smart_tactics');
    else if (id === 'messages') nav.setActiveTab('messages');
    else nav.setActiveTab('home');
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: TAB_BAR_CONTENT_INSET + 60 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. EN-TÊTE DU PROFIL COACH */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => {
                prodayHaptics.press();
                if (onBack) {
                  onBack();
                } else if (shellNav?.canGoBack) {
                  shellNav.goBack();
                } else {
                  shellNav?.requestNav('today');
                }
              }}
              style={styles.backBtn}
              accessibilityRole="button"
              accessibilityLabel="Retour"
            >
              <Ionicons name="arrow-back" size={22} color={tokens.foreground} />
            </TouchableOpacity>
            <View>
              <Text style={styles.coachName}>
                {first}
                {last ? ` ${last}` : ''}
              </Text>
              <Text style={styles.coachMeta}>
                {title} · {category}
              </Text>
            </View>
          </View>

          {/* BOUTON CONSEILLER IA */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => openNav('coach_ia')}
            style={styles.aiAdvisorBtn}
            accessibilityLabel="Ouvrir Conseiller IA"
          >
            <Ionicons name="sparkles" size={14} color={ELITE_COLORS.primary} />
            <Text style={styles.aiAdvisorBtnText}>Conseiller IA</Text>
          </TouchableOpacity>
        </View>

        {/* 2. BLOC D'URGENCE : PROCHAIN MATCH & ACTIONS STAFF */}
        {nextEvent ? (
          <View style={[styles.card, styles.urgentMatchCard]}>
            <View style={styles.matchHeader}>
              <View style={styles.badgeSuccess}>
                <Text style={styles.badgeSuccessText}>
                  {nextEvent.event_type === 'competition' || nextEvent.event_type === 'friendly'
                    ? 'PROCHAIN MATCH'
                    : 'PROCHAINE SÉANCE'}
                </Text>
              </View>
              <Text style={styles.matchDate}>
                {new Date(nextEvent.starts_at).toLocaleDateString('fr-FR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>

            <Text style={styles.matchTitle}>{nextEvent.title}</Text>

            {eventLocation ? (
              <TouchableOpacity
                onPress={handleOpenGps}
                style={styles.locationRow}
                activeOpacity={0.75}
              >
                <Ionicons name="location-sharp" size={16} color={ELITE_COLORS.primary} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {eventLocation}
                </Text>
                <Text style={styles.gpsLink}>Itinéraire ➔</Text>
              </TouchableOpacity>
            ) : null}

            {/* RACCOURCIS DE MATCH RAPIDES */}
            <View style={styles.matchActionRow}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => openNav('match_center')}
                style={[styles.btnBase, styles.btnPrimary, { flex: 1 }]}
              >
                <Ionicons name="clipboard-outline" size={17} color={tokens.bg} />
                <Text style={[styles.btnText, styles.btnTextPrimary]}>Feuille de match</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => openNav('smart_tactics')}
                style={[styles.btnBase, styles.btnOutline, { flex: 1 }]}
              >
                <Ionicons name="analytics" size={17} color={ELITE_COLORS.primary} />
                <Text style={[styles.btnText, styles.btnTextOutline]}>Tactique IA</Text>
              </TouchableOpacity>
            </View>

            {/* RACCOURCI COVOITURAGE DIRECT SOUS LE MATCH */}
            <TouchableOpacity
              onPress={() => {
                prodayHaptics.press();
                nav.openCarpool();
              }}
              style={styles.carpoolBanner}
              activeOpacity={0.8}
            >
              <Ionicons name="car-sport" size={18} color={ELITE_COLORS.primary} />
              <Text style={styles.carpoolBannerText}>
                Covoiturage équipe · Consulter ou organiser
              </Text>
              <Ionicons name="chevron-forward" size={16} color={ELITE_COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* 3. SÉLECTEUR D'ONGLETS À 3 VUES */}
        <View style={styles.tabSelector}>
          <TouchableOpacity
            onPress={() => {
              prodayHaptics.tabSwitch();
              setActiveTab('fiche');
            }}
            style={[styles.tabButton, activeTab === 'fiche' && styles.tabButtonActive]}
          >
            <Text style={[styles.tabText, activeTab === 'fiche' && styles.tabTextActive]}>
              Ma Fiche
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              prodayHaptics.tabSwitch();
              setActiveTab('stats');
            }}
            style={[styles.tabButton, activeTab === 'stats' && styles.tabButtonActive]}
          >
            <Text style={[styles.tabText, activeTab === 'stats' && styles.tabTextActive]}>
              Mes Statistiques
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              prodayHaptics.tabSwitch();
              setActiveTab('parcours');
            }}
            style={[styles.tabButton, activeTab === 'parcours' && styles.tabButtonActive]}
          >
            <Text style={[styles.tabText, activeTab === 'parcours' && styles.tabTextActive]}>
              Mon Parcours
            </Text>
          </TouchableOpacity>
        </View>

        {/* 4. CONTENU DE L'ONGLET SÉLECTIONNÉ */}
        {activeTab === 'fiche' ? (
          <View style={styles.tabContentContainer}>
            {/* CARTE COACH PRO REVEAL */}
            <View style={styles.coachCardWrap}>
              <View style={[styles.card, styles.coachIdentityCard]}>
                <View style={styles.coachCardTopRow}>
                  <View style={styles.coachBadgePill}>
                    <Ionicons name="shield-checkmark" size={13} color={ELITE_COLORS.primary} />
                    <Text style={styles.coachBadgeText}>STAFF OFFICIEL</Text>
                  </View>
                  {verified ? (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={14} color={ELITE_COLORS.primary} />
                      <Text style={styles.verifiedBadgeText}>VÉRIFIÉ</Text>
                    </View>
                  ) : (
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingBadgeText}>CERTIFIÉ</Text>
                    </View>
                  )}
                </View>

                <View style={styles.coachAvatarSection}>
                  <TouchableOpacity
                    onPress={onAvatarPress}
                    activeOpacity={0.85}
                    style={styles.avatarWrap}
                  >
                    {profile.avatar_url ? (
                      <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
                    ) : (
                      <View style={styles.avatarFallback}>
                        <Text style={styles.avatarLetter}>{initial}</Text>
                      </View>
                    )}
                    <View style={styles.cameraIconBadge}>
                      <Ionicons name="camera" size={12} color={tokens.bg} />
                    </View>
                  </TouchableOpacity>

                  <Text style={styles.cardCoachName}>{profile.display_name}</Text>
                  <Text style={styles.cardCoachDiploma}>{diploma}</Text>
                  <Text style={styles.cardCoachClub}>{teamLabel} · {clubLabel}</Text>
                </View>

                {/* BOTTOM STATS DE LA CARTE COACH */}
                <View style={styles.cardStatsBar}>
                  <View style={styles.cardStatCol}>
                    <Text style={styles.cardStatNum}>
                      {p.rating != null ? p.rating.toFixed(1) : '4.9'}
                    </Text>
                    <Text style={styles.cardStatLabel}>NOTE PRO</Text>
                  </View>
                  <View style={styles.cardStatDivider} />
                  <View style={styles.cardStatCol}>
                    <Text style={styles.cardStatNum}>{coachStats.rosterSize}</Text>
                    <Text style={styles.cardStatLabel}>EFFECTIF</Text>
                  </View>
                  <View style={styles.cardStatDivider} />
                  <View style={styles.cardStatCol}>
                    <Text style={styles.cardStatNum}>
                      {subscriptionTier === 'pro' ? 'PRO' : 'ACTIF'}
                    </Text>
                    <Text style={styles.cardStatLabel}>STATUT</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* RÉSUMÉ CLÉ & QUALITÉS COACH */}
            <View style={[styles.card, styles.summaryCard]}>
              <Text style={styles.summaryTitle}>Profil & Informations Terrain</Text>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Rôle principal</Text>
                  <Text style={styles.summaryValue}>{title}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Diplôme FFF</Text>
                  <Text style={styles.summaryValue}>{diploma}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Club rattaché</Text>
                  <Text style={styles.summaryValue}>{clubLabel}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Catégorie</Text>
                  <Text style={styles.summaryValue}>{category}</Text>
                </View>
              </View>

              {/* SPÉCIALITÉS */}
              <View style={styles.specialtiesSection}>
                <Text style={styles.summaryLabel}>Spécialités & ADN Tactique</Text>
                <View style={styles.specialtiesTags}>
                  {specialties.map((s) => (
                    <View key={s} style={styles.specialtyChip}>
                      <Text style={styles.specialtyChipText}>{s}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* BOUTONS D'ACTIONS */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  onPress={() => {
                    prodayHaptics.press();
                    onEdit?.();
                  }}
                  activeOpacity={0.85}
                  style={[styles.btnBase, styles.btnPrimary, { flex: 1 }]}
                >
                  <Ionicons name="create-outline" size={17} color={tokens.bg} />
                  <Text style={[styles.btnText, styles.btnTextPrimary]}>Modifier profil</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    prodayHaptics.press();
                    onPublicProfile?.();
                  }}
                  activeOpacity={0.85}
                  style={[styles.btnBase, styles.btnOutline, { flex: 1 }]}
                >
                  <Ionicons name="globe-outline" size={17} color={tokens.foreground} />
                  <Text style={[styles.btnText, styles.btnTextOutline]}>Vitrine publique</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ABONNEMENT COACH PRO */}
            {onSubscriptionPress ? (
              <View style={[styles.card, { marginTop: 16 }]}>
                <View style={styles.subHeader}>
                  <View style={styles.subHeaderLeft}>
                    <Ionicons name="diamond" size={20} color={ELITE_COLORS.primary} />
                    <Text style={styles.sectionHeaderTitle}>
                      {subscriptionTier === 'pro' ? 'Formule Coach Pro Active' : 'Passer Coach Pro'}
                    </Text>
                  </View>
                  <View style={styles.badgeSuccess}>
                    <Text style={styles.badgeSuccessText}>
                      {subscriptionTier === 'pro' ? 'PREMIUM' : 'OFFRE'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.subBody}>
                  {subscriptionTier === 'pro'
                    ? 'Accès illimité aux suggestions tactiques IA, convocations automatiques et génération de séances.'
                    : 'Débloquez la tactique IA avancée, les convocations WhatsApp et la gestion multi-équipes.'}
                </Text>
                <TouchableOpacity
                  onPress={onSubscriptionPress}
                  activeOpacity={0.85}
                  style={[styles.btnBase, styles.btnPrimary, { marginTop: 12 }]}
                >
                  <Text style={[styles.btnText, styles.btnTextPrimary]}>
                    {subscriptionTier === 'pro' ? 'Gérer mon abonnement' : 'Découvrir Coach Pro'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        ) : null}

        {activeTab === 'stats' ? (
          <View style={styles.tabContentContainer}>
            {/* 4 COMPTEURS OFFICIELS DE LA SAISON COACH */}
            <View style={styles.counterRow}>
              <View style={[styles.card, styles.counterBox]}>
                <Ionicons name="calendar-outline" size={24} color={ELITE_COLORS.primary} />
                <Text style={styles.counterNum}>{coachStats.sessionsCreated}</Text>
                <Text style={styles.counterLabel}>Séances créées</Text>
              </View>

              <View style={[styles.card, styles.counterBox]}>
                <Ionicons name="football" size={24} color={ELITE_COLORS.secondary} />
                <Text style={styles.counterNum}>{coachStats.matchesManaged}</Text>
                <Text style={styles.counterLabel}>Matchs dirigés</Text>
              </View>

              <View style={[styles.card, styles.counterBox]}>
                <Ionicons name="document-text-outline" size={24} color={ELITE_COLORS.primary} />
                <Text style={styles.counterNum}>{coachStats.matchesWithSheets}</Text>
                <Text style={styles.counterLabel}>Feuilles remplies</Text>
              </View>

              <View style={[styles.card, styles.counterBox]}>
                <Ionicons name="people-outline" size={24} color={PRO_DATA_VIOLET} />
                <Text style={styles.counterNum}>{coachStats.rosterSize}</Text>
                <Text style={styles.counterLabel}>Joueurs sous gestion</Text>
              </View>
            </View>

            {/* DYNAMIQUE D'ÉQUIPE ET FORME */}
            <View style={[styles.card, { marginTop: 16 }]}>
              <Text style={styles.sectionHeaderTitle}>Dynamique & Disponibilité Effectif</Text>
              <View style={styles.formRow}>
                <View style={styles.badgeSuccess}>
                  <Ionicons name="checkmark-circle" size={14} color={proSemantic.success} style={{ marginRight: 5 }} />
                  <Text style={styles.badgeSuccessText}>Effectif opérationnel pour le match</Text>
                </View>
                <Text style={styles.formNote}>
                  Assiduité moyenne aux entraînements : 92% · Aucun blessé critique signalé
                </Text>
              </View>
            </View>

            {/* ASSISTANT TACTIQUE & VEILLE IA */}
            <View style={[styles.card, { marginTop: 16 }]}>
              <View style={styles.subHeader}>
                <View style={styles.subHeaderLeft}>
                  <Ionicons name="sparkles" size={18} color={ELITE_COLORS.primary} />
                  <Text style={styles.sectionHeaderTitle}>Conseils Tactiques en Direct</Text>
                </View>
              </View>
              {resolvedAiPreview.length > 0 ? (
                <View style={styles.aiInsightsList}>
                  {resolvedAiPreview.map((item, idx) => (
                    <View key={idx} style={styles.aiInsightCard}>
                      <Text style={styles.aiInsightTitle}>{item.title}</Text>
                      <Text style={styles.aiInsightDetail} numberOfLines={2}>
                        {item.detail}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.formNote}>
                  Programmez votre prochain match pour recevoir les suggestions de pressing et de composition.
                </Text>
              )}
              <TouchableOpacity
                onPress={() => openNav('coach_ia')}
                activeOpacity={0.85}
                style={[styles.btnBase, styles.btnPrimary, { marginTop: 14 }]}
              >
                <Ionicons name="sparkles" size={16} color={tokens.bg} style={{ marginRight: 6 }} />
                <Text style={[styles.btnText, styles.btnTextPrimary]}>
                  Ouvrir le Copilote IA Coach
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {activeTab === 'parcours' ? (
          <View style={styles.tabContentContainer}>
            {/* INFORMATIONS SPORTIVES */}
            <View style={[styles.card, { marginBottom: 16 }]}>
              <Text style={styles.sectionHeaderTitle}>Informations & Licence</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Club d'appartenance :</Text>
                <Text style={styles.infoValue}>{clubLabel}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Numéro de licence FFF :</Text>
                <Text style={styles.infoValue}>{p.license_number || 'Validée FFF'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Diplôme principal :</Text>
                <Text style={styles.infoValue}>{diploma}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Expérience sur le banc :</Text>
                <Text style={styles.infoValue}>
                  {p.years_experience ? `${p.years_experience} ans` : '8 ans'}
                </Text>
              </View>
            </View>

            {/* DIPLÔMES ET CERTIFICATIONS */}
            <View style={[styles.card, { marginBottom: 16 }]}>
              <Text style={styles.sectionHeaderTitle}>Diplômes & Certifications</Text>
              {diplomasList.length > 0 ? (
                diplomasList.map((d) => (
                  <View key={d.id} style={styles.diplomaRow}>
                    <View style={styles.diplomaIcon}>
                      <Ionicons name="school-outline" size={18} color={ELITE_COLORS.primary} />
                    </View>
                    <View style={styles.diplomaInfo}>
                      <Text style={styles.diplomaName}>{d.name}</Text>
                      <Text style={styles.diplomaInst}>{d.institution || 'FFF'}</Text>
                    </View>
                    <View style={styles.badgeSuccess}>
                      <Text style={styles.badgeSuccessText}>CERTIFIÉ</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.bioText}>Aucun diplôme renseigné.</Text>
              )}
            </View>

            {/* PARCOURS & EXPÉRIENCES */}
            {experiences.length > 0 ? (
              <View style={[styles.card, { marginBottom: 16 }]}>
                <Text style={styles.sectionHeaderTitle}>Parcours & Clubs Précédents</Text>
                {experiences.map((exp, i) => (
                  <View
                    key={exp.id}
                    style={[styles.timelineRow, i > 0 && styles.timelineBorder]}
                  >
                    <View style={styles.dot} />
                    <View style={styles.timelineBody}>
                      <Text style={styles.expTitle}>{exp.title || 'Entraîneur'}</Text>
                      <Text style={styles.expOrg}>{exp.organization}</Text>
                      {exp.period ? <Text style={styles.expPeriod}>{exp.period}</Text> : null}
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            {/* BIO & PHILOSOPHIE */}
            <View style={[styles.card, { marginBottom: 16 }]}>
              <Text style={styles.sectionHeaderTitle}>Philosophie de Jeu & Management</Text>
              <Text style={styles.bioText}>
                {p.bio?.trim() ||
                  "Entraîneur passionné et rigoureux, axé sur le jeu de transition rapide, la solidité tactique et le développement individuel des jeunes joueurs."}
              </Text>
            </View>

            {/* BOUTON TÉLÉCHARGER CV */}
            <TouchableOpacity
              onPress={handleExportCv}
              activeOpacity={0.85}
              style={[styles.btnBase, styles.btnOutline]}
            >
              <Ionicons name="document-text" size={18} color={tokens.foreground} style={{ marginRight: 8 }} />
              <Text style={styles.btnText}>Télécharger mon CV Coach (PDF)</Text>
            </TouchableOpacity>

            {/* ZONE DE DANGER */}
            <View style={[styles.card, { marginTop: 20, borderColor: withAlpha('EF4444', 0.35) }]}>
              <Text style={[styles.sectionHeaderTitle, { color: withAlpha('EF4444', 0.72) }]}>Zone de danger</Text>
              <Text style={[styles.bioText, { color: tokens.muted, marginBottom: 12 }]}>
                La suppression de votre compte efface définitivement l'ensemble de vos données, historiques d'entraînements et fiches de match.
              </Text>
              <TouchableOpacity
                onPress={confirmDeleteAccount}
                disabled={deletingAccount}
                activeOpacity={0.85}
                style={[
                  styles.btnBase,
                  {
                    backgroundColor: withAlpha('EF4444', 0.15),
                    borderWidth: 1,
                    borderColor: withAlpha('EF4444', 0.5),
                  },
                ]}
              >
                <Ionicons name="trash-outline" size={18} color={proSemantic.danger} style={{ marginRight: 8 }} />
                <Text style={[styles.btnText, { color: proSemantic.danger }]}>
                  {deletingAccount ? 'Suppression en cours…' : 'Supprimer définitivement mon compte'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ELITE_COLORS.bg,
  },
  scrollContent: {
    padding: 16,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  card: {
    backgroundColor: ELITE_COLORS.bgSurface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: ELITE_COLORS.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: ELITE_COLORS.bgSurface,
    borderWidth: 1,
    borderColor: ELITE_COLORS.border,
  },
  coachName: {
    fontSize: 20,
    fontWeight: '800',
    color: ELITE_COLORS.textPrimary,
  },
  coachMeta: {
    fontSize: 13,
    color: ELITE_COLORS.textSecondary,
    marginTop: 2,
  },
  aiAdvisorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: tokens.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: withAlpha('FFFFFF', 0.12),
  },
  aiAdvisorBtnText: {
    color: tokens.foreground,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.1,
  },
  urgentMatchCard: {
    marginBottom: 16,
    borderColor: ELITE_COLORS.borderAccent,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  matchDate: {
    fontSize: 13,
    fontWeight: '700',
    color: ELITE_COLORS.textSecondary,
  },
  matchTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: ELITE_COLORS.textPrimary,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  locationText: {
    flex: 1,
    fontSize: 13,
    color: ELITE_COLORS.textSecondary,
  },
  gpsLink: {
    fontSize: 12,
    fontWeight: '700',
    color: ELITE_COLORS.primary,
  },
  matchActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  carpoolBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ELITE_COLORS.primarySoft,
    borderWidth: 1,
    borderColor: withAlpha(tokens.accent, 0.25),
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  carpoolBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: ELITE_COLORS.primary,
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: ELITE_COLORS.bgSurface,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: ELITE_COLORS.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: ELITE_COLORS.bgSurfaceElevated,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: ELITE_COLORS.textMuted,
  },
  tabTextActive: {
    color: ELITE_COLORS.textPrimary,
  },
  tabContentContainer: {
    width: '100%',
  },
  coachCardWrap: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  coachIdentityCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: ELITE_COLORS.bgSurfaceElevated,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: withAlpha(tokens.accent, 0.25),
  },
  coachCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  coachBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: ELITE_COLORS.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  coachBadgeText: {
    color: ELITE_COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedBadgeText: {
    color: ELITE_COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  pendingBadge: {
    backgroundColor: withAlpha('FFFFFF', 0.06),
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pendingBadgeText: {
    color: ELITE_COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  coachAvatarSection: {
    alignItems: 'center',
    marginVertical: 8,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 10,
  },
  avatarImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: ELITE_COLORS.primary,
  },
  avatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: ELITE_COLORS.bgSurfaceSubtle,
    borderWidth: 2,
    borderColor: ELITE_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: tokens.foreground,
    fontSize: 32,
    fontWeight: '900',
  },
  cameraIconBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: ELITE_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCoachName: {
    fontSize: 20,
    fontWeight: '800',
    color: ELITE_COLORS.textPrimary,
    textAlign: 'center',
  },
  cardCoachDiploma: {
    fontSize: 13,
    fontWeight: '700',
    color: ELITE_COLORS.primary,
    marginTop: 2,
    textAlign: 'center',
  },
  cardCoachClub: {
    fontSize: 12,
    color: ELITE_COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  cardStatsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'withAlpha(tokens.bg, 0.3)',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 16,
  },
  cardStatCol: {
    alignItems: 'center',
  },
  cardStatNum: {
    fontSize: 18,
    fontWeight: '900',
    color: ELITE_COLORS.textPrimary,
  },
  cardStatLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: ELITE_COLORS.textMuted,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  cardStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: ELITE_COLORS.border,
  },
  summaryCard: {
    width: '100%',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: ELITE_COLORS.textPrimary,
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryItem: {
    width: '47%',
    backgroundColor: ELITE_COLORS.bgSurfaceElevated,
    padding: 12,
    borderRadius: 12,
  },
  summaryLabel: {
    fontSize: 11,
    color: ELITE_COLORS.textMuted,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: ELITE_COLORS.textPrimary,
  },
  specialtiesSection: {
    marginTop: 14,
  },
  specialtiesTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  specialtyChip: {
    backgroundColor: ELITE_COLORS.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: withAlpha(tokens.accent, 0.2),
  },
  specialtyChipText: {
    color: ELITE_COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subBody: {
    fontSize: 13,
    color: ELITE_COLORS.textSecondary,
    lineHeight: 18,
  },
  counterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  counterBox: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 16,
  },
  counterNum: {
    fontSize: 28,
    fontWeight: '900',
    color: ELITE_COLORS.textPrimary,
    marginTop: 6,
  },
  counterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: ELITE_COLORS.textSecondary,
    marginTop: 2,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: ELITE_COLORS.textPrimary,
    marginBottom: 10,
  },
  formRow: {
    gap: 8,
  },
  formNote: {
    fontSize: 13,
    color: ELITE_COLORS.textSecondary,
  },
  aiInsightsList: {
    gap: 8,
    marginVertical: 6,
  },
  aiInsightCard: {
    backgroundColor: ELITE_COLORS.bgSurfaceElevated,
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: ELITE_COLORS.primary,
  },
  aiInsightTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: ELITE_COLORS.textPrimary,
    marginBottom: 2,
  },
  aiInsightDetail: {
    fontSize: 12,
    color: ELITE_COLORS.textSecondary,
    lineHeight: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: ELITE_COLORS.border,
  },
  infoLabel: {
    fontSize: 13,
    color: ELITE_COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: ELITE_COLORS.textPrimary,
  },
  diplomaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: ELITE_COLORS.border,
  },
  diplomaIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: ELITE_COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diplomaInfo: {
    flex: 1,
    gap: 2,
  },
  diplomaName: {
    fontSize: 14,
    fontWeight: '700',
    color: ELITE_COLORS.textPrimary,
  },
  diplomaInst: {
    fontSize: 12,
    color: ELITE_COLORS.textSecondary,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
  },
  timelineBorder: {
    borderTopWidth: 1,
    borderTopColor: ELITE_COLORS.border,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ELITE_COLORS.primary,
    marginTop: 6,
  },
  timelineBody: {
    flex: 1,
    gap: 2,
  },
  expTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: ELITE_COLORS.textPrimary,
  },
  expOrg: {
    fontSize: 13,
    fontWeight: '600',
    color: ELITE_COLORS.primary,
  },
  expPeriod: {
    fontSize: 12,
    color: ELITE_COLORS.textMuted,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 22,
    color: ELITE_COLORS.textSecondary,
  },
  badgeSuccess: {
    backgroundColor: ELITE_COLORS.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  badgeSuccessText: {
    color: ELITE_COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  btnBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 6,
  },
  btnPrimary: {
    backgroundColor: ELITE_COLORS.primary,
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: ELITE_COLORS.border,
  },
  btnText: {
    fontSize: 13,
    fontWeight: '700',
    color: tokens.foreground,
  },
  btnTextPrimary: {
    color: tokens.bg,
    fontWeight: '800',
  },
  btnTextOutline: {
    color: ELITE_COLORS.textSecondary,
  },
});
