package com.seongtaek.pokealarm.alarm

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat

/**
 * Rings one alarm: plays the sound, vibrates, and shows the full-screen notification that opens
 * [AlarmActivity] over the lock screen. It stops after [AlarmScheduler.RING_DURATION_MS], and when
 * nobody pressed "끄기" it schedules a retry, at most [AlarmScheduler.MAX_RETRIES] times.
 */
class AlarmService : Service() {
  private val handler = Handler(Looper.getMainLooper())
  private var player: MediaPlayer? = null
  private var wakeLock: PowerManager.WakeLock? = null
  private var alarm: Alarm? = null
  private var attempt = 0

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    when (intent?.action) {
      ACTION_START -> {
        val id = intent.getStringExtra(AlarmScheduler.EXTRA_ALARM_ID)
        val next = id?.let { AlarmStore.find(this, it) }
        if (next == null) {
          stopSelf()
          return START_NOT_STICKY
        }
        // A second alarm firing mid-ring replaces the first. The first gets no retry.
        if (alarm != null) stopRinging()
        start(next, intent.getIntExtra(AlarmScheduler.EXTRA_ATTEMPT, 0))
      }
      ACTION_DISMISS -> finish(dismissed = true)
      else -> stopSelf()
    }
    return START_NOT_STICKY
  }

  override fun onDestroy() {
    stopRinging()
    super.onDestroy()
  }

  private fun start(next: Alarm, nextAttempt: Int) {
    alarm = next
    attempt = nextAttempt
    ServiceCompat.startForeground(
        this,
        NOTIFICATION_ID,
        buildNotification(next),
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
          ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
        } else {
          0
        },
    )
    wakeLock =
        (getSystemService(Context.POWER_SERVICE) as PowerManager)
            .newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "PokeAlarm:ring")
            .apply { acquire(AlarmScheduler.RING_DURATION_MS + 60_000L) }

    playSound(next)
    if (next.vibrate) startVibration()
    handler.postDelayed({ finish(dismissed = false) }, AlarmScheduler.RING_DURATION_MS)
    RingingState.set(RingingState.Ringing(next.id, nextAttempt))
  }

  private fun finish(dismissed: Boolean) {
    val ringing = alarm
    if (ringing != null) {
      if (dismissed) {
        AlarmScheduler.cancelRetry(this, ringing.id)
      } else if (ringing.autoRepeat && attempt < AlarmScheduler.MAX_RETRIES) {
        AlarmScheduler.scheduleRetry(this, ringing.id, attempt + 1)
      }
    }
    stopRinging()
    ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE)
    stopSelf()
  }

  private fun stopRinging() {
    handler.removeCallbacksAndMessages(null)
    player?.run {
      runCatching { stop() }
      release()
    }
    player = null
    vibrator().cancel()
    wakeLock?.takeIf { it.isHeld }?.release()
    wakeLock = null
    alarm = null
    RingingState.set(null)
  }

  private fun playSound(alarm: Alarm) {
    val isCry = alarm.sound is AlarmSound.Cry
    val uri = soundUri(alarm.sound)
    val mediaPlayer =
        runCatching { createPlayer(uri) }.getOrNull()
            ?: createPlayer(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM))
    player = mediaPlayer

    if (isCry) {
      // A cry lasts 1-2 seconds, so repeat it with a short pause instead of looping it back to back.
      mediaPlayer.setOnCompletionListener {
        handler.postDelayed({ player?.run { seekTo(0); start() } }, CRY_GAP_MS)
      }
    } else {
      mediaPlayer.isLooping = true
    }

    if (alarm.volumeRamp) {
      rampVolume(step = 0)
    } else {
      mediaPlayer.setVolume(1f, 1f)
    }
    mediaPlayer.start()
  }

  private fun rampVolume(step: Int) {
    val volume = RAMP_START + (1f - RAMP_START) * step / RAMP_STEPS
    player?.setVolume(volume, volume)
    if (step < RAMP_STEPS) {
      handler.postDelayed({ rampVolume(step + 1) }, RAMP_DURATION_MS / RAMP_STEPS)
    }
  }

  private fun createPlayer(uri: Uri): MediaPlayer =
      MediaPlayer().apply {
        setAudioAttributes(
            AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build())
        setDataSource(this@AlarmService, uri)
        prepare()
      }

  private fun soundUri(sound: AlarmSound): Uri =
      when (sound) {
        is AlarmSound.Cry -> {
          val file = CryCache.file(this, sound.pokemonId)
          if (file.exists()) Uri.fromFile(file)
          else RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
        }
        is AlarmSound.Ringtone -> Uri.parse(sound.uri)
      }

  private fun startVibration() {
    val pattern = longArrayOf(0, 800, 800)
    vibrator().vibrate(VibrationEffect.createWaveform(pattern, 0))
  }

  private fun vibrator(): Vibrator =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        (getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager).defaultVibrator
      } else {
        @Suppress("DEPRECATION")
        getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
      }

  private fun buildNotification(alarm: Alarm): Notification {
    val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    manager.createNotificationChannel(
        NotificationChannel(CHANNEL_ID, "알람", NotificationManager.IMPORTANCE_HIGH).apply {
          description = "알람이 울릴 때 표시됩니다"
          // The service plays sound and vibrates on its own.
          setSound(null, null)
          enableVibration(false)
          lockscreenVisibility = Notification.VISIBILITY_PUBLIC
        })

    val fullScreen =
        PendingIntent.getActivity(
            this,
            0,
            Intent(this, AlarmActivity::class.java)
                .putExtra(AlarmScheduler.EXTRA_ALARM_ID, alarm.id)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_NO_USER_ACTION),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    val dismiss =
        PendingIntent.getService(
            this,
            1,
            Intent(this, AlarmService::class.java).setAction(ACTION_DISMISS),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

    return NotificationCompat.Builder(this, CHANNEL_ID)
        .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
        .setContentTitle(alarm.label.ifEmpty { "포켓몬 알람" })
        .setContentText(String.format("%02d:%02d", alarm.hour, alarm.minute))
        .setCategory(NotificationCompat.CATEGORY_ALARM)
        .setPriority(NotificationCompat.PRIORITY_MAX)
        .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
        .setOngoing(true)
        .setFullScreenIntent(fullScreen, true)
        .setContentIntent(fullScreen)
        .addAction(0, "끄기", dismiss)
        .build()
  }

  companion object {
    const val ACTION_START = "com.seongtaek.pokealarm.START"
    const val ACTION_DISMISS = "com.seongtaek.pokealarm.DISMISS"
    private const val CHANNEL_ID = "alarm_ring"
    private const val NOTIFICATION_ID = 1001
    private const val CRY_GAP_MS = 1200L
    private const val RAMP_START = 0.15f
    private const val RAMP_STEPS = 20
    private const val RAMP_DURATION_MS = 60_000L

    fun dismiss(context: Context) {
      runCatching {
        context.startService(Intent(context, AlarmService::class.java).setAction(ACTION_DISMISS))
      }
    }
  }
}
