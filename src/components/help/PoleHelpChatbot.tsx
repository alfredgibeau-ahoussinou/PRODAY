import React, { useCallback, useMemo, useState } from 'react';
import { useAppTheme } from '../../context/ProductLineContext';
import { usePoleHelpChatbot } from '../../hooks/usePoleHelpChatbot';
import { getPoleHelpQuestionCount } from '../../content/poleHelpContent';
import { PoleHelpPanel } from './PoleHelpPanel';
import { PoleHelpWidget } from './PoleHelpWidget';

export const PoleHelpChatbot: React.FC = () => {
  const { colors, productLine } = useAppTheme();
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

  if (!visible) return null;

  return (
    <>
      {!open ? (
        <PoleHelpWidget
          expanded={showBubble}
          teaser={content.bubbleTeaser}
          usesBriefcaseIcon={usesBriefcaseIcon}
          colors={colors}
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
