import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { describeTimeUntil, formatTime, nextTrigger } from '../alarm/schedule';
import { PokemonSprite } from '../components/PokemonSprite';
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

/**
 * Home screen. The roaming field, background picker and random events come in the next step;
 * for now it shows the clock, which opens the alarm list.
 */
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
    <View style={styles.field}>
      <SafeAreaView style={styles.container}>
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
              : '알람을 추가하려면 누르세요'}
          </Text>
        </Pressable>
        <View style={styles.ground}>
          <PokemonSprite pokemonId={25} size={96} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { flex: 1, backgroundColor: '#8FD3F4' },
  container: { flex: 1, justifyContent: 'space-between' },
  clock: {
    alignSelf: 'center',
    marginTop: 48,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
  },
  time: {
    fontSize: 64,
    fontWeight: '700',
    color: '#1D2433',
    fontVariant: ['tabular-nums'],
  },
  next: { fontSize: 15, color: '#4A5368', marginTop: 4 },
  ground: {
    height: '35%',
    backgroundColor: '#7AC74C',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
