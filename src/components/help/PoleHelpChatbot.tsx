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

  if (!visible) return null;

  return (
    <>
      {!open ? (
        <PoleHelpWidget
          expanded={showBubble}
          teaser={content.bubbleTeaser}
          usesBriefcaseIcon={usesBriefcaseIcon}
          colors={helpColors}
          onOpen={openChat}
          onCollapse={dismissBubble}
        />
      ) : null}

      <PoleHelpPanel
        visible={open}
        content={content}
        questionCount={questionCount}
        usesBriefcaseIcon={usesBriefcaseIcon}
        onClose={closeChat}
      />
    </>
  );
};
