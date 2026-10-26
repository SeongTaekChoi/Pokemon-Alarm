import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import {
  describeRepeat,
  describeTimeUntil,
  formatTime,
  nextTrigger,
} from '../alarm/schedule';
import { PokemonSprite } from '../components/PokemonSprite';
import { AlarmModule } from '../native/AlarmModule';
import type { ScreenProps } from '../navigation';
import { useAlarmStore } from '../store/alarmStore';
import { colors } from '../theme';

export function AlarmListScreen({ navigation }: ScreenProps<'AlarmList'>) {
  const { alarms, load, setEnabled } = useAlarmStore();
  const [missingPermission, setMissingPermission] = useState(false);

  useFocusEffect(
    useCallback(() => {
      load().catch(() => {});
      AlarmModule.getPermissionStatus()
        .then(s =>
          setMissingPermission(
            !s.notifications || !s.exactAlarm || !s.fullScreen,
          ),
        )
        .catch(() => {});
    }, [load]),
  );

  const sorted = [...alarms].sort(
    (a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute),
  );

  return (
    <View style={styles.container}>
      {missingPermission && (
        <Pressable
          style={styles.banner}
          onPress={() => navigation.navigate('Permissions')}
        >
          <Text style={styles.bannerText}>
            화면이 꺼져 있을 때도 알람이 울리려면 권한이 필요해요. 눌러서
            확인하기
          </Text>
        </Pressable>
      )}
      <FlatList
        data={sorted}
        keyExtractor={a => a.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>아직 알람이 없어요</Text>
        }
        renderItem={({ item }) => {
          const next = nextTrigger(item);
          return (
            <Pressable
              style={styles.row}
              onPress={() =>
                navigation.navigate('AlarmEdit', { alarmId: item.id })
              }
            >
              <PokemonSprite pokemonId={item.pokemonId} size={48} />
              <View style={styles.rowText}>
                <Text style={[styles.time, !item.enabled && styles.disabled]}>
                  {formatTime(item.hour, item.minute)}
                </Text>
                <Text style={styles.meta}>
                  {[
                    item.label,
                    describeRepeat(item),
                    next ? describeTimeUntil(next) : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </View>
              <Switch
                value={item.enabled}
                onValueChange={value => setEnabled(item.id, value)}
                trackColor={{ true: colors.primary }}
              />
            </Pressable>
          );
        }}
      />
      <Pressable
        style={styles.add}
        onPress={() => navigation.navigate('AlarmEdit', {})}
      >
        <Text style={styles.addText}>+ 알람 추가</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  banner: { backgroundColor: '#FFF4DB', padding: 14 },
  bannerText: { color: colors.warning, fontWeight: '600' },
  list: { padding: 16, paddingBottom: 96 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 64 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  rowText: { flex: 1, marginLeft: 12 },
  time: { fontSize: 30, fontWeight: '700', color: colors.text },
  disabled: { color: colors.muted },
  meta: { color: colors.muted, marginTop: 2 },
  add: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: colors.primary,
    borderRadius: 28,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  addText: { color: colors.primaryText, fontSize: 17, fontWeight: '700' },
});
