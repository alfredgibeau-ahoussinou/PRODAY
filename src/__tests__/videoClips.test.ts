import {
  buildVideoClip,
  clipDurationSec,
  clipsForPlayer,
  formatClipRange,
  sortClipsByTime,
  VIDEO_CLIP_TAG_LABELS,
  type CreateVideoClipInput,
  type VideoClip,
} from '../models/VideoClip';
import {
  annotationsAtTimestamp,
  buildVideoAnnotation,
  sortAnnotationsByTime,
  type VideoAnnotation,
} from '../models/VideoAnnotation';
import {
  buildEmptyMatchTalk,
  filterApprovedClips,
  sortedTalkItems,
  type MatchTalkBrief,
  type MatchTalkConsigne,
} from '../models/MatchTalkBrief';

describe('VideoClip model', () => {
  const baseInput: CreateVideoClipInput = {
    video_id: 'v1',
    match_id: 'm1',
    start_sec: 10,
    end_sec: 25,
    tag: 'goal',
    player_uids: ['p1', 'p2'],
    note: 'But de la tête',
    created_by: 'coach1',
  };

  test('buildVideoClip produces valid clip', () => {
    const clip = buildVideoClip(baseInput);
    expect(clip.id).toMatch(/^vclip_/);
    expect(clip.start_sec).toBe(10);
    expect(clip.end_sec).toBe(25);
    expect(clip.tag).toBe('goal');
    expect(clip.player_uids).toEqual(['p1', 'p2']);
    expect(clip.note).toBe('But de la tête');
  });

  test('buildVideoClip clamps negative start', () => {
    const clip = buildVideoClip({ ...baseInput, start_sec: -5 });
    expect(clip.start_sec).toBe(0);
  });

  test('buildVideoClip ensures end > start', () => {
    const clip = buildVideoClip({ ...baseInput, start_sec: 30, end_sec: 20 });
    expect(clip.end_sec).toBeGreaterThan(clip.start_sec);
  });

  test('clipDurationSec', () => {
    const clip = buildVideoClip(baseInput);
    expect(clipDurationSec(clip)).toBe(15);
  });

  test('formatClipRange', () => {
    const clip = buildVideoClip({ ...baseInput, start_sec: 65, end_sec: 130 });
    expect(formatClipRange(clip)).toBe('1:05 → 2:10');
  });

  test('sortClipsByTime', () => {
    const a = buildVideoClip({ ...baseInput, start_sec: 30, end_sec: 40 });
    const b = buildVideoClip({ ...baseInput, start_sec: 5, end_sec: 15 });
    const sorted = sortClipsByTime([a, b]);
    expect(sorted[0].start_sec).toBe(5);
    expect(sorted[1].start_sec).toBe(30);
  });

  test('clipsForPlayer filters by uid', () => {
    const c1 = buildVideoClip({ ...baseInput, player_uids: ['p1'] });
    const c2 = buildVideoClip({ ...baseInput, player_uids: ['p2'] });
    expect(clipsForPlayer([c1, c2], 'p1')).toHaveLength(1);
  });

  test('all tags have labels', () => {
    const tags = Object.keys(VIDEO_CLIP_TAG_LABELS);
    expect(tags.length).toBeGreaterThanOrEqual(8);
  });
});

describe('VideoAnnotation model', () => {
  test('buildVideoAnnotation', () => {
    const ann = buildVideoAnnotation({
      clip_id: 'c1',
      timestamp_sec: 12.5,
      type: 'arrow',
      data: { points: [{ x: 0.1, y: 0.2 }, { x: 0.5, y: 0.8 }], color: '#FF0000' },
      created_by: 'coach1',
    });
    expect(ann.id).toMatch(/^vann_/);
    expect(ann.data.strokeWidth).toBe(3);
    expect(ann.type).toBe('arrow');
  });

  test('annotationsAtTimestamp filters within tolerance', () => {
    const a1 = buildVideoAnnotation({
      clip_id: 'c1', timestamp_sec: 10, type: 'circle',
      data: { points: [{ x: 0.5, y: 0.5 }], color: '#00F' }, created_by: 'u',
    });
    const a2 = buildVideoAnnotation({
      clip_id: 'c1', timestamp_sec: 20, type: 'text',
      data: { points: [{ x: 0.1, y: 0.1 }], color: '#F00', text: 'Test' }, created_by: 'u',
    });
    expect(annotationsAtTimestamp([a1, a2], 10.3)).toHaveLength(1);
    expect(annotationsAtTimestamp([a1, a2], 15)).toHaveLength(0);
  });

  test('sortAnnotationsByTime', () => {
    const a = buildVideoAnnotation({
      clip_id: 'c1', timestamp_sec: 30, type: 'line',
      data: { points: [{ x: 0, y: 0 }, { x: 1, y: 1 }], color: '#F00' }, created_by: 'u',
    });
    const b = buildVideoAnnotation({
      clip_id: 'c1', timestamp_sec: 5, type: 'zone',
      data: { points: [{ x: 0, y: 0 }, { x: 0.5, y: 0.5 }], color: '#0F0' }, created_by: 'u',
    });
    const sorted = sortAnnotationsByTime([a, b]);
    expect(sorted[0].timestamp_sec).toBe(5);
  });
});

describe('MatchTalkBrief — causerie enhanced', () => {
  test('buildEmptyMatchTalk includes new fields', () => {
    const brief = buildEmptyMatchTalk('e1', 'u1', 'club1');
    expect(brief.consignes).toEqual([]);
    expect(brief.clip_order).toEqual([]);
    expect(brief.shared).toBe(false);
  });

  test('sortedTalkItems interleaves clips and consignes', () => {
    const brief: MatchTalkBrief = {
      ...buildEmptyMatchTalk('e1', 'u1'),
      clips: [
        { id: 'c1', label: 'But', minute: 12, analysis_verified: true, coach_approved: true, sort_order: 0 },
        { id: 'c2', label: 'Tir', minute: 30, analysis_verified: true, coach_approved: true, sort_order: 2 },
      ],
      consignes: [
        { id: 'con1', sort_order: 1, text: 'Pression haute après perte de balle' },
      ],
    };
    const items = sortedTalkItems(brief);
    expect(items).toHaveLength(3);
    expect(items[0].type).toBe('clip');
    expect(items[1].type).toBe('consigne');
    expect(items[2].type).toBe('clip');
  });
});

describe('clipInstruction parseClipRef (inline)', () => {
  function parseClipRef(body: string): { clipId: string; videoId: string } | null {
    const match = body.match(/\[clip:([^\]|]+)\|video:([^\]]+)\]/);
    if (!match) return null;
    return { clipId: match[1], videoId: match[2] };
  }

  test('extracts clip and video ids', () => {
    const body = 'Consigne\n[clip:abc123|video:vid456]';
    expect(parseClipRef(body)).toEqual({ clipId: 'abc123', videoId: 'vid456' });
  });

  test('returns null for no match', () => {
    expect(parseClipRef('nothing here')).toBeNull();
  });
});
