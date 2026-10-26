// Builds src/data/pokemon.json from a local PokeAPI checkout.
// Usage: node scripts/build-pokemon-data.mjs <path-to-pokeapi>/data/v2/csv
import fs from 'node:fs';
import path from 'node:path';

const csvDir = process.argv[2];
if (!csvDir) {
  console.error(
    'Usage: node scripts/build-pokemon-data.mjs <pokeapi>/data/v2/csv',
  );
  process.exit(1);
}

const KO = '3';
const EN = '9';
const MAX_ID = 1025;
const TYPE_COUNT = 18;

function readCsv(name) {
  const text = fs.readFileSync(path.join(csvDir, name), 'utf8');
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (c !== '\r') {
      field += c;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [header, ...body] = rows;
  return body.map(r => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}

const types = readCsv('types.csv')
  .filter(t => Number(t.id) <= TYPE_COUNT)
  .map(t => ({
    id: t.identifier,
    name: readCsv('type_names.csv')
      .find(n => n.type_id === t.id && n.local_language_id === KO)
      .name.trim(),
  }));
const typeById = Object.fromEntries(
  readCsv('types.csv').map(t => [t.id, t.identifier]),
);

const names = {};
for (const n of readCsv('pokemon_species_names.csv')) {
  const id = Number(n.pokemon_species_id);
  if (id > MAX_ID) continue;
  names[id] ??= {};
  if (n.local_language_id === KO) names[id].ko = n.name;
  if (n.local_language_id === EN) names[id].en = n.name;
}

const speciesTypes = {};
for (const t of readCsv('pokemon_types.csv')) {
  const id = Number(t.pokemon_id);
  if (id > MAX_ID) continue;
  (speciesTypes[id] ??= [])[Number(t.slot) - 1] = typeById[t.type_id];
}

const generation = {};
for (const s of readCsv('pokemon_species.csv')) {
  generation[Number(s.id)] = Number(s.generation_id);
}

const pokemon = [];
for (let id = 1; id <= MAX_ID; id++) {
  pokemon.push({
    id,
    ko: names[id].ko,
    en: names[id].en,
    types: speciesTypes[id].filter(Boolean),
    gen: generation[id],
  });
}

const out = path.join(
  path.dirname(new URL(import.meta.url).pathname),
  '../src/data/pokemon.json',
);
fs.writeFileSync(out, JSON.stringify({ types, pokemon }));
console.log(
  `Wrote ${pokemon.length} Pokémon and ${types.length} types to ${out}`,
);
