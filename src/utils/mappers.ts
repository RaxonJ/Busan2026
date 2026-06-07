import type { Itinerary, DayPlan } from '../types/itinerary';
import type { DayPlanViewRow } from '../types/database';
import type { ThemeColor } from './colors';

export function mapDayPlanRows(rows: DayPlanViewRow[]): Itinerary {
  return rows.map((row): DayPlan => ({
    day: row.day,
    date: row.date ?? undefined,
    title: row.title,
    themeColor: (row.themeColor as ThemeColor) ?? 'blue',
    transport: row.transport
      ? {
          mode: row.transport.mode as 'taxi' | 'car' | 'train' | 'bus' | 'walk' | 'public',
          description: row.transport.description,
          icon: row.transport.icon,
        }
      : {
          mode: 'public' as const,
          description: '',
          icon: 'Bus',
        },
    accommodation: row.accommodation
      ? {
          name: row.accommodation.name,
          description: row.accommodation.description ?? undefined,
          mapQuery: row.accommodation.mapQuery ?? undefined,
          photoUrl: row.accommodation.photoUrl ?? undefined,
          attachments: row.accommodation.attachments?.map((a) => ({
            type: a.type as 'pdf' | 'image',
            url: a.url,
            label: a.label ?? undefined,
          })),
          links: row.accommodation.links && row.accommodation.links.length > 0
            ? row.accommodation.links
            : undefined,
        }
      : undefined,
    activities: row.activities.map((a) => ({
      time: a.time,
      title: a.title,
      description: a.description ?? undefined,
      isKidFriendly: a.isKidFriendly,
      isSeniorFriendly: a.isSeniorFriendly,
      mapQuery: a.mapQuery ?? undefined,
      mapUrl: a.mapUrl ?? undefined,
      photoUrl: a.photoUrl ?? undefined,
      priority: (a.priority as 'must' | 'normal' | 'optional') ?? undefined,
      activityType: (a.activityType as import('../types/itinerary').ActivityType) ?? undefined,
      links: a.links && a.links.length > 0 ? a.links : undefined,
    })),
    tickets: row.tickets?.map((tk) => ({
      name: tk.name,
      type: tk.type as 'flight' | 'train' | 'metro' | 'bus' | 'restaurant',
      datetime: tk.datetime ?? undefined,
      notes: tk.notes ?? undefined,
      attachments: tk.attachments?.map((a) => ({
        type: a.type as 'pdf' | 'image',
        url: a.url,
        label: a.label ?? undefined,
      })),
    })),
  }));
}
