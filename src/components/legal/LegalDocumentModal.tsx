import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { LegalDocumentScreen } from '../../screens/LegalDocumentScreen';
import type { LegalDocumentId } from '../../content/legalDocuments';

interface LegalDocumentModalProps {
  visible: boolean;
  documentId: LegalDocumentId | null;
  onClose: () => void;
}

/**
 * Modale plein écran permettant d'ouvrir la Politique de Confidentialité ou les CGU
 * depuis n'importe quel point d'entrée de l'application (Auth, Inscription, Réglages).
 */
export const LegalDocumentModal: React.FC<LegalDocumentModalProps> = ({
  visible,
  documentId,
  onClose,
}) => {
  if (!visible || !documentId) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <LegalDocumentScreen documentId={documentId} onBack={onClose} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
