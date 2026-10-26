import React, { useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { POKEMON } from '../data/pokemon';
import { useSettingsStore } from '../store/settingsStore';
import { EventEffects } from './EventEffects';
import {
  EVENT_DURATION_MS,
  EVENT_GAP_MS,
  behaviorFor,
  createEvent,
  pickEventKind,
  type Bounds,
  type FieldEvent,
} from './events';
import { RoamingPokemon } from './RoamingPokemon';
import { SceneBackground } from './SceneBackground';
import { timeOfDay } from './scenes';

/** Where the ground starts, as a fraction of the screen height. */
const HORIZON = 0.5;

interface Props {
  now: Date;
  /** Space at the bottom kept free for the home screen buttons. */
  reservedBottom?: number;
}

/** The home screen field: scene, roaming Pokémon, and random events. */
export function Field({ now, reservedBottom = 0 }: Props) {
  const { fieldPokemon, scene, sceneByTime, sceneSchedule, randomEvents } =
    useSettingsStore();
  const [screen, setScreen] = useState<Bounds>({ width: 0, height: 0 });
  const [event, setEvent] = useState<FieldEvent | null>(null);

  const time = timeOfDay(now);
  const activeScene = sceneByTime ? sceneSchedule[time] : scene;
  const groundTop = screen.height * HORIZON;
  const ground = useMemo(
    () => ({
      width: screen.width,
      height: Math.max(0, screen.height * (1 - HORIZON) - reservedBottom),
    }),
    [reservedBottom, screen],
  );

  // Spread the starting spots so Pokémon don't stack on top of each other.
  const starts = useMemo(
    () =>
      fieldPokemon.map((_, i) => ({
        x: 0.1 + ((i * 0.37) % 0.8),
        y: 0.35 + ((i * 0.23) % 0.6),
      })),
    [fieldPokemon],
  );

  const behaviors = useMemo(
    () => fieldPokemon.map((_, i) => behaviorFor(event, i, ground)),
    [event, fieldPokemon, ground],
  );

  useEffect(() => {
    if (!randomEvents || fieldPokemon.length === 0 || ground.width === 0) {
      setEvent(null);
      return;
    }
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const [min, max] = EVENT_GAP_MS;
      timer = setTimeout(() => {
        const kind = pickEventKind(timeOfDay(new Date()));
        setEvent(
          createEvent(kind, {
            bounds: ground,
            fieldCount: fieldPokemon.length,
            fieldIds: fieldPokemon,
            maxPokemonId: POKEMON.length,
          }),
        );
        timer = setTimeout(() => {
          setEvent(null);
          schedule();
        }, EVENT_DURATION_MS[kind]);
      }, min + Math.random() * (max - min));
    };
    schedule();
    return () => clearTimeout(timer);
  }, [fieldPokemon, ground, randomEvents]);

  function onLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    setScreen({ width, height });
  }

  return (
    // Not collapsable: if Android flattens these views, the Pokémon's zIndex would lift them
    // above the home screen buttons.
    <View
      style={StyleSheet.absoluteFill}
      onLayout={onLayout}
      collapsable={false}
    >
      {screen.width > 0 && (
        <>
          <SceneBackground
            scene={activeScene}
            time={time}
            width={screen.width}
            height={screen.height}
            horizon={HORIZON}
          />
          <View
            collapsable={false}
            style={[
              styles.ground,
              { top: groundTop, width: ground.width, height: ground.height },
            ]}
          >
            {fieldPokemon.map((id, i) => (
              <RoamingPokemon
                key={id}
                pokemonId={id}
                bounds={ground}
                behavior={behaviors[i]}
                start={starts[i]}
              />
            ))}
          </View>
          {event && (
            <EventEffects
              event={event}
              screen={screen}
              ground={ground}
              groundTop={groundTop}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ground: { position: 'absolute', left: 0 },
});
