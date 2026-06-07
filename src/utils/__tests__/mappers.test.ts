import { describe, it, expect } from 'vitest';
import { mapDayPlanRows } from '../mappers';
import type { DayPlanViewRow } from '../../types/database';

/** 建立最小合法的 DayPlanViewRow fixture */
function makeRow(overrides: Partial<DayPlanViewRow> = {}): DayPlanViewRow {
  return {
    day: 1,
    date: null,
    title: 'Day 1',
    themeColor: 'blue',
    transport: { mode: 'taxi', description: '計程車', icon: 'Car' },
    accommodation: null,
    activities: [],
    tickets: [],
    ...overrides,
  };
}

type ActivityItem = DayPlanViewRow['activities'][number];

/** 建立最小合法的 activity fixture */
function makeActivity(overrides: Partial<ActivityItem> = {}) {
  return {
    time: '09:00',
    title: '熊本城',
    description: null,
    isKidFriendly: true,
    isSeniorFriendly: true,
    mapQuery: null,
    mapUrl: null,
    photoUrl: null,
    priority: null,
    links: [],
    ...overrides,
  };
}

describe('mapDayPlanRows', () => {
  it('空陣列回傳空 Itinerary', () => {
    expect(mapDayPlanRows([])).toEqual([]);
  });

  it('day/title/themeColor 正確映射', () => {
    const result = mapDayPlanRows([makeRow({ day: 3, title: '阿蘇', themeColor: 'green' })]);
    expect(result[0].day).toBe(3);
    expect(result[0].title).toBe('阿蘇');
    expect(result[0].themeColor).toBe('green');
  });

  it('transport 為 null 時 fallback 到 public/Bus', () => {
    const result = mapDayPlanRows([makeRow({ transport: null })]);
    expect(result[0].transport).toEqual({ mode: 'public', description: '', icon: 'Bus' });
  });

  it('accommodation 為 null 時回傳 undefined', () => {
    const result = mapDayPlanRows([makeRow({ accommodation: null })]);
    expect(result[0].accommodation).toBeUndefined();
  });

  describe('activity 映射', () => {
    it('priority null → undefined', () => {
      const result = mapDayPlanRows([makeRow({ activities: [makeActivity({ priority: null })] })]);
      expect(result[0].activities[0].priority).toBeUndefined();
    });

    it("priority 'must' → 'must'", () => {
      const result = mapDayPlanRows([makeRow({ activities: [makeActivity({ priority: 'must' })] })]);
      expect(result[0].activities[0].priority).toBe('must');
    });

    it("priority 'optional' → 'optional'", () => {
      const result = mapDayPlanRows([makeRow({ activities: [makeActivity({ priority: 'optional' })] })]);
      expect(result[0].activities[0].priority).toBe('optional');
    });

    it('description null → undefined', () => {
      const result = mapDayPlanRows([makeRow({ activities: [makeActivity({ description: null })] })]);
      expect(result[0].activities[0].description).toBeUndefined();
    });

    it('links 空陣列 → undefined', () => {
      const result = mapDayPlanRows([makeRow({ activities: [makeActivity({ links: [] })] })]);
      expect(result[0].activities[0].links).toBeUndefined();
    });

    it('links 有值 → 保留陣列', () => {
      const links = [{ title: '官網', url: 'https://example.com' }];
      const result = mapDayPlanRows([makeRow({ activities: [makeActivity({ links })] })]);
      expect(result[0].activities[0].links).toEqual(links);
    });
  });

  describe('accommodation attachments 映射', () => {
    it('accommodation 有 attachments 時正確映射', () => {
      const row = makeRow({
        accommodation: {
          name: '熊本車站飯店',
          description: null,
          mapQuery: null,
          photoUrl: null,
          attachments: [{ type: 'pdf', url: 'https://example.com/file.pdf', label: '訂房確認' }],
          links: [],
        },
      });
      const result = mapDayPlanRows([row]);
      const att = result[0].accommodation?.attachments?.[0];
      expect(att?.type).toBe('pdf');
      expect(att?.url).toBe('https://example.com/file.pdf');
      expect(att?.label).toBe('訂房確認');
    });

    it('accommodation attachment 的 label null → undefined', () => {
      const row = makeRow({
        accommodation: {
          name: '熊本車站飯店',
          description: null,
          mapQuery: null,
          photoUrl: null,
          attachments: [{ type: 'image', url: 'https://example.com/photo.jpg', label: null }],
          links: [],
        },
      });
      const result = mapDayPlanRows([row]);
      const att = result[0].accommodation?.attachments?.[0];
      expect(att?.label).toBeUndefined();
    });
  });

  describe('accommodation links 映射', () => {
    it('accommodation links 有值 → 保留陣列', () => {
      const links = [
        { title: 'Agoda 訂房', url: 'https://agoda.com/test' },
        { title: '飯店官網', url: 'https://hotel.com' },
      ];
      const row = makeRow({
        accommodation: {
          name: 'Test Hotel',
          description: null,
          mapQuery: null,
          photoUrl: null,
          attachments: [],
          links,
        },
      });
      const [result] = mapDayPlanRows([row]);
      expect(result.accommodation?.links).toEqual(links);
    });

    it('accommodation links 為空陣列 → undefined', () => {
      const row = makeRow({
        accommodation: {
          name: 'Test Hotel',
          description: null,
          mapQuery: null,
          photoUrl: null,
          attachments: [],
          links: [],
        },
      });
      const [result] = mapDayPlanRows([row]);
      expect(result.accommodation?.links).toBeUndefined();
    });
  });

  describe('tickets attachments 映射', () => {
    it('tickets 有 attachments 時正確映射', () => {
      const row = makeRow({
        tickets: [
          {
            name: '阿蘇男孩號',
            type: 'train',
            datetime: '2025-05-01T09:00:00',
            notes: null,
            attachments: [{ type: 'pdf', url: 'https://example.com/ticket.pdf', label: '車票' }],
          },
        ],
      });
      const result = mapDayPlanRows([row]);
      const att = result[0].tickets?.[0].attachments?.[0];
      expect(att?.type).toBe('pdf');
      expect(att?.url).toBe('https://example.com/ticket.pdf');
      expect(att?.label).toBe('車票');
    });
  });
});
