package com.seongtaek.pokealarm.alarm

import android.content.Context
import java.io.File
import java.net.HttpURLConnection
import java.net.URI

/**
 * Pokémon cries come from PokeAPI. They are downloaded when an alarm is saved, because the alarm
 * has to ring even when the phone is offline. They are never bundled into the repository.
 */
object CryCache {
  private const val BASE_URL = "https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/"

  fun remoteUrl(pokemonId: Int): String = "$BASE_URL$pokemonId.ogg"

  fun file(context: Context, pokemonId: Int): File = File(File(context.filesDir, "cries"), "$pokemonId.ogg")

  /** Blocking. Returns the cached file, downloading it first when needed. */
  fun ensure(context: Context, pokemonId: Int): File {
    val target = file(context, pokemonId)
    if (target.exists() && target.length() > 0) return target
    target.parentFile?.mkdirs()
    val connection = URI(remoteUrl(pokemonId)).toURL().openConnection() as HttpURLConnection
    try {
      connection.connectTimeout = 10_000
      connection.readTimeout = 15_000
      if (connection.responseCode != HttpURLConnection.HTTP_OK) {
        throw IllegalStateException("Cry $pokemonId: HTTP ${connection.responseCode}")
      }
      val partial = File(target.parentFile, "${target.name}.part")
      connection.inputStream.use { input -> partial.outputStream().use { input.copyTo(it) } }
      if (!partial.renameTo(target)) throw IllegalStateException("Cry $pokemonId: could not save")
    } finally {
      connection.disconnect()
    }
    return target
  }
}
