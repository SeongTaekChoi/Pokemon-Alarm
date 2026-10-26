package com.seongtaek.pokealarm.alarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import com.seongtaek.pokealarm.MainActivity

object AlarmScheduler {
  /** How long an alarm rings before it stops on its own. */
  const val RING_DURATION_MS = 5 * 60 * 1000L

  /** Gap between an unanswered alarm ending and ringing again. */
  const val RETRY_DELAY_MS = 5 * 60 * 1000L

  /** Rings again at most this many times after the first ring. */
  const val MAX_RETRIES = 3

  const val EXTRA_ALARM_ID = "alarmId"
  const val EXTRA_ATTEMPT = "attempt"

  fun canScheduleExact(context: Context): Boolean =
      Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarmManager(context).canScheduleExactAlarms()

  /** Cancels everything for alarms that were removed, then schedules every enabled alarm. */
  fun rescheduleAll(context: Context, previousIds: Collection<String> = emptyList()) {
    val alarms = AlarmStore.load(context)
    val currentIds = alarms.map { it.id }.toSet()
    previousIds.filterNot { it in currentIds }.forEach { cancel(context, it) }
    alarms.forEach { schedule(context, it) }
  }

  fun schedule(context: Context, alarm: Alarm) {
    val at = alarm.nextTriggerMillis()
    if (at == null) {
      cancelMain(context, alarm.id)
      return
    }
    setAlarmClock(context, at, firePendingIntent(context, alarm.id, attempt = 0))
  }

  /** Schedules the "ring again" for an alarm nobody turned off. */
  fun scheduleRetry(context: Context, alarmId: String, attempt: Int) {
    val at = System.currentTimeMillis() + RETRY_DELAY_MS
    setAlarmClock(context, at, firePendingIntent(context, alarmId, attempt))
  }

  fun cancelRetry(context: Context, alarmId: String) {
    alarmManager(context).cancel(firePendingIntent(context, alarmId, attempt = 1))
  }

  fun cancel(context: Context, alarmId: String) {
    cancelMain(context, alarmId)
    cancelRetry(context, alarmId)
  }

  private fun cancelMain(context: Context, alarmId: String) {
    alarmManager(context).cancel(firePendingIntent(context, alarmId, attempt = 0))
  }

  private fun setAlarmClock(context: Context, at: Long, operation: PendingIntent) {
    val manager = alarmManager(context)
    if (canScheduleExact(context)) {
      // setAlarmClock is exempt from Doze and shows the alarm icon in the status bar.
      manager.setAlarmClock(AlarmManager.AlarmClockInfo(at, showPendingIntent(context)), operation)
    } else {
      // Without exact-alarm access this is the closest we can get; the permissions screen asks
      // the user to turn it on.
      manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, operation)
    }
  }

  /**
   * The first ring and the retries use two request codes, so that scheduling a repeating alarm's
   * next day does not replace a pending retry. The attempt number travels in the extras.
   */
  private fun firePendingIntent(context: Context, alarmId: String, attempt: Int): PendingIntent {
    val intent =
        Intent(context, AlarmReceiver::class.java)
            .setAction(AlarmReceiver.ACTION_FIRE)
            .putExtra(EXTRA_ALARM_ID, alarmId)
            .putExtra(EXTRA_ATTEMPT, attempt)
    val requestCode = alarmId.hashCode() * 2 + if (attempt == 0) 0 else 1
    return PendingIntent.getBroadcast(
        context,
        requestCode,
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
  }

  private fun showPendingIntent(context: Context): PendingIntent =
      PendingIntent.getActivity(
          context,
          0,
          Intent(context, MainActivity::class.java),
          PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )

  private fun alarmManager(context: Context) =
      context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
}
