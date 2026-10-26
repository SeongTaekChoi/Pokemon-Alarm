import React, { useCallback, useEffect, useState } from 'react';
import {
  AppState,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AlarmModule } from '../native/AlarmModule';
import { colors } from '../theme';
import type { PermissionStatus } from '../types';

type Kind = 'notifications' | 'exactAlarm' | 'fullScreen' | 'battery';

const ITEMS: { kind: Kind; title: string; why: string; required: boolean }[] = [
  {
    kind: 'notifications',
    title: '알림',
    why: '알람이 울릴 때 화면과 끄기 버튼을 띄워요.',
    required: true,
  },
  {
    kind: 'exactAlarm',
    title: '정확한 알람',
    why: '절전 상태에서도 정해진 시각에 바로 울려요.',
    required: true,
  },
  {
    kind: 'fullScreen',
    title: '전체 화면 알림',
    why: '화면이 꺼져 있거나 잠겨 있어도 울림 화면을 띄워요.',
    required: true,
  },
  {
    kind: 'battery',
    title: '배터리 최적화 제외',
    why: '삼성, 샤오미 등 일부 폰이 앱을 강제로 멈추는 것을 막아요. 목록에서 이 앱을 찾아 "최적화 안 함"으로 바꿔 주세요.',
    required: false,
  },
];

function isGranted(status: PermissionStatus, kind: Kind) {
  return kind === 'battery' ? status.batteryOptimizationIgnored : status[kind];
}

export function PermissionsScreen() {
  const [status, setStatus] = useState<PermissionStatus | null>(null);

  const refresh = useCallback(() => {
    AlarmModule.getPermissionStatus()
      .then(setStatus)
      .catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    // Settings pages return to the app, so check again whenever it comes back.
    const sub = AppState.addEventListener(
      'change',
      s => s === 'active' && refresh(),
    );
    return () => sub.remove();
  }, [refresh]);

  async function fix(kind: Kind) {
    if (
      kind === 'notifications' &&
      Platform.OS === 'android' &&
      Platform.Version >= 33
    ) {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      if (result === PermissionsAndroid.RESULTS.GRANTED) {
        refresh();
        return;
      }
    }
    await AlarmModule.openSettings(kind);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.intro}>
        화면이 꺼져 있을 때도 알람이 꼭 울리도록, 아래 항목을 모두 켜 주세요.
      </Text>
      {ITEMS.map(item => {
        const granted = status ? isGranted(status, item.kind) : false;
        return (
          <View key={item.kind} style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>
                {item.title}
                {!item.required && <Text style={styles.optional}> (권장)</Text>}
              </Text>
              <Text
                style={[styles.state, granted ? styles.ok : styles.missing]}
              >
                {granted ? '켜짐' : '꺼짐'}
              </Text>
            </View>
            <Text style={styles.why}>{item.why}</Text>
            {!granted && (
              <Pressable style={styles.button} onPress={() => fix(item.kind)}>
                <Text style={styles.buttonText}>설정 열기</Text>
              </Pressable>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  intro: { color: colors.text, fontSize: 15, marginBottom: 16, lineHeight: 22 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  optional: { fontSize: 13, fontWeight: '400', color: colors.muted },
  state: { fontWeight: '700' },
  ok: { color: colors.success },
  missing: { color: colors.primary },
  why: { color: colors.muted, marginTop: 6, lineHeight: 20 },
  button: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: colors.accentDark,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  buttonText: { color: '#FFFFFF', fontWeight: '600' },
});
