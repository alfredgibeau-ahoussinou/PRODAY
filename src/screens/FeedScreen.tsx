import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import type { User, UserRole } from '../models/User';
import type { PlatformFeedPost } from '../models/PlatformFeed';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { Icon } from '../components/ui/Icon';
import { platformFeedService } from '../services/platformFeed.service';
import { storageService } from '../services/storage.service';
import { pickFeedImage } from '../utils/pickFeedImage';
import { PhysioCarePanel } from '../components/feed/PhysioCarePanel';
import { spacing, radius } from '../theme/designTokens';
import { useAppTheme } from '../context/ProductLineContext';

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
  onBack?: () => void;
  onOpenChat: (threadId: string) => void;
  onOpenMessages: () => void;
}

function roleLabelForLine(role: UserRole, productLine: 'homme' | 'woman' | 'pro'): string {
  if (role === 'player' && productLine === 'woman') return 'Joueuse';
  return ROLE_LABEL[role] ?? role;
}

export const FeedScreen: React.FC<FeedScreenProps> = ({
  profile,
  onBack,
  onOpenChat,
  onOpenMessages,
}) => {
  const { colors: c, productLine } = useAppTheme();
  const [posts, setPosts] = useState<PlatformFeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [composer, setComposer] = useState<'none' | 'news' | 'poll'>('none');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pollOpt1, setPollOpt1] = useState('');
  const [pollOpt2, setPollOpt2] = useState('');
  const [pollOpt3, setPollOpt3] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>('image/jpeg');

  const canNews = platformFeedService.canPublishFeedNews(profile.role);
  const canPoll = platformFeedService.canCreateAgentPoll(profile.role);
  const canVote = platformFeedService.canVoteAgentPoll(profile.role);

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

  const resetComposer = () => {
    setComposer('none');
    setTitle('');
    setBody('');
    setPollOpt1('');
    setPollOpt2('');
    setPollOpt3('');
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
        body: body.trim(),
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
            <TouchableOpacity
              key={`${post.id}-${i}`}
              style={[
                styles.pollOption,
                {
                  borderColor: selected ? c.brand : c.border,
                  backgroundColor: selected ? c.accentSoft : c.background,
                },
              ]}
              onPress={() => canVote && handleVote(post, i)}
              disabled={!canVote}
              activeOpacity={0.88}
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
            </TouchableOpacity>
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
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
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
    </View>
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
      <ScreenHeader
        label="Communauté"
        title="Fil d'actualité"
        subtitle="Actualités et sondages"
        onBack={onBack}
        centered
        showBrandLogo={!onBack}
      />

      {(canNews || canPoll) && (
        <View style={styles.composerBar}>
          {canNews ? (
            <TouchableOpacity
              style={[
                styles.composerBtn,
                {
                  borderColor: composer === 'news' ? c.brand : c.border,
                  backgroundColor: composer === 'news' ? c.brand : c.surface,
                },
              ]}
              onPress={() => setComposer(composer === 'news' ? 'none' : 'news')}
            >
              <Text
                style={[
                  styles.composerBtnText,
                  { color: composer === 'news' ? c.brandInverse : c.text },
                ]}
              >
                + Actualité
              </Text>
            </TouchableOpacity>
          ) : null}
          {canPoll ? (
            <TouchableOpacity
              style={[
                styles.composerBtn,
                {
                  borderColor: composer === 'poll' ? c.brand : c.border,
                  backgroundColor: composer === 'poll' ? c.brand : c.surface,
                },
              ]}
              onPress={() => setComposer(composer === 'poll' ? 'none' : 'poll')}
            >
              <Text
                style={[
                  styles.composerBtnText,
                  { color: composer === 'poll' ? c.brandInverse : c.text },
                ]}
              >
                + Sondage
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {composer !== 'none' ? (
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
              <TouchableOpacity
                style={[styles.imagePickBtn, { borderColor: c.border }]}
                onPress={() => void handlePickImage()}
              >
                <Text style={[styles.imagePickText, { color: c.brand }]}>
                  {imageUri ? 'Changer la photo' : '+ Ajouter une photo'}
                </Text>
              </TouchableOpacity>
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
          <TouchableOpacity
            style={[
              styles.publishBtn,
              { backgroundColor: c.brand },
              submitting && styles.publishDisabled,
            ]}
            onPress={() =>
              void (composer === 'news' ? handlePublishNews() : handlePublishPoll())
            }
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={c.brandInverse} />
            ) : (
              <Text style={[styles.publishText, { color: c.brandInverse }]}>Publier</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator color={c.brand} style={styles.loader} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(p) => p.id}
          renderItem={renderItem}
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
            <PhysioCarePanel
              profile={profile}
              onOpenChat={onOpenChat}
              onOpenMessages={onOpenMessages}
            />
          }
          ListEmptyComponent={
            <Text style={[styles.empty, { color: c.textMuted }]}>
              Aucune publication pour le moment.
              {canNews || canPoll ? ' Soyez le premier à publier.' : ''}
            </Text>
          }
        />
      )}
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
