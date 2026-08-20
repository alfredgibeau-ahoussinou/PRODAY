import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ProDayText } from '../../../components/ui/ProDayText';
import { SUPPORTER_SPACE } from '../theme/supporterSpaceTheme';

type Props = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
};

export const SpaceSection: React.FC<Props> = ({ title, actionLabel, onAction, children }) => (
  <View style={styles.wrap}>
    <View style={styles.head}>
      <ProDayText variant="section" style={styles.title}>
        {title}
      </ProDayText>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <ProDayText variant="caption" style={styles.action}>
            {actionLabel}
          </ProDayText>
        </Pressable>
      ) : null}
    </View>
    {children}
  </View>
);

const styles = StyleSheet.create({
  wrap: { marginBottom: 22 },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: { color: SUPPORTER_SPACE.foreground, fontSize: 17, fontWeight: '700' },
  action: { color: SUPPORTER_SPACE.accent, fontWeight: '600' },
});
