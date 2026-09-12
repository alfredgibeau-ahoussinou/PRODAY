/**
 * Pôle Club — Covoiturage & Logistique Déplacements
 * Gestion des véhicules, places disponibles, itinéraire GPS stade & conducteurs.
 * Design System Apple Obsidian Glass · Zéro émoji unicode.
 */
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { ClubChapterScroll, ClubLoading } from '../../features/club/ui/clubUi';
import { ClubBrandHeader } from '../../features/club/ui/ClubBrandHeader';
import { ClubCarpoolBoard } from '../../features/club/ui/ClubCarpoolBoard';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';

export function ClubCarpoolScreen() {
  const { tokens } = useClubTheme();
  const ws = useClubWorkspace();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  if (ws.loading) return <ClubLoading />;

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
        <ClubBrandHeader
          title="Covoiturage & Logistique"
          subtitle="Déplacements matchs extérieurs · Véhicules · Itinéraires GPS"
        />
        <ClubCarpoolBoard />
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
