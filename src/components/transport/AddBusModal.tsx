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
  Switch,
} from 'react-native';
import { Icon } from '../ui/Icon';
import type { BusVehicleType, ClubBusPlan } from '../../models/TransportLogistics';
import { transportLogisticsService } from '../../services/transportLogistics.service';
import { radius, spacing } from '../../theme/designTokens';

interface AddBusModalProps {
  visible: boolean;
  eventId: string;
  defaultDeparturePlace: string;
  defaultArrivalPlace: string;
  editorUid: string;
  editorName: string;
  onClose: () => void;
  onAdded: () => void;
}

export const AddBusModal: React.FC<AddBusModalProps> = ({
  visible,
  eventId,
  defaultDeparturePlace,
  defaultArrivalPlace,
  editorUid,
  editorName,
  onClose,
  onAdded,
}) => {
  const [name, setName] = useState('Bus Officiel');
  const [vehicleType, setVehicleType] = useState<BusVehicleType>('bus');
  const [capacity, setCapacity] = useState('50');
  const [plate, setPlate] = useState('');
  const [staffName, setStaffName] = useState(editorName);
  const [staffPhone, setStaffPhone] = useState('');
  const [departurePlace, setDeparturePlace] = useState(defaultDeparturePlace || 'Stade du Club');
  const [departureTime, setDepartureTime] = useState('08:30');
  const [arrivalPlace, setArrivalPlace] = useState(defaultArrivalPlace || 'Stade adverse');
  const [arrivalTime, setArrivalTime] = useState('10:00');
  const [returnDepartureTime, setReturnDepartureTime] = useState('18:00');
  const [allowsParents, setAllowsParents] = useState(false);
  const [allowsSupporters, setAllowsSupporters] = useState(false);
  const [instructions, setInstructions] = useState("Tenue de club exigée, pièce d'identité obligatoire, prévoir collation.");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const capNum = parseInt(capacity, 10);
    if (isNaN(capNum) || capNum <= 0) {
      setError('Veuillez entrer une capacité valide (nombre de places).');
      return;
    }
    if (!name.trim()) {
      setError('Veuillez donner un nom au bus / véhicule.');
      return;
    }

    setLoading(true);
    setError(null);

    const busPlan: ClubBusPlan = {
      id: `bus_${Date.now()}`,
      name: name.trim(),
      vehicle_type: vehicleType,
      capacity: capNum,
      license_plate: plate.trim() || undefined,
      staff_in_charge_uid: editorUid,
      staff_in_charge_name: staffName.trim() || editorName,
      staff_in_charge_phone: staffPhone.trim() || undefined,
      allows_parents: allowsParents,
      allows_supporters: allowsSupporters,
      practical_instructions: instructions.trim() || undefined,
      outbound: {
        departure_place: departurePlace.trim(),
        departure_time: departureTime.trim(),
        arrival_place: arrivalPlace.trim(),
        arrival_time_scheduled: arrivalTime.trim(),
        stops: [],
        status: 'scheduled',
      },
      return_journey: returnDepartureTime
        ? {
            departure_place: arrivalPlace.trim(),
            departure_time: returnDepartureTime.trim(),
            arrival_place: departurePlace.trim(),
            arrival_time_scheduled: '',
            stops: [],
            status: 'scheduled',
          }
        : undefined,
      passengers: [],
      waiting_list: [],
    };

    try {
      await transportLogisticsService.upsertBusPlan(eventId, busPlan, editorUid);
      onAdded();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Erreur lors de l'ajout du bus");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Ajouter un Véhicule Club</Text>
              <Text style={styles.subtitle}>Configurer un bus ou minibus collectif</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Icon name="close" size={24} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Vehicle Type Picker */}
            <Text style={styles.fieldLabel}>Type de véhicule</Text>
            <View style={styles.typeRow}>
              {(['bus', 'minibus', 'van'] as BusVehicleType[]).map((type) => {
                const isSelected = vehicleType === type;
                const defaultCap = type === 'bus' ? '50' : type === 'minibus' ? '16' : '9';
                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typeBtn, isSelected && styles.typeBtnActive]}
                    onPress={() => {
                      setVehicleType(type);
                      setCapacity(defaultCap);
                    }}
                  >
                    <Icon
                      name={type === 'bus' ? 'bus' : 'car'}
                      size={18}
                      color={isSelected ? '#38BDF8' : '#94A3B8'}
                    />
                    <Text style={[styles.typeBtnText, isSelected && styles.typeBtnTextActive]}>
                      {type === 'bus' ? 'Grand Bus' : type === 'minibus' ? 'Minibus' : 'Van'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Name & Capacity */}
            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 2 }]}>
                <Text style={styles.inputLabel}>Nom / Intitulé</Text>
                <TextInput
                  style={styles.textInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="Ex: Bus U17 R1"
                  placeholderTextColor="#64748B"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Capacité</Text>
                <TextInput
                  style={styles.textInput}
                  value={capacity}
                  onChangeText={setCapacity}
                  keyboardType="numeric"
                  placeholder="50"
                  placeholderTextColor="#64748B"
                />
              </View>
            </View>

            {/* Staff responsible */}
            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Responsable à bord</Text>
                <TextInput
                  style={styles.textInput}
                  value={staffName}
                  onChangeText={setStaffName}
                  placeholder="Nom du coach / dirigeant"
                  placeholderTextColor="#64748B"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Téléphone de contact</Text>
                <TextInput
                  style={styles.textInput}
                  value={staffPhone}
                  onChangeText={setStaffPhone}
                  placeholder="06..."
                  keyboardType="phone-pad"
                  placeholderTextColor="#64748B"
                />
              </View>
            </View>

            {/* Outbound schedule */}
            <Text style={styles.sectionDivider}>Horaires Aller</Text>
            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 2 }]}>
                <Text style={styles.inputLabel}>Lieu de départ</Text>
                <TextInput
                  style={styles.textInput}
                  value={departurePlace}
                  onChangeText={setDeparturePlace}
                  placeholder="Lieu de rendez-vous"
                  placeholderTextColor="#64748B"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Heure départ</Text>
                <TextInput
                  style={styles.textInput}
                  value={departureTime}
                  onChangeText={setDepartureTime}
                  placeholder="08:30"
                  placeholderTextColor="#64748B"
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 2 }]}>
                <Text style={styles.inputLabel}>Destination</Text>
                <TextInput
                  style={styles.textInput}
                  value={arrivalPlace}
                  onChangeText={setArrivalPlace}
                  placeholder="Stade ou gymnase"
                  placeholderTextColor="#64748B"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Heure arrivée</Text>
                <TextInput
                  style={styles.textInput}
                  value={arrivalTime}
                  onChangeText={setArrivalTime}
                  placeholder="10:00"
                  placeholderTextColor="#64748B"
                />
              </View>
            </View>

            {/* Return schedule */}
            <Text style={styles.sectionDivider}>Horaires Retour</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Heure prévue du départ retour</Text>
              <TextInput
                style={styles.textInput}
                value={returnDepartureTime}
                onChangeText={setReturnDepartureTime}
                placeholder="18:00"
                placeholderTextColor="#64748B"
              />
            </View>

            {/* Permissions */}
            <Text style={styles.sectionDivider}>Accès & Permissions</Text>
            <View style={styles.switchRow}>
              <View style={styles.switchLabelGroup}>
                <Text style={styles.switchLabel}>Autoriser les parents dans le bus</Text>
                <Text style={styles.switchDesc}>Permet aux parents d'accompagner</Text>
              </View>
              <Switch
                value={allowsParents}
                onValueChange={setAllowsParents}
                trackColor={{ false: '#334155', true: '#38BDF8' }}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchLabelGroup}>
                <Text style={styles.switchLabel}>Autoriser les supporters</Text>
                <Text style={styles.switchDesc}>Ouvre des places aux supporters</Text>
              </View>
              <Switch
                value={allowsSupporters}
                onValueChange={setAllowsSupporters}
                trackColor={{ false: '#334155', true: '#38BDF8' }}
              />
            </View>

            {/* Practical instructions */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Consignes & Bagages</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={instructions}
                onChangeText={setInstructions}
                multiline
                numberOfLines={3}
                placeholder="Ex: Tenue officielle, pièce d'identité..."
                placeholderTextColor="#64748B"
              />
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#0F172A" size="small" />
              ) : (
                <Text style={styles.saveText}>Enregistrer le bus</Text>
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
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  body: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.md,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeBtnActive: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  typeBtnText: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 13,
  },
  typeBtnTextActive: {
    color: '#38BDF8',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.sm,
  },
  inputGroup: {
    marginBottom: spacing.sm,
  },
  inputLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#1E293B',
    borderRadius: radius.md,
    padding: 10,
    color: '#F8FAFC',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  textArea: {
    minHeight: 65,
    textAlignVertical: 'top',
  },
  sectionDivider: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38BDF8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  switchLabelGroup: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  switchDesc: {
    fontSize: 12,
    color: '#64748B',
  },
  errorText: {
    color: '#F87171',
    fontSize: 13,
    marginTop: 8,
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
