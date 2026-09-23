import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface FeeDebtor {
  id: string;
  playerName: string;
  parentName?: string;
  category: string; // e.g. "U15"
  phone?: string;
  email?: string;
  totalFee: number; // 220€
  amountPaid: number; // 100€
  dueDate: string;
}

interface MembershipFeeReminderModalProps {
  visible: boolean;
  onClose: () => void;
  clubName?: string;
  paymentLink?: string;
  debtors?: FeeDebtor[];
}

const DEFAULT_DEBTORS: FeeDebtor[] = [
  {
    id: 'd1',
    playerName: 'Lucas Dupont',
    parentName: 'Marc Dupont',
    category: 'U15 D1',
    phone: '0612345678',
    email: 'm.dupont@email.com',
    totalFee: 220,
    amountPaid: 100,
    dueDate: '15/10/2026',
  },
  {
    id: 'd2',
    playerName: 'Karim Benali',
    parentName: 'Amina Benali',
    category: 'U17 R1',
    phone: '0698765432',
    email: 'amina.b@email.com',
    totalFee: 250,
    amountPaid: 0,
    dueDate: '30/09/2026',
  },
  {
    id: 'd3',
    playerName: 'Thomas Martin',
    parentName: 'Sophie Martin',
    category: 'U11 Espoirs',
    phone: '0654321098',
    email: 'sophie.m@email.com',
    totalFee: 190,
    amountPaid: 90,
    dueDate: '01/10/2026',
  },
];

export const MembershipFeeReminderModal: React.FC<MembershipFeeReminderModalProps> = ({
  visible,
  onClose,
  clubName = 'PRODAY FC',
  paymentLink = 'https://proday.app/pay/club',
  debtors = DEFAULT_DEBTORS,
}) => {
  const [selectedDebtor, setSelectedDebtor] = useState<FeeDebtor | null>(null);

  const getRemainingAmount = (d: FeeDebtor) => d.totalFee - d.amountPaid;

  const generateReminderText = (d: FeeDebtor) => {
    const remaining = getRemainingAmount(d);
    return `Bonjour ${d.parentName || d.playerName},\n\nSauf erreur de notre part, le solde de la cotisation ${clubName} pour la licence de ${d.playerName} (${d.category}) présente un reste à régler de ${remaining}€ (échéance : ${d.dueDate}).\n\nVous pouvez régulariser directement par carte en ligne ici : ${paymentLink} ou au secrétariat du club.\n\nMerci pour votre réactivité sportive !\nLe secrétariat ${clubName}`;
  };

  const handleSendWhatsApp = (d: FeeDebtor) => {
    if (!d.phone) {
      Alert.alert('Numéro manquant', 'Aucun numéro de téléphone enregistré pour ce joueur.');
      return;
    }
    const cleanPhone = d.phone.replace(/[^0-9]/g, '');
    const internationalPhone = cleanPhone.startsWith('0')
      ? `33${cleanPhone.slice(1)}`
      : cleanPhone;
    const msg = encodeURIComponent(generateReminderText(d));
    const url = `https://wa.me/${internationalPhone}?text=${msg}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Erreur', 'Impossible d’ouvrir WhatsApp.');
    });
  };

  const handleSendEmail = (d: FeeDebtor) => {
    if (!d.email) {
      Alert.alert('Email manquant', 'Aucune adresse email enregistrée pour ce joueur.');
      return;
    }
    const subject = encodeURIComponent(`Cotisation club ${clubName} - ${d.playerName}`);
    const body = encodeURIComponent(generateReminderText(d));
    const url = `mailto:${d.email}?subject=${subject}&body=${body}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Erreur', 'Impossible d’ouvrir le client mail.');
    });
  };

  const totalOutstanding = debtors.reduce((sum, d) => sum + getRemainingAmount(d), 0);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Relances Cotisations Licences</Text>
              <Text style={styles.subtitle}>
                Reste total à recouvrer :{' '}
                <Text style={{ color: '#F59E0B', fontWeight: '800' }}>{totalOutstanding} €</Text>
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Fermer">
              <MaterialCommunityIcons name="close" size={24} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* List of Unpaid/Partial Members */}
          <ScrollView style={styles.list}>
            {debtors.map((debtor) => {
              const remaining = getRemainingAmount(debtor);
              const isSelected = selectedDebtor?.id === debtor.id;
              return (
                <View
                  key={debtor.id}
                  style={[styles.debtorCard, isSelected && styles.debtorCardSelected]}
                >
                  <View style={styles.debtorHeader}>
                    <View style={styles.debtorIdentity}>
                      <Text style={styles.debtorName}>{debtor.playerName}</Text>
                      <Text style={styles.debtorSub}>
                        {debtor.category} • Représentant : {debtor.parentName || 'Non renseigné'}
                      </Text>
                    </View>
                    <View style={styles.dueBadge}>
                      <Text style={styles.dueAmount}>{remaining} €</Text>
                      <Text style={styles.dueLabel}>Restant</Text>
                    </View>
                  </View>

                  <View style={styles.feeBreakdown}>
                    <Text style={styles.feeBreakdownText}>
                      Total : {debtor.totalFee}€ | Réglé : {debtor.amountPaid}€ | Date limite : {debtor.dueDate}
                    </Text>
                  </View>

                  {/* 1-Click Action Buttons */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.whatsAppBtn}
                      onPress={() => handleSendWhatsApp(debtor)}
                    >
                      <MaterialCommunityIcons name="whatsapp" size={18} color="#FFFFFF" />
                      <Text style={styles.btnText}>Relance WhatsApp</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.emailBtn}
                      onPress={() => handleSendEmail(debtor)}
                    >
                      <MaterialCommunityIcons name="email-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.btnText}>Email</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  list: {
    marginBottom: 12,
  },
  debtorCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  debtorCardSelected: {
    borderColor: '#0284C7',
  },
  debtorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  debtorIdentity: {
    flex: 1,
  },
  debtorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  debtorSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  dueBadge: {
    alignItems: 'flex-end',
  },
  dueAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#EF4444',
  },
  dueLabel: {
    fontSize: 11,
    color: '#94A3B8',
  },
  feeBreakdown: {
    backgroundColor: '#0F172A',
    padding: 8,
    borderRadius: 8,
    marginVertical: 10,
  },
  feeBreakdownText: {
    color: '#94A3B8',
    fontSize: 11,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  whatsAppBtn: {
    flex: 1,
    backgroundColor: '#25D366',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  emailBtn: {
    flex: 1,
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
});
