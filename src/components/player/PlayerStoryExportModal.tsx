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

export interface WeekendStats {
  matchTitle?: string;
  result?: string;
  matchRating?: number;
  goals?: number;
  assists?: number;
  distanceKm?: number;
  duelsPct?: number;
  minutes?: number;
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

  const stats: WeekendStats = {
    matchTitle: weekendStats?.matchTitle ?? 'J17 · Championnat R1',
    result: weekendStats?.result ?? 'Victoire 3 - 1',
    matchRating: weekendStats?.matchRating ?? 8.5,
    goals: weekendStats?.goals ?? (player.goals != null && player.goals > 0 ? player.goals : 2),
    assists: weekendStats?.assists ?? (player.assists != null && player.assists > 0 ? player.assists : 1),
    distanceKm: weekendStats?.distanceKm ?? 10.4,
    duelsPct: weekendStats?.duelsPct ?? 74,
    minutes: weekendStats?.minutes ?? 90,
  };

  const clubName = player.clubName || 'FC ProDay';

  const handleShare = async () => {
    prodayHaptics.impactMedium();
    try {
      await Share.share({
        title: `ProDay Flex & Share — ${player.name} (${player.pos} · OVR ${player.ovr})`,
        message: `🔥 PRODAY FLEX & SHARE\n${player.name} | ${player.pos} · OVR ${player.ovr} (${clubName})\n⚽ Stats du week-end : ${stats.result} (${stats.matchTitle})\n⭐ Note Staff : ${stats.matchRating}/10 | ${stats.goals} But(s) | ${stats.assists} Passe(s) D | ${stats.distanceKm} km parcourus\n📲 Retrouve ma carte FUT officielle sur ProDay ! https://proday75.fr #ProDay #FlexAndShare #FUT #Football`,
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
                <Ionicons name="sparkles" size={13} color="#000000" />
                <Text style={styles.flexBadgeText}>FLEX & SHARE</Text>
              </View>
              <Text style={styles.headerTitle}>Story & Visuel HD</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="#94A3B8" />
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
                color={aspectFormat === '9_16' ? '#000000' : '#94A3B8'}
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
                color={aspectFormat === '1_1' ? '#000000' : '#94A3B8'}
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
            colors={['#0F172A', '#090D16', '#020617']}
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
                    <Ionicons name="shield" size={16} color="#30D158" />
                  </View>
                )}
                <View style={styles.clubInfoCol}>
                  <Text style={styles.clubNameText}>{clubName.toUpperCase()}</Text>
                  <Text style={styles.clubCategoryText}>EFFECTIF OFFICIEL · R1 SENIORS</Text>
                </View>
                <View style={styles.certifiedTag}>
                  <Ionicons name="checkmark-circle" size={12} color="#30D158" />
                  <Text style={styles.certifiedTagText}>CERTIFIÉ</Text>
                </View>
              </View>

              <View style={styles.fixtureBanner}>
                <Text style={styles.fixtureText}>{stats.matchTitle} — {stats.result}</Text>
              </View>
            </View>

            {/* Central FUT Player Card */}
            <View style={styles.cardContainer}>
              <LiveFutPlayerCard player={player} size="hero" showFlipBio={false} />
            </View>

            {/* Stats du Week-end Module */}
            <View style={styles.weekendCard}>
              <View style={styles.weekendHeader}>
                <Ionicons name="flame" size={13} color="#FF9F0A" />
                <Text style={styles.weekendHeaderTitle}>STATS DU WEEK-END</Text>
              </View>

              <View style={styles.weekendMetricsRow}>
                <View style={styles.statMiniCol}>
                  <Text style={[styles.statMiniVal, { color: '#FFD700' }]}>
                    {stats.matchRating}
                  </Text>
                  <Text style={styles.statMiniKey}>NOTE STAFF</Text>
                </View>
                <View style={styles.miniPillDivider} />
                <View style={styles.statMiniCol}>
                  <Text style={[styles.statMiniVal, { color: '#30D158' }]}>
                    {stats.goals}
                  </Text>
                  <Text style={styles.statMiniKey}>BUTS</Text>
                </View>
                <View style={styles.miniPillDivider} />
                <View style={styles.statMiniCol}>
                  <Text style={[styles.statMiniVal, { color: '#0A84FF' }]}>
                    {stats.assists}
                  </Text>
                  <Text style={styles.statMiniKey}>PASSES D</Text>
                </View>
                <View style={styles.miniPillDivider} />
                <View style={styles.statMiniCol}>
                  <Text style={[styles.statMiniVal, { color: '#FFFFFF' }]}>
                    {stats.distanceKm} km
                  </Text>
                  <Text style={styles.statMiniKey}>DISTANCE</Text>
                </View>
                <View style={styles.miniPillDivider} />
                <View style={styles.statMiniCol}>
                  <Text style={[styles.statMiniVal, { color: '#30D158' }]}>
                    {stats.duelsPct}%
                  </Text>
                  <Text style={styles.statMiniKey}>DUELS</Text>
                </View>
              </View>
            </View>

            {/* Watermark Branding */}
            <View style={styles.watermarkRow}>
              <MaterialCommunityIcons name="lightning-bolt" size={12} color="#30D158" />
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
                colors={['#30D158', '#22C55E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.shareGradient}
              >
                <Ionicons name="share-social" size={18} color="#000000" />
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
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: Math.min(SCREEN_WIDTH - 24, 400),
    maxHeight: Math.min(SCREEN_HEIGHT - 40, 720),
    backgroundColor: '#111319',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
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
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
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
    backgroundColor: '#FFD700',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  flexBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.6,
  },
  headerTitle: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
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
    backgroundColor: '#181C26',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  formatBtnActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  formatBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  formatBtnTextActive: {
    color: '#000000',
    fontWeight: '800',
  },
  storyCanvas: {
    margin: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.25)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
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
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.3)',
  },
  clubInfoCol: {
    flex: 1,
  },
  clubNameText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  clubCategoryText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 1,
  },
  certifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(48, 209, 88, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.3)',
  },
  certifiedTagText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#30D158',
    letterSpacing: 0.5,
  },
  fixtureBanner: {
    marginTop: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  fixtureText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E2E8F0',
    letterSpacing: 0.3,
  },
  cardContainer: {
    marginVertical: 4,
  },
  weekendCard: {
    width: '100%',
    backgroundColor: 'rgba(10, 12, 18, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
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
    color: '#FF9F0A',
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
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  statMiniKey: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 2,
  },
  miniPillDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  watermarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  storyWatermark: {
    fontSize: 9,
    color: '#64748B',
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
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 14,
    fontWeight: '900',
    color: '#000000',
  },
});
