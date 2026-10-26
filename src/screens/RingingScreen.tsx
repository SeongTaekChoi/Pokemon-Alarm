import React, { useEffect, useState } from 'react';
import { Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { formatTime } from '../alarm/schedule';
import { PokemonSprite } from '../components/PokemonSprite';
import { getPokemon, withSubjectParticle } from '../data/pokemon';
import { AlarmModule, RingingInfo } from '../native/AlarmModule';
import { colors } from '../theme';
import type { Alarm } from '../types';

interface Props {
  alarmId?: string;
}

/** Root component of the ringing activity (registered as `AlarmRinging` in index.js). */
export function RingingScreen({ alarmId }: Props) {
  const [alarm, setAlarm] = useState<Alarm | null>(null);
  const [ringing, setRinging] = useState<RingingInfo | null>(null);
  const [now, setNow] = useState(() => new Date());
  const bounce = useSharedValue(0);

  useEffect(() => {
    AlarmModule.getAlarms()
      .then(list => setAlarm(list.find(a => a.id === alarmId) ?? null))
      .catch(() => {});
    AlarmModule.getRinging()
      .then(setRinging)
      .catch(() => {});
    const unsubscribe = AlarmModule.onRingingChanged(setRinging);
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, [alarmId]);

  useEffect(() => {
    bounce.value = withRepeat(
      withSequence(
        withTiming(-28, { duration: 280, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 280, easing: Easing.in(Easing.quad) }),
        withTiming(0, { duration: 500 }),
      ),
      -1,
    );
  }, [bounce]);

  const bounceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce.value }],
  }));
  const pokemonId = alarm?.pokemonId ?? 25;
  const pokemon = getPokemon(pokemonId);
  const attempt = ringing?.attempt ?? 0;

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        <View style={styles.top}>
          <Text style={styles.time}>
            {formatTime(now.getHours(), now.getMinutes())}
          </Text>
          <Text style={styles.label}>
            {alarm?.label || '일어날 시간이에요!'}
          </Text>
          {attempt > 0 && (
            <Text style={styles.retry}>다시 울림 {attempt}/3</Text>
          )}
        </View>
        <Animated.View style={[styles.pokemon, bounceStyle]}>
          <PokemonSprite pokemonId={pokemonId} size={200} />
        </Animated.View>
        <Text style={styles.name}>
          {pokemon ? `${withSubjectParticle(pokemon.ko)} 깨우고 있어요` : ''}
        </Text>
        <Pressable style={styles.dismiss} onPress={() => AlarmModule.dismiss()}>
          <Text style={styles.dismissText}>끄기</Text>
        </Pressable>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.accentDark,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 32,
  },
  top: { alignItems: 'center', marginTop: 32 },
  time: {
    fontSize: 80,
    fontWeight: '700',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  label: { fontSize: 20, color: '#FFFFFF', marginTop: 4 },
  retry: { fontSize: 14, color: colors.accent, marginTop: 8 },
  pokemon: { alignItems: 'center' },
  name: { color: '#FFFFFF', fontSize: 16 },
  dismiss: {
    width: '80%',
    backgroundColor: colors.accent,
    borderRadius: 40,
    paddingVertical: 22,
    alignItems: 'center',
    marginBottom: 24,
  },
  dismissText: { fontSize: 26, fontWeight: '800', color: colors.text },
});
