import React, { useMemo, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { fontFamily } from '../../theme/typography';
import { clubMonogram } from '../../utils/clubMonogram';

type Props = {
  name: string;
  logoUrl?: string | null;
  size?: number;
  accent?: string;
};

/**
 * Blason club — taille fixe (pas de jump), Image cache RN, fallback initiales.
 */
export const ClubCrestThumb: React.FC<Props> = ({
  name,
  logoUrl,
  size = 40,
  accent = '#C5A059',
}) => {
  const [failed, setFailed] = useState(false);
  const uri = logoUrl?.trim() || '';
  const showImage = Boolean(uri) && !failed;
  const mono = useMemo(() => clubMonogram(name), [name]);
  const radius = Math.round(size * 0.22);

  return (
    <View
      style={[
        styles.box,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: showImage ? 'rgba(255,255,255,0.08)' : `${accent}28`,
          borderColor: showImage ? 'rgba(255,255,255,0.12)' : `${accent}55`,
        },
      ]}
      accessibilityIgnoresInvertColors
    >
      {showImage ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: radius }}
          resizeMode="contain"
          onError={() => setFailed(true)}
          accessibilityLabel={`Logo ${name}`}
        />
      ) : (
        <ProDayText
          style={[
            styles.mono,
            {
              color: accent,
              fontSize: size >= 44 ? 15 : 12,
            },
          ]}
          numberOfLines={1}
        >
          {mono}
        </ProDayText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    flexShrink: 0,
  },
  mono: {
    fontFamily: fontFamily.bold,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});
