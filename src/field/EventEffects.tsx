import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { PokemonSprite } from '../components/PokemonSprite';
import { spriteSize } from '../data/pokemon';
import {
  EVENT_DURATION_MS,
  EVENT_LABELS,
  type Bounds,
  type FieldEvent,
} from './events';

const ITEMS =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items';

interface Props {
  event: FieldEvent;
  /** The whole screen, for weather overlays. */
  screen: Bounds;
  /** The ground area, where Pokémon and items are placed. */
  ground: Bounds;
  groundTop: number;
}

/** Visuals that belong to the event itself: rain, darkness, the berry, the ball, the wild Pokémon. */
export function EventEffects({ event, screen, ground, groundTop }: Props) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {event.kind === 'rain' && <Rain screen={screen} />}
      {event.kind === 'sleep' && (
        <View style={[StyleSheet.absoluteFill, styles.dark]} />
      )}
      <View
        style={[
          styles.ground,
          { top: groundTop, width: ground.width, height: ground.height },
        ]}
      >
        {event.kind === 'berry' && (
          <Berry x={event.x} y={event.y} groundTop={groundTop} />
        )}
        {event.kind === 'pokeball' && (
          <RollingBall y={event.y} width={ground.width} />
        )}
        {event.kind === 'wild' && (
          <WildPokemon
            pokemonId={event.pokemonId}
            x={event.x}
            y={event.y}
            width={ground.width}
          />
        )}
      </View>
      <View style={styles.banner}>
        <Text style={styles.bannerText}>{EVENT_LABELS[event.kind]}</Text>
      </View>
    </View>
  );
}

const DROPS = Array.from({ length: 36 }, (_, i) => ({
  x: (i * 37) % 100,
  delay: (i * 173) % 900,
  speed: 700 + ((i * 97) % 500),
}));

function Rain({ screen }: { screen: Bounds }) {
  return (
    <>
      <View style={[StyleSheet.absoluteFill, styles.rainTint]} />
      {DROPS.map((drop, i) => (
        <Drop key={i} {...drop} screen={screen} />
      ))}
    </>
  );
}

function Drop({
  x,
  delay,
  speed,
  screen,
}: {
  x: number;
  delay: number;
  speed: number;
  screen: Bounds;
}) {
  const y = useSharedValue(-30);
  useEffect(() => {
    y.value = withDelay(
      delay,
      withRepeat(
        withTiming(screen.height, { duration: speed, easing: Easing.linear }),
        -1,
      ),
    );
  }, [delay, screen.height, speed, y]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
  }));
  return (
    <Animated.View
      style={[styles.drop, { left: (x / 100) * screen.width }, style]}
    />
  );
}

function Berry({
  x,
  y,
  groundTop,
}: {
  x: number;
  y: number;
  groundTop: number;
}) {
  // Falls from the sky, then is eaten (fades) near the end of the event.
  const top = useSharedValue(-groundTop - 40);
  const opacity = useSharedValue(1);
  useEffect(() => {
    top.value = withTiming(y - 24, { duration: 900, easing: Easing.bounce });
    opacity.value = withDelay(
      EVENT_DURATION_MS.berry - 2500,
      withTiming(0, { duration: 600 }),
    );
  }, [opacity, top, y]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: top.value }],
    opacity: opacity.value,
  }));
  return (
    <Animated.View style={[styles.item, { left: x - 16 }, style]}>
      <Image
        source={{ uri: `${ITEMS}/oran-berry.png` }}
        style={styles.itemImage}
      />
    </Animated.View>
  );
}

function RollingBall({ y, width }: { y: number; width: number }) {
  const left = useSharedValue(-40);
  const spin = useSharedValue(0);
  useEffect(() => {
    const duration = 2600;
    left.value = withTiming(width - 40, {
      duration,
      easing: Easing.out(Easing.quad),
    });
    spin.value = withTiming(720, { duration, easing: Easing.out(Easing.quad) });
  }, [left, spin, width]);
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: left.value },
      { translateY: y - 28 },
      { rotate: `${spin.value}deg` },
    ],
  }));
  return (
    <Animated.View style={[styles.item, style]}>
      <Image
        source={{ uri: `${ITEMS}/poke-ball.png` }}
        style={styles.itemImage}
      />
    </Animated.View>
  );
}

function WildPokemon({
  pokemonId,
  x,
  y,
  width,
}: {
  pokemonId: number;
  x: number;
  y: number;
  width: number;
}) {
  const size = spriteSize(pokemonId);
  // Walks in from the right edge, stays a while, then leaves the way it came.
  const left = useSharedValue(width + size);
  useEffect(() => {
    const stay = EVENT_DURATION_MS.wild - 3600;
    left.value = withSequence(
      withTiming(x - size / 2, { duration: 1800 }),
      withDelay(stay, withTiming(width + size, { duration: 1800 })),
    );
  }, [left, size, width, x]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: left.value }, { translateY: y - size }],
  }));
  return (
    <Animated.View style={[styles.item, style]}>
      <PokemonSprite pokemonId={pokemonId} size={size} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  ground: { position: 'absolute', left: 0 },
  dark: { backgroundColor: 'rgba(5, 10, 40, 0.45)' },
  rainTint: { backgroundColor: 'rgba(40, 60, 90, 0.25)' },
  drop: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: 16,
    borderRadius: 1,
    backgroundColor: 'rgba(220, 235, 255, 0.8)',
  },
  item: { position: 'absolute', left: 0, top: 0, zIndex: 10000 },
  itemImage: { width: 32, height: 32 },
  banner: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  bannerText: { color: '#FFFFFF', fontWeight: '700' },
});
