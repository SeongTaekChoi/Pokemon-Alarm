package com.seongtaek.pokealarm.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat

/** Receives the AlarmManager broadcast and hands off to [AlarmService], which does the ringing. */
class AlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != ACTION_FIRE) return
    val alarmId = intent.getStringExtra(AlarmScheduler.EXTRA_ALARM_ID) ?: return
    val attempt = intent.getIntExtra(AlarmScheduler.EXTRA_ATTEMPT, 0)
    val alarm = AlarmStore.find(context, alarmId) ?: return

    if (attempt == 0) {
      // Line up the next ring right away: next weekday for a repeating alarm, nothing for a
      // one-time alarm.
      if (alarm.isRepeating) AlarmScheduler.schedule(context, alarm)
      else AlarmStore.disable(context, alarm.id)
    }

    ContextCompat.startForegroundService(
        context,
        Intent(context, AlarmService::class.java)
            .setAction(AlarmService.ACTION_START)
            .putExtra(AlarmScheduler.EXTRA_ALARM_ID, alarmId)
            .putExtra(AlarmScheduler.EXTRA_ATTEMPT, attempt),
    )
  }

  companion object {
    const val ACTION_FIRE = "com.seongtaek.pokealarm.FIRE"
  }
}
