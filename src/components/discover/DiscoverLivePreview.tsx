import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import type { RecruitmentPost } from '../../models/Player';
import { formatTimeAgo } from '../../services/recruitment.service';
import { DiscoverSectionHeader } from './DiscoverSectionHeader';
import { PressableSpring } from './PressableSpring';
import { Icon } from '../ui/Icon';
import { spacing, radius } from '../../theme/designTokens';
import { useDiscoverStyles } from './discoverStyles';
import type { AppColors } from '../../theme/universeTheme';

const CARD_W = Math.round(Dimensions.get('window').width * 0.78);

interface DiscoverLivePreviewProps {
  posts: RecruitmentPost[];
  loading: boolean;
  onPress: () => void;
  compact?: boolean;
}

export const DiscoverLivePreview: React.FC<DiscoverLivePreviewProps> = ({
  posts,
  loading,
  onPress,
  compact = false,
}) => {
  const { colors: c } = useDiscoverStyles();
  const styles = useMemo(() => createStyles(c), [c]);
  const hasContent = posts.length > 0;

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      {!compact ? (
        <DiscoverSectionHeader
          label="LIVE FIREBASE"
          title="Données réelles ProDay"
          subtitle="Annonces publiées sur la plateforme."
        />
      ) : (
        <Text style={styles.compactTitle}>Activité récente</Text>
      )}

      {loading ? (
        <ActivityIndicator color={c.brand} style={styles.loader} />
      ) : !hasContent ? (
        <View style={styles.empty}>
          <Icon name="football" size={28} color={c.textMuted} />
          <Text style={styles.emptyTitle}>Aucun contenu publié pour le moment</Text>
          <Text style={styles.emptySub}>
            Les annonces Mercato apparaîtront ici dès qu’un club les publiera.
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.subSection}>
            Mercato · {posts.length} annonce{posts.length > 1 ? 's' : ''} ouverte
            {posts.length > 1 ? 's' : ''}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rail}
          >
            {posts.map((ad) => (
              <PressableSpring key={ad.id} style={styles.adCard} onPress={onPress}>
                <View style={styles.adLogo}>
                  <Text style={styles.adLogoText}>{ad.club_name.charAt(0)}</Text>
                </View>
                <View style={styles.adBody}>
                  <Text style={styles.adClub}>{ad.club_name}</Text>
                  <Text style={styles.adTitle}>
                    {ad.title || `Recherche ${ad.position}`}
                  </Text>
                  <Text style={styles.adMeta}>
                    {ad.category} · {ad.level} · {ad.city}
                  </Text>
                  <Text style={styles.adFoot}>{formatTimeAgo(ad.created_at)}</Text>
                </View>
              </PressableSpring>
            ))}
          </ScrollView>
        </>
      )}
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: { marginTop: spacing.xl },
    wrapCompact: { marginTop: spacing.sm },
    compactTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: c.text,
      marginBottom: spacing.sm,
    },
    loader: { marginVertical: spacing.lg },
    empty: {
      marginHorizontal: spacing.lg,
      padding: spacing.xl,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: '900',
      color: c.text,
      marginTop: spacing.md,
      textAlign: 'center',
    },
    emptySub: {
      fontSize: 13,
      lineHeight: 19,
      color: c.textSecondary,
      marginTop: spacing.sm,
      textAlign: 'center',
    },
    subSection: {
      fontSize: 11,
      fontWeight: '800',
      color: c.brand,
      letterSpacing: 0.8,
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.sm,
    },
    rail: { paddingHorizontal: spacing.lg, gap: spacing.md, paddingBottom: spacing.xs },
    adCard: {
      width: CARD_W,
      flexDirection: 'row',
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.md,
      gap: spacing.md,
    },
    adLogo: {
      width: 52,
      height: 52,
      borderRadius: radius.sm,
      backgroundColor: c.surfaceInverse,
      alignItems: 'center',
      justifyContent: 'center',
    },
    adLogoText: { fontSize: 22, fontWeight: '900', color: c.brandInverse },
    adBody: { flex: 1 },
    adClub: { fontSize: 11, fontWeight: '800', color: c.textMuted },
    adTitle: { fontSize: 16, fontWeight: '900', color: c.text, marginTop: 2 },
    adMeta: { fontSize: 12, color: c.textSecondary, marginTop: 4 },
    adFoot: { fontSize: 11, fontWeight: '700', color: c.brand, marginTop: 6 },
  });
}
