import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ProDayText } from '../ui/ProDayText';
import { useProductLine } from '../../context/ProductLineContext';
import { useAuth } from '../../context/AuthContext';
import { prodayHaptics } from '../../utils/prodayHaptics';
import type { ProductLineId } from '../../models/ProductLine';
import { spacing, radius } from '../../theme/designTokens';

export interface ChooseAppSpaceModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenAuth?: () => void;
}

interface SpaceOption {
  id: ProductLineId;
  title: string;
  subtitle: string;
  kicker: string;
  icon: keyof typeof Ionicons.glyphMap;
  accentColor: string;
  switchFn: (ctx: ReturnType<typeof useProductLine>) => Promise<void>;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Page 27 : Choix de rôle / Sélecteur 'Choisir mon espace' pour les comptes multi-rôles et pôle 'Suivi parent'.
 */
export const ChooseAppSpaceModal: React.FC<ChooseAppSpaceModalProps> = ({
  visible,
  onClose,
  onOpenAuth,
}) => {
  const plContext = useProductLine();
  const { profile } = useAuth();
  const currentLine = plContext.productLine;

  const spaces: SpaceOption[] = [
    {
      id: 'amateur',
      title: 'Espace Joueur',
      subtitle: 'Ma Carte FUT, stats du week-end, calendrier & convocations match.',
      kicker: 'TERRAIN & STATS',
      icon: 'football',
      accentColor: '#30D158',
      switchFn: (ctx) => ctx.enterAmateurSpace(),
    },
    {
      id: 'parent',
      title: 'Pôle Suivi Parent',
      subtitle: 'Supervision de l’enfant, agenda, contacts approuvés et covoiturage.',
      kicker: 'SUPERVISION & SÉCURITÉ',
      icon: 'shield-checkmark',
      accentColor: '#38BDF8',
      switchFn: (ctx) => ctx.enterParentSpace(),
    },
    {
      id: 'pro_staff',
      title: 'Espace Coach',
      subtitle: 'Tactique IA 6 étapes, préparation des séances et convocations d’équipe.',
      kicker: 'TACTIQUE & EFFECTIF',
      icon: 'clipboard',
      accentColor: '#FFD700',
      switchFn: (ctx) => ctx.enterProLine('pro_staff'),
    },
    {
      id: 'pro_club',
      title: 'Espace Club / Dirigeant',
      subtitle: 'Gestion multi-équipes, licences FFF, compétitions et cockpit financier.',
      kicker: 'DIRECTION SPORTIVE',
      icon: 'business',
      accentColor: '#BF5AF2',
      switchFn: (ctx) => ctx.enterProLine('pro_club'),
    },
    {
      id: 'supporter',
      title: 'Espace Supporter',
      subtitle: 'Matchs en direct, réels des clubs, tribune communautaire et actualités.',
      kicker: 'COMMUNAUTÉ FANS',
      icon: 'people',
      accentColor: '#FF9F0A',
      switchFn: (ctx) => ctx.enterSupporterSpace(),
    },
    {
      id: 'sponsor',
      title: 'Espace Partenaire / Sponsor',
      subtitle: 'Campagnes géolocalisées, visibilité maillot et retour sur investissement.',
      kicker: 'MARQUES & ENTREPRISES',
      icon: 'briefcase',
      accentColor: '#F43F5E',
      switchFn: (ctx) => ctx.enterSponsorSpace(),
    },
  ];

  const handleSelectSpace = async (space: SpaceOption) => {
    prodayHaptics.impactMedium();
    try {
      await space.switchFn(plContext);
      onClose();
    } catch {
      // Ignored
    }
  };

  const isCurrentActive = (spaceId: ProductLineId) => {
    if (spaceId === 'amateur') {
      return currentLine === 'amateur' || currentLine === 'homme' || currentLine === 'woman' || currentLine === 'pro_player';
    }
    if (spaceId === 'pro_staff') {
      return currentLine === 'pro_staff' || currentLine === 'pro';
    }
    return currentLine === spaceId;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleCol}>
              <View style={styles.badgeRow}>
                <Ionicons name="swap-horizontal" size={14} color="#30D158" />
                <Text style={styles.kickerText}>MULTI-ESPACES PRODAY</Text>
              </View>
              <Text style={styles.headerTitle}>Choisir mon espace</Text>
              <Text style={styles.headerSubtitle}>
                Bascule instantanément entre tes rôles et espaces dédiés.
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* List of Spaces */}
          <ScrollView
            style={styles.spacesScroll}
            contentContainerStyle={styles.spacesContent}
            showsVerticalScrollIndicator={false}
          >
            {spaces.map((space) => {
              const active = isCurrentActive(space.id);
              return (
                <TouchableOpacity
                  key={space.id}
                  style={[
                    styles.spaceCard,
                    active && [styles.spaceCardActive, { borderColor: `${space.accentColor}60` }],
                  ]}
                  onPress={() => handleSelectSpace(space)}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={active ? [`${space.accentColor}18`, 'transparent'] : ['transparent', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                    pointerEvents="none"
                  />
                  <View style={styles.cardHeader}>
                    <View style={styles.iconAndTitle}>
                      <View
                        style={[
                          styles.spaceIconBox,
                          { backgroundColor: `${space.accentColor}20`, borderColor: `${space.accentColor}40` },
                        ]}
                      >
                        <Ionicons name={space.icon} size={18} color={space.accentColor} />
                      </View>
                      <View style={styles.titleGroup}>
                        <View style={styles.kickerRow}>
                          <Text style={[styles.spaceKicker, { color: space.accentColor }]}>
                            {space.kicker}
                          </Text>
                          {active ? (
                            <View style={[styles.activePill, { backgroundColor: space.accentColor }]}>
                              <Ionicons name="checkmark" size={10} color="#000000" />
                              <Text style={styles.activePillText}>ACTIF</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={styles.spaceTitle}>{space.title}</Text>
                      </View>
                    </View>
                    <Ionicons
                      name={active ? 'radio-button-on' : 'chevron-forward'}
                      size={18}
                      color={active ? space.accentColor : '#64748B'}
                    />
                  </View>
                  <Text style={styles.spaceSubtitle}>{space.subtitle}</Text>
                </TouchableOpacity>
              );
            })}

            {/* Switch Account Option */}
            {onOpenAuth ? (
              <TouchableOpacity
                style={styles.switchAccountBtn}
                onPress={() => {
                  onClose();
                  onOpenAuth();
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="log-in-outline" size={16} color="#94A3B8" />
                <Text style={styles.switchAccountText}>Se connecter avec un autre compte</Text>
              </TouchableOpacity>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#0F1117',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    maxHeight: SCREEN_HEIGHT * 0.85,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerTitleCol: {
    flex: 1,
    paddingRight: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  kickerText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#30D158',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 3,
    lineHeight: 16,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacesScroll: {
    paddingHorizontal: 16,
  },
  spacesContent: {
    paddingVertical: 14,
    gap: 10,
  },
  spaceCard: {
    backgroundColor: '#151722',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    gap: 8,
    overflow: 'hidden',
  },
  spaceCardActive: {
    backgroundColor: '#191C29',
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconAndTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  spaceIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  titleGroup: {
    flex: 1,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  spaceKicker: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  activePillText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  spaceTitle: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  spaceSubtitle: {
    fontSize: 12,
    color: '#8E8E9F',
    lineHeight: 16,
  },
  switchAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    marginTop: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  switchAccountText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
});
