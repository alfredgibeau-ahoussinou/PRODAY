/**
 * Pôle Club — Hub Vidéo, Analyse & Smart Highlights
 * Captations VEO / Smartphone, clipping automatique IA & Le Brief du Lundi Matin.
 */
import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { PressableSpring } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import type { IconName } from '../../../components/ui/iconNames';
import { ProDayText } from '../../../components/ui/ProDayText';
import { useClubTheme } from '../shell/ClubThemeContext';
import { APPLE_TYPOGRAPHY } from '../../../theme/appleTypography';
import { clubRadius, clubSpace } from '../theme/clubDesignSystem';

export type VideoSource = 'veo' | 'smartphone' | 'xbotgo' | 'drone';
export type HighlightTag = 'all' | 'goal' | 'save' | 'transition' | 'set_piece';

export type MatchVideoItem = {
  id: string;
  title: string;
  category: string;
  dateStr: string;
  durationStr: string;
  source: VideoSource;
  sourceLabel: string;
  clipsCount: number;
  score: string;
  viewsCount: number;
};

export type SmartClipItem = {
  id: string;
  title: string;
  matchTitle: string;
  minute: string;
  type: 'goal' | 'save' | 'transition' | 'set_piece';
  typeLabel: string;
  authorName: string;
  durationSec: number;
};

export const DEMO_VIDEOS: MatchVideoItem[] = [
  {
    id: 'vid-1',
    title: 'ProDay FC (Seniors R1) vs RC France',
    category: 'Seniors R1',
    dateStr: '06/09/2026',
    durationStr: '94:12',
    source: 'veo',
    sourceLabel: 'Veo Cam 3 (Panoramique)',
    clipsCount: 6,
    score: '2 - 1',
    viewsCount: 142,
  },
  {
    id: 'vid-2',
    title: 'ProDay FC (U17 R2) vs FC Versailles',
    category: 'U17 Formation',
    dateStr: '05/09/2026',
    durationStr: '92:05',
    source: 'smartphone',
    sourceLabel: 'Captation 4K 60fps',
    clipsCount: 4,
    score: '3 - 2',
    viewsCount: 98,
  },
  {
    id: 'vid-3',
    title: 'ProDay FC (U15 R2) vs AC Boulogne',
    category: 'U15 Formation',
    dateStr: '30/08/2026',
    durationStr: '88:40',
    source: 'xbotgo',
    sourceLabel: 'Balise IA XbotGo',
    clipsCount: 3,
    score: '1 - 1',
    viewsCount: 76,
  },
];

export const DEMO_CLIPS: SmartClipItem[] = [
  {
    id: 'clip-1',
    title: 'Enroulé lucarne opposée 25m',
    matchTitle: 'Seniors R1 vs RC France',
    minute: '88’',
    type: 'goal',
    typeLabel: 'But Décisif',
    authorName: 'Yanis Benali',
    durationSec: 18,
  },
  {
    id: 'clip-2',
    title: 'Double parade réflexe sur corner',
    matchTitle: 'U17 R2 vs FC Versailles',
    minute: '42’',
    type: 'save',
    typeLabel: 'Arrêt Réflexe',
    authorName: 'Enzo Gauthier',
    durationSec: 14,
  },
  {
    id: 'clip-3',
    title: 'Contre-attaque à 4 touches de balle',
    matchTitle: 'U17 R2 vs FC Versailles',
    minute: '71’',
    type: 'transition',
    typeLabel: 'Transition Rapide',
    authorName: 'Lucas Moreau',
    durationSec: 22,
  },
  {
    id: 'clip-4',
    title: 'Combinaison corner rentrant',
    matchTitle: 'U15 R2 vs ACBB',
    minute: '15’',
    type: 'set_piece',
    typeLabel: 'Coup de Pied Arrêté',
    authorName: 'Sofiane Rahmani',
    durationSec: 16,
  },
];

type Props = {
  videos?: MatchVideoItem[];
  clips?: SmartClipItem[];
  onPlayVideo?: (videoId: string) => void;
  onPlayClip?: (clipId: string) => void;
};

export function ClubVideoHub({
  videos = DEMO_VIDEOS,
  clips = DEMO_CLIPS,
  onPlayVideo,
  onPlayClip,
}: Props) {
  const { tokens } = useClubTheme();
  const [activeTab, setActiveTab] = useState<'matches' | 'clips' | 'brief'>('brief');
  const [clipFilter, setClipFilter] = useState<HighlightTag>('all');

  const filteredClips = useMemo(() => {
    if (clipFilter === 'all') return clips;
    return clips.filter((c) => c.type === clipFilter);
  }, [clips, clipFilter]);

  const handlePlayClip = (clip: SmartClipItem) => {
    if (onPlayClip) {
      onPlayClip(clip.id);
    } else {
      Alert.alert(
        'Lecture du Clip IA',
        `Lecture de "${clip.title}" (${clip.authorName}, ${clip.minute}) du match ${clip.matchTitle}.`,
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Onglets Navigation Vidéo */}
      <View style={[styles.tabBar, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
        <PressableSpring
          onPress={() => setActiveTab('brief')}
          style={[styles.tabItem, activeTab === 'brief' && { backgroundColor: tokens.accentSoft }]}
          scaleTo={0.97}
        >
          <Icon
            name="star-four-points"
            size={14}
            color={activeTab === 'brief' ? tokens.accent : tokens.muted}
          />
          <ProDayText
            style={[
              styles.tabText,
              { color: activeTab === 'brief' ? tokens.accent : tokens.muted },
            ]}
          >
            Le Brief du Lundi
          </ProDayText>
        </PressableSpring>

        <PressableSpring
          onPress={() => setActiveTab('clips')}
          style={[styles.tabItem, activeTab === 'clips' && { backgroundColor: tokens.accentSoft }]}
          scaleTo={0.97}
        >
          <Icon
            name="flash"
            size={14}
            color={activeTab === 'clips' ? tokens.accent : tokens.muted}
          />
          <ProDayText
            style={[
              styles.tabText,
              { color: activeTab === 'clips' ? tokens.accent : tokens.muted },
            ]}
          >
            Clips & Buts IA ({clips.length})
          </ProDayText>
        </PressableSpring>

        <PressableSpring
          onPress={() => setActiveTab('matches')}
          style={[styles.tabItem, activeTab === 'matches' && { backgroundColor: tokens.accentSoft }]}
          scaleTo={0.97}
        >
          <Icon
            name="videocam"
            size={14}
            color={activeTab === 'matches' ? tokens.accent : tokens.muted}
          />
          <ProDayText
            style={[
              styles.tabText,
              { color: activeTab === 'matches' ? tokens.accent : tokens.muted },
            ]}
          >
            Matchs Complets ({videos.length})
          </ProDayText>
        </PressableSpring>
      </View>

      {/* VUE 1 : LE BRIEF DU LUNDI MATIN (IA SPORT SUMMARY) */}
      {activeTab === 'brief' ? (
        <View style={[styles.briefCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          <View style={styles.briefHeader}>
            <View style={[styles.aiIconBox, { backgroundColor: tokens.accentSoft }]}>
              <Icon name="star-four-points" size={18} color={tokens.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <ProDayText style={[styles.briefTitle, { color: tokens.foreground }]}>
                Le Brief Sportif du Lundi Matin
              </ProDayText>
              <ProDayText style={[styles.briefSubtitle, { color: tokens.muted }]}>
                Synthèse IA exécutive rédigée pour le Président et le Comité
              </ProDayText>
            </View>
          </View>

          {/* Stats clés du week-end */}
          <View style={[styles.briefStatsRow, { backgroundColor: tokens.bg, borderColor: tokens.border }]}>
            <View style={styles.briefStatItem}>
              <ProDayText style={[styles.briefStatVal, { color: tokens.accent }]}>
                4V · 1N · 1D
              </ProDayText>
              <ProDayText style={[styles.briefStatLabel, { color: tokens.muted }]}>
                Bilan week-end
              </ProDayText>
            </View>
            <View style={[styles.briefStatSep, { backgroundColor: tokens.border }]} />
            <View style={styles.briefStatItem}>
              <ProDayText style={[styles.briefStatVal, { color: '#10B981' }]}>
                14 Buts
              </ProDayText>
              <ProDayText style={[styles.briefStatLabel, { color: tokens.muted }]}>
                Attaque prolifique
              </ProDayText>
            </View>
            <View style={[styles.briefStatSep, { backgroundColor: tokens.border }]} />
            <View style={styles.briefStatItem}>
              <ProDayText style={[styles.briefStatVal, { color: '#3B82F6' }]}>
                3 Cleans
              </ProDayText>
              <ProDayText style={[styles.briefStatLabel, { color: tokens.muted }]}>
                Solidité défensive
              </ProDayText>
            </View>
          </View>

          {/* Analyse narrative de l'IA */}
          <View style={styles.briefNarrative}>
            <ProDayText style={[styles.narrativeParagraph, { color: tokens.foreground }]}>
              • <ProDayText style={{ fontWeight: '700' }}>Seniors R1</ProDayText> : Victoire de caractère 2-1 contre le RC France. L’entrée de Yanis Benali à la 65e a débloqué le jeu, ponctuée d’une frappe enroulée décisive.
            </ProDayText>
            <ProDayText style={[styles.narrativeParagraph, { color: tokens.foreground }]}>
              • <ProDayText style={{ fontWeight: '700' }}>U17 R2</ProDayText> : Succès 3-2 à Versailles. Très grosse intensité dans les transitions avec un doublé de Lucas Moreau.
            </ProDayText>
            <ProDayText style={[styles.narrativeParagraph, { color: tokens.foreground }]}>
              • <ProDayText style={{ fontWeight: '700' }}>Point Médical</ProDayText> : Sortie préventive d’Enzo Vallet à la 78e pour gêne aux ischios. Consultation kiné programmée mardi.
            </ProDayText>
          </View>

          <View style={[styles.briefFooter, { borderTopColor: tokens.border }]}>
            <PressableSpring
              onPress={() =>
                Alert.alert(
                  'Partage du Brief',
                  'Le compte-rendu du week-end a été partagé dans le canal "Flux Officiel Bureau".',
                )
              }
              style={[styles.shareBriefBtn, { backgroundColor: tokens.accent }]}
              scaleTo={0.97}
            >
              <Icon name="share" size={14} color="#000000" />
              <ProDayText style={styles.shareBriefBtnText}>
                Diffuser au Comité Directeur
              </ProDayText>
            </PressableSpring>
          </View>
        </View>
      ) : null}

      {/* VUE 2 : CLIPS ET BUTS IA */}
      {activeTab === 'clips' ? (
        <View style={styles.clipsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.clipsFilterRow}
          >
            {(
              [
                { id: 'all', label: 'Tous les clips' },
                { id: 'goal', label: 'Buts' },
                { id: 'save', label: 'Arrêts' },
                { id: 'transition', label: 'Transitions' },
                { id: 'set_piece', label: 'Coups de pied arrêtés' },
              ] as { id: HighlightTag; label: string }[]
            ).map((f) => (
              <PressableSpring
                key={f.id}
                onPress={() => setClipFilter(f.id)}
                style={[
                  styles.filterPill,
                  clipFilter === f.id
                    ? { backgroundColor: tokens.accent, borderColor: tokens.accent }
                    : { backgroundColor: tokens.surface, borderColor: tokens.border },
                ]}
                scaleTo={0.96}
              >
                <ProDayText
                  style={[
                    styles.filterPillText,
                    clipFilter === f.id ? { color: '#000000', fontWeight: '700' } : { color: tokens.muted },
                  ]}
                >
                  {f.label}
                </ProDayText>
              </PressableSpring>
            ))}
          </ScrollView>

          <View style={styles.clipsList}>
            {filteredClips.map((clip) => (
              <PressableSpring
                key={clip.id}
                onPress={() => handlePlayClip(clip)}
                style={[styles.clipCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
                scaleTo={0.98}
              >
                <View style={styles.clipLeft}>
                  <View style={[styles.playIconBox, { backgroundColor: tokens.accentSoft }]}>
                    <Icon name="play" size={18} color={tokens.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ProDayText style={[styles.clipTitle, { color: tokens.foreground }]}>
                      {clip.title}
                    </ProDayText>
                    <ProDayText style={[styles.clipMeta, { color: tokens.muted }]}>
                      {clip.authorName} ({clip.minute}) · {clip.matchTitle}
                    </ProDayText>
                  </View>
                </View>

                <View style={[styles.clipBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <ProDayText style={[styles.clipBadgeText, { color: tokens.accent }]}>
                    {clip.durationSec}s · {clip.typeLabel}
                  </ProDayText>
                </View>
              </PressableSpring>
            ))}
          </View>
        </View>
      ) : null}

      {/* VUE 3 : MATCHS COMPLETS */}
      {activeTab === 'matches' ? (
        <View style={styles.matchesList}>
          {videos.map((vid) => (
            <PressableSpring
              key={vid.id}
              onPress={() => onPlayVideo?.(vid.id)}
              style={[styles.videoCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
              scaleTo={0.98}
            >
              <View style={styles.videoCardTop}>
                <View style={[styles.videoBadge, { backgroundColor: tokens.accentSoft }]}>
                  <Icon name="videocam" size={14} color={tokens.accent} />
                  <ProDayText style={[styles.videoBadgeText, { color: tokens.accent }]}>
                    {vid.sourceLabel}
                  </ProDayText>
                </View>
                <ProDayText style={[styles.videoDuration, { color: tokens.muted }]}>
                  {vid.durationStr}
                </ProDayText>
              </View>

              <ProDayText style={[styles.videoTitle, { color: tokens.foreground }]}>
                {vid.title}
              </ProDayText>

              <View style={[styles.videoFooter, { borderTopColor: tokens.border }]}>
                <ProDayText style={[styles.videoMeta, { color: tokens.muted }]}>
                  {vid.category} · Score : {vid.score} · {vid.viewsCount} vues
                </ProDayText>
                <View style={styles.clipsCountRow}>
                  <Icon name="flash" size={13} color={tokens.accent} />
                  <ProDayText style={[styles.clipsCountText, { color: tokens.accent }]}>
                    {vid.clipsCount} clips IA générés
                  </ProDayText>
                </View>
              </View>
            </PressableSpring>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: clubSpace.lg,
    paddingTop: 8,
    gap: 14,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 9,
  },
  tabText: {
    ...APPLE_TYPOGRAPHY.footnote,
    fontWeight: '600',
  },
  briefCard: {
    borderRadius: clubRadius.lg,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  briefHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  briefTitle: {
    ...APPLE_TYPOGRAPHY.headline,
  },
  briefSubtitle: {
    ...APPLE_TYPOGRAPHY.caption1,
    marginTop: 2,
  },
  briefStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  briefStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  briefStatVal: {
    ...APPLE_TYPOGRAPHY.subheadline,
    fontWeight: '700',
  },
  briefStatLabel: {
    ...APPLE_TYPOGRAPHY.caption1,
    marginTop: 2,
  },
  briefStatSep: {
    width: 1,
    height: 24,
  },
  briefNarrative: {
    gap: 8,
  },
  narrativeParagraph: {
    ...APPLE_TYPOGRAPHY.footnote,
    lineHeight: 20,
  },
  briefFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    alignItems: 'flex-end',
  },
  shareBriefBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  shareBriefBtnText: {
    ...APPLE_TYPOGRAPHY.caption1,
    fontWeight: '700',
    color: '#000000',
  },
  clipsContainer: {
    gap: 12,
  },
  clipsFilterRow: {
    gap: 8,
    paddingBottom: 4,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterPillText: {
    ...APPLE_TYPOGRAPHY.footnote,
  },
  clipsList: {
    gap: 10,
    paddingBottom: 40,
  },
  clipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: clubRadius.lg,
    borderWidth: 1,
  },
  clipLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  playIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clipTitle: {
    ...APPLE_TYPOGRAPHY.subheadline,
    fontWeight: '600',
  },
  clipMeta: {
    ...APPLE_TYPOGRAPHY.caption1,
    marginTop: 2,
  },
  clipBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  clipBadgeText: {
    ...APPLE_TYPOGRAPHY.caption1,
    fontWeight: '700',
  },
  matchesList: {
    gap: 12,
    paddingBottom: 40,
  },
  videoCard: {
    padding: 16,
    borderRadius: clubRadius.lg,
    borderWidth: 1,
    gap: 10,
  },
  videoCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  videoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  videoBadgeText: {
    ...APPLE_TYPOGRAPHY.caption1,
    fontWeight: '600',
  },
  videoDuration: {
    ...APPLE_TYPOGRAPHY.caption1,
  },
  videoTitle: {
    ...APPLE_TYPOGRAPHY.headline,
  },
  videoFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  videoMeta: {
    ...APPLE_TYPOGRAPHY.caption1,
  },
  clipsCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clipsCountText: {
    ...APPLE_TYPOGRAPHY.caption1,
    fontWeight: '600',
  },
});
