import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import type { RecruitmentPost } from '../../models/Player';
import type { Tournament, TournamentStatus } from '../../models/Tournament';
import { formatTimeAgo } from '../../services/recruitment.service';
import { DiscoverSectionHeader } from './DiscoverSectionHeader';
import { PressableSpring } from './PressableSpring';
import { Icon } from '../ui/Icon';
import { colors, spacing, radius } from '../../theme/designTokens';

const CARD_W = Math.round(Dimensions.get('window').width * 0.78);

const TOURNAMENT_STATUS: Record<TournamentStatus, string> = {
  OPEN: 'Inscriptions ouvertes',
  IN_PROGRESS: 'En cours',
  FINISHED: 'Terminé',
};

function formatEventDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function formatEventRange(start: Date, end: Date): string {
  const sameDay = start.toDateString() === end.toDateString();
  if (sameDay) return formatEventDate(start);
  return `${formatEventDate(start)} – ${formatEventDate(end)}`;
}

interface DiscoverLivePreviewProps {
  posts: RecruitmentPost[];
  tournaments: Tournament[];
  loading: boolean;
  onPress: () => void;
}

export const DiscoverLivePreview: React.FC<DiscoverLivePreviewProps> = ({
  posts,
  tournaments,
  loading,
  onPress,
}) => {
  const hasContent = posts.length > 0 || tournaments.length > 0;

  return (
    <View style={styles.wrap}>
      <DiscoverSectionHeader
        label="LIVE FIREBASE"
        title="Données réelles ProDay"
        subtitle="Annonces et tournois publiés sur la plateforme."
      />

      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : !hasContent ? (
        <View style={styles.empty}>
          <Icon name="football" size={28} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Aucun contenu publié pour le moment</Text>
          <Text style={styles.emptySub}>
            Les annonces Mercato et tournois Arena apparaîtront ici dès qu’un club ou
            organisateur les publiera.
          </Text>
        </View>
      ) : (
        <>
          {posts.length > 0 ? (
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
          ) : null}

          {tournaments.length > 0 ? (
            <>
              <Text style={[styles.subSection, styles.mt]}>
                Arena · {tournaments.length} tournoi{tournaments.length > 1 ? 's' : ''}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.rail}
              >
                {tournaments.map((t) => {
                  const clubs = t.subscriber_uids?.length ?? 0;
                  return (
                    <PressableSpring key={t.id} style={styles.tCard} onPress={onPress}>
                      <View style={styles.tHeader}>
                        <Icon name="trophy" size={22} color={colors.accent} variant="filled" />
                      </View>
                      <View style={styles.tBody}>
                        <Text style={styles.tName}>{t.name}</Text>
                        <Text style={styles.tMeta}>
                          {t.city} · {formatEventRange(t.date_start, t.date_end)}
                        </Text>
                        <Text style={styles.tCats}>{t.categories.join(' · ')}</Text>
                        <View style={styles.tRow}>
                          <Icon name="people" size={14} color={colors.textMuted} />
                          <Text style={styles.tStat}>
                            {clubs} club{clubs !== 1 ? 's' : ''}
                          </Text>
                          <View style={styles.tPill}>
                            <Text style={styles.tPillText}>
                              {TOURNAMENT_STATUS[t.status]}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </PressableSpring>
                  );
                })}
              </ScrollView>
            </>
          ) : null}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.xl },
  loader: { marginVertical: spacing.lg },
  empty: {
    marginHorizontal: spacing.lg,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.text,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  subSection: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 0.8,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  mt: { marginTop: spacing.lg },
  rail: { paddingHorizontal: spacing.lg, gap: spacing.md, paddingBottom: spacing.xs },
  adCard: {
    width: CARD_W,
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  adLogo: {
    width: 52,
    height: 52,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceInverse,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adLogoText: { fontSize: 22, fontWeight: '900', color: colors.brandInverse },
  adBody: { flex: 1 },
  adClub: { fontSize: 11, fontWeight: '800', color: colors.textMuted },
  adTitle: { fontSize: 16, fontWeight: '900', color: colors.text, marginTop: 2 },
  adMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  adFoot: { fontSize: 11, fontWeight: '700', color: colors.brand, marginTop: 6 },
  tCard: {
    width: CARD_W * 0.92,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  tHeader: {
    height: 56,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tBody: { padding: spacing.md },
  tName: { fontSize: 15, fontWeight: '900', color: colors.text },
  tMeta: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  tCats: { fontSize: 12, fontWeight: '700', color: colors.brand, marginTop: 4 },
  tRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm },
  tStat: { flex: 1, fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  tPill: {
    backgroundColor: colors.brandSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  tPillText: { fontSize: 9, fontWeight: '800', color: colors.brand },
});
