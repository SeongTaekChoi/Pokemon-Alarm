/** ISO weekday: 1 = Monday ... 7 = Sunday. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type AlarmSound =
  | { kind: 'cry'; pokemonId: number }
  | { kind: 'ringtone'; uri: string; title: string };

/** Shared with native code: android/.../alarm/Alarm.kt reads the same JSON. */
export interface Alarm {
  id: string;
  enabled: boolean;
  hour: number;
  minute: number;
  /** yyyy-MM-dd for a one-time alarm on that day. Ignored when weekdays is not empty. */
  date: string | null;
  weekdays: Weekday[];
  sound: AlarmSound;
  /** Pokémon shown on the ringing screen. */
  pokemonId: number;
  vibrate: boolean;
  /** Start quiet and get louder over the first minute. */
  volumeRamp: boolean;
  /** Ring again 5 minutes after an unanswered alarm ends, at most 3 times. */
  autoRepeat: boolean;
  label: string;
}

export interface PermissionStatus {
  notifications: boolean;
  exactAlarm: boolean;
  fullScreen: boolean;
  batteryOptimizationIgnored: boolean;
}

export interface Ringtone {
  uri: string;
  title: string;
  group: 'alarm' | 'ringtone';
}
