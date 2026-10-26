import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { describeTimeUntil, formatTime, nextTrigger } from '../alarm/schedule';
import { Field } from '../field/Field';
import type { ScreenProps } from '../navigation';
import { useAlarmStore } from '../store/alarmStore';

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

/** The field with roaming Pokémon. The floating clock opens the alarm list. */
export function HomeScreen({ navigation }: ScreenProps<'Home'>) {
  const now = useNow();
  const alarms = useAlarmStore(s => s.alarms);
  const load = useAlarmStore(s => s.load);

  useFocusEffect(
    useCallback(() => {
      load().catch(() => {});
    }, [load]),
  );

  const next = alarms
    .map(a => nextTrigger(a, now))
    .filter((d): d is Date => d !== null)
    .sort((a, b) => a.getTime() - b.getTime())[0];

  return (
    <View style={styles.container}>
      <Field now={now} />
      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <Pressable
          style={styles.clock}
          onPress={() => navigation.navigate('AlarmList')}
        >
          <Text style={styles.time}>
            {formatTime(now.getHours(), now.getMinutes())}
          </Text>
          <Text style={styles.next}>
            {next
              ? `다음 알람 ${describeTimeUntil(next, now)}`
              : '눌러서 알람 추가'}
          </Text>
        </Pressable>
        <View style={styles.buttons} pointerEvents="box-none">
          <Pressable
            style={styles.button}
            onPress={() => navigation.navigate('PokemonPicker')}
          >
            <Text style={styles.buttonText}>포켓몬</Text>
          </Pressable>
          <Pressable
            style={styles.button}
            onPress={() => navigation.navigate('ScenePicker')}
          >
            <Text style={styles.buttonText}>배경</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'space-between' },
  clock: {
    alignSelf: 'center',
    marginTop: 40,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
  },
  time: {
    fontSize: 60,
    fontWeight: '700',
    color: '#1D2433',
    fontVariant: ['tabular-nums'],
  },
  next: { fontSize: 15, color: '#4A5368', marginTop: 2 },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
  },
  button: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginLeft: 8,
  },
  buttonText: { fontWeight: '700', color: '#1D2433' },
});
