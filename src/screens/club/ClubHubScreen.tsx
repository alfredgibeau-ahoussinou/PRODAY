import React, { useMemo } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { ClubOffersComparePanel } from '../../components/club/ClubOffersComparePanel';
import { useClubShellNav } from '../../features/club/shell/ClubShellNavContext';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import {
  ClubActionRow,
  ClubChapterScroll,
  ClubLoading,
  ClubScreenHeader,
  ClubSectionCard,
  ClubText,
} from '../../features/club/ui/clubUi';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';

/** Hub Club — identité, pack, réglages. */
export function ClubHubScreen() {
  const shellNav = useClubShellNav();
  const { tokens } = useClubTheme();
  const ws = useClubWorkspace();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  if (ws.loading) return <ClubLoading />;

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
        <ClubScreenHeader
          title={ws.club?.name ?? 'Club'}
          subtitle={
            [ws.club?.city, ws.club?.department].filter(Boolean).join(' · ') ||
            'Identité & réglages'
          }
        />

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
        <ClubScreenHeader
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
    root: { flex: 1, backgroundColor: tokens.bg },
  });
