import { CHIPTUNES, chiptuneUri, isChiptuneUri } from '../src/data/chiptunes';

describe('chiptunes', () => {
  it('uses res/raw names for every track', () => {
    expect(CHIPTUNES.every(t => /^chip_[a-z_]+$/.test(t.id))).toBe(true);
    expect(new Set(CHIPTUNES.map(t => t.id)).size).toBe(CHIPTUNES.length);
  });

  it('tells chiptune URIs apart from phone ringtones', () => {
    expect(isChiptuneUri(chiptuneUri('chip_forest_walk'))).toBe(true);
    expect(isChiptuneUri('content://media/internal/audio/media/12')).toBe(
      false,
    );
  });
});
