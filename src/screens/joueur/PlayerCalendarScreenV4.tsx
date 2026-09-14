import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { playerRsvpService, type PlayerRsvpStatus } from '../../services/playerRsvp.service';
import { ProDayVideoPlayer } from '../../components/video/ProDayVideoPlayer';

interface CalendarEvent {
  id: string;
  type: 'match' | 'training' | 'tournament';
  title: string;
  opponent?: string;
  dateStr: string;
  dayNumber: number;
  time: string;
  meetTime: string;
  location: string;
  address: string;
  convocationStatus?: 'starter' | 'substitute' | 'not_selected';
  score?: string;
  hasVeo?: boolean;
  streamUrl?: string;
}

const SAMPLE_EVENTS: CalendarEvent[] = [
  {
    id: 'evt-1',
    type: 'match',
    title: 'Match de Championnat R2 • J17',
    opponent: 'FC Versailles',
    dateStr: 'Dimanche 15 Mars 2026',
    dayNumber: 15,
    time: '15:00',
    meetTime: '13:45',
    location: 'Stade Municipal des Prés',
    address: '12 Avenue des Sports, 78000 Versailles',
    convocationStatus: 'starter',
    hasVeo: true,
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
  },
  {
    id: 'evt-2',
    type: 'training',
    title: 'Séance Tactique & Phases Arrêtées',
    dateStr: 'Vendredi 13 Mars 2026',
    dayNumber: 13,
    time: '19:30',
    meetTime: '19:15',
    location: 'Terrain Synthétique 1',
    address: 'Complexe Sportif ProDay, 92100 Boulogne',
  },
  {
    id: 'evt-3',
    type: 'training',
    title: 'Préparation Physique & Volume de Course',
    dateStr: 'Mercredi 11 Mars 2026',
    dayNumber: 11,
    time: '19:30',
    meetTime: '19:15',
    location: 'Piste d’athlétisme & Salle Fitness',
    address: 'Complexe Sportif ProDay, 92100 Boulogne',
  },
  {
    id: 'evt-4',
    type: 'match',
    title: 'Match de Championnat R2 • J16',
    opponent: 'AS Meudon',
    dateStr: 'Dimanche 8 Mars 2026',
    dayNumber: 8,
    time: '15:00',
    meetTime: '13:45',
    location: 'Stade Municipal ProDay',
    address: 'Complexe Sportif ProDay, 92100 Boulogne',
    score: '3 - 1 (Victoire)',
    convocationStatus: 'starter',
    hasVeo: true,
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
  },
];

export const PlayerCalendarScreenV4: React.FC = () => {
  const profile = useSessionProfile();
  const userId = profile?.uid || 'player-demo';

  const [viewMode, setViewMode] = useState<'list' | 'month'>('list');
  const [rsvps, setRsvps] = useState<Record<string, PlayerRsvpStatus>>({
    'evt-1': 'present',
    'evt-2': 'present',
    'evt-3': 'uncertain',
    'evt-4': 'present',
  });
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);

  const handleRsvp = (eventId: string, status: PlayerRsvpStatus) => {
    prodayHaptics.impactMedium();
    setRsvps((prev) => ({ ...prev, [eventId]: status }));
    void playerRsvpService.setRsvp(userId, eventId, status);
  };

  const openMaps = (address: string) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(address)}`,
      android: `geo:0,0?q=${encodeURIComponent(address)}`,
      default: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
    });
    if (url) void Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      {/* Header & Segmented View Toggle */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Saison 2025/2026</Text>
          <Text style={styles.headerTitle}>Calendrier & Convocations</Text>
        </View>

        <View style={styles.segmentedToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
            onPress={() => {
              prodayHaptics.selection();
              setViewMode('list');
            }}
          >
            <Ionicons
              name="list"
              size={16}
              color={viewMode === 'list' ? '#0F172A' : '#64748B'}
            />
            <Text
              style={[
                styles.toggleBtnText,
                viewMode === 'list' && styles.toggleBtnTextActive,
              ]}
            >
              Liste
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'month' && styles.toggleBtnActive]}
            onPress={() => {
              prodayHaptics.selection();
              setViewMode('month');
            }}
          >
            <Ionicons
              name="calendar"
              size={16}
              color={viewMode === 'month' ? '#0F172A' : '#64748B'}
            />
            <Text
              style={[
                styles.toggleBtnText,
                viewMode === 'month' && styles.toggleBtnTextActive,
              ]}
            >
              Mois
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Body Content */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {viewMode === 'list' ? (
          /* Vue Liste avec RSVP direct sur chaque carte */
          <View style={styles.eventsList}>
            {SAMPLE_EVENTS.map((evt) => {
              const currentRsvp = rsvps[evt.id] || 'present';
              const isMatch = evt.type === 'match';

              return (
                <TouchableOpacity
                  key={evt.id}
                  style={styles.eventCard}
                  activeOpacity={0.9}
                  onPress={() => {
                    prodayHaptics.selection();
                    setSelectedEvent(evt);
                  }}
                >
                  <View style={styles.eventCardTop}>
                    <View
                      style={[
                        styles.eventTypeTag,
                        isMatch ? styles.eventTypeMatch : styles.eventTypeTraining,
                      ]}
                    >
                      <Ionicons
                        name={isMatch ? 'football' : 'fitness'}
                        size={12}
                        color={isMatch ? '#0284C7' : '#16A34A'}
                      />
                      <Text
                        style={[
                          styles.eventTypeText,
                          isMatch ? { color: '#0284C7' } : { color: '#16A34A' },
                        ]}
                      >
                        {isMatch ? 'MATCH' : 'ENTRAÎNEMENT'}
                      </Text>
                    </View>

                    <Text style={styles.eventTimeText}>{evt.time}</Text>
                  </View>

                  <Text style={styles.eventTitle}>{evt.title}</Text>

                  {evt.opponent && (
                    <Text style={styles.eventOpponent}>VS {evt.opponent}</Text>
                  )}

                  <View style={styles.eventLocationRow}>
                    <Ionicons name="location-outline" size={14} color="#64748B" />
                    <Text style={styles.eventLocationText} numberOfLines={1}>
                      {evt.location}
                    </Text>
                  </View>

                  {/* 1-Tap RSVP Pastilles directes sur la carte */}
                  <View style={styles.cardRsvpSection}>
                    <Text style={styles.cardRsvpTitle}>Ta réponse :</Text>
                    <View style={styles.cardRsvpRow}>
                      <TouchableOpacity
                        style={[
                          styles.cardRsvpPill,
                          currentRsvp === 'present' && styles.cardRsvpPillPresent,
                        ]}
                        onPress={() => handleRsvp(evt.id, 'present')}
                      >
                        <Ionicons
                          name="checkmark"
                          size={13}
                          color={currentRsvp === 'present' ? '#FFFFFF' : '#16A34A'}
                        />
                        <Text
                          style={[
                            styles.cardRsvpPillText,
                            currentRsvp === 'present' && styles.cardRsvpPillTextActive,
                          ]}
                        >
                          Présent
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.cardRsvpPill,
                          currentRsvp === 'uncertain' && styles.cardRsvpPillUncertain,
                        ]}
                        onPress={() => handleRsvp(evt.id, 'uncertain')}
                      >
                        <Ionicons
                          name="help"
                          size={13}
                          color={currentRsvp === 'uncertain' ? '#FFFFFF' : '#D97706'}
                        />
                        <Text
                          style={[
                            styles.cardRsvpPillText,
                            currentRsvp === 'uncertain' && styles.cardRsvpPillTextActive,
                          ]}
                        >
                          Incertain
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.cardRsvpPill,
                          currentRsvp === 'absent' && styles.cardRsvpPillAbsent,
                        ]}
                        onPress={() => handleRsvp(evt.id, 'absent')}
                      >
                        <Ionicons
                          name="close"
                          size={13}
                          color={currentRsvp === 'absent' ? '#FFFFFF' : '#DC2626'}
                        />
                        <Text
                          style={[
                            styles.cardRsvpPillText,
                            currentRsvp === 'absent' && styles.cardRsvpPillTextActive,
                          ]}
                        >
                          Absent
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          /* Vue Mois (Calendrier 2D Fitness Park) */
          <View style={styles.monthContainer}>
            <View style={styles.monthHeader}>
              <Text style={styles.monthTitle}>Mars 2026</Text>
              <View style={styles.monthLegend}>
                <View style={[styles.legendDot, { backgroundColor: '#0284C7' }]} />
                <Text style={styles.legendLabel}>Matchs</Text>
                <View style={[styles.legendDot, { backgroundColor: '#16A34A' }]} />
                <Text style={styles.legendLabel}>Séances</Text>
              </View>
            </View>

            {/* Grille des jours de la semaine */}
            <View style={styles.weekDaysRow}>
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                <Text key={i} style={styles.weekDayText}>
                  {d}
                </Text>
              ))}
            </View>

            {/* Grille des jours simplifiée */}
            <View style={styles.calendarGrid}>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                const hasMatch = day === 8 || day === 15 || day === 22 || day === 29;
                const hasTraining = day === 4 || day === 6 || day === 11 || day === 13 || day === 18 || day === 20;
                const isSelected = day === 15;

                return (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.calendarDayCell,
                      isSelected && styles.calendarDayCellSelected,
                    ]}
                    onPress={() => {
                      prodayHaptics.selection();
                      const match = SAMPLE_EVENTS.find((e) => e.dayNumber === day);
                      if (match) setSelectedEvent(match);
                    }}
                  >
                    <Text
                      style={[
                        styles.calendarDayNumber,
                        isSelected && styles.calendarDayNumberSelected,
                      ]}
                    >
                      {day}
                    </Text>
                    <View style={styles.calendarDotsRow}>
                      {hasMatch && <View style={[styles.eventMiniDot, { backgroundColor: '#0284C7' }]} />}
                      {hasTraining && <View style={[styles.eventMiniDot, { backgroundColor: '#16A34A' }]} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Sheet / Modal Détail de l'événement */}
      <Modal
        visible={!!selectedEvent}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedEvent(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailSheet}>
            <View style={styles.sheetHandle} />

            {selectedEvent && (
              <>
                <View style={styles.sheetHeader}>
                  <View>
                    <Text style={styles.sheetDate}>{selectedEvent.dateStr}</Text>
                    <Text style={styles.sheetTitle}>{selectedEvent.title}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.sheetCloseBtn}
                    onPress={() => setSelectedEvent(null)}
                  >
                    <Ionicons name="close" size={22} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <View style={styles.sheetTimesRow}>
                  <View style={styles.sheetTimeBox}>
                    <Text style={styles.sheetTimeLabel}>Rendez-vous vestiaire</Text>
                    <Text style={styles.sheetTimeValue}>{selectedEvent.meetTime}</Text>
                  </View>
                  <View style={styles.sheetTimeBox}>
                    <Text style={styles.sheetTimeLabel}>Coup d’envoi / Début</Text>
                    <Text style={[styles.sheetTimeValue, { color: '#0284C7' }]}>
                      {selectedEvent.time}
                    </Text>
                  </View>
                </View>

                {/* Lieu & Itinéraire */}
                <View style={styles.sheetLocationCard}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.sheetLocationName}>{selectedEvent.location}</Text>
                    <Text style={styles.sheetLocationAddress}>{selectedEvent.address}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.itineraryBtn}
                    onPress={() => openMaps(selectedEvent.address)}
                  >
                    <Ionicons name="navigate-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.itineraryBtnText}>Y aller</Text>
                  </TouchableOpacity>
                </View>

                {/* Statut de convocation */}
                {selectedEvent.convocationStatus && (
                  <View style={styles.convocationNotice}>
                    <Ionicons name="shield-checkmark" size={18} color="#16A34A" />
                    <Text style={styles.convocationNoticeText}>
                      Tu es convoqué comme{' '}
                      <Text style={{ fontWeight: '800' }}>
                        {selectedEvent.convocationStatus === 'starter'
                          ? 'Titulaire'
                          : 'Remplaçant'}
                      </Text>{' '}
                      pour ce match.
                    </Text>
                  </View>
                )}

                {/* Score & VEO si match terminé */}
                {selectedEvent.score && (
                  <View style={styles.scoreNotice}>
                    <Text style={styles.scoreNoticeText}>
                      Résultat officiel : <Text style={{ fontWeight: '800' }}>{selectedEvent.score}</Text>
                    </Text>
                  </View>
                )}

                {/* Bouton Vidéo VEO */}
                {selectedEvent.hasVeo && (
                  <TouchableOpacity
                    style={styles.veoActionBtn}
                    onPress={() => setShowVideoModal(true)}
                  >
                    <Ionicons name="videocam" size={18} color="#FFFFFF" />
                    <Text style={styles.veoActionBtnText}>Regarder la diffusion VEO</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Lecteur Vidéo VEO Modal */}
      <Modal
        visible={showVideoModal}
        animationType="slide"
        onRequestClose={() => setShowVideoModal(false)}
      >
        <View style={styles.videoPlayerContainer}>
          <View style={styles.videoPlayerHeader}>
            <Text style={styles.videoPlayerTitle}>
              {selectedEvent?.title} • Diffusion VEO
            </Text>
            <TouchableOpacity
              onPress={() => setShowVideoModal(false)}
              style={styles.videoPlayerClose}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1, padding: 16 }}>
            <ProDayVideoPlayer
              streamUrl={selectedEvent?.streamUrl}
              videoType={selectedEvent?.score ? 'replay' : 'live'}
              title={selectedEvent?.title}
              opponent={selectedEvent?.opponent}
              isLive={!selectedEvent?.score}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 52 : 16,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  segmentedToggle: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 3,
    gap: 4,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  toggleBtnTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
    paddingBottom: 40,
  },
  eventsList: {
    gap: 14,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  eventCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventTypeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  eventTypeMatch: {
    backgroundColor: '#E0F2FE',
  },
  eventTypeTraining: {
    backgroundColor: '#DCFCE7',
  },
  eventTypeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  eventTimeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  eventOpponent: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  eventLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventLocationText: {
    fontSize: 12,
    color: '#64748B',
  },
  cardRsvpSection: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 6,
  },
  cardRsvpTitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  cardRsvpRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cardRsvpPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardRsvpPillPresent: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  cardRsvpPillUncertain: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  cardRsvpPillAbsent: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  cardRsvpPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  cardRsvpPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  monthContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  monthLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 11,
    color: '#64748B',
    marginRight: 6,
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    width: 32,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  calendarDayCell: {
    width: '12.5%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  calendarDayCellSelected: {
    backgroundColor: '#0F172A',
  },
  calendarDayNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  calendarDayNumberSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  calendarDotsRow: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 2,
  },
  eventMiniDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  detailSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sheetDate: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  sheetCloseBtn: {
    padding: 4,
  },
  sheetTimesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  sheetTimeBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  sheetTimeLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  sheetTimeValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  sheetLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  sheetLocationName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  sheetLocationAddress: {
    fontSize: 11,
    color: '#64748B',
  },
  itineraryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  itineraryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  convocationNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#DCFCE7',
    padding: 12,
    borderRadius: 10,
  },
  convocationNoticeText: {
    fontSize: 13,
    color: '#166534',
  },
  scoreNotice: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 10,
  },
  scoreNoticeText: {
    fontSize: 13,
    color: '#92400E',
  },
  veoActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    borderRadius: 12,
  },
  veoActionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  videoPlayerContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  videoPlayerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 52 : 20,
    paddingBottom: 12,
    backgroundColor: '#1E293B',
  },
  videoPlayerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  videoPlayerClose: {
    padding: 6,
  },
});
