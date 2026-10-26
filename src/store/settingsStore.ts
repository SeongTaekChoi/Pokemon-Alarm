import { createMMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { SceneId, TimeOfDay } from '../field/scenes';

export const MAX_FIELD_POKEMON = 20;

const storage = createMMKV({ id: 'settings' });

interface SettingsState {
  /** Pokémon roaming the home field, in the order they were picked. */
  fieldPokemon: number[];
  /** Scene used when sceneByTime is off. */
  scene: SceneId;
  /** Switch scenes with the time of day using sceneSchedule. */
  sceneByTime: boolean;
  sceneSchedule: Record<TimeOfDay, SceneId>;
  /** Random events on the home field. */
  randomEvents: boolean;
  /** Starred Pokémon, shown first in the field picker. */
  favoritePokemon: number[];
  /** Starred alarm sounds, by soundKey(), shown first in the sound picker. */
  favoriteSounds: string[];
  setFieldPokemon(ids: number[]): void;
  toggleFavoritePokemon(id: number): void;
  toggleFavoriteSound(key: string): void;
  setScene(scene: SceneId): void;
  setSceneByTime(on: boolean): void;
  setScheduledScene(time: TimeOfDay, scene: SceneId): void;
  setRandomEvents(on: boolean): void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    set => ({
      fieldPokemon: [25, 1, 4, 7, 133],
      scene: 'meadow',
      sceneByTime: false,
      sceneSchedule: {
        morning: 'meadow',
        day: 'beach',
        evening: 'forest',
        night: 'snow',
      },
      randomEvents: true,
      favoritePokemon: [],
      favoriteSounds: [],
      setFieldPokemon: ids =>
        set({ fieldPokemon: ids.slice(0, MAX_FIELD_POKEMON) }),
      toggleFavoritePokemon: id =>
        set(s => ({ favoritePokemon: toggle(s.favoritePokemon, id) })),
      toggleFavoriteSound: key =>
        set(s => ({ favoriteSounds: toggle(s.favoriteSounds, key) })),
      setScene: scene => set({ scene }),
      setSceneByTime: sceneByTime => set({ sceneByTime }),
      setScheduledScene: (time, scene) =>
        set(s => ({ sceneSchedule: { ...s.sceneSchedule, [time]: scene } })),
      setRandomEvents: randomEvents => set({ randomEvents }),
    }),
    {
      name: 'settings',
      storage: createJSONStorage(() => ({
        getItem: key => storage.getString(key) ?? null,
        setItem: (key, value) => storage.set(key, value),
        removeItem: key => {
          storage.remove(key);
        },
      })),
    },
  ),
);

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter(x => x !== item) : [...list, item];
}
