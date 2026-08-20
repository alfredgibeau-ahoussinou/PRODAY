import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ProDayText } from '../../../components/ui/ProDayText';
import { SUPPORTER_HUB_THEME } from '../../../features/supporter/design/supporterHubTheme';
import { spacing } from '../../../theme/designTokens';

type Props = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
};

export const SupporterHubSection: React.FC<Props> = ({ title, subtitle, action, children }) => (
  <View style={styles.root}>
    <View style={styles.head}>
      <View style={styles.copy}>
        <ProDayText variant="section" style={styles.title}>
          {title}
        </ProDayText>
        {subtitle ? (
          <ProDayText variant="caption" style={styles.subtitle}>
            {subtitle}
          </ProDayText>
        ) : null}
      </View>
      {action}
    </View>
    {children}
  </View>
);

const styles = StyleSheet.create({
  root: { gap: spacing.sm, marginBottom: SUPPORTER_HUB_THEME.sectionGap },
  head: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: spacing.lg },
  copy: { flex: 1, gap: 2 },
  title: { color: SUPPORTER_HUB_THEME.foreground, fontSize: 16, letterSpacing: 0.2 },
  subtitle: { color: SUPPORTER_HUB_THEME.muted, fontSize: 11 },
});
