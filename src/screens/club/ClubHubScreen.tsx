import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { ClubOffersComparePanel } from '../../components/club/ClubOffersComparePanel';
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
  ClubHubSettingsTileRow,
} from '../../features/club/ui/ClubHubChrome';
import {
  buildClubHubAlerts,
  buildClubHubSettingsTiles,
  formatClubHubLocation,
  formatClubHubMetaLine,
  resolveClubHubBrandSourceLabel,
  resolveClubHubPackLabel,
  resolveClubHubSubtitle,
} from '../../features/club/ui/clubHubModel';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';
import { clubSpace } from '../../features/club/theme/clubDesignSystem';
import { PressableSpring } from '../../components/motion';
import { Icon } from '../../components/ui/Icon';

/** Hub Club — identité, couleurs/logo, staff, pack, contacts, réglages. */
export function ClubHubScreen() {
  const shellNav = useClubShellNav();
  const { tokens, logoUrl, brand } = useClubTheme();
  const ws = useClubWorkspace();
  const onBrandUpdated = useCallback(() => {
    void ws.refresh();
  }, [ws.refresh]);
  const logo = useClubLogoUpload(onBrandUpdated);
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  const location = useMemo(
    () => formatClubHubLocation(ws.club?.city, ws.club?.department),
    [ws.club?.city, ws.club?.department],
  );
  const subtitle = useMemo(
    () =>
      resolveClubHubSubtitle({
        city: ws.club?.city,
        department: ws.club?.department,
        verified: ws.club?.verified,
      }),
    [ws.club?.city, ws.club?.department, ws.club?.verified],
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
  const settingsTiles = useMemo(
    () =>
      buildClubHubSettingsTiles({
        hasPresident: Boolean(shellNav?.openPresident),
        packHint: pack.hint,
      }),
    [shellNav?.openPresident, pack.hint],
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
        </ClubChapterScroll>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
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
        />

        <View style={styles.shortcutRow}>
          <PressableSpring
            onPress={() => shellNav?.requestNav('pack')}
            scaleTo={0.97}
            haptic
            style={styles.shortcut}
          >
            <Icon name="star-outline" size={14} color={tokens.accent} />
            <ClubText variant="caption" style={styles.shortcutLabel}>
              Pack
            </ClubText>
          </PressableSpring>
          <PressableSpring
            onPress={() => shellNav?.requestNav('permissions')}
            scaleTo={0.97}
            haptic
            style={styles.shortcut}
          >
            <Icon name="shield" size={14} color={tokens.accent} />
            <ClubText variant="caption" style={styles.shortcutLabel}>
              Droits
            </ClubText>
          </PressableSpring>
          <PressableSpring
            onPress={() => shellNav?.requestNav('finances')}
            scaleTo={0.97}
            haptic
            style={styles.shortcut}
          >
            <Icon name="bag" size={14} color={tokens.accent} />
            <ClubText variant="caption" style={styles.shortcutLabel}>
              Finances
            </ClubText>
          </PressableSpring>
        </View>

        <ClubText variant="caption" muted style={styles.pageSub}>
          {subtitle}
        </ClubText>

        <ClubHubPackHero
          title={pack.title}
          hint={pack.hint}
          onOpenPack={() => shellNav?.requestNav('pack')}
          onOpenQuote={() => shellNav?.requestNav('pack')}
        />

        {alerts.length > 0 ? (
          <View style={styles.section}>
            <ClubText variant="label" muted style={styles.sectionLabel}>
              À traiter
            </ClubText>
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

        <ClubSectionCard title="Couleurs & logo">
          <ClubText variant="caption" muted>
            Source actuelle : {brandSource}
            {logoUrl ? ' · Logo affiché dans le chrome' : ''}
          </ClubText>
          <ClubBrandColorsPanel onSaved={onBrandUpdated} />
          <ClubActionRow
            icon="image"
            label={logo.actionLabel}
            hint={
              !logo.canEdit
                ? 'Rattaché à un autre club — logo non modifiable ici'
                : logo.uploading
                  ? 'Envoi en cours…'
                  : logoUrl
                    ? 'Remplacer le crest affiché partout dans le pôle Club'
                    : 'Importer le crest du club — thème et en-têtes s’adaptent'
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

        <ClubSectionCard title="Staff & structure">
          <ClubActionRow
            icon="school"
            label={`${ws.coaches.length} coach(s)`}
            hint={
              ws.teamsWithoutCoach > 0
                ? `${ws.teamsWithoutCoach} équipe(s) sans coach`
                : 'Toutes les équipes ont un coach'
            }
            onPress={() => shellNav?.requestNav('coaches')}
          />
          <ClubActionRow
            icon="football"
            label={`${ws.teams.length} équipe(s)`}
            hint={`${ws.players.length} joueur(s) · ${ws.pendingMemberships} adhésion(s) en attente`}
            onPress={() => shellNav?.requestNav('teams')}
          />
          <ClubActionRow
            icon="people"
            label="Effectif joueurs"
            onPress={() => shellNav?.requestNav('players')}
          />
        </ClubSectionCard>

        <ClubSectionCard title="Contacts club">
          <ClubText variant="body" muted>
            Ville : {ws.club.city || '—'}
          </ClubText>
          <ClubText variant="body" muted>
            Département : {ws.club.department || '—'}
          </ClubText>
          <ClubText variant="caption" muted>
            Les contacts individuels des coachs sont dans l’annuaire Coachs.
          </ClubText>
          <ClubActionRow
            icon="chat"
            label="Communication club"
            onPress={() => shellNav?.requestNav('communication')}
          />
        </ClubSectionCard>

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <ClubText variant="label" muted style={styles.sectionLabel}>
              Pack & réglages
            </ClubText>
            <ClubText variant="caption" muted>
              {settingsTiles.length}
            </ClubText>
          </View>
          {settingsTiles.map((tile, index) => (
            <ClubHubSettingsTileRow
              key={tile.id}
              tile={tile}
              index={index}
              onPress={() => {
                if (tile.president) {
                  shellNav?.openPresident?.();
                  return;
                }
                if (tile.nav) shellNav?.requestNav(tile.nav);
              }}
            />
          ))}
        </View>
      </ClubChapterScroll>
    </View>
  );
}

/** Pack Club — devis (pas Premium). */
export function ClubPackScreen() {
  const nav = useTabNavigationActions();
  const shellNav = useClubShellNav();
  const { tokens } = useClubTheme();
  const ws = useClubWorkspace();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
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
            onRequestQuote={(offerId) => {
              Alert.alert(
                'Demande de devis',
                `Votre demande pour ${offerId} sera transmise. SUR DEVIS — à partir de 3 € / adhérent.`,
              );
              nav.openDashboard?.('gestion');
            }}
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
      gap: 6,
      paddingVertical: 10,
      borderRadius: 14,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.borderStrong,
    },
    shortcutLabel: {
      color: tokens.foreground,
      fontWeight: '800',
    },
    pageSub: {
      marginBottom: clubSpace.sm,
    },
    section: {
      gap: clubSpace.sm,
      marginTop: clubSpace.md,
      marginBottom: clubSpace.sm,
    },
    sectionHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 2,
    },
    sectionLabel: {
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      fontSize: 11,
    },
  });
