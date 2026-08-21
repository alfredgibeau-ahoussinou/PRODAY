import React from 'react';
import { View } from 'react-native';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { usePresidentFunding } from '../../features/president/hooks/usePresidentFunding';
import { usePresidentHealth } from '../../features/president/hooks/usePresidentHealth';
import { PresidentAiPanel } from '../../features/president/ai/PresidentAiPanel';
import { usePresidentShellNav } from '../../features/president/shell/PresidentShellNavContext';
import { usePresidentTheme } from '../../features/president/shell/PresidentThemeContext';
import {
  PresidentActionRow,
  PresidentChapterScroll,
  PresidentEmptyState,
  PresidentLoading,
  PresidentSectionCard,
  PresidentText,
} from '../../features/president/ui/presidentUi';
import { PresidentSectionScreen } from './PresidentSectionScreen';
import { presidentSpace } from '../../features/president/theme/presidentDesignSystem';

export function PresidentOverviewScreen() {
  const ws = useClubWorkspace();
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
          label: 'Ouvrir la vitrine / hub Club',
          hint: 'Identité, logo, pack',
          icon: 'business',
          clubNav: 'club',
        },
      ]}
    />
  );
}

export function PresidentSportScreen() {
  const ws = useClubWorkspace();
  return (
    <PresidentSectionScreen
      eyebrow="Sportif"
      title="Pilotage sportif"
      subtitle="Matchs, entraînements et structure — gestion dans Club."
      liveLines={[
        `Matchs aujourd’hui : ${ws.todayMatches.length}`,
        `Entraînements aujourd’hui : ${ws.todayTrainings.length}`,
        `Événements récents chargés : ${ws.events.length}`,
        `Équipes sans coach : ${ws.teamsWithoutCoach}`,
      ]}
      links={[
        { label: 'Match Center', icon: 'trophy', clubNav: 'matches' },
        { label: 'Calendrier', icon: 'calendar', clubNav: 'calendar' },
        { label: 'Entraînements', icon: 'time', clubNav: 'trainings' },
        { label: 'Stats Club', icon: 'stats-chart', clubNav: 'stats' },
      ]}
    />
  );
}

export function PresidentFinanceScreen() {
  const ws = useClubWorkspace();
  const { goals, loading } = usePresidentFunding(ws.clubId);
  return (
    <PresidentSectionScreen
      eyebrow="Finances"
      title="Direction financière"
      subtitle="Lecture budgétaire. La saisie opérationnelle reste dans Club."
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
          ? 'Les cotisations détaillées et le budget complet arriveront ici. Les objectifs de financement partagés (sponsors) s’affichent dès qu’ils existent.'
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
            <PresidentText key={g.id} variant="body" muted>
              {g.title} — {g.raised_amount_eur ?? 0} / {g.target_amount_eur ?? 0} €
            </PresidentText>
          ))}
        </PresidentSectionCard>
      ) : null}
    </PresidentSectionScreen>
  );
}

export function PresidentMembersScreen() {
  const ws = useClubWorkspace();
  return (
    <PresidentSectionScreen
      eyebrow="Adhérents"
      title="Licenciés & validations"
      subtitle="Vue direction. Validation et fiches dans le Pôle Club."
      liveLines={[
        `Licenciés (joueurs) : ${ws.players.length}`,
        `Membres club listés : ${ws.members.length}`,
        `Adhésions en attente : ${ws.pendingMemberships}`,
      ]}
      links={[
        { label: 'Joueurs Club', icon: 'people', clubNav: 'players' },
        { label: 'Licences', icon: 'document', clubNav: 'licenses' },
      ]}
    />
  );
}

export function PresidentTeamsScreen() {
  const ws = useClubWorkspace();
  return (
    <PresidentSectionScreen
      eyebrow="Équipes"
      title="Structure sportive"
      subtitle="Pilotage. Création et effectifs dans Club."
      liveLines={
        ws.teamRows.length > 0
          ? ws.teamRows
              .slice(0, 8)
              .map(
                (r) =>
                  `${r.name}${r.category ? ` (${r.category})` : ''} · ${r.licensedCount} licenciés · coach ${r.coachNames[0] ?? '—'}`,
              )
          : undefined
      }
      emptyTitle={ws.teams.length === 0 ? 'Aucune équipe' : undefined}
      emptyBody={
        ws.teams.length === 0
          ? 'Créez vos catégories dans le Pôle Club pour les voir ici.'
          : undefined
      }
      links={[{ label: 'Équipes Club', icon: 'football', clubNav: 'teams' }]}
    />
  );
}

export function PresidentStaffScreen() {
  const ws = useClubWorkspace();
  return (
    <PresidentSectionScreen
      eyebrow="Staff"
      title="Encadrement sportif"
      subtitle="Vue directionnelle — affectations détaillées dans le Pôle Club."
      liveLines={[
        `Encadrants recensés : ${ws.coaches.length}`,
        `Équipes sans coach : ${ws.teamsWithoutCoach}`,
        ...ws.coaches.slice(0, 6).map((c) => c.display_name),
      ]}
      links={[{ label: 'Ouvrir Staff Club', icon: 'school', clubNav: 'coaches' }]}
    />
  );
}

export function PresidentSponsorsScreen() {
  const ws = useClubWorkspace();
  const { goals, loading } = usePresidentFunding(ws.clubId);
  return (
    <PresidentSectionScreen
      eyebrow="Sponsors"
      title="Partenaires & développement"
      subtitle="Objectifs de financement partagés. CRM sponsors à enrichir."
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
          ? 'Les objectifs club_funding_goals et le module sponsoring Club alimenteront cet espace.'
          : undefined
      }
      links={[{ label: 'Sponsoring Club', icon: 'briefcase', clubNav: 'sponsoring' }]}
    />
  );
}

export function PresidentCommunicationScreen() {
  return (
    <PresidentSectionScreen
      eyebrow="Communication"
      title="Annonces & messages"
      subtitle="La direction priorise ; l’envoi se fait dans Club."
      emptyTitle="Pas de fil direction dédié"
      emptyBody="Utilisez la communication Club pour annonces structure et messages."
      links={[
        { label: 'Communication Club', icon: 'chat', clubNav: 'communication' },
        { label: 'Notifications', icon: 'notifications', clubNav: 'notifications' },
      ]}
    />
  );
}

export function PresidentEventsScreen() {
  const ws = useClubWorkspace();
  return (
    <PresidentSectionScreen
      eyebrow="Événements"
      title="Agenda stratégique"
      subtitle="Tournois, réunions, temps forts."
      liveLines={[`Événements chargés : ${ws.events.length}`]}
      links={[
        { label: 'Événements Club', icon: 'flag', clubNav: 'events' },
        { label: 'Calendrier', icon: 'calendar', clubNav: 'calendar' },
      ]}
    />
  );
}

export function PresidentDocumentsScreen() {
  return (
    <PresidentSectionScreen
      eyebrow="Documents"
      title="Bureau & archives"
      subtitle="Espace prêt pour PV, statuts et dossiers."
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
  return (
    <PresidentSectionScreen
      eyebrow="Analyses"
      title="Indicateurs de direction"
      subtitle={`Santé globale ${health.overall}%.`}
      liveLines={health.axes.map((a) => `${a.label} : ${a.score}% — ${a.summary}`)}
      links={[{ label: 'Stats Club', icon: 'stats-chart', clubNav: 'stats' }]}
    />
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
      subtitle="Identité Executive ProDay. Retour au Pôle Club pour l’opérationnel."
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
    />
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
      links={[{ label: 'Sponsoring / objectifs Club', icon: 'flag', clubNav: 'sponsoring' }]}
    />
  );
}

export function PresidentAlertsScreen() {
  const ws = useClubWorkspace();
  const health = usePresidentHealth(ws);
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
        { label: 'Joueurs / validations', icon: 'people', clubNav: 'players' },
      ]}
    />
  );
}
