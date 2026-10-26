import type { Alarm, Weekday } from '../types';

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  1: '월',
  2: '화',
  3: '수',
  4: '목',
  5: '금',
  6: '토',
  7: '일',
};

/** JS Date.getDay() is 0 = Sunday; alarms use ISO weekdays. */
function isoWeekday(date: Date): Weekday {
  return (((date.getDay() + 6) % 7) + 1) as Weekday;
}

function parseDate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Next time the alarm rings after `now`, or null. Same rules as Alarm.nextTrigger in Kotlin; this
 * copy is only for display, native code does the actual scheduling.
 */
export function nextTrigger(alarm: Alarm, now: Date = new Date()): Date | null {
  if (!alarm.enabled) {
    return null;
  }
  if (alarm.date && alarm.weekdays.length === 0) {
    const at = parseDate(alarm.date);
    at.setHours(alarm.hour, alarm.minute, 0, 0);
    return at > now ? at : null;
  }
  for (let offset = 0; offset <= 7; offset++) {
    const at = new Date(now);
    at.setDate(now.getDate() + offset);
    at.setHours(alarm.hour, alarm.minute, 0, 0);
    if (at <= now) {
      continue;
    }
    if (
      alarm.weekdays.length === 0 ||
      alarm.weekdays.includes(isoWeekday(at))
    ) {
      return at;
    }
  }
  return null;
}

export function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** "매일", "평일", "월 수 금", "2026-11-03", or "한 번". */
export function describeRepeat(alarm: Alarm): string {
  const days = [...alarm.weekdays].sort();
  if (days.length === 7) {
    return '매일';
  }
  if (days.join() === '1,2,3,4,5') {
    return '평일';
  }
  if (days.join() === '6,7') {
    return '주말';
  }
  if (days.length > 0) {
    return days.map(d => WEEKDAY_LABELS[d]).join(' ');
  }
  return alarm.date ?? '한 번';
}

/** "7시간 5분 후" style countdown to the next ring. */
export function describeTimeUntil(at: Date, now: Date = new Date()): string {
  const minutes = Math.max(
    1,
    Math.ceil((at.getTime() - now.getTime()) / 60000),
  );
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  const parts = [
    days ? `${days}일` : '',
    hours ? `${hours}시간` : '',
    mins ? `${mins}분` : '',
  ].filter(Boolean);
  return `${parts.join(' ')} 후`;
}

export function createAlarm(id: string, now: Date = new Date()): Alarm {
  const at = new Date(now.getTime() + 60 * 60000);
  return {
    id,
    enabled: true,
    hour: at.getHours(),
    minute: 0,
    date: null,
    weekdays: [],
    sound: { kind: 'cry', pokemonId: 25 },
    pokemonId: 25,
    vibrate: true,
    volumeRamp: true,
    autoRepeat: true,
    label: '',
  };
}
