/**
 * Carte vidéo canonique de la section Vidéo — **un seul balisage partagé**.
 *
 * Rendue par la bibliothèque unifiée du workspace (captations club + compte Veo)
 * et par la bibliothèque du compte Veo (VeoAccountPanel). Rien n'est inventé :
 * le badge de cycle de vie dérive exclusivement de `status`/`kind` (videoStatus.ts),
 * la durée et la date sont celles du modèle d'affichage — jamais recomposées.
 *
 * Contrat design (DESIGN.md + Coach/Club approuvés) : carte plate rayon 20,
 * miniature 16:9, typographie Apple System (APPLE_TYPOGRAPHY), aucun hex codé —
 * jetons injectés via `tokens` (la charte du pôle s'applique automatiquement).
 */
import React from 'react';
import { StyleSheet, View, type DimensionValue } from 'react-native';
import { PressableSpring } from '../../components/motion';
import { Icon } from '../../components/ui/Icon';
import { ProDayText } from '../../components/ui/ProDayText';
import { APPLE_TYPOGRAPHY } from '../../theme/appleTypography';
import { spacing } from '../../theme/designTokens';
import {
  formatVeoDuration,
  formatVeoRecordedAt,
} from '../../services/veo/veoAccount.service';
import type { MatchVideoItem } from './VideoWorkspace';
import { resolveVideoLifecycle } from './videoStatus';
import type { VideoSurfaceTokens } from './VideoWorkspacePanels';

/** Forme de référence (D-010/D-011) : carte plate, rayon 20. */
export const VIDEO_CARD_RADIUS = 20;

/**
 * Convertit une captation du compte Veo en modèle d'affichage canonique.
 * Adaptateur unique du projet : la bibliothèque du workspace et celle du
 * compte Veo partagent exactement la même projection — aucun champ dérivé
 * de façon divergente.
 */
export const toVeoAccountVideoItem = (video: {
  id: string;
  title: string;
  recordedAt: string | null;
  durationSec: number | null;
}): MatchVideoItem => ({
  id: `veo-account-${video.id}`,
  title: video.title,
  category: 'Compte Veo',
  dateStr: formatVeoRecordedAt(video.recordedAt),
  durationStr: formatVeoDuration(video.durationSec),
  source: 'veo',
  sourceLabel: 'Veo · compte connecté',
  clipsCount: 0,
  score: '',
  viewsCount: 0,
  veoVideoId: video.id,
  status: 'ready',
  kind: 'replay',
});

/**
 * Carte vidéo — miniature 16:9 (badge de cycle de vie, durée, date, voile
 * d'indisponibilité), titre, métadonnées et action secondaire groupée.
 */
export const VideoCard: React.FC<{
  item: MatchVideoItem;
  tokens: VideoSurfaceTokens;
  onPress?: () => void;
  /** Action secondaire « Détails & gestion » — absente si le rôle ne la permet pas. */
  onManage?: (item: MatchVideoItem) => void;
  /** Cette carte est-elle en lecture dans le lecteur héro ? (liseré accent) */
  isPlaying?: boolean;
  /** Résolution d'URL de lecture en cours (icône du cercle central). */
  isResolving?: boolean;
  /** Largeur dans la grille adaptative (100 % mobile, 47 %/31.33 % desktop). */
  flexBasis?: DimensionValue;
  testID?: string;
}> = ({ item, tokens, onPress, onManage, isPlaying = false, isResolving = false, flexBasis, testID = 'video-library-item' }) => {
  const lifecycle = resolveVideoLifecycle(item);
  /** État de transit ou d'échec : la carte s'affiche mais ne se presse pas (videoStatus.ts). */
  const isPlayable = lifecycle.playable;
  const lifecycleBg =
    lifecycle.tone === 'live' || lifecycle.tone === 'danger'
      ? tokens.danger
      : lifecycle.tone === 'warning'
        ? tokens.warning
        : tokens.elevated;
  const lifecycleFg =
    lifecycle.tone === 'live' || lifecycle.tone === 'warning' || lifecycle.tone === 'danger'
      ? tokens.onAccent
      : tokens.foreground;

  return (
    <PressableSpring
      onPress={onPress}
      disabled={!isPlayable}
      scaleTo={0.98}
      accessibilityRole="button"
      accessibilityState={{ disabled: !isPlayable }}
      testID={testID}
      style={[
        styles.card,
        flexBasis ? { flexBasis } : null,
        {
          backgroundColor: tokens.surface,
          borderColor: isPlaying ? tokens.accent : tokens.border,
          borderWidth: isPlaying ? 2 : 1,
        },
      ]}
    >
      <View style={styles.thumbnail}>
        <View style={styles.thumbnailBg}>
          <Icon
            name={item.source === 'veo' ? 'videocam' : 'football'}
            size={36}
            color={tokens.muted}
          />
        </View>

        <View style={styles.topRow}>
          <View style={[styles.lifecycleBadge, { backgroundColor: lifecycleBg }]}>
            {lifecycle.tone === 'live' ? (
              <View style={[styles.lifecycleDot, { backgroundColor: lifecycleFg }]} />
            ) : null}
            <ProDayText variant="caption" style={[styles.lifecycleText, { color: lifecycleFg }]}>
              {lifecycle.label}
            </ProDayText>
          </View>

          {item.durationStr ? (
            <View style={[styles.durationChip, { backgroundColor: tokens.surface }]}>
              <ProDayText variant="caption" style={[styles.durationText, { color: tokens.foreground }]}>
                {item.durationStr}
              </ProDayText>
            </View>
          ) : null}
        </View>

        {!lifecycle.playable ? (
          <View style={[styles.veil, { backgroundColor: tokens.bg }]}>
            <Icon
              name={lifecycle.tone === 'danger' ? 'alert-circle' : 'refresh'}
              size={20}
              color={tokens.muted}
            />
          </View>
        ) : (
          <View
            style={[
              styles.playCircle,
              { backgroundColor: isPlaying ? tokens.accent : tokens.surface },
            ]}
          >
            <Icon
              name={isResolving ? 'refresh' : 'play'}
              size={18}
              color={isPlaying ? tokens.onAccent : tokens.foreground}
            />
          </View>
        )}

        <View style={styles.bottomRow}>
          <ProDayText variant="caption" style={[styles.dateBadge, { color: tokens.muted }]}>
            {item.dateStr}
          </ProDayText>
        </View>
      </View>

      <View style={styles.content}>
        <ProDayText
          variant="body"
          style={[styles.title, { color: tokens.foreground }]}
          numberOfLines={2}
        >
          {item.title}
        </ProDayText>

        <ProDayText variant="caption" muted style={styles.meta} numberOfLines={1}>
          {[item.category, item.sourceLabel].filter(Boolean).join(' · ')}
        </ProDayText>

        {onManage ? (
          <PressableSpring
            onPress={(e) => {
              e?.stopPropagation?.();
              onManage(item);
            }}
            style={[styles.manageBtn, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}
            accessibilityLabel="Détails et gestion de la vidéo"
            testID="video-manage-btn"
          >
            <Icon name="settings" size={12} color={tokens.foreground} />
            <ProDayText
              variant="caption"
              style={{ color: tokens.foreground, fontWeight: '700', fontSize: 11 }}
            >
              Détails & gestion
            </ProDayText>
            <View style={{ flex: 1 }} />
            <Icon name="chevron-forward" size={12} color={tokens.muted} />
          </PressableSpring>
        ) : null}
      </View>
    </PressableSpring>
  );
};

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 280,
    maxWidth: '100%',
    borderRadius: VIDEO_CARD_RADIUS,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
    justifyContent: 'space-between',
    padding: 10,
  },
  thumbnailBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.15,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  lifecycleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  lifecycleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  lifecycleText: {
    ...APPLE_TYPOGRAPHY.caption2,
    fontWeight: '700',
  },
  durationChip: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  durationText: {
    ...APPLE_TYPOGRAPHY.caption2,
    fontWeight: '700',
  },
  playCircle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    elevation: 3,
  },
  veil: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.45,
    zIndex: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 2,
  },
  dateBadge: {
    ...APPLE_TYPOGRAPHY.caption2,
    fontWeight: '600',
  },
  content: {
    padding: spacing.md,
    gap: 4,
  },
  title: {
    ...APPLE_TYPOGRAPHY.subheadline,
    fontWeight: '700',
  },
  meta: {
    ...APPLE_TYPOGRAPHY.caption1,
    marginBottom: spacing.xs,
  },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
});
