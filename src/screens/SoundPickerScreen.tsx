import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Chip } from '../components/Chip';
import { CRY_POKEMON, filterPokemon, typeName } from '../data/pokemon';
import { AlarmModule } from '../native/AlarmModule';
import type { ScreenProps } from '../navigation';
import { useDraftStore } from '../store/alarmStore';
import { TYPE_COLORS, colors } from '../theme';
import type { AlarmSound, Ringtone } from '../types';

type Tab = 'cry' | 'ringtone';

const CRY_TYPES = [...new Set(CRY_POKEMON.flatMap(p => p.types))];

function smallSpriteUrl(id: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

export function SoundPickerScreen({ navigation }: ScreenProps<'SoundPicker'>) {
  const { draft, update } = useDraftStore();
  const [tab, setTab] = useState<Tab>(draft?.sound.kind ?? 'cry');
  const [playing, setPlaying] = useState<string | null>(null);

  useEffect(
    () => () => {
      AlarmModule.stopPreview();
    },
    [],
  );

  function select(sound: AlarmSound) {
    AlarmModule.stopPreview();
    // A cry also sets the Pokémon that appears on the ringing screen.
    update(
      sound.kind === 'cry' ? { sound, pokemonId: sound.pokemonId } : { sound },
    );
    navigation.goBack();
  }

  async function togglePreview(key: string, kind: Tab, value: string) {
    if (playing === key) {
      setPlaying(null);
      await AlarmModule.stopPreview();
      return;
    }
    setPlaying(key);
    AlarmModule.previewSound(kind, value).catch(() => setPlaying(null));
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TabButton
          label="포켓몬 울음소리"
          active={tab === 'cry'}
          onPress={() => setTab('cry')}
        />
        <TabButton
          label="폰 벨소리"
          active={tab === 'ringtone'}
          onPress={() => setTab('ringtone')}
        />
      </View>
      {tab === 'cry' ? (
        <CryList
          selected={draft?.sound.kind === 'cry' ? draft.sound.pokemonId : null}
          playing={playing}
          onPreview={id => togglePreview(`cry:${id}`, 'cry', String(id))}
          onSelect={id => select({ kind: 'cry', pokemonId: id })}
        />
      ) : (
        <RingtoneList
          selected={draft?.sound.kind === 'ringtone' ? draft.sound.uri : null}
          playing={playing}
          onPreview={r => togglePreview(`ringtone:${r.uri}`, 'ringtone', r.uri)}
          onSelect={r =>
            select({ kind: 'ringtone', uri: r.uri, title: r.title })
          }
        />
      )}
    </View>
  );
}

function TabButton(props: { label: string; active: boolean; onPress(): void }) {
  return (
    <Pressable
      style={[styles.tab, props.active && styles.tabActive]}
      onPress={props.onPress}
    >
      <Text style={[styles.tabText, props.active && styles.tabTextActive]}>
        {props.label}
      </Text>
    </Pressable>
  );
}

function CryList(props: {
  selected: number | null;
  playing: string | null;
  onPreview(id: number): void;
  onSelect(id: number): void;
}) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<string | null>(null);
  const results = useMemo(
    () => filterPokemon(CRY_POKEMON, { query, type }),
    [query, type],
  );

  return (
    <>
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
          {CRY_TYPES.map(t => (
            <Chip
              key={t}
              label={typeName(t)}
              color={TYPE_COLORS[t]}
              selected={type === t}
              onPress={() => setType(type === t ? null : t)}
            />
          ))}
        </ScrollView>
      </View>
      <FlatList
        data={results}
        keyExtractor={p => String(p.id)}
        initialNumToRender={20}
        ListEmptyComponent={
          <Text style={styles.empty}>찾는 포켓몬이 없어요</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={[
              styles.row,
              props.selected === item.id && styles.rowSelected,
            ]}
            onPress={() => props.onSelect(item.id)}
          >
            <Image
              source={{ uri: smallSpriteUrl(item.id) }}
              style={styles.sprite}
            />
            <View style={styles.flex}>
              <Text style={styles.name}>
                <Text style={styles.number}>No.{item.id} </Text>
                {item.ko}
              </Text>
              <Text style={styles.meta}>
                {item.types.map(typeName).join(' · ')}
              </Text>
            </View>
            <PreviewButton
              playing={props.playing === `cry:${item.id}`}
              onPress={() => props.onPreview(item.id)}
            />
          </Pressable>
        )}
      />
    </>
  );
}

function RingtoneList(props: {
  selected: string | null;
  playing: string | null;
  onPreview(r: Ringtone): void;
  onSelect(r: Ringtone): void;
}) {
  const [ringtones, setRingtones] = useState<Ringtone[] | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    AlarmModule.listRingtones()
      .then(setRingtones)
      .catch(() => setRingtones([]));
  }, []);

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (r: Ringtone) => !q || r.title.toLowerCase().includes(q);
    const list = (ringtones ?? []).filter(match);
    return [
      { title: '알람음', data: list.filter(r => r.group === 'alarm') },
      { title: '벨소리', data: list.filter(r => r.group === 'ringtone') },
    ].filter(s => s.data.length > 0);
  }, [ringtones, query]);

  return (
    <>
      <View style={styles.filters}>
        <TextInput
          style={styles.search}
          placeholder="벨소리 이름으로 검색"
          value={query}
          onChangeText={setQuery}
        />
      </View>
      <SectionList
        sections={sections}
        keyExtractor={r => r.uri}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {ringtones ? '찾는 소리가 없어요' : '불러오는 중…'}
          </Text>
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <Pressable
            style={[
              styles.row,
              props.selected === item.uri && styles.rowSelected,
            ]}
            onPress={() => props.onSelect(item)}
          >
            <Text style={[styles.name, styles.flex]}>{item.title}</Text>
            <PreviewButton
              playing={props.playing === `ringtone:${item.uri}`}
              onPress={() => props.onPreview(item)}
            />
          </Pressable>
        )}
      />
    </>
  );
}

function PreviewButton(props: { playing: boolean; onPress(): void }) {
  return (
    <Pressable onPress={props.onPress} hitSlop={8} style={styles.preview}>
      <Text style={styles.previewText}>{props.playing ? '■' : '▶'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabs: { flexDirection: 'row', backgroundColor: colors.surface },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 3, borderBottomColor: colors.primary },
  tabText: { color: colors.muted, fontSize: 15 },
  tabTextActive: { color: colors.text, fontWeight: '700' },
  filters: { padding: 12, paddingBottom: 6 },
  search: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 10,
    color: colors.text,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    color: colors.muted,
    fontWeight: '600',
    backgroundColor: colors.background,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 12,
    marginBottom: 6,
    borderRadius: 12,
    padding: 10,
  },
  rowSelected: { borderWidth: 2, borderColor: colors.primary },
  sprite: { width: 48, height: 48, marginRight: 8 },
  flex: { flex: 1 },
  name: { fontSize: 16, color: colors.text },
  number: { color: colors.muted, fontSize: 13 },
  meta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 48 },
  preview: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewText: { fontSize: 16, color: colors.accentDark },
});
