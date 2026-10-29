import React, { useState, useMemo } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCoachTheme } from '../../shell/CoachThemeContext';
import { PRELOADED_DRILLS } from './trainingLibraryData';
import { CoachPitchEngine } from './CoachPitchEngine';
import type { Drill } from './trainingWorkspaceModel';

interface CoachDrillLibraryModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDrill: (drill: Drill) => void;
  onOpenInStudio?: (drill: Drill) => void;
}

const CATEGORIES = [
  { id: 'all', label: 'Toutes les fiches' },
  { id: 'rondo', label: 'Rondos & Conservation' },
  { id: 'build_up', label: 'Sorties de balle' },
  { id: 'finishing', label: 'Finition & Attaque' },
  { id: 'pressing', label: 'Pressing' },
];

export const CoachDrillLibraryModal: React.FC<CoachDrillLibraryModalProps> = ({
  visible,
  onClose,
  onSelectDrill,
  onOpenInStudio,
}) => {
  const { tokens } = useCoachTheme();
  const { width: winWidth } = useWindowDimensions();
  const isDesktop = winWidth >= 768;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDrill, setSelectedDrill] = useState<Drill>(PRELOADED_DRILLS[0]);

  const filteredDrills = useMemo(() => {
    return PRELOADED_DRILLS.filter((d: Drill) => {
      const matchCat =
        selectedCategory === 'all' ||
        (selectedCategory === 'rondo' && d.name.toLowerCase().includes('rondo')) ||
        (selectedCategory === 'build_up' && d.name.toLowerCase().includes('sortie')) ||
        (selectedCategory === 'finishing' && d.name.toLowerCase().includes('finition'));

      const matchSearch =
        !searchQuery ||
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.objective?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchCat && matchSearch;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.modalCard, isDesktop && styles.modalCardDesktop]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Bibliothèque d’Exercices FFF</Text>
              <Text style={styles.subtitle}>
                Ateliers pédagogiques animés prêts à l’emploi ou personnalisables dans le Studio
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Fermer">
              <Ionicons name="close" size={20} color={tokens.muted} />
            </TouchableOpacity>
          </View>

          {/* Search & Filter Bar */}
          <View style={styles.filtersBar}>
            <View style={styles.searchWrap}>
              <Ionicons name="search" size={16} color={tokens.muted} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Rechercher un atelier (ex: rondo, finition, relance...)"
                placeholderTextColor={tokens.muted}
                style={styles.searchInput}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color={tokens.muted} />
                </TouchableOpacity>
              ) : null}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.id)}
                  style={[styles.categoryChip, selectedCategory === cat.id && styles.categoryChipActive]}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedCategory === cat.id && styles.categoryChipTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Master-Detail Layout */}
          <View style={[styles.body, isDesktop && styles.bodyDesktop]}>
            {/* List column */}
            <ScrollView style={styles.listColumn} contentContainerStyle={styles.listContent}>
              {filteredDrills.map((drill: Drill) => {
                const isSelected = selectedDrill.id === drill.id;
                return (
                  <TouchableOpacity
                    key={drill.id}
                    onPress={() => setSelectedDrill(drill)}
                    style={[styles.drillCard, isSelected && styles.drillCardActive]}
                  >
                    <View style={styles.drillCardTop}>
                      <Text style={[styles.drillCardName, isSelected && styles.drillCardNameActive]}>
                        {drill.name}
                      </Text>
                      <View style={styles.timeBadge}>
                        <Ionicons name="timer-outline" size={12} color="#00E676" />
                        <Text style={styles.timeBadgeText}>{drill.durationMin} min</Text>
                      </View>
                    </View>

                    <Text style={styles.drillCardDesc} numberOfLines={2}>
                      {drill.objective}
                    </Text>

                    <View style={styles.drillMetaRow}>
                      <Text style={styles.drillMetaBadge}>{drill.playerCount} joueurs</Text>
                      <Text style={styles.drillMetaBadge}>{drill.frames.length} phases animées</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Detail Preview Column */}
            <View style={styles.previewColumn}>
              <View style={styles.pitchBox}>
                <CoachPitchEngine
                  pitchConfig={selectedDrill.pitchConfig}
                  viewMode="2d"
                  cameraPreset="top"
                  players={selectedDrill.frames[0]?.players || []}
                  equipment={selectedDrill.frames[0]?.equipment || []}
                  drawings={selectedDrill.frames[0]?.drawings || []}
                  width={isDesktop ? 440 : 300}
                  height={isDesktop ? 290 : 200}
                />
              </View>

              <ScrollView style={styles.detailTextScroll}>
                <Text style={styles.detailTitle}>{selectedDrill.name}</Text>
                <Text style={styles.detailDesc}>{selectedDrill.objective}</Text>

                {selectedDrill.instructions ? (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Déroulé & Consignes</Text>
                    <Text style={styles.bulletText}>{selectedDrill.instructions}</Text>
                  </View>
                ) : null}

                {selectedDrill.coachingPoints?.length ? (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Points d’Attention du Coach</Text>
                    {selectedDrill.coachingPoints.map((cp: string, idx: number) => (
                      <View key={idx} style={styles.bulletRow}>
                        <Ionicons name="eye-outline" size={14} color="#FF9100" />
                        <Text style={styles.bulletText}>{cp}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </ScrollView>

              {/* Action buttons */}
              <View style={styles.previewActions}>
                {onOpenInStudio && (
                  <TouchableOpacity
                    onPress={() => {
                      onClose();
                      onOpenInStudio(selectedDrill);
                    }}
                    style={styles.btnStudio}
                  >
                    <MaterialCommunityIcons name="vector-polyline" size={18} color="#00E676" />
                    <Text style={styles.btnStudioText}>Éditer dans le Studio</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={() => {
                    onSelectDrill(selectedDrill);
                    onClose();
                  }}
                  style={styles.btnSelect}
                >
                  <Ionicons name="add-circle" size={18} color="#000" />
                  <Text style={styles.btnSelectText}>Ajouter à la séance</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: '92%',
    backgroundColor: '#141416',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  modalCardDesktop: {
    maxWidth: 960,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: '#0D0E10',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    padding: 0,
  },
  categoryScroll: {
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  categoryChipActive: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    borderColor: '#00E676',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#AAAAAA',
  },
  categoryChipTextActive: {
    color: '#00E676',
    fontWeight: '700',
  },
  body: {
    flex: 1,
    flexDirection: 'column',
  },
  bodyDesktop: {
    flexDirection: 'row',
    height: 520,
  },
  listColumn: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.06)',
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  drillCard: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 6,
  },
  drillCardActive: {
    backgroundColor: 'rgba(0, 230, 118, 0.08)',
    borderColor: '#00E676',
  },
  drillCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  drillCardName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  drillCardNameActive: {
    color: '#00E676',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
  },
  timeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00E676',
  },
  drillCardDesc: {
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 16,
  },
  drillMetaRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  drillMetaBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: '#777777',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  previewColumn: {
    flex: 1.2,
    padding: 16,
    gap: 12,
  },
  pitchBox: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailTextScroll: {
    flex: 1,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  detailDesc: {
    fontSize: 13,
    color: '#A0A0A0',
    lineHeight: 18,
    marginBottom: 10,
  },
  detailSection: {
    marginTop: 8,
    gap: 4,
  },
  detailSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D0D0D0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bulletText: {
    fontSize: 12,
    color: '#CCCCCC',
    flex: 1,
  },
  previewActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  btnStudio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.3)',
  },
  btnStudioText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00E676',
  },
  btnSelect: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#00E676',
  },
  btnSelectText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
  },
});
