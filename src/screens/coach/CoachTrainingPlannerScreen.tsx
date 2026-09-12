import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import {
  CoachTrainingDrillDiagram,
  type DrillType,
} from '../../components/coach/CoachTrainingDrillDiagram';

interface SessionExercise {
  id: string;
  name: string;
  durationMin: number;
  drillType: DrillType;
  intensity: 'low' | 'medium' | 'high';
  objective: string;
  instructions: string;
}

const DEFAULT_SESSION: SessionExercise[] = [
  {
    id: 'ex1',
    name: 'Échauffement & Activation Neuro-Musculaire',
    durationMin: 15,
    drillType: 'generic',
    intensity: 'low',
    objective: 'Mise en route cardiovasculaire et gammes athlétiques',
    instructions: 'Courses progressives, déverrouillage articulaire, appuis dynamiques et étirements actifs.',
  },
  {
    id: 'ex2',
    name: 'Rondo 4v2 avec Appuis & Déplacements',
    durationMin: 20,
    drillType: 'rondo',
    intensity: 'medium',
    objective: 'Conservation sous pressing et orientation du corps',
    instructions: 'Zone 15x15m. 4 joueurs en périphérie à 2 touches max. 2 chasseurs au centre. Si interception, permutation.',
  },
  {
    id: 'ex3',
    name: 'Finition Face au But & Centres au Second Poteau',
    durationMin: 25,
    drillType: 'finishing',
    intensity: 'high',
    objective: 'Attaque rapide des couloirs et coordination des courses',
    instructions: 'Passe axiale vers l’ailier lancé. Centre fort à ras de terre ou au 2nd poteau. Attaque conjointe du BU et du MO.',
  },
  {
    id: 'ex4',
    name: 'Opposition Dirigée 8v8 + 2 Jokers Flottants',
    durationMin: 20,
    drillType: 'possession',
    intensity: 'high',
    objective: 'Animation offensive et recherche du surnombre',
    instructions: 'Terrain réduit (surface à surface). Obligation de passer par un couloir avant de finaliser dans l’axe.',
  },
  {
    id: 'ex5',
    name: 'Retour au Calme & Débriefing Collectif',
    durationMin: 10,
    drillType: 'generic',
    intensity: 'low',
    objective: 'Récupération active et fixation des objectifs match',
    instructions: 'Trottinage souple, travail de respiration guidée et rappel des consignes pour dimanche.',
  },
];

export const CoachTrainingPlannerScreen: React.FC = () => {
  const [exercises, setExercises] = useState<SessionExercise[]>(DEFAULT_SESSION);
  const [selectedDrillType, setSelectedDrillType] = useState<DrillType | 'all'>('all');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>('ex2');

  const totalDuration = exercises.reduce((acc, curr) => acc + curr.durationMin, 0);

  const generateCustomDrill = () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      const newEx: SessionExercise = {
        id: Date.now().toString(),
        name: `Atelier IA : ${aiPrompt}`,
        durationMin: 20,
        drillType: 'pressing',
        intensity: 'high',
        objective: 'Fermeture immédiate des lignes de passe axiales',
        instructions: 'Bloc médian compact. Cadrage du porteur à la passe latérale et coulissement coordonné vers le ballon.',
      };
      setExercises((prev) => [newEx, ...prev]);
      setExpandedId(newEx.id);
      setAiPrompt('');
    }, 900);
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* 1. Header: Session Overview & Periodization */}
      <View style={styles.sessionHeaderCard}>
        <View style={styles.sessionBadgeRow}>
          <View style={styles.themeBadge}>
            <Text style={styles.themeBadgeText}>SÉANCE N°48 · TRANSITION & FINITION</Text>
          </View>
          <View style={styles.rpeBadge}>
            <Text style={styles.rpeBadgeText}>Intensité Ciblée : RPE 7.5/10</Text>
          </View>
        </View>

        <Text style={styles.sessionTitle}>Sortie de Balle Rapide & Attaque des Couloirs</Text>
        <Text style={styles.sessionSubtitle}>Mardi 19:30 · Terrain Synthétique 1 · Groupe Seniors 1</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Feather name="clock" size={14} color="#C5A059" />
            <Text style={styles.metaText}>{totalDuration} min au total</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="layers-outline" size={14} color="#0A84FF" />
            <Text style={styles.metaText}>{exercises.length} ateliers planifiés</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="account-group-outline" size={14} color="#30D158" />
            <Text style={styles.metaText}>18 Joueurs attendus</Text>
          </View>
        </View>
      </View>

      {/* 2. AI Custom Drill Generator Bar */}
      <View style={styles.aiGeneratorCard}>
        <View style={styles.aiGenHeader}>
          <MaterialCommunityIcons name="star-four-points" size={18} color="#C5A059" />
          <Text style={styles.aiGenTitle}>Générateur d’Ateliers IA sur Mesure</Text>
        </View>
        <Text style={styles.aiGenDesc}>
          Décrivez votre besoin technique ou tactique pour créer un atelier complet avec schéma vectoriel instantané :
        </Text>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.promptInput}
            placeholder="Ex : Sortie de balle sous pressing tout terrain 4v3..."
            placeholderTextColor="#636366"
            value={aiPrompt}
            onChangeText={setAiPrompt}
          />
          <TouchableOpacity
            style={[styles.generateBtn, isGenerating && styles.generateBtnLoading]}
            activeOpacity={0.8}
            onPress={generateCustomDrill}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator color="#000000" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="lightning-bolt" size={16} color="#000000" />
                <Text style={styles.generateBtnText}>Générer</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Drill Type Filter Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {(['all', 'rondo', 'finishing', 'circuit', 'possession', 'pressing'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.filterPill, selectedDrillType === type && styles.filterPillActive]}
            onPress={() => setSelectedDrillType(type)}
          >
            <Text style={[styles.filterPillText, selectedDrillType === type && styles.filterPillTextActive]}>
              {type === 'all'
                ? 'Tous les ateliers'
                : type === 'rondo'
                ? 'Rondos'
                : type === 'finishing'
                ? 'Finition'
                : type === 'circuit'
                ? 'Circuits'
                : type === 'possession'
                ? 'Possession'
                : 'Pressing'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 4. Timeline List of Exercises with Embedded Visual Schematics */}
      <Text style={styles.timelineHeader}>Déroulé Chronologique de la Séance</Text>

      {exercises
        .filter((ex) => selectedDrillType === 'all' || ex.drillType === selectedDrillType)
        .map((ex, idx) => {
          const isExpanded = expandedId === ex.id;

          return (
            <View key={ex.id} style={styles.exerciseCard}>
              <TouchableOpacity
                style={styles.exerciseTopRow}
                activeOpacity={0.8}
                onPress={() => setExpandedId(isExpanded ? null : ex.id)}
              >
                <View style={styles.exerciseIndexBadge}>
                  <Text style={styles.exerciseIndexText}>0{idx + 1}</Text>
                </View>
                <View style={styles.exerciseMainInfo}>
                  <Text style={styles.exerciseName}>{ex.name}</Text>
                  <View style={styles.exerciseTags}>
                    <Text style={styles.exerciseDuration}>{ex.durationMin} min</Text>
                    <Text style={styles.tagDot}>•</Text>
                    <Text
                      style={[
                        styles.exerciseIntensity,
                        ex.intensity === 'high'
                          ? { color: '#FF453A' }
                          : ex.intensity === 'medium'
                          ? { color: '#FF9F0A' }
                          : { color: '#30D158' },
                      ]}
                    >
                      Intensité {ex.intensity === 'high' ? 'Haute' : ex.intensity === 'medium' ? 'Moyenne' : 'Basse'}
                    </Text>
                  </View>
                </View>
                <Feather
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#8B8B9A"
                />
              </TouchableOpacity>

              {/* Collapsible Detail Section with Interactive Graphical Diagram */}
              {isExpanded && (
                <View style={styles.expandedSection}>
                  <View style={styles.objectiveBox}>
                    <Text style={styles.objectiveLabel}>Objectif pédagogique :</Text>
                    <Text style={styles.objectiveText}>{ex.objective}</Text>
                  </View>

                  {/* EMBEDDED GRAPHICAL DRILL SCHEMA */}
                  <CoachTrainingDrillDiagram
                    drillType={ex.drillType}
                    title={ex.name}
                    intensity={ex.intensity}
                  />

                  <View style={styles.instructionsBox}>
                    <Text style={styles.instructionsLabel}>Consignes & Règles d’animation :</Text>
                    <Text style={styles.instructionsText}>{ex.instructions}</Text>
                  </View>
                </View>
              )}
            </View>
          );
        })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sessionHeaderCard: {
    backgroundColor: '#141418',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    marginBottom: 14,
  },
  sessionBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  themeBadge: {
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  themeBadgeText: {
    color: '#C5A059',
    fontSize: 10,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  rpeBadge: {
    backgroundColor: 'rgba(255, 69, 58, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  rpeBadgeText: {
    color: '#FF453A',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  sessionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: '-apple-system',
    marginTop: 4,
  },
  sessionSubtitle: {
    color: '#8B8B9A',
    fontSize: 11,
    fontFamily: '-apple-system',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C22',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 10,
  },
  metaText: {
    color: '#E5E5EA',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  aiGeneratorCard: {
    backgroundColor: '#141418',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.25)',
    padding: 14,
    marginBottom: 14,
  },
  aiGenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  aiGenTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  aiGenDesc: {
    color: '#8B8B9A',
    fontSize: 11,
    fontFamily: '-apple-system',
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  promptInput: {
    flex: 1,
    backgroundColor: '#1C1C22',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: '-apple-system',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#C5A059',
    borderRadius: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  generateBtnLoading: {
    opacity: 0.7,
  },
  generateBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  filterPill: {
    backgroundColor: '#141418',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 6,
  },
  filterPillActive: {
    backgroundColor: '#1C1C22',
    borderColor: '#C5A059',
  },
  filterPillText: {
    color: '#8B8B9A',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  filterPillTextActive: {
    color: '#C5A059',
  },
  timelineHeader: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: '-apple-system',
    marginBottom: 10,
  },
  exerciseCard: {
    backgroundColor: '#141418',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    marginBottom: 10,
  },
  exerciseTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exerciseIndexBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1C1C22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseIndexText: {
    color: '#C5A059',
    fontSize: 12,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  exerciseMainInfo: {
    flex: 1,
  },
  exerciseName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  exerciseTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  exerciseDuration: {
    color: '#8B8B9A',
    fontSize: 11,
    fontFamily: '-apple-system',
  },
  tagDot: {
    color: '#636366',
    fontSize: 10,
  },
  exerciseIntensity: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  expandedSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  objectiveBox: {
    marginBottom: 10,
  },
  objectiveLabel: {
    color: '#C5A059',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: '-apple-system',
    marginBottom: 2,
  },
  objectiveText: {
    color: '#D1D1D6',
    fontSize: 12,
    lineHeight: 16,
    fontFamily: '-apple-system',
  },
  instructionsBox: {
    marginTop: 10,
  },
  instructionsLabel: {
    color: '#8B8B9A',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: '-apple-system',
    marginBottom: 2,
  },
  instructionsText: {
    color: '#D1D1D6',
    fontSize: 11,
    lineHeight: 16,
    fontFamily: '-apple-system',
  },
});
