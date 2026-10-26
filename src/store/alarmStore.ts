import { create } from 'zustand';
import { AlarmModule } from '../native/AlarmModule';
import type { Alarm } from '../types';

interface AlarmState {
  alarms: Alarm[];
  loaded: boolean;
  /** Reads the native list, which is the source of truth (one-time alarms turn off natively). */
  load(): Promise<void>;
  save(alarm: Alarm): Promise<void>;
  remove(id: string): Promise<void>;
  setEnabled(id: string, enabled: boolean): Promise<void>;
}

async function prepareSound(alarm: Alarm) {
  // Cries are downloaded up front so the alarm rings without a network connection.
  if (alarm.sound.kind === 'cry') {
    await AlarmModule.downloadCry(alarm.sound.pokemonId);
  }
}

export const useAlarmStore = create<AlarmState>((set, get) => {
  async function commit(alarms: Alarm[]) {
    await AlarmModule.setAlarms(alarms);
    set({ alarms });
  }

  return {
    alarms: [],
    loaded: false,
    async load() {
      set({ alarms: await AlarmModule.getAlarms(), loaded: true });
    },
    async save(alarm) {
      await prepareSound(alarm);
      const others = get().alarms.filter(a => a.id !== alarm.id);
      await commit([...others, alarm]);
    },
    async remove(id) {
      await commit(get().alarms.filter(a => a.id !== id));
    },
    async setEnabled(id, enabled) {
      await commit(
        get().alarms.map(a => (a.id === id ? { ...a, enabled } : a)),
      );
    },
  };
});

/** A draft being edited, shared between the edit screen and the sound picker. */
interface DraftState {
  draft: Alarm | null;
  setDraft(draft: Alarm | null): void;
  update(patch: Partial<Alarm>): void;
}

export const useDraftStore = create<DraftState>(set => ({
  draft: null,
  setDraft: draft => set({ draft }),
  update: patch =>
    set(s => (s.draft ? { draft: { ...s.draft, ...patch } } : s)),
}));
