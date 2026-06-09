import { Stack } from 'expo-router';
import * as React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { Sun, Cloud, CloudRain, Droplets, Wind, Gauge, CloudLightning } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { useQuery } from '@tanstack/react-query';
// 1. Importamos el módulo de localización de Expo
import * as Location from 'expo-location';

// ─── Configuración API ──────────────────────────
const API_KEY = 'ae713916ebe9498a9d8224315260505';
// Ubicación por defecto (Buenos Aires) por si el usuario deniega los permisos
const DEFAULT_CITY = '-34.676,-58.473';

function getFormattedDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 2. Modificamos el fetch para recibir un string con la query de localización
async function fetchWeather(locationQuery: string) {
  const today = new Date();

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = getFormattedDate(yesterday);

  const historyUrl = `https://api.weatherapi.com/v1/history.json?key=${API_KEY}&q=${locationQuery}&dt=${yesterdayStr}`;
  const forecastUrl = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${locationQuery}&days=2&aqi=no&alerts=no`;

  const [resHistory, resForecast] = await Promise.all([fetch(historyUrl), fetch(forecastUrl)]);

  if (!resHistory.ok || !resForecast.ok) throw new Error('Error al obtener clima');

  const historyData = await resHistory.json();
  const forecastData = await resForecast.json();

  return {
    location: forecastData.location,
    forecast: {
      forecastday: [
        historyData.forecast.forecastday[0], // Ayer
        forecastData.forecast.forecastday[0], // Hoy
        forecastData.forecast.forecastday[1], // Mañana
      ],
    },
  };
}

// ─── Helpers ─────────────────────────────────────
const WEEK = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function parseDayData(dateStr: string) {
  const dateObj = new Date(`${dateStr}T00:00:00`);
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const weekDay = WEEK[(dateObj.getDay() + 6) % 7];
  return { dateLabel: `${day}/${month}`, weekDay };
}

function WeatherIcon({
  condition,
  size = 300,
  color = '#000',
}: {
  condition: string;
  size?: number;
  color?: string;
}) {
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
  const [idx, setIdx] = React.useState(1);
  // Estado para guardar las coordenadas ("lat,lon")
  const [coords, setCoords] = React.useState<string | null>(null);
  const [locating, setLocating] = React.useState(true);

  // 3. Efecto para obtener la localización del teléfono
  React.useEffect(() => {
    async function getUserLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          // Si deniega los permisos, usamos la ubicación por defecto
          setCoords(DEFAULT_CITY);
          return;
        }

        // Obtenemos la localización actual con precisión equilibrada para no drenar batería
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        setCoords(`${location.coords.latitude},${location.coords.longitude}`);
      } catch (err) {
        console.error('Error obteniendo localización:', err);
        setCoords(DEFAULT_CITY);
      } finally {
        setLocating(false);
      }
    }

    getUserLocation();
  }, []);

  // 4. Adaptamos React Query para que no se ejecute hasta tener las coordenadas (enabled)
  const { data, isLoading, error } = useQuery({
    queryKey: ['weather', coords],
    queryFn: () => fetchWeather(coords!),
    enabled: !!coords, // No corre el fetch hasta que coords tenga valor
  });

  // Mostramos indicador de carga mientras busca la señal GPS o resuelve la API
  if (locating || isLoading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
        {locating && (
          <Text style={{ marginTop: 10, fontSize: 12, color: '#666' }}>
            Buscando ubicación exacta...
          </Text>
        )}
      </View>
    );

  if (error || !data?.forecast?.forecastday)
    return (
      <View style={styles.center}>
        <Text>Error al cargar datos</Text>
      </View>
    );

  const forecastDays = data.forecast.forecastday;
  const currentDay = forecastDays[idx];

  const timelineHours = currentDay.hour.filter((_: any, i: number) => i % 6 === 0);
  const splitRows = [];
  for (let i = 0; i < timelineHours.length; i += 4) {
    const chunk = timelineHours.slice(i, i + 4);
    splitRows.push({
      left: chunk.slice(0, 2),
      right: chunk.slice(2, 4),
    });
  }

  const prevDayInfo = forecastDays[idx - 1] ? parseDayData(forecastDays[idx - 1].date) : null;
  const currentDayInfo = parseDayData(currentDay.date);
  const nextDayInfo = forecastDays[idx + 1] ? parseDayData(forecastDays[idx + 1].date) : null;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={styles.container}>
        {/* NAV - Días de la semana unificados */}
        <View style={styles.nav}>
          <TouchableOpacity
            style={[styles.navButton, idx === 0 && { opacity: 0 }]}
            disabled={idx === 0}
            onPress={() => setIdx((i) => Math.max(0, i - 1))}>
            <Text style={styles.arrow}>‹</Text>
            <View style={styles.sideDay}>
              {prevDayInfo && (
                <>
                  <Text style={styles.day}>{prevDayInfo.dateLabel}</Text>
                  <Text style={styles.week}>{prevDayInfo.weekDay}</Text>
                </>
              )}
            </View>
          </TouchableOpacity>

          <View style={styles.activeDayBlock}>
            <Text style={styles.activeDay}>{currentDayInfo.dateLabel}</Text>
            <Text style={styles.activeWeek}>{currentDayInfo.weekDay}</Text>
          </View>

          <TouchableOpacity
            style={[styles.navButton, idx === forecastDays.length - 1 && { opacity: 0 }]}
            disabled={idx === forecastDays.length - 1}
            onPress={() => setIdx((i) => Math.min(forecastDays.length - 1, i + 1))}>
            <View style={styles.sideDay}>
              {nextDayInfo && (
                <>
                  <Text style={styles.day}>{nextDayInfo.dateLabel}</Text>
                  <Text style={styles.week}>{nextDayInfo.weekDay}</Text>
                </>
              )}
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* CIUDAD (Cambiará dinámicamente según donde estés) */}
        <Text style={styles.city}>{data.location.name.toUpperCase()}</Text>

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
              <Text style={styles.unitText}>%</Text>
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Gauge size={20} color="#000" />
            <Text style={styles.metricText}>
              {currentDay.hour?.[0]?.pressure_mb || 1013}
              <Text style={styles.unitText}> hPa</Text>
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Wind size={20} color="#000" />
            <Text style={styles.metricText}>
              {currentDay.day.maxwind_kph}
              <Text style={styles.unitText}> km/h</Text>
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
  week: { fontSize: 10, color: '#aaa', fontWeight: '500', textAlign: 'center' },
  arrow: { fontSize: 24, color: '#666', fontWeight: '300' },
  city: { fontSize: 22, letterSpacing: 5, fontWeight: '900', marginBottom: 20, color: 'black' },
  iconBox: { height: 300, justifyContent: 'center', marginVertical: 20 },
  metrics: { width: '100%', gap: 16, marginBottom: 40, paddingHorizontal: 40 },
  metricRow: { flexDirection: 'row', alignItems: 'center' },
  metricText: { fontSize: 18, marginLeft: 12, fontWeight: '700', color: '#000' },
  unitText: { fontSize: 12, fontWeight: '300' },

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

  sideDay: { alignItems: 'center', justifyContent: 'center' },
  activeDayBlock: { alignItems: 'center', justifyContent: 'center', minWidth: 90 },
  activeDay: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    paddingBottom: 2,
  },
  activeWeek: { fontSize: 12, color: '#000', marginTop: 4, fontWeight: '600' },
});
