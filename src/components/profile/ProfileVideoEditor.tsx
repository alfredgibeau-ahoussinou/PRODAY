import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Icon } from '../ui/Icon';
import { ProDayText } from '../ui/ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';

const MAX = 3;

interface ProfileVideoEditorProps {
  urls: string[];
  uploading?: boolean;
  onAdd: () => void;
  onRemove: (url: string) => void;
}

export const ProfileVideoEditor: React.FC<ProfileVideoEditorProps> = ({
  urls,
  uploading,
  onAdd,
  onRemove,
}) => {
  const { colors: c } = useAppTheme();

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <ProDayText variant="section">Vidéos highlight</ProDayText>
        <ProDayText variant="caption" accent>
          {urls.length}/{MAX}
        </ProDayText>
      </View>
      <View style={styles.grid}>
        {urls.map((uri, index) => (
          <View key={uri} style={[styles.cell, { borderColor: c.border, backgroundColor: c.surfaceMuted }]}>
            <View style={[styles.playBadge, { backgroundColor: c.accentSoft }]}>
              <Icon name="time" size={22} color={c.accent} />
            </View>
            <ProDayText variant="caption" muted style={styles.videoLabel}>
              Vidéo {index + 1}
            </ProDayText>
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
                <ProDayText variant="caption" accent style={styles.addLabel}>
                  Ajouter
                </ProDayText>
              </>
            )}
          </TouchableOpacity>
        ) : null}
      </View>
      {urls.length === 0 ? (
        <ProDayText variant="caption" muted style={styles.hint}>
          Ajoutez jusqu’à 3 courtes vidéos (60 s max) pour mettre en avant vos actions sur le terrain.
        </ProDayText>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  cell: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: spacing.xs,
  },
  playBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoLabel: { fontSize: 10, fontWeight: '800' },
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
    lineHeight: 17,
  },
});
