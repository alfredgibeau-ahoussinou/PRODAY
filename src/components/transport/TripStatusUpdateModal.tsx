import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Icon } from '../ui/Icon';
import type { BusTripStatus, ClubBusPlan } from '../../models/TransportLogistics';
import { BUS_TRIP_STATUS_LABELS } from '../../models/TransportLogistics';
import { transportLogisticsService } from '../../services/transportLogistics.service';
import { radius, spacing } from '../../theme/designTokens';

interface TripStatusUpdateModalProps {
  visible: boolean;
  bus: ClubBusPlan;
  eventId: string;
  onClose: () => void;
  onUpdated: () => void;
}

const STATUS_CHOICES: { status: BusTripStatus; label: string; icon: any }[] = [
  { status: 'scheduled', label: 'Prévu (horaire normal)', icon: 'time' },
  { status: 'boarding_open', label: 'Embarquement en cours', icon: 'people' },
  { status: 'departed', label: 'En route / Parti', icon: 'bus' },
  { status: 'delayed', label: 'Retard constaté', icon: 'warning' },
  { status: 'return_started', label: 'Trajet retour en cours', icon: 'swap-horizontal' },
  { status: 'arrived', label: 'Arrivé à destination', icon: 'checkmark-circle' },
];

export const TripStatusUpdateModal: React.FC<TripStatusUpdateModalProps> = ({
  visible,
  bus,
  eventId,
  onClose,
  onUpdated,
}) => {
  const [journey, setJourney] = useState<'outbound' | 'return'>('outbound');
  const targetJourney = journey === 'outbound' ? bus.outbound : bus.return_journey;

  const [status, setStatus] = useState<BusTripStatus>(targetJourney?.status ?? 'scheduled');
  const [note, setNote] = useState(targetJourney?.status_note ?? '');
  const [revisedEta, setRevisedEta] = useState(targetJourney?.arrival_time_revised ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      await transportLogisticsService.updateTripStatus(
        eventId,
        bus.id,
        journey,
        status,
        note.trim() || undefined,
        revisedEta.trim() || undefined
      );
      onUpdated();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la mise à jour du statut');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Statut du Trajet</Text>
              <Text style={styles.subtitle}>{bus.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Fermer">
              <Icon name="close" size={24} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Journey selector */}
            {bus.return_journey && (
              <View style={styles.journeySegment}>
                <TouchableOpacity
                  style={[styles.segmentBtn, journey === 'outbound' && styles.segmentBtnActive]}
                  onPress={() => {
                    setJourney('outbound');
                    setStatus(bus.outbound.status);
                    setNote(bus.outbound.status_note ?? '');
                    setRevisedEta(bus.outbound.arrival_time_revised ?? '');
                  }}
                >
                  <Text style={[styles.segmentText, journey === 'outbound' && styles.segmentTextActive]}>
                    Trajet Aller
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segmentBtn, journey === 'return' && styles.segmentBtnActive]}
                  onPress={() => {
                    setJourney('return');
                    setStatus(bus.return_journey?.status ?? 'scheduled');
                    setNote(bus.return_journey?.status_note ?? '');
                    setRevisedEta(bus.return_journey?.arrival_time_revised ?? '');
                  }}
                >
                  <Text style={[styles.segmentText, journey === 'return' && styles.segmentTextActive]}>
                    Trajet Retour
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.sectionLabel}>Étape en direct</Text>
            <View style={styles.statusGrid}>
              {STATUS_CHOICES.map((choice) => {
                const isSelected = status === choice.status;
                return (
                  <TouchableOpacity
                    key={choice.status}
                    style={[styles.statusOption, isSelected && styles.statusOptionActive]}
                    onPress={() => setStatus(choice.status)}
                  >
                    <Icon
                      name={choice.icon}
                      size={18}
                      color={isSelected ? '#38BDF8' : '#94A3B8'}
                    />
                    <Text style={[styles.statusOptionLabel, isSelected && styles.statusOptionLabelActive]}>
                      {choice.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {status === 'delayed' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nouvelle heure d'arrivée estimée (ex. 10:45)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="HH:mm"
                  placeholderTextColor="#64748B"
                  value={revisedEta}
                  onChangeText={setRevisedEta}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Précisions / Message aux familles & joueurs</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Ex: Ralentissements signalés, pause sur aire d'autoroute..."
                placeholderTextColor="#64748B"
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={3}
              />
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}
          </ScrollView>

          {/* Footer buttons */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#0F172A" size="small" />
              ) : (
                <Text style={styles.saveText}>Diffuser le statut</Text>
              )}
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
    maxHeight: '85%',
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
  body: {
    marginBottom: spacing.md,
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
    fontSize: 14,
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
    marginBottom: 8,
  },
  statusGrid: {
    gap: 8,
    marginBottom: spacing.md,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statusOptionActive: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  statusOptionLabel: {
    fontSize: 14,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  statusOptionLabelActive: {
    color: '#38BDF8',
    fontWeight: '600',
  },
  inputGroup: {
    marginTop: spacing.sm,
  },
  inputLabel: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#1E293B',
    borderRadius: radius.md,
    padding: 12,
    color: '#F8FAFC',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#F87171',
    fontSize: 13,
    marginTop: 10,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: '#1E293B',
    alignItems: 'center',
  },
  cancelText: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 15,
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: '#38BDF8',
    alignItems: 'center',
  },
  saveText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 15,
  },
});
