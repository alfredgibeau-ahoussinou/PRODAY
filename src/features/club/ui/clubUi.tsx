import React, { useEffect, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableSpring, AnimatedEntrance } from '../../../components/motion';
import { ProDayText } from '../../../components/ui/ProDayText';
import { Icon } from '../../../components/ui/Icon';
import type { IconName } from '../../../components/ui/iconNames';
import { useClubTheme } from '../shell/ClubThemeContext';
import type { ClubThemeTokens } from '../theme/clubTokens';
import {
  clubEventTone,
  clubMotion,
  clubRadius,
  clubShadow,
  clubSpace,
  clubType,
  type ClubEventKind,
  type ClubTypeVariant,
} from '../theme/clubDesignSystem';

export function ClubText({
  children,
  variant = 'body',
  muted,
  style,
  numberOfLines,
}: {
  children: React.ReactNode;
  variant?: ClubTypeVariant | 'title' | 'section';
  muted?: boolean;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  const { tokens } = useClubTheme();
  const resolved: ClubTypeVariant =
    variant === 'title' ? 'h1' : variant === 'section' ? 'h3' : variant;
  const typeStyle = clubType[resolved];
  return (
    <ProDayText
      variant="body"
      numberOfLines={numberOfLines}
      style={[
        typeStyle,
        { color: muted ? tokens.muted : tokens.foreground },
        style,
      ]}
    >
      {children}
    </ProDayText>
  );
}

export function ClubScreenHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => headerStyles(tokens), [tokens]);
  return (
    <View style={styles.wrap}>
      <View style={styles.textCol}>
        <ClubText variant="h1">{title}</ClubText>
        {subtitle ? (
          <ClubText variant="caption" muted style={styles.sub}>
            {subtitle}
          </ClubText>
        ) : null}
      </View>
      {right}
    </View>
  );
}

export function ClubChapterScroll({
  children,
  refreshing,
  onRefresh,
}: {
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const { tokens } = useClubTheme();
  return (
    <Animated.ScrollView
      style={{ flex: 1, backgroundColor: 'transparent' }}
      contentContainerStyle={{
        paddingHorizontal: clubSpace.lg,
        paddingBottom: clubSpace.xxxl,
        gap: clubSpace.md,
      }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={tokens.accent} />
        ) : undefined
      }
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </Animated.ScrollView>
  );
}

export function ClubEmptyState({
  title,
  body,
  actionLabel,
  onAction,
  icon = 'football',
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: IconName;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => emptyStyles(tokens), [tokens]);
  return (
    <View style={styles.box}>
      <LinearGradient
        colors={[tokens.headerWash, tokens.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.iconWrap}>
        <Icon name={icon} size={22} color={tokens.accent} />
      </View>
      <ClubText variant="h3">{title}</ClubText>
      <ClubText variant="body" muted style={styles.body}>
        {body}
      </ClubText>
      {actionLabel && onAction ? (
        <PressableSpring onPress={onAction} scaleTo={0.97} haptic style={styles.cta}>
          <ClubText variant="caption" style={{ color: tokens.onAccent, fontWeight: '700' }}>
            {actionLabel}
          </ClubText>
        </PressableSpring>
      ) : null}
    </View>
  );
}

export function ClubErrorState({
  title = 'Impossible de charger',
  body = 'Réessayez dans un instant. Si le problème continue, vérifiez votre connexion.',
  onRetry,
}: {
  title?: string;
  body?: string;
  onRetry?: () => void;
}) {
  return (
    <ClubEmptyState
      title={title}
      body={body}
      icon="alert-circle"
      actionLabel={onRetry ? 'Réessayer' : undefined}
      onAction={onRetry}
    />
  );
}

export function ClubSectionCard({
  title,
  children,
  style,
}: {
  title?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => cardStyles(tokens), [tokens]);
  return (
    <View style={[styles.card, style]}>
      {title ? (
        <ClubText variant="label" muted style={styles.title}>
          {title}
        </ClubText>
      ) : null}
      {children}
    </View>
  );
}

export function ClubActionRow({
  label,
  hint,
  icon,
  onPress,
  trailing,
}: {
  label: string;
  hint?: string;
  icon?: IconName;
  onPress?: () => void;
  trailing?: React.ReactNode;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => rowStyles(tokens), [tokens]);
  return (
    <PressableSpring
      onPress={onPress}
      disabled={!onPress}
      scaleTo={0.98}
      haptic={Boolean(onPress)}
      style={styles.row}
    >
      {icon ? (
        <View style={styles.icon}>
          <Icon name={icon} size={18} color={tokens.accent} />
        </View>
      ) : null}
      <View style={styles.col}>
        <ClubText variant="body" style={{ fontWeight: '600' }}>
          {label}
        </ClubText>
        {hint ? (
          <ClubText variant="caption" muted numberOfLines={2}>
            {hint}
          </ClubText>
        ) : null}
      </View>
      {trailing ?? (onPress ? <Icon name="chevron-forward" size={16} color={tokens.faint} /> : null)}
    </PressableSpring>
  );
}

export function ClubLoading() {
  const { tokens } = useClubTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' }}>
      <ActivityIndicator color={tokens.accent} size="large" />
    </View>
  );
}

export function ClubStatusPill({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'ok' | 'warn' | 'alert' | 'neutral' | 'accent';
}) {
  const { tokens } = useClubTheme();
  const color =
    tone === 'ok'
      ? tokens.success
      : tone === 'warn'
        ? tokens.warning
        : tone === 'alert'
          ? tokens.danger
          : tone === 'accent'
            ? tokens.accent
            : tokens.muted;
  const bg =
    tone === 'ok'
      ? tokens.successSoft
      : tone === 'warn'
        ? tokens.warningSoft
        : tone === 'alert'
          ? tokens.dangerSoft
          : tone === 'accent'
            ? tokens.accentSoft
            : tokens.elevated;
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: clubRadius.pill,
        backgroundColor: bg,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: `${color}33`,
      }}
    >
      <ClubText variant="caption" style={{ color, fontWeight: '700' }}>
        {label}
      </ClubText>
    </View>
  );
}

export function ClubEventBadge({ kind }: { kind: ClubEventKind }) {
  const tone = clubEventTone[kind];
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: clubRadius.xs,
        backgroundColor: tone.soft,
      }}
    >
      <ClubText variant="label" style={{ color: tone.color, fontSize: 9, letterSpacing: 0.9 }}>
        {tone.label}
      </ClubText>
    </View>
  );
}

export function ClubAvatar({
  label,
  uri,
  size = 40,
}: {
  label: string;
  uri?: string | null;
  size?: number;
}) {
  const { tokens } = useClubTheme();
  const initial = (label?.trim()?.charAt(0) || '?').toUpperCase();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        backgroundColor: tokens.accentSoft,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: tokens.border,
      }}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} />
      ) : (
        <ClubText variant="h3" style={{ color: tokens.accent, fontSize: size * 0.38 }}>
          {initial}
        </ClubText>
      )}
    </View>
  );
}

export function ClubButton({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: IconName;
  disabled?: boolean;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => buttonStyles(tokens), [tokens]);
  const style =
    variant === 'primary' ? styles.primary : variant === 'secondary' ? styles.secondary : styles.ghost;
  const color =
    variant === 'primary' ? tokens.onAccent : variant === 'secondary' ? tokens.accent : tokens.foreground;
  return (
    <PressableSpring
      onPress={onPress}
      disabled={disabled}
      scaleTo={0.97}
      haptic={!disabled}
      style={[style, disabled && { opacity: 0.5 }]}
    >
      {icon ? <Icon name={icon} size={16} color={color} /> : null}
      <ClubText variant="caption" style={{ color, fontWeight: '700' }}>
        {label}
      </ClubText>
    </PressableSpring>
  );
}

export function ClubSearchField({
  value,
  onChangeText,
  placeholder = 'Rechercher…',
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => searchStyles(tokens), [tokens]);
  return (
    <View style={styles.wrap}>
      <Icon name="search" size={16} color={tokens.faint} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={tokens.faint}
        style={styles.input}
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
      />
    </View>
  );
}

export function ClubSegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => segmentStyles(tokens), [tokens]);
  return (
    <View style={styles.track}>
      {options.map((opt) => {
        const on = opt.id === value;
        return (
          <PressableSpring
            key={opt.id}
            onPress={() => onChange(opt.id)}
            scaleTo={0.97}
            haptic
            style={[styles.item, on && styles.itemOn]}
          >
            <ClubText
              variant="caption"
              style={{
                fontWeight: on ? '700' : '600',
                color: on ? tokens.onAccent : tokens.muted,
              }}
            >
              {opt.label}
            </ClubText>
          </PressableSpring>
        );
      })}
    </View>
  );
}

/** Carte « smart » Accueil — gradient, chiffre fort, micro-entrée. */
export function ClubSmartCard({
  label,
  value,
  hint,
  icon,
  onPress,
  index = 0,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: IconName;
  onPress?: () => void;
  index?: number;
  tone?: 'default' | 'accent' | 'success' | 'warning' | 'pitch';
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => smartStyles(tokens), [tokens]);
  const wash =
    tone === 'accent'
      ? [tokens.accentSoft, tokens.surface]
      : tone === 'success'
        ? [tokens.successSoft, tokens.surface]
        : tone === 'warning'
          ? [tokens.warningSoft, tokens.surface]
          : tone === 'pitch'
            ? [tokens.pitchSoft, tokens.surface]
            : [tokens.headerWash, tokens.surface];
  const iconColor =
    tone === 'success'
      ? tokens.success
      : tone === 'warning'
        ? tokens.warning
        : tone === 'pitch'
          ? tokens.pitch
          : tokens.accent;

  return (
    <AnimatedEntrance kind="fadeUp" index={index} delayStep={48}>
      <PressableSpring onPress={onPress} disabled={!onPress} scaleTo={0.97} haptic={Boolean(onPress)} style={styles.press}>
        <LinearGradient colors={wash as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
          <View style={[styles.iconWrap, { backgroundColor: `${iconColor}18` }]}>
            <Icon name={icon} size={18} color={iconColor} />
          </View>
          <ClubText variant="label" muted>
            {label}
          </ClubText>
          <ClubText variant="stat" style={{ color: tokens.foreground }}>
            {value}
          </ClubText>
          {hint ? (
            <ClubText variant="caption" muted numberOfLines={2}>
              {hint}
            </ClubText>
          ) : null}
        </LinearGradient>
      </PressableSpring>
    </AnimatedEntrance>
  );
}

export function ClubSkeleton({ height = 72, style }: { height?: number; style?: StyleProp<ViewStyle> }) {
  const { tokens } = useClubTheme();
  const anim = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.85, duration: clubMotion.shimmer / 2, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.35, duration: clubMotion.shimmer / 2, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);
  return (
    <Animated.View
      style={[
        {
          height,
          borderRadius: clubRadius.lg,
          backgroundColor: tokens.elevated,
          opacity: anim,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: tokens.border,
        },
        style,
      ]}
    />
  );
}

export function ClubModalSurface({
  visible,
  onClose,
  children,
  title,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => modalStyles(tokens), [tokens]);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: tokens.scrim }]} />
        </Pressable>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          {title ? (
            <ClubText variant="h3" style={{ marginBottom: clubSpace.sm }}>
              {title}
            </ClubText>
          ) : null}
          {children}
        </View>
      </View>
    </Modal>
  );
}

export function ClubPresenceBar({
  present,
  total,
}: {
  present: number;
  total: number;
}) {
  const { tokens } = useClubTheme();
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <ClubText variant="caption" muted>
          Présence
        </ClubText>
        <ClubText variant="caption" style={{ fontWeight: '700', color: tokens.success }}>
          {present}/{total} · {pct}%
        </ClubText>
      </View>
      <View
        style={{
          height: 6,
          borderRadius: 3,
          backgroundColor: tokens.elevated,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: 3,
            backgroundColor: tokens.success,
          }}
        />
      </View>
    </View>
  );
}

export function ClubMatchScoreCard({
  title,
  when,
  onPress,
  index = 0,
}: {
  title: string;
  when: string;
  onPress?: () => void;
  index?: number;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => matchStyles(tokens), [tokens]);
  const parts = title.split(/\s+vs\.?\s+|\s+[–—-]\s+/i);
  const home = parts[0]?.trim() || title;
  const away = parts[1]?.trim() || 'Adversaire';

  return (
    <AnimatedEntrance kind="fadeUp" index={index} delayStep={40}>
      <PressableSpring onPress={onPress} scaleTo={0.98} haptic={Boolean(onPress)} style={styles.press}>
        <LinearGradient colors={[tokens.accentDeep, tokens.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
          <ClubEventBadge kind="match" />
          <View style={styles.scoreRow}>
            <View style={styles.side}>
              <ClubText variant="h3" numberOfLines={2} style={styles.onDark}>
                {home}
              </ClubText>
            </View>
            <View style={styles.scoreBox}>
              <ClubText variant="score" style={styles.onDark}>
                —
              </ClubText>
              <ClubText variant="caption" style={[styles.onDark, { opacity: 0.75 }]}>
                VS
              </ClubText>
              <ClubText variant="score" style={styles.onDark}>
                —
              </ClubText>
            </View>
            <View style={[styles.side, { alignItems: 'flex-end' }]}>
              <ClubText variant="h3" numberOfLines={2} style={[styles.onDark, { textAlign: 'right' }]}>
                {away}
              </ClubText>
            </View>
          </View>
          <ClubText variant="caption" style={[styles.onDark, { opacity: 0.8 }]}>
            {when}
          </ClubText>
        </LinearGradient>
      </PressableSpring>
    </AnimatedEntrance>
  );
}

const headerStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: clubSpace.md,
      paddingTop: clubSpace.sm,
      paddingBottom: clubSpace.xs,
    },
    textCol: { flex: 1, minWidth: 0, gap: 4 },
    sub: { marginTop: 2 },
  });

const emptyStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    box: {
      alignItems: 'flex-start',
      gap: clubSpace.sm,
      padding: clubSpace.lg,
      borderRadius: clubRadius.xl,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
      overflow: 'hidden',
      ...clubShadow.soft,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: clubRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.accentSoft,
    },
    body: { lineHeight: 20 },
    cta: {
      marginTop: clubSpace.sm,
      paddingHorizontal: clubSpace.md,
      paddingVertical: 10,
      borderRadius: clubRadius.sm,
      backgroundColor: tokens.accent,
      ...clubShadow.accent(tokens),
    },
  });

const cardStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    card: {
      backgroundColor: tokens.surface,
      borderRadius: clubRadius.xl,
      padding: clubSpace.lg,
      borderWidth: 1,
      borderColor: tokens.borderStrong,
      borderLeftWidth: 3,
      borderLeftColor: tokens.accent,
      gap: clubSpace.sm,
      ...clubShadow.card,
    },
    title: { marginBottom: 2, color: tokens.accent },
  });

const rowStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.sm,
      paddingVertical: clubSpace.sm,
    },
    icon: {
      width: 38,
      height: 38,
      borderRadius: clubRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.accentSoft,
    },
    col: { flex: 1, minWidth: 0, gap: 2 },
  });

const buttonStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    primary: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: clubSpace.lg,
      paddingVertical: 12,
      borderRadius: clubRadius.md,
      backgroundColor: tokens.accent,
      ...clubShadow.accent(tokens),
    },
    secondary: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: clubSpace.lg,
      paddingVertical: 12,
      borderRadius: clubRadius.md,
      backgroundColor: tokens.accentSoft,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    ghost: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: clubSpace.md,
      paddingVertical: 10,
      borderRadius: clubRadius.md,
    },
  });

const searchStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: clubSpace.md,
      paddingVertical: 12,
      borderRadius: clubRadius.lg,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
      ...clubShadow.soft,
    },
    input: {
      flex: 1,
      fontSize: 15,
      fontWeight: '500',
      color: tokens.foreground,
      padding: 0,
    },
  });

const segmentStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    track: {
      flexDirection: 'row',
      padding: 4,
      borderRadius: clubRadius.lg,
      backgroundColor: tokens.elevated,
      borderWidth: 1,
      borderColor: tokens.border,
      gap: 4,
    },
    item: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: clubRadius.md,
    },
    itemOn: {
      backgroundColor: tokens.accent,
      ...clubShadow.accent(tokens),
    },
  });

const smartStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    press: { flex: 1, minWidth: 148, borderRadius: clubRadius.xl },
    card: {
      borderRadius: clubRadius.xl,
      padding: clubSpace.md,
      gap: 6,
      borderWidth: 1,
      borderColor: tokens.border,
      minHeight: 128,
      ...clubShadow.card,
    },
    iconWrap: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
    },
  });

const modalStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: tokens.raised,
      borderTopLeftRadius: clubRadius.xxl,
      borderTopRightRadius: clubRadius.xxl,
      paddingHorizontal: clubSpace.lg,
      paddingTop: clubSpace.sm,
      paddingBottom: clubSpace.xxl,
      gap: clubSpace.xs,
      borderTopWidth: 1,
      borderColor: tokens.border,
      ...clubShadow.lift,
    },
    handle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: tokens.borderStrong,
      marginBottom: clubSpace.sm,
    },
  });

const matchStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    press: { borderRadius: clubRadius.xl },
    card: {
      borderRadius: clubRadius.xl,
      padding: clubSpace.lg,
      gap: clubSpace.md,
      ...clubShadow.lift,
    },
    scoreRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.sm,
    },
    side: { flex: 1, minWidth: 0 },
    scoreBox: { alignItems: 'center', gap: 2, paddingHorizontal: 8 },
    onDark: { color: tokens.onAccent },
  });
