import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { PressableSpring } from '../motion';
import { Icon, type IconName } from '../ui/Icon';
import { adminChrome, ADMIN_ON_ACCENT } from '../../theme/adminTheme';
import { spacing } from '../../theme/designTokens';

export type AdminButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'danger'
  | 'ghost'
  | 'icon';

export type AdminButtonSize = 'sm' | 'md';

export type AdminButtonProps = {
  label?: string;
  icon?: IconName;
  variant?: AdminButtonVariant;
  size?: AdminButtonSize;
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
  flex?: boolean;
};

function variantStyles(variant: AdminButtonVariant) {
  switch (variant) {
    case 'primary':
      return {
        container: styles.primary,
        text: styles.textOnAccent,
        iconColor: ADMIN_ON_ACCENT,
      };
    case 'secondary':
      return {
        container: styles.secondary,
        text: styles.textDefault,
        iconColor: adminChrome.text,
      };
    case 'outline':
      return {
        container: styles.outline,
        text: styles.textAccent,
        iconColor: adminChrome.accent,
      };
    case 'danger':
      return {
        container: styles.danger,
        text: styles.textOnAccent,
        iconColor: ADMIN_ON_ACCENT,
      };
    case 'ghost':
      return {
        container: styles.ghost,
        text: styles.textAccent,
        iconColor: adminChrome.accent,
      };
    case 'icon':
      return {
        container: styles.icon,
        text: styles.textDefault,
        iconColor: adminChrome.text,
      };
  }
}

export const AdminButton: React.FC<AdminButtonProps> = ({
  label,
  icon,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onPress,
  style,
  accessibilityLabel,
  testID,
  flex,
}) => {
  const vs = useMemo(() => variantStyles(variant), [variant]);
  const isDisabled = disabled || loading || !onPress;
  const isIconOnly = variant === 'icon' || (!label && !!icon);
  const iconSize = size === 'sm' ? 14 : 16;

  return (
    <PressableSpring
      onPress={onPress}
      disabled={isDisabled}
      scaleTo={0.96}
      haptic={!isDisabled}
      style={[
        styles.base,
        size === 'sm' ? styles.sizeSm : styles.sizeMd,
        isIconOnly && styles.iconOnly,
        flex && styles.flex,
        vs.container,
        isDisabled && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled }}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={vs.iconColor}
          style={label || icon ? styles.loader : undefined}
        />
      ) : icon ? (
        <Icon name={icon} size={iconSize} color={vs.iconColor} />
      ) : null}
      {label && !isIconOnly ? (
        <Text style={[styles.label, size === 'sm' && styles.labelSm, vs.text]} numberOfLines={1}>
          {label}
        </Text>
      ) : null}
    </PressableSpring>
  );
};

export type AdminActionRowProps = {
  onApprove?: () => void;
  onReject?: () => void;
  approveLoading?: boolean;
  rejectLoading?: boolean;
  disabled?: boolean;
  approveLabel?: string;
  rejectLabel?: string;
  showApprove?: boolean;
  showReject?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Paire Approuver / Refuser cohérente pour la file de décisions. */
export const AdminActionRow: React.FC<AdminActionRowProps> = ({
  onApprove,
  onReject,
  approveLoading = false,
  rejectLoading = false,
  disabled = false,
  approveLabel = 'Approuver',
  rejectLabel = 'Refuser',
  showApprove = true,
  showReject = true,
  style,
}) => (
  <View style={[styles.actionRow, style]} pointerEvents="box-none">
    {showApprove ? (
      <AdminButton
        label={approveLabel}
        variant="outline"
        size="sm"
        flex
        onPress={onApprove}
        loading={approveLoading}
        disabled={disabled || rejectLoading}
        style={styles.approveOutline}
      />
    ) : null}
    {showReject ? (
      <AdminButton
        label={rejectLabel}
        variant="danger"
        size="sm"
        flex
        onPress={onReject}
        loading={rejectLoading}
        disabled={disabled || approveLoading}
      />
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: adminChrome.radiusSm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
  sizeSm: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    minHeight: 34,
  },
  sizeMd: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    minHeight: 44,
  },
  iconOnly: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    width: 36,
    height: 36,
  },
  flex: { flex: 1 },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  labelSm: {
    fontSize: 13,
  },
  textDefault: { color: adminChrome.text },
  textAccent: { color: adminChrome.accent },
  textOnAccent: { color: ADMIN_ON_ACCENT },
  primary: {
    backgroundColor: adminChrome.accent,
    borderColor: adminChrome.accent,
  },
  secondary: {
    backgroundColor: adminChrome.shellElevated,
    borderColor: adminChrome.shellBorder,
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: adminChrome.accentMuted,
  },
  danger: {
    backgroundColor: adminChrome.danger,
    borderColor: adminChrome.danger,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minHeight: 32,
  },
  icon: {
    backgroundColor: adminChrome.shellElevated,
    borderColor: adminChrome.shellBorder,
  },
  disabled: { opacity: 0.45 },
  loader: { marginRight: 2 },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  approveOutline: {
    backgroundColor: adminChrome.pitchSoft,
    borderColor: 'rgba(34, 197, 94, 0.35)',
  },
});
