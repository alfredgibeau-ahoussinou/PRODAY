/**
 * Barre de contexte & actions de l'espace Vidéo — **une seule action principale**.
 *
 * Remplace l'ancienne grille 2×2 de cartes sources (qui dupliquait les boutons déjà
 * présents dans la barre d'actions et la vue d'ensemble). Composition :
 *  - Ligne 1 : l'action principale « Importer une vidéo » (pleine, accent du pôle),
 *    et les deux actions secondaires en pill outline (Direct, Associer).
 *  - Ligne 2 : compteurs réels (captations / clips) + statut Veo unique — dot coloré,
 *    libellé exact, jamais un faux « Connecté ».
 *
 * Ce composant ne possède aucune donnée : tout vient des props et des états calculés
 * dans `VideoWorkspace`. Aucune couleur n'est codée — jetons du pôle injectés.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PressableSpring } from '../../components/motion';
import { Icon } from '../../components/ui/Icon';
import { ProDayText } from '../../components/ui/ProDayText';
import { APPLE_TYPOGRAPHY } from '../../theme/appleTypography';
import { spacing } from '../../theme/designTokens';
import type { VideoSurfaceTokens } from './VideoWorkspacePanels';

export type VeoEntryState = 'not_configured' | 'configured' | 'connected';
export type ImportEntryState = 'idle' | 'uploading' | 'processing';

export interface VideoSourceHubProps {
  tokens: VideoSurfaceTokens;
  /** État de la connexion Veo, issu de `veoAccount.state`. */
  veoState: VeoEntryState;
  /** Nombre de captations du compte Veo (affiché si `veoState === 'connected'`). */
  veoLibraryCount?: number | null;
  /** Un upload est-il en cours, et à quel pourcentage ? */
  importState: ImportEntryState;
  importProgressPercent?: number;
  /** Le coach/staff peut-il déclencher des actions de captation et d'import ? */
  canUpload: boolean;
  /** Libellés de contexte du club/équipe (jetons réels, jamais inventés). */
  teamLabel?: string | null;
  /** Compteurs réels — `null` ⇒ « — » (aucune valeur inventée). */
  storedCount?: number | null;
  clipsCount?: number | null;
  onSelectVeo: () => void;
  onSelectBroadcast: () => void;
  onSelectEncoder: () => void;
  onSelectImport: () => void;
}

export function VideoSourceHub({
  tokens,
  veoState,
  veoLibraryCount,
  importState,
  importProgressPercent,
  canUpload,
  teamLabel,
  storedCount = null,
  clipsCount = null,
  onSelectVeo,
  onSelectBroadcast,
  onSelectEncoder,
  onSelectImport,
}: VideoSourceHubProps) {
  /* ---- Statut Veo unique, libellé exact ---------------------------------- */
  const veoStatusLabel =
    veoState === 'connected'
      ? veoLibraryCount != null
        ? `Veo connecté · ${veoLibraryCount} captation${veoLibraryCount !== 1 ? 's' : ''}`
        : 'Veo connecté'
      : veoState === 'configured'
        ? 'Veo prêt · compte non connecté'
        : 'Veo non connecté';

  const veoStatusColor =
    veoState === 'connected' ? tokens.success : veoState === 'configured' ? tokens.warning : tokens.muted;

  /* ---- Statut import, s'il y en a un -------------------------------------- */
  const importBusy = importState !== 'idle';
  const importStatusLabel =
    importState === 'uploading'
      ? importProgressPercent != null
        ? `Téléversement ${importProgressPercent}%`
        : 'Téléversement…'
      : importState === 'processing'
        ? 'Traitement…'
        : null;

  const showImportStatus = importBusy && importStatusLabel;

  return (
    <View testID="video-source-hub" style={styles.root}>
      {/* Ligne 1 — une action principale + deux secondaires groupées */}
      <View style={styles.actionsRow}>
        <PressableSpring
          onPress={onSelectImport}
          scaleTo={0.97}
          haptic={canUpload}
          disabled={!canUpload}
          accessibilityRole="button"
          accessibilityLabel="Importer une vidéo"
          style={[styles.primaryBtn, { backgroundColor: tokens.accent }]}
          testID="source-hub-import"
        >
          <Icon name="cloud-upload" size={16} color={tokens.onAccent} />
          <ProDayText style={[styles.primaryBtnText, { color: tokens.onAccent }]}>
            Importer une vidéo
          </ProDayText>
        </PressableSpring>

        <PressableSpring
          onPress={onSelectBroadcast}
          scaleTo={0.97}
          haptic={canUpload}
          disabled={!canUpload}
          accessibilityRole="button"
          accessibilityLabel="Diffuser en direct"
          style={[styles.pillBtn, { borderColor: tokens.borderStrong }]}
          testID="source-hub-broadcast"
        >
          <Icon name="videocam" size={15} color={tokens.danger} />
          <ProDayText style={[styles.pillBtnText, { color: tokens.danger }]}>Direct</ProDayText>
        </PressableSpring>

        <PressableSpring
          onPress={onSelectEncoder}
          scaleTo={0.97}
          haptic={canUpload}
          disabled={!canUpload}
          accessibilityRole="button"
          accessibilityLabel="Associer un match Veo ou un lien externe"
          style={[styles.pillBtn, { borderColor: tokens.borderStrong }]}
          testID="source-hub-encoder"
        >
          <Icon name="swap-horizontal" size={15} color={tokens.foreground} />
          <ProDayText style={[styles.pillBtnText, { color: tokens.foreground }]}>Associer</ProDayText>
        </PressableSpring>
      </View>

      {/* Ligne 2 — compteurs réels + statut Veo + progression d'import éventuelle */}
      <View style={styles.contextRow}>
        <ProDayText variant="caption" muted style={styles.contextText} numberOfLines={1}>
          {[
            teamLabel?.trim() || null,
            storedCount != null ? `${storedCount} captation${storedCount !== 1 ? 's' : ''}` : null,
            clipsCount != null ? `${clipsCount} clip${clipsCount !== 1 ? 's' : ''}` : null,
          ]
            .filter(Boolean)
            .join(' · ') || 'Aucune captation'}
        </ProDayText>

        {showImportStatus ? (
          <View style={[styles.veoPill, { borderColor: tokens.border }]}>
            <Icon name="cloud-upload" size={12} color={tokens.warning} />
            <ProDayText variant="caption" style={[styles.veoPillText, { color: tokens.warning }]}>
              {importStatusLabel}
            </ProDayText>
          </View>
        ) : null}

        <PressableSpring
          onPress={onSelectVeo}
          scaleTo={0.96}
          haptic
          accessibilityRole="button"
          accessibilityLabel={veoStatusLabel}
          style={[styles.veoPill, { borderColor: tokens.border }]}
          testID="source-hub-veo"
        >
          <View style={[styles.veoDot, { backgroundColor: veoStatusColor }]} />
          <ProDayText variant="caption" style={[styles.veoPillText, { color: tokens.foreground }]}>
            {veoStatusLabel}
          </ProDayText>
          <Icon name="chevron-forward" size={12} color={tokens.muted} />
        </PressableSpring>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: spacing.lg,
    minHeight: 44,
    borderRadius: 14,
  },
  primaryBtnText: {
    ...APPLE_TYPOGRAPHY.caption1,
    fontWeight: '700',
  },
  pillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  pillBtnText: {
    ...APPLE_TYPOGRAPHY.caption1,
    fontWeight: '700',
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  contextText: {
    ...APPLE_TYPOGRAPHY.caption1,
    flex: 1,
    minWidth: 120,
  },
  veoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  veoDot: { width: 7, height: 7, borderRadius: 4 },
  veoPillText: {
    ...APPLE_TYPOGRAPHY.caption2,
    fontWeight: '700',
  },
});
