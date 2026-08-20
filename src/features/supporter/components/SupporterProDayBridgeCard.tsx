import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ProDayText } from '../../../components/ui/ProDayText';
import { Icon } from '../../../components/ui/Icon';
import { SUPPORTER_HUB_THEME } from '../design/supporterHubTheme';
import { spacing, radius } from '../../../theme/designTokens';

type Props = {
  count: number;
  onPress?: () => void;
};

/** Pont amateur ProDay — week-end près de toi ou prochains matchs. */
export const SupporterProDayBridgeCard: React.FC<Props> = ({ count, onPress }) => (
  <Pressable onPress={onPress} style={styles.card}>
    <View style={styles.row}>
      <Icon name="football" size={20} color={SUPPORTER_HUB_THEME.accent} />
      <View style={styles.copy}>
        <ProDayText variant="section" style={styles.title}>
          ProDay près de toi
        </ProDayText>
        <ProDayText variant="caption" style={styles.body}>
          {count > 0
            ? `${count} match${count > 1 ? 's' : ''} amateur ce week-end`
            : 'Découvre le football amateur sur ProDay'}
        </ProDayText>
      </View>
      <Icon name="chevron-forward" size={16} color={SUPPORTER_HUB_THEME.muted} />
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: SUPPORTER_HUB_THEME.soft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SUPPORTER_HUB_THEME.border,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  copy: { flex: 1, gap: 2 },
  title: { color: SUPPORTER_HUB_THEME.foreground, fontSize: 15 },
  body: { color: SUPPORTER_HUB_THEME.muted, lineHeight: 18 },
});
