import { DeviceEventEmitter, NativeModules } from 'react-native';
import type { Alarm, PermissionStatus, Ringtone } from '../types';

export interface RingingInfo {
  alarmId: string;
  attempt: number;
}

interface NativeAlarmModule {
  setAlarms(json: string): Promise<void>;
  getAlarms(): Promise<string>;
  getRinging(): Promise<RingingInfo | null>;
  dismiss(): Promise<void>;
  downloadCry(pokemonId: number): Promise<string>;
  listRingtones(): Promise<Ringtone[]>;
  previewSound(kind: 'cry' | 'ringtone', value: string): Promise<void>;
  stopPreview(): Promise<void>;
  getPermissionStatus(): Promise<PermissionStatus>;
  openSettings(kind: keyof PermissionStatus | 'battery'): Promise<void>;
}

const native: NativeAlarmModule = NativeModules.AlarmModule;

export const AlarmModule = {
  async setAlarms(alarms: Alarm[]): Promise<void> {
    await native.setAlarms(JSON.stringify(alarms));
  },
  async getAlarms(): Promise<Alarm[]> {
    return JSON.parse(await native.getAlarms());
  },
  getRinging: () => native.getRinging(),
  dismiss: () => native.dismiss(),
  downloadCry: (pokemonId: number) => native.downloadCry(pokemonId),
  listRingtones: () => native.listRingtones(),
  previewSound: (kind: 'cry' | 'ringtone', value: string) =>
    native.previewSound(kind, value),
  stopPreview: () => native.stopPreview(),
  getPermissionStatus: () => native.getPermissionStatus(),
  openSettings: (
    kind: 'notifications' | 'exactAlarm' | 'fullScreen' | 'battery',
  ) => native.openSettings(kind),
  onRingingChanged(listener: (ringing: RingingInfo | null) => void) {
    const sub = DeviceEventEmitter.addListener('alarmRingingChanged', listener);
    return () => sub.remove();
  },
};
