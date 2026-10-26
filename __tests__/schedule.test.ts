import {
  createAlarm,
  describeRepeat,
  describeTimeUntil,
  nextTrigger,
} from '../src/alarm/schedule';
import type { Alarm } from '../src/types';

// Monday 2026-10-26 08:00 local time.
const now = new Date(2026, 9, 26, 8, 0);

function alarm(patch: Partial<Alarm>): Alarm {
  return { ...createAlarm('a', now), hour: 7, minute: 30, ...patch };
}

describe('nextTrigger', () => {
  it('rings tomorrow when a one-time alarm time already passed today', () => {
    expect(nextTrigger(alarm({}), now)).toEqual(new Date(2026, 9, 27, 7, 30));
  });

  it('rings later today when the time is still ahead', () => {
    expect(nextTrigger(alarm({ hour: 9 }), now)).toEqual(
      new Date(2026, 9, 26, 9, 30),
    );
  });

  it('uses the given date for a one-time alarm', () => {
    expect(nextTrigger(alarm({ date: '2026-11-03' }), now)).toEqual(
      new Date(2026, 10, 3, 7, 30),
    );
  });

  it('never rings for a date in the past', () => {
    expect(nextTrigger(alarm({ date: '2026-10-25' }), now)).toBeNull();
  });

  it('skips to the next selected weekday', () => {
    // Monday after 07:30, so the next Monday/Wednesday ring is Wednesday.
    expect(nextTrigger(alarm({ weekdays: [1, 3] }), now)).toEqual(
      new Date(2026, 9, 28, 7, 30),
    );
  });

  it('wraps around to the same weekday next week', () => {
    expect(nextTrigger(alarm({ weekdays: [1] }), now)).toEqual(
      new Date(2026, 10, 2, 7, 30),
    );
  });

  it('ignores the date when weekdays are set', () => {
    expect(
      nextTrigger(alarm({ weekdays: [2], date: '2027-01-01' }), now),
    ).toEqual(new Date(2026, 9, 27, 7, 30));
  });

  it('returns null when disabled', () => {
    expect(nextTrigger(alarm({ enabled: false }), now)).toBeNull();
  });
});

describe('describeRepeat', () => {
  it('names common patterns', () => {
    expect(describeRepeat(alarm({ weekdays: [1, 2, 3, 4, 5, 6, 7] }))).toBe(
      '매일',
    );
    expect(describeRepeat(alarm({ weekdays: [5, 1, 2, 3, 4] }))).toBe('평일');
    expect(describeRepeat(alarm({ weekdays: [6, 7] }))).toBe('주말');
    expect(describeRepeat(alarm({ weekdays: [1, 3, 5] }))).toBe('월 수 금');
    expect(describeRepeat(alarm({ date: '2026-11-03' }))).toBe('2026-11-03');
    expect(describeRepeat(alarm({}))).toBe('한 번');
  });
});

describe('describeTimeUntil', () => {
  it('formats days, hours and minutes', () => {
    expect(describeTimeUntil(new Date(2026, 9, 27, 9, 5), now)).toBe(
      '1일 1시간 5분 후',
    );
    expect(describeTimeUntil(new Date(2026, 9, 26, 8, 0, 20), now)).toBe(
      '1분 후',
    );
  });
});
