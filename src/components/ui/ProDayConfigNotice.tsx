import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  getAppConfigIssues,
  hasBlockingConfigIssues,
  type ConfigIssue,
} from '../../config/appConfig';
import { ProDayErrorBanner } from './ProDayErrorBanner';
import { colors, spacing, radius } from '../../theme/designTokens';

interface ProDayConfigNoticeProps {
  /** Afficher uniquement les erreurs bloquantes */
  blockingOnly?: boolean;
  compact?: boolean;
}

export const ProDayConfigNotice: React.FC<ProDayConfigNoticeProps> = ({
  blockingOnly = false,
  compact = false,
}) => {
  const issues = getAppConfigIssues().filter(
    (i) => !blockingOnly || i.severity === 'error'
  );

  if (issues.length === 0) return null;

  if (compact) {
    const first = issues[0];
    return (
      <ProDayErrorBanner
        variant={first.severity === 'error' ? 'error' : 'warning'}
        title={first.title}
        message={first.detail}
      />
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>
        {hasBlockingConfigIssues() ? 'Configuration requise' : 'À vérifier'}
      </Text>
      {issues.map((issue) => (
        <IssueRow key={issue.id} issue={issue} />
      ))}
      <Text style={styles.docLink}>Guide : docs/FIREBASE_SETUP.md</Text>
    </View>
  );
};

const IssueRow: React.FC<{ issue: ConfigIssue }> = ({ issue }) => (
  <ProDayErrorBanner
    variant={issue.severity === 'error' ? 'error' : 'warning'}
    title={issue.title}
    message={issue.detail}
  />
);

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heading: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  docLink: {
    fontSize: 12,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
    marginTop: spacing.xs,
  },
});
