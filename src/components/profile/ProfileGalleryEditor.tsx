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
import type { ProductLineId } from '../../models/ProductLine';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';

const MAX = 6;

interface ProfileGalleryEditorProps {
  urls: string[];
  uploading?: boolean;
  productLine?: ProductLineId;
  onAdd: () => void;
  onRemove: (url: string) => void;
}

export const ProfileGalleryEditor: React.FC<ProfileGalleryEditorProps> = ({
  urls,
  uploading,
  productLine = 'homme',
  onAdd,
  onRemove,
}) => {
  const { colors: c, isWoman } = useAppTheme();

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>Galerie photos</Text>
        <Text style={[styles.count, { color: c.brand }]}>{urls.length}/{MAX}</Text>
      </View>
      <View style={styles.grid}>
        {urls.map((uri) => (
          <View key={uri} style={[styles.cell, { borderColor: c.border }]}>
            <Image source={{ uri }} style={styles.photo} />
            <TouchableOpacity
              style={[styles.removeBtn, { backgroundColor: c.brand }]}
              onPress={() => onRemove(uri)}
            >
              <Icon name="close" size={14} color={c.brandInverse} />
            </TouchableOpacity>
          </View>
        ))}
        {urls.length < MAX ? (
          <TouchableOpacity
            style={[
              styles.addCell,
              {
                borderColor: c.brand,
                backgroundColor: c.accentSoft,
              },
            ]}
            onPress={onAdd}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color={c.brand} />
            ) : (
              <>
                <Icon name="add" size={28} color={c.brand} />
                <Text style={[styles.addLabel, { color: c.brand }]}>Ajouter</Text>
              </>
            )}
          </TouchableOpacity>
        ) : null}
      </View>
      {urls.length === 0 ? (
        <Text style={[styles.hint, { color: c.textMuted }]}>
          {isWoman
            ? 'Ajoutez des photos d’action pour vous démarquer des autres joueuses.'
            : 'Ajoutez des photos d’action pour vous démarquer des autres joueurs.'}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: { fontSize: 16, fontWeight: '900' },
  count: { fontSize: 12, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  cell: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
  },
  photo: { width: '100%', height: '100%' },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCell: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addLabel: { fontSize: 10, fontWeight: '800' },
  hint: {
    marginTop: spacing.sm,
    fontSize: 12,
    lineHeight: 17,
  },
});
