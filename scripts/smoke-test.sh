#!/usr/bin/env bash
# Installs the APK on a running emulator, opens the app, and fails if it crashes.
# The full logcat is saved to smoke-logcat.txt.
set -u
APK="$1"
PACKAGE=com.seongtaek.pokealarm

adb install -r "$APK"
adb logcat -c
adb shell monkey -p "$PACKAGE" -c android.intent.category.LAUNCHER 1
sleep 25

adb logcat -d > smoke-logcat.txt
echo "----- errors -----"
grep -E "FATAL EXCEPTION|AndroidRuntime|ReactNativeJS|E/ReactNative|SoLoader|UnsatisfiedLink" smoke-logcat.txt | head -200

if grep -q "FATAL EXCEPTION" smoke-logcat.txt; then
  echo "App crashed"
  exit 1
fi
if ! adb shell pidof "$PACKAGE" > /dev/null; then
  echo "App is not running"
  exit 1
fi
echo "App is running"
