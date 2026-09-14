import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';

interface OpponentScout {
  id: string;
  name: string;
  rank: string;
  nextMatchDate: string;
  system: string;
  dangerPlayer: string;
  weakness: string;
}

interface PlayerGrowthReport {
  id: string;
  name: string;
  age: number;
  pos: string;
  progressionScore: number; // +X%
  radar: { tech: number; tact: number; phys: number; ment: number; reg: number };
  certifiedStatus: 'certified' | 'in_review';
}

const OPPONENTS_SCOUT: OpponentScout[] = [
  {
    id: 'opp1',
    name: 'RC France Academy',
    rank: '2e (35 pts)',
    nextMatchDate: 'Ce Dimanche · 15:00 (J17)',
    system: '3-5-2 Contre Direct',
    dangerPlayer: 'Numéro 9 (12 buts cette saison, fort jeu de tête)',
    weakness: 'Espaces béants dans le dos des pistons en transition défensive.',
  },
  {
    id: 'opp2',
    name: 'AS Montferrand',
    rank: '3e (31 pts)',
    nextMatchDate: 'Dimanche 22 Mars · 15:00 (J18)',
    system: '4-4-2 Bloc Médian Compact',
    dangerPlayer: 'Numéro 10 (Meneur créateur, 8 passes décisives)',
    weakness: 'Difficultés face à un pressing haut et intense dès la 60e minute.',
  },
  {
    id: 'opp3',
    name: 'Olympique Paris Sud',
    rank: '4e (27 pts)',
    nextMatchDate: 'Dimanche 29 Mars · 15:00 (J19)',
    system: '4-3-3 Attaque Posée',
    dangerPlayer: 'Ailier Gauche (Vitesse pure > 33 km/h)',
    weakness: 'Fragilité sur coups de pied arrêtés défensifs (35% des buts concédés).',
  },
];

const PLAYERS_GROWTH: PlayerGrowthReport[] = [
  {
    id: 'p1',
    name: 'Yanis B.',
    age: 19,
    pos: 'Avant-Centre',
    progressionScore: 19,
    radar: { tech: 84, tact: 80, phys: 88, ment: 82, reg: 85 },
    certifiedStatus: 'certified',
  },
  {
    id: 'p2',
    name: 'Lucas M.',
    age: 20,
    pos: 'Ailier Droit',
    progressionScore: 23,
    radar: { tech: 86, tact: 76, phys: 90, ment: 78, reg: 81 },
    certifiedStatus: 'certified',
  },
  {
    id: 'p3',
    name: 'Thomas D.',
    age: 21,
    pos: 'Milieu Défensif',
    progressionScore: 14,
    radar: { tech: 78, tact: 87, phys: 85, ment: 89, reg: 86 },
    certifiedStatus: 'certified',
  },
];

interface VoiceScoutNote {
  id: string;
  playerName: string;
  category: string;
  timestamp: string;
  duration: string;
  transcript: string;
  tags: string[];
  status: 'integrated' | 'pending';
}

const INITIAL_VOICE_NOTES: VoiceScoutNote[] = [
  {
    id: 'vn-1',
    playerName: 'Yanis B.',
    category: 'Match R1 (J16)',
    timestamp: 'Hier · 16:42',
    duration: '00:38',
    transcript: "Superbe appel contre-appel à la 34e min. Première touche orientée vers l'intérieur remarquable. Attention : replacement défensif lent après perte haute.",
    tags: ['Technique', 'Finition', 'Transition'],
    status: 'integrated',
  },
  {
    id: 'vn-2',
    playerName: 'Thomas D.',
    category: 'Entraînement - Rondo & Pressing',
    timestamp: 'Mardi · 19:15',
    duration: '00:45',
    transcript: "Capacité d'orientation du corps avant la passe en progression sous pression. Volume de course impressionnant, leadership vocal confirmé.",
    tags: ['Tactique', 'Athlétique', 'Mental'],
    status: 'integrated',
  },
];

export const CoachScoutingGrowthScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'growth' | 'vocal_scouting' | 'opponents' | 'staff_channel'>('growth');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [selectedPlayerName, setSelectedPlayerName] = useState('Yanis B.');
  const [transcriptText, setTranscriptText] = useState(
    "Observation terrain : Très bonne anticipation des trajectoires aériennes. Appui solide sur le pied gauche, orienter davantage le regard avant la relance."
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(['Technique', 'Athlétique']);
  const [voiceNotes, setVoiceNotes] = useState<VoiceScoutNote[]>(INITIAL_VOICE_NOTES);

  const handleToggleRecord = () => {
    if (!isRecording) {
      setIsRecording(true);
      setRecordingSeconds(1);
    } else {
      setIsRecording(false);
      Alert.alert('Retranscription IA Terminée', 'Votre dictée audio a été transcrite par l’IA ProDay. Vous pouvez l’ajuster avant validation.');
    }
  };

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleValidateVoiceNote = () => {
    if (!transcriptText.trim()) {
      Alert.alert('Texte vide', 'Veuillez dicter ou saisir une observation terrain.');
      return;
    }
    const newNote: VoiceScoutNote = {
      id: `vn-${Date.now()}`,
      playerName: selectedPlayerName,
      category: 'Observation terrain en direct',
      timestamp: "À l'instant",
      duration: isRecording ? `00:${recordingSeconds < 10 ? '0' : ''}${recordingSeconds}` : '00:32',
      transcript: transcriptText.trim(),
      tags: selectedTags.length > 0 ? selectedTags : ['Observation'],
      status: 'integrated',
    };
    setVoiceNotes([newNote, ...voiceNotes]);
    setIsRecording(false);
    setRecordingSeconds(0);
    Alert.alert(
      'Note Vocale Validée & Intégrée',
      `L'observation pour ${selectedPlayerName} a été intégrée avec succès dans son dossier joueur et son passeport de compétences.`
    );
  };

  const generateCertifiedDossier = (player: PlayerGrowthReport) => {
    Alert.alert(
      'Dossier ProDay Certifié Généré',
      `Le bilan de progression officiel certifié pour ${player.name} (+${player.progressionScore}% de progression) a été compilé. Prêt pour transmission aux recruteurs et cellules de détection.`
    );
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* 1. Header: 360° Scouting, Bilan & Staff */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="account-search" size={24} color="#64D2FF" />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.badgeRow}>
            <View style={styles.badgePsd}>
              <Text style={styles.badgePsdText}>ProSoccerData™ Standard</Text>
            </View>
            <View style={styles.badgeCert}>
              <Text style={styles.badgeCertText}>Certification ProDay</Text>
            </View>
          </View>
          <Text style={styles.headerTitle}>Scouting, Bilan 360° & Marketplace</Text>
          <Text style={styles.headerSubtitle}>Base adversaires, scouting vocal, dossiers certifiés et canal staff</Text>
        </View>
      </View>

      {/* 2. Top Segment Switcher */}
      <View style={styles.segmentBar}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'growth' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('growth')}
        >
          <Text style={[styles.segmentBtnText, activeTab === 'growth' && styles.segmentBtnTextActive]}>
            Bilan 360°
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'vocal_scouting' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('vocal_scouting')}
        >
          <Text style={[styles.segmentBtnText, activeTab === 'vocal_scouting' && styles.segmentBtnTextActive]}>
            Scouting Vocal
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'opponents' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('opponents')}
        >
          <Text style={[styles.segmentBtnText, activeTab === 'opponents' && styles.segmentBtnTextActive]}>
            Adversaires
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'staff_channel' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('staff_channel')}
        >
          <Text style={[styles.segmentBtnText, activeTab === 'staff_channel' && styles.segmentBtnTextActive]}>
            Canal Staff
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAB 1: 360° PLAYER GROWTH & CERTIFIED MARKETPLACE */}
      {activeTab === 'growth' && (
        <>
          <View style={styles.bannerMarketplace}>
            <MaterialCommunityIcons name="certificate" size={20} color="#C5A059" />
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerMarketplaceTitle}>Marketplace & Dossiers Certifiés FFF/ProDay</Text>
              <Text style={styles.bannerMarketplaceText}>
                Générez des fiches de progression 360° infalsifiables intégrant métriques GPS, notes de match et axes de travail.
              </Text>
            </View>
          </View>

          {PLAYERS_GROWTH.map((p) => (
            <View key={p.id} style={styles.playerGrowthCard}>
              <View style={styles.playerGrowthHeader}>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.playerGrowthName}>{p.name}</Text>
                    <View style={styles.certifiedTag}>
                      <Ionicons name="checkmark-circle" size={14} color="#30D158" />
                      <Text style={styles.certifiedTagText}>Certifié</Text>
                    </View>
                  </View>
                  <Text style={styles.playerGrowthMeta}>{p.pos} · {p.age} ans · Groupe Seniors R1</Text>
                </View>

                <View style={styles.progressionBadge}>
                  <Feather name="trending-up" size={14} color="#30D158" />
                  <Text style={styles.progressionBadgeText}>+{p.progressionScore} %</Text>
                </View>
              </View>

              {/* 5-Pillar Radar Scores Bar */}
              <View style={styles.radarScoresRow}>
                <View style={styles.radarScoreItem}>
                  <Text style={styles.radarScoreLabel}>TECH</Text>
                  <Text style={styles.radarScoreVal}>{p.radar.tech}</Text>
                </View>
                <View style={styles.radarScoreItem}>
                  <Text style={styles.radarScoreLabel}>TACT</Text>
                  <Text style={styles.radarScoreVal}>{p.radar.tact}</Text>
                </View>
                <View style={styles.radarScoreItem}>
                  <Text style={styles.radarScoreLabel}>PHYS</Text>
                  <Text style={styles.radarScoreVal}>{p.radar.phys}</Text>
                </View>
                <View style={styles.radarScoreItem}>
                  <Text style={styles.radarScoreLabel}>MENT</Text>
                  <Text style={styles.radarScoreVal}>{p.radar.ment}</Text>
                </View>
                <View style={styles.radarScoreItem}>
                  <Text style={styles.radarScoreLabel}>RÉGUL</Text>
                  <Text style={styles.radarScoreVal}>{p.radar.reg}</Text>
                </View>
              </View>

              {/* Generate Official Dossier CTA */}
              <TouchableOpacity
                style={styles.generateDossierBtn}
                activeOpacity={0.8}
                onPress={() => generateCertifiedDossier(p)}
              >
                <MaterialCommunityIcons name="file-certificate-outline" size={16} color="#000000" />
                <Text style={styles.generateDossierText}>Générer Dossier de Recrutement Certifié</Text>
              </TouchableOpacity>
            </View>
          ))}
        </>
      )}

      {/* TAB: SCOUTING VOCAL (Page 8) */}
      {activeTab === 'vocal_scouting' && (
        <View style={styles.vocalSection}>
          {/* Top Banner */}
          <View style={styles.bannerVocal}>
            <MaterialCommunityIcons name="microphone-message" size={22} color="#0A84FF" />
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerVocalTitle}>Scouting Vocal & Dictée Bord de Touche</Text>
              <Text style={styles.bannerVocalText}>
                Enregistrez vos observations terrain en direct. L'IA ProDay transcrit vos notes et les intègre instantanément au passeport du joueur.
              </Text>
            </View>
          </View>

          {/* Active Voice Recorder Card */}
          <View style={styles.vocalRecorderCard}>
            {/* Player Target Selector */}
            <Text style={styles.vocalLabel}>Joueur ciblé par l'observation :</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.playerPickerRow} contentContainerStyle={{ gap: 8 }}>
              {['Yanis B.', 'Lucas M.', 'Thomas D.', 'Collectif'].map((pName) => (
                <TouchableOpacity
                  key={pName}
                  style={[
                    styles.playerPickerPill,
                    selectedPlayerName === pName && styles.playerPickerPillActive,
                  ]}
                  onPress={() => setSelectedPlayerName(pName)}
                >
                  <Text
                    style={[
                      styles.playerPickerPillText,
                      selectedPlayerName === pName && styles.playerPickerPillTextActive,
                    ]}
                  >
                    {pName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Record / Stop Button */}
            <View style={styles.recordActionCenter}>
              <TouchableOpacity
                style={[
                  styles.recordBtn,
                  isRecording ? styles.recordBtnActive : styles.recordBtnIdle,
                ]}
                activeOpacity={0.85}
                onPress={handleToggleRecord}
              >
                <MaterialCommunityIcons
                  name={isRecording ? 'stop-circle' : 'microphone'}
                  size={32}
                  color="#FFFFFF"
                />
                <Text style={styles.recordBtnText}>
                  {isRecording
                    ? `Arrêter & Retranscrire (00:${recordingSeconds < 10 ? '0' : ''}${recordingSeconds})`
                    : "Démarrer l'enregistrement vocal terrain"}
                </Text>
              </TouchableOpacity>
              {isRecording && (
                <View style={styles.recordingLivePill}>
                  <View style={styles.recordingPulseDot} />
                  <Text style={styles.recordingLiveText}>Enregistrement en direct · Micro bord de terrain ouvert</Text>
                </View>
              )}
            </View>

            {/* AI Transcript Box */}
            <View style={styles.transcriptBox}>
              <View style={styles.transcriptHeader}>
                <View style={styles.transcriptLabelRow}>
                  <MaterialCommunityIcons name="text-box-search-outline" size={16} color="#64D2FF" />
                  <Text style={styles.transcriptTitle}>Retranscription IA ProDay</Text>
                </View>
                <View style={styles.editableBadge}>
                  <Text style={styles.editableBadgeText}>Éditable</Text>
                </View>
              </View>
              <TextInput
                style={styles.transcriptInput}
                multiline
                value={transcriptText}
                onChangeText={setTranscriptText}
                placeholder="Dictez ou saisissez l'observation du joueur..."
                placeholderTextColor="#636366"
              />
            </View>

            {/* Tags Attribution */}
            <Text style={styles.vocalLabel}>Catégorisation tactique & technique :</Text>
            <View style={styles.tagWrap}>
              {['Technique', 'Tactique', 'Athlétique', 'Mental', 'Finition', 'Transition', 'Pied faible'].map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.tagPill, isSelected && styles.tagPillActive]}
                    onPress={() => handleToggleTag(tag)}
                  >
                    <Text style={[styles.tagPillText, isSelected && styles.tagPillTextActive]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Validate Button */}
            <TouchableOpacity
              style={styles.validateVocalBtn}
              activeOpacity={0.85}
              onPress={handleValidateVoiceNote}
            >
              <Ionicons name="checkmark-done-circle" size={18} color="#000000" />
              <Text style={styles.validateVocalBtnText}>Valider & Intégrer au dossier joueur</Text>
            </TouchableOpacity>
          </View>

          {/* Section: Validated Field Notes History */}
          <Text style={[styles.sectionTitle, { marginTop: 18 }]}>
            Observations Validées & Intégrées aux Dossiers
          </Text>
          {voiceNotes.map((note) => (
            <View key={note.id} style={styles.voiceNoteCard}>
              <View style={styles.voiceNoteTop}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.voiceNotePlayer}>{note.playerName}</Text>
                    <View style={styles.integratedPill}>
                      <Ionicons name="checkmark-circle" size={12} color="#30D158" />
                      <Text style={styles.integratedPillText}>Dossier à jour</Text>
                    </View>
                  </View>
                  <Text style={styles.voiceNoteMeta}>
                    {note.category} · {note.timestamp} · {note.duration}
                  </Text>
                </View>
              </View>
              <Text style={styles.voiceNoteTranscript}>{note.transcript}</Text>
              <View style={styles.voiceNoteTagsRow}>
                {note.tags.map((t, idx) => (
                  <View key={idx} style={styles.voiceNoteTag}>
                    <Text style={styles.voiceNoteTagText}>{t}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* TAB 2: OPPONENT SCOUTING DATABASE */}
      {activeTab === 'opponents' && (
        <>
          <Text style={styles.sectionTitle}>Fiches de Veille & Scouting des Prochains Adversaires</Text>
          {OPPONENTS_SCOUT.map((opp) => (
            <View key={opp.id} style={styles.scoutOppCard}>
              <View style={styles.scoutOppTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.scoutOppName}>{opp.name}</Text>
                  <Text style={styles.scoutOppRank}>{opp.rank} · {opp.nextMatchDate}</Text>
                </View>
                <View style={styles.systemBadge}>
                  <Text style={styles.systemBadgeText}>{opp.system}</Text>
                </View>
              </View>

              <View style={styles.scoutDetailBox}>
                <Text style={styles.scoutDetailLabel}>Joueur Clé / Danger :</Text>
                <Text style={styles.scoutDetailVal}>{opp.dangerPlayer}</Text>
              </View>

              <View style={[styles.scoutDetailBox, { marginTop: 6, borderLeftColor: '#FF453A' }]}>
                <Text style={[styles.scoutDetailLabel, { color: '#FF453A' }]}>Faille Exploitable :</Text>
                <Text style={styles.scoutDetailVal}>{opp.weakness}</Text>
              </View>
            </View>
          ))}
        </>
      )}

      {/* TAB 3: STAFF ENCRYPTED CHANNEL */}
      {activeTab === 'staff_channel' && (
        <View style={styles.staffChannelCard}>
          <View style={styles.staffChannelHeader}>
            <MaterialCommunityIcons name="shield-lock-outline" size={18} color="#C5A059" />
            <Text style={styles.staffChannelTitle}>Canal Sécurisé du Staff Technique</Text>
          </View>
          <Text style={styles.staffChannelDesc}>
            Échanges confidentiels réservés aux entraîneurs, préparateur physique et staff médical.
          </Text>

          {/* AI Audio Briefing Pill */}
          <View style={styles.audioBriefPill}>
            <MaterialCommunityIcons name="waveform" size={20} color="#0A84FF" />
            <View style={{ flex: 1 }}>
              <Text style={styles.audioBriefTitle}>Brief Hebdomadaire Vocal IA (3 min)</Text>
              <Text style={styles.audioBriefSub}>Synthèse audio des charges d’entraînement et du plan match</Text>
            </View>
            <TouchableOpacity
              style={styles.playBriefBtn}
              onPress={() => Alert.alert('Lecture du Brief', 'Lecture audio du briefing staff en cours...')}
            >
              <Ionicons name="play" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Chat Messages */}
          <View style={styles.chatMessage}>
            <Text style={styles.chatAuthor}>Préparateur Physique · 09:15</Text>
            <Text style={styles.chatBody}>Lucas M. a ressenti une légère gêne aux ischio-jambiers. Son protocole vélo est validé pour ce soir.</Text>
          </View>

          <View style={styles.chatMessage}>
            <Text style={styles.chatAuthor}>Entraîneur Adjoint · 10:40</Text>
            <Text style={styles.chatBody}>Vidéo du match de RC France découpée. Leurs latéraux décrochent dès la 70e minute.</Text>
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
    borderColor: 'rgba(100, 210, 255, 0.25)',
    padding: 14,
    marginBottom: 14,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(100, 210, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  badgePsd: {
    backgroundColor: 'rgba(100, 210, 255, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgePsdText: {
    color: '#64D2FF',
    fontSize: 9,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  badgeCert: {
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeCertText: {
    color: '#C5A059',
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
  bannerMarketplace: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#141418',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.25)',
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  bannerMarketplaceTitle: {
    color: '#C5A059',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  bannerMarketplaceText: {
    color: '#8B8B9A',
    fontSize: 10,
    lineHeight: 14,
    fontFamily: '-apple-system',
    marginTop: 2,
  },
  playerGrowthCard: {
    backgroundColor: '#141418',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    marginBottom: 12,
  },
  playerGrowthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playerGrowthName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  certifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  certifiedTagText: {
    color: '#30D158',
    fontSize: 9,
    fontWeight: '700',
  },
  playerGrowthMeta: {
    color: '#8B8B9A',
    fontSize: 11,
    fontFamily: '-apple-system',
    marginTop: 2,
  },
  progressionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  progressionBadgeText: {
    color: '#30D158',
    fontSize: 12,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  radarScoresRow: {
    flexDirection: 'row',
    backgroundColor: '#1C1C22',
    borderRadius: 10,
    padding: 8,
    marginBottom: 12,
    justifyContent: 'space-around',
  },
  radarScoreItem: {
    alignItems: 'center',
  },
  radarScoreLabel: {
    color: '#8B8B9A',
    fontSize: 9,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  radarScoreVal: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: '-apple-system',
    marginTop: 2,
  },
  generateDossierBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#C5A059',
    borderRadius: 10,
    paddingVertical: 9,
  },
  generateDossierText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: '-apple-system',
    marginBottom: 10,
  },
  scoutOppCard: {
    backgroundColor: '#141418',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    marginBottom: 12,
  },
  scoutOppTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  scoutOppName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  scoutOppRank: {
    color: '#8B8B9A',
    fontSize: 11,
    fontFamily: '-apple-system',
    marginTop: 2,
  },
  systemBadge: {
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  systemBadgeText: {
    color: '#0A84FF',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  scoutDetailBox: {
    backgroundColor: '#1C1C22',
    borderRadius: 8,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#C5A059',
  },
  scoutDetailLabel: {
    color: '#C5A059',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  scoutDetailVal: {
    color: '#D1D1D6',
    fontSize: 11,
    fontFamily: '-apple-system',
    marginTop: 2,
  },
  staffChannelCard: {
    backgroundColor: '#141418',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
  },
  staffChannelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  staffChannelTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  staffChannelDesc: {
    color: '#8B8B9A',
    fontSize: 11,
    fontFamily: '-apple-system',
    marginBottom: 14,
  },
  audioBriefPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1C1C22',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(10, 132, 255, 0.25)',
    marginBottom: 14,
  },
  audioBriefTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  audioBriefSub: {
    color: '#8B8B9A',
    fontSize: 10,
    fontFamily: '-apple-system',
  },
  playBriefBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0A84FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatMessage: {
    backgroundColor: '#1C1C22',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  chatAuthor: {
    color: '#C5A059',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: '-apple-system',
    marginBottom: 2,
  },
  chatBody: {
    color: '#D1D1D6',
    fontSize: 11,
    lineHeight: 16,
    fontFamily: '-apple-system',
  },
  vocalSection: {
    marginBottom: 20,
  },
  bannerVocal: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#141418',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(10, 132, 255, 0.25)',
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  bannerVocalTitle: {
    color: '#0A84FF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  bannerVocalText: {
    color: '#8B8B9A',
    fontSize: 10,
    lineHeight: 14,
    fontFamily: '-apple-system',
    marginTop: 2,
  },
  vocalRecorderCard: {
    backgroundColor: '#141418',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    marginBottom: 12,
  },
  vocalLabel: {
    color: '#8B8B9A',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: '-apple-system',
    marginBottom: 8,
  },
  playerPickerRow: {
    marginBottom: 14,
  },
  playerPickerPill: {
    backgroundColor: '#1C1C22',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  playerPickerPillActive: {
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
    borderColor: '#0A84FF',
  },
  playerPickerPillText: {
    color: '#8B8B9A',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  playerPickerPillTextActive: {
    color: '#0A84FF',
    fontWeight: '700',
  },
  recordActionCenter: {
    alignItems: 'center',
    marginVertical: 10,
  },
  recordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: '100%',
  },
  recordBtnIdle: {
    backgroundColor: '#0A84FF',
  },
  recordBtnActive: {
    backgroundColor: '#FF3B30',
  },
  recordBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  recordingLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  recordingPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  recordingLiveText: {
    color: '#FF3B30',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  transcriptBox: {
    backgroundColor: '#1C1C22',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    marginVertical: 12,
  },
  transcriptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  transcriptLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  transcriptTitle: {
    color: '#64D2FF',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  editableBadge: {
    backgroundColor: 'rgba(100, 210, 255, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  editableBadgeText: {
    color: '#64D2FF',
    fontSize: 9,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  transcriptInput: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: '-apple-system',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  tagPill: {
    backgroundColor: '#1C1C22',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tagPillActive: {
    backgroundColor: 'rgba(197, 160, 89, 0.2)',
    borderColor: '#C5A059',
  },
  tagPillText: {
    color: '#8B8B9A',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  tagPillTextActive: {
    color: '#C5A059',
    fontWeight: '700',
  },
  validateVocalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#C5A059',
    borderRadius: 12,
    paddingVertical: 12,
  },
  validateVocalBtnText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  voiceNoteCard: {
    backgroundColor: '#141418',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    marginBottom: 10,
  },
  voiceNoteTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  voiceNotePlayer: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  integratedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  integratedPillText: {
    color: '#30D158',
    fontSize: 9,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  voiceNoteMeta: {
    color: '#8B8B9A',
    fontSize: 10,
    fontFamily: '-apple-system',
    marginTop: 2,
  },
  voiceNoteTranscript: {
    color: '#D1D1D6',
    fontSize: 11,
    lineHeight: 16,
    fontFamily: '-apple-system',
    marginBottom: 8,
  },
  voiceNoteTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  voiceNoteTag: {
    backgroundColor: '#1C1C22',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  voiceNoteTagText: {
    color: '#8B8B9A',
    fontSize: 9,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
});
