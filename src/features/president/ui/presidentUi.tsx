import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableSpring, AnimatedEntrance } from '../../../components/motion';
import { ProDayText } from '../../../components/ui/ProDayText';
import { Icon } from '../../../components/ui/Icon';
import type { IconName } from '../../../components/ui/iconNames';
import { usePresidentTheme } from '../shell/PresidentThemeContext';
import type { PresidentThemeTokens } from '../theme/presidentTokens';
import {
  presidentRadius,
  presidentShadow,
  presidentSpace,
  presidentType,
  type PresidentTypeVariant,
} from '../theme/presidentDesignSystem';

export function PresidentText({
  children,
  variant = 'body',
  muted,
  champagne,
  style,
  numberOfLines,
}: {
  children: React.ReactNode;
  variant?: PresidentTypeVariant;
  muted?: boolean;
  champagne?: boolean;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  const { tokens } = usePresidentTheme();
  const color = champagne
    ? tokens.champagne
    : muted
      ? tokens.muted
      : tokens.foreground;
  return (
    <ProDayText
      variant="body"
      numberOfLines={numberOfLines}
      style={[presidentType[variant], { color }, style]}
    >
      {children}
    </ProDayText>
  );
}

export function PresidentLoading() {
  const { tokens } = usePresidentTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={tokens.accent} size="large" />
    </View>
  );
}

export function PresidentChapterScroll({
  children,
  refreshing,
  onRefresh,
}: {
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const { tokens } = usePresidentTheme();
  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: presidentSpace.lg,
        paddingBottom: presidentSpace.xxxl,
        gap: presidentSpace.lg,
      }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={Boolean(refreshing)}
            onRefresh={onRefresh}
            tintColor={tokens.accent}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
}

export function PresidentSectionCard({
  title,
  eyebrow,
  children,
  style,
}: {
  title?: string;
  eyebrow?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { tokens } = usePresidentTheme();
  const styles = useMemo(() => sectionStyles(tokens), [tokens]);
  return (
    <AnimatedEntrance>
      <View style={[styles.card, style]}>
        {eyebrow ? (
          <PresidentText variant="label" champagne style={styles.eyebrow}>
            {eyebrow}
          </PresidentText>
        ) : null}
        {title ? (
          <PresidentText variant="h3" style={styles.title}>
            {title}
          </PresidentText>
        ) : null}
        {children}
      </View>
    </AnimatedEntrance>
  );
}

export function PresidentActionRow({
  label,
  hint,
  icon,
  onPress,
  accent,
}: {
  label: string;
  hint?: string;
  icon?: IconName;
  onPress?: () => void;
  accent?: boolean;
}) {
  const { tokens } = usePresidentTheme();
  const styles = useMemo(() => rowStyles(tokens), [tokens]);
  return (
    <PressableSpring
      onPress={onPress}
      disabled={!onPress}
      scaleTo={0.98}
      haptic={Boolean(onPress)}
      style={[styles.row, accent && styles.rowAccent]}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      {icon ? (
        <View style={[styles.iconWrap, accent && { backgroundColor: tokens.accentSoft }]}>
          <Icon name={icon} size={18} color={accent ? tokens.accent : tokens.muted} />
        </View>
      ) : null}
      <View style={{ flex: 1, gap: 2 }}>
        <PresidentText variant="body" style={{ fontWeight: '700' }}>
          {label}
        </PresidentText>
        {hint ? (
          <PresidentText variant="caption" muted>
            {hint}
          </PresidentText>
        ) : null}
      </View>
      {onPress ? <Icon name="chevron-forward" size={16} color={tokens.faint} /> : null}
    </PressableSpring>
  );
}

export function PresidentEmptyState({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { tokens } = usePresidentTheme();
  return (
    <View
      style={{
        padding: presidentSpace.xl,
        borderRadius: presidentRadius.lg,
        borderWidth: 1,
        borderColor: tokens.border,
        borderStyle: 'dashed',
        gap: presidentSpace.sm,
        backgroundColor: tokens.surfaceMuted,
      }}
    >
      <PresidentText variant="h3">{title}</PresidentText>
      <PresidentText variant="body" muted>
        {body}
      </PresidentText>
      {actionLabel && onAction ? (
        <PressableSpring
          onPress={onAction}
          scaleTo={0.97}
          haptic
          style={{
            marginTop: presidentSpace.sm,
            alignSelf: 'flex-start',
            paddingHorizontal: presidentSpace.lg,
            paddingVertical: presidentSpace.sm,
            borderRadius: presidentRadius.pill,
            backgroundColor: tokens.accent,
          }}
        >
          <PresidentText variant="caption" style={{ color: tokens.accentText, fontWeight: '800' }}>
            {actionLabel}
          </PresidentText>
        </PressableSpring>
      ) : null}
    </View>
  );
}

export function PresidentHeroBanner({
  greeting,
  clubName,
  subtitle,
}: {
  greeting: string;
  clubName: string;
  subtitle: string;
}) {
  const { tokens } = usePresidentTheme();
  const styles = useMemo(() => heroStyles(tokens), [tokens]);
  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['rgba(201,166,107,0.18)', 'rgba(18,26,43,0.2)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <PresidentText variant="label" champagne>
        Pôle Président
      </PresidentText>
      <PresidentText variant="display">{greeting}</PresidentText>
      <PresidentText variant="h3" champagne numberOfLines={1}>
        {clubName}
      </PresidentText>
      <PresidentText variant="body" muted style={{ marginTop: 4 }}>
        {subtitle}
      </PresidentText>
    </View>
  );
}

export function PresidentSearchField({
  value,
  onChangeText,
  placeholder,
  onFocus,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  onFocus?: () => void;
}) {
  const { tokens } = usePresidentTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: presidentSpace.sm,
        paddingHorizontal: presidentSpace.md,
        paddingVertical: presidentSpace.sm,
        borderRadius: presidentRadius.md,
        borderWidth: 1,
        borderColor: tokens.border,
        backgroundColor: tokens.surfaceRaised,
      }}
    >
      <Icon name="search" size={16} color={tokens.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        placeholder={placeholder ?? 'Rechercher…'}
        placeholderTextColor={tokens.faint}
        style={{
          flex: 1,
          color: tokens.foreground,
          fontSize: 15,
          paddingVertical: 6,
        }}
      />
    </View>
  );
}

export function PresidentConfirmModal({
  visible,
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { tokens } = usePresidentTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        style={{
          flex: 1,
          backgroundColor: tokens.overlay,
          justifyContent: 'center',
          padding: presidentSpace.xl,
        }}
        onPress={onCancel}
      >
        <Pressable
          onPress={(e) => e.stopPropagation?.()}
          style={{
            backgroundColor: tokens.surfaceRaised,
            borderRadius: presidentRadius.xl,
            borderWidth: 1,
            borderColor: tokens.borderStrong,
            padding: presidentSpace.xl,
            gap: presidentSpace.md,
            ...presidentShadow.card,
          }}
        >
          <PresidentText variant="h2">{title}</PresidentText>
          <PresidentText variant="body" muted>
            {body}
          </PresidentText>
          <View style={{ flexDirection: 'row', gap: presidentSpace.sm, marginTop: 8 }}>
            <PressableSpring
              onPress={onCancel}
              scaleTo={0.97}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: presidentRadius.md,
                borderWidth: 1,
                borderColor: tokens.border,
                alignItems: 'center',
              }}
            >
              <PresidentText variant="body">Annuler</PresidentText>
            </PressableSpring>
            <PressableSpring
              onPress={onConfirm}
              scaleTo={0.97}
              haptic
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: presidentRadius.md,
                backgroundColor: tokens.accent,
                alignItems: 'center',
              }}
            >
              <PresidentText
                variant="body"
                style={{ color: tokens.accentText, fontWeight: '800' }}
              >
                {confirmLabel}
              </PresidentText>
            </PressableSpring>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function sectionStyles(tokens: PresidentThemeTokens) {
  return StyleSheet.create({
    card: {
      backgroundColor: tokens.surface,
      borderRadius: presidentRadius.lg,
      borderWidth: 1,
      borderColor: tokens.border,
      padding: presidentSpace.lg,
      gap: presidentSpace.md,
      ...presidentShadow.soft,
    },
    eyebrow: { marginBottom: -4 },
    title: { marginBottom: 2 },
  });
}

function rowStyles(tokens: PresidentThemeTokens) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: presidentSpace.md,
      paddingVertical: presidentSpace.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.hairline,
    },
    rowAccent: {
      borderBottomWidth: 0,
      backgroundColor: tokens.champagneSoft,
      borderRadius: presidentRadius.md,
      paddingHorizontal: presidentSpace.md,
      marginBottom: 4,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: presidentRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.surfaceMuted,
    },
  });
}

function heroStyles(tokens: PresidentThemeTokens) {
  return StyleSheet.create({
    wrap: {
      borderRadius: presidentRadius.xl,
      borderWidth: 1,
      borderColor: tokens.borderStrong,
      backgroundColor: tokens.surfaceRaised,
      padding: presidentSpace.xl,
      gap: 6,
      overflow: 'hidden',
      ...presidentShadow.card,
    },
  });
}
