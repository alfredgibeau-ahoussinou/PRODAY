import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { FITNESS_PARK, FITNESS_PARK_RADIUS } from '../../theme/fitnessParkTheme';
import { prodayHaptics } from '../../utils/prodayHaptics';

interface PlayerQrPassModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PlayerQrPassModal: React.FC<PlayerQrPassModalProps> = ({
  visible,
  onClose,
}) => {
  const profile = useSessionProfile();
  const playerName = profile?.display_name || 'Kylian Perez';
  const clubName = profile?.profile?.club_id ? 'FC ProDay' : 'FC ProDay Melun';
  const category = profile?.profile?.category || 'Seniors R2';
  const licenceNo = 'FFF-2026-9482104';

  const handleClose = () => {
    prodayHaptics.selection();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeWrap}>
          {/* Header avec Fermeture */}
          <View style={styles.topBar}>
            <View style={{ width: 40 }} />
            <Text style={styles.topBarTitle}>MON PASS PRODAY</Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={24} color={FITNESS_PARK.textWhite} />
            </TouchableOpacity>
          </View>

          {/* Badge Pass Central Inspiré Fitness Park */}
          <View style={styles.cardContainer}>
            <View style={styles.passCard}>
              {/* En-tête Badge */}
              <View style={styles.passHeader}>
                <View style={styles.avatarWrap}>
                  <MaterialCommunityIcons name="soccer" size={28} color={FITNESS_PARK.accentYellow} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.passClubName}>{clubName}</Text>
                  <Text style={styles.passPlayerName}>{playerName}</Text>
                  <Text style={styles.passCategory}>{category} • N° {licenceNo}</Text>
                </View>
                <View style={styles.activeTag}>
                  <Text style={styles.activeTagText}>ACTIF</Text>
                </View>
              </View>

              {/* QR Code Visuel */}
              <View style={styles.qrBox}>
                <View style={styles.qrInner}>
                  <MaterialCommunityIcons
                    name="qrcode-scan"
                    size={160}
                    color={FITNESS_PARK.textDark}
                  />
                </View>
                <Text style={styles.qrInstruction}>
                  Présentez ce QR code à la borne d'accès du stade ou du club-house
                </Text>
              </View>

              {/* Informations du Pass */}
              <View style={styles.passFooter}>
                <View style={styles.infoRow}>
                  <Ionicons name="shield-checkmark" size={18} color={FITNESS_PARK.accentYellow} />
                  <Text style={styles.infoText}>Licence FFF validée • Saison 2026/2027</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="location" size={18} color={FITNESS_PARK.accentYellow} />
                  <Text style={styles.infoText}>Accès vestiaires, terrains et séances</Text>
                </View>
              </View>
            </View>

            {/* Bouton Fermer */}
            <TouchableOpacity
              style={styles.bottomCloseBtn}
              activeOpacity={0.85}
              onPress={handleClose}
            >
              <Text style={styles.bottomCloseBtnText}>Fermer le pass</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 15, 20, 0.95)',
    justifyContent: 'center',
  },
  safeWrap: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  topBarTitle: {
    color: FITNESS_PARK.textWhite,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: FITNESS_PARK.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainer: {
    alignItems: 'center',
    gap: 20,
    width: '100%',
  },
  passCard: {
    width: '100%',
    backgroundColor: FITNESS_PARK.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: FITNESS_PARK.border,
    padding: 20,
    gap: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  passHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: FITNESS_PARK.divider,
    paddingBottom: 16,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: FITNESS_PARK.surfaceRaised,
    borderWidth: 2,
    borderColor: FITNESS_PARK.accentYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passClubName: {
    color: FITNESS_PARK.accentYellow,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  passPlayerName: {
    color: FITNESS_PARK.textWhite,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  passCategory: {
    color: FITNESS_PARK.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  activeTag: {
    backgroundColor: 'rgba(255, 210, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: FITNESS_PARK.accentYellow,
  },
  activeTagText: {
    color: FITNESS_PARK.accentYellow,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  qrBox: {
    alignItems: 'center',
    gap: 14,
  },
  qrInner: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrInstruction: {
    color: FITNESS_PARK.textMuted,
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  passFooter: {
    borderTopWidth: 1,
    borderTopColor: FITNESS_PARK.divider,
    paddingTop: 16,
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    color: FITNESS_PARK.textWhite,
    fontSize: 13,
    fontWeight: '500',
  },
  bottomCloseBtn: {
    width: '100%',
    backgroundColor: FITNESS_PARK.surfaceRaised,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: FITNESS_PARK.border,
  },
  bottomCloseBtnText: {
    color: FITNESS_PARK.textWhite,
    fontSize: 15,
    fontWeight: '700',
  },
});
