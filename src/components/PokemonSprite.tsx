import React, { useState } from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';
import { animatedSpriteUrl, artworkUrl } from '../data/pokemon';

interface Props {
  pokemonId: number;
  size: number;
  style?: StyleProp<ImageStyle>;
}

/** Animated Showdown GIF, falling back to the still artwork when a Pokémon has no GIF. */
export function PokemonSprite({ pokemonId, size, style }: Props) {
  const [failedId, setFailedId] = useState<number | null>(null);
  const uri =
    failedId === pokemonId
      ? artworkUrl(pokemonId)
      : animatedSpriteUrl(pokemonId);
  return (
    <Image
      source={{ uri }}
      onError={() => setFailedId(pokemonId)}
      resizeMode="contain"
      style={[{ width: size, height: size }, style]}
    />
  );
}
