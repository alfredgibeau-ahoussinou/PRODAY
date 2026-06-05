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
import { APP_SPACE_LABELS, APP_SPACE_DESCRIPTIONS } from '../../models/AppSpace';
import { PLAYER_CATEGORIES_UNDER_U13 } from '../../constants/appSpaces';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { TAB_BAR_CONTENT_INSET } from '../../components/navigation/BottomTabBar';
import { spacing, radius } from '../../theme/designTokens';
import { useThemedScreen } from '../../hooks/useThemedScreen';
import type { AppColors } from '../../theme/universeTheme';

interface UnderU13HubScreenProps {
  onBack: () => void;
}

export const UnderU13HubScreen: React.FC<UnderU13HubScreenProps> = ({ onBack }) => {
  const { setAppSpace } = useAppSpace();
  const nav = useTabNavigationActions();
  const { colors: c, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createStyles(c), [c]);

  const enterSpace = async () => {
    await setAppSpace('under_u13');
    onBack();
    nav.setActiveTab('recrutement');
  };

  return (
    <View style={[styles.root, rootStyle]}>
      <ScreenHeader title={APP_SPACE_LABELS.under_u13} onBack={onBack} centered />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>ÉCOLE DE FOOT</Text>
          <Text style={styles.heroTitle}>Moins de 13 ans</Text>
          <Text style={styles.heroSub}>{APP_SPACE_DESCRIPTIONS.under_u13}</Text>
        </View>

        <View style={styles.tags}>
          {PLAYER_CATEGORIES_UNDER_U13.map((cat) => (
            <View key={cat} style={styles.tag}>
              <Text style={styles.tagText}>{cat}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.cta} onPress={() => void enterSpace()}>
          <Icon name="school" size={24} color={c.brandInverse} />
          <View style={styles.ctaBody}>
            <Text style={styles.ctaTitle}>Entrer dans l’espace -13</Text>
            <Text style={styles.ctaSub}>Mercato et profils filtrés U7 · U9 · U11</Text>
          </View>
          <Icon name="chevron-forward" size={18} color={c.brandInverse} />
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
      borderColor: c.success,
    },
    heroEyebrow: {
      color: c.success,
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
    tags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    tag: {
      backgroundColor: c.surface,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: c.border,
    },
    tagText: { fontSize: 12, fontWeight: '800', color: c.text },
    cta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: c.ink,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 2,
      borderColor: c.success,
      marginBottom: spacing.md,
    },
    ctaBody: { flex: 1 },
    ctaTitle: { fontSize: 16, fontWeight: '900', color: c.brandInverse },
    ctaSub: { fontSize: 12, color: c.heroMuted, marginTop: 2 },
    secondary: { alignItems: 'center', padding: spacing.lg },
    secondaryText: { color: c.textMuted, fontWeight: '700' },
  });
}
