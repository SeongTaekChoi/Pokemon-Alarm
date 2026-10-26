import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Chip } from '../components/Chip';
import { SceneBackground } from '../field/SceneBackground';
import { SCENES, TIMES_OF_DAY, timeOfDay, type SceneId } from '../field/scenes';
import { useSettingsStore } from '../store/settingsStore';
import { colors } from '../theme';

const PREVIEW_WIDTH = 150;
const PREVIEW_HEIGHT = 110;

export function ScenePickerScreen() {
  const {
    scene,
    setScene,
    sceneByTime,
    setSceneByTime,
    sceneSchedule,
    setScheduledScene,
    randomEvents,
    setRandomEvents,
  } = useSettingsStore();
  const time = timeOfDay(new Date());

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.section}>배경</Text>
      <View style={styles.grid}>
        {SCENES.map(s => (
          <ScenePreview
            key={s.id}
            id={s.id}
            name={s.name}
            selected={!sceneByTime && scene === s.id}
            onPress={() => {
              setScene(s.id);
              setSceneByTime(false);
            }}
          />
        ))}
      </View>
      <Text style={styles.note}>
        하늘은 지금 시간({TIMES_OF_DAY.find(t => t.id === time)?.name})에 맞춰
        바뀌어요.
      </Text>

      <View style={styles.row}>
        <View style={styles.flex}>
          <Text style={styles.rowLabel}>시간대에 따라 배경 바꾸기</Text>
          <Text style={styles.detail}>
            아침, 낮, 저녁, 밤마다 다른 배경을 보여줘요
          </Text>
        </View>
        <Switch
          value={sceneByTime}
          onValueChange={setSceneByTime}
          trackColor={{ true: colors.primary }}
        />
      </View>
      {sceneByTime &&
        TIMES_OF_DAY.map(t => (
          <View key={t.id} style={styles.schedule}>
            <Text style={styles.scheduleLabel}>
              {t.name} <Text style={styles.detail}>{t.hours}</Text>
            </Text>
            <View style={styles.chips}>
              {SCENES.map(s => (
                <Chip
                  key={s.id}
                  label={s.name}
                  selected={sceneSchedule[t.id] === s.id}
                  onPress={() => setScheduledScene(t.id, s.id)}
                />
              ))}
            </View>
          </View>
        ))}

      <View style={[styles.row, styles.spaced]}>
        <View style={styles.flex}>
          <Text style={styles.rowLabel}>랜덤 이벤트</Text>
          <Text style={styles.detail}>
            비, 졸음, 열매, 야생 포켓몬, 몬스터볼
          </Text>
        </View>
        <Switch
          value={randomEvents}
          onValueChange={setRandomEvents}
          trackColor={{ true: colors.primary }}
        />
      </View>
    </ScrollView>
  );
}

function ScenePreview(props: {
  id: SceneId;
  name: string;
  selected: boolean;
  onPress(): void;
}) {
  return (
    <Pressable
      style={[styles.card, props.selected && styles.cardSelected]}
      onPress={props.onPress}
    >
      <View style={styles.preview}>
        <SceneBackground
          scene={props.id}
          time={timeOfDay(new Date())}
          width={PREVIEW_WIDTH}
          height={PREVIEW_HEIGHT}
          horizon={0.55}
        />
      </View>
      <Text style={styles.cardLabel}>{props.name}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  section: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 8,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: PREVIEW_WIDTH + 8,
    padding: 4,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: colors.surface,
    marginBottom: 12,
    alignItems: 'center',
  },
  cardSelected: { borderColor: colors.primary },
  preview: {
    width: PREVIEW_WIDTH,
    height: PREVIEW_HEIGHT,
    borderRadius: 10,
    overflow: 'hidden',
  },
  cardLabel: { marginVertical: 6, fontWeight: '600', color: colors.text },
  note: { color: colors.muted, fontSize: 12, marginBottom: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  spaced: { marginTop: 16 },
  flex: { flex: 1 },
  rowLabel: { fontSize: 16, color: colors.text },
  detail: { color: colors.muted, fontSize: 12, marginTop: 2 },
  schedule: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
  },
  scheduleLabel: { fontWeight: '600', color: colors.text, marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
});
