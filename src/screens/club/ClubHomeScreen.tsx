/**
 * Pôle Club — Accueil (ClubHomeScreen)
 *
 * Forme : application de référence (captures du 15/09/2026) — titre posé sur le
 * canvas, encart d'identité à lignes d'icônes, rangée de puces d'action, listes
 * groupées à filets en retrait, en-têtes de section avec action alignée à droite.
 *
 * Données : uniquement `useClubWorkspace` (club, équipes, licenciés, adhésions,
 * événements réels). Aucun chiffre de démonstration, aucune valeur inventée :
 * un effectif à 0 s'affiche à 0, un événement absent donne un état vide explicite.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { useClubLogoUpload } from '../../features/club/hooks/useClubLogoUpload';
import { useClubShellNav } from '../../features/club/shell/ClubShellNavContext';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import {
  ClubActionRow,
  ClubChapterScroll,
  ClubEmptyState,
  ClubListGroup,
  ClubLoading,
  ClubPill,
  ClubPillRow,
  ClubSectionHeader,
  ClubSmartCard,
  ClubStatusPill,
  ClubText,
} from '../../features/club/ui/clubUi';
import {
  buildClubHomeTeamCards,
  formatClubHomeMetaLine,
  resolveClubHomePriority,
  resolveClubPresenceAlert,
  resolvePriorityLocationLabel,
  resolvePriorityTeamLabel,
} from '../../features/club/ui/clubHomeAccueilModel';
import { formatMatchClock, formatMatchDay } from '../../features/club/ui/clubMatchesModel';
import { findClubNavItem, type ClubNavItemId } from '../../features/club/navigation/clubNavConfig';
import { membershipsService } from '../../services/memberships.service';
import { listPendingMembershipPlayers } from '../../features/club/ui/clubPlayersModel';
import { PressableSpring, PushScreenTransition } from '../../components/motion';
import { Icon } from '../../components/ui/Icon';
import type { IconName } from '../../components/ui/iconNames';
import { clubForm, clubRadius, clubSpace } from '../../features/club/theme/clubDesignSystem';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';
import { isCoachMatchEvent, isCoachTrainingEvent } from '../../models/TeamEvent';
import { CreateClubScreen } from '../CreateClubScreen';
import { ShellAccountSection } from '../../components/shell/ShellAccountSection';

/** Fenêtre de la carte « Événements » : 7 jours francs, définie et affichée. */
const UPCOMING_WINDOW_DAYS = 7;

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

  const nav = useCallback(
    (id: ClubNavItemId) => {
      shellNav?.requestNav(id);
    },
    [shellNav],
  );

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

  /** Événements à venir dans la fenêtre affichée — calculés, jamais estimés. */
  const upcoming = useMemo(() => {
    const now = Date.now();
    const limit = now + UPCOMING_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    const inWindow = ws.events.filter((e) => {
      const t = e.starts_at ? new Date(e.starts_at).getTime() : Number.NaN;
      return Number.isFinite(t) && t >= now - 30 * 60 * 1000 && t <= limit;
    });
    return {
      total: inWindow.length,
      matches: inWindow.filter(isCoachMatchEvent).length,
      trainings: inWindow.filter(isCoachTrainingEvent).length,
    };
  }, [ws.events]);

  const priority = useMemo(
    () =>
      resolveClubHomePriority({
        todayMatches: ws.todayMatches,
        todayTrainings: ws.todayTrainings,
        events: ws.events,
      }),
    [ws.todayMatches, ws.todayTrainings, ws.events],
  );

  const presence = useMemo(() => resolveClubPresenceAlert(ws.events), [ws.events]);

  const teamCards = useMemo(
    () =>
      buildClubHomeTeamCards(ws.teamRows, 4, (teamId) => {
        shellNav?.setSelectedTeamId?.(teamId);
        shellNav?.requestNav('teams');
      }),
    [ws.teamRows, shellNav],
  );

  const approveMembership = useCallback(
    async (membershipId: string) => {
      if (!profile?.uid) return;
      setBusyMembershipId(membershipId);
      try {
        await membershipsService.approve(membershipId, profile.uid);
        await ws.refresh();
        Alert.alert('Adhésion validée', 'Le licencié est maintenant actif dans les effectifs du club.');
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

  const club = ws.club;
  const clubName = club.name ?? profile?.display_name ?? 'Club';
  const crestLetter = (clubName.trim().charAt(0) || 'C').toUpperCase();
  const teamsCount = ws.teams.length;
  const playersCount = ws.players.length;
  const staffCount = ws.coaches.length;
  const metaLine =
    playersCount + staffCount + teamsCount > 0
      ? formatClubHomeMetaLine(playersCount, staffCount, teamsCount)
      : 'Aucune équipe enregistrée à ce jour';

  /** Lignes d'identité — uniquement des champs renseignés dans le document club. */
  const infoRows: { key: string; icon: IconName; label: string }[] = [];
  if (club.city?.trim()) {
    infoRows.push({ key: 'city', icon: 'location', label: club.city.trim() });
  }
  if (club.fff_division_label?.trim()) {
    infoRows.push({ key: 'division', icon: 'trophy', label: club.fff_division_label.trim() });
  }
  if (club.fff_season?.trim()) {
    infoRows.push({ key: 'season', icon: 'calendar', label: `Saison ${club.fff_season.trim()}` });
  }
  if (club.fff_affiliation_number?.trim()) {
    infoRows.push({
      key: 'affiliation',
      icon: 'shield',
      label: `Affiliation FFF ${club.fff_affiliation_number.trim()}`,
    });
  }

  /** Modules du club — libellés et icônes de la navigation (source unique). */
  const modules: { id: ClubNavItemId; label: string; icon: IconName; hint: string }[] = (
    [
      { id: 'teams' as ClubNavItemId, hint: teamsCount > 0 ? `${teamsCount} équipe${teamsCount > 1 ? 's' : ''}` : 'Aucune équipe créée' },
      { id: 'players' as ClubNavItemId, hint: playersCount > 0 ? `${playersCount} licencié${playersCount > 1 ? 's' : ''}` : 'Aucun licencié rattaché' },
      { id: 'coaches' as ClubNavItemId, hint: staffCount > 0 ? `${staffCount} coach${staffCount > 1 ? 's' : ''}` : 'Aucun coach affecté' },
      {
        id: 'calendar' as ClubNavItemId,
        hint: `${upcoming.total} événement${upcoming.total > 1 ? 's' : ''} sous ${UPCOMING_WINDOW_DAYS} jours`,
      },
      { id: 'matches' as ClubNavItemId, hint: `${upcoming.matches} match${upcoming.matches > 1 ? 's' : ''} programmé${upcoming.matches > 1 ? 's' : ''}` },
      { id: 'trainings' as ClubNavItemId, hint: `${upcoming.trainings} séance${upcoming.trainings > 1 ? 's' : ''} programmée${upcoming.trainings > 1 ? 's' : ''}` },
      { id: 'standings' as ClubNavItemId, hint: 'Championnat officiel & corrections' },
      { id: 'communication' as ClubNavItemId, hint: 'Annonces officielles & groupes' },
    ] as { id: ClubNavItemId; hint: string }[]
  )
    .map((entry) => {
      const item = findClubNavItem(entry.id);
      if (!item) return null;
      return { id: entry.id, label: item.label, icon: item.icon, hint: entry.hint };
    })
    .filter(Boolean) as { id: ClubNavItemId; label: string; icon: IconName; hint: string }[];

  const priorityTeam = resolvePriorityTeamLabel(priority, ws.teamRows);
  const priorityWhere = resolvePriorityLocationLabel(priority);
  const priorityStart = priority.kind === 'calm' ? null : priority.event.starts_at ?? null;
  const priorityWhen = priorityStart ? new Date(priorityStart) : null;

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
        {/* 1. Titre posé sur le canvas (référence : pas de barre d'en-tête). */}
        <View style={styles.titleBlock}>
          <ClubText variant="h1">Accueil</ClubText>
        </View>

        {/* 2. Encart d'identité du club (référence « TON CLUB »). */}
        <ClubSectionHeader
          label="Mon club"
          actionLabel="Réglages"
          onAction={() => nav('club')}
        />
        <View style={styles.identityCard} testID="club-identity-card">
          <View style={styles.identityTop}>
            <PressableSpring
              onPress={logo.canEdit ? () => void logo.pickAndUpload() : undefined}
              scaleTo={0.96}
              haptic={logo.canEdit}
              style={styles.crestWrap}
              accessibilityLabel={logo.canEdit ? 'Changer le logo du club' : undefined}
            >
              {logoUrl ? (
                <Image source={{ uri: logoUrl }} style={styles.crestImg} resizeMode="cover" />
              ) : (
                <View style={styles.crestPlaceholder}>
                  <ClubText variant="h1" style={{ color: tokens.accent }}>
                    {crestLetter}
                  </ClubText>
                </View>
              )}
            </PressableSpring>

            <View style={styles.identityCol}>
              <ClubText variant="h2" numberOfLines={2}>
                {clubName}
              </ClubText>
              <ClubText variant="caption" muted>
                {metaLine}
              </ClubText>
              {club.verified ? (
                <View style={styles.verifiedWrap}>
                  <ClubStatusPill label="Club vérifié" tone="ok" filled />
                </View>
              ) : null}
            </View>
          </View>

          {infoRows.length > 0 ? (
            <View style={styles.identityRows}>
              {infoRows.map((row) => (
                <View key={row.key} style={styles.identityRow}>
                  <Icon name={row.icon} size={17} color={tokens.muted} />
                  <ClubText variant="body" muted style={styles.identityRowText} numberOfLines={1}>
                    {row.label}
                  </ClubText>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {/* 3. Rangée de puces d'action (référence : pilules sous l'encart). */}
        <ClubPillRow>
          <ClubPill label="Annuaire" icon="people" onPress={() => nav('players')} />
          <ClubPill label="Calendrier" icon="calendar" onPress={() => nav('calendar')} />
          <ClubPill label="Annonce" icon="notifications" onPress={() => nav('communication')} />
          {shellNav?.openCreate ? (
            <ClubPill label="Créer" icon="add" onPress={() => shellNav.openCreate?.()} variant="outline" />
          ) : null}
        </ClubPillRow>

        {/* 4. Indicateurs — valeurs réelles, définitions explicites. */}
        <View style={styles.kpiGrid}>
          <ClubSmartCard
            label="Équipes"
            value={teamsCount}
            hint="Équipes rattachées au club"
            icon="football"
            onPress={() => nav('teams')}
            index={0}
          />
          <ClubSmartCard
            label="Licenciés"
            value={playersCount}
            hint="Comptes joueurs rattachés"
            icon="people"
            onPress={() => nav('players')}
            index={1}
          />
          <ClubSmartCard
            label="Adhésions"
            value={ws.pendingMemberships}
            hint="Demandes à valider"
            icon="document"
            tone={ws.pendingMemberships > 0 ? 'warning' : 'default'}
            onPress={() => nav('players')}
            index={2}
          />
          <ClubSmartCard
            label="Convocations"
            value={presence.pendingCount}
            hint={`Réponses manquantes · ${UPCOMING_WINDOW_DAYS} jours`}
            icon="notifications"
            tone={presence.pendingCount > 0 ? 'warning' : 'success'}
            onPress={() => nav(presence.nav)}
            index={3}
          />
        </View>

        {/* 5. Prochain rendez-vous — événement réel du calendrier. */}
        <ClubSectionHeader
          label="Prochain rendez-vous"
          actionLabel="Calendrier"
          onAction={() => nav('calendar')}
        />
        {priority.kind === 'calm' || !priorityWhen ? (
          <ClubEmptyState
            title="Aucun rendez-vous à venir"
            body="Aucun match ni séance n’est programmé pour ce club. Créez un événement pour le voir apparaître ici."
            icon="calendar"
            actionLabel="Ouvrir le calendrier"
            onAction={() => nav('calendar')}
          />
        ) : (
          <View style={styles.nextCard} testID="club-next-event">
            <ClubStatusPill
              label={priority.kind === 'match' ? 'Match' : 'Entraînement'}
              tone={priority.kind === 'match' ? 'accent' : 'ok'}
            />
            <ClubText variant="h3" numberOfLines={2}>
              {priority.event.title?.trim() || (priority.kind === 'match' ? 'Match' : 'Entraînement')}
            </ClubText>
            <View style={styles.nextMeta}>
              <Icon name="time" size={15} color={tokens.muted} />
              <ClubText variant="caption" muted>
                {`${formatMatchDay(priorityWhen)} · ${formatMatchClock(priorityWhen)}`}
                {priorityTeam ? ` · ${priorityTeam}` : ''}
                {priorityWhere ? ` · ${priorityWhere}` : ''}
              </ClubText>
            </View>
            <ClubPillRow>
              <ClubPill
                label={priority.kind === 'match' ? 'Centre match' : 'Feuille de séance'}
                icon="trophy"
                onPress={() => nav(priority.kind === 'match' ? 'matches' : 'trainings')}
              />
            </ClubPillRow>
          </View>
        )}

        {/* 6. Modules — liste groupée de la référence. */}
        <ClubSectionHeader label="Modules du club" actionLabel="Tout voir" onAction={() => nav('plus')} />
        <ClubListGroup>
          {modules.map((mod) => (
            <ClubActionRow
              key={mod.id}
              label={mod.label}
              hint={mod.hint}
              icon={mod.icon}
              onPress={() => nav(mod.id)}
            />
          ))}
        </ClubListGroup>

        {/* 7. Équipes — effectif réel du club. */}
        <ClubSectionHeader label="Équipes" actionLabel="Gérer" onAction={() => nav('teams')} />
        {teamCards.length > 0 ? (
          <ClubListGroup>
            {teamCards.map((team) => (
              <ClubActionRow
                key={team.teamId ?? team.name}
                label={team.name}
                hint={`${team.metaPrimary}${team.metaPrimary ? ' · ' : ''}${team.metaSecondary} · ${team.coachesLabel}`}
                icon="football"
                onPress={team.onPress}
              />
            ))}
          </ClubListGroup>
        ) : (
          <ClubEmptyState
            title="Aucune équipe"
            body="Créez une première équipe pour activer les convocations, le calendrier et les compositions."
            icon="football"
            actionLabel="Créer une équipe"
            onAction={() => nav('teams')}
          />
        )}

        {/* 8. Adhésions en attente — uniquement lorsqu'il y en a. */}
        {pendingItems.length > 0 ? (
          <>
            <ClubSectionHeader label={`Adhésions en attente (${pendingItems.length})`} />
            <ClubListGroup>
              {pendingItems.map((item) => (
                <ClubActionRow
                  key={item.membership.id}
                  label={item.name}
                  hint={item.membership.category ?? 'Catégorie non renseignée'}
                  trailing={
                    <View style={styles.pendingActions}>
                      <PressableSpring
                        onPress={() => void approveMembership(item.membership.id)}
                        disabled={busyMembershipId === item.membership.id}
                        scaleTo={0.96}
                        haptic
                        style={styles.approveBtn}
                        accessibilityLabel={`Valider l’adhésion de ${item.name}`}
                      >
                        <ClubText variant="caption" style={styles.approveLabel}>
                          {busyMembershipId === item.membership.id ? '…' : 'Valider'}
                        </ClubText>
                      </PressableSpring>
                      <PressableSpring
                        onPress={() => void rejectMembership(item.membership.id)}
                        disabled={busyMembershipId === item.membership.id}
                        scaleTo={0.96}
                        haptic
                        style={styles.rejectBtn}
                        accessibilityLabel={`Refuser l’adhésion de ${item.name}`}
                      >
                        <Icon name="close" size={15} color={tokens.muted} />
                      </PressableSpring>
                    </View>
                  }
                />
              ))}
            </ClubListGroup>
          </>
        ) : null}

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

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    /** Titre posé sur le canvas, sans conteneur (référence). */
    titleBlock: {
      paddingTop: clubSpace.sm,
    },
    /** Encart d'identité — aplat, rayon généreux, sans bordure ni ombre. */
    identityCard: {
      backgroundColor: tokens.surface,
      borderRadius: clubForm.groupRadius,
      padding: clubSpace.lg,
      gap: clubSpace.lg,
    },
    identityTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.lg,
    },
    crestWrap: {
      width: 64,
      height: 64,
      borderRadius: clubRadius.md,
      overflow: 'hidden',
      backgroundColor: tokens.elevated,
    },
    crestImg: { width: '100%', height: '100%' },
    crestPlaceholder: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    identityCol: { flex: 1, minWidth: 0, gap: 3 },
    verifiedWrap: { marginTop: 6 },
    identityRows: { gap: clubSpace.md },
    identityRow: { flexDirection: 'row', alignItems: 'center', gap: clubSpace.md },
    identityRowText: { flex: 1, minWidth: 0 },
    kpiGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: clubSpace.md,
    },
    /** Prochain rendez-vous — encart aplat, même famille que la liste groupée. */
    nextCard: {
      backgroundColor: tokens.surface,
      borderRadius: clubForm.groupRadius,
      padding: clubSpace.lg,
      gap: clubSpace.sm,
    },
    nextMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    pendingActions: { flexDirection: 'row', alignItems: 'center', gap: clubSpace.sm },
    approveBtn: {
      paddingHorizontal: clubSpace.lg,
      minHeight: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: clubForm.actionRadius,
      backgroundColor: tokens.accent,
    },
    approveLabel: { color: tokens.onAccent, fontWeight: '700' },
    rejectBtn: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: clubForm.actionRadius,
      borderWidth: 1,
      borderColor: tokens.borderStrong,
    },
  });
