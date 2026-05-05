import { Stack } from 'expo-router';
import * as React from 'react';
import { Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui/text';

// ─── Helpers fechas ─────────────────────────────

const WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function getDays() {
  const today = new Date();
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(today.getDate() + i);

    return {
      label: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
      week: WEEK[d.getDay()],
    };
  });
}

// ─── Datos base (coherentes con BA) ─────────────

const BASE = getDays();

const DAYS = BASE.map((d, i) => {
  const data = [
    { temp: 21, cond: 'sunny' },
    { temp: 24, cond: 'sunny' },
    { temp: 22, cond: 'rain' },
    { temp: 20, cond: 'cloudy' },
    { temp: 16, cond: 'cloudy' },
    { temp: 18, cond: 'sunny' },
    { temp: 19, cond: 'cloudy' },
  ][i];

  return {
    ...d,
    ...data,
    humidity: `${60 + i * 2}%`,
    pressure: `${1010 + i} hPa`,
    wind: `${2 + i * 0.5} m/s`,
    timeline: [
      { t: '9', v: data.temp - 4 },
      { t: '12', v: data.temp - 1 },
      { t: 'NOW', v: data.temp },
      { t: '18', v: data.temp - 2 },
      { t: '21', v: data.temp - 5 },
    ],
  };
});

// ─── ICONOS (más fieles al diseño) ─────────────

function WeatherIcon({ condition }: any) {
  if (condition === 'sunny') {
    return <View style={styles.sun} />;
  }

  if (condition === 'rain') {
    return (
      <View style={styles.rainContainer}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.rainBar} />
        ))}
      </View>
    );
  }

  if (condition === 'cloudy') {
    return (
      <View style={styles.cloudContainer}>
        <View style={styles.cloudBig} />
        <View style={styles.cloudSmall} />
      </View>
    );
  }

  return null;
}

// ─── Screen ───────────────────────────────────

export default function Screen() {
  const [idx, setIdx] = React.useState(0);
  const day = DAYS[idx];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={styles.container}>
        {/* NAV */}
        <View style={styles.nav}>
          <TouchableOpacity onPress={() => setIdx((i) => Math.max(0, i - 1))}>
            <Text style={styles.arrow}>‹</Text>
          </TouchableOpacity>

          <View style={styles.days}>
            {DAYS.map((d, i) => (
              <Pressable key={i} onPress={() => setIdx(i)}>
                <View style={styles.dayBlock}>
                  <Text style={[styles.day, i === idx && styles.active]}>{d.label}</Text>
                  <Text style={styles.week}>{d.week}</Text>
                </View>
              </Pressable>
            ))}
          </View>

          <TouchableOpacity onPress={() => setIdx((i) => Math.min(DAYS.length - 1, i + 1))}>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* CITY */}
        <Text style={styles.city}>BUENOS AIRES</Text>

        {/* ICON */}
        <View style={styles.iconBox}>
          <WeatherIcon condition={day.cond} />
        </View>

        {/* METRICS */}
        <View style={styles.metrics}>
          <Text style={styles.metric}>💧 {day.humidity}</Text>
          <Text style={styles.metric}>🌀 {day.pressure}</Text>
          <Text style={styles.metric}>💨 {day.wind}</Text>
        </View>

        {/* TIMELINE */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {day.timeline.map((t: any) => {
            const now = t.t === 'NOW';
            return (
              <View key={t.t} style={styles.tick}>
                <Text style={[styles.tickTime, now && styles.now]}>{t.t}</Text>
                <Text style={[styles.tickTemp, now && styles.now]}>{t.v}°</Text>
                <View style={[styles.line, now && styles.lineNow]} />
              </View>
            );
          })}
        </ScrollView>

        {/* SOLO temperatura central */}
        <Text style={styles.temp}>{day.temp}°</Text>
      </ScrollView>
    </>
  );
}

// ─── Styles ───────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 140,
    paddingHorizontal: 32,
    backgroundColor: '#fff',
  },

  nav: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },

  days: { flexDirection: 'row', gap: 12 },

  dayBlock: { alignItems: 'center' },

  day: { fontSize: 12, color: '#bbb' },

  active: {
    color: '#000',
    borderBottomWidth: 2,
  },

  week: { fontSize: 10, color: '#aaa' },

  arrow: { fontSize: 22, color: '#555' },

  city: {
    fontSize: 26,
    letterSpacing: 6,
    color: '#000', // 🔥 FIX
    marginBottom: 40,
  },

  iconBox: {
    height: 140,
    justifyContent: 'center',
    marginBottom: 20,
  },

  sun: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 7,
    borderColor: '#000',
  },

  rainContainer: {
    flexDirection: 'row',
    gap: 8,
    transform: [{ rotate: '15deg' }],
  },

  rainBar: {
    width: 8,
    height: 80,
    backgroundColor: '#000',
    borderRadius: 4,
  },

  cloudContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },

  cloudBig: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 7,
    borderColor: '#000',
  },

  cloudSmall: {
    width: 55,
    height: 55,
    borderRadius: 27,
    borderWidth: 7,
    borderColor: '#000',
    marginLeft: -25,
    marginBottom: 10,
  },

  metrics: {
    width: '100%',
    gap: 10,
    marginBottom: 30,
  },

  metric: {
    fontSize: 12,
    color: '#666',
  },

  tick: {
    alignItems: 'center',
    marginRight: 14,
  },

  tickTime: { fontSize: 10, color: '#aaa' },
  tickTemp: { fontSize: 13, color: '#888' },

  now: { color: '#000', fontWeight: '600' },

  line: {
    width: 1,
    height: 12,
    backgroundColor: '#ccc',
  },

  lineNow: {
    width: 2,
    backgroundColor: '#000',
  },

  temp: {
    fontSize: 48,
    fontWeight: '200',
    marginTop: 30,
  },
});
