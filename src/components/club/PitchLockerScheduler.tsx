import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface ResourceSlot {
  id: string;
  type: 'pitch' | 'locker';
  resourceName: string; // e.g. "Terrain Synthétique 1", "Vestiaire 2"
  teamCategory: string; // e.g. "U17 R1"
  activity: 'match' | 'training' | 'tournament';
  startTime: string; // "14:00"
  endTime: string; // "16:00"
  opponent?: string;
}

const INITIAL_SLOTS: ResourceSlot[] = [
  {
    id: 's1',
    type: 'pitch',
    resourceName: 'Terrain Honneur (Herbe)',
    teamCategory: 'Séniors N3',
    activity: 'match',
    startTime: '18:00',
    endTime: '20:00',
    opponent: 'FC Rouen',
  },
  {
    id: 's2',
    type: 'pitch',
    resourceName: 'Terrain Synthétique 1',
    teamCategory: 'U17 R1',
    activity: 'match',
    startTime: '14:30',
    endTime: '16:30',
    opponent: 'RC Joinville',
  },
  {
    id: 's3',
    type: 'pitch',
    resourceName: 'Terrain Synthétique 2',
    teamCategory: 'U13 Région',
    activity: 'training',
    startTime: '14:00',
    endTime: '15:30',
  },
  {
    id: 's4',
    type: 'locker',
    resourceName: 'Vestiaire 1 (Domicile)',
    teamCategory: 'U17 R1',
    activity: 'match',
    startTime: '13:30',
    endTime: '17:00',
  },
  {
    id: 's5',
    type: 'locker',
    resourceName: 'Vestiaire 2 (Visiteurs)',
    teamCategory: 'RC Joinville U17',
    activity: 'match',
    startTime: '13:30',
    endTime: '17:00',
  },
  {
    id: 's6',
    type: 'locker',
    resourceName: 'Vestiaire Arbitres',
    teamCategory: 'Trio Arbitral',
    activity: 'match',
    startTime: '13:45',
    endTime: '17:15',
  },
];

export const PitchLockerScheduler: React.FC = () => {
  const [slots, setSlots] = useState<ResourceSlot[]>(INITIAL_SLOTS);
  const [selectedType, setSelectedType] = useState<'all' | 'pitch' | 'locker'>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [newResourceName, setNewResourceName] = useState('');
  const [newTeam, setNewTeam] = useState('');
  const [newType, setNewType] = useState<'pitch' | 'locker'>('pitch');
  const [newStartTime, setNewStartTime] = useState('16:30');
  const [newEndTime, setNewEndTime] = useState('18:00');

  const filteredSlots = slots.filter((slot) => {
    if (selectedType === 'all') return true;
    return slot.type === selectedType;
  });

  // Detect time conflicts on same resource
  const conflicts = React.useMemo(() => {
    const conflictPairs: Array<{ slot1: ResourceSlot; slot2: ResourceSlot }> = [];
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        const s1 = slots[i];
        const s2 = slots[j];
        if (s1.resourceName.toLowerCase().trim() === s2.resourceName.toLowerCase().trim()) {
          // Check overlap
          if (s1.startTime < s2.endTime && s2.startTime < s1.endTime) {
            conflictPairs.push({ slot1: s1, slot2: s2 });
          }
        }
      }
    }
    return conflictPairs;
  }, [slots]);

  const handleAddSlot = () => {
    if (!newResourceName.trim() || !newTeam.trim()) {
      Alert.alert('Champs obligatoires', 'Veuillez saisir le nom de la ressource et l’équipe.');
      return;
    }
    const newSlot: ResourceSlot = {
      id: Date.now().toString(),
      type: newType,
      resourceName: newResourceName.trim(),
      teamCategory: newTeam.trim(),
      activity: 'training',
      startTime: newStartTime,
      endTime: newEndTime,
    };
    setSlots([...slots, newSlot]);
    setShowAddForm(false);
    setNewResourceName('');
    setNewTeam('');
  };

  const deleteSlot = (id: string) => {
    setSlots(slots.filter((s) => s.id !== id));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Occupation Terrains & Vestiaires</Text>
          <Text style={styles.subtitle}>Planning temps réel & prévention des conflits</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <MaterialCommunityIcons name={showAddForm ? 'close' : 'plus'} size={20} color="#FFFFFF" />
          <Text style={styles.addBtnText}>{showAddForm ? 'Fermer' : 'Réserver'}</Text>
        </TouchableOpacity>
      </View>

      {/* Conflict Banner if any */}
      {conflicts.length > 0 && (
        <View style={styles.conflictBanner}>
          <MaterialCommunityIcons name="alert-decagram" size={22} color="#EF4444" />
          <View style={styles.conflictBannerContent}>
            <Text style={styles.conflictBannerTitle}>
              {conflicts.length} conflit(s) d’horaires détecté(s) !
            </Text>
            {conflicts.map((c, idx) => (
              <Text key={idx} style={styles.conflictBannerText}>
                ⚠️ {c.slot1.resourceName} : {c.slot1.teamCategory} ({c.slot1.startTime}-{c.slot1.endTime}) chevauche {c.slot2.teamCategory} ({c.slot2.startTime}-{c.slot2.endTime})
              </Text>
            ))}
          </View>
        </View>
      )}

      {/* Add Slot Form */}
      {showAddForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Créer un créneau d’occupation</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeToggle, newType === 'pitch' && styles.typeToggleActive]}
              onPress={() => setNewType('pitch')}
            >
              <MaterialCommunityIcons
                name="soccer-field"
                size={18}
                color={newType === 'pitch' ? '#FFFFFF' : '#94A3B8'}
              />
              <Text style={[styles.typeText, newType === 'pitch' && styles.typeTextActive]}>
                Terrain
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeToggle, newType === 'locker' && styles.typeToggleActive]}
              onPress={() => setNewType('locker')}
            >
              <MaterialCommunityIcons
                name="locker"
                size={18}
                color={newType === 'locker' ? '#FFFFFF' : '#94A3B8'}
              />
              <Text style={[styles.typeText, newType === 'locker' && styles.typeTextActive]}>
                Vestiaire
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder={newType === 'pitch' ? 'Ex: Terrain Honneur ou Synthé 2' : 'Ex: Vestiaire 3'}
            placeholderTextColor="#64748B"
            value={newResourceName}
            onChangeText={setNewResourceName}
          />
          <TextInput
            style={styles.input}
            placeholder="Équipe (Ex: U15 D1, Vétérans...)"
            placeholderTextColor="#64748B"
            value={newTeam}
            onChangeText={setNewTeam}
          />

          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <Text style={styles.timeLabel}>Début :</Text>
              <TextInput
                style={styles.timeInput}
                value={newStartTime}
                onChangeText={setNewStartTime}
                placeholder="14:00"
                placeholderTextColor="#64748B"
              />
            </View>
            <View style={styles.timeField}>
              <Text style={styles.timeLabel}>Fin :</Text>
              <TextInput
                style={styles.timeInput}
                value={newEndTime}
                onChangeText={setNewEndTime}
                placeholder="16:00"
                placeholderTextColor="#64748B"
              />
            </View>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleAddSlot}>
            <Text style={styles.saveBtnText}>Valider l’affectation</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {(['all', 'pitch', 'locker'] as const).map((filterKey) => (
          <TouchableOpacity
            key={filterKey}
            style={[styles.chip, selectedType === filterKey && styles.chipActive]}
            onPress={() => setSelectedType(filterKey)}
          >
            <Text style={[styles.chipText, selectedType === filterKey && styles.chipTextActive]}>
              {filterKey === 'all'
                ? `Tout (${slots.length})`
                : filterKey === 'pitch'
                ? `Terrains (${slots.filter((s) => s.type === 'pitch').length})`
                : `Vestiaires (${slots.filter((s) => s.type === 'locker').length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List of Slots */}
      <ScrollView style={styles.slotsList} nestedScrollEnabled>
        {filteredSlots.map((slot) => {
          const isPitch = slot.type === 'pitch';
          return (
            <View key={slot.id} style={styles.slotCard}>
              <View
                style={[
                  styles.slotIconBox,
                  { backgroundColor: isPitch ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)' },
                ]}
              >
                <MaterialCommunityIcons
                  name={isPitch ? 'soccer-field' : 'locker'}
                  size={24}
                  color={isPitch ? '#10B981' : '#38BDF8'}
                />
              </View>

              <View style={styles.slotDetails}>
                <View style={styles.slotResourceRow}>
                  <Text style={styles.slotResourceName}>{slot.resourceName}</Text>
                  <View style={styles.timeBadge}>
                    <MaterialCommunityIcons name="clock-outline" size={13} color="#CBD5E1" />
                    <Text style={styles.timeBadgeText}>
                      {slot.startTime} - {slot.endTime}
                    </Text>
                  </View>
                </View>

                <Text style={styles.slotTeamText}>
                  {slot.teamCategory}
                  {slot.opponent ? ` vs ${slot.opponent}` : ` • ${slot.activity.toUpperCase()}`}
                </Text>
              </View>

              <TouchableOpacity onPress={() => deleteSlot(slot.id)} style={styles.deleteSlotBtn}
                accessibilityRole="button"
                accessibilityLabel="Supprimer">
                <MaterialCommunityIcons name="trash-can-outline" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addBtn: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  conflictBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    padding: 12,
    borderRadius: 8,
    marginBottom: 14,
    flexDirection: 'row',
    gap: 10,
  },
  conflictBannerContent: {
    flex: 1,
  },
  conflictBannerTitle: {
    color: '#EF4444',
    fontWeight: '800',
    fontSize: 13,
  },
  conflictBannerText: {
    color: '#FECACA',
    fontSize: 11,
    marginTop: 4,
  },
  formCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  formTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  typeToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    gap: 6,
  },
  typeToggleActive: {
    backgroundColor: '#0284C7',
  },
  typeText: {
    color: '#94A3B8',
    fontWeight: '700',
    fontSize: 12,
  },
  typeTextActive: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#1E293B',
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    fontSize: 13,
    marginBottom: 10,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  timeField: {
    flex: 1,
  },
  timeLabel: {
    color: '#94A3B8',
    fontSize: 11,
    marginBottom: 4,
  },
  timeInput: {
    backgroundColor: '#1E293B',
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    fontSize: 13,
  },
  saveBtn: {
    backgroundColor: '#10B981',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#0F172A',
  },
  chipActive: {
    backgroundColor: '#334155',
  },
  chipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#F8FAFC',
    fontWeight: '800',
  },
  slotsList: {
    maxHeight: 300,
  },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  slotIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotDetails: {
    flex: 1,
  },
  slotResourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  slotResourceName: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  timeBadgeText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
  },
  slotTeamText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  deleteSlotBtn: {
    padding: 6,
  },
});
