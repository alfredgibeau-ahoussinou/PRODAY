import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface ChildEvent {
  id: string;
  childId: string;
  childName: string;
  childColor: string; // Hex color
  category: string;
  title: string;
  type: 'match' | 'training' | 'carpool';
  date: string; // e.g. "Samedi 20 Septembre"
  startTime: string; // "14:00"
  endTime: string; // "16:00"
  location: string;
  transportStatus?: string;
}

const DEFAULT_CHILDREN = [
  { id: 'c1', name: 'Lucas', category: 'U13 Région', color: '#0284C7' },
  { id: 'c2', name: 'Emma', category: 'U9 Féminines', color: '#EC4899' },
];

const DEFAULT_FAMILY_EVENTS: ChildEvent[] = [
  {
    id: 'e1',
    childId: 'c1',
    childName: 'Lucas',
    childColor: '#0284C7',
    category: 'U13 Région',
    title: 'Match vs AS Poissy',
    type: 'match',
    date: 'Samedi 20 Septembre',
    startTime: '14:00',
    endTime: '16:00',
    location: 'Stade Léo Lagrange, Poissy (Extérieur)',
    transportStatus: 'Covoiturage avec Papa de Mathis',
  },
  {
    id: 'e2',
    childId: 'c2',
    childName: 'Emma',
    childColor: '#EC4899',
    category: 'U9 Féminines',
    title: 'Plateau U9 Domicile',
    type: 'match',
    date: 'Samedi 20 Septembre',
    startTime: '14:30',
    endTime: '16:30',
    location: 'Complexe ProDay, Terrain 2 (Domicile)',
    transportStatus: 'Présence parent requise',
  },
  {
    id: 'e3',
    childId: 'c1',
    childName: 'Lucas',
    childColor: '#0284C7',
    category: 'U13 Région',
    title: 'Entraînement Tactique',
    type: 'training',
    date: 'Mercredi 24 Septembre',
    startTime: '17:30',
    endTime: '19:00',
    location: 'Terrain Synthétique 1',
  },
  {
    id: 'e4',
    childId: 'c2',
    childName: 'Emma',
    childColor: '#EC4899',
    category: 'U9 Féminines',
    title: 'Entraînement Éveil Foot',
    type: 'training',
    date: 'Mercredi 24 Septembre',
    startTime: '14:00',
    endTime: '15:30',
    location: 'Terrain Synthétique 2',
  },
];

export const FamilyScheduleView: React.FC = () => {
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  const filteredEvents = selectedChildId
    ? DEFAULT_FAMILY_EVENTS.filter((e) => e.childId === selectedChildId)
    : DEFAULT_FAMILY_EVENTS;

  // Conflict detection: different locations at overlapping times
  const conflicts = React.useMemo(() => {
    const list: Array<{ event1: ChildEvent; event2: ChildEvent }> = [];
    for (let i = 0; i < DEFAULT_FAMILY_EVENTS.length; i++) {
      for (let j = i + 1; j < DEFAULT_FAMILY_EVENTS.length; j++) {
        const e1 = DEFAULT_FAMILY_EVENTS[i];
        const e2 = DEFAULT_FAMILY_EVENTS[j];
        if (
          e1.childId !== e2.childId &&
          e1.date === e2.date &&
          e1.location !== e2.location
        ) {
          // check overlap
          if (e1.startTime < e2.endTime && e2.startTime < e1.endTime) {
            list.push({ event1: e1, event2: e2 });
          }
        }
      }
    }
    return list;
  }, []);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Planning Famille Multi-Enfants</Text>
          <Text style={styles.subtitle}>Synchronisation & alerte doublons de trajets</Text>
        </View>
      </View>

      {/* Conflict Alert Banner */}
      {conflicts.length > 0 && (
        <View style={styles.conflictBox}>
          <MaterialCommunityIcons name="car-traction-control" size={20} color="#F59E0B" />
          <View style={styles.conflictTextContainer}>
            <Text style={styles.conflictTitle}>Alerte logistique : Déplacements simultanés !</Text>
            {conflicts.map((c, idx) => (
              <Text key={idx} style={styles.conflictDetail}>
                • {c.event1.childName} ({c.event1.startTime}) à {c.event1.location.split(',')[0]} VS {c.event2.childName} ({c.event2.startTime}) à {c.event2.location.split(',')[0]}
              </Text>
            ))}
          </View>
        </View>
      )}

      {/* Child Chips Selector */}
      <View style={styles.childSelector}>
        <TouchableOpacity
          style={[styles.childChip, selectedChildId === null && styles.childChipActive]}
          onPress={() => setSelectedChildId(null)}
        >
          <Text style={[styles.childChipText, selectedChildId === null && styles.childChipTextActive]}>
            Tous ({DEFAULT_FAMILY_EVENTS.length})
          </Text>
        </TouchableOpacity>

        {DEFAULT_CHILDREN.map((child) => {
          const isActive = selectedChildId === child.id;
          return (
            <TouchableOpacity
              key={child.id}
              style={[
                styles.childChip,
                isActive && { backgroundColor: child.color, borderColor: child.color },
              ]}
              onPress={() => setSelectedChildId(isActive ? null : child.id)}
            >
              <View style={[styles.childDot, { backgroundColor: child.color }]} />
              <Text style={[styles.childChipText, isActive && styles.childChipTextActive]}>
                {child.name} ({child.category})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Events Stream */}
      <ScrollView style={styles.eventList} nestedScrollEnabled>
        {filteredEvents.map((event) => (
          <View key={event.id} style={styles.eventCard}>
            <View style={[styles.childIndicator, { backgroundColor: event.childColor }]} />
            <View style={styles.eventContent}>
              <View style={styles.eventTopRow}>
                <View style={styles.childBadge}>
                  <Text style={[styles.childBadgeText, { color: event.childColor }]}>
                    {event.childName.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.timeTag}>
                  <MaterialCommunityIcons name="clock-outline" size={13} color="#94A3B8" />
                  <Text style={styles.timeTagText}>
                    {event.date} • {event.startTime} - {event.endTime}
                  </Text>
                </View>
              </View>

              <Text style={styles.eventTitle}>{event.title}</Text>

              <View style={styles.locationRow}>
                <MaterialCommunityIcons name="map-marker-outline" size={15} color="#94A3B8" />
                <Text style={styles.locationText} numberOfLines={1}>
                  {event.location}
                </Text>
              </View>

              {event.transportStatus && (
                <View style={styles.transportTag}>
                  <MaterialCommunityIcons name="car-multiple" size={14} color="#0284C7" />
                  <Text style={styles.transportText}>{event.transportStatus}</Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginVertical: 8,
  },
  header: {
    marginBottom: 14,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 12,
  },
  conflictBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  conflictTextContainer: {
    flex: 1,
  },
  conflictTitle: {
    color: '#F59E0B',
    fontWeight: '800',
    fontSize: 12,
  },
  conflictDetail: {
    color: '#FEF3C7',
    fontSize: 11,
    marginTop: 2,
  },
  childSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  childChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 6,
  },
  childChipActive: {
    backgroundColor: '#38BDF8',
    borderColor: '#38BDF8',
  },
  childDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  childChipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  childChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  eventList: {
    maxHeight: 320,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  childIndicator: {
    width: 5,
  },
  eventContent: {
    flex: 1,
    padding: 12,
  },
  eventTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  childBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  childBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeTagText: {
    color: '#94A3B8',
    fontSize: 11,
  },
  eventTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    color: '#94A3B8',
    fontSize: 12,
    flex: 1,
  },
  transportTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
    gap: 6,
  },
  transportText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '600',
  },
});
