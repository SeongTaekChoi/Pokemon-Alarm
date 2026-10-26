package com.seongtaek.pokealarm.alarm

import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

/**
 * Full-screen ringing screen, shown over the lock screen. It renders the `AlarmRinging` component
 * registered in index.js, and closes itself once the alarm stops ringing.
 */
class AlarmActivity : ReactActivity() {
  private val onRingingChanged: (RingingState.Ringing?) -> Unit = { ringing ->
    if (ringing == null) runOnUiThread { finish() }
  }

  override fun getMainComponentName(): String = "AlarmRinging"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      object : DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled) {
        override fun getLaunchOptions(): Bundle =
            Bundle().apply {
              putString("alarmId", intent.getStringExtra(AlarmScheduler.EXTRA_ALARM_ID))
            }
      }

  override fun onCreate(savedInstanceState: Bundle?) {
    showOverLockScreen()
    // react-native-screens: fragments must not be restored.
    super.onCreate(null)
    if (RingingState.current == null) {
      finish()
      return
    }
    RingingState.addListener(onRingingChanged)
  }

  override fun onDestroy() {
    RingingState.removeListener(onRingingChanged)
    super.onDestroy()
  }

  private fun showOverLockScreen() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true)
      setTurnScreenOn(true)
    } else {
      @Suppress("DEPRECATION")
      window.addFlags(
          WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
              WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON)
    }
    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
  }
}
