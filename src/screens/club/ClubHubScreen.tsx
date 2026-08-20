import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, View } from 'react-native';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { ClubOffersComparePanel } from '../../components/club/ClubOffersComparePanel';
import { useClubShellNav } from '../../features/club/shell/ClubShellNavContext';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import { useClubLogoUpload } from '../../features/club/hooks/useClubLogoUpload';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import {
  ClubActionRow,
  ClubChapterScroll,
  ClubLoading,
  ClubSectionCard,
  ClubText,
} from '../../features/club/ui/clubUi';
import { ClubBrandHeader } from '../../features/club/ui/ClubBrandHeader';
import { spacing } from '../../theme/designTokens';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';
import { PressableSpring } from '../../components/motion';

/** Hub Club — identité, couleurs/logo, staff, pack, contacts. */
export function ClubHubScreen() {
  const shellNav = useClubShellNav();
  const { tokens, logoUrl, brand } = useClubTheme();
  const ws = useClubWorkspace();
  const onLogoUploaded = useCallback(() => {
    void ws.refresh();
  }, [ws.refresh]);
  const logo = useClubLogoUpload(onLogoUploaded);
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  if (ws.loading) return <ClubLoading />;

  const location =
    [ws.club?.city, ws.club?.department].filter(Boolean).join(' · ') || 'Identité & réglages';
  const brandSource =
    brand?.source === 'stored'
      ? 'Couleurs enregistrées'
      : brand?.source === 'logo'
        ? 'Issues du logo'
        : 'Palette ProDay';

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
        <ClubBrandHeader
          title={ws.club?.name ?? 'Club'}
          subtitle={location}
        />

        <ClubSectionCard title="Identité">
          <View style={styles.identityRow}>
            <PressableSpring
              onPress={() => void logo.pickAndUpload()}
              disabled={logo.uploading}
              scaleTo={0.97}
              haptic
              style={[styles.logoBig, { borderColor: tokens.accentSoft }]}
              accessibilityRole="button"
              accessibilityLabel={logo.actionLabel}
            >
              {logo.uploading ? (
                <View style={[styles.logoImg, styles.logoBusy]}>
                  <ActivityIndicator color={tokens.accent} />
                </View>
              ) : logoUrl ? (
                <Image source={{ uri: logoUrl }} style={styles.logoImg} resizeMode="cover" />
              ) : (
                <View style={[styles.logoImg, { backgroundColor: tokens.accentSoft }]} />
              )}
            </PressableSpring>
            <View style={{ flex: 1, gap: 4 }}>
              <ClubText variant="section">{ws.club?.name ?? '—'}</ClubText>
              <ClubText variant="caption" muted>
                {ws.club?.verified ? 'Club vérifié' : 'Vérification en cours / non vérifié'}
              </ClubText>
              <ClubText variant="caption" muted>
                {location}
              </ClubText>
            </View>
          </View>
        </ClubSectionCard>

        <ClubSectionCard title="Couleurs & logo">
          <View style={styles.swatches}>
            <View style={styles.swatchCol}>
              <View style={[styles.swatch, { backgroundColor: tokens.accent }]} />
              <ClubText variant="caption" muted>
                Principale
              </ClubText>
            </View>
            <View style={styles.swatchCol}>
              <View style={[styles.swatch, { backgroundColor: tokens.secondary }]} />
              <ClubText variant="caption" muted>
                Secondaire
              </ClubText>
            </View>
          </View>
          <ClubText variant="caption" muted>
            Source : {brandSource}
            {logoUrl ? ' · Logo affiché dans le chrome' : ' · Ajoutez un logo pour adapter le thème'}
          </ClubText>
          <ClubActionRow
            icon="image"
            label={logo.actionLabel}
            hint={
              logo.uploading
                ? 'Envoi en cours…'
                : logoUrl
                  ? 'Remplacer le crest affiché partout dans le pôle Club'
                  : 'Importer le crest du club — thème et en-têtes s’adaptent'
            }
            onPress={logo.uploading ? undefined : () => void logo.pickAndUpload()}
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
            Ville : {ws.club?.city || '—'}
          </ClubText>
          <ClubText variant="body" muted>
            Département : {ws.club?.department || '—'}
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

        <ClubSectionCard title="Pack Club">
          <ClubText variant="body" style={{ fontWeight: '700' }}>
            SUR DEVIS
          </ClubText>
          <ClubText variant="body" muted>
            À partir de 3 € par adhérent — jamais « Premium ».
          </ClubText>
          <ClubActionRow
            icon="star-outline"
            label="Voir le Pack Club"
            onPress={() => shellNav?.requestNav('pack')}
          />
        </ClubSectionCard>

        <ClubSectionCard title="Outils club">
          <ClubActionRow
            icon="document"
            label="Licences & documents"
            onPress={() => shellNav?.requestNav('licenses')}
          />
          <ClubActionRow
            icon="bag"
            label="Finances"
            onPress={() => shellNav?.requestNav('finances')}
          />
          <ClubActionRow
            icon="gift"
            label="Sponsoring"
            onPress={() => shellNav?.requestNav('sponsoring')}
          />
          <ClubActionRow
            icon="shirt"
            label="Bourse équipements"
            onPress={() => shellNav?.requestNav('equipment')}
          />
          <ClubActionRow
            icon="tune"
            label="Automatisations"
            onPress={() => shellNav?.requestNav('automations')}
          />
          <ClubActionRow
            icon="shield"
            label="Permissions & rôles"
            onPress={() => shellNav?.requestNav('permissions')}
          />
          <ClubActionRow
            icon="notifications"
            label="Notifications"
            onPress={() => shellNav?.requestNav('notifications')}
          />
        </ClubSectionCard>
      </ClubChapterScroll>
    </View>
  );
}

/** Pack Club — devis (pas Premium). */
export function ClubPackScreen() {
  const nav = useTabNavigationActions();
  const { tokens } = useClubTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  return (
    <View style={styles.root}>
      <ClubChapterScroll>
        <ClubBrandHeader
          title="Pack Club"
          subtitle="SUR DEVIS · À partir de 3 € par adhérent"
        />
        <ClubSectionCard>
          <ClubText variant="body" muted>
            Formule sur mesure pour clubs amateurs. Demandez un devis — aucun libellé « Premium ».
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
        </ClubSectionCard>
      </ClubChapterScroll>
    </View>
  );
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    identityRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
    logoBig: {
      width: 64,
      height: 64,
      borderRadius: 18,
      overflow: 'hidden',
      borderWidth: 2,
      backgroundColor: tokens.elevated,
    },
    logoImg: { width: '100%', height: '100%' },
    logoBusy: { alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.elevated },
    swatches: { flexDirection: 'row', gap: spacing.lg },
    swatchCol: { alignItems: 'center', gap: 6 },
    swatch: {
      width: 40,
      height: 40,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
    },
  });
