import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Chip } from '../components/Chip';
import { StarButton } from '../components/StarButton';
import { favoritesFirst } from '../data/favorites';
import {
  POKEMON,
  TYPES,
  filterPokemon,
  getPokemon,
  staticSpriteUrl,
} from '../data/pokemon';
import { MAX_FIELD_POKEMON, useSettingsStore } from '../store/settingsStore';
import { TYPE_COLORS, colors } from '../theme';

const COLUMNS = 4;

/** Picks up to 20 Pokémon for the home field, with type filter and search over all 1,025. */
export function PokemonPickerScreen() {
  const {
    fieldPokemon,
    setFieldPokemon,
    favoritePokemon,
    toggleFavoritePokemon,
  } = useSettingsStore();
  const [query, setQuery] = useState('');
  const [type, setType] = useState<string | null>(null);
  const results = useMemo(
    () =>
      favoritesFirst(filterPokemon(POKEMON, { query, type }), p =>
        favoritePokemon.includes(p.id),
      ),
    [favoritePokemon, query, type],
  );

  function toggle(id: number) {
    if (fieldPokemon.includes(id)) {
      setFieldPokemon(fieldPokemon.filter(p => p !== id));
    } else if (fieldPokemon.length >= MAX_FIELD_POKEMON) {
      Alert.alert(
        `최대 ${MAX_FIELD_POKEMON}마리까지 둘 수 있어요`,
        '다른 포켓몬을 먼저 빼 주세요.',
      );
    } else {
      setFieldPokemon([...fieldPokemon, id]);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.tray}>
        <Text style={styles.count}>
          필드의 포켓몬 {fieldPokemon.length}/{MAX_FIELD_POKEMON}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {fieldPokemon.map(id => (
            <Pressable
              key={id}
              onPress={() => toggle(id)}
              style={styles.trayItem}
            >
              <Image
                source={{ uri: staticSpriteUrl(id) }}
                style={styles.traySprite}
              />
              <Text style={styles.trayRemove}>✕</Text>
            </Pressable>
          ))}
          {fieldPokemon.length === 0 && (
            <Text style={styles.trayEmpty}>아래에서 포켓몬을 골라 주세요</Text>
          )}
        </ScrollView>
      </View>
      <View style={styles.filters}>
        <TextInput
          style={styles.search}
          placeholder="이름 또는 도감 번호로 검색"
          value={query}
          onChangeText={setQuery}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Chip
            label="전체"
            selected={type === null}
            onPress={() => setType(null)}
          />
          {TYPES.map(t => (
            <Chip
              key={t.id}
              label={t.name}
              color={TYPE_COLORS[t.id]}
              selected={type === t.id}
              onPress={() => setType(type === t.id ? null : t.id)}
            />
          ))}
        </ScrollView>
      </View>
      <FlatList
        data={results}
        numColumns={COLUMNS}
        keyExtractor={p => String(p.id)}
        contentContainerStyle={styles.grid}
        initialNumToRender={24}
        windowSize={7}
        ListEmptyComponent={
          <Text style={styles.empty}>찾는 포켓몬이 없어요</Text>
        }
        renderItem={({ item }) => {
          const selected = fieldPokemon.includes(item.id);
          return (
            <Pressable
              style={[styles.cell, selected && styles.cellSelected]}
              onPress={() => toggle(item.id)}
            >
              <Image
                source={{ uri: staticSpriteUrl(item.id) }}
                style={styles.sprite}
              />
              <Text style={styles.name} numberOfLines={1}>
                {getPokemon(item.id)?.ko}
              </Text>
              <Text style={styles.number}>No.{item.id}</Text>
              {selected && <Text style={styles.check}>✓</Text>}
              <View style={styles.star}>
                <StarButton
                  size={18}
                  starred={favoritePokemon.includes(item.id)}
                  onPress={() => toggleFavoritePokemon(item.id)}
                />
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tray: {
    backgroundColor: colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  count: { fontWeight: '700', color: colors.text, marginBottom: 6 },
  trayItem: { marginRight: 4 },
  traySprite: { width: 48, height: 48 },
  trayRemove: {
    position: 'absolute',
    right: 0,
    top: 0,
    fontSize: 11,
    color: colors.muted,
  },
  trayEmpty: { color: colors.muted, paddingVertical: 14 },
  filters: { padding: 12, paddingBottom: 4 },
  search: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 10,
    color: colors.text,
  },
  grid: { paddingHorizontal: 8, paddingBottom: 24 },
  cell: {
    flex: 1 / COLUMNS,
    alignItems: 'center',
    margin: 4,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cellSelected: { borderColor: colors.primary },
  sprite: { width: 56, height: 56 },
  name: { fontSize: 13, color: colors.text, paddingHorizontal: 4 },
  number: { fontSize: 11, color: colors.muted },
  check: {
    position: 'absolute',
    top: 4,
    right: 8,
    color: colors.primary,
    fontWeight: '800',
  },
  star: { position: 'absolute', top: 2, left: 0 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 48 },
});
