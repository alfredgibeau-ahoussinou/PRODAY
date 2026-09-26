import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Share,
  Platform,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export interface PlayerCardStats {
  pac: number; // Vitesse / Pace
  sho: number; // Tir / Shooting
  pas: number; // Passe / Passing
  dri: number; // Dribble / Dribbling
  def: number; // Défense / Defending
  phy: number; // Physique / Physical
}

interface ShareablePlayerCardModalProps {
  visible: boolean;
  onClose: () => void;
  playerName: string;
  position?: string;
  rating?: number;
  clubName?: string;
  category?: string;
  stats?: PlayerCardStats;
  goalsThisSeason?: number;
  assistsThisSeason?: number;
  mvpCount?: number;
}

export const ShareablePlayerCardModal: React.FC<ShareablePlayerCardModalProps> = ({
  visible,
  onClose,
  playerName,
  position = 'ATT',
  rating = 88,
  clubName = 'PRODAY FC',
  category = 'U17 R1',
  stats = { pac: 89, sho: 86, pas: 84, dri: 88, def: 52, phy: 80 },
  goalsThisSeason = 14,
  assistsThisSeason = 9,
  mvpCount = 3,
}) => {
  const [cardTheme, setCardTheme] = useState<'gold' | 'totw' | 'diamond'>('gold');

  const themeGradients = {
    gold: ['#FFE082', '#FFB300', '#B78103'] as const,
    totw: ['#1E1B18', '#2D2820', '#C6A052'] as const,
    diamond: ['#00C6FF', '#0072FF', '#0F2027'] as const,
  };

  const themeTextColors = {
    gold: '#3E2723',
    totw: '#F8FAFC',
    diamond: '#F8FAFC',
  };

  const handleShare = async () => {
    try {
      const message = `🏆 Ma carte joueur ProDay !\n⚽ ${playerName} (${position} - ${rating})\n📊 Buts: ${goalsThisSeason} | Passes D: ${assistsThisSeason} | Étoiles MVP: ${mvpCount}\nClub: ${clubName} (${category})\n\nSuivez mes perfs sur ProDay ! 🚀`;
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({ title: `Carte ProDay - ${playerName}`, text: message });
        } else {
          await navigator.clipboard.writeText(message);
          Alert.alert('Copié !', 'Le résumé de votre carte a été copié dans le presse-papier.');
        }
      } else {
        await Share.share({
          message,
          title: `Carte ProDay - ${playerName}`,
        });
      }
    } catch (e) {
      console.error('Error sharing player card:', e);
    }
  };

  const textColor = themeTextColors[cardTheme];

  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, onClose]);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Header Controls */}
          <View style={styles.topBar}>
            <View style={styles.themeSelector}>
              {(['gold', 'totw', 'diamond'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.themeChip, cardTheme === t && styles.themeChipActive]}
                  onPress={() => setCardTheme(t)}
                >
                  <Text
                    style={[
                      styles.themeChipText,
                      cardTheme === t && styles.themeChipTextActive,
                    ]}
                  >
                    {t.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Fermer">
              <MaterialCommunityIcons name="close" size={24} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* FUT Card Container */}
          <View style={styles.cardContainer}>
            <LinearGradient
              colors={themeGradients[cardTheme]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              {/* Card Shield Header */}
              <View style={styles.cardTop}>
                <View style={styles.ratingBox}>
                  <Text style={[styles.ratingVal, { color: textColor }]}>{rating}</Text>
                  <Text style={[styles.posVal, { color: textColor }]}>{position}</Text>
                  <View style={styles.divider} />
                  <MaterialCommunityIcons
                    name="shield-star"
                    size={22}
                    color={cardTheme === 'gold' ? '#B78103' : '#FBBF24'}
                  />
                </View>

                {/* Avatar Placeholder */}
                <View style={styles.avatarContainer}>
                  <View style={styles.avatarCircle}>
                    <MaterialCommunityIcons name="account" size={76} color={textColor} />
                  </View>
                </View>
              </View>

              {/* Player Name */}
              <View style={styles.nameContainer}>
                <Text numberOfLines={1} style={[styles.playerName, { color: textColor }]}>
                  {playerName.toUpperCase()}
                </Text>
                <Text style={[styles.clubCategory, { color: textColor }]}>
                  {clubName} • {category}
                </Text>
              </View>

              <View style={[styles.goldLine, { backgroundColor: textColor, opacity: 0.3 }]} />

              {/* 6 Stats Grid */}
              <View style={styles.statsGrid}>
                <View style={styles.statCol}>
                  <View style={styles.statRow}>
                    <Text style={[styles.statVal, { color: textColor }]}>{stats.pac}</Text>
                    <Text style={[styles.statLabel, { color: textColor }]}>VIT</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={[styles.statVal, { color: textColor }]}>{stats.sho}</Text>
                    <Text style={[styles.statLabel, { color: textColor }]}>TIR</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={[styles.statVal, { color: textColor }]}>{stats.pas}</Text>
                    <Text style={[styles.statLabel, { color: textColor }]}>PAS</Text>
                  </View>
                </View>

                <View style={[styles.statDivider, { backgroundColor: textColor, opacity: 0.25 }]} />

                <View style={styles.statCol}>
                  <View style={styles.statRow}>
                    <Text style={[styles.statVal, { color: textColor }]}>{stats.dri}</Text>
                    <Text style={[styles.statLabel, { color: textColor }]}>DRI</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={[styles.statVal, { color: textColor }]}>{stats.def}</Text>
                    <Text style={[styles.statLabel, { color: textColor }]}>DEF</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={[styles.statVal, { color: textColor }]}>{stats.phy}</Text>
                    <Text style={[styles.statLabel, { color: textColor }]}>PHY</Text>
                  </View>
                </View>
              </View>

              {/* Season Accolades Bottom Bar */}
              <View style={styles.bottomAccolades}>
                <View style={styles.accoladeItem}>
                  <Text style={[styles.accoladeNum, { color: textColor }]}>{goalsThisSeason}</Text>
                  <Text style={[styles.accoladeText, { color: textColor }]}>Buts</Text>
                </View>
                <View style={styles.accoladeItem}>
                  <Text style={[styles.accoladeNum, { color: textColor }]}>{assistsThisSeason}</Text>
                  <Text style={[styles.accoladeText, { color: textColor }]}>Passes D</Text>
                </View>
                <View style={styles.accoladeItem}>
                  <Text style={[styles.accoladeNum, { color: textColor }]}>{mvpCount} ⭐</Text>
                  <Text style={[styles.accoladeText, { color: textColor }]}>MVP</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Action Share Buttons */}
          <View style={styles.actionsBar}>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
              <MaterialCommunityIcons name="share-variant" size={20} color="#FFFFFF" />
              <Text style={styles.shareBtnText}>Partager ma Carte</Text>
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
  content: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  themeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  themeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  themeChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
  },
  themeChipText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
  },
  themeChipTextActive: {
    color: '#FFFFFF',
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 22,
  },
  cardContainer: {
    width: 320,
    height: 480,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  card: {
    flex: 1,
    borderRadius: 24,
    padding: 18,
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  ratingBox: {
    alignItems: 'center',
    width: 50,
  },
  ratingVal: {
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 36,
  },
  posVal: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  divider: {
    width: 24,
    height: 2,
    backgroundColor: 'rgba(0,0,0,0.15)',
    marginVertical: 4,
  },
  avatarContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameContainer: {
    alignItems: 'center',
    marginTop: 6,
  },
  playerName: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },
  clubCategory: {
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.8,
    marginTop: 2,
  },
  goldLine: {
    height: 1.5,
    width: '100%',
    marginVertical: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  statCol: {
    width: '42%',
    gap: 4,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statVal: {
    fontSize: 18,
    fontWeight: '900',
    width: 28,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '800',
    opacity: 0.8,
  },
  statDivider: {
    width: 1,
    height: 60,
  },
  bottomAccolades: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    paddingVertical: 8,
    marginTop: 8,
  },
  accoladeItem: {
    alignItems: 'center',
  },
  accoladeNum: {
    fontSize: 15,
    fontWeight: '900',
  },
  accoladeText: {
    fontSize: 10,
    fontWeight: '700',
    opacity: 0.8,
  },
  actionsBar: {
    width: '100%',
    marginTop: 20,
  },
  shareBtn: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
});
