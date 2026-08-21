import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { CLUB_VIDEO_PROVIDERS } from '../../features/club/video/ClubVideoProvider';
import { usePresidentFunding } from '../../features/president/hooks/usePresidentFunding';
import { usePresidentHealth } from '../../features/president/hooks/usePresidentHealth';
import { PresidentAiPanel } from '../../features/president/ai/PresidentAiPanel';
import { usePresidentShellNav } from '../../features/president/shell/PresidentShellNavContext';
import { usePresidentTheme } from '../../features/president/shell/PresidentThemeContext';
import {
  PresidentActionRow,
  PresidentEmptyState,
  PresidentLoading,
  PresidentSectionCard,
  PresidentText,
} from '../../features/president/ui/presidentUi';
import { PresidentSectionScreen } from './PresidentSectionScreen';
import { presidentSpace } from '../../features/president/theme/presidentDesignSystem';
import { isCoachMatchEvent } from '../../models/TeamEvent';

function formatEventWhen(startsAt?: Date | string | null): string {
  if (!startsAt) return 'Date à confirmer';
  const d = startsAt instanceof Date ? startsAt : new Date(startsAt);
  if (Number.isNaN(d.getTime())) return 'Date à confirmer';
  return d.toLocaleString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PresidentOverviewScreen() {
  const ws = useClubWorkspace();
  const shellNav = usePresidentShellNav();
  return (
    <PresidentSectionScreen
      eyebrow="Mon club"
      title={ws.club?.name ?? 'Vue club'}
      subtitle="Identité, structure et statut — lecture directionnelle."
      liveLines={[
        `Ville : ${[ws.club?.city, ws.club?.department].filter(Boolean).join(' · ') || '—'}`,
        `Vérifié : ${ws.club?.verified ? 'oui' : 'non'}`,
        `Statut opérationnel : ${ws.statusLabel}`,
        `${ws.teams.length} équipes · ${ws.players.length} licenciés · ${ws.coaches.length} coachs`,
      ]}
      links={[
        {
          label: 'Ouvrir la vitrine Club',
          hint: 'Identité, logo, pack',
          icon: 'business',
          clubNav: 'club',
        },
      ]}
    >
      <PresidentSectionCard eyebrow="Pilotage" title="Continuer dans le pôle">
        <PresidentActionRow
          label="Équipes"
          hint="Structure sportive"
          icon="football"
          accent
          onPress={() => shellNav?.requestNav('teams')}
        />
        <PresidentActionRow
          label="Adhérents"
          hint={
            ws.pendingMemberships > 0
              ? `${ws.pendingMemberships} validation(s) en attente`
              : 'Licenciés & validations'
          }
          icon="people"
          onPress={() => shellNav?.requestNav('members')}
        />
        <PresidentActionRow
          label="Sportif"
          hint="Matchs & entraînements du jour"
          icon="trophy"
          onPress={() => shellNav?.requestNav('sport')}
        />
      </PresidentSectionCard>
    </PresidentSectionScreen>
  );
}

export function PresidentSportScreen() {
  const ws = useClubWorkspace();
  const shellNav = usePresidentShellNav();
  const upcomingMatches = useMemo(
    () =>
      ws.events
        .filter((e) => isCoachMatchEvent(e))
        .slice(0, 8),
    [ws.events],
  );
  return (
    <PresidentSectionScreen
      eyebrow="Sportif"
      title="Pilotage sportif"
      subtitle="Matchs, entraînements et rythme de la semaine — vue direction."
      liveLines={[
        `Matchs aujourd’hui : ${ws.todayMatches.length}`,
        `Entraînements aujourd’hui : ${ws.todayTrainings.length}`,
        `Événements récents chargés : ${ws.events.length}`,
        `Équipes sans coach : ${ws.teamsWithoutCoach}`,
      ]}
      links={[
        { label: 'Match Center Club', icon: 'trophy', clubNav: 'matches' },
        { label: 'Calendrier Club', icon: 'calendar', clubNav: 'calendar' },
      ]}
    >
      <PresidentSectionCard eyebrow="Aujourd’hui" title="Terrain">
        {ws.todayMatches.length === 0 && ws.todayTrainings.length === 0 ? (
          <PresidentText variant="body" muted>
            Aucun match ni entraînement aujourd’hui.
          </PresidentText>
        ) : (
          <>
            {ws.todayMatches.map((m) => (
              <PresidentActionRow
                key={m.id}
                label={m.title || 'Match'}
                hint={formatEventWhen(m.starts_at)}
                icon="trophy"
              />
            ))}
            {ws.todayTrainings.map((t) => (
              <PresidentActionRow
                key={t.id}
                label={t.title || 'Entraînement'}
                hint={formatEventWhen(t.starts_at)}
                icon="time"
              />
            ))}
          </>
        )}
      </PresidentSectionCard>
      <PresidentSectionCard eyebrow="À venir" title="Prochains matchs">
        {upcomingMatches.length === 0 ? (
          <PresidentText variant="body" muted>
            Aucun match chargé pour le moment.
          </PresidentText>
        ) : (
          upcomingMatches.map((m) => (
            <PresidentActionRow
              key={m.id}
              label={m.title || 'Match'}
              hint={formatEventWhen(m.starts_at)}
              icon="trophy"
            />
          ))
        )}
      </PresidentSectionCard>
      <PresidentSectionCard title="Sections liées">
        <PresidentActionRow
          label="Équipes"
          hint="Structure & effectifs"
          icon="football"
          accent
          onPress={() => shellNav?.requestNav('teams')}
        />
        <PresidentActionRow
          label="Saison"
          hint="Calendrier stratégique"
          icon="calendar"
          onPress={() => shellNav?.requestNav('season')}
        />
      </PresidentSectionCard>
    </PresidentSectionScreen>
  );
}

export function PresidentFinanceScreen() {
  const ws = useClubWorkspace();
  const { goals, loading } = usePresidentFunding(ws.clubId);
  return (
    <PresidentSectionScreen
      eyebrow="Finances"
      title="Direction financière"
      subtitle="Lecture budgétaire et objectifs de financement partagés."
      liveLines={
        loading
          ? ['Chargement des objectifs de financement…']
          : goals.length > 0
            ? goals.slice(0, 5).map(
                (g) =>
                  `${g.title} : ${g.raised_amount_eur ?? 0} / ${g.target_amount_eur ?? 0} €`,
              )
            : undefined
      }
      emptyTitle={goals.length === 0 && !loading ? 'Pas encore de ledger club' : undefined}
      emptyBody={
        goals.length === 0 && !loading
          ? 'Les cotisations détaillées arriveront ici. Les objectifs de financement s’affichent dès qu’ils existent.'
          : undefined
      }
      links={[
        { label: 'Finances Club', icon: 'stats-chart', clubNav: 'finances' },
        { label: 'Sponsoring Club', icon: 'gift', clubNav: 'sponsoring' },
      ]}
    >
      {goals.length > 0 ? (
        <PresidentSectionCard eyebrow="Objectifs" title="Financement club">
          {goals.map((g) => (
            <PresidentActionRow
              key={g.id}
              label={g.title}
              hint={`${g.raised_amount_eur ?? 0} / ${g.target_amount_eur ?? 0} €`}
              icon="stats-chart"
            />
          ))}
        </PresidentSectionCard>
      ) : null}
    </PresidentSectionScreen>
  );
}

export function PresidentMembersScreen() {
  const ws = useClubWorkspace();
  const pending = useMemo(
    () => ws.memberships.filter((m) => m.status === 'pending').slice(0, 8),
    [ws.memberships],
  );
  const recentPlayers = useMemo(() => ws.players.slice(0, 10), [ws.players]);

  return (
    <PresidentSectionScreen
      eyebrow="Adhérents"
      title="Licenciés & validations"
      subtitle="Vue direction sur le vivier licencié et les demandes en attente."
      liveLines={[
        `Licenciés (joueurs) : ${ws.players.length}`,
        `Membres club listés : ${ws.members.length}`,
        `Adhésions en attente : ${ws.pendingMemberships}`,
      ]}
      links={[
        { label: 'Joueurs Club', icon: 'people', clubNav: 'players' },
        { label: 'Licences Club', icon: 'document', clubNav: 'licenses' },
      ]}
    >
      <PresidentSectionCard eyebrow="Priorité" title="Validations en attente">
        {pending.length === 0 ? (
          <PresidentText variant="body" muted>
            Aucune adhésion en attente.
          </PresidentText>
        ) : (
          pending.map((m) => (
            <PresidentActionRow
              key={m.id}
              label={m.player_name || m.player_uid.slice(0, 8)}
              hint={`Statut · ${m.status}`}
              icon="people"
            />
          ))
        )}
      </PresidentSectionCard>
      <PresidentSectionCard eyebrow="Effectif" title="Licenciés">
        {recentPlayers.length === 0 ? (
          <PresidentEmptyState
            title="Aucun licencié"
            body="Les joueurs rattachés au club apparaîtront ici."
          />
        ) : (
          recentPlayers.map((p) => (
            <PresidentActionRow
              key={p.uid}
              label={p.display_name}
              hint={p.email || 'Licencié'}
              icon="person"
            />
          ))
        )}
      </PresidentSectionCard>
    </PresidentSectionScreen>
  );
}

export function PresidentTeamsScreen() {
  const ws = useClubWorkspace();
  return (
    <PresidentSectionScreen
      eyebrow="Équipes"
      title="Structure sportive"
      subtitle="Catégories, effectifs et encadrement — lecture exécutive."
      liveLines={[
        `${ws.teams.length} équipe${ws.teams.length > 1 ? 's' : ''}`,
        `Sans coach : ${ws.teamsWithoutCoach}`,
      ]}
      links={[{ label: 'Équipes Club', icon: 'football', clubNav: 'teams' }]}
    >
      <PresidentSectionCard eyebrow="Structure" title="Équipes du club">
        {ws.teamRows.length === 0 ? (
          <PresidentEmptyState
            title="Aucune équipe"
            body="Créez vos catégories dans le Pôle Club pour les voir ici."
          />
        ) : (
          ws.teamRows.map((r) => (
            <PresidentActionRow
              key={r.teamId}
              label={r.name}
              hint={`${r.category ? `${r.category} · ` : ''}${r.licensedCount} licenciés · coach ${r.coachNames[0] ?? '—'}`}
              icon="football"
            />
          ))
        )}
      </PresidentSectionCard>
    </PresidentSectionScreen>
  );
}

export function PresidentStaffScreen() {
  const ws = useClubWorkspace();
  const orphanTeams = useMemo(
    () => ws.teamRows.filter((r) => !r.coachNames[0]).slice(0, 8),
    [ws.teamRows],
  );
  return (
    <PresidentSectionScreen
      eyebrow="Staff"
      title="Encadrement sportif"
      subtitle="Coachs et équipes encore sans responsable."
      liveLines={[
        `Encadrants recensés : ${ws.coaches.length}`,
        `Équipes sans coach : ${ws.teamsWithoutCoach}`,
      ]}
      links={[{ label: 'Staff Club', icon: 'school', clubNav: 'coaches' }]}
    >
      <PresidentSectionCard eyebrow="Encadrement" title="Coachs">
        {ws.coaches.length === 0 ? (
          <PresidentText variant="body" muted>
            Aucun coach listé pour le moment.
          </PresidentText>
        ) : (
          ws.coaches.map((c) => (
            <PresidentActionRow
              key={c.uid}
              label={c.display_name}
              hint={c.email || 'Coach'}
              icon="school"
            />
          ))
        )}
      </PresidentSectionCard>
      {orphanTeams.length > 0 ? (
        <PresidentSectionCard eyebrow="Attention" title="Équipes sans coach">
          {orphanTeams.map((r) => (
            <PresidentActionRow
              key={r.teamId}
              label={r.name}
              hint={r.category || 'Affectation manquante'}
              icon="warning"
            />
          ))}
        </PresidentSectionCard>
      ) : null}
    </PresidentSectionScreen>
  );
}

export function PresidentSponsorsScreen() {
  const ws = useClubWorkspace();
  const { goals, loading } = usePresidentFunding(ws.clubId);
  return (
    <PresidentSectionScreen
      eyebrow="Sponsors"
      title="Partenaires & développement"
      subtitle="Objectifs de financement partagés — lecture directionnelle."
      liveLines={
        loading
          ? ['Chargement…']
          : goals.length > 0
            ? [`${goals.length} objectif${goals.length > 1 ? 's' : ''} de financement`]
            : undefined
      }
      emptyTitle={!loading && goals.length === 0 ? 'Aucun partenaire listé' : undefined}
      emptyBody={
        !loading && goals.length === 0
          ? 'Les objectifs club_funding_goals alimenteront cet espace dès création.'
          : undefined
      }
      links={[{ label: 'Sponsoring Club', icon: 'briefcase', clubNav: 'sponsoring' }]}
    >
      {goals.length > 0 ? (
        <PresidentSectionCard eyebrow="Partenaires" title="Objectifs actifs">
          {goals.map((g) => (
            <PresidentActionRow
              key={g.id}
              label={g.title}
              hint={`${g.raised_amount_eur ?? 0} / ${g.target_amount_eur ?? 0} €`}
              icon="briefcase"
            />
          ))}
        </PresidentSectionCard>
      ) : null}
    </PresidentSectionScreen>
  );
}

export function PresidentCommunicationScreen() {
  const ws = useClubWorkspace();
  const shellNav = usePresidentShellNav();
  return (
    <PresidentSectionScreen
      eyebrow="Communication"
      title="Annonces & messages"
      subtitle="Priorités de diffusion pour la direction — le détail d’envoi reste opérationnel."
      liveLines={[
        `Événements à communiquer : ${ws.events.length}`,
        `Alertes / todos : ${ws.todoCount}`,
        ws.briefingHeadline ? `Brief : ${ws.briefingHeadline}` : 'Brief club disponible dès données',
      ]}
      links={[
        { label: 'Communication Club', icon: 'chat', clubNav: 'communication' },
        { label: 'Notifications Club', icon: 'notifications', clubNav: 'notifications' },
      ]}
    >
      <PresidentSectionCard eyebrow="À diffuser" title="Signaux direction">
        {ws.briefingSummary ? (
          <PresidentText variant="body" muted>
            {ws.briefingSummary}
          </PresidentText>
        ) : (
          <PresidentText variant="body" muted>
            Aucun brief éditorial pour le moment.
          </PresidentText>
        )}
        <PresidentActionRow
          label="Voir les alertes"
          hint="Signaux prioritaires"
          icon="notifications"
          accent
          onPress={() => shellNav?.requestNav('alerts')}
        />
        <PresidentActionRow
          label="Événements"
          hint="Agenda à annoncer"
          icon="calendar"
          onPress={() => shellNav?.requestNav('events')}
        />
      </PresidentSectionCard>
    </PresidentSectionScreen>
  );
}

export function PresidentEventsScreen() {
  const ws = useClubWorkspace();
  const list = useMemo(() => ws.events.slice(0, 12), [ws.events]);
  return (
    <PresidentSectionScreen
      eyebrow="Événements"
      title="Agenda stratégique"
      subtitle="Tournois, réunions et temps forts du club."
      liveLines={[`Événements chargés : ${ws.events.length}`]}
      links={[
        { label: 'Événements Club', icon: 'flag', clubNav: 'events' },
        { label: 'Calendrier Club', icon: 'calendar', clubNav: 'calendar' },
      ]}
    >
      <PresidentSectionCard eyebrow="Agenda" title="Prochains temps forts">
        {list.length === 0 ? (
          <PresidentEmptyState
            title="Aucun événement"
            body="Les événements club apparaîtront ici dès qu’ils sont planifiés."
          />
        ) : (
          list.map((e) => (
            <PresidentActionRow
              key={e.id}
              label={e.title || 'Événement'}
              hint={formatEventWhen(e.starts_at)}
              icon="calendar"
            />
          ))
        )}
      </PresidentSectionCard>
    </PresidentSectionScreen>
  );
}

export function PresidentRecruitmentScreen() {
  const ws = useClubWorkspace();
  const shellNav = usePresidentShellNav();
  const vivier = useMemo(() => ws.players.slice(0, 10), [ws.players]);
  return (
    <PresidentSectionScreen
      eyebrow="Recrutement"
      title="Vivier & suivi"
      subtitle="Lecture directionnelle du bassin interne — le kanban détaillé reste en Club."
      liveLines={[
        `Licenciés (vivier) : ${ws.players.length}`,
        `Coachs : ${ws.coaches.length}`,
        `Adhésions en attente : ${ws.pendingMemberships}`,
        `Équipes sans coach : ${ws.teamsWithoutCoach}`,
      ]}
      links={[{ label: 'Recrutement Club', icon: 'briefcase', clubNav: 'recruitment' }]}
    >
      <PresidentSectionCard eyebrow="Interne" title="Vivier licencié">
        {vivier.length === 0 ? (
          <PresidentEmptyState
            title="Vivier vide"
            body="Les joueurs du club constitueront le bassin de recrutement interne."
          />
        ) : (
          vivier.map((p) => (
            <PresidentActionRow
              key={p.uid}
              label={p.display_name}
              hint="Licencié · bassin interne"
              icon="person"
            />
          ))
        )}
      </PresidentSectionCard>
      <PresidentSectionCard title="Actions direction">
        <PresidentActionRow
          label="Adhérents & validations"
          hint={
            ws.pendingMemberships > 0
              ? `${ws.pendingMemberships} en attente`
              : 'Ouvrir la section Adhérents'
          }
          icon="people"
          accent
          onPress={() => shellNav?.requestNav('members')}
        />
        <PresidentActionRow
          label="Staff"
          hint="Équipes sans coach"
          icon="school"
          onPress={() => shellNav?.requestNav('staff')}
        />
      </PresidentSectionCard>
    </PresidentSectionScreen>
  );
}

export function PresidentVideoScreen() {
  const ws = useClubWorkspace();
  return (
    <PresidentSectionScreen
      eyebrow="Vidéo"
      title="Captation club"
      subtitle="Vue direction sur les options de captation — aucun fournisseur imposé."
      liveLines={[
        `Club : ${ws.club?.name ?? '—'}`,
        `Fournisseurs référencés : ${CLUB_VIDEO_PROVIDERS.length}`,
        `Connectés : ${CLUB_VIDEO_PROVIDERS.filter((p) => p.connected).length}`,
      ]}
      links={[{ label: 'Centre vidéo Club', icon: 'videocam', clubNav: 'video' }]}
    >
      <PresidentSectionCard eyebrow="Options" title="Fournisseurs">
        {CLUB_VIDEO_PROVIDERS.map((p) => (
          <PresidentActionRow
            key={p.id}
            label={p.label}
            hint={`${p.description}${p.connected ? ' · connecté' : ' · non connecté'}`}
            icon="videocam"
          />
        ))}
      </PresidentSectionCard>
    </PresidentSectionScreen>
  );
}

export function PresidentDocumentsScreen() {
  return (
    <PresidentSectionScreen
      eyebrow="Documents"
      title="Bureau & archives"
      subtitle="Espace prêt pour PV, statuts et dossiers direction."
      emptyTitle="Documents à brancher"
      emptyBody="Aucun coffre documentaire club n’est encore branché. Structure UI prête pour la suite."
      links={[{ label: 'Permissions Club', icon: 'shield', clubNav: 'permissions' }]}
    />
  );
}

export function PresidentReportsScreen() {
  const shellNav = usePresidentShellNav();
  return (
    <PresidentSectionScreen
      eyebrow="Rapports"
      title="Synthèses de direction"
      subtitle="Brouillons via l’assistant — confirmation humaine obligatoire."
      emptyTitle="Pas d’export automatique"
      emptyBody="Demandez une trame de rapport à l’IA, puis validez avant diffusion."
      links={[]}
    >
      <PresidentSectionCard title="Actions">
        <PresidentActionRow
          label="Préparer un rapport avec l’IA"
          hint="Ouvre l’assistant exécutif"
          icon="star-four-points"
          accent
          onPress={() => shellNav?.requestNav('ai')}
        />
      </PresidentSectionCard>
    </PresidentSectionScreen>
  );
}

export function PresidentInsightsScreen() {
  const ws = useClubWorkspace();
  const health = usePresidentHealth(ws);
  const shellNav = usePresidentShellNav();
  return (
    <PresidentSectionScreen
      eyebrow="Analyses"
      title="Indicateurs de direction"
      subtitle={`Santé globale ${health.overall}%.`}
      liveLines={health.axes.map((a) => `${a.label} : ${a.score}% — ${a.summary}`)}
      links={[{ label: 'Stats Club', icon: 'stats-chart', clubNav: 'stats' }]}
    >
      <PresidentSectionCard title="Approfondir">
        <PresidentActionRow
          label="Cockpit santé"
          hint="Retour à l’accueil exécutif"
          icon="home"
          accent
          onPress={() => shellNav?.requestNav('cockpit')}
        />
        <PresidentActionRow
          label="Alertes"
          hint="Signaux prioritaires"
          icon="notifications"
          onPress={() => shellNav?.requestNav('alerts')}
        />
      </PresidentSectionCard>
    </PresidentSectionScreen>
  );
}

export function PresidentAiScreen() {
  const ws = useClubWorkspace();
  const health = usePresidentHealth(ws);
  const { tokens } = usePresidentTheme();
  if (ws.loading) return <PresidentLoading />;
  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg, padding: presidentSpace.lg }}>
      <PresidentText variant="label" champagne>
        IA exécutive
      </PresidentText>
      <PresidentText variant="h1" style={{ marginBottom: presidentSpace.md }}>
        Assistant Président
      </PresidentText>
      <PresidentAiPanel workspace={ws} insights={health.insights} />
    </View>
  );
}

export function PresidentSettingsScreen() {
  const shellNav = usePresidentShellNav();
  return (
    <PresidentSectionScreen
      eyebrow="Paramètres"
      title="Pôle Président"
      subtitle="Identité Executive ProDay. Retour au Pôle Club pour l’opérationnel quotidien."
      links={[
        { label: 'Permissions Club', icon: 'shield', clubNav: 'permissions' },
        { label: 'Hub Club', icon: 'business', clubNav: 'club' },
      ]}
    >
      <PresidentSectionCard title="Navigation">
        <PresidentActionRow
          label="Retourner au Pôle Club"
          hint="Gestion quotidienne terrain"
          icon="football"
          accent
          onPress={() => shellNav?.exitToClub?.()}
        />
      </PresidentSectionCard>
    </PresidentSectionScreen>
  );
}

export function PresidentBoardScreen() {
  return (
    <PresidentSectionScreen
      eyebrow="Comité"
      title="Bureau dirigeant"
      subtitle="Composition du comité — structure prête."
      emptyTitle="Comité non renseigné"
      emptyBody="Ajoutez bientôt président, trésorier, secrétaire. Aucune donnée dupliquée : rattachement au club."
      links={[{ label: 'Hub Club', icon: 'people', clubNav: 'club' }]}
    />
  );
}

export function PresidentSeasonScreen() {
  const ws = useClubWorkspace();
  const shellNav = usePresidentShellNav();
  const highlights = useMemo(() => ws.events.slice(0, 8), [ws.events]);
  return (
    <PresidentSectionScreen
      eyebrow="Saison"
      title="Calendrier stratégique"
      subtitle="Temps forts de la saison en cours."
      liveLines={[
        `Événements suivis : ${ws.events.length}`,
        `Matchs du jour : ${ws.todayMatches.length}`,
      ]}
      links={[{ label: 'Calendrier Club', icon: 'calendar', clubNav: 'calendar' }]}
    >
      <PresidentSectionCard eyebrow="Saison" title="Temps forts">
        {highlights.length === 0 ? (
          <PresidentText variant="body" muted>
            Aucun temps fort chargé.
          </PresidentText>
        ) : (
          highlights.map((e) => (
            <PresidentActionRow
              key={e.id}
              label={e.title || 'Événement'}
              hint={formatEventWhen(e.starts_at)}
              icon="flag"
            />
          ))
        )}
      </PresidentSectionCard>
      <PresidentSectionCard title="Sections liées">
        <PresidentActionRow
          label="Sportif"
          hint="Matchs & entraînements"
          icon="trophy"
          accent
          onPress={() => shellNav?.requestNav('sport')}
        />
        <PresidentActionRow
          label="Événements"
          hint="Agenda complet"
          icon="calendar"
          onPress={() => shellNav?.requestNav('events')}
        />
      </PresidentSectionCard>
    </PresidentSectionScreen>
  );
}

export function PresidentGoalsScreen() {
  const ws = useClubWorkspace();
  const { goals, loading } = usePresidentFunding(ws.clubId);
  return (
    <PresidentSectionScreen
      eyebrow="Objectifs"
      title="Cibles de direction"
      subtitle="Objectifs de financement club + cibles sportives à venir."
      liveLines={
        loading
          ? ['Chargement…']
          : goals.length > 0
            ? goals.map((g) => g.title)
            : undefined
      }
      emptyTitle={!loading && goals.length === 0 ? 'Aucun objectif enregistré' : undefined}
      emptyBody={
        !loading && goals.length === 0
          ? 'Les objectifs sportifs / admin seront branchés ici. Les funding goals existants s’affichent dès création.'
          : undefined
      }
      links={[{ label: 'Sponsoring Club', icon: 'flag', clubNav: 'sponsoring' }]}
    >
      {goals.length > 0 ? (
        <PresidentSectionCard eyebrow="Cibles" title="Objectifs actifs">
          {goals.map((g) => (
            <PresidentActionRow
              key={g.id}
              label={g.title}
              hint={`${g.raised_amount_eur ?? 0} / ${g.target_amount_eur ?? 0} €`}
              icon="flag"
            />
          ))}
        </PresidentSectionCard>
      ) : null}
    </PresidentSectionScreen>
  );
}

export function PresidentAlertsScreen() {
  const ws = useClubWorkspace();
  const health = usePresidentHealth(ws);
  const shellNav = usePresidentShellNav();
  const alerts = [
    ...health.insights,
    ...(ws.pendingMemberships > 0
      ? [`${ws.pendingMemberships} adhésion(s) en attente`]
      : []),
    ...(ws.teamsWithoutCoach > 0
      ? [`${ws.teamsWithoutCoach} équipe(s) sans coach`]
      : []),
  ];
  return (
    <PresidentSectionScreen
      eyebrow="Alertes"
      title="Signaux prioritaires"
      subtitle="Ce qui demande une décision de direction."
      liveLines={alerts.length > 0 ? alerts : undefined}
      emptyTitle={alerts.length === 0 ? 'Aucune alerte' : undefined}
      emptyBody={
        alerts.length === 0
          ? 'Votre cockpit ne signale rien d’urgent pour le moment.'
          : undefined
      }
      links={[
        { label: 'Notifications Club', icon: 'notifications', clubNav: 'notifications' },
      ]}
    >
      <PresidentSectionCard title="Traiter dans le pôle">
        <PresidentActionRow
          label="Adhérents"
          hint="Validations"
          icon="people"
          accent
          onPress={() => shellNav?.requestNav('members')}
        />
        <PresidentActionRow
          label="Staff"
          hint="Équipes sans coach"
          icon="school"
          onPress={() => shellNav?.requestNav('staff')}
        />
        <PresidentActionRow
          label="Recrutement"
          hint="Vivier & suivi"
          icon="briefcase"
          onPress={() => shellNav?.requestNav('recruitment')}
        />
      </PresidentSectionCard>
    </PresidentSectionScreen>
  );
}
