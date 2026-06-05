import React, { useMemo } from 'react';
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
import { spacing, radius } from '../../theme/designTokens';
import { useThemedScreen } from '../../hooks/useThemedScreen';
import type { AppColors } from '../../theme/universeTheme';

interface MenHubScreenProps {
  onBack: () => void;
}

export const MenHubScreen: React.FC<MenHubScreenProps> = ({ onBack }) => {
  const { setAppSpace } = useAppSpace();
  const nav = useTabNavigationActions();
  const { colors: c, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createStyles(c), [c]);

  const enterSpace = async (space: 'men' | 'boys') => {
    await setAppSpace(space);
    onBack();
    nav.setActiveTab('recrutement');
  };

  return (
    <View style={[styles.root, rootStyle]}>
      <ScreenHeader title="ProDay Masculin" onBack={onBack} centered />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>ESPACE DÉDIÉ</Text>
          <Text style={styles.heroTitle}>Football masculin & jeunes</Text>
          <Text style={styles.heroSub}>
            Mercato, détections et profils filtrés pour les joueurs, clubs M et catégories
            U13 à National.
          </Text>
        </View>

        <TouchableOpacity style={styles.card} onPress={() => enterSpace('men')}>
          <Icon name="football" size={24} color={c.accent} />
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>{APP_SPACE_LABELS.men}</Text>
            <Text style={styles.cardSub}>Seniors, R1, N3, N2, N1, régional</Text>
          </View>
          <Icon name="chevron-forward" size={18} color={c.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => enterSpace('boys')}>
          <Icon name="school" size={24} color={c.accent} />
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>{APP_SPACE_LABELS.boys}</Text>
            <Text style={styles.cardSub}>U13 à U19 — formations et détections</Text>
          </View>
          <Icon name="chevron-forward" size={18} color={c.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondary} onPress={onBack}>
          <Text style={styles.secondaryText}>Retour à l&apos;accueil</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1 },
    content: { padding: spacing.lg, paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xxl },
    hero: {
      backgroundColor: c.surfaceInverse,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 2,
      borderColor: c.accent,
    },
    heroEyebrow: {
      color: c.accent,
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 2,
    },
    heroTitle: {
      color: c.brandInverse,
      fontSize: 24,
      fontWeight: '900',
      marginTop: spacing.sm,
    },
    heroSub: { color: c.heroMuted, fontSize: 14, lineHeight: 20, marginTop: spacing.sm },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: spacing.sm,
    },
    cardBody: { flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: '900', color: c.text },
    cardSub: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
    secondary: { alignItems: 'center', padding: spacing.lg },
    secondaryText: { color: c.textMuted, fontWeight: '700' },
  });
}
