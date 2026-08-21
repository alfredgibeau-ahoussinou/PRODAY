import React from 'react';
import { ModalSheet, type ModalSheetProps } from '../../../motion';
import { ADMIN_TOKENS } from '../theme/adminTokens';

type Props = Omit<
  ModalSheetProps,
  'backgroundColor' | 'borderColor' | 'handleColor' | 'backdropColor'
> & {
  /** Conservé pour API Admin existante. */
  contentStyle?: ModalSheetProps['contentStyle'];
};

/**
 * Modal / bottom-sheet admin — chrome ADMIN_TOKENS + motion global.
 */
export function AdminModalSheet(props: Props) {
  const t = ADMIN_TOKENS;
  return (
    <ModalSheet
      {...props}
      backgroundColor={t.bg}
      borderColor={t.border}
      handleColor={t.borderStrong}
    />
  );
}
