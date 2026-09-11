import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ProDayText } from '../../components/ui/ProDayText';
import { PressableSpring } from '../../components/motion';
import { PlayerCoachAiChat } from '../../components/joueur/PlayerCoachAiChat';
import { usePlayerTheme } from '../../context/PlayerThemeContext';
import { joueurGamePress } from '../../features/joueur/joueurSfx';

type Props = {
  onBack: () => void;
  initialPrompt?: string;
};

/**
 * Interface Épurée Style ChatGPT / Google Gemini pour le Coach Joueur
 */
export function JoueurTacticsCoachScreen({ onBack, initialPrompt }: Props) {
  const insets = useSafeAreaInsets();
  const { colors: playerTheme, clubColors } = usePlayerTheme();
  const teamColor = clubColors?.primary || playerTheme.accent || '#00E676';
  const [chatKey, setChatKey] = useState(1);

  const handleResetChat = () => {
    joueurGamePress();
    setChatKey((k) => k + 1);
  };

  return (
    <View style={styles.root}>
      {/* 1. En-tête Minimaliste Style ChatGPT / Gemini */}
      <View style={[styles.header, { paddingTop: 6 }]}>
        {/* Bouton Retour Épuré */}
        <TouchableOpacity
          onPress={() => {
            joueurGamePress();
            onBack();
          }}
          style={styles.iconButton}
          activeOpacity={0.7}
          accessibilityLabel="Retour"
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Pilule Centrale Modèle IA Gemini */}
        <View style={styles.modelPill}>
          <Ionicons name="sparkles" size={14} color={teamColor} />
          <ProDayText style={styles.modelTitle}>Gemini Coach</ProDayText>
          <Ionicons name="chevron-down" size={12} color="#71717A" style={{ marginLeft: 2 }} />
        </View>

        {/* Bouton Nouvelle Discussion */}
        <TouchableOpacity
          onPress={handleResetChat}
          style={styles.iconButton}
          activeOpacity={0.7}
          accessibilityLabel="Nouvelle discussion"
        >
          <Ionicons name="create-outline" size={22} color="#A1A1AA" />
        </TouchableOpacity>
      </View>

      {/* 2. Corps de la Conversation */}
      <View style={styles.chatWrapper}>
        <PlayerCoachAiChat key={chatKey} initialPrompt={initialPrompt} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  modelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#16161D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  modelTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  chatWrapper: {
    flex: 1,
  },
});
