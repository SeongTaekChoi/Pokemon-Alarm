import { favoritesFirst, soundKey } from '../src/data/favorites';

describe('favoritesFirst', () => {
  it('moves favorites to the top and keeps the order in each group', () => {
    const starred = new Set([7, 3]);
    expect(favoritesFirst([1, 3, 5, 7, 9], n => starred.has(n))).toEqual([
      3, 7, 1, 5, 9,
    ]);
  });

  it('leaves the list alone without favorites', () => {
    expect(favoritesFirst([2, 1], () => false)).toEqual([2, 1]);
  });
});

describe('soundKey', () => {
  it('keys cries and ringtones separately', () => {
    expect(soundKey('cry', 25)).toBe('cry:25');
    expect(soundKey('ringtone', 'content://x/1')).toBe(
      'ringtone:content://x/1',
    );
  });
});
