import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Icon } from '../../components/ui/Icon';
import { useAppSpace } from '../../context/AppSpaceContext';
import { APP_SPACE_LABELS } from '../../models/AppSpace';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { TAB_BAR_CONTENT_INSET } from '../../components/navigation/BottomTabBar';
import { colors, spacing, radius } from '../../theme/designTokens';

interface WomenHubScreenProps {
  onBack: () => void;
}

export const WomenHubScreen: React.FC<WomenHubScreenProps> = ({ onBack }) => {
  const { setAppSpace } = useAppSpace();
  const nav = useTabNavigationActions();

  const enterSpace = async (space: 'women' | 'girls') => {
    await setAppSpace(space);
    onBack();
    nav.setActiveTab('recrutement');
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="ProDay Féminin" onBack={onBack} centered />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>ESPACE DÉDIÉ</Text>
          <Text style={styles.heroTitle}>Football féminin & filles</Text>
          <Text style={styles.heroSub}>
            Mercato, détections et profils filtrés pour les joueuses, clubs F et catégories
            U13 F à D1 F.
          </Text>
        </View>

        <TouchableOpacity style={styles.card} onPress={() => enterSpace('women')}>
          <Icon name="people" size={24} color={colors.accent} />
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>{APP_SPACE_LABELS.women}</Text>
            <Text style={styles.cardSub}>Seniors F, D2 F, D1 F, régional féminin</Text>
          </View>
          <Icon name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => enterSpace('girls')}>
          <Icon name="school" size={24} color={colors.accent} />
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>{APP_SPACE_LABELS.girls}</Text>
            <Text style={styles.cardSub}>U13 F à U19 F — formations et détections</Text>
          </View>
          <Icon name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondary} onPress={onBack}>
          <Text style={styles.secondaryText}>Retour à l&apos;accueil</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xxl },
  hero: {
    backgroundColor: '#4a1942',
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  heroEyebrow: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  heroTitle: {
    color: colors.brandInverse,
    fontSize: 24,
    fontWeight: '900',
    marginTop: spacing.sm,
  },
  heroSub: { color: colors.heroMuted, fontSize: 14, lineHeight: 20, marginTop: spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '900', color: colors.text },
  cardSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  secondary: { alignItems: 'center', padding: spacing.lg },
  secondaryText: { color: colors.textMuted, fontWeight: '700' },
});
