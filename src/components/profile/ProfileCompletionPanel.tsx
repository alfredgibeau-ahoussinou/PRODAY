import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { PressableSpring, StaggerReveal } from '../motion';
import Svg, { Circle } from 'react-native-svg';
import type { User } from '../../models/User';
import { getProfileCompletion, type ProfileCompletionItem } from '../../utils/profileCompletion';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { ProDayGradient } from '../ui/ProDayGradient';
import { Icon, type IconName } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { isProfileMobile, profileType } from './profileTypography';
import { spacing, radius } from '../../theme/designTokens';

interface ProfileCompletionPanelProps {
  user: User;
  onCompletePress?: () => void;
  onItemPress?: (itemId: string) => void;
}

const ITEM_ICONS: Record<string, IconName> = {
  name: 'person',
  city: 'location',
  avatar: 'person',
  position: 'football',
  category: 'shirt',
  level: 'trophy',
  stats: 'star',
  bio: 'document',
  videos: 'time',
  media: 'image',
  diploma: 'school',
  specialties: 'briefcase',
  club: 'people',
};

function iconForItem(id: string): IconName {
  return ITEM_ICONS[id] ?? 'checkmark-circle';
}

function ProgressRing({
  percent,
  size,
  stroke,
  color,
  trackColor,
}: {
  percent: number;
  size: number;
  stroke: number;
  color: string;
  trackColor: string;
}) {
  const radiusPx = (size - stroke) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radiusPx;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={center}
        cy={center}
        r={radiusPx}
        stroke={trackColor}
        strokeWidth={stroke}
        fill="none"
      />
      <Circle
        cx={center}
        cy={center}
        r={radiusPx}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        rotation={-90}
        origin={`${center}, ${center}`}
      />
    </Svg>
  );
}

const TaskRow: React.FC<{
  item: ProfileCompletionItem;
  onPress?: () => void;
}> = ({ item, onPress }) => {
  const { colors } = useAppTheme();
  const icon = iconForItem(item.id);

  const content = (
    <>
      <View style={[styles.taskIcon, { backgroundColor: colors.accentSoft }]}>
        <Icon name={icon} size={18} color={colors.accent} variant="filled" />
      </View>
      <View style={styles.taskCopy}>
        <ProDayText variant="caption" style={profileType.menuTitle}>
          {item.label}
        </ProDayText>
      </View>
      <Icon name="chevron-forward" size={16} color={colors.textMuted} />
    </>
  );

  if (!onPress) {
    return (
      <View style={[styles.taskRow, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}>
        {content}
      </View>
    );
  }

  return (
    <PressableSpring
      style={[styles.taskRow, { borderColor: colors.border, backgroundColor: colors.surface }]}
      onPress={onPress}
      scaleTo={0.97}
      haptic
    >
      {content}
    </PressableSpring>
  );
};

export const ProfileCompletionPanel: React.FC<ProfileCompletionPanelProps> = ({
  user,
  onCompletePress,
  onItemPress,
}) => {
  const { colors } = useAppTheme();
  const { percent, items } = useMemo(() => getProfileCompletion(user), [user]);
  const pending = items.filter((i) => !i.done);
  const doneCount = items.filter((i) => i.done).length;

  if (percent >= 100) {
    return (
      <ProDaySurface variant="accent" style={styles.doneWrap}>
        <View style={[styles.doneIcon, { backgroundColor: colors.accentSoft }]}>
          <Icon name="checkmark-circle" size={28} color={colors.accent} variant="filled" />
        </View>
        <ProDayText variant="section" accent style={styles.doneTitle}>
          Profil complet
        </ProDayText>
        <ProDayText variant="caption" muted style={styles.doneSub}>
          Tous les critères ProDay sont remplis. Bravo !
        </ProDayText>
      </ProDaySurface>
    );
  }

  const ringSize = isProfileMobile ? 76 : 68;

  return (
    <ProDaySurface variant="module" style={[styles.wrap, { borderColor: colors.border }]}>
      <View style={[styles.hero, isProfileMobile && styles.heroMobile]}>
        <View style={styles.ringWrap}>
          <ProgressRing
            percent={percent}
            size={ringSize}
            stroke={5}
            color={colors.accent}
            trackColor={colors.surfaceMuted}
          />
          <View style={styles.ringLabel}>
            <ProDayText variant="section" accent style={styles.percent}>
              {percent}%
            </ProDayText>
          </View>
        </View>

        <View style={[styles.heroCopy, isProfileMobile && styles.heroCopyMobile]}>
          <ProDayText variant="eyebrow" accent style={profileType.eyebrow}>
            Complétion du profil
          </ProDayText>
          <ProDayText variant="body" muted style={isProfileMobile ? styles.heroSubCenter : undefined}>
            {pending.length === 1
              ? '1 étape restante pour booster votre visibilité'
              : `${pending.length} étapes restantes pour booster votre visibilité`}
          </ProDayText>
          <ProDayText variant="caption" muted>
            {doneCount}/{items.length} critères validés
          </ProDayText>
        </View>
      </View>

      <View style={styles.list}>
        {pending.map((item) => (
          <TaskRow
            key={item.id}
            item={item}
            onPress={
              onItemPress || onCompletePress
                ? () => (onItemPress ? onItemPress(item.id) : onCompletePress?.())
                : undefined
            }
          />
        ))}
      </View>

      {onCompletePress ? (
        <PressableSpring onPress={onCompletePress} scaleTo={0.96} haptic>
          <ProDayGradient kind="cta" style={styles.cta}>
            <ProDayText variant="caption" inverse style={styles.ctaText}>
              Compléter mon profil
            </ProDayText>
            <Icon name="chevron-forward" size={16} color="#FFFFFF" />
          </ProDayGradient>
        </PressableSpring>
      ) : null}
    </ProDaySurface>
  );
};

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    marginBottom: spacing.sm,
    gap: spacing.md,
    padding: spacing.md,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heroMobile: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  ringWrap: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringLabel: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percent: {
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 22,
  },
  heroCopy: { flex: 1, gap: 4, minWidth: 0 },
  heroCopyMobile: { alignItems: 'center', flex: 0 },
  heroSubCenter: { textAlign: 'center' },
  list: { gap: spacing.xs },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  taskIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCopy: { flex: 1, gap: 2, minWidth: 0 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
  },
  ctaText: { fontWeight: '800' },
  doneWrap: {
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    padding: spacing.lg,
  },
  doneIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  doneTitle: { fontWeight: '900', textAlign: 'center' },
  doneSub: { textAlign: 'center' },
});
