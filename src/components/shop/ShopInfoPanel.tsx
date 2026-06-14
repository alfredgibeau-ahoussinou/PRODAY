import React from 'react';
import { View, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import {
  SHOP_DELIVERY_STEPS,
  SHOP_FAQ,
  getShopCopy,
  type ShopCopy,
} from '../../content/prodayShop';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';

interface ShopInfoPanelProps {
  copy: ShopCopy;
}

export const ShopInfoPanel: React.FC<ShopInfoPanelProps> = ({ copy }) => {
  const { colors } = useAppTheme();

  return (
    <View style={styles.wrap}>
      <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
        <ProDayText variant="eyebrow" accent style={styles.sectionEyebrow}>
          Livraison
        </ProDayText>
        {SHOP_DELIVERY_STEPS.map((step, index) => (
          <View key={step.title} style={styles.stepRow}>
            <View style={[styles.stepNum, { backgroundColor: colors.accentSoft }]}>
              <ProDayText variant="caption" accent style={styles.stepNumText}>
                {index + 1}
              </ProDayText>
            </View>
            <View style={styles.stepCopy}>
              <ProDayText variant="section">{step.title}</ProDayText>
              <ProDayText variant="caption" muted>
                {step.body}
              </ProDayText>
            </View>
          </View>
        ))}
        <ProDayText variant="caption" muted style={styles.note}>
          {copy.preorderNote}
        </ProDayText>
      </ProDaySurface>

      <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
        <ProDayText variant="eyebrow" accent style={styles.sectionEyebrow}>
          Questions fréquentes
        </ProDayText>
        {SHOP_FAQ.map((item) => (
          <View key={item.q} style={[styles.faqRow, { borderBottomColor: colors.border }]}>
            <ProDayText variant="caption" style={styles.faqQ}>
              {item.q}
            </ProDayText>
            <ProDayText variant="caption" muted>
              {item.a}
            </ProDayText>
          </View>
        ))}
      </ProDaySurface>

      <TouchableOpacity
        style={[styles.contactRow, { borderColor: colors.border, backgroundColor: colors.surface }]}
        onPress={() => void Linking.openURL(`mailto:${copy.contactEmail}`)}
        activeOpacity={0.88}
      >
        <View style={[styles.contactIcon, { backgroundColor: colors.accentSoft }]}>
          <Icon name="mail" size={20} color={colors.accent} variant="filled" />
        </View>
        <View style={styles.contactCopy}>
          <ProDayText variant="section">Contacter la boutique</ProDayText>
          <ProDayText variant="caption" muted>
            {copy.contactEmail}
          </ProDayText>
        </View>
        <Icon name="chevron-forward" size={18} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  card: { borderWidth: 1, gap: spacing.sm },
  sectionEyebrow: { marginBottom: spacing.xs },
  stepRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { fontWeight: '900' },
  stepCopy: { flex: 1, gap: 2 },
  note: { marginTop: spacing.xs, lineHeight: 18 },
  faqRow: {
    gap: 4,
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  faqQ: { fontWeight: '800' },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactCopy: { flex: 1, gap: 2 },
});
