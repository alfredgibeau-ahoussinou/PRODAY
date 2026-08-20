import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { useTranslation } from '../../context/LocaleContext';
import { SUPPORTER_SITE } from '../../content/supporterPageIdentity';
import { spacing } from '../../theme/designTokens';
import { clubsService } from '../../services/clubs.service';
import { externalScoresService } from '../../services/externalScores.service';
import { worldFollowTargetForTeam } from '../../utils/supporterWorldFollows';

export type ClubSearchHit = {
  id: string;
  label: string;
  meta?: string;
  kind: 'proday' | 'world';
};

export type SupporterClubSearchProps = {
  followedIds: Set<string>;
  onToggle: (id: string, label: string) => void;
  compact?: boolean;
};

export const SupporterClubSearch: React.FC<SupporterClubSearchProps> = ({
  followedIds,
  onToggle,
  compact = false,
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<ClubSearchHit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    let cancelled = false;
    if (q.length < 2) {
      setHits([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      void Promise.all([
        clubsService.searchByName(q).catch(() => []),
        externalScoresService.searchTeams(q).catch(() => []),
      ]).then(([clubs, teams]) => {
        if (cancelled) return;
        const proday: ClubSearchHit[] = clubs.slice(0, 8).map((club) => ({
          id: club.id,
          label: club.name,
          meta: club.city,
          kind: 'proday',
        }));
        const world: ClubSearchHit[] = teams.slice(0, 8).map((team) => {
          const target = worldFollowTargetForTeam({
            apiTeamId: team.apiTeamId,
            name: team.name,
          });
          return {
            id: target.id,
            label: team.name,
            meta: team.country,
            kind: 'world',
          };
        });
        const seen = new Set<string>();
        const merged: ClubSearchHit[] = [];
        for (const hit of [...proday, ...world]) {
          if (seen.has(hit.id)) continue;
          seen.add(hit.id);
          merged.push(hit);
        }
        setHits(merged.slice(0, 10));
        setLoading(false);
      });
    }, 280);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const placeholder = t('supporter.search.clubPlaceholder');
  const showResults = query.trim().length >= 2;

  const empty = useMemo(
    () => showResults && !loading && hits.length === 0,
    [showResults, loading, hits.length],
  );

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={placeholder}
        placeholderTextColor={SUPPORTER_SITE.muted}
        autoCorrect={false}
        autoCapitalize="none"
        style={styles.input}
      />
      {loading ? <ActivityIndicator color={SUPPORTER_SITE.accent} style={styles.spinner} /> : null}
      {empty ? (
        <ProDayText variant="caption" style={styles.empty}>
          {t('supporter.search.empty')}
        </ProDayText>
      ) : null}
      {hits.map((hit) => {
        const followed = followedIds.has(hit.id);
        return (
          <PressableSpring
            key={hit.id}
            onPress={() => onToggle(hit.id, hit.label)}
            scaleTo={0.98}
            style={styles.row}
          >
            <View style={styles.rowCopy}>
              <ProDayText variant="section" style={styles.name}>
                {hit.label}
              </ProDayText>
              <ProDayText variant="caption" style={styles.meta}>
                {hit.kind === 'proday'
                  ? t('supporter.search.kind.proday')
                  : t('supporter.search.kind.world')}
                {hit.meta ? ` · ${hit.meta}` : ''}
              </ProDayText>
            </View>
            <ProDayText variant="caption" style={styles.action}>
              {followed ? t('supporter.match.action.following') : t('supporter.match.action.follow')}
            </ProDayText>
          </PressableSpring>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: 4 },
  wrapCompact: { gap: 2 },
  input: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SUPPORTER_SITE.border,
    color: SUPPORTER_SITE.foreground,
    paddingVertical: spacing.sm,
    fontSize: 16,
  },
  spinner: { marginVertical: spacing.sm },
  empty: { color: SUPPORTER_SITE.muted, paddingVertical: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SUPPORTER_SITE.border,
    gap: spacing.sm,
  },
  rowCopy: { flex: 1, minWidth: 0, gap: 2 },
  name: { color: SUPPORTER_SITE.foreground, fontWeight: '600', fontSize: 14 },
  meta: { color: SUPPORTER_SITE.muted, fontSize: 11 },
  action: {
    color: SUPPORTER_SITE.accent,
    letterSpacing: 1,
    fontSize: 10,
    textTransform: 'uppercase',
  },
});
