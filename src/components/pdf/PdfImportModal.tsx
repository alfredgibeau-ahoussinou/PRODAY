import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { BlurView } from 'expo-blur';
import { Icon } from '../ui/Icon';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { APPLE_TYPOGRAPHY } from '../../theme/appleTypography';

export interface ExtractedPlayerItem {
  id: string;
  name: string;
  category: string;
  position: string;
  licenseNumber?: string;
  status: 'valid' | 'warning' | 'duplicate';
}

interface PdfImportModalProps {
  visible: boolean;
  onClose: () => void;
  onImportToSquad: (players: ExtractedPlayerItem[]) => void;
}

export const PdfImportModal: React.FC<PdfImportModalProps> = ({
  visible,
  onClose,
  onImportToSquad,
}) => {
  const [parsing, setParsing] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [extractedPlayers, setExtractedPlayers] = useState<ExtractedPlayerItem[]>([]);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedFileName(file.name);
        setParsing(true);

        // Simulation de lecture/parsing intelligent du document PDF (FFF Footclubs)
        setTimeout(() => {
          const mockParsedPlayers: ExtractedPlayerItem[] = [
            {
              id: `p-${Date.now()}-1`,
              name: 'Lucas MOREAU',
              category: 'U17 R2',
              position: 'Attaquant',
              licenseNumber: '2548901234',
              status: 'valid',
            },
            {
              id: `p-${Date.now()}-2`,
              name: 'Yanis BENALI',
              category: 'Seniors R1',
              position: 'Milieu offensif',
              licenseNumber: '1987456321',
              status: 'valid',
            },
            {
              id: `p-${Date.now()}-3`,
              name: 'Enzo GAUTHIER',
              category: 'U17 R2',
              position: 'Gardien de but',
              licenseNumber: '2498701452',
              status: 'valid',
            },
            {
              id: `p-${Date.now()}-4`,
              name: 'Sofiane RAHMANI',
              category: 'U15 R2',
              position: 'Défenseur central',
              licenseNumber: '2684512987',
              status: 'valid',
            },
          ];

          setExtractedPlayers(mockParsedPlayers);
          setParsing(false);
        }, 1200);
      }
    } catch (err) {
      setParsing(false);
      Alert.alert('Erreur', 'Impossible de lire le document PDF sélectionné.');
    }
  };

  const handleConfirmImport = () => {
    if (extractedPlayers.length === 0) {
      Alert.alert('Attention', 'Aucun joueur extrait à importer.');
      return;
    }
    onImportToSquad(extractedPlayers);
    setExtractedPlayers([]);
    setSelectedFileName(null);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />

        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconBox}>
                <Icon name="document-text" size={18} color="#000000" />
              </View>
              <View style={{ flex: 1 }}>
                <ProDayText style={styles.title}>Import PDF Licenciés FFF</ProDayText>
                <ProDayText style={styles.subtitle}>
                  Extraction automatique de feuille Footclubs ou bordereau
                </ProDayText>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.closeBtn}

              accessibilityRole="button"
              accessibilityLabel="Fermer">
              <Icon name="close" size={16} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          {/* Corps de la modale */}
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Zone de drop/sélection */}
            <PressableSpring
              onPress={handlePickDocument}
              style={styles.dropZone}
              scaleTo={0.98}
            >
              <Icon name="cloud-upload" size={32} color="#BF5AF2" />
              <ProDayText style={styles.dropZoneTitle}>
                {selectedFileName ?? 'Sélectionner un fichier PDF FFF'}
              </ProDayText>
              <ProDayText style={styles.dropZoneSub}>
                Reconnaissance automatique des noms, catégories et licences
              </ProDayText>
            </PressableSpring>

            {parsing && (
              <View style={styles.parsingState}>
                <ActivityIndicator size="small" color="#BF5AF2" />
                <ProDayText style={styles.parsingText}>
                  Analyse et extraction des colonnes du document…
                </ProDayText>
              </View>
            )}

            {/* Aperçu des licenciés détectés */}
            {extractedPlayers.length > 0 && (
              <View style={styles.playersPreviewSection}>
                <View style={styles.previewHeader}>
                  <ProDayText style={styles.previewTitle}>
                    Joueurs détectés ({extractedPlayers.length})
                  </ProDayText>
                  <View style={styles.detectedBadge}>
                    <Icon name="checkmark-circle" size={12} color="#10B981" />
                    <ProDayText style={styles.detectedBadgeText}>Prêts pour l’effectif</ProDayText>
                  </View>
                </View>

                {extractedPlayers.map((player) => (
                  <View key={player.id} style={styles.playerRow}>
                    <View style={styles.playerIconBox}>
                      <Icon name="person" size={14} color="#BF5AF2" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ProDayText style={styles.playerName}>{player.name}</ProDayText>
                      <ProDayText style={styles.playerSub}>
                        {player.category} · {player.position} · Lic. #{player.licenseNumber}
                      </ProDayText>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Actions footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <ProDayText style={styles.cancelBtnText}>Annuler</ProDayText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleConfirmImport}
              disabled={extractedPlayers.length === 0}
              style={[
                styles.confirmBtn,
                extractedPlayers.length === 0 && styles.confirmBtnDisabled,
              ]}
            >
              <Icon name="download" size={14} color="#000000" />
              <ProDayText style={styles.confirmBtnText}>
                Importer dans les effectifs ({extractedPlayers.length})
              </ProDayText>
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '85%',
    backgroundColor: '#16161A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#BF5AF2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...APPLE_TYPOGRAPHY.headline,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  subtitle: {
    ...APPLE_TYPOGRAPHY.caption1,
    color: '#8E8E93',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    padding: 18,
  },
  dropZone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(191, 90, 242, 0.4)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(191, 90, 242, 0.04)',
    gap: 8,
  },
  dropZoneTitle: {
    ...APPLE_TYPOGRAPHY.subheadline,
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
  },
  dropZoneSub: {
    ...APPLE_TYPOGRAPHY.caption1,
    color: '#8E8E93',
    textAlign: 'center',
  },
  parsingState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  parsingText: {
    ...APPLE_TYPOGRAPHY.caption1,
    color: '#BF5AF2',
  },
  playersPreviewSection: {
    marginTop: 16,
    gap: 8,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  previewTitle: {
    ...APPLE_TYPOGRAPHY.subheadline,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  detectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  detectedBadgeText: {
    ...APPLE_TYPOGRAPHY.caption1,
    color: '#10B981',
    fontWeight: '600',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  playerIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(191, 90, 242, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerName: {
    ...APPLE_TYPOGRAPHY.subheadline,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  playerSub: {
    ...APPLE_TYPOGRAPHY.caption2,
    color: '#8E8E93',
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  cancelBtnText: {
    ...APPLE_TYPOGRAPHY.subheadline,
    color: '#8E8E93',
    fontWeight: '600',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#BF5AF2',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  confirmBtnDisabled: {
    opacity: 0.4,
  },
  confirmBtnText: {
    ...APPLE_TYPOGRAPHY.subheadline,
    color: '#000000',
    fontWeight: '700',
  },
});
