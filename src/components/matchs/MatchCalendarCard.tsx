import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableSpring } from '../motion/PressableSpring';
import { ProDayText } from '../ui/ProDayText';
import { useMatchSkinTokens } from './matchCenterUi';

interface MatchCalendarCardProps {
  kindLabel: string;
  dateLabel: string;
  title: string;
  subtitle: string;
  city: string;
  linkLabel: string;
  onPress: () => void;
  onExportCalendar?: () => void;
}

/**
 * Carte de Match Épurée & Directe Style SportEasy
 * Monochrome sombre + accent club unique, zéro surcharge.
 */
export const MatchCalendarCard: React.FC<MatchCalendarCardProps> = ({
  kindLabel,
  dateLabel,
  title,
  subtitle,
  city,
  onPress,
  onExportCalendar,
}) => {
  const skin = useMatchSkinTokens();

  return (
    <PressableSpring
      style={styles.card}
      onPress={onPress}
      scaleTo={0.98}
      haptic
    >
      <View style={styles.body}>
        {/* Ligne 1 : Date, Heure & Badge Catégorie */}
        <View style={styles.topRow}>
          <View style={styles.dateWrap}>
            <Ionicons name="time-outline" size={13} color="#9CA3AF" />
            <ProDayText style={styles.dateText}>
              {dateLabel}
            </ProDayText>
          </View>

          <View style={styles.topRight}>
            <View style={[styles.kindTag, { backgroundColor: `${skin.accent}18` }]}>
              <ProDayText style={[styles.kindTagText, { color: skin.accent }]}>
                {kindLabel.toUpperCase()}
              </ProDayText>
            </View>

            {onExportCalendar ? (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onExportCalendar();
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.calendarBtn}
                accessibilityLabel="Ajouter au calendrier"
              >
                <Ionicons name="calendar-outline" size={13} color="#71717A" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Ligne 2 : Affiche du Match / Titre */}
        <ProDayText style={styles.titleText} numberOfLines={2}>
          {title}
        </ProDayText>

        {/* Ligne 3 : Lieu & Indicateur */}
        <View style={styles.bottomRow}>
          <View style={styles.locationWrap}>
            <Ionicons name="location-outline" size={12} color="#71717A" />
            <ProDayText style={styles.locationText} numberOfLines={1}>
              {subtitle ? `${subtitle} · ` : ''}{city}
            </ProDayText>
          </View>

          <Ionicons name="chevron-forward" size={14} color="#71717A" />
        </View>
      </View>
    </PressableSpring>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#121218',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 14,
    marginBottom: 8,
  },
  body: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.1,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  kindTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  kindTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  calendarBtn: {
    padding: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  titleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  locationWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  locationText: {
    fontSize: 11.5,
    color: '#71717A',
    fontWeight: '500',
  },
});
