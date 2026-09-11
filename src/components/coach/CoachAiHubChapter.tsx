import React, { useState } from 'react';
import type { CoachChapterCommonProps } from './coachPortalUi';
import { CoachAiDashboard, type AiPageId } from './ai/CoachAiDashboard';
import { CoachAiTrainingGen } from './ai/CoachAiTrainingGen';
import { CoachAiOpponentAnalysis } from './ai/CoachAiOpponentAnalysis';
import { CoachAiFreeChat } from './ai/CoachAiFreeChat';
import { CoachAiTacticsSheet } from './CoachAiTacticsSheet';
import { useCoachShellNav } from '../../features/coach/shell/CoachShellNavContext';
import { useCoachTheme } from '../../features/coach/shell/CoachThemeContext';
import {
  loadCoachPitchPresets,
  saveCoachPitchLineup,
  saveCoachPitchPresets,
  type CoachTacticalPreset,
} from '../../utils/coachPitchLineup';

type Props = CoachChapterCommonProps;

export const CoachAiHubChapter: React.FC<Props> = (props) => {
  const [currentPage, setCurrentPage] = useState<AiPageId | 'dashboard'>('dashboard');
  const shellNav = useCoachShellNav();
  const { teamId } = useCoachTheme();
  const storageKey = teamId ?? (props.profile.profile.club_id ? `club:${props.profile.profile.club_id}` : 'coach_default');

  const handleApplyPresetToTeam = async (preset: CoachTacticalPreset) => {
    try {
      const existing = await loadCoachPitchPresets(storageKey, props.members.map((m) => m.uid));
      const updated = [preset, ...existing.filter((p) => p.id !== preset.id)];
      await saveCoachPitchPresets(storageKey, updated);
      await saveCoachPitchLineup(storageKey, {
        formation: preset.formation,
        starterUids: preset.starterUids,
      });
    } catch {
      // Ignored in offline preview
    }
    setCurrentPage('dashboard');
    if (shellNav) {
      shellNav.requestNav('equipe');
    }
  };

  if (currentPage === 'training') {
    return <CoachAiTrainingGen onBack={() => setCurrentPage('dashboard')} {...props} />;
  }

  if (currentPage === 'opponent') {
    return <CoachAiOpponentAnalysis onBack={() => setCurrentPage('dashboard')} {...props} />;
  }

  if (currentPage === 'tactics') {
    return (
      <>
        <CoachAiDashboard onSelectPage={setCurrentPage} />
        <CoachAiTacticsSheet
          visible={true}
          onClose={() => setCurrentPage('dashboard')}
          members={props.members}
          onApplyPreset={handleApplyPresetToTeam}
        />
      </>
    );
  }

  if (currentPage === 'chat') {
    return <CoachAiFreeChat onBack={() => setCurrentPage('dashboard')} />;
  }

  return <CoachAiDashboard onSelectPage={setCurrentPage} />;
};
