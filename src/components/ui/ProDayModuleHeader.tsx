import React from 'react';
import { AppTabHeader } from '../app/AppTabHeader';
import type { IconName } from './Icon';

type ProDayModuleHeaderProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  icon?: IconName;
  rightAction?: React.ReactNode;
  showLogo?: boolean;
  showUniverseBadge?: boolean;
};

/** En-tête de module — style app native (délègue à AppTabHeader). */
export const ProDayModuleHeader: React.FC<ProDayModuleHeaderProps> = ({
  eyebrow,
  title,
  subtitle,
  rightAction,
}) => (
  <AppTabHeader
    safeTop={false}
    caption={eyebrow}
    title={title}
    subtitle={subtitle}
    right={rightAction}
  />
);
