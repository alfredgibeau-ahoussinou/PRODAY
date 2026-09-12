/**
 * Pôle Club — Planning des Terrains, Logistique & Météo
 * Intégration arrêtés municipaux & repli automatique · Design System Apple Obsidian Glass.
 */
import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { PressableSpring } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import type { IconName } from '../../../components/ui/iconNames';
import { ProDayText } from '../../../components/ui/ProDayText';
import { useClubTheme } from '../shell/ClubThemeContext';
import { APPLE_TYPOGRAPHY } from '../../../theme/appleTypography';
import { clubRadius, clubSpace } from '../theme/clubDesignSystem';

export type PitchType = 'grass' | 'synthetic_a' | 'synthetic_b' | 'stabilized';

export type PitchSlot = {
  id: string;
  timeRange: string;
  pitchId: PitchType;
  teamName: string;
  category: string;
  coachName: string;
  changingRoom: string;
  lightsRequired: boolean;
};

export type PitchFacility = {
  id: PitchType;
  name: string;
  surface: string;
  status: 'open' | 'restricted' | 'banned';
  statusReason?: string;
  lighting: boolean;
  slots: PitchSlot[];
};

export const DEMO_PITCHES: PitchFacility[] = [
  {
    id: 'grass',
    name: 'Terrain d’Honneur',
    surface: 'Pelouse Naturelle Hybride',
    status: 'banned',
    statusReason: 'Arrêté municipal intempéries (Pluie intense)',
    lighting: true,
    slots: [
      {
        id: 's-1',
        timeRange: '19:30 - 21:00',
        pitchId: 'grass',
        teamName: 'Seniors R1',
        category: 'Seniors',
        coachName: 'Marc Lefevre',
        changingRoom: 'Vestiaire 1',
        lightsRequired: true,
      },
    ],
  },
  {
    id: 'synthetic_a',
    name: 'Synthétique A (Principal)',
    surface: 'Synthétique Dernière Génération 4G',
    status: 'open',
    lighting: true,
    slots: [
      {
        id: 's-2',
        timeRange: '17:30 - 19:00',
        pitchId: 'synthetic_a',
        teamName: 'U13 Région',
        category: 'Pré-formation',
        coachName: 'Lucas Bernard',
        changingRoom: 'Vestiaire 3',
        lightsRequired: false,
      },
      {
        id: 's-3',
        timeRange: '19:00 - 20:30',
        pitchId: 'synthetic_a',
        teamName: 'U17 R2',
        category: 'Formation',
        coachName: 'Karim Ziani',
        changingRoom: 'Vestiaire 2',
        lightsRequired: true,
      },
      {
        id: 's-4',
        timeRange: '20:30 - 22:00',
        pitchId: 'synthetic_a',
        teamName: 'Seniors B (D1)',
        category: 'Seniors',
        coachName: 'David Rossi',
        changingRoom: 'Vestiaire 4',
        lightsRequired: true,
      },
    ],
  },
  {
    id: 'synthetic_b',
    name: 'Synthétique B (Annexe)',
    surface: 'Synthétique Sablé Rénové',
    status: 'open',
    lighting: true,
    slots: [
      {
        id: 's-5',
        timeRange: '17:30 - 19:00',
        pitchId: 'synthetic_b',
        teamName: 'U15 R2',
        category: 'Formation',
        coachName: 'Alexandre Petit',
        changingRoom: 'Vestiaire 5',
        lightsRequired: false,
      },
      {
        id: 's-6',
        timeRange: '19:00 - 20:30',
        pitchId: 'synthetic_b',
        teamName: 'Féminines Seniors',
        category: 'Seniors Fém.',
        coachName: 'Sarah Khelifi',
        changingRoom: 'Vestiaire 6',
        lightsRequired: true,
      },
    ],
  },
  {
    id: 'stabilized',
    name: 'Terrain Stabilisé / Futsal',
    surface: 'Sol Souple & Synthétique Réduit',
    status: 'open',
    lighting: true,
    slots: [
      {
        id: 's-7',
        timeRange: '14:00 - 16:00',
        pitchId: 'stabilized',
        teamName: 'École de Foot U7-U9',
        category: 'Éveil',
        coachName: 'Thomas Martin',
        changingRoom: 'Vestiaire 7',
        lightsRequired: false,
      },
    ],
  },
];

type Props = {
  facilities?: PitchFacility[];
  onRelocateSession?: (slotId: string, newPitchId: PitchType) => void;
};

export function ClubPitchSchedule({
  facilities = DEMO_PITCHES,
}: Props) {
  const { tokens } = useClubTheme();
  const [selectedPitch, setSelectedPitch] = useState<PitchType>('synthetic_a');
  const [activeDate] = useState('Mercredi 16 Septembre');

  const currentFacility = useMemo(
    () => facilities.find((f) => f.id === selectedPitch) || facilities[0],
    [facilities, selectedPitch],
  );

  const bannedFacilities = useMemo(
    () => facilities.filter((f) => f.status === 'banned'),
    [facilities],
  );

  const handleApplyBannedRelocation = () => {
    Alert.alert(
      'Repli Automatique Effectué',
      'La séance des Seniors R1 a été basculée sur le Synthétique A (20:30). Les coachs concernés et les joueurs ont reçu une notification push immédiate.',
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. Alerte Arrêté Municipal si applicable */}
      {bannedFacilities.length > 0 ? (
        <View style={[styles.alertBanner, { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.35)' }]}>
          <View style={styles.alertHeader}>
            <View style={styles.alertIconBox}>
              <Icon name="warning" size={18} color="#EF4444" />
            </View>
            <View style={{ flex: 1 }}>
              <ProDayText style={[styles.alertTitle, { color: '#EF4444' }]}>
                Arrêté Municipal en Vigueur
              </ProDayText>
              <ProDayText style={[styles.alertDesc, { color: tokens.muted }]}>
                {bannedFacilities.map((b) => b.name).join(', ')} impraticable(s) jusqu'à nouvel ordre.
              </ProDayText>
            </View>
          </View>

          <PressableSpring
            onPress={handleApplyBannedRelocation}
            style={[styles.reallocateBtn, { backgroundColor: '#EF4444' }]}
            scaleTo={0.97}
          >
            <Icon name="refresh" size={14} color="#FFFFFF" />
            <ProDayText style={styles.reallocateBtnText}>
              Repli Auto sur Synthétique
            </ProDayText>
          </PressableSpring>
        </View>
      ) : null}

      {/* 2. Météo Terrain & Date */}
      <View style={[styles.weatherCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
        <View style={styles.weatherLeft}>
          <Icon name="cloud-upload" size={22} color={tokens.accent} />
          <View>
            <ProDayText style={[styles.weatherTitle, { color: tokens.foreground }]}>
              {activeDate} · Prévisions 18:00
            </ProDayText>
            <ProDayText style={[styles.weatherSub, { color: tokens.muted }]}>
              14°C · Pluie modérée (Vent 18 km/h) · Praticabilité réduite
            </ProDayText>
          </View>
        </View>

        <View style={[styles.statusPill, { backgroundColor: tokens.accentSoft }]}>
          <ProDayText style={[styles.statusPillText, { color: tokens.accent }]}>
            Synthétiques OK
          </ProDayText>
        </View>
      </View>

      {/* 3. Sélecteur de Terrains */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pitchesRow}
      >
        {facilities.map((pitch) => {
          const isSelected = selectedPitch === pitch.id;
          const isBanned = pitch.status === 'banned';

          return (
            <PressableSpring
              key={pitch.id}
              onPress={() => setSelectedPitch(pitch.id)}
              style={[
                styles.pitchSelectorCard,
                {
                  backgroundColor: isSelected ? tokens.surface : tokens.bg,
                  borderColor: isSelected
                    ? tokens.accent
                    : isBanned
                    ? 'rgba(239, 68, 68, 0.4)'
                    : tokens.border,
                },
              ]}
              scaleTo={0.96}
            >
              <View style={styles.pitchSelectorTop}>
                <Icon
                  name={isBanned ? 'warning' : 'football'}
                  size={16}
                  color={isBanned ? '#EF4444' : isSelected ? tokens.accent : tokens.muted}
                />
                <View
                  style={[
                    styles.statusMiniDot,
                    { backgroundColor: isBanned ? '#EF4444' : '#10B981' },
                  ]}
                />
              </View>

              <ProDayText style={[styles.pitchSelectorName, { color: tokens.foreground }]}>
                {pitch.name}
              </ProDayText>

              <ProDayText style={[styles.pitchSelectorSurface, { color: tokens.muted }]}>
                {pitch.surface}
              </ProDayText>

              <View style={styles.pitchSlotCount}>
                <ProDayText style={[styles.pitchSlotCountText, { color: tokens.muted }]}>
                  {pitch.slots.length} créneau(x)
                </ProDayText>
              </View>
            </PressableSpring>
          );
        })}
      </ScrollView>

      {/* 4. Détail du Terrain Sélectionné & Créneaux */}
      <View style={[styles.facilityDetailCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
        <View style={styles.facilityHeader}>
          <View>
            <ProDayText style={[styles.facilityName, { color: tokens.foreground }]}>
              {currentFacility.name}
            </ProDayText>
            <ProDayText style={[styles.facilitySurface, { color: tokens.muted }]}>
              {currentFacility.surface} · {currentFacility.lighting ? 'Éclairage homologué FFF' : 'Sans éclairage'}
            </ProDayText>
          </View>

          {currentFacility.status === 'banned' ? (
            <View style={styles.bannedTag}>
              <ProDayText style={styles.bannedTagText}>ARRÊTÉ</ProDayText>
            </View>
          ) : (
            <View style={styles.openTag}>
              <ProDayText style={styles.openTagText}>DISPONIBLE</ProDayText>
            </View>
          )}
        </View>

        {/* Grille Horaires */}
        <View style={styles.slotsList}>
          {currentFacility.slots.length === 0 ? (
            <View style={styles.emptySlots}>
              <ProDayText style={[styles.emptySlotsText, { color: tokens.muted }]}>
                Aucun entraînement programmé sur ce terrain aujourd'hui.
              </ProDayText>
            </View>
          ) : (
            currentFacility.slots.map((slot) => (
              <View
                key={slot.id}
                style={[styles.slotRow, { borderTopColor: tokens.border }]}
              >
                <View style={styles.slotTimeBox}>
                  <ProDayText style={[styles.slotTime, { color: tokens.accent }]}>
                    {slot.timeRange}
                  </ProDayText>
                  <ProDayText style={[styles.slotCat, { color: tokens.muted }]}>
                    {slot.category}
                  </ProDayText>
                </View>

                <View style={styles.slotInfo}>
                  <ProDayText style={[styles.slotTeam, { color: tokens.foreground }]}>
                    {slot.teamName}
                  </ProDayText>
                  <ProDayText style={[styles.slotCoach, { color: tokens.muted }]}>
                    Coach : {slot.coachName} · {slot.changingRoom}
                  </ProDayText>
                </View>

                <View style={styles.slotIcons}>
                  {slot.lightsRequired ? (
                    <View style={styles.lightBadge}>
                      <Icon name="flash" size={13} color="#F59E0B" />
                    </View>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: clubSpace.lg,
    paddingTop: 8,
    gap: 14,
  },
  alertBanner: {
    padding: 14,
    borderRadius: clubRadius.lg,
    borderWidth: 1,
    gap: 12,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  alertIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: {
    ...APPLE_TYPOGRAPHY.subheadline,
    fontWeight: '700',
  },
  alertDesc: {
    ...APPLE_TYPOGRAPHY.caption1,
    marginTop: 2,
  },
  reallocateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
  },
  reallocateBtnText: {
    ...APPLE_TYPOGRAPHY.caption1,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  weatherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: clubRadius.lg,
    borderWidth: 1,
  },
  weatherLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  weatherTitle: {
    ...APPLE_TYPOGRAPHY.subheadline,
    fontWeight: '700',
  },
  weatherSub: {
    ...APPLE_TYPOGRAPHY.caption1,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusPillText: {
    ...APPLE_TYPOGRAPHY.caption1,
    fontWeight: '700',
  },
  pitchesRow: {
    gap: 10,
    paddingBottom: 4,
  },
  pitchSelectorCard: {
    width: 160,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  pitchSelectorTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusMiniDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pitchSelectorName: {
    ...APPLE_TYPOGRAPHY.headline,
    fontSize: 14,
  },
  pitchSelectorSurface: {
    ...APPLE_TYPOGRAPHY.caption1,
    fontSize: 10,
  },
  pitchSlotCount: {
    marginTop: 4,
  },
  pitchSlotCountText: {
    ...APPLE_TYPOGRAPHY.caption1,
    fontWeight: '600',
  },
  facilityDetailCard: {
    borderRadius: clubRadius.lg,
    borderWidth: 1,
    padding: 16,
    gap: 14,
    marginBottom: 40,
  },
  facilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  facilityName: {
    ...APPLE_TYPOGRAPHY.headline,
  },
  facilitySurface: {
    ...APPLE_TYPOGRAPHY.caption1,
    marginTop: 2,
  },
  bannedTag: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bannedTagText: {
    ...APPLE_TYPOGRAPHY.caption1,
    fontWeight: '700',
    color: '#EF4444',
  },
  openTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  openTagText: {
    ...APPLE_TYPOGRAPHY.caption1,
    fontWeight: '700',
    color: '#10B981',
  },
  slotsList: {
    gap: 2,
  },
  emptySlots: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptySlotsText: {
    ...APPLE_TYPOGRAPHY.caption1,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  slotTimeBox: {
    width: 95,
  },
  slotTime: {
    ...APPLE_TYPOGRAPHY.subheadline,
    fontWeight: '700',
  },
  slotCat: {
    ...APPLE_TYPOGRAPHY.caption1,
    marginTop: 2,
  },
  slotInfo: {
    flex: 1,
  },
  slotTeam: {
    ...APPLE_TYPOGRAPHY.headline,
  },
  slotCoach: {
    ...APPLE_TYPOGRAPHY.caption1,
    marginTop: 2,
  },
  slotIcons: {
    alignItems: 'center',
  },
  lightBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    padding: 6,
    borderRadius: 8,
  },
});
