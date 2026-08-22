import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Switch, View } from 'react-native';
import { PressableSpring } from '../../components/motion';
import { Icon } from '../../components/ui/Icon';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import { useClubShellNav } from '../../features/club/shell/ClubShellNavContext';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import {
  ClubActionRow,
  ClubChapterScroll,
  ClubEmptyState,
  ClubLoading,
  ClubSectionCard,
  ClubText,
} from '../../features/club/ui/clubUi';
import { ClubBrandHeader } from '../../features/club/ui/ClubBrandHeader';
import {
  ClubNotifDeliveryNote,
  ClubNotifListCard,
} from '../../features/club/ui/ClubNotifChrome';
import { ClubEquipmentMarketPanel } from '../../components/club/ClubEquipmentMarketPanel';
import { ClubEventOrganization } from '../../components/club/ClubEventOrganization';
import { ClubFinanceLedgerPanel } from '../../components/club/ClubFinanceLedgerPanel';
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
import { clubSpace } from '../../features/club/theme/clubDesignSystem';
import {
  STAFF_NOTIF_DELIVERY_HINT,
  staffNotificationRoute,
  staffNotifsSubtitle,
} from '../../utils/staffNotificationRouting';
import { clubTournamentPoolsHonesty } from '../../utils/aiUxHonesty';

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
        <ClubBrandHeader title={title} subtitle={subtitle} />
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
  const poolsHonesty = clubTournamentPoolsHonesty();

  return (
    <View style={styles.root}>
      <ClubChapterScroll>
        <ClubBrandHeader
          title="Événements"
          subtitle="Tournois · organisation · poules"
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
        <ClubSectionCard title={poolsHonesty.title}>
          <ClubText variant="body" muted>
            {poolsHonesty.body}
          </ClubText>
          <ClubActionRow
            icon="flag"
            label={poolsHonesty.cta}
            hint={poolsHonesty.hint}
            onPress={() =>
              Alert.alert(
                poolsHonesty.title,
                'Dans Organisation, créez un tournoi club puis utilisez « Générer poules & calendrier ». Aucune grille n’est inventée hors de ce flux.',
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
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  return (
    <View style={styles.root}>
      <ClubChapterScroll>
        <ClubBrandHeader title="Automatisations" subtitle="Rappels & règles" />
        <ClubEmptyState
          title="Automatisations club"
          body="Les règles club (rappel J-1, relance présences) seront configurables ici. Aujourd’hui les rappels push passent déjà par les Cloud Functions déployées — aucun interrupteur fictif n’est affiché."
          icon="notifications"
        />
      </ClubChapterScroll>
    </View>
  );
}

export function ClubLicensesScreen() {
  return (
    <ClubStubShell
      title="Licences"
      subtitle="Documents & pièces"
      body="Le coffre licences club n’est pas encore branché. Aucun document n’est inventé ici — utilisez le profil / documents joueur pour les pièces individuelles."
      icon="document"
    />
  );
}

export function ClubFinancesScreen() {
  const ws = useClubWorkspace();
  return <ClubFinanceLedgerPanel clubId={ws.clubId} />;
}

export function ClubSponsoringScreen() {
  return (
    <ClubStubShell
      title="Sponsoring"
      subtitle="Partenaires"
      body="Le micro-sponsoring et les mises en avant partenaires arrivent bientôt. Aucune campagne fictive n’est affichée ici."
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
        <ClubBrandHeader title="Bourse équipements" subtitle="Échanges entre membres" />
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
  const shellNav = useClubShellNav();
  const tabNav = useTabNavigation();
  const ws = useClubWorkspace();
  const { tokens } = useClubTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
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

  const openNotif = async (n: StaffNotification) => {
    try {
      if (!n.read_at) await staffNotificationsService.markRead(n.id);
    } catch {
      // best-effort
    }
    const route = staffNotificationRoute(n);
    if (route.kind === 'event') {
      tabNav.openMatchs({
        eventId: route.eventId,
        hubChapter: route.hubChapter,
      });
    } else if (route.kind === 'clubNav') {
      shellNav?.requestNav(route.nav);
    }
    void load();
  };

  const markAll = async () => {
    const unreadIds = items.filter((n) => !n.read_at).map((n) => n.id);
    if (unreadIds.length === 0) return;
    setBusy(true);
    try {
      await staffNotificationsService.markManyRead(unreadIds);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const unread = items.filter((n) => !n.read_at).length;
  const subtitle = staffNotifsSubtitle(unread, items.length);

  if (loading && items.length === 0) {
    return (
      <View style={styles.root}>
        <ClubLoading />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={loading || busy} onRefresh={() => void load()}>
        <ClubBrandHeader title="Notifications" subtitle={subtitle} />

        <View style={styles.shortcutRow}>
          <PressableSpring
            onPress={() => shellNav?.requestNav('communication')}
            scaleTo={0.97}
            haptic
            style={styles.shortcut}
          >
            <Icon name="chat" size={14} color={tokens.accent} />
            <ClubText variant="caption" style={styles.shortcutLabel}>
              Messages
            </ClubText>
          </PressableSpring>
          <PressableSpring
            onPress={() => shellNav?.requestNav('players')}
            scaleTo={0.97}
            haptic
            style={styles.shortcut}
          >
            <Icon name="people" size={14} color={tokens.accent} />
            <ClubText variant="caption" style={styles.shortcutLabel}>
              Joueurs
            </ClubText>
          </PressableSpring>
          <PressableSpring
            onPress={() => void markAll()}
            disabled={unread === 0 || busy}
            scaleTo={0.97}
            haptic
            style={[styles.shortcut, unread === 0 ? styles.shortcutDisabled : null]}
          >
            <Icon name="checkmark-circle" size={14} color={tokens.accent} />
            <ClubText variant="caption" style={styles.shortcutLabel}>
              Tout lire
            </ClubText>
          </PressableSpring>
        </View>

        <ClubNotifDeliveryNote text={STAFF_NOTIF_DELIVERY_HINT} />

        {items.length === 0 ? (
          <ClubEmptyState
            title="Aucune alerte pour l’instant"
            body="Adhésions, invitations inter-clubs, absences et retards apparaîtront ici. Les rappels match restent locaux sur cet appareil."
            actionLabel="Ouvrir Communication"
            onAction={() => shellNav?.requestNav('communication')}
            icon="notifications"
          />
        ) : (
          <View style={styles.list}>
            <View style={styles.listHead}>
              <ClubText variant="label" muted style={styles.listLabel}>
                Inbox
              </ClubText>
              <ClubText variant="caption" muted>
                {items.length}
              </ClubText>
            </View>
            {items.map((n, index) => (
              <ClubNotifListCard
                key={n.id}
                item={n}
                index={index}
                onPress={() => void openNotif(n)}
              />
            ))}
          </View>
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
        <ClubBrandHeader title="Permissions" subtitle="Visibilité documents par rôle" />
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
    root: { flex: 1, backgroundColor: 'transparent' },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      paddingVertical: 8,
    },
    shortcutRow: {
      flexDirection: 'row',
      gap: clubSpace.sm,
      marginBottom: clubSpace.sm,
    },
    shortcut: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: 14,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.borderStrong,
    },
    shortcutDisabled: { opacity: 0.45 },
    shortcutLabel: {
      color: tokens.foreground,
      fontWeight: '800',
    },
    list: { gap: clubSpace.sm, marginTop: clubSpace.md },
    listHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 2,
    },
    listLabel: {
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      fontSize: 11,
    },
  });
