import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, TextInput, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/admin.service';
import type { PlatformFeedPost } from '../../models/PlatformFeed';
import { AdminSectionHeader } from './AdminSectionHeader';
import { AdminEntityCard } from './AdminEntityCard';
import { AdminEmptyState } from './AdminEmptyState';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { adminConfirmDelete } from '../../utils/adminConfirm';
import { formatCalendarDate } from '../../utils/seasonCalendar';
import { useAdminStyles } from './adminStyles';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

export const AdminPlatformFeedPanel: React.FC = () => {
  const { profile } = useAuth();
  const { colors: c } = useAdminStyles();
  const styles = useMemo(() => createStyles(c), [c]);

  const [posts, setPosts] = useState<PlatformFeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [publishing, setPublishing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPosts(await adminService.listPlatformFeedPosts(80));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const publish = async () => {
    if (!profile?.uid) return;
    if (!title.trim() || !body.trim()) {
      Alert.alert('Champs requis', 'Titre et contenu sont obligatoires.');
      return;
    }
    setPublishing(true);
    try {
      await adminService.createPlatformFeedNews({
        author_uid: profile.uid,
        author_name: profile.display_name || 'ProDay Admin',
        title,
        body,
        audience: 'all',
      });
      setTitle('');
      setBody('');
      setShowForm(false);
      await load();
      Alert.alert('Annonce', 'Publication ajoutée au fil plateforme.');
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Publication impossible.');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return <ActivityIndicator color={c.brand} style={{ marginVertical: spacing.lg }} />;
  }

  return (
    <View>
      <AdminSectionHeader title="Fil plateforme" count={posts.length} />
      <ProDayText variant="caption" muted style={{ marginBottom: spacing.sm, lineHeight: 18 }}>
        Annonces officielles visibles par les membres connectés (audience « all »).
      </ProDayText>

      <PressableSpring
        style={[styles.toggleForm, { backgroundColor: c.brand }]}
        onPress={() => setShowForm((v) => !v)}
        scaleTo={0.98}
        haptic
      >
        <ProDayText variant="caption" inverse style={{ fontWeight: '800' }}>
          {showForm ? 'Masquer le formulaire' : 'Nouvelle annonce plateforme'}
        </ProDayText>
      </PressableSpring>

      {showForm ? (
        <View style={[styles.form, { borderColor: c.border, backgroundColor: c.surface }]}>
          <TextInput
            style={[styles.input, { color: c.text, borderColor: c.border }]}
            placeholder="Titre de l’annonce"
            placeholderTextColor={c.textMuted}
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={[styles.input, styles.bodyInput, { color: c.text, borderColor: c.border }]}
            placeholder="Contenu (info produit, maintenance planifiée, événement…)"
            placeholderTextColor={c.textMuted}
            value={body}
            onChangeText={setBody}
            multiline
          />
          <PressableSpring
            style={[styles.publishBtn, { backgroundColor: c.brand }, publishing && { opacity: 0.6 }]}
            disabled={publishing}
            onPress={() => void publish()}
            scaleTo={0.97}
            haptic={!publishing}
          >
            {publishing ? (
              <ActivityIndicator color={c.brandInverse} />
            ) : (
              <ProDayText variant="caption" inverse style={{ fontWeight: '800' }}>
                Publier
              </ProDayText>
            )}
          </PressableSpring>
        </View>
      ) : null}

      {posts.length === 0 ? (
        <AdminEmptyState
          icon="notifications"
          title="Aucune annonce"
          subtitle="Publiez une actualité plateforme pour informer la communauté."
        />
      ) : (
        posts.map((post) => (
          <AdminEntityCard
            key={post.id}
            icon={post.type === 'poll' ? 'star-four-points' : 'notifications'}
            title={post.title}
            subtitle={post.body.slice(0, 120) || '—'}
            meta={`${post.author_name} · ${post.audience} · ${formatCalendarDate(post.created_at)}`}
            onDelete={() =>
              adminConfirmDelete('Supprimer', post.title, () => adminService.deletePlatformFeedPost(post.id), load)
            }
          />
        ))
      )}
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    toggleForm: {
      borderRadius: radius.md,
      padding: spacing.md,
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    form: {
      borderWidth: 1,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    input: {
      borderWidth: 1,
      borderRadius: radius.md,
      padding: spacing.sm,
      fontSize: 14,
    },
    bodyInput: { minHeight: 100, textAlignVertical: 'top' },
    publishBtn: {
      borderRadius: radius.md,
      padding: spacing.md,
      alignItems: 'center',
    },
  });
}
