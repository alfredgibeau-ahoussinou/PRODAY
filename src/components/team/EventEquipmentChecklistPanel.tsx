import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProDayText } from '../ui/ProDayText';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { eventEquipmentChecklistService } from '../../services/eventEquipmentChecklist.service';
import type { ChecklistItem } from '../../models/EventEquipmentChecklist';

interface Props {
  eventId: string;
  eventType: 'match' | 'training' | string;
  playerUid: string;
  accent?: string;
}

export const EventEquipmentChecklistPanel: React.FC<Props> = ({
  eventId,
  eventType,
  playerUid,
  accent = PLAYER_DARK.accent,
}) => {
  const [loading, setLoading] = useState(true);
  const [requiredItems, setRequiredItems] = useState<ChecklistItem[]>([]);
  const [personalItems, setPersonalItems] = useState<ChecklistItem[]>([]);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [newItemText, setNewItemText] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await eventEquipmentChecklistService.getChecklist(
        eventId,
        playerUid,
        eventType,
      );
      setRequiredItems(data.requiredItems);
      setPersonalItems(data.personalItems);
      setCheckedIds(data.checkedItemIds);
    } finally {
      setLoading(false);
    }
  }, [eventId, playerUid, eventType]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const toggleCheck = (itemId: string) => {
    prodayHaptics.selection();
    const nextChecked = new Set(checkedIds);
    if (nextChecked.has(itemId)) {
      nextChecked.delete(itemId);
    } else {
      nextChecked.add(itemId);
    }
    setCheckedIds(nextChecked);

    // Sauvegarde en arrière-plan sans notification intempestive
    void eventEquipmentChecklistService.saveChecklistState(
      eventId,
      playerUid,
      Array.from(nextChecked),
      personalItems,
    );
  };

  const handleAddPersonalItem = () => {
    const trimmed = newItemText.trim();
    if (!trimmed) return;
    prodayHaptics.impactLight();

    const newItem: ChecklistItem = {
      id: `pers_${Date.now()}`,
      label: trimmed,
      is_required_by_coach: false,
      added_by_player: true,
      category: 'gear',
    };

    const nextPersonal = [...personalItems, newItem];
    setPersonalItems(nextPersonal);
    setNewItemText('');
    setShowAddInput(false);

    void eventEquipmentChecklistService.saveChecklistState(
      eventId,
      playerUid,
      Array.from(checkedIds),
      nextPersonal,
    );
  };

  const handleDeletePersonalItem = (itemId: string) => {
    prodayHaptics.selection();
    const nextPersonal = personalItems.filter((i) => i.id !== itemId);
    const nextChecked = new Set(checkedIds);
    nextChecked.delete(itemId);

    setPersonalItems(nextPersonal);
    setCheckedIds(nextChecked);

    void eventEquipmentChecklistService.saveChecklistState(
      eventId,
      playerUid,
      Array.from(nextChecked),
      nextPersonal,
    );
  };

  const allItems = [...requiredItems, ...personalItems];
  const checkedCount = allItems.filter((i) => checkedIds.has(i.id)).length;
  const progressPct = allItems.length > 0 ? Math.round((checkedCount / allItems.length) * 100) : 0;

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="small" color={accent} />
        <ProDayText style={styles.loadingText}>Chargement de la checklist…</ProDayText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <Ionicons name="checkbox-outline" size={17} color={accent} />
          <ProDayText style={styles.title}>Checklist d'équipement</ProDayText>
        </View>
        <View style={[styles.badge, { backgroundColor: `${accent}18`, borderColor: `${accent}35` }]}>
          <ProDayText style={[styles.badgeText, { color: accent }]}>
            {checkedCount} / {allItems.length} prêt{checkedCount > 1 ? 's' : ''}
          </ProDayText>
        </View>
      </View>

      {/* Barre de progression discrète */}
      <View style={styles.progressBarTrack}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${progressPct}%`, backgroundColor: progressPct === 100 ? '#10B981' : accent },
          ]}
        />
      </View>

      <ProDayText style={styles.privacyNote}>
        Les cases cochées sont privées et mémorisées sur ton compte pour cet événement.
      </ProDayText>

      {/* 1. Éléments requis par le coach */}
      <View style={styles.sectionHeader}>
        <Ionicons name="shield-checkmark-outline" size={14} color="#10B981" />
        <ProDayText style={styles.sectionTitle}>Requis par le staff</ProDayText>
      </View>

      <View style={styles.list}>
        {requiredItems.map((item) => {
          const isChecked = checkedIds.has(item.id);
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.itemRow, isChecked && styles.itemRowChecked]}
              onPress={() => toggleCheck(item.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isChecked ? 'checkbox' : 'square-outline'}
                size={20}
                color={isChecked ? accent : PLAYER_DARK.textMuted}
              />
              <View style={styles.itemTextCol}>
                <ProDayText style={[styles.itemLabel, isChecked && styles.itemLabelChecked]}>
                  {item.label}
                </ProDayText>
                <ProDayText style={styles.requiredTag}>Exigé pour le vestiaire</ProDayText>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 2. Affaires personnelles du joueur */}
      <View style={[styles.sectionHeader, { marginTop: 14 }]}>
        <Ionicons name="person-outline" size={14} color={PLAYER_DARK.textMuted} />
        <ProDayText style={styles.sectionTitle}>Mes affaires personnelles</ProDayText>
      </View>

      <View style={styles.list}>
        {personalItems.map((item) => {
          const isChecked = checkedIds.has(item.id);
          return (
            <View key={item.id} style={[styles.itemRow, isChecked && styles.itemRowChecked]}>
              <TouchableOpacity
                style={styles.personalCheckArea}
                onPress={() => toggleCheck(item.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isChecked ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={isChecked ? accent : PLAYER_DARK.textMuted}
                />
                <ProDayText style={[styles.itemLabel, isChecked && styles.itemLabelChecked]}>
                  {item.label}
                </ProDayText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeletePersonalItem(item.id)}
                style={styles.deleteBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle-outline" size={17} color={PLAYER_DARK.textMuted} />
              </TouchableOpacity>
            </View>
          );
        })}

        {personalItems.length === 0 && !showAddInput && (
          <ProDayText style={styles.emptyPersonal}>
            Aucun élément personnel ajouté (ex: semelles, strapping, collation).
          </ProDayText>
        )}
      </View>

      {/* Bouton d'ajout */}
      {showAddInput ? (
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            placeholder="Ex: Paire de chaussettes antidérapantes..."
            placeholderTextColor={PLAYER_DARK.textMuted}
            value={newItemText}
            onChangeText={setNewItemText}
            autoFocus
          />
          <View style={styles.inputActions}>
            <TouchableOpacity
              onPress={() => setShowAddInput(false)}
              style={styles.cancelBtn}
            >
              <ProDayText style={styles.cancelBtnText}>Annuler</ProDayText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAddPersonalItem}
              style={[styles.addConfirmBtn, { backgroundColor: accent }]}
            >
              <ProDayText style={styles.addConfirmBtnText}>Ajouter</ProDayText>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.addTriggerBtn}
          onPress={() => setShowAddInput(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle-outline" size={16} color={accent} />
          <ProDayText style={[styles.addTriggerText, { color: accent }]}>
            Ajouter une affaire personnelle
          </ProDayText>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    padding: 14,
    marginVertical: 10,
  },
  loadingWrap: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: PLAYER_DARK.textMuted,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: PLAYER_DARK.text,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  privacyNote: {
    fontSize: 11,
    color: PLAYER_DARK.textMuted,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: PLAYER_DARK.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  list: {
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    gap: 10,
  },
  itemRowChecked: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  personalCheckArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemTextCol: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: PLAYER_DARK.text,
  },
  itemLabelChecked: {
    color: PLAYER_DARK.textMuted,
    textDecorationLine: 'line-through',
  },
  requiredTag: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 1,
  },
  deleteBtn: {
    padding: 4,
  },
  emptyPersonal: {
    fontSize: 12,
    color: PLAYER_DARK.textMuted,
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  addTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    marginTop: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderStyle: 'dashed',
  },
  addTriggerText: {
    fontSize: 12,
    fontWeight: '700',
  },
  inputWrap: {
    marginTop: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  input: {
    color: '#FFFFFF',
    fontSize: 13,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 6,
    marginBottom: 8,
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  cancelBtnText: {
    fontSize: 12,
    color: PLAYER_DARK.textMuted,
    fontWeight: '600',
  },
  addConfirmBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  addConfirmBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
