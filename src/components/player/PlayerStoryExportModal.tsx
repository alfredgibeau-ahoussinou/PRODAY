import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  Share,
  Platform,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { LiveFutPlayerCard, type LiveFutCardData } from './LiveFutPlayerCard';
import { colors } from '../../theme/designTokens';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';
import { APPLE_FONT_STACK } from '../../theme/appleTypography';
import { CLUB_TOKENS } from '../../features/club/theme/clubTokens';

export interface WeekendStats {
  matchTitle?: string;
  result?: string;
  matchRating?: number;
  goals?: number;
  assists?: number;
  distanceKm?: number;
  duelsPct?: number;
}

export interface PlayerStoryExportModalProps {
  visible: boolean;
  player: LiveFutCardData;
  weekendStats?: WeekendStats;
  clubLogoUrl?: string;
  onClose: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Page 4 : Flex & Share — Génération Story 9:16 & Image HD
 * Carte Joueur FUT + Stats du week-end + Logo/Blason club
 */
export const PlayerStoryExportModal: React.FC<PlayerStoryExportModalProps> = ({
  visible,
  player,
  weekendStats,
  clubLogoUrl,
  onClose,
}) => {
  const [aspectFormat, setAspectFormat] = useState<'9_16' | '1_1'>('9_16');

  /** Uniquement les valeurs réellement publiées — aucune estimation. */
  const stats: WeekendStats = weekendStats ?? {};

  const clubName = player.clubName || 'FC ProDay';

  const formatStat = (value: number | undefined, suffix = '') =>
    value != null && value > 0 ? `${value}${suffix}` : '—';

  const metrics = [
    { key: 'NOTE STAFF', value: formatStat(stats.matchRating), color: colors.bookmark },
    { key: 'BUTS', value: formatStat(stats.goals), color: PLAYER_DARK.accent },
    { key: 'PASSES D', value: formatStat(stats.assists), color: PLAYER_DARK.statBlue },
    { key: 'DISTANCE', value: formatStat(stats.distanceKm, ' km'), color: PLAYER_DARK.text },
    { key: 'DUELS', value: formatStat(stats.duelsPct, '%'), color: PLAYER_DARK.statGreen },
  ];
  const publishedLines = metrics.filter((metric) => metric.value !== '—');
  const fixtureLabel = [stats.matchTitle, stats.result].filter(Boolean).join(' · ');

  const handleShare = async () => {
    prodayHaptics.impactMedium();
    try {
      await Share.share({
        title: `ProDay Flex & Share — ${player.name} (${player.pos} · OVR ${player.ovr})`,
        message: `🔥 PRODAY FLEX & SHARE\n${player.name} | ${player.pos} · OVR ${player.ovr} (${clubName})\n⚽ ${[stats.matchTitle, stats.result].filter(Boolean).join(' · ') || 'Match en cours de saison'}\n${publishedLines.map((metric) => `${metric.key} : ${metric.value}`).join(' | ') || 'Stats du week-end non publiées'}\n📲 Retrouve ma carte FUT officielle sur ProDay ! https://proday75.fr #ProDay #FlexAndShare #FUT #Football`,
        url: 'https://proday75.fr',
      });
    } catch {
      // Ignored
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header Bar — Flex & Share */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.flexBadge}>
                <Ionicons name="sparkles" size={13} color={PLAYER_DARK.bg} />
                <Text style={styles.flexBadgeText}>FLEX & SHARE</Text>
              </View>
              <Text style={styles.headerTitle}>Story & Visuel HD</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Fermer">
              <Ionicons name="close" size={20} color={PLAYER_DARK.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Format Switcher (9:16 Story vs 1:1 Carré) */}
          <View style={styles.formatSwitchRow}>
            <TouchableOpacity
              style={[
                styles.formatBtn,
                aspectFormat === '9_16' && styles.formatBtnActive,
              ]}
              onPress={() => {
                prodayHaptics.selection();
                setAspectFormat('9_16');
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="phone-portrait-outline"
                size={14}
                color={aspectFormat === '9_16' ? PLAYER_DARK.bg : PLAYER_DARK.textMuted}
              />
              <Text
                style={[
                  styles.formatBtnText,
                  aspectFormat === '9_16' && styles.formatBtnTextActive,
                ]}
              >
                Story 9:16 (Insta / TikTok)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.formatBtn,
                aspectFormat === '1_1' && styles.formatBtnActive,
              ]}
              onPress={() => {
                prodayHaptics.selection();
                setAspectFormat('1_1');
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="square-outline"
                size={14}
                color={aspectFormat === '1_1' ? PLAYER_DARK.bg : PLAYER_DARK.textMuted}
              />
              <Text
                style={[
                  styles.formatBtnText,
                  aspectFormat === '1_1' && styles.formatBtnTextActive,
                ]}
              >
                Post Carré 1:1
              </Text>
            </TouchableOpacity>
          </View>

          {/* Story / Post Canvas Preview */}
          <LinearGradient
            colors={PLAYER_DARK.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.storyCanvas,
              aspectFormat === '9_16' ? styles.canvas916 : styles.canvasSquare,
            ]}
          >
            {/* Top Club & Match Branding */}
            <View style={styles.storyTopBranding}>
              <View style={styles.clubLogoRow}>
                {clubLogoUrl ? (
                  <Image source={{ uri: clubLogoUrl }} style={styles.clubLogoImg} />
                ) : (
                  <View style={styles.clubEmblemBox}>
                    <Ionicons name="shield" size={16} color={PLAYER_DARK.accent} />
                  </View>
                )}
                <View style={styles.clubInfoCol}>
                  <Text style={styles.clubNameText}>{clubName.toUpperCase()}</Text>
                  <Text style={styles.clubCategoryText}>EFFECTIF OFFICIEL · R1 SENIORS</Text>
                </View>
                <View style={styles.certifiedTag}>
                  <Ionicons name="checkmark-circle" size={12} color={PLAYER_DARK.accent} />
                  <Text style={styles.certifiedTagText}>CERTIFIÉ</Text>
                </View>
              </View>

              {fixtureLabel ? (
                <View style={styles.fixtureBanner}>
                  <Text style={styles.fixtureText}>{fixtureLabel}</Text>
                </View>
              ) : null}
            </View>

            {/* Central FUT Player Card */}
            <View style={styles.cardContainer}>
              <LiveFutPlayerCard player={player} size="hero" showFlipBio={false} />
            </View>

            {/* Stats du Week-end — masqué tant que le staff n'a rien publié */}
            {publishedLines.length > 0 ? (
            <View style={styles.weekendCard}>
              <View style={styles.weekendHeader}>
                <Ionicons name="flame" size={13} color={CLUB_TOKENS.warning} />
                <Text style={styles.weekendHeaderTitle}>STATS DU WEEK-END</Text>
              </View>

              <View style={styles.weekendMetricsRow}>
                {metrics.map((metric, index) => (
                  <React.Fragment key={metric.key}>
                    {index > 0 ? <View style={styles.miniPillDivider} /> : null}
                    <View style={styles.statMiniCol}>
                      <Text style={[styles.statMiniVal, { color: metric.color }]}>
                        {metric.value}
                      </Text>
                      <Text style={styles.statMiniKey}>{metric.key}</Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            </View>
            ) : null}

            {/* Watermark Branding */}
            <View style={styles.watermarkRow}>
              <MaterialCommunityIcons name="lightning-bolt" size={12} color={PLAYER_DARK.accent} />
              <Text style={styles.storyWatermark}>proday75.fr · Flex & Share v4</Text>
            </View>
          </LinearGradient>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.sharePrimaryBtn}
              onPress={handleShare}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={[PLAYER_DARK.accent, PLAYER_DARK.statGreen]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.shareGradient}
              >
                <Ionicons name="share-social" size={18} color={PLAYER_DARK.bg} />
                <Text style={styles.shareBtnText}>Partager ma Story (Instagram / TikTok)</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: CLUB_TOKENS.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: Math.min(SCREEN_WIDTH - 24, 400),
    maxHeight: Math.min(SCREEN_HEIGHT - 40, 720),
    backgroundColor: PLAYER_DARK.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: PLAYER_DARK.borderStrong,
    overflow: 'hidden',
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: PLAYER_DARK.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flexBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bookmark,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  flexBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: PLAYER_DARK.bg,
    letterSpacing: 0.6,
  },
  headerTitle: {
    fontFamily: APPLE_FONT_STACK.display,
    fontSize: 15,
    fontWeight: '800',
    color: PLAYER_DARK.text,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PLAYER_DARK.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatSwitchRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  formatBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PLAYER_DARK.dockBorder,
  },
  formatBtnActive: {
    backgroundColor: PLAYER_DARK.text,
    borderColor: PLAYER_DARK.text,
  },
  formatBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: PLAYER_DARK.textMuted,
  },
  formatBtnTextActive: {
    color: PLAYER_DARK.bg,
    fontWeight: '800',
  },
  storyCanvas: {
    margin: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PLAYER_DARK.accentSoft,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  canvas916: {
    minHeight: 400,
  },
  canvasSquare: {
    minHeight: 350,
  },
  storyTopBranding: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  clubLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 10,
    backgroundColor: PLAYER_DARK.dockBorder,
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: PLAYER_DARK.dockBorder,
  },
  clubLogoImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  clubEmblemBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PLAYER_DARK.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PLAYER_DARK.accent,
  },
  clubInfoCol: {
    flex: 1,
  },
  clubNameText: {
    fontSize: 13,
    fontWeight: '900',
    color: PLAYER_DARK.text,
    letterSpacing: 0.5,
  },
  clubCategoryText: {
    fontSize: 9,
    fontWeight: '700',
    color: PLAYER_DARK.textMuted,
    marginTop: 1,
  },
  certifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: PLAYER_DARK.accentSoft,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PLAYER_DARK.accent,
  },
  certifiedTagText: {
    fontSize: 9,
    fontWeight: '900',
    color: PLAYER_DARK.accent,
    letterSpacing: 0.5,
  },
  fixtureBanner: {
    marginTop: 6,
    backgroundColor: PLAYER_DARK.dockBorder,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  fixtureText: {
    fontSize: 10,
    fontWeight: '700',
    color: PLAYER_DARK.text,
    letterSpacing: 0.3,
  },
  cardContainer: {
    marginVertical: 4,
  },
  weekendCard: {
    width: '100%',
    backgroundColor: PLAYER_DARK.bg,
    borderWidth: 1,
    borderColor: PLAYER_DARK.borderStrong,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 6,
  },
  weekendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  weekendHeaderTitle: {
    fontSize: 9,
    fontWeight: '900',
    color: CLUB_TOKENS.warning,
    letterSpacing: 0.7,
  },
  weekendMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statMiniCol: {
    alignItems: 'center',
    flex: 1,
  },
  statMiniVal: {
    fontFamily: APPLE_FONT_STACK.display,
    fontSize: 13,
    fontWeight: '900',
    color: PLAYER_DARK.text,
  },
  statMiniKey: {
    fontSize: 8,
    fontWeight: '800',
    color: PLAYER_DARK.textDim,
    marginTop: 2,
  },
  miniPillDivider: {
    width: 1,
    height: 18,
    backgroundColor: PLAYER_DARK.borderStrong,
  },
  watermarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  storyWatermark: {
    fontSize: 9,
    color: PLAYER_DARK.textDim,
    fontWeight: '600',
  },
  actionsRow: {
    paddingHorizontal: 16,
  },
  sharePrimaryBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  shareGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
  },
  shareBtnText: {
    fontFamily: APPLE_FONT_STACK.display,
    fontSize: 14,
    fontWeight: '900',
    color: PLAYER_DARK.bg,
  },
});
