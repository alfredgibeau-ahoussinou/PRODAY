import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Switch, View } from 'react-native';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import {
  ClubActionRow,
  ClubChapterScroll,
  ClubEmptyState,
  ClubLoading,
  ClubScreenHeader,
  ClubSectionCard,
  ClubText,
} from '../../features/club/ui/clubUi';
import { ClubEquipmentMarketPanel } from '../../components/club/ClubEquipmentMarketPanel';
import { ClubEventOrganization } from '../../components/club/ClubEventOrganization';
import {
  staffNotificationsService,
  type StaffNotification,
} from '../../services/staffNotifications.service';
import {
  clubRoleVisibilityService,
  type ClubRoleVisibilityPrefs,
  type ClubVisibilityRoleId,
} from '../../services/clubRoleVisibility.service';
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
  const profile = useSessionProfile();
  const ws = useClubWorkspace();
  const { tokens } = useClubTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<StaffNotification[]>([]);

  const load = useCallback(async () => {
    if (!profile?.uid) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await staffNotificationsService.listForUser(profile.uid, 40);
      const filtered = ws.clubId
        ? list.filter((n) => !n.club_id || n.club_id === ws.clubId)
        : list;
      setItems(filtered);
    } finally {
      setLoading(false);
    }
  }, [profile?.uid, ws.clubId]);

  useEffect(() => {
    void load();
  }, [load]);

  const markRead = async (n: StaffNotification) => {
    try {
      if (!n.read_at) await staffNotificationsService.markRead(n.id);
      await load();
    } catch {
      // best-effort
    }
  };

  if (loading && items.length === 0) {
    return (
      <View style={styles.root}>
        <ClubLoading />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={loading} onRefresh={() => void load()}>
        <ClubScreenHeader title="Notifications" subtitle="Centre d’alertes club" />
        {items.length === 0 ? (
          <ClubEmptyState
            title="Aucune alerte"
            body="Adhésions, invitations inter-clubs, absences et retards apparaîtront ici."
            icon="notifications"
          />
        ) : (
          <ClubSectionCard title={`${items.length} alerte(s)`}>
            {items.map((n) => (
              <ClubActionRow
                key={n.id}
                icon="notifications"
                label={n.title || 'Alerte'}
                hint={`${n.body}${n.read_at ? '' : ' · Non lue'} · ${n.created_at.toLocaleString('fr-FR')}`}
                onPress={() => void markRead(n)}
              />
            ))}
          </ClubSectionCard>
        )}
      </ClubChapterScroll>
    </View>
  );
}

const ROLE_ROWS: { id: ClubVisibilityRoleId; label: string; hint: string }[] = [
  { id: 'admin', label: 'Admin', hint: 'Tout le club' },
  { id: 'dirigeant', label: 'Dirigeant', hint: 'Pilotage & validation' },
  { id: 'ds', label: 'DS', hint: 'Direction sportive' },
  { id: 'coach', label: 'Coach', hint: 'Équipe(s) affectée(s)' },
  { id: 'assistant', label: 'Assistant', hint: 'Aide coach' },
];

export function ClubPermissionsScreen() {
  const ws = useClubWorkspace();
  const { tokens } = useClubTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const [prefs, setPrefs] = useState<ClubRoleVisibilityPrefs | null>(null);

  useEffect(() => {
    if (!ws.clubId) {
      setPrefs(null);
      return;
    }
    void clubRoleVisibilityService.load(ws.clubId).then(setPrefs);
  }, [ws.clubId]);

  const toggle = async (role: ClubVisibilityRoleId, value: boolean) => {
    if (!ws.clubId) {
      Alert.alert('Club requis', 'Liez un club pour enregistrer les permissions.');
      return;
    }
    const next = await clubRoleVisibilityService.setRole(ws.clubId, role, value);
    setPrefs(next);
  };

  return (
    <View style={styles.root}>
      <ClubChapterScroll>
        <ClubScreenHeader title="Permissions" subtitle="Visibilité documents par rôle" />
        <ClubSectionCard>
          {ROLE_ROWS.map((r) => (
            <View key={r.id} style={styles.switchRow}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <ClubText variant="body" style={{ fontWeight: '600' }}>
                  {r.label}
                </ClubText>
                <ClubText variant="caption" muted>
                  {r.hint}
                </ClubText>
              </View>
              <Switch
                value={prefs?.[r.id] ?? true}
                onValueChange={(v) => void toggle(r.id, v)}
                disabled={!ws.clubId || prefs == null}
              />
            </View>
          ))}
        </ClubSectionCard>
        <ClubText variant="caption" muted>
          Préférences enregistrées localement pour ce club. Pas de dossier médical. Les données
          sensibles restent gated selon le rôle compte.
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
