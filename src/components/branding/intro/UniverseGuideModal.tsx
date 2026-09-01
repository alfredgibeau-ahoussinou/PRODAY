import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { Icon, type IconName } from '../../ui/Icon';
import { PressableSpring } from '../../motion';
import { UNIVERSE_ACCENT } from './universeIntroAccents';
import type { CarouselPoleId } from '../../../models/CarouselPole';

interface UniverseGuideModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPole: (pole: CarouselPoleId) => void;
}

interface QuizOption {
  id: CarouselPoleId;
  icon: IconName;
  label: string;
  roleDescription: string;
  matchReason: string;
  highlights: string[];
}

const QUIZ_OPTIONS: QuizOption[] = [
  {
    id: 'joueur',
    icon: 'football',
    label: 'Joueur ou Joueuse',
    roleDescription: 'Amateur, semi-pro, jeune talent ou pro',
    matchReason: 'Optimisé pour révéler votre potentiel et booster votre carrière.',
    highlights: [
      'CV sportif digital & vidéos de vos highlights',
      'Suivi de vos statistiques et notes de match',
      'Visibilité pour les détections de clubs et recruteurs',
      'Assistant d’entraînement individuel avec IA',
    ],
  },
  {
    id: 'coach',
    icon: 'school',
    label: 'Coach, Entraîneur ou Staff',
    roleDescription: 'Coach principal, adjoint, préparateur physique',
    matchReason: 'Parfait pour concevoir vos séances et piloter votre groupe.',
    highlights: [
      'Créateur de séances d’entraînement avec l’IA ProDay',
      'Tableau tactique interactif & compositions d’équipe',
      'Gestion des effectifs, convocations et fiches de match',
      'Analyses vidéo et suivi de la charge d’entraînement',
    ],
  },
  {
    id: 'pro_club',
    icon: 'business',
    label: 'Club ou Dirigeant',
    roleDescription: 'Président, directeur sportif, responsable de club',
    matchReason: 'La suite complète pour administrer et faire grandir votre club.',
    highlights: [
      'Gestion globale de toutes vos catégories (U7 à Seniors)',
      'Organisation de tournois en direct avec poules auto',
      'Suivi des licences, cotisations et documents officiels',
      'Communication club et alertes covoiturage automatiques',
    ],
  },
  {
    id: 'parent',
    icon: 'people',
    label: 'Parent ou Tuteur',
    roleDescription: 'Parent d’un jeune joueur ou d’une jeune joueuse',
    matchReason: 'Espace sécurisé pour accompagner votre enfant en toute sérénité.',
    highlights: [
      'Suivi des convocations, horaires et lieux en temps réel',
      'Organisation du covoiturage entre parents de l’équipe',
      'Messagerie directe et sécurisée avec le coach',
      'Autorisations parentales simplifiées en un clic',
    ],
  },
  {
    id: 'supporter',
    icon: 'trophy',
    label: 'Supporter ou Fan de foot',
    roleDescription: 'Passionné, bénévole ou membre de la communauté',
    matchReason: 'Vivez le football local et vibrez avec votre équipe préférée.',
    highlights: [
      'Scores en direct, calendriers et classements des championnats',
      'Reels vidéo des plus beaux buts et actions de la saison',
      'Vote du joueur du match (MVP) et sondages officiels',
      'Accès gratuit à la tribune et actualités du club',
    ],
  },
  {
    id: 'sponsor',
    icon: 'gift',
    label: 'Entreprise ou Partenaire',
    roleDescription: 'Marque, commerce local, sponsor ou mécène',
    matchReason: 'Maximisez votre visibilité et soutenez le sport sur votre territoire.',
    highlights: [
      'Mise en avant sur les maillots, panneaux stade et app',
      'Packages de sponsoring sur-mesure (Titre, Or, Argent)',
      'Déductions fiscales et reçus de mécénat dématérialisés',
      'Réseautage B2B avec les autres partenaires du club',
    ],
  },
  {
    id: 'admin',
    icon: 'shield',
    label: 'Admin Fondateurs',
    roleDescription: 'Fondateur ou administrateur exécutif de la plateforme',
    matchReason: 'Cockpit de pilotage stratégique et gouvernance globale.',
    highlights: [
      'Centre de surveillance des systèmes et serveurs cloud',
      'Pilotage du moteur IA Google Gemini & Blood Bath',
      'Validation des vérifications d’identité et transactions',
      'Gestion des autorisations et accès prioritaires',
    ],
  },
];

/**
 * Mini Pop-up Quiz & Guide des univers — interactif, clair et très visible.
 */
export const UniverseGuideModal: React.FC<UniverseGuideModalProps> = ({
  visible,
  onClose,
  onSelectPole,
}) => {
  const [selectedResult, setSelectedResult] = useState<QuizOption | null>(null);
  const [viewMode, setViewMode] = useState<'quiz' | 'all'>('quiz');

  const handleSelectQuizChoice = (option: QuizOption) => {
    setSelectedResult(option);
  };

  const handleConfirmPole = (poleId: CarouselPoleId) => {
    onClose();
    onSelectPole(poleId);
  };

  const resetQuiz = () => {
    setSelectedResult(null);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header Pop-up */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.kickerBadge}>
                <Text style={styles.kickerText}>ORIENTATION EXPRESS</Text>
              </View>
              <Text style={styles.title}>Quel pôle est fait pour vous ?</Text>
              <Text style={styles.subtitle}>
                Répondez en 1 clic pour être dirigé vers le bon univers
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={12}
              accessibilityLabel="Fermer le guide"
              accessibilityRole="button"
            >
              <Icon name="close" size={18} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Mode Switcher : Quiz vs Tous les Pôles */}
          <View style={styles.switchTabs}>
            <Pressable
              onPress={() => {
                setViewMode('quiz');
                resetQuiz();
              }}
              style={[styles.switchTab, viewMode === 'quiz' && styles.switchTabActive]}
            >
              <Text
                style={[
                  styles.switchTabText,
                  viewMode === 'quiz' && styles.switchTabTextActive,
                ]}
              >
                🎯 Quiz Express
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setViewMode('all')}
              style={[styles.switchTab, viewMode === 'all' && styles.switchTabActive]}
            >
              <Text
                style={[
                  styles.switchTabText,
                  viewMode === 'all' && styles.switchTabTextActive,
                ]}
              >
                📖 Tous les Pôles (8)
              </Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {viewMode === 'quiz' ? (
              selectedResult ? (
                /* Écran Résultat Recommandé */
                <View style={styles.resultCard}>
                  <View style={styles.affinityBadge}>
                    <Text style={styles.affinityText}>⭐ RECOMMANDÉ POUR VOUS (100% MATCH)</Text>
                  </View>

                  <View style={styles.resultHeader}>
                    <View
                      style={[
                        styles.resultIconWrap,
                        {
                          backgroundColor: `${
                            UNIVERSE_ACCENT[selectedResult.id] || '#F5D04A'
                          }25`,
                        },
                      ]}
                    >
                      <Icon
                        name={selectedResult.icon}
                        size={28}
                        color={UNIVERSE_ACCENT[selectedResult.id] || '#F5D04A'}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.resultTitle}>{selectedResult.label}</Text>
                      <Text style={styles.resultSub}>{selectedResult.matchReason}</Text>
                    </View>
                  </View>

                  <View style={styles.highlightsList}>
                    {selectedResult.highlights.map((h, idx) => (
                      <View key={idx} style={styles.highlightRow}>
                        <Icon
                          name="checkmark-circle"
                          size={16}
                          color={UNIVERSE_ACCENT[selectedResult.id] || '#F5D04A'}
                        />
                        <Text style={styles.highlightText}>{h}</Text>
                      </View>
                    ))}
                  </View>

                  <PressableSpring
                    onPress={() => handleConfirmPole(selectedResult.id)}
                    scaleTo={0.97}
                    haptic
                    style={[
                      styles.confirmBtn,
                      {
                        backgroundColor:
                          UNIVERSE_ACCENT[selectedResult.id] || '#F5D04A',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.confirmBtnText,
                        {
                          color:
                            selectedResult.id === 'pro_club' ? '#FFFFFF' : '#000000',
                        },
                      ]}
                    >
                      Ouvrir l'espace {selectedResult.label} →
                    </Text>
                  </PressableSpring>

                  <Pressable onPress={resetQuiz} style={styles.retryBtn}>
                    <Text style={styles.retryText}>← Choisir un autre profil</Text>
                  </Pressable>
                </View>
              ) : (
                /* Questions du Quiz */
                <View style={styles.quizList}>
                  <Text style={styles.quizQuestion}>
                    👉 Cliquez sur votre profil principal :
                  </Text>
                  {QUIZ_OPTIONS.map((opt) => {
                    const accent = UNIVERSE_ACCENT[opt.id] || '#F5D04A';
                    return (
                      <PressableSpring
                        key={opt.id}
                        onPress={() => handleSelectQuizChoice(opt)}
                        scaleTo={0.98}
                        haptic
                        style={styles.quizOptionCard}
                      >
                        <View
                          style={[
                            styles.quizOptionIcon,
                            { backgroundColor: `${accent}20` },
                          ]}
                        >
                          <Icon name={opt.icon} size={22} color={accent} />
                        </View>
                        <View style={styles.quizOptionContent}>
                          <Text style={styles.quizOptionTitle}>{opt.label}</Text>
                          <Text style={styles.quizOptionSub}>
                            {opt.roleDescription}
                          </Text>
                        </View>
                        <Icon
                          name="chevron-forward"
                          size={18}
                          color="rgba(255, 255, 255, 0.4)"
                        />
                      </PressableSpring>
                    );
                  })}
                </View>
              )
            ) : (
              /* Liste complète des 8 pôles */
              <View style={styles.allPolesList}>
                {QUIZ_OPTIONS.map((pole) => {
                  const accent = UNIVERSE_ACCENT[pole.id] || '#F5D04A';
                  return (
                    <PressableSpring
                      key={pole.id}
                      onPress={() => handleConfirmPole(pole.id)}
                      scaleTo={0.98}
                      haptic
                      style={[styles.allPoleCard, { borderColor: `${accent}40` }]}
                    >
                      <View style={styles.allPoleHeader}>
                        <View
                          style={[
                            styles.allPoleIconWrap,
                            { backgroundColor: `${accent}20` },
                          ]}
                        >
                          <Icon name={pole.icon} size={20} color={accent} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.allPoleTitle}>{pole.label}</Text>
                          <Text style={styles.allPoleSub}>
                            {pole.roleDescription}
                          </Text>
                        </View>
                        <Text style={[styles.allPoleAction, { color: accent }]}>
                          Choisir →
                        </Text>
                      </View>
                    </PressableSpring>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0F1210',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerLeft: {
    flex: 1,
    paddingRight: 12,
  },
  kickerBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#F5D04A',
    marginBottom: 6,
  },
  kickerText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchTabs: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  switchTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  switchTabActive: {
    backgroundColor: 'rgba(245, 208, 74, 0.15)',
    borderColor: '#F5D04A',
  },
  switchTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  switchTabTextActive: {
    color: '#F5D04A',
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 12,
  },
  quizList: {
    gap: 10,
  },
  quizQuestion: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  quizOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
  },
  quizOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quizOptionContent: {
    flex: 1,
  },
  quizOptionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  quizOptionSub: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    marginTop: 2,
  },
  resultCard: {
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(245, 208, 74, 0.4)',
    padding: 16,
    gap: 14,
  },
  affinityBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(245, 208, 74, 0.2)',
    borderWidth: 1,
    borderColor: '#F5D04A',
  },
  affinityText: {
    color: '#F5D04A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resultIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  resultSub: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  highlightsList: {
    gap: 8,
    paddingVertical: 4,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  highlightText: {
    flex: 1,
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    lineHeight: 16,
  },
  confirmBtn: {
    paddingVertical: 13,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  retryBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  retryText: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 12,
    fontWeight: '600',
  },
  allPolesList: {
    gap: 8,
  },
  allPoleCard: {
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    padding: 12,
  },
  allPoleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  allPoleIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allPoleTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  allPoleSub: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
  },
  allPoleAction: {
    fontSize: 12,
    fontWeight: '700',
  },
});
