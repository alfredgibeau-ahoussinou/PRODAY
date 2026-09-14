import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
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
import { ProfileScreen } from '../ProfileScreen';
import { ParentSettingsScreen } from '../parent/ParentSettingsScreen';
import { FITNESS_PARK, FITNESS_PARK_RADIUS } from '../../theme/fitnessParkTheme';

interface MenuItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  action: () => void;
  badge?: string | number;
  highlight?: boolean;
  destructive?: boolean;
}

interface MenuSection {
  title?: string;
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
  const [showSettings, setShowSettings] = useState(false);

  const role = profile?.role || 'player';
  const isPlayer = role === 'player';

  // Navigation handlers
  const openTab = (tab: any) => tabNav?.setActiveTab(tab);
  const openVeo = () => setShowVeoHub(true);
  const openMessages = () => tabNav?.setActiveTab('messages');
  const openCarpool = () => tabNav?.setActiveTab('covoiturage');
  const openSettings = () => setShowSettings(true);

  const handleRateApp = () => {
    Alert.alert('Noter ProDay', 'Merci pour votre soutien ! Vous allez être redirigé vers l’App Store.', [
      { text: 'Plus tard', style: 'cancel' },
      { text: 'Noter', onPress: () => {} },
    ]);
  };

  const handleFaq = () => {
    Alert.alert('Support & FAQ', 'Besoin d’aide ? Contactez support@proday.com ou consultez la documentation club.', [
      { text: 'Fermer', style: 'cancel' },
    ]);
  };

  const handleContact = () => {
    void Linking.openURL('mailto:support@proday.com?subject=Contact%20ProDay');
  };

  const handleReportBug = () => {
    Alert.alert('Signaler un problème', 'Un formulaire de rapport va s’ouvrir pour transmettre les détails aux équipes techniques.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Signaler', onPress: () => {} },
    ]);
  };

  // Build sections according to Fitness Park grouped cards
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
              destructive: true,
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
              destructive: true,
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

    // Pôle Joueur Officiel Fitness Park (Image 1)
    return [
      // Bloc 1: Profil & Activité
      {
        items: [
          {
            id: 'personal_info',
            title: 'Informations personnelles',
            icon: 'person-outline',
            action: openSettings,
          },
          {
            id: 'my_card',
            title: 'Ma Carte Joueur & Profil',
            icon: 'card-outline',
            action: () => openTab('profil'),
          },
          {
            id: 'change_password',
            title: 'Changer de mot de passe',
            icon: 'lock-closed-outline',
            action: openSettings,
          },
        ],
      },
      // Bloc 2: Abonnement & Paiements
      {
        items: [
          {
            id: 'subscription',
            title: 'Licence & Cotisation',
            icon: 'ribbon-outline',
            action: openSettings,
          },
          {
            id: 'invoices',
            title: 'Paiements et factures',
            icon: 'receipt-outline',
            action: openSettings,
          },
          {
            id: 'veo_hub',
            title: 'Vidéo VEO & Replays',
            icon: 'videocam-outline',
            action: openVeo,
          },
        ],
      },
      // Bloc 3: Assistance & Application
      {
        items: [
          {
            id: 'rate_app',
            title: "Noter l'application",
            icon: 'star-outline',
            action: handleRateApp,
          },
          {
            id: 'faq',
            title: 'Consulter la FAQ',
            icon: 'help-circle-outline',
            action: handleFaq,
          },
          {
            id: 'contact',
            title: 'Nous contacter',
            icon: 'chatbubble-ellipses-outline',
            action: handleContact,
          },
          {
            id: 'report_issue',
            title: 'Signaler un problème',
            icon: 'alert-circle-outline',
            action: handleReportBug,
          },
        ],
      },
      // Bloc 4: Espace & Déconnexion
      {
        items: [
          {
            id: 'switch_space',
            title: 'Choisir mon espace',
            icon: 'swap-horizontal-outline',
            action: () => setShowSpaceModal(true),
          },
          {
            id: 'logout',
            title: 'Déconnexion',
            icon: 'log-out-outline',
            destructive: true,
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

  if (showSettings) {
    if (role === 'parent') {
      return (
        <View style={{ flex: 1, backgroundColor: FITNESS_PARK.bg, paddingTop: Math.max(insets.top, 12) }}>
          <View style={{ paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: FITNESS_PARK.divider, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity onPress={() => setShowSettings(false)}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFFFFF' }}>Paramètres du compte</Text>
          </View>
          <ParentSettingsScreen onSignOut={signOut} />
        </View>
      );
    }
    return (
      <View style={{ flex: 1, backgroundColor: FITNESS_PARK.bg, paddingTop: Math.max(insets.top, 12) }}>
        <View style={{ paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: FITNESS_PARK.divider, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => setShowSettings(false)}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFFFFF' }}>Paramètres du compte</Text>
        </View>
        {profile ? (
          <ProfileScreen
            profile={profile}
            onRefresh={async () => {}}
            onSignOut={async () => { void signOut(); }}
          />
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: Math.max(insets.top, 12) }]}>
      {/* En-tête « Moi » Officiel Fitness Park */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{isPlayer ? 'Moi' : 'Menu ProDay'}</Text>
        <Text style={styles.headerSubtitle}>
          {profile?.display_name || 'Profil sportif'} • {profile?.profile?.category || 'Seniors R2'}
        </Text>
        <View style={styles.searchWrap}>
          <GlobalSearchBar placeholder="Rechercher une rubrique, un module…" />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollBody}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((sec, secIdx) => (
          <View key={`sec-${secIdx}`} style={styles.sectionWrap}>
            {sec.title ? (
              <Text style={styles.sectionHeading}>{sec.title}</Text>
            ) : null}
            <View style={styles.sectionCard}>
              {sec.items.map((item, itemIdx) => {
                const isLast = itemIdx === sec.items.length - 1;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.menuRow, !isLast && styles.menuRowBorder]}
                    onPress={item.action}
                    activeOpacity={0.7}
                  >
                    <View style={styles.iconBox}>
                      <Ionicons
                        name={item.icon}
                        size={20}
                        color={item.destructive ? '#EF4444' : '#CBD5E1'}
                      />
                    </View>

                    <View style={styles.rowDetails}>
                      <Text
                        style={[
                          styles.rowTitle,
                          item.destructive && styles.rowTitleDestructive,
                        ]}
                      >
                        {item.title}
                      </Text>
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
                      size={18}
                      color="#64748B"
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
    backgroundColor: FITNESS_PARK.bg,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: FITNESS_PARK.bg,
    borderBottomWidth: 1,
    borderBottomColor: FITNESS_PARK.divider,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
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
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: FITNESS_PARK.surface,
    borderRadius: FITNESS_PARK_RADIUS.card,
    borderWidth: 1,
    borderColor: FITNESS_PARK.border,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: FITNESS_PARK.divider,
  },
  iconBox: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowDetails: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  rowTitleDestructive: {
    color: '#EF4444',
  },
  rowSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
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
