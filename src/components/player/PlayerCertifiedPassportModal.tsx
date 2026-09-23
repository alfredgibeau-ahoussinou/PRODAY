import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  Share,
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
import { colors } from '../../theme/designTokens';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';
import { APPLE_FONT_STACK } from '../../theme/appleTypography';
import { CLUB_TOKENS } from '../../features/club/theme/clubTokens';

interface PlayerCertifiedPassportModalProps {
  visible: boolean;
  passport: PlayerPassportData;
  onClose: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Stylized procedural vector QR Code
const VectorQrCode: React.FC<{ size?: number }> = ({ size = 140 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Rect width="100" height="100" fill={PLAYER_DARK.text} rx="8" />
    {/* Top Left Marker */}
    <Rect x="8" y="8" width="26" height="26" fill={PLAYER_DARK.bg} rx="3" />
    <Rect x="13" y="13" width="16" height="16" fill={PLAYER_DARK.text} rx="2" />
    <Rect x="17" y="17" width="8" height="8" fill={PLAYER_DARK.bg} rx="1" />
    {/* Top Right Marker */}
    <Rect x="66" y="8" width="26" height="26" fill={PLAYER_DARK.bg} rx="3" />
    <Rect x="71" y="13" width="16" height="16" fill={PLAYER_DARK.text} rx="2" />
    <Rect x="75" y="17" width="8" height="8" fill={PLAYER_DARK.bg} rx="1" />
    {/* Bottom Left Marker */}
    <Rect x="8" y="66" width="26" height="26" fill={PLAYER_DARK.bg} rx="3" />
    <Rect x="13" y="71" width="16" height="16" fill={PLAYER_DARK.text} rx="2" />
    <Rect x="17" y="75" width="8" height="8" fill={PLAYER_DARK.bg} rx="1" />
    {/* Procedural Data Pattern */}
    <Path
      d="M40 10h6v6h-6zm12 0h6v6h-6zm-12 12h6v6h-6zm18 0h6v6h-6zm6 6h6v6h-6zm-30 12h6v6h-6zm12 0h6v6h-6zm12 0h6v6h-6zm12 0h6v6h-6zm-36 12h6v6h-6zm12 0h12v6H46zm18 0h6v6h-6zm6 6h6v6h-6zm-30 6h6v6h-6zm12 0h6v6h-6zm12 0h6v6h-6zm12 0h6v6h-6zm-30 12h6v6h-6zm12 0h12v6H58zm18 0h6v6h-6z"
      fill={PLAYER_DARK.bg}
    />
  </Svg>
);

export const PlayerCertifiedPassportModal: React.FC<PlayerCertifiedPassportModalProps> = ({
  visible,
  passport,
  onClose,
}) => {
  /** La certification est celle du staff — jamais un état supposé du visuel. */
  const certified = passport.coachVerified === true;

  const handleShareLink = async () => {
    prodayHaptics.impactLight();
    const url = playerPassportService.getPassportQrUrl(passport);
    try {
      await Share.share({
        title: `Passeport ProDay — ${passport.fullName}`,
        message: `📋 Consulter le passeport athlétique ${certified ? 'certifié' : 'de'} ${passport.fullName} (${passport.clubName}) : ${url}${certified ? '' : ' — certification en attente du staff'}`,
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
              <MaterialCommunityIcons name="shield-check" size={20} color={PLAYER_DARK.accent} />
              <Text style={styles.headerTitle}>Passeport Athlétique Certifié</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Fermer">
              <Ionicons name="close" size={20} color={PLAYER_DARK.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Passport Document Card */}
          <LinearGradient
            colors={PLAYER_DARK.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.passportCard}
          >
            {/* Top Seal & FFF Info */}
            <View style={styles.sealRow}>
              <View style={styles.federationTag}>
                <Ionicons name="ribbon" size={14} color={PLAYER_DARK.statBlue} />
                <Text style={styles.federationText}>CERTIFICATION COACH FFF</Text>
              </View>
              {certified ? (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={PLAYER_DARK.accent} />
                  <Text style={styles.verifiedText}>STATUT VÉRIFIÉ</Text>
                </View>
              ) : (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="time-outline" size={14} color={PLAYER_DARK.textMuted} />
                  <Text style={[styles.verifiedText, { color: PLAYER_DARK.textMuted }]}>
                    CERTIFICATION EN ATTENTE
                  </Text>
                </View>
              )}
            </View>

            {/* Player Info Summary */}
            <View style={styles.playerBioSection}>
              <Text style={styles.playerName}>{passport.fullName.toUpperCase()}</Text>
              <Text style={styles.playerClub}>
                {passport.clubName} · {passport.category} ({passport.position})
              </Text>
              <Text style={styles.licenseNumber}>
                {passport.licenseNumber?.trim()
                  ? `Licence N° ${passport.licenseNumber}`
                  : 'Licence non renseignée'}
              </Text>
            </View>

            {/* Verified Metrics Matrix */}
            <View style={styles.metricsBox}>
              <View style={styles.metricCol}>
                <Text style={styles.metricVal}>{passport.matchesPlayed}</Text>
                <Text style={styles.metricLbl}>MATCHS</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricCol}>
                <Text style={[styles.metricVal, { color: PLAYER_DARK.accent }]}>{passport.goals}</Text>
                <Text style={styles.metricLbl}>BUTS</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricCol}>
                <Text style={[styles.metricVal, { color: PLAYER_DARK.statBlue }]}>{passport.assists}</Text>
                <Text style={styles.metricLbl}>PASSES</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricCol}>
                <Text style={[styles.metricVal, { color: colors.bookmark }]}>
                  {passport.averageRating > 0 ? `${passport.averageRating}/10` : '—'}
                </Text>
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
              {passport.signatureHash?.trim() ? (
                <Text style={styles.signatureCode}>Empreinte : {passport.signatureHash}</Text>
              ) : null}
            </View>

            <View style={styles.endorsementRow}>
              <Ionicons name="finger-print" size={14} color={PLAYER_DARK.textDim} />
              <Text style={styles.endorsedBy}>
                {passport.coachName?.trim()
                  ? `Signé numériquement par ${passport.coachName} (Staff Technique)`
                  : 'En attente de signature du staff technique'}
              </Text>
            </View>
          </LinearGradient>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShareLink} activeOpacity={0.88}>
              <LinearGradient
                colors={[PLAYER_DARK.accent, PLAYER_DARK.statGreen]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.shareGradient}
              >
                <Ionicons name="link" size={16} color={PLAYER_DARK.bg} />
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
    backgroundColor: CLUB_TOKENS.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: Math.min(SCREEN_WIDTH - 32, 380),
    backgroundColor: colors.surface,
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
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: PLAYER_DARK.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: APPLE_FONT_STACK.display,
    fontSize: 16,
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
  passportCard: {
    margin: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: PLAYER_DARK.borderStrong,
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
    backgroundColor: PLAYER_DARK.surfaceRaised,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  federationText: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 9,
    fontWeight: '800',
    color: PLAYER_DARK.statBlue,
    letterSpacing: 0.5,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: PLAYER_DARK.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  verifiedText: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 9,
    fontWeight: '800',
    color: PLAYER_DARK.accent,
  },
  playerBioSection: {
    alignItems: 'center',
    marginBottom: 14,
  },
  playerName: {
    fontFamily: APPLE_FONT_STACK.display,
    fontSize: 17,
    fontWeight: '900',
    color: PLAYER_DARK.text,
    letterSpacing: 0.8,
  },
  playerClub: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 12,
    fontWeight: '600',
    color: PLAYER_DARK.textMuted,
    marginTop: 2,
  },
  licenseNumber: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 11,
    color: PLAYER_DARK.textDim,
    marginTop: 2,
  },
  metricsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: PLAYER_DARK.bg,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    borderRadius: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  metricCol: {
    alignItems: 'center',
  },
  metricVal: {
    fontFamily: APPLE_FONT_STACK.display,
    fontSize: 15,
    fontWeight: '900',
    color: PLAYER_DARK.text,
  },
  metricLbl: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 8,
    fontWeight: '700',
    color: PLAYER_DARK.textDim,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 22,
    backgroundColor: PLAYER_DARK.border,
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  qrContainer: {
    padding: 6,
    backgroundColor: PLAYER_DARK.text,
    borderRadius: 12,
    shadowColor: PLAYER_DARK.bg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  qrInstructions: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 10,
    color: PLAYER_DARK.textMuted,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 12,
    lineHeight: 14,
  },
  signatureCode: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 9,
    color: PLAYER_DARK.textDim,
    marginTop: 4,
    fontWeight: '600',
  },
  endorsementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: PLAYER_DARK.border,
    paddingTop: 10,
  },
  endorsedBy: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 10,
    color: PLAYER_DARK.textDim,
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
    fontFamily: APPLE_FONT_STACK.display,
    fontSize: 13,
    fontWeight: '800',
    color: PLAYER_DARK.bg,
  },
});
