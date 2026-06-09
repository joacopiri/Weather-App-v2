import { Stack } from 'expo-router';
import * as React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { Sun, Cloud, CloudRain, Droplets, Wind, Gauge, CloudLightning } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';

// ─── Configuración API ──────────────────────────
const API_KEY = 'ae713916ebe9498a9d8224315260505';
const DEFAULT_CITY = '-34.676,-58.473';

function getFormattedDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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
    // Traemos también la data actual para cuando estemos parados en el día "Hoy"
    current: forecastData.current,
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
  const [coords, setCoords] = React.useState<string | null>(null);
  const [locating, setLocating] = React.useState(true);

  React.useEffect(() => {
    async function getUserLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setCoords(DEFAULT_CITY);
          return;
        }
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
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

  const { data, isLoading, error } = useQuery({
    queryKey: ['weather', coords],
    queryFn: () => fetchWeather(coords!),
    enabled: !!coords,
  });

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

  const prevDayInfo = forecastDays[idx - 1] ? parseDayData(forecastDays[idx - 1].date) : null;
  const currentDayInfo = parseDayData(currentDay.date);
  const nextDayInfo = forecastDays[idx + 1] ? parseDayData(forecastDays[idx + 1].date) : null;

  // Lógica para la temperatura "Now" (Actual)
  // Si el usuario está viendo el día de "Hoy" (idx === 1), mostramos la temperatura en tiempo real de la API.
  // Si está viendo ayer u mañana, mostramos el promedio del día (avgtemp_c) como fallback.
  const currentTemp =
    idx === 1 ? Math.round(data.current.temp_c) : Math.round(currentDay.day.avgtemp_c);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={styles.container}>
        {/* NAV */}
        <View style={styles.nav}>
          <TouchableOpacity
            style={[styles.navButton, idx === 0 && { opacity: 0.1 }]}
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
            style={[styles.navButton, idx === forecastDays.length - 1 && { opacity: 0.1 }]}
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

        {/* CIUDAD */}
        <Text style={styles.city}>{data.location.name.toUpperCase()}</Text>

        {/* ICONO */}
        <View style={styles.iconBox}>
          <WeatherIcon condition={currentDay.day.condition.text} />
        </View>

        {/* MÉTRICAS */}
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

        {/* NUEVA SECCIÓN DE TEMPERATURAS: MIN | NOW | MAX */}
        <View style={styles.tempContainer}>
          {/* Mínima */}
          <View style={styles.tempColumn}>
            <View style={styles.relativeBox}>
              <Text style={styles.secondaryTemp}>{Math.round(currentDay.day.mintemp_c)}</Text>
              <Text style={styles.degreeSideSmall}>°</Text>
            </View>
            <Text style={styles.tempLabel}>min</Text>
          </View>

          {/* Actual (Resaltada) */}
          <View style={styles.tempColumn}>
            <View style={styles.relativeBox}>
              <Text style={styles.mainTemp}>{currentTemp}</Text>
              <Text style={styles.degreeSideMain}>°</Text>
            </View>
            <Text style={styles.mainTempLabel}>now</Text>
          </View>

          {/* Máxima */}
          <View style={styles.tempColumn}>
            <View style={styles.relativeBox}>
              <Text style={styles.secondaryTemp}>{Math.round(currentDay.day.maxtemp_c)}</Text>
              <Text style={styles.degreeSideSmall}>°</Text>
            </View>
            <Text style={styles.tempLabel}>max</Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 80,
    backgroundColor: '#fff',
    paddingBottom: 40,
  },
  city: {
    fontSize: 22,
    letterSpacing: 5,
    fontWeight: '900',
    marginBottom: 20,
    color: 'black',
  },
  /*                              METRICAS                                 */
  iconBox: {
    height: 300,
    justifyContent: 'center',
    marginVertical: 20,
  },
  metrics: {
    width: '100%',
    gap: 16,
    marginBottom: 40,
    paddingHorizontal: 40,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricText: {
    fontSize: 18,
    marginLeft: 12,
    fontWeight: '700',
    color: '#000',
  },
  unitText: {
    fontSize: 12,
    fontWeight: '300',
  },

  /*                               BUSQUEDA                                 */
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
  day: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  week: {
    fontSize: 10,
    color: '#aaa',
    fontWeight: '500',
  },
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
  arrow: {
    fontSize: 24,
    color: '#666',
    fontWeight: '200',
  },
  /*                              TEMPERATURA                                 */
  tempContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  tempColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  // Contenedor que permite al símbolo flotar a la derecha sin ocupar ancho real
  relativeBox: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainTemp: {
    fontSize: 64,
    fontWeight: '300',
    color: '#000',
  },
  secondaryTemp: {
    fontSize: 32,
    fontWeight: '400',
    color: '#444',
  },
  // Grado absoluto para la temperatura principal (now)
  degreeSideMain: {
    position: 'absolute',
    right: -18, // Se empuja hacia afuera de la caja del número
    top: 6, // Ajusta la altura del símbolo
    fontSize: 28,
    fontWeight: '300',
    color: '#000',
  },
  // Grado absoluto para las secundarias (min y max)
  degreeSideSmall: {
    position: 'absolute',
    right: -10, // Un poco menos de margen porque el número es más chico
    top: 2,
    fontSize: 16,
    fontWeight: '400',
    color: '#444',
  },
  mainTempLabel: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  tempLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    textTransform: 'uppercase',
    marginTop: 4,
  },
});
