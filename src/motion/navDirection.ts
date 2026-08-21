import type { NavDirection } from './types';

/** Forward / back selon un ordre de sections (dock, tabs, menu). */
export function navDirectionFromOrder(
  order: readonly string[],
  from: string,
  to: string,
): NavDirection {
  if (from === to) return 1;
  const a = order.indexOf(from);
  const b = order.indexOf(to);
  if (a < 0 || b < 0) return 1;
  return b >= a ? 1 : -1;
}
