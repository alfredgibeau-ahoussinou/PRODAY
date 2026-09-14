import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { useAuth } from '../../context/AuthContext';
import { GlobalSearchBar } from '../../components/search/GlobalSearchBar';
import { useUnreadMessageCount } from '../../hooks/useUnreadMessages';
import { VeoVideoHubScreen } from '../veo/VeoVideoHubScreen';
import { NotificationsScreen } from '../NotificationsScreen';
import { ChooseAppSpaceModal } from '../../components/appSpace/ChooseAppSpaceModal';

interface MenuItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  action: () => void;
  badge?: string | number;
  highlight?: boolean;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export const ProDayMenuScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const profile = useSessionProfile();
  const tabNav = useTabNavigation();
  const { signOut } = useAuth();
  const { count: unreadMessages } = useUnreadMessageCount();
  const [showVeoHub, setShowVeoHub] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSpaceModal, setShowSpaceModal] = useState(false);

  const role = profile?.role || 'player';

  // Navigation handlers
  const openTab = (tab: any) => tabNav?.setActiveTab(tab);
  const openVeo = () => setShowVeoHub(true);
  const openMessages = () => tabNav?.setActiveTab('messages');
  const openCarpool = () => tabNav?.setActiveTab('covoiturage');
  const openSettings = () => tabNav?.setActiveTab('profil');

  // Build sections according to Section 0.2 specification
  const getSections = (): MenuSection[] => {
    if (role === 'coach') {
      return [
        {
          title: 'Terrain',
          items: [
            {
              id: 'trainings',
              title: "Séances d'entraînement",
              subtitle: 'Préparer et animer les séances',
              icon: 'fitness',
              action: () => openTab('home'),
            },
            {
              id: 'tactics',
              title: 'Tactique 6 Étapes',
              subtitle: 'Schéma de jeu dynamique & composition',
              icon: 'grid',
              action: () => tabNav?.openDashboard?.('smart_tactics'),
              highlight: true,
            },
            {
              id: 'scouting',
              title: 'Scouting vocal & Notes',
              subtitle: 'Observations de match en direct',
              icon: 'mic',
              action: () => tabNav?.openDashboard?.('train_coach'),
            },
            {
              id: 'convocations',
              title: 'Convocations',
              subtitle: 'Envoyer et suivre les réponses',
              icon: 'mail',
              action: () => openTab('matchs'),
            },
            {
              id: 'evaluations',
              title: 'Évaluation des joueurs',
              subtitle: 'Notation post-match et axes de travail',
              icon: 'star',
              action: () => openTab('home'),
            },
            {
              id: 'veo',
              title: 'Vidéo VEO',
              subtitle: 'Direct et replays de la caméra Veo',
              icon: 'videocam',
              action: openVeo,
              highlight: true,
            },
            {
              id: 'live_score',
              title: 'Score en direct & résultats',
              subtitle: 'Saisie instantanée au bord du terrain',
              icon: 'football',
              action: () => openTab('matchs'),
            },
            {
              id: 'standings',
              title: 'Classements officiels',
              subtitle: 'Poule, points et calendrier',
              icon: 'trophy',
              action: () => openTab('matchs'),
            },
          ],
        },
        {
          title: 'Équipe',
          items: [
            {
              id: 'squad',
              title: 'Effectif complet',
              subtitle: 'Fiches joueurs et suivi des présences',
              icon: 'people',
              action: () => tabNav?.openDashboard?.('gestion'),
            },
            {
              id: 'messages',
              title: 'Messagerie & Vestiaire',
              subtitle: 'Échanges équipe, parents et staff',
              icon: 'chatbubbles',
              badge: unreadMessages > 0 ? unreadMessages : undefined,
              action: openMessages,
            },
            {
              id: 'carpool',
              title: 'Covoiturage',
              subtitle: 'Organisation des trajets de match',
              icon: 'car',
              action: openCarpool,
            },
          ],
        },
        {
          title: 'Mon compte',
          items: [
            {
              id: 'notifications',
              title: 'Notifications',
              icon: 'notifications',
              action: () => setShowNotifications(true),
            },
            {
              id: 'settings',
              title: 'Paramètres du compte',
              icon: 'settings',
              action: openSettings,
            },
            {
              id: 'switch_space',
              title: 'Choisir mon espace',
              subtitle: 'Comptes multi-rôles & espaces ProDay',
              icon: 'swap-horizontal',
              action: () => setShowSpaceModal(true),
            },
            {
              id: 'logout',
              title: 'Déconnexion',
              icon: 'log-out-outline',
              action: () => {
                Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
                  { text: 'Annuler', style: 'cancel' },
                  { text: 'Déconnexion', style: 'destructive', onPress: () => void signOut() },
                ]);
              },
            },
          ],
        },
      ];
    }

    if (role === 'club') {
      return [
        {
          title: 'Gestion',
          items: [
            {
              id: 'rosters',
              title: 'Effectifs multi-équipes',
              subtitle: 'Gestion globale des catégories et import PDF',
              icon: 'layers',
              action: () => tabNav?.openDashboard?.('gestion'),
            },
            {
              id: 'finance',
              title: 'Cockpit financier',
              subtitle: 'Recouvrement des cotisations et paiements',
              icon: 'cash',
              action: () => openTab('home'),
              highlight: true,
            },
            {
              id: 'club_settings',
              title: 'Paramètres club (Connexions VEO)',
              subtitle: 'Configuration du club, licences et matériel',
              icon: 'construct',
              action: openVeo,
            },
          ],
        },
        {
          title: 'Sportif',
          items: [
            {
              id: 'trainings_followup',
              title: 'Suivi des entraînements',
              subtitle: 'Séances et régularité des équipes',
              icon: 'calendar',
              action: () => openTab('home'),
            },
            {
              id: 'technical_overview',
              title: 'Suivi technique global',
              subtitle: 'Indicateurs d’adhésion sportive',
              icon: 'stats-chart',
              action: () => openTab('home'),
            },
            {
              id: 'live_scores',
              title: 'Score en direct & résultats',
              subtitle: 'Suivi temps réel des matchs',
              icon: 'football',
              action: () => openTab('matchs'),
            },
            {
              id: 'friendly_matches',
              title: 'Vrais matchs amicaux',
              subtitle: 'Organisation et recherche d’adversaires',
              icon: 'people',
              action: () => openTab('recrutement'),
              highlight: true,
            },
            {
              id: 'standings',
              title: 'Classements officiels',
              subtitle: 'Mise à jour et repli manuel',
              icon: 'trophy',
              action: () => openTab('matchs'),
            },
            {
              id: 'veo_club',
              title: 'Vidéo VEO du club',
              subtitle: 'Diffusions autorisées & replays',
              icon: 'videocam',
              action: openVeo,
              highlight: true,
            },
          ],
        },
        {
          title: 'Communication & Compte',
          items: [
            {
              id: 'messages',
              title: 'Messagerie officielle',
              subtitle: 'Canaux d’équipe, annonces et DM',
              icon: 'chatbubbles',
              badge: unreadMessages > 0 ? unreadMessages : undefined,
              action: openMessages,
            },
            {
              id: 'notifications',
              title: 'Notifications',
              icon: 'notifications',
              action: () => setShowNotifications(true),
            },
            {
              id: 'switch_space',
              title: 'Choisir mon espace',
              subtitle: 'Comptes multi-rôles & espaces ProDay',
              icon: 'swap-horizontal',
              action: () => setShowSpaceModal(true),
            },
            {
              id: 'logout',
              title: 'Déconnexion',
              icon: 'log-out-outline',
              action: () => {
                Alert.alert('Déconnexion', 'Confirmer la déconnexion ?', [
                  { text: 'Annuler', style: 'cancel' },
                  { text: 'Déconnexion', style: 'destructive', onPress: () => void signOut() },
                ]);
              },
            },
          ],
        },
      ];
    }

    // Pôle Joueur par défaut
    return [
      {
        title: 'Mon activité',
        items: [
          {
            id: 'my_card',
            title: 'Ma Carte Joueur',
            subtitle: 'Carte gamifiée & statistiques complètes Sofascore',
            icon: 'card',
            action: () => openTab('profil'),
            highlight: true,
          },
          {
            id: 'calendar',
            title: 'Calendrier & Convocations',
            subtitle: 'Événements, matchs et réponses RSVP',
            icon: 'calendar',
            action: () => openTab('matchs'),
          },
          {
            id: 'ai_coaching',
            title: 'Coaching IA',
            subtitle: 'Conseils personnalisés entre les séances',
            icon: 'sparkles',
            action: () => tabNav?.openDashboard?.('train_ai'),
          },
          {
            id: 'veo_player',
            title: 'Vidéo VEO',
            subtitle: 'Diffusions en direct et replays autorisés',
            icon: 'videocam',
            action: openVeo,
            highlight: true,
          },
        ],
      },
      {
        title: 'Vie du club',
        items: [
          {
            id: 'messages',
            title: 'Messagerie Vestiaire & DM',
            subtitle: 'Échanges d’équipe et directs',
            icon: 'chatbubbles',
            badge: unreadMessages > 0 ? unreadMessages : undefined,
            action: openMessages,
          },
          {
            id: 'carpool',
            title: 'Covoiturage',
            subtitle: 'Proposer ou trouver un trajet',
            icon: 'car',
            action: openCarpool,
          },
          {
            id: 'notifications',
            title: 'Notifications',
            subtitle: 'Alertes convocation et résultats',
            icon: 'notifications',
            action: () => setShowNotifications(true),
          },
        ],
      },
      {
        title: 'Mon compte',
        items: [
          {
            id: 'settings',
            title: 'Paramètres du compte',
            icon: 'settings',
            action: openSettings,
          },
          {
            id: 'switch_space',
            title: 'Choisir mon espace',
            subtitle: 'Comptes multi-rôles & pôle Suivi parent',
            icon: 'swap-horizontal',
            action: () => setShowSpaceModal(true),
          },
          {
            id: 'logout',
            title: 'Déconnexion',
            icon: 'log-out-outline',
            action: () => {
              Alert.alert('Déconnexion', 'Confirmer la déconnexion ?', [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Déconnexion', style: 'destructive', onPress: () => void signOut() },
              ]);
            },
          },
        ],
      },
    ];
  };

  const sections = getSections();

  if (showVeoHub) {
    return <VeoVideoHubScreen onBack={() => setShowVeoHub(false)} />;
  }

  if (showNotifications) {
    return <NotificationsScreen onBack={() => setShowNotifications(false)} />;
  }

  return (
    <View style={[styles.root, { paddingTop: Math.max(insets.top, 12) }]}>
      {/* En-tête avec Recherche Globale en tête */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Menu ProDay</Text>
        <Text style={styles.headerSubtitle}>
          Tous les modules et fonctionnalités
        </Text>
        <View style={styles.searchWrap}>
          <GlobalSearchBar placeholder="Rechercher une personne, une équipe, un module…" />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollBody}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((sec, secIdx) => (
          <View key={`sec-${secIdx}`} style={styles.sectionWrap}>
            <Text style={styles.sectionHeading}>{sec.title}</Text>
            <View style={styles.sectionCard}>
              {sec.items.map((item, itemIdx) => {
                const isLast = itemIdx === sec.items.length - 1;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.menuRow, !isLast && styles.menuRowBorder]}
                    onPress={item.action}
                    activeOpacity={0.75}
                  >
                    <View
                      style={[
                        styles.iconBox,
                        item.highlight && styles.iconBoxHighlight,
                      ]}
                    >
                      <Ionicons
                        name={item.icon}
                        size={18}
                        color={item.highlight ? '#000000' : '#0F172A'}
                      />
                    </View>

                    <View style={styles.rowDetails}>
                      <Text style={styles.rowTitle}>{item.title}</Text>
                      {item.subtitle ? (
                        <Text style={styles.rowSubtitle} numberOfLines={1}>
                          {item.subtitle}
                        </Text>
                      ) : null}
                    </View>

                    {item.badge ? (
                      <View style={styles.badgeWrap}>
                        <Text style={styles.badgeText}>{item.badge}</Text>
                      </View>
                    ) : null}

                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#94A3B8"
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      <ChooseAppSpaceModal
        visible={showSpaceModal}
        onClose={() => setShowSpaceModal(false)}
        onOpenAuth={() => tabNav?.openAuth?.('login')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 10,
  },
  searchWrap: {
    marginTop: 4,
  },
  scrollBody: {
    padding: 16,
    paddingBottom: 80,
  },
  sectionWrap: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBoxHighlight: {
    backgroundColor: '#00F59B',
  },
  rowDetails: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  rowSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  badgeWrap: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
});
