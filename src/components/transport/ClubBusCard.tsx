import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Icon } from '../ui/Icon';
import { TransportBadge } from './TransportBadge';
import { BusBoardingModal } from './BusBoardingModal';
import { TripStatusUpdateModal } from './TripStatusUpdateModal';
import type { ClubBusPlan } from '../../models/TransportLogistics';
import { BUS_VEHICLE_LABELS } from '../../models/TransportLogistics';
import { transportLogisticsService } from '../../services/transportLogistics.service';
import { radius, spacing } from '../../theme/designTokens';

interface ClubBusCardProps {
  bus: ClubBusPlan;
  eventId: string;
  currentUid: string;
  currentUserName: string;
  isStaff: boolean;
  onUpdated: () => void;
}

export const ClubBusCard: React.FC<ClubBusCardProps> = ({
  bus,
  eventId,
  currentUid,
  currentUserName,
  isStaff,
  onUpdated,
}) => {
  const [boardingModalOpen, setBoardingModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const passengers = bus.passengers ?? [];
  const waitingList = bus.waiting_list ?? [];
  const takenSeats = passengers.length;
  const isFull = takenSeats >= bus.capacity;
  const isBooked = passengers.some((p) => p.uid === currentUid);
  const isWaitlisted = waitingList.some((w) => w.uid === currentUid);

  const fillRatio = Math.min(1, takenSeats / Math.max(1, bus.capacity));

  const handleBook = async () => {
    setActionLoading(true);
    try {
      const res = await transportLogisticsService.bookBusSeat(eventId, bus.id, {
        uid: currentUid,
        name: currentUserName,
        role: isStaff ? 'staff' : 'player',
        booked_at: new Date().toISOString(),
      });
      if (res.waitlisted) {
        Alert.alert(
          'Liste d’attente',
          'Le bus est complet. Vous êtes inscrit sur la liste d’attente prioritaire.'
        );
      } else {
        Alert.alert('Place confirmée', 'Votre place dans le bus est réservée.');
      }
      onUpdated();
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || 'Impossible de réserver');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    Alert.alert(
      'Annuler votre place',
      'Êtes-vous sûr de vouloir annuler votre réservation ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await transportLogisticsService.cancelBusSeat(eventId, bus.id, currentUid);
              onUpdated();
            } catch (err: any) {
              Alert.alert('Erreur', err?.message || 'Erreur lors de l’annulation');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
      {/* Card Header */}
      <View style={styles.header}>
        <View style={styles.titleCol}>
          <View style={styles.badgeRow}>
            <Text style={styles.vehicleTypeBadge}>{BUS_VEHICLE_LABELS[bus.vehicle_type]}</Text>
            {bus.license_plate && (
              <Text style={styles.plateBadge}>{bus.license_plate}</Text>
            )}
          </View>
          <Text style={styles.busName}>{bus.name}</Text>
        </View>
        <TransportBadge status={bus.outbound.status} size="sm" />
      </View>

      {/* Delay alert banner if delayed */}
      {bus.outbound.status === 'delayed' && (
        <View style={styles.delayBanner}>
          <Icon name="warning" size={16} color="#F87171" />
          <View style={styles.delayBannerText}>
            <Text style={styles.delayBannerTitle}>Retard signalé sur le trajet aller</Text>
            {bus.outbound.arrival_time_revised && (
              <Text style={styles.delayBannerTime}>
                Arrivée estimée : {bus.outbound.arrival_time_revised}
              </Text>
            )}
            {bus.outbound.status_note && (
              <Text style={styles.delayBannerNote}>{bus.outbound.status_note}</Text>
            )}
          </View>
        </View>
      )}

      {/* Capacity Progress Bar */}
      <View style={styles.capacitySection}>
        <View style={styles.capacityRow}>
          <Text style={styles.capacityText}>
            {takenSeats} / {bus.capacity} places occupées
          </Text>
          {waitingList.length > 0 && (
            <Text style={styles.waitingCount}>
              +{waitingList.length} en attente
            </Text>
          )}
        </View>
        <View style={styles.track}>
          <View
            style={[
              styles.trackFill,
              {
                width: `${fillRatio * 100}%`,
                backgroundColor: isFull ? '#F59E0B' : '#38BDF8',
              },
            ]}
          />
        </View>
      </View>

      {/* Outbound schedule */}
      <View style={styles.itineraryBox}>
        <View style={styles.routeHeader}>
          <Icon name="swap-horizontal" size={14} color="#94A3B8" />
          <Text style={styles.routeTitle}>Trajet Aller</Text>
        </View>
        <View style={styles.routeRow}>
          <View style={styles.stopDot} />
          <View style={styles.stopInfo}>
            <Text style={styles.stopPlace}>{bus.outbound.departure_place}</Text>
            <Text style={styles.stopHour}>{bus.outbound.departure_time}</Text>
          </View>
        </View>

        {bus.outbound.stops?.map((stop, i) => (
          <View key={stop.id || i} style={styles.subStopRow}>
            <View style={styles.subStopDot} />
            <View style={styles.stopInfo}>
              <Text style={styles.subStopName}>{stop.name}</Text>
              <Text style={styles.subStopHour}>
                {stop.estimated_time || stop.scheduled_time}
              </Text>
            </View>
          </View>
        ))}

        <View style={styles.routeRow}>
          <View style={[styles.stopDot, styles.stopDotEnd]} />
          <View style={styles.stopInfo}>
            <Text style={styles.stopPlace}>{bus.outbound.arrival_place}</Text>
            <Text style={styles.stopHour}>
              {bus.outbound.arrival_time_revised || bus.outbound.arrival_time_scheduled}
            </Text>
          </View>
        </View>
      </View>

      {/* Practical instructions / Luggage */}
      {(bus.luggage_instructions || bus.practical_instructions) && (
        <View style={styles.instructionsBox}>
          <Icon name="document" size={14} color="#64748B" />
          <Text style={styles.instructionsText}>
            {[bus.luggage_instructions, bus.practical_instructions].filter(Boolean).join(' · ')}
          </Text>
        </View>
      )}

      {/* Staff & Quick Actions */}
      <View style={styles.cardFooter}>
        <View style={styles.staffSummary}>
          <Text style={styles.staffInChargeLabel}>Responsable</Text>
          <Text style={styles.staffInChargeName}>{bus.staff_in_charge_name}</Text>
        </View>

        <View style={styles.actionButtons}>
          {isStaff ? (
            <>
              <TouchableOpacity
                style={styles.staffActionBtn}
                onPress={() => setStatusModalOpen(true)}
              >
                <Icon name="time" size={14} color="#38BDF8" />
                <Text style={styles.staffActionText}>Statut</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.staffActionBtn, styles.staffActionBtnPrimary]}
                onPress={() => setBoardingModalOpen(true)}
              >
                <Icon name="people" size={14} color="#0F172A" />
                <Text style={styles.staffActionTextPrimary}>Pointage</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {isBooked ? (
                <TouchableOpacity
                  style={styles.cancelSeatBtn}
                  onPress={handleCancel}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="#EF4444" />
                  ) : (
                    <Text style={styles.cancelSeatText}>Annuler ma place</Text>
                  )}
                </TouchableOpacity>
              ) : isWaitlisted ? (
                <TouchableOpacity
                  style={styles.waitlistedBtn}
                  onPress={handleCancel}
                  disabled={actionLoading}
                >
                  <Text style={styles.waitlistedText}>En attente (Retirer)</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.bookSeatBtn}
                  onPress={handleBook}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="#0F172A" />
                  ) : (
                    <Text style={styles.bookSeatText}>
                      {isFull ? "Rejoindre l'attente" : 'Réserver une place'}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>

      {/* Modals */}
      {boardingModalOpen && (
        <BusBoardingModal
          visible={boardingModalOpen}
          bus={bus}
          eventId={eventId}
          onClose={() => setBoardingModalOpen(false)}
          onUpdated={onUpdated}
        />
      )}

      {statusModalOpen && (
        <TripStatusUpdateModal
          visible={statusModalOpen}
          bus={bus}
          eventId={eventId}
          onClose={() => setStatusModalOpen(false)}
          onUpdated={onUpdated}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleCol: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  vehicleTypeBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
    textTransform: 'uppercase',
  },
  plateBadge: {
    fontSize: 10,
    color: '#94A3B8',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  busName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: -0.3,
  },
  delayBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: radius.md,
    padding: 10,
    gap: 8,
    marginBottom: 12,
  },
  delayBannerText: {
    flex: 1,
  },
  delayBannerTitle: {
    color: '#FCA5A5',
    fontWeight: '700',
    fontSize: 13,
  },
  delayBannerTime: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  delayBannerNote: {
    color: '#CBD5E1',
    fontSize: 12,
    marginTop: 2,
  },
  capacitySection: {
    marginBottom: 14,
  },
  capacityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  capacityText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  waitingCount: {
    fontSize: 12,
    color: '#FBBF24',
    fontWeight: '600',
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: 3,
  },
  itineraryBox: {
    backgroundColor: '#0F172A',
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 12,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  routeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 3,
  },
  subStopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 4,
    marginVertical: 2,
  },
  stopDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38BDF8',
  },
  stopDotEnd: {
    backgroundColor: '#10B981',
  },
  subStopDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#64748B',
  },
  stopInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stopPlace: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  stopHour: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38BDF8',
  },
  subStopName: {
    fontSize: 12,
    color: '#94A3B8',
  },
  subStopHour: {
    fontSize: 12,
    color: '#CBD5E1',
  },
  instructionsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 8,
    borderRadius: radius.sm,
    marginBottom: 12,
  },
  instructionsText: {
    flex: 1,
    fontSize: 11,
    color: '#94A3B8',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 12,
  },
  staffSummary: {
    flex: 1,
  },
  staffInChargeLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  staffInChargeName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  staffActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.md,
  },
  staffActionText: {
    color: '#38BDF8',
    fontWeight: '600',
    fontSize: 12,
  },
  staffActionBtnPrimary: {
    backgroundColor: '#38BDF8',
  },
  staffActionTextPrimary: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 12,
  },
  bookSeatBtn: {
    backgroundColor: '#38BDF8',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  bookSeatText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 13,
  },
  cancelSeatBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  cancelSeatText: {
    color: '#F87171',
    fontWeight: '600',
    fontSize: 13,
  },
  waitlistedBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  waitlistedText: {
    color: '#FBBF24',
    fontWeight: '600',
    fontSize: 12,
  },
});
