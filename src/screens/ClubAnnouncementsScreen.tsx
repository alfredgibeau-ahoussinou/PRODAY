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
} from 'react-native';
import type { User } from '../models/User';
import type { ClubAnnouncement } from '../models/ClubAnnouncement';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { clubAnnouncementsService } from '../services/clubAnnouncements.service';
import { colors, spacing, radius } from '../theme/designTokens';

interface ClubAnnouncementsScreenProps {
  profile: User;
  onBack: () => void;
  /** Staff peut publier et supprimer */
  canManage?: boolean;
}

export const ClubAnnouncementsScreen: React.FC<ClubAnnouncementsScreenProps> = ({
  profile,
  onBack,
  canManage = false,
}) => {
  const clubId = profile.profile.club_id;
  const [announcements, setAnnouncements] = useState<ClubAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [publishing, setPublishing] = useState(false);

  const load = useCallback(async () => {
    if (!clubId) {
      setAnnouncements([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await clubAnnouncementsService.listByClub(clubId);
      setAnnouncements(list);
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handlePublish = async () => {
    if (!clubId) return;
    if (!title.trim() || !body.trim()) {
      Alert.alert('Champs requis', 'Titre et contenu obligatoires.');
      return;
    }
    setPublishing(true);
    try {
      await clubAnnouncementsService.create({
        club_id: clubId,
        author_uid: profile.uid,
        author_name: profile.display_name,
        title: title.trim(),
        body: body.trim(),
      });
      setTitle('');
      setBody('');
      await load();
      Alert.alert('Publié', 'Annonce visible par tous les membres du club.');
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Publication impossible.');
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = (item: ClubAnnouncement) => {
    Alert.alert('Supprimer', `Retirer « ${item.title} » ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await clubAnnouncementsService.delete(item.id);
            await load();
          } catch (e) {
            Alert.alert('Erreur', e instanceof Error ? e.message : 'Suppression impossible.');
          }
        },
      },
    ]);
  };

  if (!clubId) {
    return (
      <View style={styles.root}>
        <ScreenHeader title="Annonces club" onBack={onBack} centered />
        <Text style={styles.empty}>Liez un club à votre profil pour accéder aux annonces.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScreenHeader title="Annonces club" onBack={onBack} centered />
      {canManage ? (
        <View style={styles.compose}>
          <TextInput
            style={styles.input}
            placeholder="Titre de l'annonce"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Message aux membres…"
            placeholderTextColor={colors.textMuted}
            value={body}
            onChangeText={setBody}
            multiline
          />
          <TouchableOpacity
            style={[styles.publishBtn, publishing && styles.publishDisabled]}
            onPress={() => void handlePublish()}
            disabled={publishing}
          >
            {publishing ? (
              <ActivityIndicator color={colors.brandInverse} />
            ) : (
              <Text style={styles.publishText}>Publier</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator color={colors.brand} style={styles.loader} />
      ) : (
        <FlatList
          data={announcements}
          keyExtractor={(a) => a.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>
              Aucune annonce pour le moment. Le staff publiera ici les infos club.
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {canManage ? (
                  <TouchableOpacity onPress={() => handleDelete(item)}>
                    <Text style={styles.delete}>Suppr.</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <Text style={styles.cardBody}>{item.body}</Text>
              <Text style={styles.cardMeta}>
                {item.author_name} · {item.created_at.toLocaleDateString('fr-FR')}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  compose: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 15,
    color: colors.text,
  },
  textArea: { minHeight: 88, textAlignVertical: 'top' },
  publishBtn: {
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  publishDisabled: { opacity: 0.6 },
  publishText: { color: colors.brandInverse, fontWeight: '800' },
  loader: { marginTop: spacing.xl },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  empty: {
    padding: spacing.lg,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.text, flex: 1 },
  delete: { fontSize: 12, fontWeight: '700', color: colors.error },
  cardBody: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  cardMeta: { fontSize: 11, color: colors.textMuted, marginTop: spacing.sm },
});
