/**
 * Pôle Club — Logistique & Covoiturage Intégré
 * Déplacements matchs extérieurs, véhicules, places & itinéraire GPS stade.
 */
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { PressableSpring } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import type { IconName } from '../../../components/ui/iconNames';
import { ProDayText } from '../../../components/ui/ProDayText';
import { useClubTheme } from '../shell/ClubThemeContext';
import { APPLE_TYPOGRAPHY } from '../../../theme/appleTypography';
import { clubRadius, clubSpace } from '../theme/clubDesignSystem';

export type CarpoolVehicle = {
  id: string;
  driverName: string;
  driverRole: string;
  vehicleModel: string;
  totalSeats: number;
  availableSeats: number;
  meetupPoint: string;
  departureTime: string;
  destinationStadium: string;
  passengers: string[];
  contactPhone: string;
};

export const DEMO_VEHICLES: CarpoolVehicle[] = [
  {
    id: 'car-1',
    driverName: 'Minibus Club #1 (Coach Karim)',
    driverRole: 'Véhicule Officiel Club',
    vehicleModel: 'Renault Master 9 places',
    totalSeats: 9,
    availableSeats: 2,
    meetupPoint: 'Stade Municipal (Devant la grille principale)',
    departureTime: '11:45',
    destinationStadium: 'Stade Montbauron · Allée des Marronniers, Versailles',
    passengers: ['Karim Ziani (Staff)', 'Lucas M.', 'Yanis B.', 'Sofiane R.', 'Enzo G.', 'Adam T.', 'Ilan K.'],
    contactPhone: '06 11 22 33 44',
  },
  {
    id: 'car-2',
    driverName: 'Stéphane Moreau (Parent)',
    driverRole: 'Parent Bénévole',
    vehicleModel: 'Peugeot 5008 (7 places)',
    totalSeats: 6,
    availableSeats: 3,
    meetupPoint: 'Parking de la Gare SNCF',
    departureTime: '12:00',
    destinationStadium: 'Stade Montbauron, Versailles',
    passengers: ['Stéphane M.', 'Matéo D.', 'Hugo P.'],
    contactPhone: '06 22 33 44 55',
  },
  {
    id: 'car-3',
    driverName: 'Nadia Benali (Parent)',
    driverRole: 'Parent Bénévole',
    vehicleModel: 'Volkswagen Tiguan',
    totalSeats: 4,
    availableSeats: 1,
    meetupPoint: 'Stade Municipal',
    departureTime: '12:00',
    destinationStadium: 'Stade Montbauron, Versailles',
    passengers: ['Nadia B.', 'Axel L.', 'Noah V.'],
    contactPhone: '06 33 44 55 66',
  },
];

type Props = {
  vehicles?: CarpoolVehicle[];
  onBookSeat?: (vehicleId: string) => void;
};

export function ClubCarpoolBoard({
  vehicles = DEMO_VEHICLES,
}: Props) {
  const { tokens } = useClubTheme();
  const [carList, setCarList] = useState<CarpoolVehicle[]>(vehicles);
  const [proposeOpen, setProposeOpen] = useState(false);

  // New vehicle form
  const [driverName, setDriverName] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [totalSeats, setTotalSeats] = useState('4');
  const [meetupPoint, setMeetupPoint] = useState('Stade Municipal');
  const [departureTime, setDepartureTime] = useState('12:00');

  const totalSeatsAvail = useMemo(
    () => carList.reduce((sum, c) => sum + c.availableSeats, 0),
    [carList],
  );
  const totalPassengers = useMemo(
    () => carList.reduce((sum, c) => sum + c.passengers.length, 0),
    [carList],
  );

  const openGps = (address: string) => {
    const url = `https://maps.apple.com/?q=${encodeURIComponent(address)}`;
    void Linking.openURL(url);
  };

  const handleBook = (vehicle: CarpoolVehicle) => {
    if (vehicle.availableSeats <= 0) {
      Alert.alert('Complet', 'Ce véhicule n’a plus de place disponible.');
      return;
    }
    Alert.alert(
      'Place réservée',
      `Votre place dans le véhicule de ${vehicle.driverName} est confirmée. Rendez-vous à ${vehicle.departureTime} au ${vehicle.meetupPoint}.`,
    );
  };

  const handleCreateVehicle = () => {
    if (!driverName.trim() || !vehicleModel.trim()) {
      Alert.alert('Champs requis', 'Veuillez renseigner le nom du conducteur et le véhicule.');
      return;
    }
    const newCar: CarpoolVehicle = {
      id: `car-${Date.now()}`,
      driverName,
      driverRole: 'Parent Bénévole',
      vehicleModel,
      totalSeats: parseInt(totalSeats, 10) || 4,
      availableSeats: parseInt(totalSeats, 10) || 4,
      meetupPoint,
      departureTime,
      destinationStadium: 'Stade Montbauron, Versailles',
      passengers: [driverName],
      contactPhone: '06 00 00 00 00',
    };
    setCarList((prev) => [newCar, ...prev]);
    setProposeOpen(false);
    Alert.alert('Véhicule enregistré', 'Votre véhicule est maintenant visible pour le covoiturage du match.');
  };

  return (
    <View style={styles.container}>
      {/* 1. Prochain Déplacement Officiel */}
      <View style={[styles.matchCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
        <View style={styles.matchCardTop}>
          <View style={[styles.awayBadge, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
            <Icon name="car" size={13} color="#3B82F6" />
            <ProDayText style={[styles.awayBadgeText, { color: '#3B82F6' }]}>
              DÉPLACEMENT OFFICIEL
            </ProDayText>
          </View>
          <ProDayText style={[styles.kickoffText, { color: tokens.muted }]}>
            Dimanche 13 Sept. à 13:30
          </ProDayText>
        </View>

        <ProDayText style={[styles.matchTitle, { color: tokens.foreground }]}>
          FC Versailles 78 vs ProDay FC (U17 R2)
        </ProDayText>

        <View style={styles.venueRow}>
          <Icon name="location" size={14} color={tokens.muted} />
          <ProDayText style={[styles.venueText, { color: tokens.muted }]}>
            Stade Montbauron · Allée des Marronniers, 78000 Versailles (28 km)
          </ProDayText>
        </View>

        <View style={[styles.matchFooter, { borderTopColor: tokens.border }]}>
          <View style={styles.seatsSummary}>
            <ProDayText style={[styles.seatsNum, { color: tokens.accent }]}>
              {totalSeatsAvail} places
            </ProDayText>
            <ProDayText style={[styles.seatsLabel, { color: tokens.muted }]}>
              disponibles ({totalPassengers} inscrits)
            </ProDayText>
          </View>

          <PressableSpring
            onPress={() => openGps('Stade Montbauron Versailles')}
            style={[styles.gpsBtn, { backgroundColor: tokens.accentSoft }]}
            scaleTo={0.96}
          >
            <Icon name="location" size={14} color={tokens.accent} />
            <ProDayText style={[styles.gpsBtnText, { color: tokens.accent }]}>
              Itinéraire GPS
            </ProDayText>
          </PressableSpring>
        </View>
      </View>

      {/* 2. Bouton d'Action : Proposer son véhicule */}
      <PressableSpring
        onPress={() => setProposeOpen(true)}
        style={[styles.proposeBtn, { backgroundColor: tokens.accent }]}
        scaleTo={0.98}
      >
        <Icon name="add" size={18} color="#000000" />
        <ProDayText style={styles.proposeBtnText}>
          Proposer mon véhicule pour le trajet
        </ProDayText>
      </PressableSpring>

      {/* 3. Liste des Véhicules & Places */}
      <View style={styles.vehiclesList}>
        {carList.map((car) => (
          <View
            key={car.id}
            style={[styles.vehicleCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
          >
            <View style={styles.vehicleHeader}>
              <View style={styles.driverInfo}>
                <View style={[styles.carIconBox, { backgroundColor: tokens.accentSoft }]}>
                  <Icon name="car" size={18} color={tokens.accent} />
                </View>
                <View>
                  <ProDayText style={[styles.driverName, { color: tokens.foreground }]}>
                    {car.driverName}
                  </ProDayText>
                  <ProDayText style={[styles.driverRole, { color: tokens.muted }]}>
                    {car.vehicleModel} · {car.driverRole}
                  </ProDayText>
                </View>
              </View>

              <View
                style={[
                  styles.availBadge,
                  {
                    backgroundColor:
                      car.availableSeats > 0
                        ? 'rgba(16, 185, 129, 0.15)'
                        : 'rgba(239, 68, 68, 0.15)',
                  },
                ]}
              >
                <ProDayText
                  style={[
                    styles.availBadgeText,
                    { color: car.availableSeats > 0 ? '#10B981' : '#EF4444' },
                  ]}
                >
                  {car.availableSeats > 0
                    ? `${car.availableSeats} place${car.availableSeats > 1 ? 's' : ''} libre${car.availableSeats > 1 ? 's' : ''}`
                    : 'Complet'}
                </ProDayText>
              </View>
            </View>

            <View style={[styles.routeBox, { backgroundColor: tokens.bg, borderColor: tokens.border }]}>
              <View style={styles.routeItem}>
                <Icon name="flag" size={13} color={tokens.accent} />
                <ProDayText style={[styles.routeText, { color: tokens.foreground }]}>
                  Départ {car.departureTime} : {car.meetupPoint}
                </ProDayText>
              </View>
            </View>

            <View style={styles.passengersSection}>
              <ProDayText style={[styles.passengersLabel, { color: tokens.muted }]}>
                Passagers confirmés ({car.passengers.length}) :
              </ProDayText>
              <View style={styles.passengersWrap}>
                {car.passengers.map((p, idx) => (
                  <View key={idx} style={[styles.passengerPill, { backgroundColor: tokens.accentSoft }]}>
                    <ProDayText style={[styles.passengerPillText, { color: tokens.foreground }]}>
                      {p}
                    </ProDayText>
                  </View>
                ))}
              </View>
            </View>

            <View style={[styles.vehicleFooter, { borderTopColor: tokens.border }]}>
              <PressableSpring
                onPress={() => Alert.alert('Appel conducteur', `Composer le ${car.contactPhone} ?`)}
                style={styles.callDriverBtn}
                scaleTo={0.96}
              >
                <Icon name="call" size={14} color={tokens.muted} />
                <ProDayText style={[styles.callDriverText, { color: tokens.muted }]}>
                  Contacter
                </ProDayText>
              </PressableSpring>

              {car.availableSeats > 0 ? (
                <PressableSpring
                  onPress={() => handleBook(car)}
                  style={[styles.bookBtn, { backgroundColor: tokens.accent }]}
                  scaleTo={0.96}
                >
                  <ProDayText style={styles.bookBtnText}>
                    Réserver 1 place
                  </ProDayText>
                </PressableSpring>
              ) : null}
            </View>
          </View>
        ))}
      </View>

      {/* Modal Proposer Véhicule */}
      <Modal
        visible={proposeOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setProposeOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[styles.modalBox, { backgroundColor: '#12151C', borderColor: tokens.border }]}>
            <View style={styles.modalHeader}>
              <ProDayText style={[styles.modalTitle, { color: tokens.foreground }]}>
                Proposer un Trajet
              </ProDayText>
              <TouchableOpacity onPress={() => setProposeOpen(false)}>
                <Icon name="close" size={24} color={tokens.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <ProDayText style={[styles.formLabel, { color: tokens.muted }]}>
                  Nom & Prénom du conducteur
                </ProDayText>
                <TextInput
                  value={driverName}
                  onChangeText={setDriverName}
                  placeholder="Ex: Stéphane Moreau"
                  placeholderTextColor={tokens.muted}
                  style={[styles.formInput, { backgroundColor: '#181C26', borderColor: tokens.border, color: tokens.foreground }]}
                />
              </View>

              <View style={styles.formGroup}>
                <ProDayText style={[styles.formLabel, { color: tokens.muted }]}>
                  Modèle de véhicule
                </ProDayText>
                <TextInput
                  value={vehicleModel}
                  onChangeText={setVehicleModel}
                  placeholder="Ex: Renault Scenic (5 places)"
                  placeholderTextColor={tokens.muted}
                  style={[styles.formInput, { backgroundColor: '#181C26', borderColor: tokens.border, color: tokens.foreground }]}
                />
              </View>

              <View style={styles.formGroup}>
                <ProDayText style={[styles.formLabel, { color: tokens.muted }]}>
                  Nombre de places disponibles pour les joueurs
                </ProDayText>
                <TextInput
                  value={totalSeats}
                  onChangeText={setTotalSeats}
                  keyboardType="number-pad"
                  style={[styles.formInput, { backgroundColor: '#181C26', borderColor: tokens.border, color: tokens.foreground }]}
                />
              </View>

              <View style={styles.formGroup}>
                <ProDayText style={[styles.formLabel, { color: tokens.muted }]}>
                  Lieu de rendez-vous
                </ProDayText>
                <TextInput
                  value={meetupPoint}
                  onChangeText={setMeetupPoint}
                  style={[styles.formInput, { backgroundColor: '#181C26', borderColor: tokens.border, color: tokens.foreground }]}
                />
              </View>

              <View style={styles.formGroup}>
                <ProDayText style={[styles.formLabel, { color: tokens.muted }]}>
                  Heure de départ
                </ProDayText>
                <TextInput
                  value={departureTime}
                  onChangeText={setDepartureTime}
                  style={[styles.formInput, { backgroundColor: '#181C26', borderColor: tokens.border, color: tokens.foreground }]}
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <PressableSpring
                onPress={handleCreateVehicle}
                style={[styles.publishVehicleBtn, { backgroundColor: tokens.accent }]}
                scaleTo={0.97}
              >
                <ProDayText style={styles.publishVehicleBtnText}>
                  Enregistrer le véhicule
                </ProDayText>
              </PressableSpring>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: clubSpace.lg,
    paddingTop: 8,
    gap: 14,
  },
  matchCard: {
    borderRadius: clubRadius.lg,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  matchCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  awayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  awayBadgeText: {
    ...APPLE_TYPOGRAPHY.caption1,
    fontWeight: '700',
  },
  kickoffText: {
    ...APPLE_TYPOGRAPHY.caption1,
  },
  matchTitle: {
    ...APPLE_TYPOGRAPHY.title3,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  venueText: {
    ...APPLE_TYPOGRAPHY.caption1,
  },
  matchFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  seatsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  seatsNum: {
    ...APPLE_TYPOGRAPHY.subheadline,
    fontWeight: '700',
  },
  seatsLabel: {
    ...APPLE_TYPOGRAPHY.caption1,
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  gpsBtnText: {
    ...APPLE_TYPOGRAPHY.caption1,
    fontWeight: '700',
  },
  proposeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
  },
  proposeBtnText: {
    ...APPLE_TYPOGRAPHY.subheadline,
    fontWeight: '700',
    color: '#000000',
  },
  vehiclesList: {
    gap: 12,
    paddingBottom: 40,
  },
  vehicleCard: {
    borderRadius: clubRadius.lg,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  carIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverName: {
    ...APPLE_TYPOGRAPHY.headline,
  },
  driverRole: {
    ...APPLE_TYPOGRAPHY.caption1,
    marginTop: 2,
  },
  availBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  availBadgeText: {
    ...APPLE_TYPOGRAPHY.caption1,
    fontWeight: '700',
  },
  routeBox: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeText: {
    ...APPLE_TYPOGRAPHY.caption1,
  },
  passengersSection: {
    gap: 6,
  },
  passengersLabel: {
    ...APPLE_TYPOGRAPHY.caption1,
  },
  passengersWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  passengerPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  passengerPillText: {
    ...APPLE_TYPOGRAPHY.caption1,
    fontWeight: '600',
  },
  vehicleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  callDriverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
  },
  callDriverText: {
    ...APPLE_TYPOGRAPHY.caption1,
  },
  bookBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  bookBtnText: {
    ...APPLE_TYPOGRAPHY.caption1,
    fontWeight: '700',
    color: '#000000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: { ...APPLE_TYPOGRAPHY.title2 },
  modalBody: { gap: 10 },
  formGroup: { gap: 4 },
  formLabel: { ...APPLE_TYPOGRAPHY.caption1 },
  formInput: {
    height: 42,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    ...APPLE_TYPOGRAPHY.body,
  },
  modalFooter: { marginTop: 6 },
  publishVehicleBtn: {
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  publishVehicleBtnText: {
    ...APPLE_TYPOGRAPHY.subheadline,
    fontWeight: '700',
    color: '#000000',
  },
});
