import React, { useEffect, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
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
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableSpring, AnimatedEntrance } from '../../../components/motion';
import { ProDayText } from '../../../components/ui/ProDayText';
import { Icon } from '../../../components/ui/Icon';
import type { IconName } from '../../../components/ui/iconNames';
import { useClubTheme } from '../shell/ClubThemeContext';
import type { ClubThemeTokens } from '../theme/clubTokens';
import { tabBarScrollInset } from '../../../navigation/tabBarLayout';
import {
  clubEventTone,
  clubForm,
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
        paddingTop: clubSpace.md,
        paddingBottom: tabBarScrollInset({ extra: clubSpace.xl }),
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
    <View style={styles.box} testID="club-empty-state">
      <Icon name={icon} size={26} color={tokens.muted} />
      <ClubText variant="h3" style={styles.title}>
        {title}
      </ClubText>
      <ClubText variant="body" muted style={styles.body}>
        {body}
      </ClubText>
      {actionLabel && onAction ? (
        <PressableSpring
          onPress={onAction}
          scaleTo={0.97}
          haptic
          style={styles.cta}
          testID="club-empty-cta"
        >
          <ClubText variant="body" style={styles.ctaLabel}>
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
  subtitle,
  children,
  style,
}: {
  title?: string;
  subtitle?: string;
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
      {subtitle ? (
        <ClubText variant="caption" muted style={{ marginTop: 2, marginBottom: 8 }}>
          {subtitle}
        </ClubText>
      ) : null}
      {children}
    </View>
  );
}

/**
 * Ligne de réglage — forme de la référence Apple Fitness : icône en contour,
 * libellé large, chevron fin gris à droite. Aucun fond d'icône, aucune couleur
 * d'accent sur la ligne : l'accent reste réservé à l'action et à l'état actif.
 */
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
      testID="club-action-row"
    >
      {icon ? (
        <Icon
          name={icon}
          size={clubForm.rowIconSize}
          color={onPress ? tokens.foreground : tokens.muted}
        />
      ) : null}
      <View style={styles.col}>
        <ClubText variant="body" style={styles.label}>
          {label}
        </ClubText>
        {hint ? (
          <ClubText variant="caption" muted numberOfLines={2}>
            {hint}
          </ClubText>
        ) : null}
      </View>
      {trailing ??
        (onPress ? (
          <Icon name="chevron-forward" size={clubForm.chevronSize} color={tokens.faint} />
        ) : null)}
    </PressableSpring>
  );
}

/**
 * Liste groupée en encart — motif central de la référence (« Moi ») : un seul
 * conteneur arrondi par groupe, lignes séparées par un filet **en retrait**, et
 * jamais de bordure ni d'ombre. Les écarts entre groupes viennent du parent.
 */
export function ClubListGroup({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => groupStyles(tokens), [tokens]);
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={[styles.group, style]} testID="club-list-group">
      {items.map((child, index) => (
        <View key={index}>
          {child}
          {index < items.length - 1 ? (
            <View style={styles.separator} testID="club-list-separator" />
          ) : null}
        </View>
      ))}
    </View>
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
  /**
   * Pastille pleine (« ULTIMATE » sur la référence) : aplat d'accent, libellé
   * sur contraste. Réservée aux états binaires forts (vérifié, abonné, actif).
   */
  filled,
}: {
  label: string;
  tone?: 'ok' | 'warn' | 'alert' | 'neutral' | 'accent';
  filled?: boolean;
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
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: clubRadius.pill,
        backgroundColor: filled ? color : bg,
        borderWidth: filled ? 0 : StyleSheet.hairlineWidth,
        borderColor: filled ? 'transparent' : `${color}44`,
      }}
      testID={filled ? 'club-status-pill-filled' : undefined}
    >
      {!filled && (tone === 'ok' || tone === 'accent') ? (
        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />
      ) : null}
      <ClubText variant="caption" style={{ color: filled ? tokens.onAccent : color, fontWeight: '700' }}>
        {label}
      </ClubText>
    </View>
  );
}

/**
 * En-tête de section — motif de la référence : libellé en capitales à gauche,
 * action alignée à droite avec son chevron (« Tous les clubs › », « Voir tout › »).
 * Le libellé reste au premier plan (pas d'accent décoratif).
 */
export function ClubSectionHeader({
  label,
  actionLabel,
  onAction,
}: {
  label: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => sectionHeaderStyles(tokens), [tokens]);
  return (
    <View style={styles.wrap} testID="club-section-header">
      <ClubText variant="label" style={styles.label}>
        {label}
      </ClubText>
      {actionLabel && onAction ? (
        <PressableSpring
          onPress={onAction}
          scaleTo={0.97}
          haptic
          style={styles.action}
          accessibilityRole="button"
          // La référence pose une action **texte** compacte (21 px de haut) : sans
          // élargissement tactile elle tombe sous les 44 px recommandés. Le hitSlop
          // agrandit la cible sans toucher à la mise en page.
          hitSlop={SECTION_ACTION_HIT_SLOP}
          testID="club-section-action"
        >
          <ClubText variant="body" style={styles.actionLabel}>
            {actionLabel}
          </ClubText>
          <Icon name="chevron-forward" size={16} color={tokens.foreground} />
        </PressableSpring>
      ) : null}
    </View>
  );
}

/**
 * Puce d'action — motif de la référence : rangée horizontale de pilules sous
 * l'encart d'identité (« Appeler · Facebook · Instagram · TikTok »).
 * `filled` = pilule sur fond élevé (actions de contact) ; `outline` = contour fin.
 */
export function ClubPill({
  label,
  icon,
  onPress,
  variant = 'filled',
  active = false,
}: {
  label: string;
  icon?: IconName;
  onPress?: () => void;
  variant?: 'filled' | 'outline';
  /** Puce sélectionnée : contour d'accent + libellé accent. */
  active?: boolean;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => pillStyles(tokens), [tokens]);
  return (
    <PressableSpring
      onPress={onPress}
      disabled={!onPress}
      scaleTo={0.96}
      haptic={Boolean(onPress)}
      style={[
        styles.pill,
        (variant === 'outline' || active) && styles.pillOutline,
        active && styles.pillActive,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      testID="club-pill"
    >
      {icon ? (
        <Icon name={icon} size={17} color={active ? tokens.accent : tokens.foreground} />
      ) : null}
      <ClubText variant="body" style={[styles.pillLabel, active && styles.pillLabelActive]}>
        {label}
      </ClubText>
    </PressableSpring>
  );
}

/** Rangée de puces — défile horizontalement et sort du cadre (référence). */
export function ClubPillRow({ children }: { children: React.ReactNode }) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => pillStyles(tokens), [tokens]);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      testID="club-pill-row"
    >
      {children}
    </ScrollView>
  );
}

/**
 * Carte visuelle — motif de la référence : visuel plein cadre, titre en
 * surimpression, badge plein optionnel (« LE SHOP », « BALANCE CONNECTÉE »).
 * Sans visuel réel fourni, la carte ne s'affiche pas : aucun faux média.
 */
export function ClubFeatureCard({
  title,
  subtitle,
  imageUri,
  badge,
  onPress,
}: {
  title: string;
  subtitle?: string;
  imageUri?: string | null;
  badge?: string;
  onPress?: () => void;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => featureStyles(tokens), [tokens]);
  if (!imageUri) return null;
  return (
    <PressableSpring
      onPress={onPress}
      disabled={!onPress}
      scaleTo={0.98}
      haptic={Boolean(onPress)}
      style={styles.card}
      testID="club-feature-card"
    >
      <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
      <View style={styles.scrim} pointerEvents="none" />
      <View style={styles.body}>
        {badge ? <ClubStatusPill label={badge} tone="accent" filled /> : null}
        <ClubText variant="h2" style={styles.title} numberOfLines={2}>
          {title}
        </ClubText>
        {subtitle ? (
          <ClubText variant="caption" style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </ClubText>
        ) : null}
      </View>
    </PressableSpring>
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
        borderRadius: size / 2,
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
  layout = 'row',
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  icon?: IconName;
  disabled?: boolean;
  /** `tile` = icône au-dessus du label (actions équipe outline). */
  layout?: 'row' | 'tile';
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => buttonStyles(tokens), [tokens]);
  const style =
    variant === 'primary'
      ? styles.primary
      : variant === 'secondary'
        ? styles.secondary
        : variant === 'outline'
          ? layout === 'tile'
            ? styles.outlineTile
            : styles.outline
          : styles.ghost;
  const color =
    variant === 'primary'
      ? tokens.onAccent
      : variant === 'secondary'
        ? tokens.accent
        : tokens.foreground;
  const iconSize = layout === 'tile' ? 22 : 16;
  return (
    <PressableSpring
      onPress={onPress}
      disabled={disabled}
      scaleTo={0.97}
      haptic={!disabled}
      style={[style, disabled && { opacity: 0.5 }]}
    >
      {icon ? <Icon name={icon} size={iconSize} color={color} /> : null}
      <ClubText
        variant="caption"
        style={{
          color,
          fontWeight: '700',
          textAlign: layout === 'tile' ? 'center' : 'left',
        }}
      >
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
      <Icon name="search" size={18} color={tokens.muted} />
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
            style={[styles.item, on && [styles.itemOn, { borderColor: tokens.accent }]]}
            testID={on ? 'club-chip-active' : 'club-chip'}
          >
            <ClubText
              variant="caption"
              style={{
                fontSize: 14,
                fontWeight: on ? '700' : '500',
                color: on ? tokens.accent : tokens.foreground,
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
  /**
   * Forme de la référence : pas de dégradé, pas de barre décorative, pas de
   * pastille teintée. La tonalité ne colore plus que l'icône (sémantique), le
   * reste de la carte reste une surface neutre.
   */
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
        <View style={styles.card}>
          <Icon name={icon} size={20} color={iconColor} />
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
        </View>
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

/**
 * État vide — forme de la référence : panneau arrondi légèrement plus clair que
 * le canvas, contenu **centré**, aucun dégradé, et action en pilule à contour.
 */
const emptyStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    box: {
      alignItems: 'center',
      gap: clubSpace.sm,
      paddingVertical: clubSpace.xl,
      paddingHorizontal: clubSpace.lg,
      borderRadius: clubForm.groupRadius,
      backgroundColor: tokens.surface,
      overflow: 'hidden',
    },
    title: { textAlign: 'center' },
    body: { lineHeight: 21, textAlign: 'center' },
    cta: {
      marginTop: clubSpace.md,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: clubSpace.xl,
      minHeight: clubForm.actionMinHeight,
      borderRadius: clubForm.actionRadius,
      borderWidth: clubForm.actionBorderWidth,
      borderColor: tokens.borderStrong,
      backgroundColor: 'transparent',
    },
    ctaLabel: { color: tokens.foreground, fontWeight: '600' },
  });

/** Conteneur de liste groupée — encart arrondi sans bordure, filets en retrait. */
const groupStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    group: {
      backgroundColor: tokens.surface,
      borderRadius: clubForm.groupRadius,
      paddingHorizontal: clubForm.groupPaddingH,
      overflow: 'hidden',
    },
    separator: {
      height: clubForm.separatorThickness,
      backgroundColor: tokens.border,
      marginLeft: clubForm.separatorInset,
    },
  });

/**
 * Encart de section — forme de la référence : aplat plus clair que le canvas,
 * rayon généreux, ni bordure ni ombre (la surface suffit à détacher la carte).
 */
const cardStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    card: {
      backgroundColor: tokens.surface,
      borderRadius: clubForm.groupRadius,
      padding: clubSpace.lg,
      gap: clubSpace.sm,
    },
    title: { marginBottom: 2, color: tokens.muted },
  });

const rowStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubForm.rowGap,
      minHeight: clubForm.rowMinHeight,
      paddingVertical: clubSpace.sm,
    },
    label: { fontSize: 17, fontWeight: '500', lineHeight: 22 },
    col: { flex: 1, minWidth: 0, gap: 2 },
  });

const buttonStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    primary: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: clubSpace.xl,
      minHeight: clubForm.actionMinHeight,
      borderRadius: clubForm.actionRadius,
      backgroundColor: tokens.accent,
      ...clubShadow.accent(tokens),
    },
    secondary: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: clubSpace.xl,
      minHeight: clubForm.actionMinHeight,
      borderRadius: clubForm.actionRadius,
      backgroundColor: tokens.accentSoft,
      borderWidth: 1,
      borderColor: tokens.borderStrong,
    },
    ghost: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: clubSpace.md,
      paddingVertical: 10,
      borderRadius: clubForm.actionRadius,
    },
    /** Bouton secondaire de la référence : pilule, contour fin, sans remplissage. */
    outline: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingHorizontal: clubSpace.xl,
      borderRadius: clubForm.actionRadius,
      backgroundColor: 'transparent',
      borderWidth: clubForm.actionBorderWidth,
      borderColor: tokens.borderStrong,
      minHeight: clubForm.actionMinHeight,
    },
    outlineTile: {
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingHorizontal: clubSpace.md,
      paddingVertical: clubSpace.lg,
      borderRadius: clubForm.groupRadius,
      backgroundColor: 'transparent',
      borderWidth: clubForm.actionBorderWidth,
      borderColor: tokens.borderStrong,
      minHeight: 96,
    },
  });

/**
 * Champ de recherche — forme de la référence : pleine largeur, **sans bordure**,
 * sur le fond élevé, rayon modéré et hauteur confortable.
 */
const searchStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: clubSpace.lg,
      minHeight: clubForm.fieldHeight,
      borderRadius: clubForm.fieldRadius,
      backgroundColor: tokens.elevated,
    },
    input: {
      flex: 1,
      fontSize: 16,
      fontWeight: '400',
      color: tokens.foreground,
      padding: 0,
    },
  });

/**
 * Puces de filtre — forme de la référence : pilules sur le canvas, et une
 * sélection qui passe au **contour d'accent** avec libellé accent, jamais un
 * remplissage plein. Le rang reste en colonnes égales (pas de scroll horizontal)
 * pour ne pas casser les écrans qui l'utilisent dans une carte.
 */
const segmentStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    track: {
      flexDirection: 'row',
      gap: clubForm.chipGap,
      backgroundColor: 'transparent',
    },
    item: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: clubForm.chipHeight,
      borderRadius: clubForm.chipRadius,
      backgroundColor: tokens.elevated,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    /**
     * Puce sélectionnée (référence) : le **remplissage disparaît** au profit du
     * seul contour d'accent — l'état actif se lit sur le contour, pas sur l'aplat.
     */
    itemOn: {
      backgroundColor: 'transparent',
    },
  });

/** Carte indicateur — forme de la référence : aplat neutre, rayon 22, pas de dégradé. */
const smartStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    press: { flex: 1, minWidth: 148, borderRadius: clubForm.groupRadius },
    card: {
      borderRadius: clubForm.groupRadius,
      padding: clubSpace.lg,
      gap: clubSpace.sm,
      minHeight: 128,
      backgroundColor: tokens.surface,
    },
  });

/** En-tête de section — libellé capitales + action alignée à droite. */
/**
 * Zone tactile des actions de section : la cible visuelle reste celle de la
 * référence, la cible réelle atteint 44 px de haut.
 */
export const SECTION_ACTION_HIT_SLOP = { top: 12, bottom: 12, left: 10, right: 10 } as const;

const sectionHeaderStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: clubSpace.md,
      paddingTop: clubSpace.sm,
      paddingBottom: clubSpace.xs,
    },
    label: { color: tokens.foreground, flexShrink: 1 },
    action: { flexDirection: 'row', alignItems: 'center', gap: 2, flexShrink: 0 },
    actionLabel: { color: tokens.foreground, fontWeight: '600', fontSize: 15 },
  });

/** Puce d'action — pilule de la référence, sur rangée défilante. */
const pillStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: clubForm.chipGap,
      alignItems: 'center',
      paddingRight: clubSpace.lg,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: clubSpace.lg,
      minHeight: clubForm.chipHeight,
      borderRadius: clubForm.chipRadius,
      backgroundColor: tokens.elevated,
    },
    pillOutline: {
      backgroundColor: 'transparent',
      borderWidth: clubForm.actionBorderWidth,
      borderColor: tokens.borderStrong,
    },
    pillLabel: { color: tokens.foreground, fontWeight: '600', fontSize: 15 },
    /**
     * Puce sélectionnée (référence) : le remplissage disparaît au profit du seul
     * **contour d'accent** — l'état actif se lit sur le contour, jamais sur l'aplat.
     */
    pillActive: { borderColor: tokens.accent },
    pillLabelActive: { color: tokens.accent, fontWeight: '700' },
  });

/** Carte visuelle — visuel plein cadre, surimpression sombre, titre en clair. */
const featureStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    card: {
      borderRadius: clubForm.groupRadius,
      overflow: 'hidden',
      height: 168,
      justifyContent: 'flex-end',
      backgroundColor: tokens.elevated,
    },
    image: { ...StyleSheet.absoluteFillObject },
    scrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.42)',
    },
    body: { padding: clubSpace.lg, gap: clubSpace.xs },
    title: { color: '#FFFFFF' },
    subtitle: { color: 'rgba(255,255,255,0.82)' },
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
