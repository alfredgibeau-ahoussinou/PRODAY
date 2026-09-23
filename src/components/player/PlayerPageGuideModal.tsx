import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { colors } from '../../theme/designTokens';
import { APPLE_FONT_STACK } from '../../theme/appleTypography';

export interface GuideSection {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  description: string;
  badge?: string;
}

export interface PlayerPageGuideModalProps {
  visible: boolean;
  onClose: () => void;
  pageTitle: string;
  pageSubtitle: string;
  badgeLabel?: string;
  badgeColor?: string;
  introText: string;
  sections: GuideSection[];
  proTip?: string;
  ctaLabel?: string;
}


export const PlayerPageGuideModal: React.FC<PlayerPageGuideModalProps> = ({
  visible,
  onClose,
  pageTitle,
  pageSubtitle,
  badgeLabel = 'GUIDE INTERACTIF',
  badgeColor = '#30D158',
  introText,
  sections,
  proTip,
  ctaLabel = "J'ai compris",
}) => {
  const handleClose = () => {
    prodayHaptics.impactLight();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.cardContainer}>
          {/* Top Handle / Grab Bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleCol}>
              <View style={[styles.badgePill, { backgroundColor: `${badgeColor}1A` }]}>
                <Ionicons name="sparkles" size={12} color={badgeColor} />
                <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeLabel}</Text>
              </View>
              <Text style={styles.title}>{pageTitle}</Text>
              <Text style={styles.subtitle}>{pageSubtitle}</Text>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleClose}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Intro Text */}
            <Text style={styles.intro}>{introText}</Text>

            {/* Guide Step-by-Step Sections */}
            <View style={styles.sectionsList}>
              {sections.map((sec, idx) => (
                <View key={idx} style={styles.sectionItem}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: `${sec.iconColor || '#30D158'}1A` },
                    ]}
                  >
                    <Ionicons
                      name={sec.icon}
                      size={20}
                      color={sec.iconColor || '#30D158'}
                    />
                  </View>

                  <View style={styles.sectionTextCol}>
                    <View style={styles.sectionTitleRow}>
                      <Text style={styles.sectionTitle}>{sec.title}</Text>
                      {sec.badge ? (
                        <View style={styles.sectionBadge}>
                          <Text style={styles.sectionBadgeText}>{sec.badge}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.sectionDesc}>{sec.description}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Pro Tip Callout Box */}
            {proTip ? (
              <LinearGradient
                colors={['#1A1726', '#12101C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.proTipCard}
              >
                <View style={styles.proTipHeader}>
                  <Ionicons name="bulb" size={16} color="#FFD700" />
                  <Text style={styles.proTipLabel}>CONSEIL DU COACH PRODAY</Text>
                </View>
                <Text style={styles.proTipText}>{proTip}</Text>
              </LinearGradient>
            ) : null}
          </ScrollView>

          {/* Bottom Primary CTA */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={handleClose}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={['#30D158', '#22C55E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaGradient}
              >
                <Ionicons name="checkmark-circle" size={18} color="#000000" />
                <Text style={styles.ctaText}>{ctaLabel}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  cardContainer: {
    backgroundColor: '#121218',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    /** 82 % de la fenêtre RÉELLE : la valeur calculée au chargement du module
     *  débordait dès que la hauteur changeait (clavier ouvert, rotation) et
     *  poussait le bouton principal hors écran. */
    maxHeight: '82%',
    paddingTop: 8,
    paddingBottom: Platform.select({ ios: 34, default: 24 }),
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  headerTitleCol: {
    flex: 1,
    marginRight: 12,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  badgeText: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: APPLE_FONT_STACK.display,
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  intro: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 13,
    lineHeight: 18,
    color: '#CBD5E1',
    marginBottom: 16,
  },
  sectionsList: {
    gap: 12,
    marginBottom: 16,
  },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 12,
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sectionTextCol: {
    flex: 1,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sectionBadgeText: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
  },
  sectionDesc: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 11.5,
    lineHeight: 16,
    color: '#94A3B8',
    marginTop: 3,
  },
  proTipCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    padding: 14,
    marginBottom: 12,
  },
  proTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  proTipLabel: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 10,
    fontWeight: '800',
    color: '#FFD700',
    letterSpacing: 0.5,
  },
  proTipText: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 11.5,
    lineHeight: 16,
    color: '#E2E8F0',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  ctaButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
  },
  ctaText: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 14,
    fontWeight: '800',
    color: '#000000',
  },
});
