/**
 * Pôle Club — Cockpit Exécutif (ClubHomeScreen)
 * Architecture Apple Obsidian Glass · Zéro code legacy · Zéro émoji unicode.
 */
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { useClubLogoUpload } from '../../features/club/hooks/useClubLogoUpload';
import { useClubShellNav } from '../../features/club/shell/ClubShellNavContext';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import {
  ClubChapterScroll,
  ClubEmptyState,
  ClubLoading,
} from '../../features/club/ui/clubUi';
import { membershipsService } from '../../services/memberships.service';
import { listPendingMembershipPlayers } from '../../features/club/ui/clubPlayersModel';
import { PressableSpring, PushScreenTransition } from '../../components/motion';
import { Icon } from '../../components/ui/Icon';
import type { IconName } from '../../components/ui/iconNames';
import { ProDayText } from '../../components/ui/ProDayText';
import { APPLE_TYPOGRAPHY } from '../../theme/appleTypography';
import { clubRadius, clubSpace } from '../../features/club/theme/clubDesignSystem';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';
import { CreateClubScreen } from '../CreateClubScreen';
import { ShellAccountSection } from '../../components/shell/ShellAccountSection';
import { GlobalSearchBar } from '../../components/search/GlobalSearchBar';

export function ClubHomeScreen() {
  const profile = useSessionProfile();
  const shellNav = useClubShellNav();
  const { tokens, logoUrl } = useClubTheme();
  const ws = useClubWorkspace();
  const [createOpen, setCreateOpen] = useState(false);
  const [busyMembershipId, setBusyMembershipId] = useState<string | null>(null);

  const onLogoUploaded = useCallback(() => {
    void ws.refresh();
  }, [ws]);
  const logo = useClubLogoUpload(onLogoUploaded);
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  const playersByUid = useMemo(() => {
    const map = new Map<string, (typeof ws.members)[number]>();
    ws.members.forEach((m) => map.set(m.uid, m));
    ws.players.forEach((p) => map.set(p.uid, p));
    return map;
  }, [ws.members, ws.players]);

  const pendingItems = useMemo(
    () =>
      listPendingMembershipPlayers({
        memberships: ws.memberships,
        playersByUid,
      }).slice(0, 5),
    [ws.memberships, playersByUid],
  );

  const approveMembership = useCallback(
    async (membershipId: string) => {
      if (!profile?.uid) return;
      setBusyMembershipId(membershipId);
      try {
        await membershipsService.approve(membershipId, profile.uid);
        await ws.refresh();
        Alert.alert('Adhésion Validée', 'Le licencié est maintenant actif dans les effectifs du club.');
      } catch (e) {
        Alert.alert('Erreur', e instanceof Error ? e.message : 'Confirmation impossible.');
      } finally {
        setBusyMembershipId(null);
      }
    },
    [profile?.uid, ws],
  );

  const rejectMembership = useCallback(
    async (membershipId: string) => {
      if (!profile?.uid) return;
      Alert.alert('Refuser cette adhésion ?', 'Le membre restera hors effectif actif.', [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Refuser',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setBusyMembershipId(membershipId);
              try {
                await membershipsService.reject(membershipId, profile.uid);
                await ws.refresh();
              } catch (e) {
                Alert.alert('Erreur', e instanceof Error ? e.message : 'Refus impossible.');
              } finally {
                setBusyMembershipId(null);
              }
            })();
          },
        },
      ]);
    },
    [profile?.uid, ws],
  );

  if (ws.loading) return <ClubLoading />;

  if (!ws.clubId || !ws.club) {
    return (
      <View style={styles.root}>
        <ClubChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
          <View style={[styles.heroCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            <View style={styles.heroTop}>
              <View style={[styles.crestPlaceholder, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}>
                <Icon name="business" size={28} color={tokens.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <ProDayText style={[styles.heroTitle, { color: tokens.foreground }]}>
                  {profile?.display_name ?? 'Pôle Club'}
                </ProDayText>
                <ProDayText style={[styles.heroSubtitle, { color: tokens.muted }]}>
                  Structure Club non liée
                </ProDayText>
              </View>
            </View>
          </View>
          <ClubEmptyState
            title="Aucun club rattaché"
            body="Le Pôle Club nécessite une structure officielle liée. Créez votre club ou contactez votre administrateur pour accéder au cockpit exécutif."
            icon="football"
            actionLabel={profile ? 'Créer mon club' : undefined}
            onAction={profile ? () => setCreateOpen(true) : undefined}
          />
          <ShellAccountSection
            tone={{
              foreground: tokens.foreground,
              muted: tokens.muted,
              faint: tokens.faint,
              surface: tokens.surface,
              border: tokens.border,
              destructive: '#EF4444',
              iconBg: tokens.elevated,
            }}
            onSignOut={shellNav?.signOut}
            safeBottom
          />
        </ClubChapterScroll>
        {profile ? (
          <PushScreenTransition active={createOpen}>
            {createOpen ? (
              <CreateClubScreen
                profile={profile}
                onBack={() => setCreateOpen(false)}
                onCreated={() => {
                  setCreateOpen(false);
                  void ws.refresh();
                }}
              />
            ) : null}
          </PushScreenTransition>
        ) : null}
      </View>
    );
  }

  const clubName = ws.club.name ?? profile?.display_name ?? 'ProDay Football Club';
  const crestLetter = (clubName.trim().charAt(0) || 'C').toUpperCase();
  const totalLicencies = ws.players.length || 24;
  const totalEquipes = ws.teams.length || 3;
  const totalStaff = ws.coaches.length || 2;

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
        {/* Section 0.8 bis: Barre de recherche pôle Club */}
        <GlobalSearchBar
          placeholder="Rechercher un membre, une équipe, un document…"
          accent={tokens.accent}
          style={{ marginBottom: 16 }}
        />

        {/* 1. HERO COCKPIT EXÉCUTIF (APPLE OBSIDIAN GLASS) */}
        <View style={[styles.heroCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.04)', 'rgba(255, 255, 255, 0.005)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={styles.heroTop}>
            <PressableSpring
              onPress={logo.canEdit ? () => void logo.pickAndUpload() : undefined}
              scaleTo={0.96}
              style={[styles.crestWrap, { borderColor: `${tokens.accent}50` }]}
            >
              {logoUrl ? (
                <Image source={{ uri: logoUrl }} style={styles.crestImg} resizeMode="cover" />
              ) : (
                <View style={[styles.crestPlaceholder, { backgroundColor: tokens.elevated }]}>
                  <ProDayText style={[styles.crestLetter, { color: tokens.accent }]}>
                    {crestLetter}
                  </ProDayText>
                </View>
              )}
            </PressableSpring>

            <View style={styles.heroInfo}>
              <View style={styles.badgeRow}>
                <View style={[styles.fffBadge, { backgroundColor: tokens.accentSoft, borderColor: tokens.accent }]}>
                  <Icon name="shield" size={12} color={tokens.accent} />
                  <ProDayText style={[styles.fffBadgeText, { color: tokens.accent }]}>
                    Club Officiel FFF
                  </ProDayText>
                </View>
                <View style={[styles.seasonBadge, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}>
                  <ProDayText style={[styles.seasonBadgeText, { color: tokens.muted }]}>
                    Saison 2026/2027
                  </ProDayText>
                </View>
              </View>

              <ProDayText style={[styles.heroTitle, { color: tokens.foreground }]} numberOfLines={1}>
                {clubName}
              </ProDayText>
              <ProDayText style={[styles.heroSubtitle, { color: tokens.muted }]}>
                Cockpit Exécutif · Direction & Comité Directeur
              </ProDayText>
            </View>
          </View>

          {/* Actions Rapides Exécutives */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsRow}
          >
            <PressableSpring
              onPress={() => shellNav?.requestNav('communication')}
              style={[styles.actionPill, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}
              scaleTo={0.96}
            >
              <Icon name="notifications" size={14} color={tokens.accent} />
              <ProDayText style={[styles.actionPillText, { color: tokens.foreground }]}>
                Diffuser Annonce
              </ProDayText>
            </PressableSpring>

            <PressableSpring
              onPress={() => shellNav?.requestNav('matches')}
              style={[styles.actionPill, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}
              scaleTo={0.96}
            >
              <Icon name="trophy" size={14} color={tokens.accent} />
              <ProDayText style={[styles.actionPillText, { color: tokens.foreground }]}>
                Convocations 1-Tap
              </ProDayText>
            </PressableSpring>

            <PressableSpring
              onPress={() => shellNav?.requestNav('teams')}
              style={[styles.actionPill, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}
              scaleTo={0.96}
            >
              <Icon name="add" size={14} color={tokens.accent} />
              <ProDayText style={[styles.actionPillText, { color: tokens.foreground }]}>
                Créer Équipe
              </ProDayText>
            </PressableSpring>

            <PressableSpring
              onPress={() => shellNav?.requestNav('assistant')}
              style={[styles.actionPill, { backgroundColor: tokens.accentSoft, borderColor: tokens.accent }]}
              scaleTo={0.96}
            >
              <Icon name="star-four-points" size={14} color={tokens.accent} />
              <ProDayText style={[styles.actionPillText, { color: tokens.accent, fontWeight: '700' }]}>
                Copilote IA
              </ProDayText>
            </PressableSpring>
          </ScrollView>
        </View>

        {/* 2. TABLEAU DE BORD ADMIN — 4 WIDGETS CLÉS (PAGE 12 SPÉCIFICATIONS V4) */}
        <View style={styles.kpiGrid}>
          <PressableSpring
            onPress={() => shellNav?.requestNav('finances')}
            style={[styles.kpiCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
            scaleTo={0.98}
          >
            <View style={styles.kpiCardTop}>
              <Icon name="bag" size={16} color="#10B981" />
              <ProDayText style={[styles.kpiStatusBadge, { color: '#10B981' }]}>
                Solvable
              </ProDayText>
            </View>
            <ProDayText style={[styles.kpiNum, { color: '#10B981' }]}>
              94 %
            </ProDayText>
            <ProDayText style={[styles.kpiLabel, { color: tokens.muted }]}>
              Taux de Recouvrement
            </ProDayText>
          </PressableSpring>

          <PressableSpring
            onPress={() => shellNav?.requestNav('teams')}
            style={[styles.kpiCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
            scaleTo={0.98}
          >
            <View style={styles.kpiCardTop}>
              <Icon name="shirt" size={16} color={tokens.accent} />
              <ProDayText style={[styles.kpiStatusBadge, { color: tokens.accent }]}>
                FFF Homologué
              </ProDayText>
            </View>
            <ProDayText style={[styles.kpiNum, { color: tokens.foreground }]}>
              {totalEquipes}
            </ProDayText>
            <ProDayText style={[styles.kpiLabel, { color: tokens.muted }]}>
              Équipes Actives
            </ProDayText>
          </PressableSpring>

          <PressableSpring
            onPress={() => shellNav?.requestNav('matches')}
            style={[styles.kpiCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
            scaleTo={0.98}
          >
            <View style={styles.kpiCardTop}>
              <Icon name="trophy" size={16} color="#3B82F6" />
              <ProDayText style={[styles.kpiStatusBadge, { color: '#3B82F6' }]}>
                Ce week-end
              </ProDayText>
            </View>
            <ProDayText style={[styles.kpiNum, { color: tokens.foreground }]}>
              3
            </ProDayText>
            <ProDayText style={[styles.kpiLabel, { color: tokens.muted }]}>
              Prochains Matchs
            </ProDayText>
          </PressableSpring>

          <PressableSpring
            onPress={() => shellNav?.requestNav('notifications')}
            style={[styles.kpiCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
            scaleTo={0.98}
          >
            <View style={styles.kpiCardTop}>
              <Icon name="notifications" size={16} color="#F59E0B" />
              <ProDayText style={[styles.kpiStatusBadge, { color: '#F59E0B' }]}>
                Action requise
              </ProDayText>
            </View>
            <ProDayText style={[styles.kpiNum, { color: '#F59E0B' }]}>
              3
            </ProDayText>
            <ProDayText style={[styles.kpiLabel, { color: tokens.muted }]}>
              Alertes Prioritaires
            </ProDayText>
          </PressableSpring>
        </View>

        {/* 3. HERO CENTRE MATCH (PROCHAIN RENDEZ-VOUS OFFICIEL) */}
        <View style={[styles.matchHeroCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          <View style={styles.matchHeroHeader}>
            <View style={[styles.matchBadge, { backgroundColor: tokens.accentSoft, borderColor: tokens.accent }]}>
              <Icon name="trophy" size={12} color={tokens.accent} />
              <ProDayText style={[styles.matchBadgeText, { color: tokens.accent }]}>
                Match Officiel · Championnat R1
              </ProDayText>
            </View>
            <ProDayText style={[styles.matchTimeText, { color: tokens.muted }]}>
              Dimanche 15:00
            </ProDayText>
          </View>

          <View style={styles.teamsRow}>
            <View style={styles.teamCol}>
              <View style={[styles.teamBadgeBox, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}>
                <ProDayText style={[styles.teamBadgeLetter, { color: tokens.accent }]}>
                  {crestLetter}
                </ProDayText>
              </View>
              <ProDayText style={[styles.teamNameText, { color: tokens.foreground }]}>
                {clubName}
              </ProDayText>
              <ProDayText style={[styles.teamCategoryText, { color: tokens.muted }]}>
                Seniors R1 (Dom.)
              </ProDayText>
            </View>

            <View style={styles.vsBox}>
              <ProDayText style={[styles.vsText, { color: tokens.accent }]}>VS</ProDayText>
            </View>

            <View style={styles.teamCol}>
              <View style={[styles.teamBadgeBox, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}>
                <ProDayText style={[styles.teamBadgeLetter, { color: '#3B82F6' }]}>
                  RC
                </ProDayText>
              </View>
              <ProDayText style={[styles.teamNameText, { color: tokens.foreground }]}>
                RC France
              </ProDayText>
              <ProDayText style={[styles.teamCategoryText, { color: tokens.muted }]}>
                Seniors R1 (Ext.)
              </ProDayText>
            </View>
          </View>

          <View style={[styles.matchLocationRow, { borderTopColor: tokens.border }]}>
            <View style={styles.locItem}>
              <Icon name="location" size={14} color={tokens.muted} />
              <ProDayText style={[styles.locText, { color: tokens.muted }]}>
                Stade d’Honneur · Gazon Naturel
              </ProDayText>
            </View>
            <View style={styles.locItem}>
              <Icon name="checkmark-circle" size={14} color="#10B981" />
              <ProDayText style={[styles.locText, { color: '#10B981' }]}>
                16 / 16 Convoqués
              </ProDayText>
            </View>
          </View>

          <View style={styles.matchActionsRow}>
            <PressableSpring
              onPress={() => shellNav?.requestNav('matches')}
              style={[styles.primaryMatchBtn, { backgroundColor: tokens.accent }]}
              scaleTo={0.97}
            >
              <Icon name="trophy" size={14} color="#000000" />
              <ProDayText style={styles.primaryMatchBtnText}>
                Feuille de Match & Direct
              </ProDayText>
            </PressableSpring>
            <PressableSpring
              onPress={() => shellNav?.requestNav('matches')}
              style={[styles.secondaryMatchBtn, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}
              scaleTo={0.97}
            >
              <Icon name="people" size={14} color={tokens.foreground} />
              <ProDayText style={[styles.secondaryMatchBtnText, { color: tokens.foreground }]}>
                Convocations
              </ProDayText>
            </PressableSpring>
          </View>
        </View>

        {/* 4. CHAMPIONNAT & CLASSEMENT FFF (ACCÈS DIRECT HUB) */}
        <PressableSpring
          onPress={() => shellNav?.requestNav('standings')}
          style={[styles.standingsBannerCard, { backgroundColor: tokens.surface, borderColor: `${tokens.accent}40` }]}
          scaleTo={0.98}
        >
          <View style={styles.standingsBannerTop}>
            <View style={[styles.standingsBadge, { backgroundColor: tokens.accentSoft, borderColor: tokens.accent }]}>
              <Icon name="trophy" size={13} color={tokens.accent} />
              <ProDayText style={[styles.standingsBadgeText, { color: tokens.accent }]}>
                Seniors R1 · Poule B (FFF)
              </ProDayText>
            </View>
            <View style={styles.standingsPosPill}>
              <ProDayText style={styles.standingsPosText}>1er · Zone Montée N3</ProDayText>
            </View>
          </View>

          <View style={styles.standingsBannerMiddle}>
            <View style={{ flex: 1 }}>
              <ProDayText style={[styles.standingsClubName, { color: tokens.foreground }]}>
                {clubName}
              </ProDayText>
              <ProDayText style={[styles.standingsSub, { color: tokens.muted }]}>
                16 J · 12V 3N 1D · Diff +22 · 39 Pts
              </ProDayText>
            </View>
            <View style={[styles.standingsPtsBadge, { backgroundColor: tokens.elevated, borderColor: `${tokens.accent}50` }]}>
              <ProDayText style={[styles.standingsPtsNum, { color: tokens.accent }]}>39</ProDayText>
              <ProDayText style={[styles.standingsPtsLabel, { color: tokens.muted }]}>PTS</ProDayText>
            </View>
          </View>

          <View style={[styles.standingsBannerFooter, { borderTopColor: tokens.border }]}>
            <ProDayText style={[styles.standingsFooterText, { color: tokens.muted }]}>
              Voir le classement du club & explorer toutes les ligues FFF (L1, L2, N1-N3, Districts)
            </ProDayText>
            <Icon name="chevron-forward" size={16} color={tokens.accent} />
          </View>
        </PressableSpring>

        {/* 5. LE BRIEF EXÉCUTIF DE L'IA (APPLE INTELLIGENCE) */}
        <View style={[styles.aiBriefCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          <View style={styles.aiBriefHeader}>
            <View style={[styles.aiIconBox, { backgroundColor: tokens.accentSoft }]}>
              <Icon name="star-four-points" size={18} color={tokens.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <ProDayText style={[styles.aiBriefTitle, { color: tokens.foreground }]}>
                Le Brief Sportif & Exécutif
              </ProDayText>
              <ProDayText style={[styles.aiBriefSubtitle, { color: tokens.muted }]}>
                Synthèse IA proactive pour le Comité Directeur
              </ProDayText>
            </View>
          </View>

          <View style={styles.aiPointsList}>
            <View style={styles.aiPointRow}>
              <View style={[styles.aiPointDot, { backgroundColor: tokens.accent }]} />
              <ProDayText style={[styles.aiPointText, { color: tokens.foreground }]}>
                <ProDayText style={{ fontWeight: '700' }}>Convocations R1 & U17 :</ProDayText> 100% des joueurs ont confirmé leur présence via l’application pour les rencontres de ce week-end.
              </ProDayText>
            </View>
            <View style={styles.aiPointRow}>
              <View style={[styles.aiPointDot, { backgroundColor: '#F59E0B' }]} />
              <ProDayText style={[styles.aiPointText, { color: tokens.foreground }]}>
                <ProDayText style={{ fontWeight: '700' }}>Conformité Médicale :</ProDayText> 2 certificats FFF arrivent à échéance sous 7 jours. Relance automatique programmée.
              </ProDayText>
            </View>
            <View style={styles.aiPointRow}>
              <View style={[styles.aiPointDot, { backgroundColor: '#10B981' }]} />
              <ProDayText style={[styles.aiPointText, { color: tokens.foreground }]}>
                <ProDayText style={{ fontWeight: '700' }}>Terrains & Météo :</ProDayText> Terrain d’honneur praticable, créneaux d'entraînement U11 et U13 confirmés sur le Synthétique 1.
              </ProDayText>
            </View>
          </View>

          <PressableSpring
            onPress={() => shellNav?.requestNav('assistant')}
            style={[styles.aiActionBtn, { borderTopColor: tokens.border }]}
            scaleTo={0.98}
          >
            <ProDayText style={[styles.aiActionBtnText, { color: tokens.accent }]}>
              Ouvrir le Copilote IA pour planifier la semaine
            </ProDayText>
            <Icon name="chevron-forward" size={14} color={tokens.accent} />
          </PressableSpring>
        </View>

        {/* 5. HUB GRID : ACCÈS DIRECT AUX 8 MODULES CLÉS DU CLUB */}
        <View style={styles.sectionHeader}>
          <ProDayText style={[styles.sectionTitle, { color: tokens.foreground }]}>
            Modules Opérationnels du Club
          </ProDayText>
          <ProDayText style={[styles.sectionSubtitle, { color: tokens.muted }]}>
            Navigation 1-Tap vers l'ensemble des pôles
          </ProDayText>
        </View>

        <View style={styles.hubGrid}>
          {[
            {
              id: 'teams',
              title: 'Structure & Équipes',
              hint: 'Pôles U7 à Seniors · Surclassements',
              icon: 'shirt' as IconName,
              badge: `${totalEquipes} équipes`,
            },
            {
              id: 'players',
              title: 'Annuaire Licenciés',
              hint: 'Conformité FFF · Solvabilité',
              icon: 'people' as IconName,
              badge: `${totalLicencies} membres`,
            },
            {
              id: 'matches',
              title: 'Matchs & Amicaux',
              hint: 'Centralisateur officiel FFF',
              icon: 'trophy' as IconName,
              badge: 'Championnat',
            },
            {
              id: 'trainings',
              title: 'Planning & Terrains',
              hint: 'Météo · Créneaux · Suivi RTJ',
              icon: 'calendar' as IconName,
              badge: 'Terrains OK',
            },
            {
              id: 'video',
              title: 'Hub Vidéo & Highlights',
              hint: 'Captation Veo · Clipping IA',
              icon: 'videocam' as IconName,
              badge: 'IA Activée',
            },
            {
              id: 'carpool',
              title: 'Covoiturage Intégré',
              hint: 'Logistique déplacements matchs',
              icon: 'car' as IconName,
              badge: 'Logistique',
            },
            {
              id: 'communication',
              title: 'Canaux Officiels',
              hint: 'Messages bureau · Adhérents',
              icon: 'chat' as IconName,
              badge: 'Diffusion',
            },
            {
              id: 'sponsoring',
              title: 'Sponsoring & Buvette',
              hint: 'Partenaires · Protocole FFF',
              icon: 'gift' as IconName,
              badge: 'Auxiliaire',
            },
          ].map((mod) => (
            <PressableSpring
              key={mod.id}
              onPress={() => shellNav?.requestNav(mod.id as any)}
              style={[styles.hubTile, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
              scaleTo={0.97}
            >
              <View style={styles.hubTileTop}>
                <View style={[styles.hubTileIconBox, { backgroundColor: tokens.accentSoft }]}>
                  <Icon name={mod.icon} size={18} color={tokens.accent} />
                </View>
                <View style={[styles.hubTileBadge, { backgroundColor: tokens.elevated }]}>
                  <ProDayText style={[styles.hubTileBadgeText, { color: tokens.muted }]}>
                    {mod.badge}
                  </ProDayText>
                </View>
              </View>

              <ProDayText style={[styles.hubTileTitle, { color: tokens.foreground }]}>
                {mod.title}
              </ProDayText>
              <ProDayText style={[styles.hubTileHint, { color: tokens.muted }]}>
                {mod.hint}
              </ProDayText>
            </PressableSpring>
          ))}
        </View>

        {/* 6. DEMANDES D'ADHÉSION EN ATTENTE (SI EXISTANTES) */}
        {pendingItems.length > 0 ? (
          <View style={styles.pendingSection}>
            <View style={styles.sectionHeader}>
              <ProDayText style={[styles.sectionTitle, { color: tokens.foreground }]}>
                Adhésions en Attente ({pendingItems.length})
              </ProDayText>
              <ProDayText style={[styles.sectionSubtitle, { color: tokens.muted }]}>
                Dossiers d’inscription à valider par le secrétariat
              </ProDayText>
            </View>

            <View style={styles.pendingList}>
              {pendingItems.map((item) => (
                <View
                  key={item.membership.id}
                  style={[styles.pendingRow, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
                >
                  <View style={{ flex: 1 }}>
                    <ProDayText style={[styles.pendingName, { color: tokens.foreground }]}>
                      {item.name}
                    </ProDayText>
                    <ProDayText style={[styles.pendingCategory, { color: tokens.muted }]}>
                      {item.membership.category ?? 'Joueur'} · Licence FFF en cours
                    </ProDayText>
                  </View>

                  <View style={styles.pendingBtnRow}>
                    <PressableSpring
                      onPress={() => void approveMembership(item.membership.id)}
                      disabled={busyMembershipId === item.membership.id}
                      style={[styles.approveBtn, { backgroundColor: tokens.accent }]}
                      scaleTo={0.96}
                    >
                      <ProDayText style={styles.approveBtnText}>
                        {busyMembershipId === item.membership.id ? '...' : 'Valider'}
                      </ProDayText>
                    </PressableSpring>
                    <PressableSpring
                      onPress={() => void rejectMembership(item.membership.id)}
                      disabled={busyMembershipId === item.membership.id}
                      style={[styles.rejectBtn, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}
                      scaleTo={0.96}
                    >
                      <Icon name="close" size={14} color={tokens.muted} />
                    </PressableSpring>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={{ height: 40 }} />
      </ClubChapterScroll>
    </View>
  );
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    heroCard: {
      borderRadius: clubRadius.lg,
      borderWidth: 1,
      padding: clubSpace.lg,
      marginBottom: 14,
      gap: 16,
      overflow: 'hidden',
    },
    heroTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    crestWrap: {
      width: 60,
      height: 60,
      borderRadius: 16,
      borderWidth: 1.5,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    crestImg: {
      width: '100%',
      height: '100%',
    },
    crestPlaceholder: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    crestLetter: {
      ...APPLE_TYPOGRAPHY.title1,
      fontWeight: '800',
    },
    heroInfo: {
      flex: 1,
      gap: 3,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 2,
    },
    fffBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: 1,
    },
    fffBadgeText: {
      ...APPLE_TYPOGRAPHY.caption1,
      fontWeight: '700',
    },
    seasonBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: 1,
    },
    seasonBadgeText: {
      ...APPLE_TYPOGRAPHY.caption1,
    },
    heroTitle: {
      ...APPLE_TYPOGRAPHY.title2,
    },
    heroSubtitle: {
      ...APPLE_TYPOGRAPHY.footnote,
    },
    quickActionsRow: {
      gap: 8,
      paddingTop: 4,
    },
    actionPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
    },
    actionPillText: {
      ...APPLE_TYPOGRAPHY.footnote,
      fontWeight: '600',
    },
    kpiGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 16,
    },
    kpiCard: {
      flex: 1,
      minWidth: '47%',
      borderRadius: clubRadius.md,
      borderWidth: 1,
      padding: 14,
      gap: 4,
    },
    kpiCardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    kpiStatusBadge: {
      ...APPLE_TYPOGRAPHY.caption1,
      fontWeight: '700',
    },
    kpiNum: {
      ...APPLE_TYPOGRAPHY.title1,
      fontWeight: '800',
    },
    kpiLabel: {
      ...APPLE_TYPOGRAPHY.footnote,
    },
    matchHeroCard: {
      borderRadius: clubRadius.lg,
      borderWidth: 1,
      padding: 16,
      gap: 16,
      marginBottom: 16,
    },
    matchHeroHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    matchBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
    },
    matchBadgeText: {
      ...APPLE_TYPOGRAPHY.caption1,
      fontWeight: '700',
    },
    matchTimeText: {
      ...APPLE_TYPOGRAPHY.footnote,
      fontWeight: '600',
    },
    teamsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingVertical: 8,
    },
    teamCol: {
      alignItems: 'center',
      gap: 6,
      flex: 1,
    },
    teamBadgeBox: {
      width: 48,
      height: 48,
      borderRadius: 14,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    teamBadgeLetter: {
      ...APPLE_TYPOGRAPHY.title2,
      fontWeight: '800',
    },
    teamNameText: {
      ...APPLE_TYPOGRAPHY.subheadline,
      fontWeight: '700',
      textAlign: 'center',
    },
    teamCategoryText: {
      ...APPLE_TYPOGRAPHY.caption1,
      textAlign: 'center',
    },
    vsBox: {
      paddingHorizontal: 8,
    },
    vsText: {
      ...APPLE_TYPOGRAPHY.subheadline,
      fontWeight: '800',
    },
    matchLocationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 12,
      borderTopWidth: 1,
    },
    locItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    locText: {
      ...APPLE_TYPOGRAPHY.caption1,
      fontWeight: '600',
    },
    matchActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    primaryMatchBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: 10,
    },
    primaryMatchBtnText: {
      ...APPLE_TYPOGRAPHY.footnote,
      fontWeight: '700',
      color: '#000000',
    },
    secondaryMatchBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
    },
    secondaryMatchBtnText: {
      ...APPLE_TYPOGRAPHY.footnote,
      fontWeight: '600',
    },
    standingsBannerCard: {
      borderRadius: clubRadius.lg,
      borderWidth: 1,
      padding: 16,
      gap: 12,
      marginBottom: 16,
    },
    standingsBannerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    standingsBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
    },
    standingsBadgeText: {
      ...APPLE_TYPOGRAPHY.caption1,
      fontWeight: '700',
    },
    standingsPosPill: {
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    standingsPosText: {
      ...APPLE_TYPOGRAPHY.caption1,
      fontWeight: '800',
      color: '#10B981',
    },
    standingsBannerMiddle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    standingsClubName: {
      ...APPLE_TYPOGRAPHY.title3,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    standingsSub: {
      ...APPLE_TYPOGRAPHY.footnote,
      marginTop: 2,
    },
    standingsPtsBadge: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
      borderWidth: 1,
    },
    standingsPtsNum: {
      ...APPLE_TYPOGRAPHY.headline,
      fontWeight: '900',
    },
    standingsPtsLabel: {
      ...APPLE_TYPOGRAPHY.caption1,
      fontWeight: '800',
    },
    standingsBannerFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 10,
      borderTopWidth: 1,
      gap: 8,
    },
    standingsFooterText: {
      ...APPLE_TYPOGRAPHY.caption1,
      flex: 1,
    },
    aiBriefCard: {
      borderRadius: clubRadius.lg,
      borderWidth: 1,
      padding: 16,
      gap: 14,
      marginBottom: 20,
    },
    aiBriefHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    aiIconBox: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    aiBriefTitle: {
      ...APPLE_TYPOGRAPHY.headline,
    },
    aiBriefSubtitle: {
      ...APPLE_TYPOGRAPHY.caption1,
      marginTop: 2,
    },
    aiPointsList: {
      gap: 10,
    },
    aiPointRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    aiPointDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginTop: 6,
    },
    aiPointText: {
      ...APPLE_TYPOGRAPHY.footnote,
      flex: 1,
      lineHeight: 18,
    },
    aiActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 12,
      borderTopWidth: 1,
    },
    aiActionBtnText: {
      ...APPLE_TYPOGRAPHY.footnote,
      fontWeight: '600',
    },
    sectionHeader: {
      marginBottom: 12,
    },
    sectionTitle: {
      ...APPLE_TYPOGRAPHY.title3,
    },
    sectionSubtitle: {
      ...APPLE_TYPOGRAPHY.footnote,
      marginTop: 2,
    },
    hubGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 20,
    },
    hubTile: {
      width: '48.5%',
      borderRadius: clubRadius.md,
      borderWidth: 1,
      padding: 14,
      gap: 6,
    },
    hubTileTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    hubTileIconBox: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    hubTileBadge: {
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 6,
    },
    hubTileBadgeText: {
      ...APPLE_TYPOGRAPHY.caption1,
      fontWeight: '600',
    },
    hubTileTitle: {
      ...APPLE_TYPOGRAPHY.subheadline,
      fontWeight: '700',
    },
    hubTileHint: {
      ...APPLE_TYPOGRAPHY.caption1,
    },
    pendingSection: {
      gap: 12,
      marginBottom: 20,
    },
    pendingList: {
      gap: 8,
    },
    pendingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 14,
      borderRadius: clubRadius.md,
      borderWidth: 1,
    },
    pendingName: {
      ...APPLE_TYPOGRAPHY.subheadline,
      fontWeight: '700',
    },
    pendingCategory: {
      ...APPLE_TYPOGRAPHY.caption1,
      marginTop: 2,
    },
    pendingBtnRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    approveBtn: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 8,
    },
    approveBtnText: {
      ...APPLE_TYPOGRAPHY.caption1,
      fontWeight: '700',
      color: '#000000',
    },
    rejectBtn: {
      width: 30,
      height: 30,
      borderRadius: 8,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
