import {
  buildHighlightAnnotation,
  formatAnnotationTimestamp,
  annotationsForMedia,
} from '../core/recruitment/highlightAnnotation.engine';
import { buildOneClickRecruitmentPlan, oneClickProgress } from '../core/recruitment/oneClickRecruitment.engine';

describe('highlight annotations', () => {
  it('builds and sorts by timestamp', () => {
    const a = buildHighlightAnnotation({
      mediaUrl: 'https://cdn.example/h.mp4',
      timestampSec: 65,
      kind: 'strength',
      label: 'Accélération',
      authorUid: 's1',
    });
    expect(formatAnnotationTimestamp(a.timestamp_sec)).toBe('1:05');
    const b = buildHighlightAnnotation({
      mediaUrl: 'https://cdn.example/h.mp4',
      timestampSec: 12,
      kind: 'note',
      label: 'Contexte',
      authorUid: 's1',
    });
    const list = annotationsForMedia([a, b], 'https://cdn.example/h.mp4');
    expect(list[0].timestamp_sec).toBe(12);
    expect(list[1].timestamp_sec).toBe(65);
  });
});

describe('one-click progress after shortlist', () => {
  it('advances primary action', () => {
    const plan = buildOneClickRecruitmentPlan({
      playerUid: 'p1',
      opportunityScore: 80,
      opportunityBand: 'excellent',
      alreadyShortlisted: true,
    });
    expect(plan.primaryAction).not.toBe('shortlist');
    expect(oneClickProgress(plan).done).toBeGreaterThanOrEqual(1);
  });
});
