import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Icon } from '../ui/Icon';
import { TransportBadge } from './TransportBadge';
import type { PassengerTransportSummary } from '../../models/TransportLogistics';
import { radius, spacing } from '../../theme/designTokens';

interface PassengerTransportTicketProps {
  summary: PassengerTransportSummary;
  eventTitle: string;
  eventDate: string;
  onBookBus?: () => void;
  onBookCarpool?: () => void;
  onDeclareIndependent?: () => void;
  isParentView?: boolean;
}

export const PassengerTransportTicket: React.FC<PassengerTransportTicketProps> = ({
  summary,
  eventTitle,
  eventDate,
  onBookBus,
  onBookCarpool,
  onDeclareIndependent,
  isParentView = false,
}) => {
  const callStaff = (phone?: string) => {
    if (phone) {
      void Linking.openURL(`tel:${phone}`);
    }
  };

  return (
    <View style={styles.card}>
      {/* Pass top header */}
      <View style={styles.passHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.passType}>
            {isParentView ? 'TITRE DE TRANSPORT DU JOUEUR' : 'MON PASS TRANSPORT'}
          </Text>
          <Text style={styles.eventTitle} numberOfLines={1}>
            {eventTitle}
          </Text>
          <Text style={styles.eventDate}>{eventDate}</Text>
        </View>
        <View style={styles.headerBadge}>
          {summary.type === 'bus' && <TransportBadge status={summary.bus?.outbound_status} size="sm" />}
          {summary.type === 'carpool' && <TransportBadge mode="carpool_only" size="sm" />}
          {summary.type === 'independent' && <TransportBadge mode="individual" size="sm" />}
        </View>
      </View>

      <View style={styles.perforatedLine}>
        <View style={styles.cutoutLeft} />
        <View style={styles.dashTrack} />
        <View style={styles.cutoutRight} />
      </View>

      {/* Main Pass Content */}
      <View style={styles.passBody}>
        {summary.type === 'bus' && summary.bus && (
          <View style={styles.busDetails}>
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>VÉHICULE</Text>
                <Text style={styles.fieldValue}>{summary.bus.bus_name}</Text>
              </View>
              {summary.bus.seat_number && (
                <View style={styles.colRight}>
                  <Text style={styles.fieldLabel}>SIÈGE</Text>
                  <Text style={styles.seatBadge}>N° {summary.bus.seat_number}</Text>
                </View>
              )}
            </View>

            <View style={styles.stopCard}>
              <Icon name="location" size={16} color="#38BDF8" />
              <View style={styles.stopTextGroup}>
                <Text style={styles.stopLabel}>Point de rendez-vous & départ</Text>
                <Text style={styles.stopName}>
                  {summary.bus.pickup_stop?.name || 'Départ principal club'}
                </Text>
                <Text style={styles.stopTime}>
                  Départ prévu à {summary.bus.outbound_departure_time}
                </Text>
              </View>
            </View>

            <View style={styles.staffRow}>
              <View style={styles.staffInfo}>
                <Text style={styles.staffLabel}>Responsable club à bord</Text>
                <Text style={styles.staffName}>{summary.bus.staff_in_charge.name}</Text>
              </View>
              {summary.bus.staff_in_charge.phone && (
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={() => callStaff(summary.bus?.staff_in_charge.phone)}
                >
                  <Icon name="call" size={14} color="#38BDF8" />
                  <Text style={styles.callBtnText}>Appeler</Text>
                </TouchableOpacity>
              )}
            </View>

            {summary.bus.practical_instructions && (
              <View style={styles.notesBox}>
                <Icon name="document" size={14} color="#94A3B8" />
                <Text style={styles.notesText}>{summary.bus.practical_instructions}</Text>
              </View>
            )}
          </View>
        )}

        {summary.type === 'carpool' && summary.carpool && (
          <View style={styles.carpoolDetails}>
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>CONDUCTEUR</Text>
                <Text style={styles.fieldValue}>{summary.carpool.driver_name}</Text>
              </View>
              <View style={styles.colRight}>
                <Text style={styles.fieldLabel}>STATUT</Text>
                <Text style={styles.confirmedBadge}>Confirmé</Text>
              </View>
            </View>

            {summary.carpool.meeting_place && (
              <View style={styles.stopCard}>
                <Icon name="location" size={16} color="#34D399" />
                <View style={styles.stopTextGroup}>
                  <Text style={styles.stopLabel}>Lieu de rendez-vous</Text>
                  <Text style={styles.stopName}>{summary.carpool.meeting_place}</Text>
                  {summary.carpool.meeting_time && (
                    <Text style={styles.stopTime}>Horaire : {summary.carpool.meeting_time}</Text>
                  )}
                </View>
              </View>
            )}
          </View>
        )}

        {summary.type === 'independent' && (
          <View style={styles.independentDetails}>
            <View style={styles.independentNotice}>
              <Icon name="person" size={20} color="#94A3B8" />
              <View style={styles.independentTextGroup}>
                <Text style={styles.independentTitle}>Déplacement individuel</Text>
                <Text style={styles.independentDesc}>
                  Ce joueur se rend sur place par ses propres moyens.
                </Text>
              </View>
            </View>
          </View>
        )}

        {summary.type === 'none' && (
          <View style={styles.unassignedBox}>
            <Text style={styles.unassignedTitle}>Aucun transport attribué</Text>
            <Text style={styles.unassignedText}>
              Choisissez votre mode d'acheminement pour ce déplacement.
            </Text>

            <View style={styles.actionButtonsRow}>
              {onBookBus && (
                <TouchableOpacity style={styles.actionBtnBus} onPress={onBookBus}>
                  <Icon name="bus" size={16} color="#0F172A" />
                  <Text style={styles.actionBtnBusText}>Prendre le Bus</Text>
                </TouchableOpacity>
              )}
              {onBookCarpool && (
                <TouchableOpacity style={styles.actionBtnCarpool} onPress={onBookCarpool}>
                  <Icon name="car" size={16} color="#F8FAFC" />
                  <Text style={styles.actionBtnCarpoolText}>Covoiturage</Text>
                </TouchableOpacity>
              )}
              {onDeclareIndependent && (
                <TouchableOpacity style={styles.actionBtnIndep} onPress={onDeclareIndependent}>
                  <Text style={styles.actionBtnIndepText}>Moyens propres</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
    marginVertical: spacing.sm,
  },
  passHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.md,
    backgroundColor: '#0F172A',
  },
  headerLeft: {
    flex: 1,
  },
  passType: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 1,
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: -0.3,
  },
  eventDate: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  headerBadge: {
    marginLeft: 8,
  },
  perforatedLine: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 16,
    backgroundColor: '#0F172A',
    position: 'relative',
  },
  cutoutLeft: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#0B1120',
    marginLeft: -7,
  },
  cutoutRight: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#0B1120',
    marginRight: -7,
  },
  dashTrack: {
    flex: 1,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  passBody: {
    padding: spacing.md,
  },
  busDetails: {
    gap: 12,
  },
  carpoolDetails: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  col: {
    flex: 1,
  },
  colRight: {
    alignItems: 'flex-end',
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 2,
  },
  seatBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    marginTop: 2,
  },
  confirmedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    color: '#34D399',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  stopCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: radius.md,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  stopTextGroup: {
    flex: 1,
  },
  stopLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  stopName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
    marginTop: 1,
  },
  stopTime: {
    fontSize: 12,
    color: '#38BDF8',
    marginTop: 2,
    fontWeight: '500',
  },
  staffRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  staffInfo: {
    flex: 1,
  },
  staffLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  staffName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E2E8F0',
    marginTop: 1,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  callBtnText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
  },
  notesBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 10,
    borderRadius: radius.sm,
  },
  notesText: {
    flex: 1,
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 16,
  },
  independentDetails: {
    paddingVertical: 6,
  },
  independentNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 12,
    borderRadius: radius.md,
  },
  independentTextGroup: {
    flex: 1,
  },
  independentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  independentDesc: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  unassignedBox: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  unassignedTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  unassignedText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  actionBtnBus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#38BDF8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  actionBtnBusText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 13,
  },
  actionBtnCarpool: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  actionBtnCarpoolText: {
    color: '#F8FAFC',
    fontWeight: '600',
    fontSize: 13,
  },
  actionBtnIndep: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  actionBtnIndepText: {
    color: '#94A3B8',
    fontSize: 13,
  },
});
