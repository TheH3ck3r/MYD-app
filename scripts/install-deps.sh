#!/usr/bin/env bash
set -e

# ============================================================
# Установка зависимостей для приложения-трекера задач
# Стек: Expo + react-native-paper + expo-sqlite +
#       expo-file-system/expo-sharing + expo-notifications
# =============================

echo "=== 1. Expo-совместимые пакеты (через expo install) ==="
# expo install сам подбирает версии, совместимые с текущим Expo SDK

# expo-dev-client: НЕ обязателен для локальных уведомлений — они работают
# в обычном Expo Go начиная с SDK 53+. Нужен только если позже добавишь
# нативный код/модули, которых нет в стандартном Expo Go (custom native
# config, специфичные библиотеки и т.д.). Оставлен на будущее — можно
# убрать из списка ниже, если не планируешь выходить за рамки Expo Go.
npx expo install \
  expo-router \
  expo-sqlite \
  expo-file-system \
  expo-sharing \
  expo-document-picker \
  expo-notifications \
  expo-dev-client \
  expo-constants \
  expo-linking \
  expo-splash-screen \
  expo-status-bar \
  expo-system-ui \
  react-native-safe-area-context \
  react-native-screens \
  react-native-gesture-handler \
  react-native-reanimated \
  react-native-svg

echo "=== 2. UI и навигация ==="

npm install \
  react-native-paper \
  @expo/vector-icons \
  @react-navigation/native \
  @react-navigation/bottom-tabs \
  @react-navigation/elements

echo "=== 3. Утилиты (даты, стейт-менеджмент) ==="

npm install \
  dayjs \
  mobx \
  mobx-react

echo "=== 4. Dev-зависимости (TypeScript, линтер, форматирование) ==="

npm install --save-dev \
  typescript \
  @types/react \
  eslint \
  eslint-config-expo \
  eslint-config-prettier \
  eslint-plugin-prettier \
  eslint-plugin-react \
  eslint-plugin-react-hooks \
  eslint-plugin-react-native \
  eslint-plugin-simple-import-sort \
  prettier

echo "=== Готово! ==="