import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  isEssential?: boolean;
}

const STORAGE_KEY = '@proday_player_bag_checklist';

const DEFAULT_ITEMS: ChecklistItem[] = [
  { id: '1', label: 'Protège-tibias (Obligatoires FFF)', checked: false, isEssential: true },
  { id: '2', label: 'Crampons (moulés ou vissés selon terrain)', checked: false, isEssential: true },
  { id: '3', label: 'Chaussettes de match & bandes de maintien', checked: false, isEssential: true },
  { id: '4', label: 'Sous-vêtements thermiques / Cuissard', checked: false },
  { id: '5', label: 'Gourde d’eau remplie', checked: false, isEssential: true },
  { id: '6', label: 'Veste de pluie / Coupe-vent club', checked: false },
  { id: '7', label: 'Serviette & Gel douche', checked: false },
  { id: '8', label: 'Pièce d’identité ou Licence dématérialisée', checked: false, isEssential: true },
  { id: '9', label: 'Collation d’avant ou après-match (banane, barre)', checked: false },
];

export const MatchBagChecklist: React.FC = () => {
  const [items, setItems] = useState<ChecklistItem[]>(DEFAULT_ITEMS);
  const [newItemText, setNewItemText] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    loadSavedItems();
  }, []);

  const loadSavedItems = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error loading bag checklist:', e);
    }
  };

  const saveItems = async (updated: ChecklistItem[]) => {
    try {
      setItems(updated);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving bag checklist:', e);
    }
  };

  const toggleItem = (id: string) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    saveItems(updated);
  };

  const resetAll = () => {
    Alert.alert('Réinitialiser le sac', 'Décocher tous les équipements pour préparer le prochain match ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Vider le sac',
        onPress: () => {
          const reset = items.map((i) => ({ ...i, checked: false }));
          saveItems(reset);
        },
      },
    ]);
  };

  const checkAll = () => {
    const all = items.map((i) => ({ ...i, checked: true }));
    saveItems(all);
  };

  const addItem = () => {
    if (!newItemText.trim()) return;
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      label: newItemText.trim(),
      checked: true,
    };
    saveItems([...items, newItem]);
    setNewItemText('');
    setIsAdding(false);
  };

  const deleteItem = (id: string) => {
    const filtered = items.filter((i) => i.id !== id);
    saveItems(filtered);
  };

  const checkedCount = items.filter((i) => i.checked).length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
  const isReady = checkedCount === totalCount && totalCount > 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="bag-personal" size={24} color="#38BDF8" />
          <View>
            <Text style={styles.title}>Mon Sac de Match</Text>
            <Text style={styles.subtitle}>Check-list veille de match</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={resetAll} style={styles.iconBtn}>
            <MaterialCommunityIcons name="refresh" size={20} color="#94A3B8" />
          </TouchableOpacity>
          <TouchableOpacity onPress={checkAll} style={styles.iconBtn}>
            <MaterialCommunityIcons name="check-all" size={20} color="#10B981" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressLabels}>
          <Text style={styles.progressText}>
            {checkedCount} sur {totalCount} préparés
          </Text>
          <Text style={[styles.progressPercent, isReady && styles.progressPercentDone]}>
            {progressPercent}% {isReady ? '• Prêt pour le coup d’envoi ! 🚀' : ''}
          </Text>
        </View>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${progressPercent}%` },
              isReady && styles.progressBarFillDone,
            ]}
          />
        </View>
      </View>

      {/* List */}
      <ScrollView style={styles.list} nestedScrollEnabled>
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.itemRow, item.checked && styles.itemRowChecked]}
            onPress={() => toggleItem(item.id)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={item.checked ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
              size={22}
              color={item.checked ? '#10B981' : '#64748B'}
            />
            <Text style={[styles.itemLabel, item.checked && styles.itemLabelChecked]}>
              {item.label}
            </Text>
            {item.isEssential && (
              <View style={styles.essentialBadge}>
                <Text style={styles.essentialText}>Requis</Text>
              </View>
            )}
            {!DEFAULT_ITEMS.some((d) => d.id === item.id) && (
              <TouchableOpacity onPress={() => deleteItem(item.id)} style={styles.deleteBtn}
                accessibilityRole="button"
                accessibilityLabel="Supprimer">
                <MaterialCommunityIcons name="trash-can-outline" size={16} color="#EF4444" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Add Item form */}
      {isAdding ? (
        <View style={styles.addRow}>
          <TextInput
            style={styles.addInput}
            placeholder="Ex: Strapping cheville..."
            placeholderTextColor="#64748B"
            value={newItemText}
            onChangeText={setNewItemText}
            autoFocus
          />
          <TouchableOpacity style={styles.confirmAddBtn} onPress={addItem}>
            <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelAddBtn} onPress={() => setIsAdding(false)}>
            <MaterialCommunityIcons name="close" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.addTrigger} onPress={() => setIsAdding(true)}>
          <MaterialCommunityIcons name="plus" size={18} color="#38BDF8" />
          <Text style={styles.addTriggerText}>Ajouter un équipement personnel</Text>
        </TouchableOpacity>
      )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    padding: 6,
    backgroundColor: '#0F172A',
    borderRadius: 8,
  },
  progressContainer: {
    marginBottom: 14,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  progressPercent: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  progressPercentDone: {
    color: '#10B981',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#0F172A',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#38BDF8',
    borderRadius: 4,
  },
  progressBarFillDone: {
    backgroundColor: '#10B981',
  },
  list: {
    maxHeight: 280,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.5)',
    gap: 10,
  },
  itemRowChecked: {
    opacity: 0.6,
  },
  itemLabel: {
    flex: 1,
    color: '#F1F5F9',
    fontSize: 14,
  },
  itemLabelChecked: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  essentialBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  essentialText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '700',
  },
  deleteBtn: {
    padding: 4,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  addInput: {
    flex: 1,
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    fontSize: 13,
  },
  confirmAddBtn: {
    backgroundColor: '#0284C7',
    padding: 8,
    borderRadius: 8,
  },
  cancelAddBtn: {
    padding: 8,
  },
  addTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
    gap: 6,
  },
  addTriggerText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
  },
});
