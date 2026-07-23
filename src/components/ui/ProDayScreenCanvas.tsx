import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ProDayGradient } from './ProDayGradient';
import { useAppTheme } from '../../context/ProductLineContext';

type ProDayScreenCanvasProps = {
  children: React.ReactNode;
  immersive?: boolean;
  /** Surface plate — app connectée, sans halo marketing. */
  flat?: boolean;
};

/** Fond d’écran — halo discover ou surface plate pour l’app connectée. */
export const ProDayScreenCanvas: React.FC<ProDayScreenCanvasProps> = ({
  children,
  immersive = false,
  flat = false,
}) => {
  const { colors } = useAppTheme();

  if (immersive) {
    return <View style={[styles.fill, { backgroundColor: '#000' }]}>{children}</View>;
  }

  if (flat) {
    return (
      <View style={[styles.fill, { backgroundColor: colors.background }]}>
        <ProDayGradient
          kind="ambient"
          style={styles.haloFlat}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        <View style={styles.content}>{children}</View>
      </View>
    );
  }

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <ProDayGradient
        kind="ambient"
        style={styles.halo}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  fill: { flex: 1 },
  halo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
    opacity: 1,
  },
  haloFlat: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    opacity: 0.85,
  },
  content: {
    flex: 1,
  },
});