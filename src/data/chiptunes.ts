/** Original 8-bit alarm tracks bundled in res/raw (see scripts/compose-chiptunes.py). */
export interface Chiptune {
  id: string;
  title: string;
  mood: string;
}

export const CHIPTUNES: Chiptune[] = [
  { id: 'chip_morning_adventure', title: '아침 모험', mood: '신나는 행진곡' },
  { id: 'chip_forest_walk', title: '숲길 산책', mood: '통통 튀는 산책' },
  { id: 'chip_victory_fanfare', title: '승리의 팡파레', mood: '힘찬 팡파레' },
  {
    id: 'chip_dreamy_arpeggio',
    title: '꿈결 아르페지오',
    mood: '잔잔하게 깨우기',
  },
  { id: 'chip_emergency_dispatch', title: '긴급 출동', mood: '빠르고 급하게' },
];

const PACKAGE = 'com.seongtaek.pokealarm';

/** Plays like any ringtone: MediaPlayer opens android.resource URIs directly. */
export function chiptuneUri(id: string): string {
  return `android.resource://${PACKAGE}/raw/${id}`;
}

export function isChiptuneUri(uri: string): boolean {
  return uri.startsWith(`android.resource://${PACKAGE}/raw/chip_`);
}
