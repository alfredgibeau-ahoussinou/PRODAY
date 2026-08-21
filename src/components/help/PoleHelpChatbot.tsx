import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppTheme } from '../../context/ProductLineContext';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { usePlayerThemeColors } from '../../context/PlayerThemeContext';
import { usePoleHelpChatbot } from '../../hooks/usePoleHelpChatbot';
import { getPoleHelpQuestionCount } from '../../content/poleHelpContent';
import { PoleHelpPanel } from './PoleHelpPanel';
import { PoleHelpWidget } from './PoleHelpWidget';
import { registerClubHelpOpener } from '../../features/club/shell/clubHelpOpen';
import { registerCoachHelpOpener } from '../../features/coach/shell/coachHelpOpen';
import { ClubCopilotSheet } from '../../features/club/ai/ClubCopilotSheet';

function isClubPoleHelp(
  productLine: string,
  role: string | null | undefined,
): boolean {
  return productLine === 'pro_club' || role === 'club';
}

export const PoleHelpChatbot: React.FC = () => {
  const { colors, productLine } = useAppTheme();
  const profile = useSessionProfile();
  const playerColors = usePlayerThemeColors();
  const helpColors = useMemo(
    () =>
      profile?.role === 'player'
        ? {
            ...colors,
            brand: playerColors.accent,
            brandSoft: playerColors.accentSoft,
            accent: playerColors.accent,
            accentSoft: playerColors.accentSoft,
          }
        : colors,
    [colors, playerColors.accent, playerColors.accentSoft, profile?.role],
  );
  const { visible, content, usesBriefcaseIcon, showBubble, dismissBubble } =
    usePoleHelpChatbot(productLine);
  const [open, setOpen] = useState(false);
  const clubMode = isClubPoleHelp(productLine, profile?.role);

  const questionCount = useMemo(() => getPoleHelpQuestionCount(content), [content]);

  const openChat = useCallback(() => {
    setOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    registerClubHelpOpener(openChat);
    registerCoachHelpOpener(openChat);
    return () => {
      registerClubHelpOpener(null);
      registerCoachHelpOpener(null);
    };
  }, [openChat]);

  if (!visible && !open) return null;

  const clubWidgetContent = {
    ...content,
    title: 'Copilote Club',
    bubbleTeaser: 'Pose une question — dialogue Mistral',
  };

  return (
    <>
      {visible && !open ? (
        <PoleHelpWidget
          expanded={showBubble}
          teaser={clubMode ? clubWidgetContent.bubbleTeaser : content.bubbleTeaser}
          title={clubMode ? clubWidgetContent.title : undefined}
          usesBriefcaseIcon={usesBriefcaseIcon}
          colors={helpColors}
          onOpen={openChat}
          onCollapse={dismissBubble}
        />
      ) : null}

      {clubMode ? (
        <ClubCopilotSheet visible={open} onClose={closeChat} />
      ) : (
        <PoleHelpPanel
          visible={open}
          content={content}
          questionCount={questionCount}
          usesBriefcaseIcon={usesBriefcaseIcon}
          onClose={closeChat}
        />
      )}
    </>
  );
};
