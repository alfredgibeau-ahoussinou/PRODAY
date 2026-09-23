import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { TeamEvent } from '../../models/TeamEvent';
import { radius, spacing } from '../../theme/designTokens';

interface MatchConvocationPosterModalProps {
  visible: boolean;
  event: TeamEvent;
  onClose: () => void;
  clubName?: string;
  sponsorName?: string;
}

export const MatchConvocationPosterModal: React.FC<MatchConvocationPosterModalProps> = ({
  visible,
  event,
  onClose,
  clubName = 'PRODAY FC',
  sponsorName = 'Partenaire Officiel',
}) => {
  const [aspectRatio, setAspectRatio] = useState<'story' | 'square'>('story');

  const starters = event.lineup?.slots?.filter((s) => s.role === 'starter') ?? [];
  const subs = event.lineup?.slots?.filter((s) => s.role === 'sub') ?? [];
  const confirmedUids = Object.keys(event.rsvps).filter((uid) => event.rsvps[uid] === 'yes');

  const matchDate = event.starts_at instanceof Date
    ? event.starts_at.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    : String(event.date || 'Jour de match');

  const matchTime = event.starts_at instanceof Date
    ? event.starts_at.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '15:00';

  const rdvTime = event.carpool_slots?.[0]?.meeting_time || '1 h 15 avant coup d’envoi';
  const opponent = event.live_state?.opponent_name || event.title;

  const handleShareWhatsApp = () => {
    const text = `🏆 *CONVOCATION OFFICIELLE — ${clubName}*\n\n` +
      `⚽ *Match :* ${event.title}\n` +
      `📅 *Date :* ${matchDate} à ${matchTime}\n` +
      `📍 *Lieu :* ${event.location_label || event.city}\n` +
      `⏰ *RDV :* ${rdvTime}\n\n` +
      `📋 *GROUPE CONVOQUÉ (${confirmedUids.length} joueurs) :*\n` +
      (starters.length > 0
        ? `*Titulaires :*\n${starters.map((s, i) => ` ${i + 1}. ${s.display_name}`).join('\n')}\n`
        : '') +
      (subs.length > 0
        ? `*Remplaçants :*\n${subs.map((s, i) => ` ${starters.length + i + 1}. ${s.display_name}`).join('\n')}\n`
        : '') +
      `\n🔗 Retrouvez le covoiturage & bus sur l'application ProDay !`;

    const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
    void Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        void Linking.openURL(url);
      } else {
        void Share.share({ message: text, title: 'Convocation Match' });
      }
    });
  };

  const handleNativeShare = async () => {
    try {
      await Share.share({
        message: `Convocation ${event.title} - ${clubName} : RDV ${rdvTime} à ${event.location_label || event.city}`,
        title: 'Affiche de Convocation',
      });
    } catch {
      // ignore
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <View>
              <Text style={styles.modalTitle}>Affiche de Convocation</Text>
              <Text style={styles.modalSub}>Prête pour WhatsApp & Instagram</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Fermer">
              <Ionicons name="close" size={24} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Format Selector */}
          <View style={styles.formatRow}>
            <TouchableOpacity
              style={[styles.formatBtn, aspectRatio === 'story' && styles.formatBtnActive]}
              onPress={() => setAspectRatio('story')}
            >
              <Ionicons name="expand" size={16} color={aspectRatio === 'story' ? '#38BDF8' : '#94A3B8'} />
              <Text style={[styles.formatBtnText, aspectRatio === 'story' && styles.formatBtnTextActive]}>
                Format Story (9:16)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.formatBtn, aspectRatio === 'square' && styles.formatBtnActive]}
              onPress={() => setAspectRatio('square')}
            >
              <Ionicons name="grid" size={16} color={aspectRatio === 'square' ? '#38BDF8' : '#94A3B8'} />
              <Text style={[styles.formatBtnText, aspectRatio === 'square' && styles.formatBtnTextActive]}>
                Format Carré (1:1)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Poster Preview */}
          <ScrollView style={styles.previewScroll} showsVerticalScrollIndicator={false}>
            <View style={[styles.poster, aspectRatio === 'story' ? styles.posterStory : styles.posterSquare]}>
              {/* Poster Header */}
              <View style={styles.posterTop}>
                <View style={styles.crestCircle}>
                  <Text style={styles.crestLetter}>{clubName.charAt(0)}</Text>
                </View>
                <Text style={styles.posterClubName}>{clubName}</Text>
                <View style={styles.matchTag}>
                  <Text style={styles.matchTagText}>JOUR DE MATCH</Text>
                </View>
              </View>

              {/* Match Details Banner */}
              <View style={styles.matchBanner}>
                <Text style={styles.posterVs}>CONVOCATION OFFICIELLE</Text>
                <Text style={styles.posterOpponent} numberOfLines={2}>{opponent}</Text>
                <View style={styles.detailsGrid}>
                  <View style={styles.detailItem}>
                    <Ionicons name="calendar" size={13} color="#FBBF24" />
                    <Text style={styles.detailText}>{matchDate}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="time" size={13} color="#FBBF24" />
                    <Text style={styles.detailText}>Coup d'envoi : {matchTime}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="location" size={13} color="#38BDF8" />
                    <Text style={styles.detailText}>{event.location_label || event.city}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="warning" size={13} color="#34D399" />
                    <Text style={styles.detailText}>RDV : {rdvTime}</Text>
                  </View>
                </View>
              </View>

              {/* Player Roster Section */}
              <View style={styles.rosterSection}>
                <Text style={styles.rosterSectionTitle}>LE GROUPE RETENU</Text>
                <View style={styles.rosterColumns}>
                  {starters.length > 0 ? (
                    <View style={styles.rosterCol}>
                      <Text style={styles.colHeader}>XI DE DÉPART</Text>
                      {starters.map((s, idx) => (
                        <View key={s.uid || idx} style={styles.playerItem}>
                          <Text style={styles.playerNum}>{idx + 1}</Text>
                          <Text style={styles.playerName} numberOfLines={1}>{s.display_name}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  {subs.length > 0 ? (
                    <View style={styles.rosterCol}>
                      <Text style={styles.colHeader}>REMPLAÇANTS</Text>
                      {subs.map((s, idx) => (
                        <View key={s.uid || idx} style={styles.playerItem}>
                          <Text style={[styles.playerNum, styles.subNum]}>{starters.length + idx + 1}</Text>
                          <Text style={styles.playerName} numberOfLines={1}>{s.display_name}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Sponsor & ProDay Branding Footer */}
              <View style={styles.posterFooter}>
                <View style={styles.sponsorBadge}>
                  <Text style={styles.sponsorLabel}>AVEC LE SOUTIEN DE</Text>
                  <Text style={styles.sponsorName}>{sponsorName}</Text>
                </View>
                <Text style={styles.prodayBrand}>PRODAY FOOTBALL</Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Bar */}
          <View style={styles.actionBar}>
            <TouchableOpacity style={styles.whatsappBtn} onPress={handleShareWhatsApp}>
              <Ionicons name="chatbubbles" size={18} color="#FFFFFF" />
              <Text style={styles.whatsappBtnText}>Partager sur WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareBtn} onPress={handleNativeShare}
              accessibilityRole="button"
              accessibilityLabel="Partager">
              <Ionicons name="share" size={18} color="#F8FAFC" />
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.4,
  },
  modalSub: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  formatRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.md,
  },
  formatBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  formatBtnActive: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  formatBtnText: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 12,
  },
  formatBtnTextActive: {
    color: '#38BDF8',
  },
  previewScroll: {
    maxHeight: 460,
  },
  poster: {
    backgroundColor: '#0B1120',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(202, 138, 4, 0.4)', // Gold border
    padding: spacing.md,
    alignSelf: 'center',
    width: '100%',
    shadowColor: '#CA8A04',
    shadowOpacity: 0.25,
    shadowRadius: 15,
  },
  posterStory: {
    minHeight: 440,
  },
  posterSquare: {
    minHeight: 360,
  },
  posterTop: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  crestCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  crestLetter: {
    color: '#F59E0B',
    fontSize: 20,
    fontWeight: '900',
  },
  posterClubName: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  matchTag: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 99,
    marginTop: 4,
  },
  matchTagText: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  matchBanner: {
    backgroundColor: '#1E293B',
    borderRadius: radius.md,
    padding: 12,
    marginVertical: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: '#38BDF8',
  },
  posterVs: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  posterOpponent: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
    marginBottom: 8,
  },
  detailsGrid: {
    gap: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '500',
  },
  rosterSection: {
    marginTop: 4,
    marginBottom: spacing.md,
  },
  rosterSectionTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 8,
  },
  rosterColumns: {
    flexDirection: 'row',
    gap: 12,
  },
  rosterCol: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: radius.sm,
    padding: 8,
  },
  colHeader: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 2,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  playerNum: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
    width: 18,
  },
  subNum: {
    color: '#94A3B8',
  },
  playerName: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  posterFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 8,
  },
  sponsorBadge: {
    flex: 1,
  },
  sponsorLabel: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sponsorName: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '700',
  },
  prodayBrand: {
    color: '#CA8A04',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  actionBar: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: spacing.md,
  },
  whatsappBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#22C55E',
    paddingVertical: 14,
    borderRadius: radius.md,
  },
  whatsappBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  shareBtn: {
    backgroundColor: '#334155',
    width: 50,
    height: 50,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
