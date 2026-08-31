import React, { useEffect, useState } from 'react';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { AdminText } from '../ui/adminUi';
import type { AdminTypeVariant } from '../theme/adminDesignSystem';
import { adminMotion } from './adminMotion';

type Props = {
  value: number;
  durationMs?: number;
  variant?: AdminTypeVariant;
  color?: string;
  format?: (n: number) => string;
};

/** Compteur animé — micro-feedback métriques dashboard. */
export function AdminAnimatedNumber({
  value,
  durationMs = adminMotion.duration.number,
  variant = 'statSm',
  color,
  format = (n) => String(Math.round(n)),
}: Props) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (reduced || !Number.isFinite(value)) {
      setDisplay(value);
      return;
    }
    const from = display;
    const to = value;
    if (from === to) return;
    const start = Date.now();
    let raf = 0;
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- animate from last rendered value
  }, [value, reduced, durationMs]);

  return (
    <AdminText variant={variant} color={color}>
      {format(display)}
    </AdminText>
  );
}
