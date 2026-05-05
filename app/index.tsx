import { Stack } from 'expo-router';
import { MoonStarIcon, SunIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

// ─── Types ───────────────────────────────────────────────────────────────────

type Condition = 'sunny' | 'rain' | 'cloudy' | 'partly-cloudy';

interface DayData {
  label: string;
  condition: Condition;
  temp: number;
  min: number;
  max: number;
  humidity: string;
  pressure: string;
  wind: string;
  timeline: { t: string; v: number }[];
}

// ─── Data ────────────────────────────────────────────────────────────────────

const DAYS: DayData[] = [
  {
    label: '4/21',
    condition: 'cloudy',
    temp: 22,
    min: 17,
    max: 24,
    humidity: '65%',
    pressure: '1010 hPa',
    wind: '1.4 m/s',
    timeline: [
      { t: '9', v: 18 },
      { t: '12', v: 21 },
      { t: 'NOW', v: 22 },
      { t: '18', v: 20 },
      { t: '21', v: 18 },
    ],
  },
  {
    label: '4/22',
    condition: 'sunny',
    temp: 25,
    min: 21,
    max: 27,
    humidity: '58%',
    pressure: '1006 hPa',
    wind: '0.8 m/s',
    timeline: [
      { t: '9', v: 22 },
      { t: '12', v: 24 },
      { t: 'NOW', v: 25 },
      { t: '18', v: 23 },
      { t: '21', v: 21 },
    ],
  },
  {
    label: '4/23',
    condition: 'rain',
    temp: 21,
    min: 16,
    max: 22,
    humidity: '88%',
    pressure: '985 hPa',
    wind: '2.2 m/s',
    timeline: [
      { t: '9', v: 17 },
      { t: '12', v: 20 },
      { t: 'NOW', v: 21 },
      { t: '18', v: 18 },
      { t: '21', v: 16 },
    ],
  },
  {
    label: '4/24',
    condition: 'partly-cloudy',
    temp: 16,
    min: 13,
    max: 18,
    humidity: '78%',
    pressure: '1056 hPa',
    wind: '2.3 m/s',
    timeline: [
      { t: '9', v: 14 },
      { t: '12', v: 16 },
      { t: 'NOW', v: 16 },
      { t: '18', v: 15 },
      { t: '21', v: 13 },
    ],
  },
  {
    label: '4/25',
    condition: 'sunny',
    temp: 28,
    min: 22,
    max: 30,
    humidity: '45%',
    pressure: '1012 hPa',
    wind: '0.5 m/s',
    timeline: [
      { t: '9', v: 24 },
      { t: '12', v: 27 },
      { t: 'NOW', v: 28 },
      { t: '18', v: 26 },
      { t: '21', v: 22 },
    ],
  },
];

const CONDITION_LABELS: Record<Condition, string> = {
  sunny: 'SOLEADO',
  rain: 'LLUVIA',
  cloudy: 'NUBLADO',
  'partly-cloudy': 'PARCIALMENTE NUBLADO',
};

// ─── Weather Icons ────────────────────────────────────────────────────────────

function WeatherIcon({ condition }: { condition: Condition }) {
  if (condition === 'sunny' || condition === 'cloudy') {
    return <View testID={`icon-${condition}`} style={styles.iconCircle} />;
  }
  if (condition === 'rain') {
    return (
      <View testID="icon-rain" style={styles.iconRainContainer}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.rainBar} />
        ))}
      </View>
    );
  }
  if (condition === 'partly-cloudy') {
    return (
      <View testID="icon-partly-cloudy" style={styles.iconPartlyContainer}>
        <View style={styles.partlyArc1} />
        <View style={styles.partlyArc2} />
      </View>
    );
  }
  return null;
}

// ─── Theme Toggle ─────────────────────────────────────────────────────────────

function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const TheIcon = colorScheme === 'dark' ? MoonStarIcon : SunIcon;
  return (
    <Button
      onPressIn={toggleColorScheme}
      size="icon"
      variant="ghost"
      className="ios:size-9 rounded-full web:mx-4">
      <Icon as={TheIcon} className="size-5" />
    </Button>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function Screen() {
  const [currentIdx, setCurrentIdx] = React.useState(1);
  const day = DAYS[currentIdx];

  return (
    <>
      <Stack.Screen
        options={{ title: '', headerTransparent: true, headerRight: () => <ThemeToggle /> }}
      />

      <ScrollView contentContainerStyle={styles.container} testID="weather-screen">
        {/* Navegación por días */}
        <View style={styles.navRow}>
          <TouchableOpacity
            testID="btn-prev"
            onPress={() => setCurrentIdx((i) => Math.max(0, i - 1))}
            disabled={currentIdx === 0}
            style={[styles.navBtn, currentIdx === 0 && styles.navBtnDisabled]}>
            <Text style={styles.navArrow}>‹</Text>
          </TouchableOpacity>

          <View style={styles.daysRow}>
            {DAYS.map((d, i) => (
              <Pressable key={d.label} testID={`nav-day-${i}`} onPress={() => setCurrentIdx(i)}>
                <Text style={[styles.dayLabel, i === currentIdx && styles.dayLabelActive]}>
                  {d.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <TouchableOpacity
            testID="btn-next"
            onPress={() => setCurrentIdx((i) => Math.min(DAYS.length - 1, i + 1))}
            disabled={currentIdx === DAYS.length - 1}
            style={[styles.navBtn, currentIdx === DAYS.length - 1 && styles.navBtnDisabled]}>
            <Text style={styles.navArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Ciudad */}
        <Text testID="city-name" style={styles.cityName}>
          TOKYO
        </Text>

        {/* Ícono */}
        <View testID="weather-icon-container" style={styles.iconContainer}>
          <WeatherIcon condition={day.condition} />
        </View>

        {/* Condición */}
        <Text testID="condition-label" style={styles.conditionLabel}>
          {CONDITION_LABELS[day.condition]}
        </Text>

        {/* Métricas secundarias */}
        <View testID="metrics-container" style={styles.metricsContainer}>
          <View testID="metric-humidity" style={styles.metricRow}>
            <Text style={styles.metricSymbol}>💧</Text>
            <Text style={styles.metricLabel}>Humedad</Text>
            <Text style={styles.metricValue}>{day.humidity}</Text>
          </View>
          <View testID="metric-pressure" style={styles.metricRow}>
            <Text style={styles.metricSymbol}>🌀</Text>
            <Text style={styles.metricLabel}>Presión</Text>
            <Text style={styles.metricValue}>{day.pressure}</Text>
          </View>
          <View testID="metric-wind" style={styles.metricRow}>
            <Text style={styles.metricSymbol}>💨</Text>
            <Text style={styles.metricLabel}>Viento</Text>
            <Text style={styles.metricValue}>{day.wind}</Text>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.tempSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} testID="temp-timeline">
            {day.timeline.map((tick) => {
              const isNow = tick.t === 'NOW';
              return (
                <View
                  key={tick.t}
                  testID={isNow ? 'temp-tick-now' : `temp-tick-${tick.t}`}
                  style={styles.tickCol}>
                  <Text style={[styles.tickTime, isNow && styles.tickTimeNow]}>{tick.t}</Text>
                  <Text style={[styles.tickTemp, isNow && styles.tickTempNow]}>{tick.v}°</Text>
                  <View style={[styles.tickBar, isNow && styles.tickBarNow]} />
                </View>
              );
            })}
          </ScrollView>

          {/* Min / Ahora / Max */}
          <View testID="minmax-container" style={styles.minMaxRow}>
            <View style={styles.minMaxItem}>
              <Text style={styles.minMaxLabel}>MIN</Text>
              <Text testID="temp-min" style={styles.minMaxValue}>
                {day.min}°
              </Text>
            </View>
            <View testID="temp-current" style={styles.minMaxItem}>
              <Text style={styles.minMaxLabel}>AHORA</Text>
              <Text style={styles.tempCurrent}>{day.temp}°</Text>
            </View>
            <View style={styles.minMaxItem}>
              <Text style={styles.minMaxLabel}>MAX</Text>
              <Text testID="temp-max" style={styles.minMaxValue}>
                {day.max}°
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 100,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 28,
  },
  daysRow: { flexDirection: 'row', gap: 4 },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: { opacity: 0.25 },
  navArrow: { fontSize: 22, color: '#555', lineHeight: 24 },
  dayLabel: { fontSize: 12, color: '#aaa', paddingHorizontal: 5, paddingVertical: 4 },
  dayLabelActive: {
    color: '#111',
    fontWeight: '600',
    borderBottomWidth: 1.5,
    borderBottomColor: '#111',
  },
  cityName: {
    fontSize: 26,
    fontWeight: '600',
    letterSpacing: 4,
    textAlign: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 7,
    borderColor: '#111',
    backgroundColor: 'transparent',
  },
  iconRainContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transform: [{ rotate: '15deg' }],
  },
  rainBar: { width: 8, height: 78, borderRadius: 4, backgroundColor: '#111' },
  iconPartlyContainer: { width: 100, height: 90, position: 'relative' },
  partlyArc1: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 7,
    borderColor: '#111',
    backgroundColor: 'transparent',
    top: 0,
    left: 0,
  },
  partlyArc2: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 7,
    borderColor: '#111',
    backgroundColor: 'transparent',
    top: 16,
    right: 0,
  },
  conditionLabel: { fontSize: 11, letterSpacing: 2, color: '#888', marginBottom: 28 },
  metricsContainer: { width: '100%', gap: 12, marginBottom: 32 },
  metricRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metricSymbol: { fontSize: 14, width: 22, textAlign: 'center' },
  metricLabel: { flex: 1, fontSize: 13, color: '#888' },
  metricValue: { fontSize: 13, fontWeight: '500' },
  tempSection: { width: '100%', borderTopWidth: 0.5, borderTopColor: '#e0e0e0', paddingTop: 16 },
  tickCol: { alignItems: 'center', gap: 4, minWidth: 44, marginRight: 4 },
  tickTime: { fontSize: 10, color: '#aaa' },
  tickTimeNow: { color: '#111', fontWeight: '600' },
  tickTemp: { fontSize: 13, color: '#888' },
  tickTempNow: { color: '#111', fontWeight: '500' },
  tickBar: { width: 1, height: 16, backgroundColor: '#ddd' },
  tickBarNow: { backgroundColor: '#111', width: 2 },
  minMaxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  minMaxItem: { alignItems: 'center', gap: 2 },
  minMaxLabel: { fontSize: 10, color: '#aaa', letterSpacing: 1 },
  minMaxValue: { fontSize: 20, fontWeight: '300' },
  tempCurrent: { fontSize: 30, fontWeight: '200' },
});
