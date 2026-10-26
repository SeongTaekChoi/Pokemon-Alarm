import data from './pokemon.json';

export type PokemonType = string;

export interface Pokemon {
  id: number;
  /** Korean name. */
  ko: string;
  en: string;
  types: PokemonType[];
  gen: number;
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
