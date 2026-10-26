// Not named pokemon.json: Metro resolves '.json' before '.ts', so '../data/pokemon' would load it.
import data from './pokemon-data.json';

export type PokemonType = string;

export interface Pokemon {
  id: number;
  /** Korean name. */
  ko: string;
  en: string;
  types: PokemonType[];
  gen: number;
  /** Height in decimeters. */
  h: number;
}

export const TYPES: { id: PokemonType; name: string }[] = data.types;
export const POKEMON: Pokemon[] = data.pokemon;

const byId = new Map(POKEMON.map(p => [p.id, p]));

export function getPokemon(id: number): Pokemon | undefined {
  return byId.get(id);
}

export function typeName(id: PokemonType): string {
  return TYPES.find(t => t.id === id)?.name ?? id;
}

export type SizeClass = 'small' | 'medium' | 'large';

/** Field sprite size in px for each size class. */
export const SPRITE_SIZES: Record<SizeClass, number> = {
  small: 56,
  medium: 76,
  large: 100,
};

/** Up to 0.6 m is small, up to 1.4 m is medium, anything taller is large. */
export function sizeClass(heightDm: number): SizeClass {
  if (heightDm <= 6) {
    return 'small';
  }
  return heightDm <= 14 ? 'medium' : 'large';
}

/** How big a Pokémon is drawn on the field. */
export function spriteSize(id: number): number {
  const p = getPokemon(id);
  return SPRITE_SIZES[p ? sizeClass(p.h) : 'medium'];
}

/** Cries available as alarm sounds. Only Generation 1 for now. */
export const CRY_POKEMON: Pokemon[] = POKEMON.filter(p => p.gen === 1);

const SPRITES =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

/** Animated Showdown GIF. Some Generation 9 Pokémon have none; fall back to artworkUrl. */
export function animatedSpriteUrl(id: number): string {
  return `${SPRITES}/other/showdown/${id}.gif`;
}

/** Small still sprite, for lists. */
export function staticSpriteUrl(id: number): string {
  return `${SPRITES}/${id}.png`;
}

export function artworkUrl(id: number): string {
  return `${SPRITES}/other/official-artwork/${id}.png`;
}

export interface PokemonFilter {
  query?: string;
  type?: PokemonType | null;
}

/** Matches Korean or English names, or the Pokédex number. */
export function filterPokemon(
  list: Pokemon[],
  { query = '', type = null }: PokemonFilter,
): Pokemon[] {
  const q = query.trim().toLowerCase();
  return list.filter(p => {
    if (type && !p.types.includes(type)) {
      return false;
    }
    if (!q) {
      return true;
    }
    return (
      p.ko.includes(q) || p.en.toLowerCase().includes(q) || String(p.id) === q
    );
  });
}

/** Adds 이 or 가 to a Korean name depending on whether it ends in a final consonant. */
export function withSubjectParticle(name: string): string {
  const code = name.charCodeAt(name.length - 1) - 0xac00;
  const hasFinal = code >= 0 && code <= 11171 && code % 28 !== 0;
  return `${name}${hasFinal ? '이' : '가'}`;
}
