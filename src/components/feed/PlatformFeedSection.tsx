import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import type { User, UserRole } from '../../models/User';
import type { PlatformFeedPost } from '../../models/PlatformFeed';
import { platformFeedService } from '../../services/platformFeed.service';
import { PressableSpring, SkeletonList } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { useTranslation } from '../../context/LocaleContext';
import { useAppTheme } from '../../context/ProductLineContext';

function roleLabel(
  role: UserRole,
  isWoman: boolean,
  t: (key: string) => string
): string {
  if (role === 'player' && isWoman) return t('role.player.woman');
  const key = `role.${role}`;
  const value = t(key);
  return value === key ? role : value;
}

interface PlatformFeedSectionProps {
  profile: User;
}

export const PlatformFeedSection: React.FC<PlatformFeedSectionProps> = ({ profile }) => {
  const { t, locale } = useTranslation();
  const { colors: c, isWoman } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const [posts, setPosts] = useState<PlatformFeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const list = await platformFeedService.listForUser(profile.role);
      setPosts(list.slice(0, 5));
    } finally {
      setLoading(false);
    }
  }, [profile.role]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.section}>
        <SkeletonList count={2} variant="card" />
      </View>
    );
  }

  if (posts.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Icon name="document" size={16} color={c.brand} />
        <ProDayText variant="caption" style={styles.sectionTitle}>
          {t('feed.section.news')}
        </ProDayText>
      </View>

      {posts.map((item) => (
        <PressableSpring
          key={item.id}
          style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}
          onPress={() => prodayHaptics.press()}
          scaleTo={0.99}
          haptic
        >
          <View style={styles.cardHead}>
            <View style={[styles.typePill, { backgroundColor: c.brandSoft }]}>
              <ProDayText variant="caption" style={{ color: c.brand, fontWeight: '800' }}>
                {item.type === 'poll' ? t('feed.post.type.poll') : t('feed.post.type.news')}
              </ProDayText>
            </View>
            <ProDayText variant="caption" muted>
              {item.created_at.toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
            </ProDayText>
          </View>
          <ProDayText variant="body" style={[styles.cardTitle, { color: c.text }]}>
            {item.title}
          </ProDayText>
          {item.body ? (
            <ProDayText variant="caption" muted numberOfLines={2} style={styles.cardBody}>
              {item.body}
            </ProDayText>
          ) : null}
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.cardImage} resizeMode="cover" />
          ) : null}
          <ProDayText variant="caption" muted>
            {item.author_name} · {roleLabel(item.author_role, isWoman, t)}
          </ProDayText>
        </PressableSpring>
      ))}
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    section: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
      gap: spacing.sm,
    },
    sectionHead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: spacing.xs,
    },
    sectionTitle: {
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      color: c.textMuted,
    },
    card: {
      borderWidth: 1,
      borderRadius: radius.md,
      padding: spacing.md,
      gap: spacing.xs,
    },
    cardHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    typePill: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: radius.pill,
    },
    cardTitle: { fontWeight: '800', lineHeight: 22 },
    cardBody: { lineHeight: 18 },
    cardImage: {
      width: '100%',
      height: 140,
      borderRadius: radius.sm,
      backgroundColor: c.surfaceMuted,
      marginTop: spacing.xs,
    },
  });
}
