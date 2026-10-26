import {
  behaviorFor,
  createEvent,
  pickEventKind,
  type FieldEvent,
} from '../src/field/events';
import { timeOfDay } from '../src/field/scenes';

const bounds = { width: 400, height: 300 };
const ctx = {
  bounds,
  fieldCount: 5,
  fieldIds: [25, 1, 4, 7, 133],
  maxPokemonId: 1025,
};

/** Deterministic random sequence for repeatable tests. */
function seq(...values: number[]) {
  let i = 0;
  return () => values[i++ % values.length];
}

describe('timeOfDay', () => {
  it('splits the day into four parts', () => {
    expect(timeOfDay(new Date(2026, 0, 1, 6))).toBe('morning');
    expect(timeOfDay(new Date(2026, 0, 1, 12))).toBe('day');
    expect(timeOfDay(new Date(2026, 0, 1, 18))).toBe('evening');
    expect(timeOfDay(new Date(2026, 0, 1, 23))).toBe('night');
    expect(timeOfDay(new Date(2026, 0, 1, 3))).toBe('night');
  });
});

describe('pickEventKind', () => {
  it('can pick every event', () => {
    const kinds = new Set(
      Array.from({ length: 100 }, (_, i) =>
        pickEventKind('day', () => i / 100),
      ),
    );
    expect(kinds).toEqual(
      new Set(['rain', 'sleep', 'berry', 'wild', 'pokeball']),
    );
  });

  it('makes sleep more likely at night', () => {
    const count = (time: 'day' | 'night') =>
      Array.from({ length: 1000 }, (_, i) =>
        pickEventKind(time, () => i / 1000),
      ).filter(k => k === 'sleep').length;
    expect(count('night')).toBeGreaterThan(count('day') * 2);
  });
});

describe('createEvent', () => {
  it('sends one to three distinct Pokémon to a berry', () => {
    const event = createEvent(
      'berry',
      ctx,
      seq(0.99, 0.1, 0.5, 0.7, 0.3, 0.5, 0.5),
    ) as Extract<FieldEvent, { kind: 'berry' }>;
    expect(event.eaters).toHaveLength(3);
    expect(new Set(event.eaters).size).toBe(3);
    event.eaters.forEach(i => expect(i).toBeLessThan(ctx.fieldCount));
    expect(event.x).toBeGreaterThanOrEqual(bounds.width * 0.2);
    expect(event.x).toBeLessThanOrEqual(bounds.width * 0.8);
  });

  it('never sends more Pokémon than are on the field', () => {
    const event = createEvent(
      'berry',
      { ...ctx, fieldCount: 1, fieldIds: [25] },
      seq(0.99),
    );
    expect(event).toMatchObject({ kind: 'berry', eaters: [0] });
  });

  it('picks a wild Pokémon that is not already on the field', () => {
    // 25/1025 rolls Pikachu (on the field) first, then 150/1025.
    const event = createEvent('wild', ctx, seq(24 / 1025, 149 / 1025));
    expect(event).toMatchObject({ kind: 'wild', pokemonId: 150 });
  });
});

describe('behaviorFor', () => {
  it('roams with no event', () => {
    expect(behaviorFor(null, 0, bounds)).toEqual({ mode: 'roam' });
  });

  it('runs to shelter and shivers in the rain', () => {
    const b = behaviorFor({ kind: 'rain', shelterX: 60 }, 2, bounds, () => 0.5);
    expect(b).toMatchObject({ mode: 'goto', x: 60, then: 'shiver' });
  });

  it('only sends the chosen eaters to the berry, side by side', () => {
    const event: FieldEvent = { kind: 'berry', x: 200, y: 150, eaters: [3, 1] };
    expect(behaviorFor(event, 0, bounds)).toEqual({ mode: 'roam' });
    const a = behaviorFor(event, 3, bounds);
    const b = behaviorFor(event, 1, bounds);
    expect(a).toMatchObject({ mode: 'goto', emote: '❤️' });
    expect(a.mode === 'goto' && b.mode === 'goto' && a.x !== b.x).toBe(true);
  });

  it('faces the wild Pokémon', () => {
    const event: FieldEvent = { kind: 'wild', pokemonId: 150, x: 320, y: 180 };
    expect(behaviorFor(event, 4, bounds)).toEqual({
      mode: 'alert',
      faceX: 320,
    });
  });

  it('puts everyone to sleep', () => {
    expect(behaviorFor({ kind: 'sleep' }, 1, bounds)).toEqual({
      mode: 'sleep',
    });
  });
});
