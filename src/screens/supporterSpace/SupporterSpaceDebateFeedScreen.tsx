import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { ProDayText } from '../../components/ui/ProDayText';
import { useAuth } from '../../context/AuthContext';
import { SUPPORTER_SPACE } from '../../features/supporterSpace/theme/supporterSpaceTheme';
import type { SupporterDebatePost } from '../../models/SupporterDebatePost';
import { DEBATE_BODY_MAX } from '../../models/SupporterDebatePost';
import { supporterDebateService } from '../../services/supporterDebate.service';

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'à l’instant';
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}

type DebateComposeProps = {
  onPosted: () => void;
  matchId?: string | null;
  matchLabel?: string;
};

const DebateCompose: React.FC<DebateComposeProps> = ({ onPosted, matchId, matchLabel }) => {
  const { profile } = useAuth();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const publish = async () => {
    if (!profile?.uid) {
      setError('Connecte-toi pour publier.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const name =
        profile.display_name ||
        profile.email?.split('@')[0] ||
        'Supporter';
      await supporterDebateService.createPost({
        author_uid: profile.uid,
        author_name: name,
        body: text,
        match_id: matchId ?? null,
        match_label: matchLabel,
      });
      setText('');
      onPosted();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Publication impossible.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.compose}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Quoi de neuf en tribune ?"
        placeholderTextColor={SUPPORTER_SPACE.muted}
        multiline
        maxLength={DEBATE_BODY_MAX}
        style={styles.input}
      />
      <View style={styles.composeRow}>
        <ProDayText variant="caption" style={styles.counter}>
          {text.trim().length}/{DEBATE_BODY_MAX}
        </ProDayText>
        <Pressable
          style={[styles.publishBtn, busy && styles.publishDisabled]}
          disabled={busy}
          onPress={() => void publish()}
        >
          <ProDayText variant="caption" style={styles.publishLabel}>
            Publier
          </ProDayText>
        </Pressable>
      </View>
      {error ? (
        <ProDayText variant="caption" style={styles.error}>
          {error}
        </ProDayText>
      ) : null}
    </View>
  );
};

function DebateCard({ post }: { post: SupporterDebatePost }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <ProDayText variant="body" style={styles.author}>
          {post.author_name}
        </ProDayText>
        <ProDayText variant="caption" style={styles.time}>
          {formatRelative(post.created_at)}
        </ProDayText>
      </View>
      <ProDayText variant="body" style={styles.body}>
        {post.body}
      </ProDayText>
      <View style={styles.meta}>
        <ProDayText variant="caption" style={styles.metaItem}>
          ♥ {post.like_count}
        </ProDayText>
        <ProDayText variant="caption" style={styles.metaItem}>
          ↩ {post.reply_count}
        </ProDayText>
        {post.match_label ? (
          <ProDayText variant="caption" style={styles.metaMatch} numberOfLines={1}>
            {post.match_label}
          </ProDayText>
        ) : null}
      </View>
    </View>
  );
}

export type SupporterSpaceDebateFeedScreenProps = {
  onBack?: () => void;
};

/** Tribune globale — posts courts type Twitter. */
export const SupporterSpaceDebateFeedScreen: React.FC<SupporterSpaceDebateFeedScreenProps> = ({
  onBack,
}) => {
  const [posts, setPosts] = useState<SupporterDebatePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await supporterDebateService.listGlobal();
      setPosts(list);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={12}>
            <ProDayText variant="body" style={styles.back}>
              ← Retour
            </ProDayText>
          </Pressable>
        ) : (
          <View />
        )}
        <ProDayText variant="hero" style={styles.title}>
          Tribune
        </ProDayText>
        <ProDayText variant="body" style={styles.sub}>
          Débats entre supporters — 280 caractères max.
        </ProDayText>
      </View>

      <DebateCompose onPosted={() => void load()} />

      {loading ? (
        <ActivityIndicator color={SUPPORTER_SPACE.bright} style={{ marginTop: 24 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await load();
                setRefreshing(false);
              }}
              tintColor={SUPPORTER_SPACE.bright}
            />
          }
        >
          {posts.length === 0 ? (
            <View style={styles.empty}>
              <ProDayText variant="body" style={styles.muted}>
                Aucun post pour l’instant. Lance le débat.
              </ProDayText>
            </View>
          ) : (
            posts.map((p) => <DebateCard key={p.id} post={p} />)
          )}
        </ScrollView>
      )}
    </View>
  );
};

export type SupporterSpaceMatchDebateScreenProps = {
  matchId: string;
  matchLabel: string;
  onBack: () => void;
};

/** Fil du match — thread scoped. */
export const SupporterSpaceMatchDebateScreen: React.FC<SupporterSpaceMatchDebateScreenProps> = ({
  matchId,
  matchLabel,
  onBack,
}) => {
  const [posts, setPosts] = useState<SupporterDebatePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await supporterDebateService.listForMatch(matchId);
      setPosts(list);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12}>
          <ProDayText variant="body" style={styles.back}>
            ← Retour
          </ProDayText>
        </Pressable>
        <ProDayText variant="hero" style={styles.title}>
          Fil du match
        </ProDayText>
        <ProDayText variant="body" style={styles.sub} numberOfLines={2}>
          {matchLabel}
        </ProDayText>
      </View>

      <DebateCompose matchId={matchId} matchLabel={matchLabel} onPosted={() => void load()} />

      {loading ? (
        <ActivityIndicator color={SUPPORTER_SPACE.bright} style={{ marginTop: 24 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await load();
                setRefreshing(false);
              }}
              tintColor={SUPPORTER_SPACE.bright}
            />
          }
        >
          {posts.length === 0 ? (
            <View style={styles.empty}>
              <ProDayText variant="body" style={styles.muted}>
                Sois le premier à commenter ce match.
              </ProDayText>
            </View>
          ) : (
            posts.map((p) => <DebateCard key={p.id} post={p} />)
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SUPPORTER_SPACE.bg },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, gap: 4 },
  back: { color: SUPPORTER_SPACE.bright, marginBottom: 4 },
  title: { color: SUPPORTER_SPACE.foreground, fontSize: 26 },
  sub: { color: SUPPORTER_SPACE.muted },
  compose: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: SUPPORTER_SPACE.elevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: SUPPORTER_SPACE.border,
    padding: 12,
    gap: 8,
  },
  input: {
    minHeight: 72,
    color: SUPPORTER_SPACE.foreground,
    fontSize: 15,
    textAlignVertical: 'top',
    padding: 0,
  },
  composeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  counter: { color: SUPPORTER_SPACE.muted },
  publishBtn: {
    backgroundColor: SUPPORTER_SPACE.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  publishDisabled: { opacity: 0.5 },
  publishLabel: { color: '#fff', fontWeight: '700' },
  error: { color: SUPPORTER_SPACE.danger },
  list: { padding: 16, paddingBottom: 120, gap: 10 },
  empty: {
    backgroundColor: SUPPORTER_SPACE.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: SUPPORTER_SPACE.border,
  },
  muted: { color: SUPPORTER_SPACE.muted },
  card: {
    backgroundColor: SUPPORTER_SPACE.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: SUPPORTER_SPACE.border,
    gap: 8,
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  author: { color: SUPPORTER_SPACE.foreground, fontWeight: '700', flex: 1 },
  time: { color: SUPPORTER_SPACE.muted },
  body: { color: SUPPORTER_SPACE.foreground, lineHeight: 22 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metaItem: { color: SUPPORTER_SPACE.muted },
  metaMatch: { color: SUPPORTER_SPACE.bright, flex: 1 },
});
