import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Home: undefined;
  AlarmList: undefined;
  AlarmEdit: { alarmId?: string };
  SoundPicker: undefined;
  Permissions: undefined;
  PokemonPicker: undefined;
  ScenePicker: undefined;
};

export type ScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;
