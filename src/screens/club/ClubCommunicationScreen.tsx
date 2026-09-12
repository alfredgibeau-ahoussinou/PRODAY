/**
 * Pôle Club — Communication & Canaux Officiels
 * Partition des canaux (Bureau, Staff, Équipes) remplaçant WhatsApp + Messagerie ProDay.
 * Design System Apple Obsidian Glass · Zéro émoji unicode.
 */
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { MessagesScreen } from '../MessagesScreen';
import { useClubShellNav } from '../../features/club/shell/ClubShellNavContext';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import {
  ClubActionRow,
  ClubChapterScroll,
  ClubEmptyState,
  ClubLoading,
  ClubSegmentedControl,
} from '../../features/club/ui/clubUi';
import { ClubBrandHeader } from '../../features/club/ui/ClubBrandHeader';
import { ClubChannelsHub } from '../../features/club/ui/ClubChannelsHub';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';
import { clubSpace } from '../../features/club/theme/clubDesignSystem';

type ChannelTab = 'channels' | 'inbox';

export function ClubCommunicationScreen() {
  const shellNav = useClubShellNav();
  const ws = useClubWorkspace();
  const { tokens } = useClubTheme();
  const [channel, setChannel] = useState<ChannelTab>('channels');
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  if (ws.loading) return <ClubLoading />;

  if (!ws.clubId) {
    return (
      <View style={styles.root}>
        <ClubChapterScroll>
          <ClubBrandHeader title="Communication" subtitle="Club non lié" />
          <ClubEmptyState
            title="Liez un club"
            body="La messagerie et les canaux officiels s’activent dès qu’un club est rattaché à votre compte."
            actionLabel="Ouvrir le club"
            onAction={() => shellNav?.requestNav('club')}
            icon="chat"
          />
        </ClubChapterScroll>
      </View>
    );
  }

  if (channel === 'inbox') {
    return (
      <View style={styles.root}>
        <View style={styles.inboxBar}>
          <ClubActionRow
            icon="arrow-back"
            label="Retour Canaux Officiels"
            hint="Bureau · Staff · Équipes · Flash Info"
            onPress={() => setChannel('channels')}
          />
        </View>
        <MessagesScreen />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
        <ClubBrandHeader
          title="Communication & Canaux"
          subtitle="Canaux officiels cloisonnés · Alertes Flash Info · Messagerie"
        />

        <ClubSegmentedControl
          options={[
            { id: 'channels' as const, label: 'Canaux Officiels' },
            { id: 'inbox' as const, label: 'Messagerie Directe' },
          ]}
          value={channel}
          onChange={setChannel}
        />

        <ClubChannelsHub />
      </ClubChapterScroll>
    </View>
  );
}

const createStyles = (_tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    inboxBar: {
      paddingHorizontal: clubSpace.lg,
      paddingTop: clubSpace.sm,
      paddingBottom: clubSpace.xs,
    },
  });
