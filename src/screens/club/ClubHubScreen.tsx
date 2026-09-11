import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ClubOffersComparePanel } from '../../components/club/ClubOffersComparePanel';
import { ClubQuoteRequestScreen } from './dashboard/ClubQuoteRequestScreen';
import { useClubShellNav } from '../../features/club/shell/ClubShellNavContext';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import { useClubLogoUpload } from '../../features/club/hooks/useClubLogoUpload';
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
import { ClubBrandColorsPanel } from '../../features/club/ui/ClubBrandColorsPanel';
import {
  ClubHubAlertCard,
  ClubHubIdentityHero,
  ClubHubPackHero,
} from '../../features/club/ui/ClubHubChrome';
import {
  buildClubHubAlerts,
  formatClubHubLocation,
  formatClubHubMetaLine,
  resolveClubHubBrandSourceLabel,
  resolveClubHubPackLabel,
} from '../../features/club/ui/clubHubModel';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';
import { clubRadius, clubShadow, clubSpace } from '../../features/club/theme/clubDesignSystem';
import { PressableSpring } from '../../components/motion';
import { Icon } from '../../components/ui/Icon';
import type { IconName } from '../../components/ui/iconNames';
import { ShellAccountSection } from '../../components/shell/ShellAccountSection';
import { useAccountDeletion } from '../../hooks/useAccountDeletion';

type ExecutiveModuleRow = {
  id: string;
  label: string;
  hint: string;
  icon: IconName;
  onPress: () => void;
  accent?: boolean;
};

/** Hub Club — Identité Obsidian Glass, charte & logo studio, structure & modules exécutifs. */
export function ClubHubScreen() {
  const shellNav = useClubShellNav();
  const { tokens, logoUrl, brand } = useClubTheme();
  const ws = useClubWorkspace();
  const { confirmDeleteAccount } = useAccountDeletion();
  const onBrandUpdated = useCallback(() => {
    void ws.refresh();
  }, [ws.refresh]);
  const logo = useClubLogoUpload(onBrandUpdated);
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  const location = useMemo(
    () => formatClubHubLocation(ws.club?.city, ws.club?.department),
    [ws.club?.city, ws.club?.department],
  );
  const metaLine = useMemo(
    () =>
      formatClubHubMetaLine({
        players: ws.players.length,
        coaches: ws.coaches.length,
        teams: ws.teams.length,
      }),
    [ws.players.length, ws.coaches.length, ws.teams.length],
  );
  const pack = useMemo(
    () => resolveClubHubPackLabel(ws.club?.commercial_offer_id),
    [ws.club?.commercial_offer_id],
  );
  const brandSource = resolveClubHubBrandSourceLabel(brand?.source);
  const alerts = useMemo(
    () =>
      buildClubHubAlerts({
        teamsWithoutCoach: ws.teamsWithoutCoach,
        pendingMemberships: ws.pendingMemberships,
      }),
    [ws.teamsWithoutCoach, ws.pendingMemberships],
  );

  // Grouped Executive Modules
  const governanceRows: ExecutiveModuleRow[] = useMemo(() => {
    const list: ExecutiveModuleRow[] = [
      {
        id: 'finances',
        label: 'Finances & Cotisations',
        hint: 'Trésorerie, adhésions et mouvements',
        icon: 'bag',
        onPress: () => shellNav?.requestNav('finances'),
      },
      {
        id: 'permissions',
        label: 'Rôles & Permissions',
        hint: 'Gestion des droits d’accès et staff',
        icon: 'shield',
        onPress: () => shellNav?.requestNav('permissions'),
      },
      {
        id: 'licenses',
        label: 'Licences & Documents',
        hint: 'Pièces d’identité, certificats et bordereaux',
        icon: 'document',
        onPress: () => shellNav?.requestNav('licenses'),
      },
    ];
    if (shellNav?.openPresident) {
      list.push({
        id: 'president',
        label: 'Pôle Président',
        hint: 'Cockpit exécutif & gouvernance club',
        icon: 'briefcase',
        onPress: () => shellNav.openPresident?.(),
        accent: true,
      });
    }
    return list;
  }, [shellNav]);

  const operationsRows: ExecutiveModuleRow[] = useMemo(
    () => [
      {
        id: 'matches',
        label: 'Matchs & Calendrier',
        hint: 'Rencontres officielles et résultats',
        icon: 'football',
        onPress: () => shellNav?.requestNav('matches'),
      },
      {
        id: 'trainings',
        label: 'Entraînements & Séances',
        hint: 'Planification et suivi des présences',
        icon: 'calendar',
        onPress: () => shellNav?.requestNav('trainings'),
      },
      {
        id: 'events',
        label: 'Événements & Tournois',
        hint: 'Stages vacances, rassemblements et dates clés',
        icon: 'trophy',
        onPress: () => shellNav?.requestNav('events'),
      },
      {
        id: 'communication',
        label: 'Communication Club',
        hint: 'Canaux officiels, alertes et annonces',
        icon: 'chat',
        onPress: () => shellNav?.requestNav('communication'),
      },
    ],
    [shellNav],
  );

  const servicesRows: ExecutiveModuleRow[] = useMemo(
    () => [
      {
        id: 'sponsoring',
        label: 'Sponsors & Partenaires',
        hint: 'Mécénat, contrats et visibilité club',
        icon: 'gift',
        onPress: () => shellNav?.requestNav('sponsoring'),
      },
      {
        id: 'notifications',
        label: 'Notifications & Alertes',
        hint: 'Rappels automatiques et centre d’alertes',
        icon: 'notifications',
        onPress: () => shellNav?.requestNav('notifications'),
      },
    ],
    [shellNav],
  );

  if (ws.loading) return <ClubLoading />;

  if (!ws.clubId || !ws.club) {
    return (
      <View style={styles.root}>
        <ClubChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
          <ClubHubIdentityHero
            clubName="Votre club"
            statusLabel="Hors club"
            statusTone="warn"
            verified={false}
          />
          <ClubEmptyState
            title="Aucun club rattaché"
            body="Rattachez un club à votre compte pour gérer crest, pack, permissions et structure."
            icon="football"
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
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
        {/* Executive Identity Hero with Integrated 3-Stat Counters Dock */}
        <ClubHubIdentityHero
          clubName={ws.club.name || 'Club'}
          locationLine={location || undefined}
          metaLine={metaLine}
          verified={ws.club.verified}
          statusLabel={ws.statusLabel}
          statusTone={ws.statusTone}
          canEditCrest={logo.canEdit}
          crestUploading={logo.uploading}
          onPressCrest={logo.canEdit ? () => void logo.pickAndUpload() : undefined}
          playerCount={ws.players.length}
          teamCount={ws.teams.length}
          coachCount={ws.coaches.length}
          onPressPlayers={() => shellNav?.requestNav('players')}
          onPressTeams={() => shellNav?.requestNav('teams')}
          onPressCoaches={() => shellNav?.requestNav('coaches')}
        />

        {/* Executive Quick Shortcuts Row */}
        <View style={styles.shortcutRow}>
          <PressableSpring
            onPress={() => shellNav?.requestNav('pack')}
            scaleTo={0.97}
            haptic
            style={styles.shortcut}
          >
            <View style={[styles.shortcutIconWrap, { backgroundColor: tokens.accentSoft }]}>
              <Icon name="star-outline" size={14} color={tokens.accent} />
            </View>
            <ClubText variant="caption" style={styles.shortcutLabel}>
              Pack Club
            </ClubText>
          </PressableSpring>

          <PressableSpring
            onPress={() => shellNav?.requestNav('permissions')}
            scaleTo={0.97}
            haptic
            style={styles.shortcut}
          >
            <View style={[styles.shortcutIconWrap, { backgroundColor: 'rgba(255, 255, 255, 0.06)' }]}>
              <Icon name="shield" size={14} color={tokens.foreground} />
            </View>
            <ClubText variant="caption" style={styles.shortcutLabel}>
              Droits Staff
            </ClubText>
          </PressableSpring>

          <PressableSpring
            onPress={() => shellNav?.requestNav('finances')}
            scaleTo={0.97}
            haptic
            style={styles.shortcut}
          >
            <View style={[styles.shortcutIconWrap, { backgroundColor: 'rgba(255, 255, 255, 0.06)' }]}>
              <Icon name="bag" size={14} color={tokens.foreground} />
            </View>
            <ClubText variant="caption" style={styles.shortcutLabel}>
              Trésorerie
            </ClubText>
          </PressableSpring>
        </View>

        {/* Operational Alerts (if any pending coach assignment or membership) */}
        {alerts.length > 0 ? (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHead}>
              <ClubText variant="label" muted style={styles.sectionLabel}>
                Actions prioritaires
              </ClubText>
              <View style={styles.alertCountBadge}>
                <ClubText variant="caption" style={styles.alertCountText}>
                  {alerts.length}
                </ClubText>
              </View>
            </View>
            {alerts.map((alert, index) => (
              <ClubHubAlertCard
                key={alert.id}
                alert={alert}
                index={index}
                onPress={() => shellNav?.requestNav(alert.nav)}
              />
            ))}
          </View>
        ) : null}

        {/* Structure & Chiffres Clés (2x2 Obsidian Glass Grid) */}
        <View style={styles.sectionWrap}>
          <ClubText variant="label" muted style={styles.sectionLabel}>
            Structure & Effectifs
          </ClubText>
          <View style={styles.statsGrid}>
            {/* Licenciés */}
            <PressableSpring
              onPress={() => shellNav?.requestNav('players')}
              scaleTo={0.97}
              haptic
              style={styles.gridCard}
            >
              <LinearGradient
                colors={['rgba(28, 34, 48, 0.7)', 'rgba(16, 20, 30, 0.85)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.gridCardHead}>
                <View style={[styles.gridIconBadge, { backgroundColor: tokens.accentSoft }]}>
                  <Icon name="people" size={17} color={tokens.accent} />
                </View>
                <Icon name="chevron-forward" size={14} color={tokens.faint} />
              </View>
              <ClubText variant="h2" style={styles.gridValue}>
                {ws.players.length}
              </ClubText>
              <ClubText variant="caption" style={styles.gridTitle}>
                Licenciés Joueurs
              </ClubText>
              <ClubText variant="caption" muted numberOfLines={1} style={styles.gridSub}>
                {ws.pendingMemberships > 0
                  ? `${ws.pendingMemberships} en attente`
                  : 'Effectif actif'}
              </ClubText>
            </PressableSpring>

            {/* Équipes */}
            <PressableSpring
              onPress={() => shellNav?.requestNav('teams')}
              scaleTo={0.97}
              haptic
              style={styles.gridCard}
            >
              <LinearGradient
                colors={['rgba(28, 34, 48, 0.7)', 'rgba(16, 20, 30, 0.85)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.gridCardHead}>
                <View style={[styles.gridIconBadge, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                  <Icon name="football" size={17} color="#60A5FA" />
                </View>
                <Icon name="chevron-forward" size={14} color={tokens.faint} />
              </View>
              <ClubText variant="h2" style={styles.gridValue}>
                {ws.teams.length}
              </ClubText>
              <ClubText variant="caption" style={styles.gridTitle}>
                Équipes Club
              </ClubText>
              <ClubText variant="caption" muted numberOfLines={1} style={styles.gridSub}>
                {ws.teamsWithoutCoach > 0
                  ? `${ws.teamsWithoutCoach} sans coach`
                  : 'Toutes pourvues'}
              </ClubText>
            </PressableSpring>

            {/* Staff */}
            <PressableSpring
              onPress={() => shellNav?.requestNav('coaches')}
              scaleTo={0.97}
              haptic
              style={styles.gridCard}
            >
              <LinearGradient
                colors={['rgba(28, 34, 48, 0.7)', 'rgba(16, 20, 30, 0.85)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.gridCardHead}>
                <View style={[styles.gridIconBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <Icon name="school" size={17} color="#FBBF24" />
                </View>
                <Icon name="chevron-forward" size={14} color={tokens.faint} />
              </View>
              <ClubText variant="h2" style={styles.gridValue}>
                {ws.coaches.length}
              </ClubText>
              <ClubText variant="caption" style={styles.gridTitle}>
                Staff Technique
              </ClubText>
              <ClubText variant="caption" muted numberOfLines={1} style={styles.gridSub}>
                Éducateurs déclarés
              </ClubText>
            </PressableSpring>

            {/* Siège FFF */}
            <PressableSpring
              onPress={() => shellNav?.requestNav('communication')}
              scaleTo={0.97}
              haptic
              style={styles.gridCard}
            >
              <LinearGradient
                colors={['rgba(28, 34, 48, 0.7)', 'rgba(16, 20, 30, 0.85)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.gridCardHead}>
                <View style={[styles.gridIconBadge, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                  <Icon name="location" size={17} color="#C084FC" />
                </View>
                <Icon name="chevron-forward" size={14} color={tokens.faint} />
              </View>
              <ClubText variant="h3" numberOfLines={1} style={[styles.gridValue, { fontSize: 16 }]}>
                {ws.club.city || 'Siège'}
              </ClubText>
              <ClubText variant="caption" style={styles.gridTitle}>
                Localisation
              </ClubText>
              <ClubText variant="caption" muted numberOfLines={1} style={styles.gridSub}>
                {ws.club.department ? `Dép. ${ws.club.department}` : 'Affiliation FFF'}
              </ClubText>
            </PressableSpring>
          </View>
        </View>

        {/* Club Membership / Pack Hero */}
        <ClubHubPackHero
          title={pack.title}
          hint={pack.hint}
          onOpenPack={() => shellNav?.requestNav('pack')}
          onOpenQuote={() => shellNav?.requestNav('pack')}
        />

        {/* Charte Graphique & Identité Visuelle Studio */}
        <ClubSectionCard title="Charte & Identité Visuelle">
          <ClubText variant="caption" muted>
            Source active : {brandSource}
            {logoUrl ? ' · Crest synchronisé sur toute la plateforme' : ''}
          </ClubText>
          <ClubBrandColorsPanel onSaved={onBrandUpdated} />
          <ClubActionRow
            icon="image"
            label={logo.actionLabel}
            hint={
              !logo.canEdit
                ? 'Rattaché à un autre club — crest non modifiable ici'
                : logo.uploading
                  ? 'Import du blason en cours…'
                  : logoUrl
                    ? 'Remplacer le blason officiel affiché partout'
                    : 'Importer le logo du club — adapte les maillots et les entêtes'
            }
            onPress={
              !logo.canEdit || logo.uploading
                ? undefined
                : () => void logo.pickAndUpload()
            }
            trailing={
              logo.uploading ? <ActivityIndicator color={tokens.accent} /> : undefined
            }
          />
        </ClubSectionCard>

        {/* Categorized Executive Modules */}

        {/* 1. Gouvernance & Finances */}
        <View style={styles.sectionWrap}>
          <ClubText variant="label" muted style={styles.sectionLabel}>
            Gouvernance & Finances
          </ClubText>
          <View style={styles.moduleCard}>
            {governanceRows.map((row, index) => (
              <React.Fragment key={row.id}>
                {index > 0 ? <View style={styles.rowDivider} /> : null}
                <PressableSpring
                  onPress={row.onPress}
                  scaleTo={0.98}
                  haptic
                  style={styles.moduleRow}
                >
                  <View
                    style={[
                      styles.moduleIconWrap,
                      {
                        backgroundColor: row.accent
                          ? tokens.accentSoft
                          : 'rgba(255, 255, 255, 0.05)',
                      },
                    ]}
                  >
                    <Icon
                      name={row.icon}
                      size={18}
                      color={row.accent ? tokens.accent : tokens.foreground}
                    />
                  </View>
                  <View style={styles.moduleTextCol}>
                    <ClubText variant="body" style={styles.moduleTitle}>
                      {row.label}
                    </ClubText>
                    <ClubText variant="caption" muted numberOfLines={1}>
                      {row.hint}
                    </ClubText>
                  </View>
                  <Icon name="chevron-forward" size={15} color={tokens.faint} />
                </PressableSpring>
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* 2. Opérations & Sport */}
        <View style={styles.sectionWrap}>
          <ClubText variant="label" muted style={styles.sectionLabel}>
            Opérations & Sport
          </ClubText>
          <View style={styles.moduleCard}>
            {operationsRows.map((row, index) => (
              <React.Fragment key={row.id}>
                {index > 0 ? <View style={styles.rowDivider} /> : null}
                <PressableSpring
                  onPress={row.onPress}
                  scaleTo={0.98}
                  haptic
                  style={styles.moduleRow}
                >
                  <View
                    style={[
                      styles.moduleIconWrap,
                      { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
                    ]}
                  >
                    <Icon name={row.icon} size={18} color={tokens.foreground} />
                  </View>
                  <View style={styles.moduleTextCol}>
                    <ClubText variant="body" style={styles.moduleTitle}>
                      {row.label}
                    </ClubText>
                    <ClubText variant="caption" muted numberOfLines={1}>
                      {row.hint}
                    </ClubText>
                  </View>
                  <Icon name="chevron-forward" size={15} color={tokens.faint} />
                </PressableSpring>
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* 3. Services & Partenaires */}
        <View style={styles.sectionWrap}>
          <ClubText variant="label" muted style={styles.sectionLabel}>
            Services & Partenaires
          </ClubText>
          <View style={styles.moduleCard}>
            {servicesRows.map((row, index) => (
              <React.Fragment key={row.id}>
                {index > 0 ? <View style={styles.rowDivider} /> : null}
                <PressableSpring
                  onPress={row.onPress}
                  scaleTo={0.98}
                  haptic
                  style={styles.moduleRow}
                >
                  <View
                    style={[
                      styles.moduleIconWrap,
                      { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
                    ]}
                  >
                    <Icon name={row.icon} size={18} color={tokens.foreground} />
                  </View>
                  <View style={styles.moduleTextCol}>
                    <ClubText variant="body" style={styles.moduleTitle}>
                      {row.label}
                    </ClubText>
                    <ClubText variant="caption" muted numberOfLines={1}>
                      {row.hint}
                    </ClubText>
                  </View>
                  <Icon name="chevron-forward" size={15} color={tokens.faint} />
                </PressableSpring>
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Compte & Session */}
        <ShellAccountSection
          tone={{
            foreground: tokens.foreground,
            muted: tokens.muted,
            faint: tokens.faint,
            surface: 'rgba(18, 22, 34, 0.85)',
            border: 'rgba(255, 255, 255, 0.08)',
            destructive: '#EF4444',
            iconBg: 'rgba(255, 255, 255, 0.06)',
          }}
          links={[
            {
              key: 'pack',
              label: 'Paramètres Club',
              hint: 'Abonnement, options et conformité',
              icon: 'settings',
              onPress: () => shellNav?.requestNav('pack'),
            },
          ]}
          onSignOut={shellNav?.signOut}
          onDeleteAccount={confirmDeleteAccount}
          safeBottom
        />
      </ClubChapterScroll>
    </View>
  );
}

/** Pack Club — devis (pas Premium). */
export function ClubPackScreen() {
  const shellNav = useClubShellNav();
  const { tokens } = useClubTheme();
  const ws = useClubWorkspace();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const pack = useMemo(
    () => resolveClubHubPackLabel(ws.club?.commercial_offer_id),
    [ws.club?.commercial_offer_id],
  );

  return (
    <View style={styles.root}>
      <ClubChapterScroll>
        <ClubBrandHeader
          title="Pack Club"
          subtitle={`${pack.title} · SUR DEVIS`}
        />
        <ClubSectionCard>
          <ClubText variant="body" muted>
            Formule sur mesure pour clubs amateurs. Demandez un devis — aucun libellé « Premium ».
          </ClubText>
          <ClubText variant="caption" muted>
            {pack.hint}
          </ClubText>
          <ClubOffersComparePanel
            onRequestQuote={(_offerId) => {
              setQuoteModalOpen(true);
            }}
          />
          <ClubActionRow
            icon="document-text"
            label="Demander un devis sur mesure"
            hint="Remplir la demande officielle ProDay Club"
            onPress={() => setQuoteModalOpen(true)}
          />
          <ClubActionRow
            icon="shield"
            label="Permissions & rôles"
            onPress={() => shellNav?.requestNav('permissions')}
          />
          <ClubActionRow
            icon="tune"
            label="Retour identité club"
            onPress={() => shellNav?.requestNav('club')}
          />
        </ClubSectionCard>
      </ClubChapterScroll>

      <Modal
        visible={quoteModalOpen}
        animationType="slide"
        onRequestClose={() => setQuoteModalOpen(false)}
      >
        <ClubQuoteRequestScreen
          initialClubName={ws.club?.name || ''}
          onBack={() => setQuoteModalOpen(false)}
        />
      </Modal>
    </View>
  );
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
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
      gap: 7,
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: clubRadius.xl,
      backgroundColor: tokens.elevated,
      borderWidth: 1,
      borderColor: tokens.border,
      ...clubShadow.card,
    },
    shortcutIconWrap: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },
    shortcutLabel: {
      color: tokens.foreground,
      fontWeight: '800',
      fontSize: 12,
    },
    sectionWrap: {
      gap: 8,
      marginTop: clubSpace.sm,
      marginBottom: clubSpace.sm,
    },
    sectionHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 2,
    },
    sectionLabel: {
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      fontSize: 11,
      fontWeight: '700',
    },
    alertCountBadge: {
      paddingVertical: 2,
      paddingHorizontal: 7,
      borderRadius: clubRadius.pill,
      backgroundColor: 'rgba(239, 68, 68, 0.18)',
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    alertCountText: {
      fontSize: 10,
      fontWeight: '800',
      color: '#EF4444',
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    gridCard: {
      width: '48.5%',
      borderRadius: clubRadius.xl,
      borderWidth: 1,
      borderColor: tokens.border,
      padding: clubSpace.md,
      overflow: 'hidden',
      gap: 3,
      ...clubShadow.card,
    },
    gridCardHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    gridIconBadge: {
      width: 32,
      height: 32,
      borderRadius: clubRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    gridValue: {
      fontWeight: '900',
      fontSize: 22,
      letterSpacing: -0.5,
      color: tokens.foreground,
    },
    gridTitle: {
      fontWeight: '700',
      fontSize: 12,
      color: tokens.foreground,
    },
    gridSub: {
      fontSize: 11,
    },
    moduleCard: {
      borderRadius: clubRadius.xl,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
      overflow: 'hidden',
      ...clubShadow.card,
    },
    moduleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.md,
      paddingVertical: 13,
      paddingHorizontal: clubSpace.lg,
    },
    rowDivider: {
      height: 1,
      backgroundColor: tokens.border,
      marginLeft: 62,
    },
    moduleIconWrap: {
      width: 38,
      height: 38,
      borderRadius: clubRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    moduleTextCol: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    moduleTitle: {
      fontWeight: '700',
      fontSize: 14,
      color: tokens.foreground,
    },
  });
