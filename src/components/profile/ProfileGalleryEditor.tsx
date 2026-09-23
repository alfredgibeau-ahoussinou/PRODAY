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
import { usePlayerThemeColors } from '../../context/PlayerThemeContext';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useJoueurTheme } from '../../hooks/useJoueurTheme';
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
  productLine = 'amateur',
  onAdd,
  onRemove,
}) => {
  const { colors: c, isWoman } = useAppTheme();
  const profile = useSessionProfile();
  const isPlayer = profile?.role === 'player';
  const joueurTheme = useJoueurTheme();
  const playerColors = usePlayerThemeColors();
  const accent = isPlayer ? joueurTheme.accent : c.brand;
  const accentSoft = isPlayer ? playerColors.accentSoft : c.accentSoft;
  const accentInverse = isPlayer ? '#FFFFFF' : c.brandInverse;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>Galerie photos</Text>
        <Text style={[styles.count, { color: accent }]}>{urls.length}/{MAX}</Text>
      </View>
      <View style={styles.grid}>
        {urls.map((uri) => (
          <View key={uri} style={[styles.cell, { borderColor: c.border }]}>
            <Image source={{ uri }} style={styles.photo} />
            <TouchableOpacity
              style={[styles.removeBtn, { backgroundColor: accent }]}
              onPress={() => onRemove(uri)}

              accessibilityRole="button"
              accessibilityLabel="Fermer">
              <Icon name="close" size={14} color={accentInverse} />
            </TouchableOpacity>
          </View>
        ))}
        {urls.length < MAX ? (
          <TouchableOpacity
            style={[
              styles.addCell,
              {
                borderColor: accent,
                backgroundColor: accentSoft,
              },
            ]}
            onPress={onAdd}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color={accent} />
            ) : (
              <>
                <Icon name="add" size={28} color={accent} />
                <Text style={[styles.addLabel, { color: accent }]}>Ajouter</Text>
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
