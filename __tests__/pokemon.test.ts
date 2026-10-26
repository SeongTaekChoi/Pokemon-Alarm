import {
  CRY_POKEMON,
  POKEMON,
  TYPES,
  filterPokemon,
  getPokemon,
  sizeClass,
  spriteSize,
  withSubjectParticle,
} from '../src/data/pokemon';

describe('pokemon data', () => {
  it('has every species with Korean names and types', () => {
    expect(POKEMON).toHaveLength(1025);
    expect(TYPES).toHaveLength(18);
    expect(getPokemon(25)).toMatchObject({
      ko: '피카츄',
      types: ['electric'],
      gen: 1,
    });
    expect(POKEMON.every(p => p.ko && p.types.length > 0)).toBe(true);
  });

  it('limits alarm cries to Generation 1', () => {
    expect(CRY_POKEMON).toHaveLength(151);
    expect(CRY_POKEMON.at(-1)?.ko).toBe('뮤');
  });
});

describe('sizeClass', () => {
  it('splits Pokémon into small, medium and large by height', () => {
    expect(sizeClass(getPokemon(25)!.h)).toBe('small'); // 0.4 m
    expect(sizeClass(getPokemon(1)!.h)).toBe('medium'); // 0.7 m
    expect(sizeClass(getPokemon(6)!.h)).toBe('large'); // 1.7 m
    expect(spriteSize(95)).toBeGreaterThan(spriteSize(4));
    expect(POKEMON.every(p => p.h > 0)).toBe(true);
  });
});

describe('filterPokemon', () => {
  it('searches Korean and English names and Pokédex numbers', () => {
    expect(
      filterPokemon(CRY_POKEMON, { query: '피카' }).map(p => p.id),
    ).toEqual([25]);
    expect(
      filterPokemon(CRY_POKEMON, { query: 'pika' }).map(p => p.id),
    ).toEqual([25]);
    expect(filterPokemon(CRY_POKEMON, { query: '150' }).map(p => p.ko)).toEqual(
      ['뮤츠'],
    );
  });

  it('filters by type and combines with search', () => {
    const fire = filterPokemon(CRY_POKEMON, { type: 'fire' });
    expect(fire.every(p => p.types.includes('fire'))).toBe(true);
    expect(fire.map(p => p.ko)).toContain('파이리');
    expect(
      filterPokemon(CRY_POKEMON, { type: 'water', query: '파이리' }),
    ).toEqual([]);
  });
});

describe('withSubjectParticle', () => {
  it('picks 이 after a final consonant and 가 otherwise', () => {
    expect(withSubjectParticle('피카츄')).toBe('피카츄가');
    expect(withSubjectParticle('파이리')).toBe('파이리가');
    expect(withSubjectParticle('뮤츠')).toBe('뮤츠가');
    expect(withSubjectParticle('이상해씨')).toBe('이상해씨가');
    expect(withSubjectParticle('잠만보')).toBe('잠만보가');
    expect(withSubjectParticle('꼬부기')).toBe('꼬부기가');
    expect(withSubjectParticle('리자몽')).toBe('리자몽이');
  });
});
