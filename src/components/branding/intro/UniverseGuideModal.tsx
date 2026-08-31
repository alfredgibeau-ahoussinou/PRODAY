import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
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

interface PoleGuideItem {
  id: CarouselPoleId;
  title: string;
  badge: string;
  icon: IconName;
  forWhom: string;
  highlights: string[];
}

const POLE_GUIDES: PoleGuideItem[] = [
  {
    id: 'joueur',
    title: 'Pôle Joueur & Joueuse',
    badge: 'Carrière & Stats',
    icon: 'football',
    forWhom: 'Footballeurs amateurs, semi-pro et professionnels',
    highlights: [
      'CV sportif digital & vidéos de vos highlights',
      'Suivi de vos statistiques de match en temps réel',
      'Visibilité pour les détections de clubs et recruteurs',
      'Assistant IA d’entraînement individuel à domicile',
    ],
  },
  {
    id: 'coach',
    title: 'Pôle Coach & Staff',
    badge: 'Tactique & Équipe',
    icon: 'school',
    forWhom: 'Entraîneurs, adjoints, préparateurs et analystes',
    highlights: [
      'Créateur de séances d’entraînement IA (dont mode Blood Bath)',
      'Gestion des effectifs, convocations et fiches de match',
      'Compositions tactiques interactives sur terrain',
      'Analyse vidéo et retour de performance pour vos joueurs',
    ],
  },
  {
    id: 'pro_club',
    title: 'Pôle Club & Dirigeants',
    badge: 'Administration & Organisation',
    icon: 'business',
    forWhom: 'Présidents, directeurs sportifs, secrétaires de club',
    highlights: [
      'Pilotage complet des équipes (U7 à Seniors)',
      'Organisation de tournois avec poules & calendriers auto',
      'Suivi des licences, adhésions et documents médicaux',
      'Automatisation des alertes matchs, entraînements et covoiturage',
    ],
  },
  {
    id: 'sponsor',
    title: 'Pôle Sponsor & Partenaire',
    badge: 'Visibilité & Sponsoring',
    icon: 'gift',
    forWhom: 'Entreprises, commerces locaux et marques partenaires',
    highlights: [
      'Mise en avant sur les maillots, panneaux de stade et app',
      'Packages de sponsoring personnalisés (Titre, Or, Argent)',
      'Accès direct aux clubs pour booster votre notoriété locale',
      'Déduction fiscale et reçus de mécénat simplifiés',
    ],
  },
  {
    id: 'parent',
    title: 'Pôle Famille & Parents',
    badge: 'Espace Sécurisé',
    icon: 'people',
    forWhom: 'Parents et tuteurs de jeunes joueurs mineurs',
    highlights: [
      'Suivi en direct des convocations, horaires et lieux de match',
      'Organisation du covoiturage entre parents de l’équipe',
      'Contrôle parental et autorisations de sortie simplifiées',
      'Messagerie directe sécurisée avec le coach du club',
    ],
  },
  {
    id: 'supporter',
    title: 'Pôle Supporter & Fans',
    badge: 'Communauté & Live',
    icon: 'trophy',
    forWhom: 'Fans, passionnés de football et communauté',
    highlights: [
      'Suivi des scores et temps forts de vos équipes favorites',
      'Votes pour le joueur du match (MVP) et pronostics',
      'Accès aux vidéos et moments forts exclusifs',
      'Boutique officielle et goodies club',
    ],
  },
];

export const UniverseGuideModal: React.FC<UniverseGuideModalProps> = ({
  visible,
  onClose,
  onSelectPole,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Guide des Univers ProDay</Text>
              <Text style={styles.subtitle}>
                Trouvez le pôle adapté à vos besoins sur le terrain
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityLabel="Fermer le guide"
              accessibilityRole="button"
            >
              <Icon name="close" size={20} color="#FFFFFF" />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {POLE_GUIDES.map((pole) => {
              const accent = UNIVERSE_ACCENT[pole.id] || '#C5A059';
              return (
                <PressableSpring
                  key={pole.id}
                  onPress={() => {
                    onClose();
                    onSelectPole(pole.id);
                  }}
                  scaleTo={0.98}
                  haptic
                  style={[styles.card, { borderColor: `${accent}40` }]}
                >
                  <View style={styles.cardHeader}>
                    <View
                      style={[styles.iconWrap, { backgroundColor: `${accent}25` }]}
                    >
                      <Icon name={pole.icon} size={20} color={accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.cardTitleRow}>
                        <Text style={styles.cardTitle}>{pole.title}</Text>
                        <View
                          style={[
                            styles.badge,
                            { backgroundColor: `${accent}20`, borderColor: `${accent}50` },
                          ]}
                        >
                          <Text style={[styles.badgeText, { color: accent }]}>
                            {pole.badge}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.forWhom}>{pole.forWhom}</Text>
                    </View>
                  </View>

                  <View style={styles.highlightsList}>
                    {pole.highlights.map((h, i) => (
                      <View key={i} style={styles.highlightRow}>
                        <Icon name="checkmark-circle" size={14} color={accent} />
                        <Text style={styles.highlightText}>{h}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={[styles.cardAction, { borderTopColor: 'rgba(255,255,255,0.06)' }]}>
                    <Text style={[styles.actionText, { color: accent }]}>
                      Choisir cet univers →
                    </Text>
                  </View>
                </PressableSpring>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  sheet: {
    height: '88%',
    backgroundColor: '#090D16',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  forWhom: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  highlightsList: {
    gap: 6,
    marginVertical: 4,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  highlightText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    flex: 1,
    lineHeight: 18,
  },
  cardAction: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    alignItems: 'flex-end',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
