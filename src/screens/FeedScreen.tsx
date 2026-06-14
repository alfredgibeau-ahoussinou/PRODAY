import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
  ScrollView,
} from 'react-native';
import type { ProductLineId } from '../models/ProductLine';
import type { User, UserRole } from '../models/User';
import type { PlatformFeedPost } from '../models/PlatformFeed';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { Icon } from '../components/ui/Icon';
import { platformFeedService } from '../services/platformFeed.service';
import { storageService } from '../services/storage.service';
import { pickFeedImage } from '../utils/pickFeedImage';
import { PhysioCarePanel } from '../components/feed/PhysioCarePanel';
import { PressableSpring, SkeletonList, InteractiveListItem } from '../components/motion';
import { prodayHaptics } from '../utils/prodayHaptics';
import { SearchBar } from '../components/ui/SearchBar';
import {
  FEED_TYPE_FILTERS,
  type FeedTypeFilter,
} from '../content/feedChapters';
import { ProDaySelect } from '../components/ui/ProDaySelect';
import { spacing, radius } from '../theme/designTokens';
import { useAppTheme } from '../context/ProductLineContext';
import { isV3ShellEnabled } from '../config/featureFlags';
import { rankFeedPosts } from '../core/recommendation/feedRanking.engine';

export type FeedPanel = 'full' | 'list' | 'compose';

const ROLE_LABEL: Record<UserRole, string> = {
  player: 'Joueur',
  coach: 'Coach',
  club: 'Club',
  agent: 'Agent',
  recruiter: 'Recruteur',
  organizer: 'Organisateur',
  sponsor: 'Partenaire',
  physio: 'Kinésithérapeute',
};

interface FeedScreenProps {
  profile: User;
  panel?: FeedPanel;
  onBack?: () => void;
  onOpenChat: (threadId: string) => void;
  onOpenMessages: () => void;
}

function roleLabelForLine(role: UserRole, productLine: ProductLineId): string {
  if (role === 'player' && productLine === 'woman') return 'Joueuse';
  return ROLE_LABEL[role] ?? role;
}

export const FeedScreen: React.FC<FeedScreenProps> = ({
  profile,
  panel = 'full',
  onBack,
  onOpenChat,
  onOpenMessages,
}) => {
  const { colors: c, productLine } = useAppTheme();
  const [posts, setPosts] = useState<PlatformFeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<FeedTypeFilter>('all');
  const [composer, setComposer] = useState<'none' | 'news' | 'poll'>(
    panel === 'compose' ? 'news' : 'none'
  );
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pollOpt1, setPollOpt1] = useState('');
  const [pollOpt2, setPollOpt2] = useState('');
  const [pollOpt3, setPollOpt3] = useState('');
  const [pollEventLink, setPollEventLink] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>('image/jpeg');

  const canNews = platformFeedService.canPublishFeedNews(profile.role);
  const canPoll = platformFeedService.canCreateAgentPoll(profile.role);
  const canVote = platformFeedService.canVoteAgentPoll(profile.role);

  const showList = panel === 'full' || panel === 'list';
  const showCompose = panel === 'full' || panel === 'compose';
  const showHeader = panel === 'full';

  const useV3Ranking = isV3ShellEnabled();

  const filteredPosts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = posts.filter((post) => {
      if (typeFilter === 'news' && post.type !== 'news') return false;
      if (typeFilter === 'poll' && post.type !== 'poll') return false;
      if (!q) return true;
      return (
        post.title.toLowerCase().includes(q) ||
        (post.body?.toLowerCase().includes(q) ?? false) ||
        post.author_name.toLowerCase().includes(q)
      );
    });
    if (useV3Ranking && !q && typeFilter === 'all') {
      return rankFeedPosts({ posts: base, profile });
    }
    return base;
  }, [posts, search, typeFilter, useV3Ranking, profile]);

  const load = useCallback(async () => {
    try {
      const list = await platformFeedService.listForUser(profile.role);
      setPosts(list);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile.role]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (panel !== 'compose') return;
    if (canNews) setComposer('news');
    else if (canPoll) setComposer('poll');
  }, [panel, canNews, canPoll]);

  const resetComposer = () => {
    setComposer('none');
    setTitle('');
    setBody('');
    setPollOpt1('');
    setPollOpt2('');
    setPollOpt3('');
    setPollEventLink('');
    setImageUri(null);
  };

  const handlePickImage = async () => {
    const file = await pickFeedImage();
    if (!file) return;
    setImageUri(file.uri);
    setImageMime(file.mimeType);
  };

  const handlePublishNews = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Champs requis', 'Titre et contenu obligatoires.');
      return;
    }
    setSubmitting(true);
    try {
      let imageUrl: string | undefined;
      if (imageUri) {
        imageUrl = await storageService.uploadFeedImage(profile.uid, {
          uri: imageUri,
          mimeType: imageMime,
        });
      }
      await platformFeedService.createNews({
        author_uid: profile.uid,
        author_name: profile.display_name,
        author_role: profile.role,
        title: title.trim(),
        body: body.trim(),
        image_url: imageUrl,
      });
      resetComposer();
      await load();
      Alert.alert('Publié', 'Votre actualité est visible sur le fil ProDay.');
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Publication impossible.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublishPoll = async () => {
    const options = [pollOpt1, pollOpt2, pollOpt3].map((o) => o.trim()).filter(Boolean);
    if (!title.trim()) {
      Alert.alert('Titre requis', 'Donnez un intitulé au sondage.');
      return;
    }
    setSubmitting(true);
    try {
      await platformFeedService.createPoll({
        author_uid: profile.uid,
        author_name: profile.display_name,
        author_role: profile.role,
        title: title.trim(),
        body: [
          pollEventLink.trim() ? `[Événement: ${pollEventLink.trim()}]` : '',
          body.trim(),
        ]
          .filter(Boolean)
          .join('\n'),
        options,
      });
      resetComposer();
      await load();
      Alert.alert('Sondage créé', 'Les agents peuvent voter dès maintenant.');
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Création impossible.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (post: PlatformFeedPost, optionIndex: number) => {
    try {
      await platformFeedService.votePoll(post, profile.uid, profile.role, optionIndex);
      await load();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Vote impossible.');
    }
  };

  const renderPoll = (post: PlatformFeedPost) => {
    const options = post.poll_options ?? [];
    const votes = post.poll_votes ?? {};
    const totalVotes = options.reduce(
      (sum, _, i) => sum + (votes[String(i)]?.length ?? 0),
      0
    );
    const myVoteIndex = options.findIndex((_, i) =>
      (votes[String(i)] ?? []).includes(profile.uid)
    );

    return (
      <View style={styles.pollBox}>
        {options.map((label, i) => {
          const count = votes[String(i)]?.length ?? 0;
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const selected = myVoteIndex === i;
          return (
            <PressableSpring
              key={`${post.id}-${i}`}
              style={[
                styles.pollOption,
                {
                  borderColor: selected ? c.brand : c.border,
                  backgroundColor: selected ? c.accentSoft : c.background,
                },
              ]}
              onPress={() => {
                if (canVote) {
                  prodayHaptics.press();
                  handleVote(post, i);
                }
              }}
              disabled={!canVote}
              scaleTo={0.98}
              haptic={canVote}
            >
              <View style={[styles.pollBarTrack, { backgroundColor: c.surfaceMuted }]}>
                <View
                  style={[styles.pollBarFill, { width: `${pct}%`, backgroundColor: c.brand }]}
                />
              </View>
              <View style={styles.pollRow}>
                <Text style={[styles.pollLabel, { color: c.text }]}>{label}</Text>
                <Text style={[styles.pollPct, { color: c.textMuted }]}>
                  {pct}% · {count} vote{count !== 1 ? 's' : ''}
                </Text>
              </View>
            </PressableSpring>
          );
        })}
        {!canVote ? (
          <Text style={[styles.pollHint, { color: c.textMuted }]}>
            Réservé aux agents — résultats en lecture seule.
          </Text>
        ) : null}
      </View>
    );
  };

  const renderItem = ({ item }: { item: PlatformFeedPost }) => (
    <PressableSpring
      style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}
      onPress={() => prodayHaptics.press()}
      scaleTo={0.98}
      haptic
    >
      <View style={styles.cardHead}>
        <View style={[styles.typePill, { backgroundColor: c.accentSoft }]}>
          <Icon
            name={item.type === 'poll' ? 'people' : 'document'}
            size={12}
            color={c.brand}
          />
          <Text style={[styles.typeText, { color: c.brand }]}>
            {item.type === 'poll' ? 'Sondage agents' : 'Actualité'}
          </Text>
        </View>
        <Text style={[styles.date, { color: c.textMuted }]}>
          {item.created_at.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
      <Text style={[styles.cardTitle, { color: c.text }]}>{item.title}</Text>
      {item.image_url ? (
        <Image
          source={{ uri: item.image_url }}
          style={[styles.cardImage, { backgroundColor: c.surfaceMuted }]}
          resizeMode="cover"
        />
      ) : null}
      {item.body ? (
        <Text style={[styles.cardBody, { color: c.textSecondary }]}>{item.body}</Text>
      ) : null}
      <Text style={[styles.meta, { color: c.textMuted }]}>
        {item.author_name} · {roleLabelForLine(item.author_role, productLine)}
      </Text>
      {item.type === 'poll' ? renderPoll(item) : null}
    </PressableSpring>
  );

  const inputStyle = [
    styles.input,
    {
      borderColor: c.border,
      color: c.text,
      backgroundColor: c.background,
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      {showHeader ? (
        <ScreenHeader
          label="Communauté"
          title="Fil d'actualité"
          subtitle="Actualités et sondages"
          onBack={onBack}
          centered
          showBrandLogo={!onBack}
        />
      ) : null}

      {showList && panel === 'list' ? (
        <>
          <SearchBar placeholder="Rechercher…" value={search} onChangeText={setSearch} />
          <ProDaySelect<FeedTypeFilter>
            label="Type de contenu"
            placeholder="Tout"
            options={FEED_TYPE_FILTERS.map((f) => ({ id: f.id, label: f.label }))}
            value={typeFilter}
            onChange={setTypeFilter}
          />
        </>
      ) : null}

      {showCompose && (canNews || canPoll) && (
        <View style={styles.composerBar}>
          {canNews ? (
            <PressableSpring
              style={[
                styles.composerBtn,
                {
                  borderColor: composer === 'news' ? c.brand : c.border,
                  backgroundColor: composer === 'news' ? c.brand : c.surface,
                },
              ]}
              onPress={() => setComposer(composer === 'news' ? 'none' : 'news')}
              scaleTo={0.96}
              haptic
            >
              <Text
                style={[
                  styles.composerBtnText,
                  { color: composer === 'news' ? c.brandInverse : c.text },
                ]}
              >
                + Actualité
              </Text>
            </PressableSpring>
          ) : null}
          {canPoll ? (
            <PressableSpring
              style={[
                styles.composerBtn,
                {
                  borderColor: composer === 'poll' ? c.brand : c.border,
                  backgroundColor: composer === 'poll' ? c.brand : c.surface,
                },
              ]}
              onPress={() => setComposer(composer === 'poll' ? 'none' : 'poll')}
              scaleTo={0.96}
              haptic
            >
              <Text
                style={[
                  styles.composerBtnText,
                  { color: composer === 'poll' ? c.brandInverse : c.text },
                ]}
              >
                + Sondage
              </Text>
            </PressableSpring>
          ) : null}
        </View>
      )}

      {showCompose && composer !== 'none' ? (
        <View
          style={[
            styles.composerPanel,
            { backgroundColor: c.surface, borderColor: c.border },
          ]}
        >
          <TextInput
            style={inputStyle}
            placeholder="Titre"
            placeholderTextColor={c.textMuted}
            value={title}
            onChangeText={setTitle}
          />
          {composer === 'news' ? (
            <>
              <PressableSpring
                style={[styles.imagePickBtn, { borderColor: c.border }]}
                onPress={() => void handlePickImage()}
                scaleTo={0.98}
              >
                <Text style={[styles.imagePickText, { color: c.brand }]}>
                  {imageUri ? 'Changer la photo' : '+ Ajouter une photo'}
                </Text>
              </PressableSpring>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
              ) : null}
              <TextInput
                style={[inputStyle, styles.textArea]}
                placeholder="Contenu de l'actualité…"
                placeholderTextColor={c.textMuted}
                value={body}
                onChangeText={setBody}
                multiline
              />
            </>
          ) : (
            <>
              <TextInput
                style={inputStyle}
                placeholder="Convocation liée (optionnel) — ex. Entraînement samedi"
                placeholderTextColor={c.textMuted}
                value={pollEventLink}
                onChangeText={setPollEventLink}
              />
              <TextInput
                style={inputStyle}
                placeholder="Option 1"
                placeholderTextColor={c.textMuted}
                value={pollOpt1}
                onChangeText={setPollOpt1}
              />
              <TextInput
                style={inputStyle}
                placeholder="Option 2"
                placeholderTextColor={c.textMuted}
                value={pollOpt2}
                onChangeText={setPollOpt2}
              />
              <TextInput
                style={inputStyle}
                placeholder="Option 3 (optionnel)"
                placeholderTextColor={c.textMuted}
                value={pollOpt3}
                onChangeText={setPollOpt3}
              />
              <TextInput
                style={[inputStyle, styles.textArea]}
                placeholder="Contexte (optionnel)"
                placeholderTextColor={c.textMuted}
                value={body}
                onChangeText={setBody}
                multiline
              />
            </>
          )}
          <PressableSpring
            style={[
              styles.publishBtn,
              { backgroundColor: c.brand },
              submitting && styles.publishDisabled,
            ]}
            onPress={() => {
              prodayHaptics.confirm();
              void (composer === 'news' ? handlePublishNews() : handlePublishPoll());
            }}
            disabled={submitting}
            scaleTo={0.97}
            haptic={!submitting}
          >
            {submitting ? (
              <ActivityIndicator color={c.brandInverse} />
            ) : (
              <Text style={[styles.publishText, { color: c.brandInverse }]}>Publier</Text>
            )}
          </PressableSpring>
        </View>
      ) : null}

      {showList && (loading ? (
        <SkeletonList count={4} variant="card" />
      ) : (
        <FlatList
          data={filteredPosts}
          keyExtractor={(p) => p.id}
          renderItem={({ item, index }) => (
            <InteractiveListItem index={index}>{renderItem({ item })}</InteractiveListItem>
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load();
              }}
              tintColor={c.brand}
            />
          }
          ListHeaderComponent={
            panel === 'full' ? (
              <PhysioCarePanel
                profile={profile}
                onOpenChat={onOpenChat}
                onOpenMessages={onOpenMessages}
              />
            ) : null
          }
          ListEmptyComponent={
            <Text style={[styles.empty, { color: c.textMuted }]}>
              Aucune publication pour le moment.
              {canNews || canPoll ? ' Soyez le premier à publier.' : ''}
            </Text>
          }
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  composerBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  composerBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  composerBtnText: { fontWeight: '800', fontSize: 13 },
  composerPanel: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 15,
  },
  textArea: { minHeight: 88, textAlignVertical: 'top' },
  publishBtn: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  publishDisabled: { opacity: 0.6 },
  publishText: { fontWeight: '900' },
  loader: { marginTop: spacing.xl },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  empty: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 22,
    paddingVertical: spacing.xl,
  },
  card: {
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  typeText: { fontSize: 10, fontWeight: '800' },
  date: { fontSize: 10, fontWeight: '600' },
  imagePickBtn: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  imagePickText: { fontSize: 13, fontWeight: '700' },
  previewImage: {
    width: '100%',
    height: 160,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  cardImage: {
    width: '100%',
    height: 180,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  cardTitle: { fontSize: 17, fontWeight: '900', marginBottom: 6 },
  cardBody: { fontSize: 14, lineHeight: 21, marginBottom: 8 },
  meta: { fontSize: 11, fontWeight: '700', marginBottom: spacing.sm },
  pollBox: { gap: spacing.sm, marginTop: spacing.xs },
  pollOption: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    overflow: 'hidden',
  },
  pollBarTrack: {
    height: 4,
    borderRadius: 2,
    marginBottom: 6,
    overflow: 'hidden',
  },
  pollBarFill: { height: 4 },
  pollRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  pollLabel: { flex: 1, fontSize: 13, fontWeight: '700' },
  pollPct: { fontSize: 11, fontWeight: '700' },
  pollHint: { fontSize: 11, fontStyle: 'italic', marginTop: 4 },
});
