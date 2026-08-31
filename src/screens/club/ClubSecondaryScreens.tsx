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
  const [matchReminder, setMatchReminder] = useState(true);
  const [trainingReminder, setTrainingReminder] = useState(true);
  const [convocationRelance, setConvocationRelance] = useState(true);
  const [carpoolAlert, setCarpoolAlert] = useState(true);
  const [weatherAlert, setWeatherAlert] = useState(false);

  return (
    <View style={styles.root}>
      <ClubChapterScroll>
        <ClubBrandHeader title="Automatisations & Alertes" subtitle="Règles automatiques pour vos équipes et adhérents" />

        <ClubSectionCard title="Rappels d'Événements">
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <ClubText variant="section" style={{ fontSize: 14 }}>Rappel Match (J-1 à 18h)</ClubText>
              <ClubText variant="caption" muted>Notifie automatiquement tous les convoqués la veille du match.</ClubText>
            </View>
            <Switch
              value={matchReminder}
              onValueChange={setMatchReminder}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: tokens.accent }}
            />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <ClubText variant="section" style={{ fontSize: 14 }}>Rappel Entraînement (H-3)</ClubText>
              <ClubText variant="caption" muted>Alerte les joueurs et parents quelques heures avant le début de séance.</ClubText>
            </View>
            <Switch
              value={trainingReminder}
              onValueChange={setTrainingReminder}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: tokens.accent }}
            />
          </View>
        </ClubSectionCard>

        <ClubSectionCard title="Gestion des Convocations & Covoiturage">
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <ClubText variant="section" style={{ fontSize: 14 }}>Relance Convocations (H-48)</ClubText>
              <ClubText variant="caption" muted>Envoie un rappel aux joueurs n'ayant pas encore répondu présent/absent.</ClubText>
            </View>
            <Switch
              value={convocationRelance}
              onValueChange={setConvocationRelance}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: tokens.accent }}
            />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <ClubText variant="section" style={{ fontSize: 14 }}>Alerte Covoiturage & Départ</ClubText>
              <ClubText variant="caption" muted>Notifie les familles des points de rendez-vous et places restantes.</ClubText>
            </View>
            <Switch
              value={carpoolAlert}
              onValueChange={setCarpoolAlert}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: tokens.accent }}
            />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <ClubText variant="section" style={{ fontSize: 14 }}>Alerte Météo & Arrêté Municipal</ClubText>
              <ClubText variant="caption" muted>Notification d'urgence en cas d'annulation ou terrain impraticable.</ClubText>
            </View>
            <Switch
              value={weatherAlert}
              onValueChange={setWeatherAlert}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: tokens.accent }}
            />
          </View>
        </ClubSectionCard>
      </ClubChapterScroll>
    </View>
  );
}

export function ClubLicensesScreen() {
  const ws = useClubWorkspace();
  const { tokens } = useClubTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  const totalPlayers = ws.players.length;
  const verifiedCount = ws.players.filter((p) => (p.profile as Record<string, unknown> | undefined)?.verification_status === 'verified').length;
  const pendingCount = totalPlayers - verifiedCount;

  return (
    <View style={styles.root}>
      <ClubChapterScroll>
        <ClubBrandHeader title="Licences & Documents" subtitle="Suivi des adhésions, pièces d'identité et certificats" />

        <View style={{ flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 12 }}>
          <View style={{ flex: 1, backgroundColor: tokens.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
            <ClubText variant="caption" muted>Licences Validées</ClubText>
            <ClubText variant="title" style={{ fontSize: 24, fontWeight: '800', color: '#34D399', marginTop: 4 }}>
              {verifiedCount}
            </ClubText>
          </View>
          <View style={{ flex: 1, backgroundColor: tokens.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
            <ClubText variant="caption" muted>En Attente</ClubText>
            <ClubText variant="title" style={{ fontSize: 24, fontWeight: '800', color: '#FBBF24', marginTop: 4 }}>
              {pendingCount}
            </ClubText>
          </View>
        </View>

        <ClubSectionCard title="Contrôle des Adhésions">
          {ws.players.length === 0 ? (
            <ClubEmptyState title="Aucun joueur" body="Les joueurs inscrits à votre club apparaîtront ici." icon="document" />
          ) : (
            ws.players.slice(0, 10).map((player) => {
              const isVerified = (player.profile as Record<string, unknown> | undefined)?.verification_status === 'verified';
              return (
                <View key={player.uid} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}>
                  <View style={{ flex: 1 }}>
                    <ClubText variant="section" style={{ fontSize: 14 }}>{player.display_name || 'Joueur'}</ClubText>
                    <ClubText variant="caption" muted>{player.email}</ClubText>
                  </View>
                  <View style={{ backgroundColor: isVerified ? 'rgba(52, 211, 153, 0.15)' : 'rgba(251, 191, 36, 0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
                    <ClubText variant="caption" style={{ color: isVerified ? '#34D399' : '#FBBF24', fontWeight: '700', fontSize: 11 }}>
                      {isVerified ? 'Valide' : 'À vérifier'}
                    </ClubText>
                  </View>
                </View>
              );
            })
          )}
        </ClubSectionCard>
      </ClubChapterScroll>
    </View>
  );
}

export function ClubFinancesScreen() {
  const ws = useClubWorkspace();
  return <ClubFinanceLedgerPanel clubId={ws.clubId} />;
}

export function ClubSponsoringScreen() {
  const ws = useClubWorkspace();
  const { tokens } = useClubTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  const packages = [
    { title: 'Sponsor Titre / Maillot', price: '2 500 € / an', desc: 'Logo principal face avant maillots + visibilité match day', tone: '#FBBF24' },
    { title: 'Sponsor Équipement / Veste', price: '1 200 € / an', desc: 'Logo manche ou dos + bannières stade', tone: '#60A5FA' },
    { title: 'Partenaire Local & Événementiel', price: '500 € / an', desc: 'Présence tournois club, page web vitrine et réseaux', tone: '#34D399' },
  ];

  return (
    <View style={styles.root}>
      <ClubChapterScroll>
        <ClubBrandHeader title="Sponsoring & Partenariats" subtitle="Offres de visibilité, packages maillots et mécénat club" />

        <ClubSectionCard title="Packages de Visibilité Club">
          {packages.map((pkg, i) => (
            <View key={pkg.title} style={{ padding: 14, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, marginTop: i > 0 ? 10 : 0, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <ClubText variant="section" style={{ fontSize: 14, color: pkg.tone, fontWeight: '800' }}>
                  {pkg.title}
                </ClubText>
                <ClubText variant="section" style={{ fontSize: 13, fontWeight: '700' }}>
                  {pkg.price}
                </ClubText>
              </View>
              <ClubText variant="caption" muted>{pkg.desc}</ClubText>
            </View>
          ))}
        </ClubSectionCard>

        <ClubSectionCard title="Demande de Devis Sponsor">
          <ClubText variant="body" muted>
            Les entreprises locales peuvent directement souscrire ou vous contacter via la vitrine de votre club sur ProDay.
          </ClubText>
          <ClubActionRow
            icon="gift"
            label="Générer un dossier de sponsoring"
            hint="Format PDF récapitulatif pour les entreprises"
            onPress={() =>
              Alert.alert(
                'Dossier Sponsoring',
                'Le dossier sponsoring de votre club est accessible et personnalisable depuis la vitrine ProDay.',
              )
            }
          />
        </ClubSectionCard>
      </ClubChapterScroll>
    </View>
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
