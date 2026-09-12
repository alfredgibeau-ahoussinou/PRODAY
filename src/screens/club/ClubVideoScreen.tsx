/**
 * Pôle Club — Hub Vidéo, Analyse & Smart Highlights
 * Veo Cam 3, Smartphone 4K, XbotGo, AI smart clipping & Brief du Lundi Matin.
 * Design System Apple Obsidian Glass · Zéro émoji unicode.
 */
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import { ClubChapterScroll, ClubLoading } from '../../features/club/ui/clubUi';
import { ClubBrandHeader } from '../../features/club/ui/ClubBrandHeader';
import { ClubVideoHub } from '../../features/club/ui/ClubVideoHub';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';

export function ClubVideoScreen() {
  const { tokens } = useClubTheme();
  const ws = useClubWorkspace();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  if (ws.loading) return <ClubLoading />;

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
        <ClubBrandHeader
          title="Vidéo & Analyse IA"
          subtitle="Captation multi-sources · Smart Highlights · Le Brief du Lundi Matin"
        />
        <ClubVideoHub />
      </ClubChapterScroll>
    </View>
  );
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: 'transparent',
    },
  });
