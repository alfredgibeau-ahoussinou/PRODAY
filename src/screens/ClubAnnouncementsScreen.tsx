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
import { spacing, radius } from '../theme/designTokens';
import { useThemedScreen } from '../hooks/useThemedScreen';

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
  const { colors: themeColors, rootStyle } = useThemedScreen();
  const clubId = profile.profile.club_id;
  const [announcements, setAnnouncements] = useState<ClubAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [publishing, setPublishing] = useState(false);

  const inputStyle = [
    styles.input,
    {
      backgroundColor: themeColors.surface,
      borderColor: themeColors.border,
      color: themeColors.text,
    },
  ];

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
      <View style={rootStyle}>
        <ScreenHeader title="Annonces club" onBack={onBack} centered />
        <Text style={[styles.empty, { color: themeColors.textMuted }]}>
          Liez un club à votre profil pour accéder aux annonces.
        </Text>
      </View>
    );
  }

  return (
    <View style={rootStyle}>
      <ScreenHeader title="Annonces club" onBack={onBack} centered />
      {canManage ? (
        <View style={[styles.compose, { borderBottomColor: themeColors.border }]}>
          <TextInput
            style={inputStyle}
            placeholder="Titre de l'annonce"
            placeholderTextColor={themeColors.textMuted}
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={[inputStyle, styles.textArea]}
            placeholder="Message aux membres…"
            placeholderTextColor={themeColors.textMuted}
            value={body}
            onChangeText={setBody}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.publishBtn,
              { backgroundColor: themeColors.brand },
              publishing && styles.publishDisabled,
            ]}
            onPress={() => void handlePublish()}
            disabled={publishing}
          >
            {publishing ? (
              <ActivityIndicator color={themeColors.brandInverse} />
            ) : (
              <Text style={[styles.publishText, { color: themeColors.brandInverse }]}>
                Publier
              </Text>
            )}
          </TouchableOpacity>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator color={themeColors.brand} style={styles.loader} />
      ) : (
        <FlatList
          data={announcements}
          keyExtractor={(a) => a.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: themeColors.textMuted }]}>
              Aucune annonce pour le moment. Le staff publiera ici les infos club.
            </Text>
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                },
              ]}
            >
              <View style={styles.cardHead}>
                <Text style={[styles.cardTitle, { color: themeColors.text }]}>{item.title}</Text>
                {canManage ? (
                  <TouchableOpacity onPress={() => handleDelete(item)}>
                    <Text style={[styles.delete, { color: themeColors.error }]}>Suppr.</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <Text style={[styles.cardBody, { color: themeColors.textSecondary }]}>
                {item.body}
              </Text>
              <Text style={[styles.cardMeta, { color: themeColors.textMuted }]}>
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
  compose: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  input: {
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    fontSize: 15,
  },
  textArea: { minHeight: 88, textAlignVertical: 'top' },
  publishBtn: {
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  publishDisabled: { opacity: 0.6 },
  publishText: { fontWeight: '800' },
  loader: { marginTop: spacing.xl },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  empty: {
    padding: spacing.lg,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  card: {
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', flex: 1 },
  delete: { fontSize: 12, fontWeight: '700' },
  cardBody: { fontSize: 14, lineHeight: 20 },
  cardMeta: { fontSize: 11, marginTop: spacing.sm },
});
