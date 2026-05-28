import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Icon } from '../ui/Icon';
import { colors, spacing, radius } from '../../theme/designTokens';

const MAX = 6;

interface ProfileGalleryEditorProps {
  urls: string[];
  uploading?: boolean;
  onAdd: () => void;
  onRemove: (url: string) => void;
}

export const ProfileGalleryEditor: React.FC<ProfileGalleryEditorProps> = ({
  urls,
  uploading,
  onAdd,
  onRemove,
}) => (
  <View style={styles.wrap}>
    <View style={styles.header}>
      <Text style={styles.title}>Galerie photos</Text>
      <Text style={styles.count}>
        {urls.length}/{MAX}
      </Text>
    </View>
    <View style={styles.grid}>
      {urls.map((uri) => (
        <View key={uri} style={styles.cell}>
          <Image source={{ uri }} style={styles.photo} />
          <TouchableOpacity style={styles.removeBtn} onPress={() => onRemove(uri)}>
            <Icon name="close" size={14} color={colors.brandInverse} />
          </TouchableOpacity>
        </View>
      ))}
      {urls.length < MAX ? (
        <TouchableOpacity
          style={styles.addCell}
          onPress={onAdd}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <>
              <Icon name="add" size={28} color={colors.accent} />
              <Text style={styles.addLabel}>Ajouter</Text>
            </>
          )}
        </TouchableOpacity>
      ) : null}
    </View>
    {urls.length === 0 ? (
      <Text style={styles.hint}>
        Ajoutez des photos d’action pour vous démarquer des autres joueurs.
      </Text>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: { fontSize: 16, fontWeight: '900', color: colors.text },
  count: { fontSize: 12, fontWeight: '800', color: colors.accent },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  cell: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  photo: { width: '100%', height: '100%' },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCell: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accent,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
    gap: 4,
  },
  addLabel: { fontSize: 10, fontWeight: '800', color: colors.accent },
  hint: {
    marginTop: spacing.sm,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
  },
});
