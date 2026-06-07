// src/utils/itineraryToMarkdown.ts
import type { DayPlan } from '../types/itinerary';

const transportEmoji: Record<string, string> = {
  taxi: '🚕',
  car: '🚗',
  train: '🚃',
  bus: '🚌',
  walk: '🚶',
  public: '🚇',
};

function formatDay(day: DayPlan): string {
  const header = day.date
    ? `## Day ${day.day} — ${day.date} ${day.title}`
    : `## Day ${day.day} — ${day.title}`;

  const emoji = transportEmoji[day.transport.mode] ?? '🚌';
  const transport = `**交通：** ${emoji} ${day.transport.description}`;

  const tableHeader = `### 行程\n\n| 時間 | 地點 | 備註 |\n|------|------|------|`;
  const tableRows = day.activities
    .map((a) => `| ${a.time} | ${a.title} | ${a.description ?? ''} |`)
    .join('\n');

  const accommodation = day.accommodation
    ? `\n**今晚住宿：** ${day.accommodation.name}${day.accommodation.description ? `（${day.accommodation.description}）` : ''}`
    : '';

  return [header, transport, tableHeader, tableRows, accommodation].filter(Boolean).join('\n\n');
}

export function itineraryToMarkdown(days: DayPlan[]): string {
  const sections = days.map(formatDay).join('\n\n---\n\n');
  return `# 大阪神戶春遊行程\n\n${sections}`;
}

export function dayToMarkdown(day: DayPlan): string {
  return formatDay(day);
}
