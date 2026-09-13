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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Rect, Path } from 'react-native-svg';
import { prodayHaptics } from '../../utils/prodayHaptics';
import {
  type PlayerPassportData,
  playerPassportService,
} from '../../services/playerPassport.service';

interface PlayerCertifiedPassportModalProps {
  visible: boolean;
  passport: PlayerPassportData;
  onClose: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Stylized procedural vector QR Code
const VectorQrCode: React.FC<{ size?: number }> = ({ size = 140 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Rect width="100" height="100" fill="#FFFFFF" rx="8" />
    {/* Top Left Marker */}
    <Rect x="8" y="8" width="26" height="26" fill="#000000" rx="3" />
    <Rect x="13" y="13" width="16" height="16" fill="#FFFFFF" rx="2" />
    <Rect x="17" y="17" width="8" height="8" fill="#000000" rx="1" />
    {/* Top Right Marker */}
    <Rect x="66" y="8" width="26" height="26" fill="#000000" rx="3" />
    <Rect x="71" y="13" width="16" height="16" fill="#FFFFFF" rx="2" />
    <Rect x="75" y="17" width="8" height="8" fill="#000000" rx="1" />
    {/* Bottom Left Marker */}
    <Rect x="8" y="66" width="26" height="26" fill="#000000" rx="3" />
    <Rect x="13" y="71" width="16" height="16" fill="#FFFFFF" rx="2" />
    <Rect x="17" y="75" width="8" height="8" fill="#000000" rx="1" />
    {/* Procedural Data Pattern */}
    <Path
      d="M40 10h6v6h-6zm12 0h6v6h-6zm-12 12h6v6h-6zm18 0h6v6h-6zm6 6h6v6h-6zm-30 12h6v6h-6zm12 0h6v6h-6zm12 0h6v6h-6zm12 0h6v6h-6zm-36 12h6v6h-6zm12 0h12v6H46zm18 0h6v6h-6zm6 6h6v6h-6zm-30 6h6v6h-6zm12 0h6v6h-6zm12 0h6v6h-6zm12 0h6v6h-6zm-30 12h6v6h-6zm12 0h12v6H58zm18 0h6v6h-6z"
      fill="#000000"
    />
  </Svg>
);

export const PlayerCertifiedPassportModal: React.FC<PlayerCertifiedPassportModalProps> = ({
  visible,
  passport,
  onClose,
}) => {
  const handleShareLink = async () => {
    prodayHaptics.impactLight();
    const url = playerPassportService.getPassportQrUrl(passport);
    try {
      await Share.share({
        title: `Passeport ProDay — ${passport.fullName}`,
        message: `📋 Consulter le passeport athlétique certifié de ${passport.fullName} (${passport.clubName}) : ${url}`,
        url,
      });
    } catch {
      // Ignored
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Top Bar */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <MaterialCommunityIcons name="shield-check" size={20} color="#30D158" />
              <Text style={styles.headerTitle}>Passeport Athlétique Certifié</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Passport Document Card */}
          <LinearGradient
            colors={['#161E2E', '#0F172A', '#0B0F19']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.passportCard}
          >
            {/* Top Seal & FFF Info */}
            <View style={styles.sealRow}>
              <View style={styles.federationTag}>
                <Ionicons name="ribbon" size={14} color="#0A84FF" />
                <Text style={styles.federationText}>CERTIFICATION COACH FFF</Text>
              </View>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#30D158" />
                <Text style={styles.verifiedText}>STATUT VÉRIFIÉ</Text>
              </View>
            </View>

            {/* Player Info Summary */}
            <View style={styles.playerBioSection}>
              <Text style={styles.playerName}>{passport.fullName.toUpperCase()}</Text>
              <Text style={styles.playerClub}>
                {passport.clubName} · {passport.category} ({passport.position})
              </Text>
              <Text style={styles.licenseNumber}>Licence N° {passport.licenseNumber}</Text>
            </View>

            {/* Verified Metrics Matrix */}
            <View style={styles.metricsBox}>
              <View style={styles.metricCol}>
                <Text style={styles.metricVal}>{passport.matchesPlayed}</Text>
                <Text style={styles.metricLbl}>MATCHS</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricCol}>
                <Text style={[styles.metricVal, { color: '#30D158' }]}>{passport.goals}</Text>
                <Text style={styles.metricLbl}>BUTS</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricCol}>
                <Text style={[styles.metricVal, { color: '#0A84FF' }]}>{passport.assists}</Text>
                <Text style={styles.metricLbl}>PASSES</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricCol}>
                <Text style={[styles.metricVal, { color: '#FFD700' }]}>{passport.averageRating}/10</Text>
                <Text style={styles.metricLbl}>NOTE STAFF</Text>
              </View>
            </View>

            {/* Secure QR Code Scanner Block */}
            <View style={styles.qrSection}>
              <View style={styles.qrContainer}>
                <VectorQrCode size={130} />
              </View>
              <Text style={styles.qrInstructions}>
                Scannez avec un appareil photo pour vérifier l'authenticité auprès de la cellule recrutement
              </Text>
              <Text style={styles.signatureCode}>Empreinte : {passport.signatureHash}</Text>
            </View>

            <View style={styles.endorsementRow}>
              <Ionicons name="finger-print" size={14} color="#64748B" />
              <Text style={styles.endorsedBy}>
                Signé numériquement par {passport.coachName} (Staff Technique)
              </Text>
            </View>
          </LinearGradient>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShareLink} activeOpacity={0.88}>
              <LinearGradient
                colors={['#0A84FF', '#0070E0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.shareGradient}
              >
                <Ionicons name="link" size={16} color="#FFFFFF" />
                <Text style={styles.shareBtnText}>Partager le Lien Sécurisé Recruteur</Text>
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
  passportCard: {
    margin: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 16,
  },
  sealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  federationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(10, 132, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  federationText: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 9,
    fontWeight: '800',
    color: '#0A84FF',
    letterSpacing: 0.5,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(48, 209, 88, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  verifiedText: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 9,
    fontWeight: '800',
    color: '#30D158',
  },
  playerBioSection: {
    alignItems: 'center',
    marginBottom: 14,
  },
  playerName: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  playerClub: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
  licenseNumber: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  metricsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  metricCol: {
    alignItems: 'center',
  },
  metricVal: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  metricLbl: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 8,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  qrContainer: {
    padding: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  qrInstructions: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 12,
    lineHeight: 14,
  },
  signatureCode: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 9,
    color: '#475569',
    marginTop: 4,
    fontWeight: '600',
  },
  endorsementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 10,
  },
  endorsedBy: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 10,
    color: '#64748B',
    fontStyle: 'italic',
  },
  actions: {
    paddingHorizontal: 16,
  },
  shareBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  shareGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  shareBtnText: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
