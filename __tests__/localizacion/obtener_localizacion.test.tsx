import usarLocalizacion from '@/src/localizacion';
import { renderHook, waitFor } from '@testing-library/react-native';

jest.mock('expo-location', () => {
  const obtenerLocalizacionActualFalsa = jest.fn(async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return { coords: { latitude: 10, longitude: 20 } };
  });

  const solicitarPermisosDeLocalizacionFalsa = jest.fn(async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return { status: 'granted' };
  });

  return {
    requestForegroundPermissionsAsync: solicitarPermisosDeLocalizacionFalsa,
    getCurrentPositionAsync: obtenerLocalizacionActualFalsa,
  };
});

describe('Yo como usuario quiero visualizar los datos del clima de la fecha para saber vestirme ', () => {
  beforeAll(() => jest.useFakeTimers());
  afterAll(() => jest.useRealTimers());
  test('Es posible obtener las coordendas geograficas de mi localizacion', async () => {
    const resultado = renderHook(() => usarLocalizacion());

    expect(resultado.result.current.coordenadas()).toEqual({
      latitud: 0,
      longitud: 0,
    });

    await waitFor(() => {
      expect(resultado.result.current.coordenadas()).toEqual({
        latitud: 10,
        longitud: 20,
      });
    });
  });
});
