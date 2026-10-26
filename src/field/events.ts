import type { TimeOfDay } from './scenes';

export interface Bounds {
  width: number;
  height: number;
}

export type FieldEvent =
  | { kind: 'rain'; shelterX: number }
  | { kind: 'sleep' }
  | { kind: 'berry'; x: number; y: number; eaters: number[] }
  | { kind: 'wild'; pokemonId: number; x: number; y: number }
  | { kind: 'pokeball'; y: number };

export type EventKind = FieldEvent['kind'];

export const EVENT_LABELS: Record<EventKind, string> = {
  rain: '비가 내려요',
  sleep: '모두 졸려요',
  berry: '열매가 떨어졌어요',
  wild: '야생 포켓몬이 나타났다!',
  pokeball: '몬스터볼이 굴러와요',
};

export const EVENT_DURATION_MS: Record<EventKind, number> = {
  rain: 10000,
  sleep: 12000,
  berry: 8000,
  wild: 9000,
  pokeball: 7000,
};

/** Seconds between events, picked uniformly in this range. */
export const EVENT_GAP_MS: [number, number] = [20000, 45000];

/** What one Pokémon does during an event. */
export type Behavior =
  | { mode: 'roam' }
  | { mode: 'goto'; x: number; y: number; emote?: string; then?: 'shiver' }
  | { mode: 'sleep' }
  | { mode: 'alert'; faceX: number };

type Random = () => number;

function between(random: Random, min: number, max: number) {
  return min + random() * (max - min);
}

/** Sleep is more likely at night, rain less likely in the evening. */
function weights(time: TimeOfDay): Record<EventKind, number> {
  return {
    rain: time === 'evening' ? 1 : 2,
    sleep: time === 'night' ? 5 : 1,
    berry: 3,
    wild: 2,
    pokeball: 2,
  };
}

export function pickEventKind(
  time: TimeOfDay,
  random: Random = Math.random,
): EventKind {
  const entries = Object.entries(weights(time)) as [EventKind, number][];
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = random() * total;
  for (const [kind, w] of entries) {
    roll -= w;
    if (roll < 0) {
      return kind;
    }
  }
  return entries[entries.length - 1][0];
}

export function createEvent(
  kind: EventKind,
  ctx: {
    bounds: Bounds;
    fieldCount: number;
    fieldIds: number[];
    maxPokemonId: number;
  },
  random: Random = Math.random,
): FieldEvent {
  const { width, height } = ctx.bounds;
  switch (kind) {
    case 'rain':
      return { kind, shelterX: random() < 0.5 ? width * 0.15 : width * 0.85 };
    case 'sleep':
      return { kind };
    case 'berry': {
      const count = Math.min(ctx.fieldCount, 1 + Math.floor(random() * 3));
      const eaters = shuffle([...Array(ctx.fieldCount).keys()], random).slice(
        0,
        count,
      );
      return {
        kind,
        x: between(random, width * 0.2, width * 0.8),
        y: between(random, height * 0.4, height * 0.8),
        eaters,
      };
    }
    case 'wild': {
      let pokemonId = 1 + Math.floor(random() * ctx.maxPokemonId);
      for (let i = 0; i < 10 && ctx.fieldIds.includes(pokemonId); i++) {
        pokemonId = 1 + Math.floor(random() * ctx.maxPokemonId);
      }
      return { kind, pokemonId, x: width * 0.78, y: height * 0.6 };
    }
    case 'pokeball':
      return { kind, y: between(random, height * 0.45, height * 0.85) };
  }
}

export function behaviorFor(
  event: FieldEvent | null,
  index: number,
  bounds: Bounds,
  random: Random = Math.random,
): Behavior {
  if (!event) {
    return { mode: 'roam' };
  }
  switch (event.kind) {
    case 'rain':
      return {
        mode: 'goto',
        x: event.shelterX + between(random, -40, 40),
        y: bounds.height * between(random, 0.3, 0.6),
        emote: '💧',
        then: 'shiver',
      };
    case 'sleep':
      return { mode: 'sleep' };
    case 'berry': {
      const slot = event.eaters.indexOf(index);
      if (slot < 0) {
        return { mode: 'roam' };
      }
      const offset = (slot - (event.eaters.length - 1) / 2) * 48;
      return { mode: 'goto', x: event.x + offset, y: event.y + 8, emote: '❤️' };
    }
    case 'wild':
      return { mode: 'alert', faceX: event.x };
    case 'pokeball':
      return {
        mode: 'goto',
        x: bounds.width - 50 - (index % 5) * 30,
        y: event.y + ((index % 3) - 1) * 20,
        emote: '❗',
      };
  }
}

function shuffle<T>(items: T[], random: Random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
