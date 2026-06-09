import { Stack } from 'expo-router';
import * as React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { Sun, Cloud, CloudRain, Droplets, Wind, Gauge, CloudLightning } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { useQuery } from '@tanstack/react-query';

// ─── Configuración API ──────────────────────────
const API_KEY = 'ae713916ebe9498a9d8224315260505';
const CITY = '-34.676,-58.473';

// Función para formatear fechas a YYYY-MM-DD sin problemas de zona horaria
function getFormattedDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function fetchWeather() {
  const today = new Date();

  // Restamos 1 día para obtener la fecha de ayer
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = getFormattedDate(yesterday);

  // 1. Traemos el historial de AYER
  const historyUrl = `https://api.weatherapi.com/v1/history.json?key=${API_KEY}&q=${CITY}&dt=${yesterdayStr}`;
  // 2. Traemos el pronóstico de HOY y MAÑANA (2 días)
  const forecastUrl = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${CITY}&days=2&aqi=no&alerts=no`;

  const [resHistory, resForecast] = await Promise.all([fetch(historyUrl), fetch(forecastUrl)]);

  if (!resHistory.ok || !resForecast.ok) throw new Error('Error al obtener clima');

  const historyData = await resHistory.json();
  const forecastData = await resForecast.json();

  // Consolidamos los 3 días en un único array de forecastday: [Ayer, Hoy, Mañana]
  const consolidatedForecast = [
    historyData.forecast.forecastday[0], // Ayer
    forecastData.forecast.forecastday[0], // Hoy
    forecastData.forecast.forecastday[1], // Mañana
  ];

  // Devolvemos la estructura armada para no romper el resto de tu app
  return {
    location: forecastData.location,
    forecast: {
      forecastday: consolidatedForecast,
    },
  };
}

// ─── Helpers ─────────────────────────────────────
const WEEK = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

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
  // Inicializamos en 1 por defecto porque el array consolidado siempre será [Ayer, Hoy, Mañana]
  const [idx, setIdx] = React.useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['weather'],
    queryFn: fetchWeather,
  });

  // Forzamos a que siempre se posicione en "Hoy" (índice 1) cuando la data llegue
  React.useEffect(() => {
    if (data?.forecast?.forecastday) {
      setIdx(1);
    }
  }, [data]);

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

  const forecastDays = data?.forecast.forecastday;
  if (!forecastDays) {
    return '';
  }
  const currentDay = forecastDays[idx];

  // Formatear las horas para el timeline (filtramos cada 6 horas para que entren bien)
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
        {/* NAV - Días de la semana unificados */}
        <View style={styles.nav}>
          {/* BOTÓN ANTERIOR (Flecha + Día de la izquierda) */}
          <TouchableOpacity
            style={[styles.navButton, idx === 0 && { opacity: 0.1 }]}
            disabled={idx === 0}
            onPress={() => setIdx((i) => Math.max(0, i - 1))}>
            <Text style={styles.arrow}>‹</Text>
            <View style={styles.sideDay}>
              {forecastDays[idx - 1] && (
                <>
                  <Text style={styles.day}>
                    {String(new Date(forecastDays[idx - 1].date + 'T00:00:00').getDate()).padStart(
                      2,
                      '0'
                    )}
                    /
                    {String(
                      new Date(forecastDays[idx - 1].date + 'T00:00:00').getMonth() + 1
                    ).padStart(2, '0')}
                  </Text>
                  <Text style={styles.week}>
                    {WEEK[(new Date(forecastDays[idx - 1].date + 'T00:00:00').getDay() + 6) % 7]}
                  </Text>
                </>
              )}
            </View>
          </TouchableOpacity>

          {/* CENTRO (Seleccionado actual - Fijo sin presionar) */}
          <View style={styles.activeDayBlock}>
            <Text style={styles.activeDay}>
              {String(new Date(currentDay.date + 'T00:00:00').getDate()).padStart(2, '0')}/
              {String(new Date(currentDay.date + 'T00:00:00').getMonth() + 1).padStart(2, '0')}
            </Text>
            <Text style={styles.activeWeek}>
              {WEEK[(new Date(currentDay.date + 'T00:00:00').getDay() + 6) % 7]}
            </Text>
          </View>

          {/* BOTÓN SIGUIENTE (Día de la derecha + Flecha) */}
          <TouchableOpacity
            style={[styles.navButton, idx === forecastDays.length - 1 && { opacity: 0.1 }]}
            disabled={idx === forecastDays.length - 1}
            onPress={() => setIdx((i) => Math.min(forecastDays.length - 1, i + 1))}>
            <View style={styles.sideDay}>
              {forecastDays[idx + 1] && (
                <>
                  <Text style={styles.day}>
                    {String(new Date(forecastDays[idx + 1].date + 'T00:00:00').getDate()).padStart(
                      2,
                      '0'
                    )}
                    /
                    {String(
                      new Date(forecastDays[idx + 1].date + 'T00:00:00').getMonth() + 1
                    ).padStart(2, '0')}
                  </Text>
                  <Text style={styles.week}>
                    {WEEK[(new Date(forecastDays[idx + 1].date + 'T00:00:00').getDay() + 6) % 7]}
                  </Text>
                </>
              )}
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* CIUDAD */}
        <Text style={styles.city}>{data?.location.name.toUpperCase()}</Text>

        {/* ICONO DINÁMICO */}
        <View style={styles.iconBox}>
          <WeatherIcon condition={currentDay.day.condition.text} />
        </View>

        {/* MÉTRICAS REALES */}
        <View style={styles.metrics}>
          <View style={styles.metricRow}>
            <Droplets size={20} color="#000" />
            <Text style={styles.metricText}>
              {currentDay.day.avghumidity}
              <Text style={{ fontSize: 12, fontWeight: '300' }}>%</Text>
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Gauge size={20} color="#000" />
            <Text style={styles.metricText}>
              {/* Usamos el fallback de currentDay.day si en history no viene pressure_mb directo en hour */}
              {currentDay.hour?.[0]?.pressure_mb || 1013}
              <Text style={{ fontSize: 12, fontWeight: '300' }}> hPa</Text>
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Wind size={20} color="#000" />
            <Text style={styles.metricText}>
              {currentDay.day.maxwind_kph}
              <Text style={{ fontSize: 12, fontWeight: '300' }}> km/h</Text>
            </Text>
          </View>
        </View>

        {/* TIMELINE */}
        <View style={styles.timelineWrapper}>
          <View style={styles.column}>
            {splitRows.map((row, i) => (
              <View key={`l-${i}`} style={styles.block}>
                {row.left.map((h: any) => (
                  <View key={h.time} style={styles.tickBox}>
                    <Text style={styles.tickTemp}>{Math.round(h.temp_c)}°</Text>
                    <Text style={styles.tickTime}>{h.time.split(' ')[1]}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>

          <View style={styles.centerTemp}>
            <Text style={styles.temp}>{Math.round(currentDay.day.avgtemp_c)}°</Text>
          </View>

          <View style={styles.column}>
            {splitRows.map((row, i) => (
              <View key={`r-${i}`} style={styles.block}>
                {row.right.map((h: any) => (
                  <View key={h.time} style={styles.tickBox}>
                    <Text style={styles.tickTemp}>{Math.round(h.temp_c)}°</Text>
                    <Text style={styles.tickTime}>{h.time.split(' ')[1]}</Text>
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

// ... (Los estilos quedan exactamente igual que antes)
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 80,
    backgroundColor: '#fff',
    paddingBottom: 40,
  },
  nav: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minWidth: 100,
    height: 50,
  },
  day: { fontSize: 12, color: '#666', fontWeight: '500' },
  week: { fontSize: 10, color: '#aaa', textAlign: 'center' },
  arrow: { fontSize: 32, color: '#000', fontWeight: '300' },
  city: { fontSize: 22, letterSpacing: 5, fontWeight: '900', marginBottom: 20, color: 'black' },
  iconBox: { height: 300, justifyContent: 'center', marginVertical: 20 },
  metrics: { width: '100%', gap: 16, marginBottom: 40, paddingHorizontal: 40 },
  metricRow: { flexDirection: 'row', alignItems: 'center' },
  metricText: { fontSize: 18, marginLeft: 12, fontWeight: '700', color: '#000' },

  timelineWrapper: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  column: { flex: 1 },
  block: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  tickBox: { alignItems: 'center', width: 50, paddingTop: 10 },
  tickTemp: { fontSize: 18, color: '#111', fontWeight: '600' },
  tickTime: { fontSize: 11, color: '#666', marginTop: 2 },
  centerTemp: { width: 110, alignItems: 'center', justifyContent: 'center' },
  temp: { fontSize: 72, fontWeight: '300', color: '#000' },

  sideDay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDayBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
  },
  activeDay: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    paddingBottom: 2,
  },
  activeWeek: {
    fontSize: 12,
    color: '#000',
    marginTop: 4,
    fontWeight: '600',
  },
});
