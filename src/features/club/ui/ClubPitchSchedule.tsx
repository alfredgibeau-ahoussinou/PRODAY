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


type Props = {
  facilities?: PitchFacility[];
  onRelocateSession?: (slotId: string, newPitchId: PitchType) => void;
};

export function ClubPitchSchedule({
  facilities = [],
}: Props) {
  const { tokens } = useClubTheme();
  const [selectedPitch, setSelectedPitch] = useState<PitchType>('synthetic_a');
  // Date réelle du jour — plus aucune date de démonstration figée.
  const activeDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

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
      'Repli non automatisé',
      'Le déplacement automatique des séances vers un autre terrain n\u2019est pas encore connecté à un service : aucune séance n\u2019a été modifiée.',
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

      {/* 2. Date réelle du planning — aucune météo inventée. */}
      <View style={[styles.weatherCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
        <View style={styles.weatherLeft}>
          <Icon name="cloud-upload" size={22} color={tokens.accent} />
          <View>
            <ProDayText style={[styles.weatherTitle, { color: tokens.foreground }]}>
              Planning des terrains · {activeDate}
            </ProDayText>
            <ProDayText style={[styles.weatherSub, { color: tokens.muted }]}>
              Créneaux réels issus des entraînements enregistrés par le club
            </ProDayText>
          </View>
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
      {currentFacility ? (
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
      ) : (
        <View style={[styles.facilityDetailCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          <ProDayText style={[styles.emptySlotsText, { color: tokens.muted }]}>
            Aucun terrain programmé : les créneaux apparaissent dès que des entraînements avec un lieu sont enregistrés — aucune donnée de démonstration n’est affichée.
          </ProDayText>
        </View>
      )}
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
