#!/usr/bin/env bash
set -e

# ============================================================
# Запуск Metro + прогрев бандла + открытие на Android-эмуляторе.
# Решает проблему "Failed to download remote update" при первом
# запуске — Metro собирает бандл ЛЕНИВО, по первому запросу, и
# именно этот первый запрос может не успеть уложиться в таймаут
# Expo Go. Этот скрипт форсирует сборку ДО открытия приложения.
#
# Запуск: bash dev-android.sh или через npm run android
# ============================================================

echo "=== Проверяем, запущен ли эмулятор ==="
if ! adb devices | grep -q "device$"; then
  echo "Эмулятор не найден, запускаем MYD_app_phone..."
  emulator -avd MYD_app_phone > /dev/null 2>&1 &
  adb wait-for-device
  echo "Загрузка системы Android..."
  until [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do
    sleep 1
  done
  echo "Эмулятор загружен."
else
  echo "Эмулятор уже запущен."
fi

echo -e "\n=== Запуск Metro в фоне ==="
npx expo start --go &
METRO_PID=$!

# Останавливаем Metro вместе со скриптом при Ctrl+C
trap "kill $METRO_PID 2>/dev/null" EXIT

echo -e "\n=== Запуск dev-сервера ==="
until curl -s http://localhost:8081/status > /dev/null 2>&1; do
  sleep 1
done
echo "Dev-сервер запущен."

echo -e "\n=== Прогреваем бандл (первая компиляция, может занять до минуты) ==="
curl -s "http://localhost:8081/index.bundle?platform=android&dev=true&minify=false" -o /dev/null
echo "Бандл собран и закеширован в памяти Metro."

echo -e "\n=== Проброс порта 8081 на эмулятор ==="
adb reverse tcp:8081 tcp:8081

echo -e "\n=== Открываем приложение на эмуляторе ==="
adb shell am start -a android.intent.action.VIEW -d "exp://localhost:8081"

echo -e "\n=== Готово! ==="
echo "Metro продолжает работать — Ctrl+C для остановки."

wait $METRO_PID