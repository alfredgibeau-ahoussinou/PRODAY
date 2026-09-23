import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Icon } from '../ui/Icon';
import type { ClubBusPlan } from '../../models/TransportLogistics';
import { transportLogisticsService } from '../../services/transportLogistics.service';
import { radius, spacing } from '../../theme/designTokens';

interface BusBoardingModalProps {
  visible: boolean;
  bus: ClubBusPlan;
  eventId: string;
  onClose: () => void;
  onUpdated: () => void;
}

export const BusBoardingModal: React.FC<BusBoardingModalProps> = ({
  visible,
  bus,
  eventId,
  onClose,
  onUpdated,
}) => {
  const [journey, setJourney] = useState<'outbound' | 'return'>('outbound');
  const [loadingUid, setLoadingUid] = useState<string | null>(null);

  const passengers = bus.passengers ?? [];
  const waitingList = bus.waiting_list ?? [];

  const checkedInCount = passengers.filter((p) =>
    journey === 'outbound' ? p.checked_in_outbound : p.checked_in_return
  ).length;

  const handleToggleCheckIn = async (uid: string, currentVal: boolean) => {
    setLoadingUid(uid);
    try {
      await transportLogisticsService.checkInPassenger(
        eventId,
        bus.id,
        uid,
        journey,
        !currentVal
      );
      onUpdated();
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || "Impossible d'enregistrer le pointage");
    } finally {
      setLoadingUid(null);
    }
  };

  const handlePromote = async (uid: string) => {
    if (passengers.length >= bus.capacity) {
      Alert.alert('Capacité atteinte', 'Le bus est déjà complet.');
      return;
    }
    setLoadingUid(uid);
    try {
      await transportLogisticsService.promoteFromWaitingList(eventId, bus.id, uid);
      onUpdated();
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || 'Erreur lors de la promotion');
    } finally {
      setLoadingUid(null);
    }
  };

  const handleRemove = async (uid: string, name: string) => {
    Alert.alert('Annuler la place', `Retirer ${name} de ce trajet ?`, [
      { text: 'Non', style: 'cancel' },
      {
        text: 'Retirer',
        style: 'destructive',
        onPress: async () => {
          setLoadingUid(uid);
          try {
            await transportLogisticsService.cancelBusSeat(eventId, bus.id, uid);
            onUpdated();
          } catch (err: any) {
            Alert.alert('Erreur', err?.message || 'Erreur lors du retrait');
          } finally {
            setLoadingUid(null);
          }
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Feuille d'Embarquement</Text>
              <Text style={styles.subtitle}>
                {bus.name} · {checkedInCount}/{passengers.length} à bord
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Icon name="close" size={24} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Outbound / Return switcher */}
          {bus.return_journey && (
            <View style={styles.journeySegment}>
              <TouchableOpacity
                style={[styles.segmentBtn, journey === 'outbound' && styles.segmentBtnActive]}
                onPress={() => setJourney('outbound')}
              >
                <Text style={[styles.segmentText, journey === 'outbound' && styles.segmentTextActive]}>
                  Aller ({passengers.filter((p) => p.checked_in_outbound).length}/{passengers.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segmentBtn, journey === 'return' && styles.segmentBtnActive]}
                onPress={() => setJourney('return')}
              >
                <Text style={[styles.segmentText, journey === 'return' && styles.segmentTextActive]}>
                  Retour ({passengers.filter((p) => p.checked_in_return).length}/{passengers.length})
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Passengers manifest */}
            <Text style={styles.sectionLabel}>
              Passagers confirmés ({passengers.length} / {bus.capacity} places)
            </Text>

            {passengers.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>Aucun passager inscrit pour le moment.</Text>
              </View>
            ) : (
              passengers.map((passenger) => {
                const isCheckedIn =
                  journey === 'outbound'
                    ? Boolean(passenger.checked_in_outbound)
                    : Boolean(passenger.checked_in_return);
                const isBusy = loadingUid === passenger.uid;
                const stop = bus.outbound.stops?.find((s) => s.id === passenger.pickup_stop_id);

                return (
                  <View key={passenger.uid} style={styles.passengerRow}>
                    <TouchableOpacity
                      style={[styles.checkBtn, isCheckedIn && styles.checkBtnActive]}
                      onPress={() => handleToggleCheckIn(passenger.uid, isCheckedIn)}
                      disabled={isBusy}
                    >
                      {isBusy ? (
                        <ActivityIndicator color={isCheckedIn ? '#FFF' : '#38BDF8'} size="small" />
                      ) : (
                        <Icon
                          name={isCheckedIn ? 'checkmark-circle' : 'person'}
                          size={18}
                          color={isCheckedIn ? '#10B981' : '#64748B'}
                        />
                      )}
                    </TouchableOpacity>

                    <View style={styles.passengerInfo}>
                      <View style={styles.nameRow}>
                        <Text style={[styles.passengerName, isCheckedIn && styles.passengerNameChecked]}>
                          {passenger.name}
                        </Text>
                        <Text style={styles.roleBadge}>{passenger.role}</Text>
                      </View>
                      <Text style={styles.passengerMeta}>
                        {stop ? `Arrêt: ${stop.name} (${stop.scheduled_time})` : 'Départ principal'}
                        {passenger.seat_number ? ` · Place n°${passenger.seat_number}` : ''}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleRemove(passenger.uid, passenger.name)}
                    >
                      <Icon name="trash" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}

            {/* Waiting List */}
            {waitingList.length > 0 && (
              <View style={styles.waitingSection}>
                <Text style={styles.sectionLabel}>
                  Liste d'attente ({waitingList.length})
                </Text>
                {waitingList.map((item) => {
                  const isBusy = loadingUid === item.uid;
                  const canPromote = passengers.length < bus.capacity;

                  return (
                    <View key={item.uid} style={styles.waitingRow}>
                      <View style={styles.waitingInfo}>
                        <Text style={styles.waitingName}>{item.name}</Text>
                        <Text style={styles.waitingMeta}>{item.role}</Text>
                      </View>
                      {canPromote && (
                        <TouchableOpacity
                          style={styles.promoteBtn}
                          onPress={() => handlePromote(item.uid)}
                          disabled={isBusy}
                        >
                          <Text style={styles.promoteBtnText}>Attribuer place</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleRemove(item.uid, item.name)}
                      >
                        <Icon name="close" size={16} color="#94A3B8" />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>Fermer</Text>
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
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 2,
  },
  journeySegment: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.md,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  segmentBtnActive: {
    backgroundColor: '#334155',
  },
  segmentText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#F8FAFC',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  body: {
    marginBottom: spacing.md,
  },
  passengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: radius.md,
    marginBottom: 8,
    gap: 12,
  },
  checkBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  passengerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  passengerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  passengerNameChecked: {
    color: '#34D399',
  },
  roleBadge: {
    fontSize: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#CBD5E1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    textTransform: 'uppercase',
  },
  passengerMeta: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  deleteBtn: {
    padding: 8,
  },
  emptyBox: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
  },
  waitingSection: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: spacing.md,
  },
  waitingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(234, 179, 8, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.2)',
    padding: 12,
    borderRadius: radius.md,
    marginBottom: 8,
    gap: 10,
  },
  waitingInfo: {
    flex: 1,
  },
  waitingName: {
    color: '#FDE047',
    fontWeight: '600',
    fontSize: 14,
  },
  waitingMeta: {
    color: '#CA8A04',
    fontSize: 12,
  },
  promoteBtn: {
    backgroundColor: '#CA8A04',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  promoteBtnText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 12,
  },
  footer: {
    paddingTop: spacing.sm,
  },
  closeBtn: {
    backgroundColor: '#334155',
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#F8FAFC',
    fontWeight: '600',
    fontSize: 15,
  },
});
