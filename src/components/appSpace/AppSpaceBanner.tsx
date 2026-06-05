import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppSpace } from '../../context/AppSpaceContext';
import {
  APP_SPACE_LABELS,
  isFeminineAppSpace,
  isMasculineAppSpace,
  isUnderU13AppSpace,
} from '../../models/AppSpace';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

interface AppSpaceBannerProps {
  showHubLinks?: boolean;
  onOpenMenHub?: () => void;
  /** Homme : bascule vers l'univers Woman. Woman : sélecteur d'espaces F. */
  onOpenWomenHub?: () => void;
  onOpenUnderU13Hub?: () => void;
}

export const AppSpaceBanner: React.FC<AppSpaceBannerProps> = ({
  showHubLinks = false,
  onOpenMenHub,
  onOpenWomenHub,
  onOpenUnderU13Hub,
}) => {
  const { appSpace } = useAppSpace();
  const { productLine, colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  const wrapStyle = isUnderU13AppSpace(appSpace)
    ? styles.wrapUnderU13
    : isFeminineAppSpace(appSpace)
      ? styles.wrapFeminine
      : styles.wrapMasculine;

  const iconName = isUnderU13AppSpace(appSpace)
    ? 'school'
    : isFeminineAppSpace(appSpace)
      ? 'people'
      : 'football';

  const sub = isUnderU13AppSpace(appSpace)
    ? 'Mercato filtré — U7, U9, U11'
    : isFeminineAppSpace(appSpace)
      ? 'Mercato filtré — football féminin'
      : 'Mercato filtré — football masculin';

  return (
    <View style={styles.root}>
      <View style={[styles.wrap, wrapStyle]}>
        <Icon name={iconName} size={20} color={c.brandInverse} />
        <View style={styles.copy}>
          <Text style={styles.titleActive}>{APP_SPACE_LABELS[appSpace]}</Text>
          <Text style={styles.subActive}>{sub}</Text>
        </View>
      </View>

      {showHubLinks ? (
        <View style={styles.dualWrap}>
          {productLine === 'homme' ? (
            <>
              <TouchableOpacity
                style={[styles.dualCard, styles.dualMasculine]}
                onPress={onOpenMenHub}
                activeOpacity={0.9}
              >
                <Icon name="football" size={20} color={c.brand} />
                <View style={styles.dualCopy}>
                  <Text style={styles.dualTitle}>Changer — Masculin</Text>
                  <Text style={styles.dualSub}>Joueurs · clubs M</Text>
                </View>
                <Icon name="chevron-forward" size={16} color={c.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dualCard, styles.dualFeminine]}
                onPress={onOpenWomenHub}
                activeOpacity={0.9}
              >
                <Icon name="people" size={20} color={c.brand} />
                <View style={styles.dualCopy}>
                  <Text style={styles.dualTitle}>Univers ProDay Woman</Text>
                  <Text style={styles.dualSub}>Mercato F · joueuses · clubs F</Text>
                </View>
                <Icon name="chevron-forward" size={16} color={c.textMuted} />
              </TouchableOpacity>
            </>
          ) : productLine === 'woman' ? (
            <TouchableOpacity
              style={[styles.dualCard, styles.dualFeminine]}
              onPress={onOpenWomenHub}
              activeOpacity={0.9}
            >
              <Icon name="people" size={20} color={c.brand} />
              <View style={styles.dualCopy}>
                <Text style={styles.dualTitle}>Changer — Féminin</Text>
                <Text style={styles.dualSub}>Seniors F · jeunes F · -13 F</Text>
              </View>
              <Icon name="chevron-forward" size={16} color={c.textMuted} />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={[styles.dualCard, styles.dualUnderU13]}
            onPress={onOpenUnderU13Hub}
            activeOpacity={0.9}
          >
            <Icon name="school" size={20} color="#4ade80" />
            <View style={styles.dualCopy}>
              <Text style={styles.dualTitle}>Changer — -13 ans</Text>
              <Text style={styles.dualSub}>
                {productLine === 'woman' ? 'U7 F · U9 F · U11 F' : 'U7 · U9 · U11'}
              </Text>
            </View>
            <Icon name="chevron-forward" size={16} color={c.textMuted} />
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
};

export const AppSpacePill: React.FC<{
  space: import('../../models/AppSpace').AppSpaceId;
  active: boolean;
  onPress: () => void;
}> = ({ space, active, onPress }) => {
  const { colors: c } = useAppTheme();
  const pillStyles = useMemo(() => createPillStyles(c), [c]);

  return (
    <TouchableOpacity style={[pillStyles.pill, active && pillStyles.pillOn]} onPress={onPress}>
      <Text style={[pillStyles.text, active && pillStyles.textOn]} numberOfLines={1}>
        {APP_SPACE_LABELS[space].replace('ProDay ', '')}
      </Text>
    </TouchableOpacity>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { marginBottom: spacing.md },
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
    },
    wrapFeminine: { backgroundColor: '#4a1942', borderColor: c.brand },
    wrapMasculine: { backgroundColor: '#0f2847', borderColor: c.brand },
    wrapUnderU13: { backgroundColor: '#1a5c3a', borderColor: '#4ade80' },
    copy: { flex: 1 },
    titleActive: { fontSize: 14, fontWeight: '900', color: c.brandInverse },
    subActive: { fontSize: 11, color: c.heroMuted },
    dualWrap: { gap: spacing.sm, marginTop: spacing.sm },
    dualCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      backgroundColor: c.surface,
      borderColor: c.border,
    },
    dualMasculine: { borderLeftWidth: 4, borderLeftColor: '#3d6cb9' },
    dualFeminine: { borderLeftWidth: 4, borderLeftColor: '#be185d' },
    dualUnderU13: { borderLeftWidth: 4, borderLeftColor: '#4ade80' },
    dualCopy: { flex: 1 },
    dualTitle: { fontSize: 14, fontWeight: '900', color: c.text },
    dualSub: { fontSize: 11, color: c.textSecondary, marginTop: 2 },
  });
}

function createPillStyles(c: AppColors) {
  return StyleSheet.create({
    pill: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.border,
    },
    pillOn: { backgroundColor: c.ink, borderColor: c.ink },
    text: { fontSize: 10, fontWeight: '800', color: c.text },
    textOn: { color: c.brandInverse },
  });
}
