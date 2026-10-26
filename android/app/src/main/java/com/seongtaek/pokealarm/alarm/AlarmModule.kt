package com.seongtaek.pokealarm.alarm

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.database.Cursor
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import androidx.core.app.NotificationManagerCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import java.util.concurrent.Executors

/** JS entry point to the native alarm engine. See src/native/AlarmModule.ts. */
class AlarmModule(private val context: ReactApplicationContext) :
    ReactContextBaseJavaModule(context) {
  private val io = Executors.newSingleThreadExecutor()
  private var preview: MediaPlayer? = null

  private val onRingingChanged: (RingingState.Ringing?) -> Unit = { ringing ->
    if (context.hasActiveReactInstance()) {
      context.emitDeviceEvent(EVENT_RINGING_CHANGED, ringing?.let { ringingMap(it) })
    }
  }

  init {
    RingingState.addListener(onRingingChanged)
  }

  override fun getName(): String = NAME

  override fun invalidate() {
    RingingState.removeListener(onRingingChanged)
    stopPreviewPlayer()
    io.shutdown()
    super.invalidate()
  }

  /** Replaces the whole alarm list and reschedules it. */
  @ReactMethod
  fun setAlarms(json: String, promise: Promise) {
    runCatching {
      val previousIds = AlarmStore.load(context).map { it.id }
      AlarmStore.save(context, json)
      AlarmScheduler.rescheduleAll(context, previousIds)
    }
        .onSuccess { promise.resolve(null) }
        .onFailure { promise.reject("E_ALARMS", it) }
  }

  /** The native list, which can differ from JS after a one-time alarm rang and turned itself off. */
  @ReactMethod
  fun getAlarms(promise: Promise) {
    promise.resolve(AlarmStore.loadJson(context))
  }

  @ReactMethod
  fun getRinging(promise: Promise) {
    promise.resolve(RingingState.current?.let { ringingMap(it) })
  }

  @ReactMethod
  fun dismiss(promise: Promise) {
    AlarmService.dismiss(context)
    promise.resolve(null)
  }

  @ReactMethod
  fun downloadCry(pokemonId: Double, promise: Promise) {
    io.execute {
      runCatching { CryCache.ensure(context, pokemonId.toInt()) }
          .onSuccess { promise.resolve(it.absolutePath) }
          .onFailure { promise.reject("E_CRY", it) }
    }
  }

  @ReactMethod
  fun listRingtones(promise: Promise) {
    runCatching {
      val result = Arguments.createArray()
      val seen = mutableSetOf<String>()
      for ((type, group) in
          listOf(RingtoneManager.TYPE_ALARM to "alarm", RingtoneManager.TYPE_RINGTONE to "ringtone")) {
        val manager = RingtoneManager(context).apply { setType(type) }
        val cursor: Cursor = manager.cursor
        while (cursor.moveToNext()) {
          val uri = manager.getRingtoneUri(cursor.position).toString()
          if (!seen.add(uri)) continue
          result.pushMap(
              Arguments.createMap().apply {
                putString("uri", uri)
                putString("title", cursor.getString(RingtoneManager.TITLE_COLUMN_INDEX))
                putString("group", group)
              })
        }
      }
      result
    }
        .onSuccess { promise.resolve(it) }
        .onFailure { promise.reject("E_RINGTONES", it) }
  }

  /** Plays a sound once (cry) or looping (ringtone) at media volume, for the sound picker. */
  @ReactMethod
  fun previewSound(kind: String, value: String, promise: Promise) {
    stopPreviewPlayer()
    io.execute {
      runCatching {
        val uri =
            if (kind == "cry") {
              val id = value.toInt()
              val cached = CryCache.file(context, id)
              if (cached.exists()) Uri.fromFile(cached) else Uri.parse(CryCache.remoteUrl(id))
            } else {
              Uri.parse(value)
            }
        MediaPlayer().apply {
          setAudioAttributes(
              AudioAttributes.Builder()
                  .setUsage(AudioAttributes.USAGE_MEDIA)
                  .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                  .build())
          setDataSource(context, uri)
          isLooping = kind != "cry"
          prepare()
          start()
        }
      }
          .onSuccess {
            preview = it
            promise.resolve(null)
          }
          .onFailure { promise.reject("E_PREVIEW", it) }
    }
  }

  @ReactMethod
  fun stopPreview(promise: Promise) {
    stopPreviewPlayer()
    promise.resolve(null)
  }

  @ReactMethod
  fun getPermissionStatus(promise: Promise) {
    val notifications = NotificationManagerCompat.from(context).areNotificationsEnabled()
    val fullScreen =
        Build.VERSION.SDK_INT < 34 ||
            (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
                .canUseFullScreenIntent()
    val battery =
        (context.getSystemService(Context.POWER_SERVICE) as PowerManager)
            .isIgnoringBatteryOptimizations(context.packageName)
    promise.resolve(
        Arguments.createMap().apply {
          putBoolean("notifications", notifications)
          putBoolean("exactAlarm", AlarmScheduler.canScheduleExact(context))
          putBoolean("fullScreen", fullScreen)
          putBoolean("batteryOptimizationIgnored", battery)
        })
  }

  /** Opens the system settings page for one permission: notifications, exactAlarm, fullScreen, battery. */
  @ReactMethod
  fun openSettings(kind: String, promise: Promise) {
    val packageUri = Uri.parse("package:${context.packageName}")
    val intent =
        when {
          kind == "exactAlarm" && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ->
              Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, packageUri)
          kind == "fullScreen" && Build.VERSION.SDK_INT >= 34 ->
              Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, packageUri)
          kind == "battery" -> Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
          else ->
              Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                  .putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
        }
    runCatching { context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) }
        .onSuccess { promise.resolve(null) }
        .onFailure { promise.reject("E_SETTINGS", it) }
  }

  private fun stopPreviewPlayer() {
    preview?.run {
      runCatching { stop() }
      release()
    }
    preview = null
  }

  private fun ringingMap(ringing: RingingState.Ringing): WritableMap =
      Arguments.createMap().apply {
        putString("alarmId", ringing.alarmId)
        putInt("attempt", ringing.attempt)
      }

  companion object {
    const val NAME = "AlarmModule"
    const val EVENT_RINGING_CHANGED = "alarmRingingChanged"
  }
}
