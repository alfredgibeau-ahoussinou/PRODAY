import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  Share,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { LiveFutPlayerCard, type LiveFutCardData } from './LiveFutPlayerCard';

interface PlayerStoryExportModalProps {
  visible: boolean;
  player: LiveFutCardData;
  onClose: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const PlayerStoryExportModal: React.FC<PlayerStoryExportModalProps> = ({
  visible,
  player,
  onClose,
}) => {
  const handleShare = async () => {
    prodayHaptics.impactMedium();
    try {
      await Share.share({
        title: `ProDay — ${player.name} (${player.pos} · OVR ${player.ovr})`,
        message: `🔥 Retrouve ma carte officielle ProDay FUT et mes stats en direct : OVR ${player.ovr} | ${player.goals ?? 0} Buts | ${player.assists ?? 0} Passes Décisives sur l'app ProDay ! ⚽ #ProDay #FUT #FootballAmateur`,
        url: 'https://proday.app',
      });
    } catch {
      // Ignored
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header Bar */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="sparkles" size={18} color="#FFD700" />
              <Text style={styles.headerTitle}>Export Story ProDay</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* 9:16 Story Preview Canvas */}
          <LinearGradient
            colors={['#0F172A', '#1E1B4B', '#020617']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.storyCanvas}
          >
            {/* Top Branding */}
            <View style={styles.storyTopBranding}>
              <View style={styles.badgeProDay}>
                <Ionicons name="football" size={14} color="#30D158" />
                <Text style={styles.badgeProDayText}>PRODAY MATCH CENTER</Text>
              </View>
              <Text style={styles.storySubtitle}>J17 · PERFORMANCE OFFICIELLE</Text>
            </View>

            {/* Central FUT Card */}
            <View style={styles.cardContainer}>
              <LiveFutPlayerCard player={player} size="hero" showFlipBio={false} />
            </View>

            {/* Bottom Performance Pill */}
            <View style={styles.storyBottomPill}>
              <View style={styles.statMiniCol}>
                <Text style={styles.statMiniVal}>{player.matchesPlayed ?? 18}</Text>
                <Text style={styles.statMiniKey}>MATCHS</Text>
              </View>
              <View style={styles.miniPillDivider} />
              <View style={styles.statMiniCol}>
                <Text style={[styles.statMiniVal, { color: '#30D158' }]}>{player.goals ?? 12}</Text>
                <Text style={styles.statMiniKey}>BUTS</Text>
              </View>
              <View style={styles.miniPillDivider} />
              <View style={styles.statMiniCol}>
                <Text style={[styles.statMiniVal, { color: '#0A84FF' }]}>{player.assists ?? 7}</Text>
                <Text style={styles.statMiniKey}>PASSES</Text>
              </View>
              <View style={styles.miniPillDivider} />
              <View style={styles.statMiniCol}>
                <Text style={[styles.statMiniVal, { color: '#FFD700' }]}>7.8</Text>
                <Text style={styles.statMiniKey}>NOTE STAFF</Text>
              </View>
            </View>

            <Text style={styles.storyWatermark}>proday.app · Profil Certifié Coach</Text>
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
                <Text style={styles.shareBtnText}>Partager ma Carte (Instagram / TikTok)</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: Math.min(SCREEN_WIDTH - 32, 380),
    backgroundColor: '#141418',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 16,
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
  storyCanvas: {
    margin: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  storyTopBranding: {
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeProDay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(48, 209, 88, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.3)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeProDayText: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 10,
    fontWeight: '800',
    color: '#30D158',
    letterSpacing: 0.8,
  },
  storySubtitle: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  cardContainer: {
    marginVertical: 8,
  },
  storyBottomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
    width: '100%',
    marginTop: 10,
  },
  statMiniCol: {
    alignItems: 'center',
  },
  statMiniVal: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statMiniKey: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 8,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },
  miniPillDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  storyWatermark: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 9,
    color: '#475569',
    marginTop: 10,
  },
  actionsRow: {
    paddingHorizontal: 16,
  },
  sharePrimaryBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  shareGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  shareBtnText: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 14,
    fontWeight: '800',
    color: '#000000',
  },
});
