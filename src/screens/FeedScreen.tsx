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
import { colors, spacing, radius } from '../theme/designTokens';

const ROLE_LABEL: Record<UserRole, string> = {
  player: 'Joueur',
  coach: 'Coach',
  club: 'Club',
  agent: 'Agent',
  organizer: 'Organisateur',
  sponsor: 'Partenaire',
  physio: 'Kinésithérapeute',
};

interface FeedScreenProps {
  profile: User;
  onBack: () => void;
  onOpenChat: (threadId: string) => void;
  onOpenMessages: () => void;
}

export const FeedScreen: React.FC<FeedScreenProps> = ({
  profile,
  onBack,
  onOpenChat,
  onOpenMessages,
}) => {
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
              style={[styles.pollOption, selected && styles.pollOptionOn]}
              onPress={() => canVote && handleVote(post, i)}
              disabled={!canVote}
              activeOpacity={0.88}
            >
              <View style={styles.pollBarTrack}>
                <View style={[styles.pollBarFill, { width: `${pct}%` }]} />
              </View>
              <View style={styles.pollRow}>
                <Text style={styles.pollLabel}>{label}</Text>
                <Text style={styles.pollPct}>
                  {pct}% · {count} vote{count !== 1 ? 's' : ''}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
        {!canVote ? (
          <Text style={styles.pollHint}>Réservé aux agents — résultats en lecture seule.</Text>
        ) : null}
      </View>
    );
  };

  const renderItem = ({ item }: { item: PlatformFeedPost }) => (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View style={styles.typePill}>
          <Icon
            name={item.type === 'poll' ? 'people' : 'document'}
            size={12}
            color={colors.accent}
          />
          <Text style={styles.typeText}>
            {item.type === 'poll' ? 'Sondage agents' : 'Actualité'}
          </Text>
        </View>
        <Text style={styles.date}>
          {item.created_at.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
      <Text style={styles.cardTitle}>{item.title}</Text>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.cardImage} resizeMode="cover" />
      ) : null}
      {item.body ? <Text style={styles.cardBody}>{item.body}</Text> : null}
      <Text style={styles.meta}>
        {item.author_name} · {ROLE_LABEL[item.author_role] ?? item.author_role}
      </Text>
      {item.type === 'poll' ? renderPoll(item) : null}
    </View>
  );

  return (
    <View style={styles.root}>
      <ScreenHeader title="Fil d'actualité" onBack={onBack} centered />

      {(canNews || canPoll) && (
        <View style={styles.composerBar}>
          {canNews ? (
            <TouchableOpacity
              style={[styles.composerBtn, composer === 'news' && styles.composerBtnOn]}
              onPress={() => setComposer(composer === 'news' ? 'none' : 'news')}
            >
              <Text style={styles.composerBtnText}>+ Actualité</Text>
            </TouchableOpacity>
          ) : null}
          {canPoll ? (
            <TouchableOpacity
              style={[styles.composerBtn, composer === 'poll' && styles.composerBtnOn]}
              onPress={() => setComposer(composer === 'poll' ? 'none' : 'poll')}
            >
              <Text style={styles.composerBtnText}>+ Sondage</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {composer !== 'none' ? (
        <View style={styles.composerPanel}>
          <TextInput
            style={styles.input}
            placeholder="Titre"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
          />
          {composer === 'news' ? (
            <>
              <TouchableOpacity style={styles.imagePickBtn} onPress={() => void handlePickImage()}>
                <Text style={styles.imagePickText}>
                  {imageUri ? 'Changer la photo' : '+ Ajouter une photo'}
                </Text>
              </TouchableOpacity>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
              ) : null}
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Contenu de l'actualité…"
                placeholderTextColor={colors.textMuted}
                value={body}
                onChangeText={setBody}
                multiline
              />
            </>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="Option 1"
                placeholderTextColor={colors.textMuted}
                value={pollOpt1}
                onChangeText={setPollOpt1}
              />
              <TextInput
                style={styles.input}
                placeholder="Option 2"
                placeholderTextColor={colors.textMuted}
                value={pollOpt2}
                onChangeText={setPollOpt2}
              />
              <TextInput
                style={styles.input}
                placeholder="Option 3 (optionnel)"
                placeholderTextColor={colors.textMuted}
                value={pollOpt3}
                onChangeText={setPollOpt3}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Contexte (optionnel)"
                placeholderTextColor={colors.textMuted}
                value={body}
                onChangeText={setBody}
                multiline
              />
            </>
          )}
          <TouchableOpacity
            style={[styles.publishBtn, submitting && styles.publishDisabled]}
            onPress={() =>
              void (composer === 'news' ? handlePublishNews() : handlePublishPoll())
            }
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.brandInverse} />
            ) : (
              <Text style={styles.publishText}>Publier</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
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
              tintColor={colors.accent}
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
            <Text style={styles.empty}>
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
  root: { flex: 1, backgroundColor: colors.background },
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
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  composerBtnOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  composerBtnText: { fontWeight: '800', fontSize: 13, color: colors.text },
  composerPanel: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.background,
  },
  textArea: { minHeight: 88, textAlignVertical: 'top' },
  publishBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  publishDisabled: { opacity: 0.6 },
  publishText: { color: colors.brandInverse, fontWeight: '900' },
  loader: { marginTop: spacing.xl },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
    paddingVertical: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
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
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  typeText: { fontSize: 10, fontWeight: '800', color: colors.accent },
  date: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },
  imagePickBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  imagePickText: { fontSize: 13, fontWeight: '700', color: colors.accent },
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
    backgroundColor: colors.surfaceMuted,
  },
  cardTitle: { fontSize: 17, fontWeight: '900', color: colors.text, marginBottom: 6 },
  cardBody: { fontSize: 14, lineHeight: 21, color: colors.textSecondary, marginBottom: 8 },
  meta: { fontSize: 11, color: colors.textMuted, fontWeight: '700', marginBottom: spacing.sm },
  pollBox: { gap: spacing.sm, marginTop: spacing.xs },
  pollOption: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  pollOptionOn: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  pollBarTrack: {
    height: 4,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 2,
    marginBottom: 6,
    overflow: 'hidden',
  },
  pollBarFill: { height: 4, backgroundColor: colors.accent },
  pollRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  pollLabel: { flex: 1, fontSize: 13, fontWeight: '700', color: colors.text },
  pollPct: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  pollHint: { fontSize: 11, color: colors.textMuted, fontStyle: 'italic', marginTop: 4 },
});
