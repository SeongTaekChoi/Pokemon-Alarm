/** Moves favorites to the front, keeping the original order within each group. */
export function favoritesFirst<T>(list: T[], isFavorite: (item: T) => boolean) {
  const favorites: T[] = [];
  const rest: T[] = [];
  for (const item of list) {
    (isFavorite(item) ? favorites : rest).push(item);
  }
  return favorites.concat(rest);
}

/** Favorite key for an alarm sound: cry:25, ringtone:<uri> (8-bit tracks are ringtone URIs too). */
export function soundKey(kind: 'cry' | 'ringtone', value: string | number) {
  return `${kind}:${value}`;
}
