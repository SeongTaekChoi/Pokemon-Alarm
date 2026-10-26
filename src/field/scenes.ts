export type SceneId = 'meadow' | 'forest' | 'beach' | 'snow';
export type TimeOfDay = 'morning' | 'day' | 'evening' | 'night';

export const SCENES: { id: SceneId; name: string }[] = [
  { id: 'meadow', name: '들판' },
  { id: 'forest', name: '숲' },
  { id: 'beach', name: '바다' },
  { id: 'snow', name: '설원' },
];

export const TIMES_OF_DAY: { id: TimeOfDay; name: string; hours: string }[] = [
  { id: 'morning', name: '아침', hours: '5시~10시' },
  { id: 'day', name: '낮', hours: '10시~17시' },
  { id: 'evening', name: '저녁', hours: '17시~20시' },
  { id: 'night', name: '밤', hours: '20시~5시' },
];

export function timeOfDay(date: Date): TimeOfDay {
  const h = date.getHours();
  if (h >= 5 && h < 10) {
    return 'morning';
  }
  if (h >= 10 && h < 17) {
    return 'day';
  }
  if (h >= 17 && h < 20) {
    return 'evening';
  }
  return 'night';
}

/** Sky gradient (top, bottom) for each time of day. */
export const SKY: Record<TimeOfDay, [string, string]> = {
  morning: ['#FFC9A8', '#BEE6FF'],
  day: ['#5DB7F5', '#BDE6FF'],
  evening: ['#5B3E8C', '#F79A63'],
  night: ['#0B1236', '#2D3A72'],
};

export interface SceneColors {
  ground: [string, string];
  accent: string;
  detail: string;
}

export const SCENE_COLORS: Record<SceneId, SceneColors> = {
  meadow: {
    ground: ['#8BD46B', '#5FAF45'],
    accent: '#FFE27A',
    detail: '#4E9A3A',
  },
  forest: {
    ground: ['#5E9E4C', '#3D7535'],
    accent: '#2F5E2B',
    detail: '#7A5230',
  },
  beach: {
    ground: ['#F6E3A8', '#E9CB82'],
    accent: '#3FA7E0',
    detail: '#FFFFFF',
  },
  snow: {
    ground: ['#F4F8FF', '#D7E3F4'],
    accent: '#9DB7D9',
    detail: '#FFFFFF',
  },
};

/** Darkens the ground at night so it matches the sky. */
export const GROUND_SHADE: Record<TimeOfDay, number> = {
  morning: 0.05,
  day: 0,
  evening: 0.2,
  night: 0.5,
};
