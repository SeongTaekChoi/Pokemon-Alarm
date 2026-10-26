import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  WEEKDAY_LABELS,
  createAlarm,
  describeTimeUntil,
  formatDate,
  formatTime,
  nextTrigger,
} from '../alarm/schedule';
import { Chip } from '../components/Chip';
import { PokemonSprite } from '../components/PokemonSprite';
import { getPokemon } from '../data/pokemon';
import type { ScreenProps } from '../navigation';
import { useAlarmStore, useDraftStore } from '../store/alarmStore';
import { colors } from '../theme';
import type { Weekday } from '../types';

const WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5, 6, 7];

function newId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function AlarmEditScreen({
  navigation,
  route,
}: ScreenProps<'AlarmEdit'>) {
  const alarmId = route.params?.alarmId;
  const existing = useAlarmStore(s => s.alarms.find(a => a.id === alarmId));
  const { save, remove } = useAlarmStore();
  const { draft, setDraft, update } = useDraftStore();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(existing ?? createAlarm(newId()));
    navigation.setOptions({ title: existing ? '알람 수정' : '새 알람' });
    return () => setDraft(null);
    // Only when the screen opens; later edits live in the draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!draft) {
    return null;
  }

  const next = nextTrigger(draft);
  const dateMode = draft.weekdays.length === 0 && draft.date !== null;

  function pickTime() {
    DateTimePickerAndroid.open({
      mode: 'time',
      is24Hour: true,
      value: new Date(2000, 0, 1, draft!.hour, draft!.minute),
      onChange: (event, value) => {
        if (event.type === 'set' && value) {
          update({ hour: value.getHours(), minute: value.getMinutes() });
        }
      },
    });
  }

  function pickDate() {
    const today = new Date();
    DateTimePickerAndroid.open({
      mode: 'date',
      minimumDate: today,
      value: draft!.date ? new Date(`${draft!.date}T00:00:00`) : today,
      onChange: (event, value) => {
        if (event.type === 'set' && value) {
          update({ date: formatDate(value), weekdays: [] });
        }
      },
    });
  }

  function toggleWeekday(day: Weekday) {
    const days = draft!.weekdays.includes(day)
      ? draft!.weekdays.filter(d => d !== day)
      : [...draft!.weekdays, day].sort();
    update({ weekdays: days, date: null });
  }

  async function onSave() {
    if (!next) {
      Alert.alert('지난 시간이에요', '날짜나 시간을 다시 골라 주세요.');
      return;
    }
    setSaving(true);
    try {
      await save({ ...draft!, enabled: true });
      navigation.goBack();
    } catch {
      Alert.alert(
        '저장하지 못했어요',
        '울음소리를 받으려면 인터넷 연결이 필요해요.',
      );
    } finally {
      setSaving(false);
    }
  }

  function onDelete() {
    Alert.alert('알람을 삭제할까요?', undefined, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          await remove(draft!.id);
          navigation.goBack();
        },
      },
    ]);
  }

  const soundLabel =
    draft.sound.kind === 'cry'
      ? `${getPokemon(draft.sound.pokemonId)?.ko ?? ''} 울음소리`
      : draft.sound.title;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.timeBox} onPress={pickTime}>
          <Text style={styles.time}>
            {formatTime(draft.hour, draft.minute)}
          </Text>
          <Text style={styles.muted}>
            {next
              ? `${describeTimeUntil(next)} 울려요`
              : '이미 지난 시간이에요'}
          </Text>
        </Pressable>

        <Text style={styles.section}>반복</Text>
        <View style={styles.wrap}>
          {WEEKDAYS.map(day => (
            <Chip
              key={day}
              label={WEEKDAY_LABELS[day]}
              selected={draft.weekdays.includes(day)}
              onPress={() => toggleWeekday(day)}
            />
          ))}
        </View>
        <Pressable style={styles.row} onPress={pickDate}>
          <Text style={styles.rowLabel}>특정 날짜에 한 번</Text>
          <Text style={[styles.rowValue, dateMode && styles.active]}>
            {dateMode ? draft.date : '날짜 선택'}
          </Text>
        </Pressable>
        {dateMode && (
          <Pressable onPress={() => update({ date: null })}>
            <Text style={styles.link}>
              날짜 지우기 (다음 해당 시각에 한 번 울림)
            </Text>
          </Pressable>
        )}

        <Text style={styles.section}>소리</Text>
        <Pressable
          style={styles.row}
          onPress={() => navigation.navigate('SoundPicker')}
        >
          {draft.sound.kind === 'cry' && (
            <PokemonSprite pokemonId={draft.sound.pokemonId} size={36} />
          )}
          <Text style={[styles.rowLabel, styles.flex]}>{soundLabel}</Text>
          <Text style={styles.rowValue}>변경</Text>
        </Pressable>
        <ToggleRow
          label="진동"
          value={draft.vibrate}
          onChange={vibrate => update({ vibrate })}
        />
        <ToggleRow
          label="점점 크게"
          detail="처음엔 작게 시작해 1분 동안 커져요"
          value={draft.volumeRamp}
          onChange={volumeRamp => update({ volumeRamp })}
        />
        <ToggleRow
          label="다시 울림"
          detail="5분 동안 끄지 않으면 5분 뒤 다시 울려요 (최대 3번)"
          value={draft.autoRepeat}
          onChange={autoRepeat => update({ autoRepeat })}
        />

        <Text style={styles.section}>이름</Text>
        <TextInput
          style={styles.input}
          placeholder="예: 출근"
          value={draft.label}
          onChangeText={label => update({ label })}
          maxLength={30}
        />

        {existing && (
          <Pressable onPress={onDelete} style={styles.delete}>
            <Text style={styles.deleteText}>알람 삭제</Text>
          </Pressable>
        )}
      </ScrollView>
      <Pressable
        style={[styles.save, saving && styles.saving]}
        onPress={onSave}
        disabled={saving}
      >
        <Text style={styles.saveText}>{saving ? '저장 중…' : '저장'}</Text>
      </Pressable>
    </View>
  );
}

function ToggleRow(props: {
  label: string;
  detail?: string;
  value: boolean;
  onChange(value: boolean): void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.flex}>
        <Text style={styles.rowLabel}>{props.label}</Text>
        {props.detail && <Text style={styles.detail}>{props.detail}</Text>}
      </View>
      <Switch
        value={props.value}
        onValueChange={props.onChange}
        trackColor={{ true: colors.primary }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 120 },
  timeBox: { alignItems: 'center', paddingVertical: 20 },
  time: { fontSize: 64, fontWeight: '700', color: colors.text },
  muted: { color: colors.muted },
  section: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 20,
    marginBottom: 8,
    fontWeight: '600',
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  flex: { flex: 1 },
  rowLabel: { fontSize: 16, color: colors.text, marginLeft: 4 },
  rowValue: { color: colors.muted, marginLeft: 'auto' },
  active: { color: colors.accentDark, fontWeight: '600' },
  detail: { color: colors.muted, fontSize: 12, marginTop: 2, marginLeft: 4 },
  link: { color: colors.accentDark, marginBottom: 8, marginLeft: 4 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.text,
  },
  delete: { marginTop: 32, alignItems: 'center' },
  deleteText: { color: colors.primary, fontWeight: '600' },
  save: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saving: { opacity: 0.6 },
  saveText: { color: colors.primaryText, fontSize: 17, fontWeight: '700' },
});
