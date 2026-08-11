import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { PressableSpring } from '../../motion';
import { adminChrome } from '../../../theme/adminTheme';
import { spacing } from '../../../theme/designTokens';

export type AdminInspectorAction = {
  id: string;
  label: string;
  tone?: 'default' | 'danger' | 'primary';
  onPress: () => void;
  disabled?: boolean;
};

type Props = {
  eyebrow: string;
  title: string;
  body?: string;
  meta?: string[];
  actions?: AdminInspectorAction[];
  emptyLabel?: string;
  children?: React.ReactNode;
};

/** Right-side decision panel — actions live here, not in card footers. */
export function AdminInspector({
  eyebrow,
  title,
  body,
  meta,
  actions,
  emptyLabel,
  children,
}: Props) {
  const styles = useMemo(() => createStyles(), []);

  if (!title && emptyLabel) {
    return (
      <View style={styles.root}>
        <Text style={styles.empty}>{emptyLabel}</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
      {meta && meta.length > 0 ? (
        <View style={styles.metaBlock}>
          {meta.map((line) => (
            <Text key={line} style={styles.meta}>
              {line}
            </Text>
          ))}
        </View>
      ) : null}
      {children}
      {actions && actions.length > 0 ? (
        <ScrollView style={styles.actions} contentContainerStyle={styles.actionsInner}>
          {actions.map((action) => (
            <PressableSpring
              key={action.id}
              onPress={action.onPress}
              disabled={action.disabled}
              scaleTo={0.98}
              haptic
              style={[
                styles.action,
                action.tone === 'primary' && styles.actionPrimary,
                action.tone === 'danger' && styles.actionDanger,
                action.disabled && styles.actionDisabled,
              ]}
            >
              <Text
                style={[
                  styles.actionLabel,
                  action.tone === 'primary' && styles.actionLabelPrimary,
                  action.tone === 'danger' && styles.actionLabelDanger,
                ]}
              >
                {action.label}
              </Text>
            </PressableSpring>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: adminChrome.shellElevated,
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: adminChrome.shellBorder,
      padding: spacing.md,
      gap: spacing.sm,
    },
    empty: {
      marginTop: spacing.xl,
      color: adminChrome.textMuted,
      fontSize: 13,
      lineHeight: 18,
      textAlign: 'center',
    },
    eyebrow: {
      fontFamily: adminChrome.mono,
      fontSize: 10,
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      color: adminChrome.accent,
      fontWeight: '700',
    },
    title: {
      color: adminChrome.text,
      fontSize: 20,
      fontWeight: '800',
      letterSpacing: -0.4,
      lineHeight: 24,
    },
    body: {
      color: adminChrome.textMuted,
      fontSize: 13,
      lineHeight: 19,
    },
    metaBlock: { gap: 4, marginTop: spacing.xs },
    meta: {
      fontFamily: adminChrome.mono,
      fontSize: 11,
      color: adminChrome.textMuted,
    },
    actions: { marginTop: spacing.md, flexGrow: 0 },
    actionsInner: { gap: 8 },
    action: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.shellBorder,
      paddingVertical: 12,
      paddingHorizontal: spacing.md,
      backgroundColor: adminChrome.shellMid,
    },
    actionPrimary: {
      backgroundColor: adminChrome.accent,
      borderColor: adminChrome.accent,
    },
    actionDanger: {
      borderColor: adminChrome.danger,
      backgroundColor: 'rgba(255,92,92,0.08)',
    },
    actionDisabled: { opacity: 0.4 },
    actionLabel: {
      color: adminChrome.text,
      fontWeight: '700',
      fontSize: 13,
      textAlign: 'center',
    },
    actionLabelPrimary: { color: '#FFFFFF' },
    actionLabelDanger: { color: adminChrome.danger },
  });
}
