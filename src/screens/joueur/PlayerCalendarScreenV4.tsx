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
  TextInput,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { playerRsvpService, type PlayerRsvpStatus } from '../../services/playerRsvp.service';
import { ProDayVideoPlayer } from '../../components/video/ProDayVideoPlayer';
import { FITNESS_PARK, FITNESS_PARK_RADIUS } from '../../theme/fitnessParkTheme';

interface CalendarEvent {
  id: string;
  type: 'match' | 'training' | 'tournament';
  title: string;
  opponent?: string;
  dateStr: string;
  dayNumber: number;
  dayName: string;
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
    dayName: 'DIM',
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
    dayName: 'VEN',
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
    dayName: 'MER',
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
    dayName: 'DIM',
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

const WEEK_DAYS = [
  { dayName: 'LUN', dayNumber: 9 },
  { dayName: 'MAR', dayNumber: 10 },
  { dayName: 'MER', dayNumber: 11 },
  { dayName: 'JEU', dayNumber: 12 },
  { dayName: 'VEN', dayNumber: 13 },
  { dayName: 'SAM', dayNumber: 14 },
  { dayName: 'DIM', dayNumber: 15 },
  { dayName: 'LUN', dayNumber: 16 },
  { dayName: 'MAR', dayNumber: 17 },
  { dayName: 'MER', dayNumber: 18 },
  { dayName: 'JEU', dayNumber: 19 },
  { dayName: 'VEN', dayNumber: 20 },
  { dayName: 'SAM', dayNumber: 21 },
  { dayName: 'DIM', dayNumber: 22 },
];

type FilterChip = 'overview' | 'matches' | 'trainings' | 'programs';

export const PlayerCalendarScreenV4: React.FC = () => {
  const profile = useSessionProfile();
  const userId = profile?.uid || 'player-demo';

  const [activeFilter, setActiveFilter] = useState<FilterChip>('overview');
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(15);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'strip' | 'month'>('strip');

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

  // Filter events based on activeFilter and searchQuery
  const filteredEvents = SAMPLE_EVENTS.filter((evt) => {
    if (activeFilter === 'matches' && evt.type !== 'match') return false;
    if (activeFilter === 'trainings' && evt.type !== 'training') return false;
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      const matchTitle = evt.title.toLowerCase().includes(q);
      const matchOpp = evt.opponent?.toLowerCase().includes(q);
      const matchLoc = evt.location.toLowerCase().includes(q);
      return matchTitle || matchOpp || matchLoc;
    }
    return true;
  });

  // Selected Day Event
  const selectedDayEvents = filteredEvents.filter(
    (e) => e.dayNumber === selectedDayNumber
  );

  return (
    <View style={styles.container}>
      {/* 1. Header Centré Fitness Park : « Training » */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Training</Text>
        <TouchableOpacity
          style={styles.monthToggleBtn}
          onPress={() => {
            prodayHaptics.selection();
            setViewMode(viewMode === 'strip' ? 'month' : 'strip');
          }}
          accessibilityLabel="Changer de vue calendrier"
        >
          <Ionicons
            name={viewMode === 'strip' ? 'calendar-outline' : 'list-outline'}
            size={20}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      {/* 2. Barre de Recherche Capsule Arrondie Fitness Park */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher par séance, match, adversaire..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 3. Filtres Horizontaux Fitness Park */}
      <View style={styles.filtersWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          <TouchableOpacity
            style={[
              styles.filterPill,
              activeFilter === 'overview' && styles.filterPillActive,
            ]}
            onPress={() => {
              prodayHaptics.selection();
              setActiveFilter('overview');
            }}
          >
            <Text
              style={[
                styles.filterPillText,
                activeFilter === 'overview' && styles.filterPillTextActive,
              ]}
            >
              Vue d'ensemble
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              activeFilter === 'matches' && styles.filterPillActive,
            ]}
            onPress={() => {
              prodayHaptics.selection();
              setActiveFilter('matches');
            }}
          >
            <Text
              style={[
                styles.filterPillText,
                activeFilter === 'matches' && styles.filterPillTextActive,
              ]}
            >
              Matchs
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              activeFilter === 'trainings' && styles.filterPillActive,
            ]}
            onPress={() => {
              prodayHaptics.selection();
              setActiveFilter('trainings');
            }}
          >
            <Text
              style={[
                styles.filterPillText,
                activeFilter === 'trainings' && styles.filterPillTextActive,
              ]}
            >
              Séances
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              activeFilter === 'programs' && styles.filterPillActive,
            ]}
            onPress={() => {
              prodayHaptics.selection();
              setActiveFilter('programs');
            }}
          >
            <Text
              style={[
                styles.filterPillText,
                activeFilter === 'programs' && styles.filterPillTextActive,
              ]}
            >
              Programmes
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* 4. Bandeau de Sélection des Jours de la Semaine (Signature Fitness Park) */}
      {viewMode === 'strip' ? (
        <View style={styles.weekStripContainer}>
          <View style={styles.weekStripHeader}>
            <Text style={styles.weekStripMonth}>MARS 2026</Text>
            <TouchableOpacity
              style={styles.todayIndicatorRow}
              onPress={() => setSelectedDayNumber(15)}
            >
              <Text style={styles.todayIndicatorText}>AUJOURD'HUI</Text>
              <Ionicons name="chevron-forward" size={12} color={FITNESS_PARK.accentYellow} />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.weekDaysScroll}
          >
            {WEEK_DAYS.map((dayItem) => {
              const isSelected = dayItem.dayNumber === selectedDayNumber;
              const hasEvent = SAMPLE_EVENTS.some((e) => e.dayNumber === dayItem.dayNumber);

              return (
                <TouchableOpacity
                  key={`${dayItem.dayName}-${dayItem.dayNumber}`}
                  style={[
                    styles.dayBox,
                    isSelected && styles.dayBoxSelected,
                  ]}
                  onPress={() => {
                    prodayHaptics.selection();
                    setSelectedDayNumber(dayItem.dayNumber);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.dayBoxName,
                      isSelected && styles.dayBoxNameSelected,
                    ]}
                  >
                    {dayItem.dayName}
                  </Text>
                  <Text
                    style={[
                      styles.dayBoxNumber,
                      isSelected && styles.dayBoxNumberSelected,
                    ]}
                  >
                    {dayItem.dayNumber}
                  </Text>
                  {hasEvent ? (
                    <View
                      style={[
                        styles.dayEventDot,
                        isSelected && { backgroundColor: FITNESS_PARK.accentYellow },
                      ]}
                    />
                  ) : (
                    <View style={styles.dayEventDotEmpty} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {/* 5. Corps de l'écran : Événements ou Carte Repos « zZ » */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {viewMode === 'strip' ? (
          /* Mode Strip : Affichage des séances du jour sélectionné */
          selectedDayEvents.length > 0 ? (
            <View style={styles.eventsList}>
              {selectedDayEvents.map((evt) => {
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
                          color={isMatch ? '#38BDF8' : '#10B981'}
                        />
                        <Text
                          style={[
                            styles.eventTypeText,
                            isMatch ? { color: '#38BDF8' } : { color: '#10B981' },
                          ]}
                        >
                          {isMatch ? 'COMPÉTITION R2' : 'ENTRAÎNEMENT'}
                        </Text>
                      </View>

                      <Text style={styles.eventTimeText}>{evt.time}</Text>
                    </View>

                    <Text style={styles.eventTitle}>{evt.title}</Text>

                    {evt.opponent && (
                      <Text style={styles.eventOpponent}>VS {evt.opponent}</Text>
                    )}

                    <View style={styles.eventLocationRow}>
                      <Ionicons name="location-outline" size={14} color="#94A3B8" />
                      <Text style={styles.eventLocationText} numberOfLines={1}>
                        {evt.location}
                      </Text>
                    </View>

                    {/* 1-Tap RSVP Pastilles directes sur la carte */}
                    <View style={styles.cardRsvpSection}>
                      <Text style={styles.cardRsvpTitle}>Ta réponse pour ce créneau :</Text>
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
                            color={currentRsvp === 'present' ? '#FFFFFF' : '#10B981'}
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
                            color={currentRsvp === 'uncertain' ? '#FFFFFF' : '#F59E0B'}
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
                            color={currentRsvp === 'absent' ? '#FFFFFF' : '#EF4444'}
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
            /* Carte Repos Fitness Park : « zZ » */
            <View style={styles.restCardContainer}>
              <View style={styles.restIconCircle}>
                <Text style={styles.restZText}>zZ</Text>
              </View>
              <Text style={styles.restCardTitle}>Aujourd'hui, c'est repos !</Text>
              <Text style={styles.restCardSubtitle}>
                Profite de cette journée pour récupérer, faire des étirements ou planifier ta prochaine séance.
              </Text>
              <TouchableOpacity
                style={styles.restActionBtn}
                activeOpacity={0.85}
                onPress={() => {
                  prodayHaptics.selection();
                  setSelectedDayNumber(15);
                }}
              >
                <Text style={styles.restActionBtnText}>Voir le prochain match</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          /* Vue Mois Complète */
          <View style={styles.monthContainer}>
            <View style={styles.monthHeader}>
              <Text style={styles.monthTitle}>Mars 2026</Text>
              <View style={styles.monthLegend}>
                <View style={[styles.legendDot, { backgroundColor: '#38BDF8' }]} />
                <Text style={styles.legendLabel}>Matchs</Text>
                <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
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

            {/* Grille des jours */}
            <View style={styles.calendarGrid}>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                const hasMatch = day === 8 || day === 15 || day === 22 || day === 29;
                const hasTraining = day === 4 || day === 6 || day === 11 || day === 13 || day === 18 || day === 20;
                const isSelected = day === selectedDayNumber;

                return (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.calendarDayCell,
                      isSelected && styles.calendarDayCellSelected,
                    ]}
                    onPress={() => {
                      prodayHaptics.selection();
                      setSelectedDayNumber(day);
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
                      {hasMatch && <View style={[styles.eventMiniDot, { backgroundColor: '#38BDF8' }]} />}
                      {hasTraining && <View style={[styles.eventMiniDot, { backgroundColor: '#10B981' }]} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Section Tous les Prochains Événements */}
        <View style={styles.allUpcomingHeader}>
          <Text style={styles.allUpcomingTitle}>Toutes les échéances</Text>
          <Text style={styles.allUpcomingCount}>{filteredEvents.length} programmées</Text>
        </View>

        <View style={styles.upcomingList}>
          {filteredEvents.map((evt) => (
            <TouchableOpacity
              key={`all-${evt.id}`}
              style={styles.compactEventRow}
              activeOpacity={0.8}
              onPress={() => setSelectedEvent(evt)}
            >
              <View style={styles.compactDateCol}>
                <Text style={styles.compactDayName}>{evt.dayName}</Text>
                <Text style={styles.compactDayNumber}>{evt.dayNumber}</Text>
              </View>

              <View style={styles.compactDetailsCol}>
                <Text style={styles.compactEventTitle}>{evt.title}</Text>
                <Text style={styles.compactEventSub}>
                  {evt.time} • {evt.location}
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={16} color="#64748B" />
            </TouchableOpacity>
          ))}
        </View>
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
                    <Ionicons name="close" size={22} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                <View style={styles.sheetTimesRow}>
                  <View style={styles.sheetTimeBox}>
                    <Text style={styles.sheetTimeLabel}>Rendez-vous vestiaire</Text>
                    <Text style={styles.sheetTimeValue}>{selectedEvent.meetTime}</Text>
                  </View>
                  <View style={styles.sheetTimeBox}>
                    <Text style={styles.sheetTimeLabel}>Coup d’envoi / Début</Text>
                    <Text style={[styles.sheetTimeValue, { color: FITNESS_PARK.accentYellow }]}>
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
                    <Ionicons name="navigate-outline" size={16} color="#0B0F14" />
                    <Text style={styles.itineraryBtnText}>Y aller</Text>
                  </TouchableOpacity>
                </View>

                {/* Statut de convocation */}
                {selectedEvent.convocationStatus && (
                  <View style={styles.convocationNotice}>
                    <Ionicons name="shield-checkmark" size={18} color="#10B981" />
                    <Text style={styles.convocationNoticeText}>
                      Tu es convoqué comme{' '}
                      <Text style={{ fontWeight: '800', color: '#FFFFFF' }}>
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
                      Résultat officiel : <Text style={{ fontWeight: '800', color: FITNESS_PARK.accentYellow }}>{selectedEvent.score}</Text>
                    </Text>
                  </View>
                )}

                {/* Bouton Vidéo VEO */}
                {selectedEvent.hasVeo && (
                  <TouchableOpacity
                    style={styles.veoActionBtn}
                    onPress={() => setShowVideoModal(true)}
                  >
                    <Ionicons name="videocam" size={18} color="#0B0F14" />
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
    backgroundColor: FITNESS_PARK.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 52 : 16,
    paddingBottom: 12,
    backgroundColor: FITNESS_PARK.bg,
  },
  headerSpacer: {
    width: 36,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  monthToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: FITNESS_PARK.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: FITNESS_PARK.border,
  },
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#161F2C',
    borderRadius: 22,
    paddingHorizontal: 14,
    height: 42,
    borderWidth: 1,
    borderColor: '#243142',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    paddingVertical: 0,
  },
  filtersWrapper: {
    marginBottom: 12,
  },
  filtersRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: FITNESS_PARK.surface,
    borderWidth: 1,
    borderColor: FITNESS_PARK.border,
  },
  filterPillActive: {
    borderColor: FITNESS_PARK.accentYellow,
    backgroundColor: 'rgba(255, 210, 0, 0.12)',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  filterPillTextActive: {
    color: FITNESS_PARK.accentYellow,
  },
  weekStripContainer: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: FITNESS_PARK.divider,
    gap: 10,
  },
  weekStripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  weekStripMonth: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  todayIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  todayIndicatorText: {
    fontSize: 11,
    fontWeight: '800',
    color: FITNESS_PARK.accentYellow,
    letterSpacing: 0.5,
  },
  weekDaysScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  dayBox: {
    width: 50,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: FITNESS_PARK.surface,
    borderWidth: 1,
    borderColor: FITNESS_PARK.border,
    gap: 4,
  },
  dayBoxSelected: {
    backgroundColor: '#1E2838',
    borderColor: FITNESS_PARK.accentYellow,
  },
  dayBoxName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  dayBoxNameSelected: {
    color: '#CBD5E1',
  },
  dayBoxNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dayBoxNumberSelected: {
    color: FITNESS_PARK.accentYellow,
  },
  dayEventDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#38BDF8',
    marginTop: 2,
  },
  dayEventDotEmpty: {
    width: 5,
    height: 5,
    marginTop: 2,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  eventsList: {
    gap: 14,
  },
  eventCard: {
    backgroundColor: FITNESS_PARK.surface,
    borderRadius: FITNESS_PARK_RADIUS.card,
    padding: 16,
    borderWidth: 1,
    borderColor: FITNESS_PARK.border,
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
    backgroundColor: 'rgba(0, 102, 255, 0.2)',
  },
  eventTypeTraining: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  eventTypeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  eventTimeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  eventOpponent: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  eventLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventLocationText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  cardRsvpSection: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: FITNESS_PARK.divider,
    gap: 6,
  },
  cardRsvpTitle: {
    fontSize: 11,
    color: '#94A3B8',
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
    backgroundColor: '#1E2838',
    borderWidth: 1,
    borderColor: '#28374D',
  },
  cardRsvpPillPresent: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  cardRsvpPillUncertain: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  cardRsvpPillAbsent: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  cardRsvpPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  cardRsvpPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  restCardContainer: {
    backgroundColor: FITNESS_PARK.surface,
    borderRadius: FITNESS_PARK_RADIUS.cardLarge,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: FITNESS_PARK.border,
    gap: 10,
  },
  restIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 210, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: FITNESS_PARK.accentYellowBorder,
    marginBottom: 4,
  },
  restZText: {
    fontSize: 24,
    fontWeight: '900',
    fontStyle: 'italic',
    color: FITNESS_PARK.accentYellow,
  },
  restCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  restCardSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
  restActionBtn: {
    marginTop: 8,
    backgroundColor: FITNESS_PARK.accentYellow,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  restActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0B0F14',
  },
  monthContainer: {
    backgroundColor: FITNESS_PARK.surface,
    borderRadius: FITNESS_PARK_RADIUS.card,
    padding: 16,
    borderWidth: 1,
    borderColor: FITNESS_PARK.border,
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
    color: '#FFFFFF',
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
    color: '#94A3B8',
    marginRight: 6,
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: FITNESS_PARK.divider,
    paddingBottom: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
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
    backgroundColor: '#1E2838',
    borderWidth: 1,
    borderColor: FITNESS_PARK.accentYellow,
  },
  calendarDayNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  calendarDayNumberSelected: {
    color: FITNESS_PARK.accentYellow,
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
  allUpcomingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  allUpcomingTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  allUpcomingCount: {
    fontSize: 12,
    color: '#94A3B8',
  },
  upcomingList: {
    gap: 8,
  },
  compactEventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FITNESS_PARK.surface,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FITNESS_PARK.border,
    gap: 12,
  },
  compactDateCol: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 42,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1E2838',
  },
  compactDayName: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  compactDayNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  compactDetailsCol: {
    flex: 1,
    gap: 2,
  },
  compactEventTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  compactEventSub: {
    fontSize: 12,
    color: '#94A3B8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  detailSheet: {
    backgroundColor: '#161F2C',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderWidth: 1,
    borderColor: FITNESS_PARK.border,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#28374D',
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
    color: '#94A3B8',
    fontWeight: '600',
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
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
    backgroundColor: '#1E2838',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#28374D',
    gap: 4,
  },
  sheetTimeLabel: {
    fontSize: 11,
    color: '#94A3B8',
  },
  sheetTimeValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sheetLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2838',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#28374D',
    gap: 12,
  },
  sheetLocationName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sheetLocationAddress: {
    fontSize: 11,
    color: '#94A3B8',
  },
  itineraryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: FITNESS_PARK.accentYellow,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  itineraryBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0B0F14',
  },
  convocationNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  convocationNoticeText: {
    fontSize: 13,
    color: '#34D399',
  },
  scoreNotice: {
    backgroundColor: 'rgba(255, 210, 0, 0.15)',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: FITNESS_PARK.accentYellowBorder,
  },
  scoreNoticeText: {
    fontSize: 13,
    color: '#FCD34D',
  },
  veoActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: FITNESS_PARK.accentYellow,
    paddingVertical: 14,
    borderRadius: 12,
  },
  veoActionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0B0F14',
  },
  videoPlayerContainer: {
    flex: 1,
    backgroundColor: '#0B0F14',
  },
  videoPlayerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 52 : 20,
    paddingBottom: 12,
    backgroundColor: '#161F2C',
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
