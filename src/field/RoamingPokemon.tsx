import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { PokemonSprite } from '../components/PokemonSprite';
import { AlarmModule } from '../native/AlarmModule';
import type { Behavior, Bounds } from './events';

export const SPRITE_SIZE = 72;

const WALK_SPEED = 45; // px per second
const RUN_SPEED = 140;

interface Props {
  pokemonId: number;
  bounds: Bounds;
  behavior: Behavior;
  /** Where it first appears, as fractions of the bounds. */
  start: { x: number; y: number };
}

type Trick = 'jump' | 'spin' | 'shake' | 'grow';
const TRICKS: Trick[] = ['jump', 'spin', 'shake', 'grow'];

/**
 * One Pokémon on the home field. It wanders on its own, follows the current event's behavior,
 * and does a trick with its cry when tapped. Positions are the sprite's bottom center.
 */
export function RoamingPokemon({ pokemonId, bounds, behavior, start }: Props) {
  const x = useSharedValue(start.x * bounds.width);
  const y = useSharedValue(start.y * bounds.height);
  const facing = useSharedValue(1); // 1 = left (sprite default), -1 = right
  const hop = useSharedValue(0);
  const turn = useSharedValue(0);
  const scale = useSharedValue(1);
  const [emote, setEmote] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  /** Walks or runs to a point and returns how long it takes. */
  const moveTo = useCallback(
    (tx: number, ty: number, speed: number) => {
      const cx = clamp(tx, SPRITE_SIZE / 2, bounds.width - SPRITE_SIZE / 2);
      const cy = clamp(ty, SPRITE_SIZE * 0.6, bounds.height);
      const distance = Math.hypot(cx - x.value, cy - y.value);
      const duration = Math.max(300, (distance / speed) * 1000);
      if (Math.abs(cx - x.value) > 4) {
        facing.value = cx > x.value ? -1 : 1;
      }
      x.value = withTiming(cx, { duration, easing: Easing.linear });
      y.value = withTiming(cy, { duration, easing: Easing.linear });
      // A small bounce while moving reads as walking.
      hop.value = withRepeat(
        withSequence(
          withTiming(-6, { duration: 160 }),
          withTiming(0, { duration: 160 }),
        ),
        Math.max(1, Math.round(duration / 320)),
      );
      return duration;
    },
    [bounds, facing, hop, x, y],
  );

  const stopMoving = useCallback(() => {
    cancelAnimation(x);
    cancelAnimation(y);
    cancelAnimation(hop);
    cancelAnimation(turn);
    cancelAnimation(scale);
    hop.value = withTiming(0, { duration: 120 });
    turn.value = withTiming(0, { duration: 120 });
    scale.value = withTiming(1, { duration: 120 });
  }, [hop, scale, turn, x, y]);

  useEffect(() => {
    if (bounds.width === 0) {
      return;
    }
    clearTimers();
    stopMoving();
    setEmote(null);

    switch (behavior.mode) {
      case 'roam': {
        const wander = () => {
          const duration = moveTo(
            Math.random() * bounds.width,
            bounds.height * (0.3 + Math.random() * 0.7),
            WALK_SPEED,
          );
          later(wander, duration + 1000 + Math.random() * 3000);
        };
        later(wander, Math.random() * 2000);
        break;
      }
      case 'goto': {
        const duration = moveTo(behavior.x, behavior.y, RUN_SPEED);
        later(() => {
          if (behavior.emote) {
            setEmote(behavior.emote);
          }
          if (behavior.then === 'shiver') {
            turn.value = withRepeat(
              withSequence(
                withTiming(-6, { duration: 70 }),
                withTiming(6, { duration: 70 }),
              ),
              -1,
              true,
            );
          }
        }, duration);
        break;
      }
      case 'sleep':
        setEmote('💤');
        scale.value = withRepeat(
          withSequence(
            withTiming(0.94, { duration: 1200 }),
            withTiming(1, { duration: 1200 }),
          ),
          -1,
        );
        break;
      case 'alert':
        facing.value = behavior.faceX > x.value ? -1 : 1;
        setEmote('❗');
        hop.value = withSequence(
          withTiming(-18, { duration: 150 }),
          withTiming(0, { duration: 150 }),
        );
        break;
    }
    return clearTimers;
  }, [
    behavior,
    bounds,
    clearTimers,
    facing,
    hop,
    later,
    moveTo,
    scale,
    stopMoving,
    turn,
    x,
  ]);

  function doTrick() {
    AlarmModule.previewSound('cry', String(pokemonId)).catch(() => {});
    const trick = TRICKS[Math.floor(Math.random() * TRICKS.length)];
    setEmote('♪');
    later(() => setEmote(current => (current === '♪' ? null : current)), 1500);
    switch (trick) {
      case 'jump':
        hop.value = withSequence(
          withTiming(-50, { duration: 220, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 220, easing: Easing.in(Easing.quad) }),
          withTiming(-20, { duration: 120 }),
          withTiming(0, { duration: 120 }),
        );
        break;
      case 'spin':
        turn.value = withSequence(
          withTiming(360, { duration: 600 }),
          withTiming(0, { duration: 0 }),
        );
        break;
      case 'shake':
        turn.value = withSequence(
          ...[-15, 15, -15, 15, 0].map(deg =>
            withTiming(deg, { duration: 80 }),
          ),
        );
        break;
      case 'grow':
        scale.value = withSequence(
          withTiming(1.4, { duration: 200 }),
          withTiming(0.9, { duration: 150 }),
          withTiming(1, { duration: 150 }),
        );
        break;
    }
  }

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value - SPRITE_SIZE / 2 },
      { translateY: y.value - SPRITE_SIZE + hop.value },
    ],
    // Pokémon further down the screen are closer, so they draw on top.
    zIndex: Math.round(y.value),
  }));

  const spriteStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleX: facing.value },
      { rotate: `${turn.value}deg` },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[styles.container, style]}>
      {emote && <Text style={styles.emote}>{emote}</Text>}
      <Pressable onPress={doTrick} hitSlop={8}>
        <Animated.View style={spriteStyle}>
          <PokemonSprite pokemonId={pokemonId} size={SPRITE_SIZE} />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const styles = StyleSheet.create({
  container: { position: 'absolute', left: 0, top: 0, alignItems: 'center' },
  emote: { position: 'absolute', top: -22, fontSize: 20 },
});
