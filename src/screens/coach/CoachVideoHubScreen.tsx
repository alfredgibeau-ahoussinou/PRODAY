import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';

interface VideoClip {
  id: string;
  title: string;
  duration: string;
  type: 'goal' | 'transition' | 'defensive' | 'setpiece';
  source: 'Veo Cam 3' | 'Smartphone 4K' | 'Drone';
  timestamp: string;
}

const DEFAULT_CLIPS: VideoClip[] = [
  { id: 'c1', title: 'But 2-1 : Récupération haute & finition Lucas M.', duration: '0:28', type: 'goal', source: 'Veo Cam 3', timestamp: '61’' },
  { id: 'c2', title: 'Transition Offensive : Sortie axiale rapide', duration: '0:42', type: 'transition', source: 'Veo Cam 3', timestamp: '34’' },
  { id: 'c3', title: 'Alignement Défensif : Couverture dos des latéraux', duration: '0:35', type: 'defensive', source: 'Smartphone 4K', timestamp: '52’' },
  { id: 'c4', title: 'Corner Sortant : Déviation 1er poteau Yanis B.', duration: '0:22', type: 'setpiece', source: 'Veo Cam 3', timestamp: '23’' },
];

export const CoachVideoHubScreen: React.FC = () => {
  const [clips, setClips] = useState<VideoClip[]>(DEFAULT_CLIPS);
  const [activeTab, setActiveTab] = useState<'clips' | 'causerie' | 'telestration'>('causerie');
  const [isCasting, setIsCasting] = useState(false);
  const [selectedTool, setSelectedTool] = useState<'spotlight' | 'distance' | 'arrow'>('spotlight');

  const toggleCasting = () => {
    setIsCasting(!isCasting);
    if (!isCasting) {
      Alert.alert(
        'Causerie Synchronisée Démarrée',
        'Le tableau noir et votre voix sont diffusés en direct sur les 16 smartphones des joueurs connectés au vestiaire.'
      );
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* 1. Header: Video Hub & Sync Locker */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="video-vintage" size={24} color="#BF5AF2" />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.badgeRow}>
            <View style={styles.badgeSource}>
              <Text style={styles.badgeSourceText}>Veo Cam 3 · 4K Sync</Text>
            </View>
            <View style={styles.badgeAi}>
              <Text style={styles.badgeAiText}>Clipping IA Automatique</Text>
            </View>
          </View>
          <Text style={styles.headerTitle}>Hub Vidéo, Telestration & Causerie</Text>
          <Text style={styles.headerSubtitle}>Indexation match, analyse visuelle et diffusion vestiaire</Text>
        </View>
      </View>

      {/* 2. Top Segment Switcher */}
      <View style={styles.segmentBar}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'causerie' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('causerie')}
        >
          <Text style={[styles.segmentBtnText, activeTab === 'causerie' && styles.segmentBtnTextActive]}>
            Causerie Vestiaire
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'clips' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('clips')}
        >
          <Text style={[styles.segmentBtnText, activeTab === 'clips' && styles.segmentBtnTextActive]}>
            Smart Highlights ({clips.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'telestration' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('telestration')}
        >
          <Text style={[styles.segmentBtnText, activeTab === 'telestration' && styles.segmentBtnTextActive]}>
            Telestration Pro
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAB 1: SYNC LOCKER CAUSERIE BOARD (INNOVATION) */}
      {activeTab === 'causerie' && (
        <View style={styles.causerieCard}>
          <View style={styles.causerieTop}>
            <View style={styles.syncStatusBadge}>
              <View style={[styles.syncDot, isCasting && styles.syncDotActive]} />
              <Text style={styles.syncStatusText}>
                {isCasting ? 'EN DIRECT · 16 Smartphones Vestiaire Connectés' : 'Diffusion Vestiaire en Attente'}
              </Text>
            </View>
          </View>

          <Text style={styles.causerieTitle}>Sync Locker Causerie Board™</Text>
          <Text style={styles.causerieDesc}>
            Diffusez vos schémas tactiques animés, annotations vectorielles et consignes vocales directement sur les téléphones de vos joueurs au vestiaire (avant-match & mi-temps).
          </Text>

          {/* Simulated Tactical Casting Screen View */}
          <View style={styles.castScreenPreview}>
            <View style={styles.castScreenHeader}>
              <MaterialCommunityIcons name="cast-connected" size={16} color="#30D158" />
              <Text style={styles.castScreenHeaderText}>ÉCRAN DIFFUSÉ AUX JOUEURS · SYSTÈME 4-3-3</Text>
            </View>
            <View style={styles.castVisual}>
              <MaterialCommunityIcons name="soccer-field" size={64} color="rgba(48, 209, 88, 0.3)" />
              <Text style={styles.castOverlayText}>« Insister sur les couloirs et le pressing à la perte »</Text>
            </View>
          </View>

          {/* Action Trigger Button */}
          <TouchableOpacity
            style={[styles.castBtn, isCasting && styles.castBtnActive]}
            activeOpacity={0.8}
            onPress={toggleCasting}
          >
            <MaterialCommunityIcons
              name={isCasting ? 'stop-circle' : 'broadcast'}
              size={18}
              color={isCasting ? '#FFFFFF' : '#000000'}
            />
            <Text style={[styles.castBtnText, isCasting && { color: '#FFFFFF' }]}>
              {isCasting ? 'Arrêter la Causerie en Direct' : 'Démarrer Causerie Synchronisée'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* TAB 2: SMART HIGHLIGHTS & CLIPS */}
      {activeTab === 'clips' && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="auto-fix" size={18} color="#C5A059" />
            <Text style={styles.cardTitle}>Moments Clés Découpés Automatiquement par l’IA</Text>
          </View>
          <Text style={styles.cardSubtitle}>Synchronisés depuis la caméra Veo du club</Text>

          {clips.map((clip) => (
            <View key={clip.id} style={styles.clipRow}>
              <View style={styles.clipThumb}>
                <MaterialCommunityIcons name="play-circle" size={24} color="#C5A059" />
                <View style={styles.clipDurationBadge}>
                  <Text style={styles.clipDurationText}>{clip.duration}</Text>
                </View>
              </View>

              <View style={styles.clipInfo}>
                <View style={styles.clipMetaRow}>
                  <Text style={styles.clipTimestamp}>Min {clip.timestamp}</Text>
                  <Text style={styles.tagDot}>•</Text>
                  <Text style={styles.clipSource}>{clip.source}</Text>
                </View>
                <Text style={styles.clipTitle}>{clip.title}</Text>
              </View>

              <TouchableOpacity
                style={styles.clipShareBtn}
                onPress={() => Alert.alert('Extrait Partagé', `Clip "${clip.title}" envoyé au groupe Joueurs.`)}
              >
                <Feather name="share-2" size={16} color="#0A84FF" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* TAB 3: TELESTRATION PRO TOOLS */}
      {activeTab === 'telestration' && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="draw-pen" size={18} color="#0A84FF" />
            <Text style={styles.cardTitle}>Outils de Telestration & Palette Graphique</Text>
          </View>

          <View style={styles.telestrationToolbar}>
            <TouchableOpacity
              style={[styles.teleBtn, selectedTool === 'spotlight' && styles.teleBtnActive]}
              onPress={() => setSelectedTool('spotlight')}
            >
              <MaterialCommunityIcons name="flashlight" size={16} color={selectedTool === 'spotlight' ? '#C5A059' : '#8B8B9A'} />
              <Text style={[styles.teleBtnText, selectedTool === 'spotlight' && styles.teleBtnTextActive]}>Spotlight Joueur</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.teleBtn, selectedTool === 'distance' && styles.teleBtnActive]}
              onPress={() => setSelectedTool('distance')}
            >
              <MaterialCommunityIcons name="ruler" size={16} color={selectedTool === 'distance' ? '#30D158' : '#8B8B9A'} />
              <Text style={[styles.teleBtnText, selectedTool === 'distance' && styles.teleBtnTextActive]}>Mesure Distance</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.teleBtn, selectedTool === 'arrow' && styles.teleBtnActive]}
              onPress={() => setSelectedTool('arrow')}
            >
              <MaterialCommunityIcons name="ray-start-arrow" size={16} color={selectedTool === 'arrow' ? '#0A84FF' : '#8B8B9A'} />
              <Text style={[styles.teleBtnText, selectedTool === 'arrow' && styles.teleBtnTextActive]}>Vecteur Course</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.teleCanvasPlaceholder}>
            <MaterialCommunityIcons name="image-edit-outline" size={48} color="rgba(255, 255, 255, 0.2)" />
            <Text style={styles.teleCanvasText}>
              Arrêt sur image vidéo actif : Appliquez vos dessins vectoriels pour la séance vidéo de vendredi.
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#141418',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(191, 90, 242, 0.25)',
    padding: 14,
    marginBottom: 14,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(191, 90, 242, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  badgeSource: {
    backgroundColor: 'rgba(191, 90, 242, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeSourceText: {
    color: '#BF5AF2',
    fontSize: 9,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  badgeAi: {
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeAiText: {
    color: '#0A84FF',
    fontSize: 9,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  headerSubtitle: {
    color: '#8B8B9A',
    fontSize: 11,
    fontFamily: '-apple-system',
    marginTop: 2,
  },
  segmentBar: {
    flexDirection: 'row',
    backgroundColor: '#141418',
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  segmentBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: '#1C1C22',
  },
  segmentBtnText: {
    color: '#8B8B9A',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  segmentBtnTextActive: {
    color: '#FFFFFF',
  },
  causerieCard: {
    backgroundColor: '#141418',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.25)',
    padding: 16,
    marginBottom: 14,
  },
  causerieTop: {
    marginBottom: 10,
  },
  syncStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8E8E93',
  },
  syncDotActive: {
    backgroundColor: '#30D158',
  },
  syncStatusText: {
    color: '#30D158',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  causerieTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: '-apple-system',
    marginBottom: 4,
  },
  causerieDesc: {
    color: '#8B8B9A',
    fontSize: 11,
    lineHeight: 16,
    fontFamily: '-apple-system',
    marginBottom: 14,
  },
  castScreenPreview: {
    backgroundColor: '#0D2416',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.3)',
    padding: 14,
    marginBottom: 14,
  },
  castScreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  castScreenHeaderText: {
    color: '#30D158',
    fontSize: 9,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  castVisual: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  castOverlayText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: '-apple-system',
    marginTop: 8,
    textAlign: 'center',
  },
  castBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#C5A059',
    borderRadius: 10,
    paddingVertical: 12,
  },
  castBtnActive: {
    backgroundColor: '#FF453A',
  },
  castBtnText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  card: {
    backgroundColor: '#141418',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  cardSubtitle: {
    color: '#8B8B9A',
    fontSize: 11,
    fontFamily: '-apple-system',
    marginBottom: 12,
  },
  clipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  clipThumb: {
    width: 60,
    height: 44,
    backgroundColor: '#1C1C22',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clipDurationBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 4,
    borderRadius: 3,
  },
  clipDurationText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
  },
  clipInfo: {
    flex: 1,
  },
  clipMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  clipTimestamp: {
    color: '#C5A059',
    fontSize: 10,
    fontWeight: '700',
  },
  tagDot: {
    color: '#636366',
    fontSize: 8,
  },
  clipSource: {
    color: '#8B8B9A',
    fontSize: 10,
  },
  clipTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  clipShareBtn: {
    padding: 8,
  },
  telestrationToolbar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  teleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1C1C22',
    paddingVertical: 8,
    borderRadius: 8,
  },
  teleBtnActive: {
    backgroundColor: 'rgba(10, 132, 255, 0.2)',
    borderWidth: 1,
    borderColor: '#0A84FF',
  },
  teleBtnText: {
    color: '#8B8B9A',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  teleBtnTextActive: {
    color: '#0A84FF',
  },
  teleCanvasPlaceholder: {
    height: 180,
    backgroundColor: '#1C1C22',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  teleCanvasText: {
    color: '#8B8B9A',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 10,
    fontFamily: '-apple-system',
  },
});
