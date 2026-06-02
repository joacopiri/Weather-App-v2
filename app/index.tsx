import { Stack } from 'expo-router';
import * as React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { Sun, Cloud, CloudRain, Droplets, Wind, Gauge, CloudLightning } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { useQuery } from '@tanstack/react-query';

// ─── Configuración API ──────────────────────────
const API_KEY = 'ae713916ebe9498a9d8224315260505'; // 👈 Pon tu key aquí
const CITY = 'Buenos Aires';

async function fetchWeather() {
  const res = await fetch(
    `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${CITY}&days=7&aqi=no&alerts=no`
  );
  if (!res.ok) throw new Error('Error al obtener clima');
  return res.json();
}

// ─── Helpers ─────────────────────────────────────
const WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function WeatherIcon({ condition, size = 300, color = '#000' }: any) {
  const code = condition.toLowerCase();
  if (code.includes('sun') || code.includes('clear'))
    return <Sun size={size} color={color} strokeWidth={1.25} />;
  if (code.includes('rain') || code.includes('patchy'))
    return <CloudRain size={size} color={color} strokeWidth={1.25} />;
  if (code.includes('thunder'))
    return <CloudLightning size={size} color={color} strokeWidth={1.25} />;
  return <Cloud size={size} color={color} strokeWidth={1.25} />;
}

export default function WeatherScreen() {
  const [idx, setIdx] = React.useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ['weather'],
    queryFn: fetchWeather,
  });

  if (isLoading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  if (error)
    return (
      <View style={styles.center}>
        <Text>Error al cargar datos</Text>
      </View>
    );

  const forecastDays = data.forecast.forecastday;
  const currentDay = forecastDays[idx];

  // Formatear las horas para el timeline (filtramos cada 3 horas para que quepan)
  const timelineHours = currentDay.hour.filter((_: any, i: number) => i % 6 === 0);

  const rows = [];

  for (let i = 0; i < timelineHours.length; i += 4) {
    rows.push(timelineHours.slice(i, i + 4));
  }

  const splitRows = rows.map((row) => ({
    left: row.slice(0, 2),
    right: row.slice(2, 4),
  }));
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={styles.container}>
        {/* NAV - Días de la semana */}
        <View style={styles.nav}>
          <TouchableOpacity onPress={() => setIdx((i) => Math.max(0, i - 1))}>
            <Text style={styles.arrow}>‹</Text>
          </TouchableOpacity>

          <View style={styles.days}>
            {forecastDays.map((d: any, i: number) => {
              const date = new Date(d.date + 'T00:00:00');
              return (
                <Pressable key={d.date} onPress={() => setIdx(i)}>
                  <View style={styles.dayBlock}>
                    <Text style={[styles.day, i === idx && styles.active]}>
                      {String(date.getDate()).padStart(2, '0')}/
                      {String(date.getMonth() + 1).padStart(2, '0')}
                    </Text>
                    <Text style={styles.week}>{WEEK[date.getDay()]}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <TouchableOpacity onPress={() => setIdx((i) => Math.min(forecastDays.length - 1, i + 1))}>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* CIUDAD */}
        <Text style={styles.city}>{data.location.name.toUpperCase()}</Text>

        {/* ICONO DINÁMICO */}
        <View style={styles.iconBox}>
          <WeatherIcon condition={currentDay.day.condition.text} />
        </View>

        {/* MÉTRICAS REALES */}
        <View style={styles.metrics}>
          <View style={styles.metricRow}>
            <Droplets size={20} />
            <Text style={styles.metricText}>
              {currentDay.day.avghumidity}
              <Text style={{ fontSize: 12, fontWeight: '300' }}>%</Text>
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Gauge size={20} />
            <Text style={styles.metricText}>
              {currentDay.hour[0].pressure_mb}
              <Text style={{ fontSize: 12, fontWeight: '300' }}>hPa</Text>
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Wind size={20} />
            <Text style={styles.metricText}>
              {currentDay.day.maxwind_kph}
              <Text style={{ fontSize: 12, fontWeight: '300' }}>km/h</Text>
            </Text>
          </View>
        </View>

        <View style={styles.timelineWrapper}>
          {/* COLUMNA IZQUIERDA */}
          <View style={styles.column}>
            {splitRows.map((row, i) => (
              <View key={`l-${i}`} style={styles.block}>
                {row.left.map((h: any) => (
                  <View key={h.time} style={styles.tickBox}>
                    <Text style={styles.tickTemp}>
                      {Math.round(h.temp_c)}°
                    </Text>
                    <Text style={styles.tickTime}>
                      {h.time.split(' ')[1]}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>

          {/* CENTRO */}
          <View style={styles.centerTemp}>
            <Text style={styles.temp}>
              {Math.round(currentDay.day.avgtemp_c)}°
            </Text>
          </View>

          {/* COLUMNA DERECHA */}
          <View style={styles.column}>
            {splitRows.map((row, i) => (
              <View key={`r-${i}`} style={styles.block}>
                {row.right.map((h: any) => (
                  <View key={h.time} style={styles.tickBox}>
                    <Text style={styles.tickTemp}>
                      {Math.round(h.temp_c)}°
                    </Text>
                    <Text style={styles.tickTime}>
                      {h.time.split(' ')[1]}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>

        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 80,
    backgroundColor: '#fff',
  },
  nav: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  days: { flexDirection: 'row', gap: 100, justifyContent: 'space-between' },
  dayBlock: { alignItems: 'center' },
  day: { fontSize: 12, color: '#bbb' },
  active: { color: '#000', fontWeight: 'bold', borderBottomWidth: 1 },
  week: { fontSize: 10, color: '#aaa' },
  arrow: { fontSize: 30, color: '#000', paddingHorizontal: 10 },
  city: { fontSize: 22, letterSpacing: 5, fontWeight: '900', marginBottom: 20, color: 'black' },
  iconBox: { height: 300, justifyContent: 'center', marginVertical: 20 },
  metrics: { width: '100%', gap: 12, marginBottom: 40, paddingHorizontal: 32 },
  metricRow: { flexDirection: 'row', alignItems: 'center' },
  metricText: { fontSize: 18, marginLeft: 8, fontWeight: '700' },
  timelineScroll: { marginBottom: 20 },
  tick: { alignItems: 'center', marginRight: 25 },
  
  timelineWrapper: {flexDirection: 'row', width: '100%', alignItems: 'center'},
  column: {flex: 1},
  block: {flexDirection: 'row', justifyContent: 'center', gap: 5},
  tickBox: {alignItems: 'center', width: 50, paddingTop: 20},
  tickTemp: {fontSize: 20, color: '#111',fontWeight: '600'},
  tickTime: {fontSize: 12, color: '#666'},
  centerTemp: {width: 120, alignItems: 'center', justifyContent: 'center'},
  temp: {fontSize: 80, fontWeight: '400', color: '#000'}
});
