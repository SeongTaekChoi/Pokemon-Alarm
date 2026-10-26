package com.seongtaek.pokealarm.alarm

import android.content.Context
import org.json.JSONArray

/**
 * Native copy of the alarm list. It is the source of truth for scheduling, because alarms must be
 * rescheduled after a reboot when no JS is running.
 */
object AlarmStore {
  private const val PREFS = "poke_alarm"
  private const val KEY_ALARMS = "alarms"

  fun loadJson(context: Context): String =
      prefs(context).getString(KEY_ALARMS, null) ?: "[]"

  fun load(context: Context): List<Alarm> {
    val array = JSONArray(loadJson(context))
    return (0 until array.length()).mapNotNull {
      runCatching { Alarm.fromJson(array.getJSONObject(it)) }.getOrNull()
    }
  }

  fun find(context: Context, id: String): Alarm? = load(context).firstOrNull { it.id == id }

  fun save(context: Context, json: String) {
    JSONArray(json) // Reject malformed input before it replaces a good list.
    prefs(context).edit().putString(KEY_ALARMS, json).apply()
  }

  /** Turns off a one-time alarm once it has rung, so the list shows it as off. */
  fun disable(context: Context, id: String) {
    val array = JSONArray(loadJson(context))
    for (i in 0 until array.length()) {
      val o = array.getJSONObject(i)
      if (o.optString("id") == id) o.put("enabled", false)
    }
    prefs(context).edit().putString(KEY_ALARMS, array.toString()).apply()
  }

  private fun prefs(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
}
