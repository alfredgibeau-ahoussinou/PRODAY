import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, Switch, View } from 'react-native';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import {
  ClubActionRow,
  ClubChapterScroll,
  ClubEmptyState,
  ClubScreenHeader,
  ClubSectionCard,
  ClubText,
} from '../../features/club/ui/clubUi';
import { ClubEquipmentMarketPanel } from '../../components/club/ClubEquipmentMarketPanel';
import { ClubEventOrganization } from '../../components/club/ClubEventOrganization';
import type { ClubNavItemId } from '../../features/club/navigation/clubNavConfig';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';
import type { IconName } from '../../components/ui/iconNames';

function ClubStubShell({
  title,
  subtitle,
  body,
  icon = 'flag',
  children,
}: {
  title: string;
  subtitle: string;
  body: string;
  icon?: IconName;
  children?: React.ReactNode;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  return (
    <View style={styles.root}>
      <ClubChapterScroll>
        <ClubScreenHeader title={title} subtitle={subtitle} />
        <ClubEmptyState title={title} body={body} icon={icon} />
        {children}
      </ClubChapterScroll>
    </View>
  );
}

export function ClubEventsScreen() {
  const profile = useSessionProfile();
  const ws = useClubWorkspace();
  const clubId = ws.clubId;
  const { tokens } = useClubTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  return (
    <View style={styles.root}>
      <ClubChapterScroll>
        <ClubScreenHeader
          title="Événements"
          subtitle="Tournois · poules IA (suggestion)"
        />
        {clubId && profile ? (
          <ClubSectionCard title="Organisation">
            <ClubEventOrganization
              clubId={clubId}
              userId={profile.uid}
              organizerName={profile.display_name}
            />
          </ClubSectionCard>
        ) : (
          <ClubEmptyState
            title="Événements"
            body="Liez un club pour organiser tournois et stages."
            icon="flag"
          />
        )}
        <ClubSectionCard title="Poules IA (stub)">
          <ClubText variant="body" muted>
            Génération de poules proposée — jamais appliquée sans validation humaine.
          </ClubText>
          <ClubActionRow
            icon="star-four-points"
            label="Proposer des poules"
            onPress={() =>
              Alert.alert(
                'Poules IA',
                'Suggestion prête à être revue. Aucune grille ne sera publiée automatiquement.',
              )
            }
          />
        </ClubSectionCard>
      </ClubChapterScroll>
    </View>
  );
}

export function ClubAutomationsScreen() {
  const { tokens } = useClubTheme();
  const [reminders, setReminders] = useState(true);
  const [presence, setPresence] = useState(false);
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  return (
    <View style={styles.root}>
      <ClubChapterScroll>
        <ClubScreenHeader title="Automatisations" subtitle="Rappels & règles simples" />
        <ClubSectionCard>
          <View style={styles.switchRow}>
            <ClubText variant="body">Rappel J-1 match / séance</ClubText>
            <Switch value={reminders} onValueChange={setReminders} />
          </View>
          <View style={styles.switchRow}>
            <ClubText variant="body">Relance présences ouvertes</ClubText>
            <Switch value={presence} onValueChange={setPresence} />
          </View>
          <ClubText variant="caption" muted>
            Les automatisations n’affectent jamais les effectifs sans confirmation.
          </ClubText>
        </ClubSectionCard>
      </ClubChapterScroll>
    </View>
  );
}

export function ClubLicensesScreen() {
  return (
    <ClubStubShell
      title="Licences"
      subtitle="Documents & pièces"
      body="Centralisez licences et documents. Accès filtré par rôle — pas de dossier médical."
      icon="document"
    />
  );
}

export function ClubFinancesScreen() {
  return (
    <ClubStubShell
      title="Finances"
      subtitle="Vue simple"
      body="Cotisations, devis Pack Club et encaissements — interface légère, pas une compta complète."
      icon="bag"
    />
  );
}

export function ClubSponsoringScreen() {
  return (
    <ClubStubShell
      title="Sponsoring"
      subtitle="Partenaires"
      body="Micro-sponsoring et mises en avant partenaires — coquille prête pour la suite."
      icon="gift"
    />
  );
}

export function ClubEquipmentScreen() {
  const profile = useSessionProfile();
  const ws = useClubWorkspace();
  const { tokens } = useClubTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  return (
    <View style={styles.root}>
      <ClubChapterScroll>
        <ClubScreenHeader title="Bourse équipements" subtitle="Échanges entre membres" />
        {ws.clubId && profile ? (
          <ClubEquipmentMarketPanel clubId={ws.clubId} profile={profile} />
        ) : (
          <ClubEmptyState
            title="Bourse"
            body="Liez un club pour publier ou trouver du matériel."
            icon="shirt"
          />
        )}
      </ClubChapterScroll>
    </View>
  );
}

export function ClubNotificationsScreen() {
  return (
    <ClubStubShell
      title="Notifications"
      subtitle="Centre d’alertes"
      body="Adhésions, invitations inter-clubs, absences et rappels — bientôt consolidés ici."
      icon="notifications"
    />
  );
}

export function ClubPermissionsScreen() {
  const roles = [
    { id: 'admin', label: 'Admin', hint: 'Tout le club' },
    { id: 'dirigeant', label: 'Dirigeant', hint: 'Pilotage & validation' },
    { id: 'ds', label: 'DS', hint: 'Direction sportive' },
    { id: 'coach', label: 'Coach', hint: 'Équipe(s) affectée(s)' },
    { id: 'assistant', label: 'Assistant', hint: 'Aide coach' },
  ];
  const { tokens } = useClubTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  return (
    <View style={styles.root}>
      <ClubChapterScroll>
        <ClubScreenHeader title="Permissions" subtitle="Rôles club" />
        <ClubSectionCard>
          {roles.map((r) => (
            <ClubActionRow key={r.id} icon="shield" label={r.label} hint={r.hint} />
          ))}
        </ClubSectionCard>
        <ClubText variant="caption" muted>
          Les données sensibles (documents) restent gated selon le rôle.
        </ClubText>
      </ClubChapterScroll>
    </View>
  );
}

export function renderClubSecondaryStub(id: ClubNavItemId): React.ReactNode | null {
  switch (id) {
    case 'events':
      return <ClubEventsScreen />;
    case 'automations':
      return <ClubAutomationsScreen />;
    case 'licenses':
      return <ClubLicensesScreen />;
    case 'finances':
      return <ClubFinancesScreen />;
    case 'sponsoring':
      return <ClubSponsoringScreen />;
    case 'equipment':
      return <ClubEquipmentScreen />;
    case 'notifications':
      return <ClubNotificationsScreen />;
    case 'permissions':
      return <ClubPermissionsScreen />;
    default:
      return null;
  }
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: tokens.bg },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      paddingVertical: 8,
    },
  });
