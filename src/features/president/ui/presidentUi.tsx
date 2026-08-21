import React, { useMemo } from 'react';
import {
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
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { PressableSpring, AnimatedEntrance, LivePulseDot } from '../../../components/motion';
import { ProDayText } from '../../../components/ui/ProDayText';
import { Icon } from '../../../components/ui/Icon';
import type { IconName } from '../../../components/ui/iconNames';
import { usePresidentTheme } from '../shell/PresidentThemeContext';
import type { PresidentThemeTokens } from '../theme/presidentTokens';
import {
  presidentChrome,
  presidentMotion,
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

export function PresidentBrandMark({ compact }: { compact?: boolean }) {
  const { tokens } = usePresidentTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View
        style={{
          width: compact ? 6 : 8,
          height: compact ? 6 : 8,
          borderRadius: 4,
          backgroundColor: tokens.accent,
          ...presidentShadow.champagne(tokens),
        }}
      />
      <PresidentText
        variant="brand"
        champagne
        style={{ fontSize: compact ? 9 : 10, letterSpacing: compact ? 1.6 : 2.2 }}
      >
        {presidentChrome.brandMark}
      </PresidentText>
    </View>
  );
}

export function PresidentLoading({ label = 'Préparation du cockpit…' }: { label?: string }) {
  const { tokens } = usePresidentTheme();
  const pulse = useSharedValue(0.35);

  React.useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [pulse]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + pulse.value * 0.55,
    transform: [{ scale: 0.92 + pulse.value * 0.08 }],
  }));

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: presidentSpace.lg,
        backgroundColor: tokens.bg,
        padding: presidentSpace.xl,
      }}
    >
      <Animated.View
        style={[
          {
            width: 72,
            height: 72,
            borderRadius: 36,
            borderWidth: 1,
            borderColor: tokens.borderLuxury,
            backgroundColor: tokens.accentSoft,
            alignItems: 'center',
            justifyContent: 'center',
          },
          glowStyle,
        ]}
      >
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: tokens.accent,
          }}
        />
      </Animated.View>
      <PresidentBrandMark />
      <PresidentText variant="body" muted style={{ textAlign: 'center' }}>
        {label}
      </PresidentText>
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
        paddingTop: presidentSpace.md,
        paddingBottom: presidentSpace.hero,
        gap: presidentSpace.xl,
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
  index = 0,
  flush,
}: {
  title?: string;
  eyebrow?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  index?: number;
  flush?: boolean;
}) {
  const { tokens } = usePresidentTheme();
  const styles = useMemo(() => sectionStyles(tokens, flush), [tokens, flush]);
  return (
    <AnimatedEntrance kind="fadeUp" index={index} delayStep={presidentMotion.stagger}>
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
    <AnimatedEntrance kind="fadeUp">
      <View
        style={{
          padding: presidentSpace.xl,
          borderRadius: presidentRadius.xl,
          borderWidth: 1,
          borderColor: tokens.border,
          gap: presidentSpace.md,
          backgroundColor: tokens.surfaceMuted,
          overflow: 'hidden',
          ...presidentShadow.soft,
        }}
      >
        <LinearGradient
          colors={[tokens.champagneSoft, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <PresidentBrandMark compact />
        <PresidentText variant="h2">{title}</PresidentText>
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
              paddingVertical: presidentSpace.sm + 2,
              borderRadius: presidentRadius.pill,
              backgroundColor: tokens.accent,
              ...presidentShadow.glow(tokens),
            }}
          >
            <PresidentText variant="caption" style={{ color: tokens.accentText, fontWeight: '800' }}>
              {actionLabel}
            </PresidentText>
          </PressableSpring>
        ) : null}
      </View>
    </AnimatedEntrance>
  );
}

export function PresidentHeroBanner({
  greeting,
  clubName,
  subtitle,
  overall,
}: {
  greeting: string;
  clubName: string;
  subtitle: string;
  overall?: number;
}) {
  const { tokens } = usePresidentTheme();
  const styles = useMemo(() => heroStyles(tokens), [tokens]);
  return (
    <AnimatedEntrance kind="fadeUp" index={0}>
      <View style={styles.wrap}>
        <LinearGradient
          colors={[
            'rgba(212,184,128,0.28)',
            'rgba(14,21,36,0.55)',
            'rgba(5,7,14,0.9)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['transparent', 'rgba(232,213,168,0.06)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.topRow}>
          <PresidentBrandMark />
          <View style={styles.liveChip}>
            <LivePulseDot active color={tokens.champagne} size={6} />
            <PresidentText variant="caption" champagne style={{ fontSize: 10, fontWeight: '700' }}>
              Directif
            </PresidentText>
          </View>
        </View>
        <PresidentText variant="display">{greeting}</PresidentText>
        <PresidentText variant="displaySm" champagne numberOfLines={1}>
          {clubName}
        </PresidentText>
        <PresidentText variant="body" muted style={{ marginTop: 2, maxWidth: 420 }}>
          {subtitle}
        </PresidentText>
        {typeof overall === 'number' ? (
          <View style={styles.heroStat}>
            <PresidentText variant="label" muted>
              Indice santé
            </PresidentText>
            <PresidentText variant="statSm" style={{ color: tokens.champagneBright }}>
              {overall}%
            </PresidentText>
          </View>
        ) : null}
      </View>
    </AnimatedEntrance>
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
        backgroundColor: tokens.surfaceGlass,
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
      <PresidentText variant="caption" champagne style={{ letterSpacing: 0.8 }}>
        ⌘K
      </PresidentText>
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
            borderColor: tokens.borderLuxury,
            padding: presidentSpace.xl,
            gap: presidentSpace.md,
            ...presidentShadow.deep,
          }}
        >
          <PresidentBrandMark compact />
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
                ...presidentShadow.glow(tokens),
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

function sectionStyles(tokens: PresidentThemeTokens, flush?: boolean) {
  return StyleSheet.create({
    card: {
      backgroundColor: flush ? 'transparent' : tokens.surface,
      borderRadius: presidentRadius.xl,
      borderWidth: flush ? 0 : 1,
      borderColor: tokens.border,
      padding: flush ? 0 : presidentSpace.lg,
      gap: presidentSpace.md,
      ...(flush ? {} : presidentShadow.soft),
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
      borderWidth: 1,
      borderColor: tokens.border,
      paddingHorizontal: presidentSpace.md,
      marginBottom: 4,
    },
    iconWrap: {
      width: 38,
      height: 38,
      borderRadius: presidentRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.surfaceMuted,
      borderWidth: 1,
      borderColor: tokens.border,
    },
  });
}

function heroStyles(tokens: PresidentThemeTokens) {
  return StyleSheet.create({
    wrap: {
      borderRadius: presidentRadius.hero,
      borderWidth: 1,
      borderColor: tokens.borderLuxury,
      backgroundColor: tokens.surfaceRaised,
      padding: presidentSpace.xl,
      paddingBottom: presidentSpace.xxl,
      gap: 8,
      overflow: 'hidden',
      minHeight: 200,
      ...presidentShadow.deep,
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    liveChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: presidentRadius.pill,
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.surfaceGlass,
    },
    heroStat: {
      marginTop: presidentSpace.md,
      alignSelf: 'flex-start',
      paddingHorizontal: presidentSpace.md,
      paddingVertical: presidentSpace.sm,
      borderRadius: presidentRadius.md,
      borderWidth: 1,
      borderColor: tokens.borderStrong,
      backgroundColor: tokens.ink,
      gap: 2,
    },
  });
}
