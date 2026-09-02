import React, { useState } from 'react';
import type { CoachChapterCommonProps } from './coachPortalUi';
import { CoachAiDashboard, type AiPageId } from './ai/CoachAiDashboard';
import { CoachAiTrainingGen } from './ai/CoachAiTrainingGen';
import { CoachAiOpponentAnalysis } from './ai/CoachAiOpponentAnalysis';
import { CoachAiFreeChat } from './ai/CoachAiFreeChat';

type Props = CoachChapterCommonProps;

export const CoachAiHubChapter: React.FC<Props> = (props) => {
  const [currentPage, setCurrentPage] = useState<AiPageId | 'dashboard'>('dashboard');

  if (currentPage === 'training') {
    return <CoachAiTrainingGen onBack={() => setCurrentPage('dashboard')} />;
  }

  if (currentPage === 'opponent') {
    return <CoachAiOpponentAnalysis onBack={() => setCurrentPage('dashboard')} />;
  }

  if (currentPage === 'chat') {
    return <CoachAiFreeChat onBack={() => setCurrentPage('dashboard')} />;
  }

  return <CoachAiDashboard onSelectPage={setCurrentPage} />;
};
