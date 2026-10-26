package com.seongtaek.pokealarm.alarm

import java.time.DayOfWeek
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.ZoneId
import org.json.JSONArray
import org.json.JSONObject

/** Mirrors the `Alarm` type in src/types.ts. JS writes it, native schedules and rings it. */
data class Alarm(
    val id: String,
    val enabled: Boolean,
    val hour: Int,
    val minute: Int,
    /** ISO date (yyyy-MM-dd) for a one-time alarm on a specific day. */
    val date: String?,
    /** ISO weekdays, 1 = Monday ... 7 = Sunday. Empty means no weekly repeat. */
    val weekdays: List<Int>,
    val sound: AlarmSound,
    val pokemonId: Int,
    val vibrate: Boolean,
    val volumeRamp: Boolean,
    val autoRepeat: Boolean,
    val label: String,
    val json: JSONObject,
) {
  val isRepeating: Boolean
    get() = weekdays.isNotEmpty()

  /** Next time this alarm should ring after [now], or null when it never will. */
  fun nextTrigger(now: LocalDateTime): LocalDateTime? {
    if (!enabled) return null
    val time = LocalTime.of(hour, minute)
    if (date != null && !isRepeating) {
      val at = LocalDate.parse(date).atTime(time)
      return if (at.isAfter(now)) at else null
    }
    for (offset in 0..7) {
      val day = now.toLocalDate().plusDays(offset.toLong())
      val at = day.atTime(time)
      if (!at.isAfter(now)) continue
      if (!isRepeating || weekdays.contains(day.dayOfWeek.value)) return at
    }
    return null
  }

  fun nextTriggerMillis(now: LocalDateTime = LocalDateTime.now()): Long? =
      nextTrigger(now)?.atZone(ZoneId.systemDefault())?.toInstant()?.toEpochMilli()

  companion object {
    fun fromJson(o: JSONObject): Alarm {
      val days = o.optJSONArray("weekdays") ?: JSONArray()
      return Alarm(
          id = o.getString("id"),
          enabled = o.optBoolean("enabled", true),
          hour = o.getInt("hour"),
          minute = o.getInt("minute"),
          date = if (o.isNull("date")) null else o.optString("date", "").ifEmpty { null },
          weekdays = (0 until days.length()).map { days.getInt(it) }.filter { it in DayOfWeek.MONDAY.value..DayOfWeek.SUNDAY.value },
          sound = AlarmSound.fromJson(o.getJSONObject("sound")),
          pokemonId = o.optInt("pokemonId", 25),
          vibrate = o.optBoolean("vibrate", true),
          volumeRamp = o.optBoolean("volumeRamp", true),
          autoRepeat = o.optBoolean("autoRepeat", true),
          label = o.optString("label", ""),
          json = o,
      )
    }
  }
}

sealed class AlarmSound {
  /** A Pokémon cry, downloaded to the device ahead of time. */
  data class Cry(val pokemonId: Int) : AlarmSound()

  /** A ringtone or alarm sound that ships with the phone. */
  data class Ringtone(val uri: String) : AlarmSound()

  companion object {
    fun fromJson(o: JSONObject): AlarmSound =
        when (o.getString("kind")) {
          "cry" -> Cry(o.getInt("pokemonId"))
          else -> Ringtone(o.getString("uri"))
        }
  }
}
