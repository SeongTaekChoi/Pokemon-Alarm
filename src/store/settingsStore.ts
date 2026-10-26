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
  setFieldPokemon(ids: number[]): void;
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
      setFieldPokemon: ids =>
        set({ fieldPokemon: ids.slice(0, MAX_FIELD_POKEMON) }),
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
