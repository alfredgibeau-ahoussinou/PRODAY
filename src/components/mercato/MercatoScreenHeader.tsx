import React from 'react';
import { ProDayModuleHeader } from '../ui/ProDayModuleHeader';
import type { IconName } from '../ui/Icon';

interface MercatoScreenHeaderProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  badgeIcon?: IconName;
  rightAction?: React.ReactNode;
}

/** En-tête Mercato — délègue au module header ProDay. */
export const MercatoScreenHeader: React.FC<MercatoScreenHeaderProps> = ({
  eyebrow,
  title,
  subtitle,
  badgeIcon = 'search',
  rightAction,
}) => (
  <ProDayModuleHeader
    eyebrow={eyebrow}
    title={title}
    subtitle={subtitle}
    icon={badgeIcon}
    rightAction={rightAction}
  />
);
