package com.seongtaek.pokealarm.alarm

/** What is ringing right now, shared by the service, the ringing activity and the JS module. */
object RingingState {
  data class Ringing(val alarmId: String, val attempt: Int)

  @Volatile
  var current: Ringing? = null
    private set

  private val listeners = mutableSetOf<(Ringing?) -> Unit>()

  fun set(value: Ringing?) {
    current = value
    synchronized(listeners) { listeners.toList() }.forEach { it(value) }
  }

  fun addListener(listener: (Ringing?) -> Unit) {
    synchronized(listeners) { listeners.add(listener) }
  }

  fun removeListener(listener: (Ringing?) -> Unit) {
    synchronized(listeners) { listeners.remove(listener) }
  }
}
