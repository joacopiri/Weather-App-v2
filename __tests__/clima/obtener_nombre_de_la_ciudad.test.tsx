import usarPronosticoClimatico from '@/src/clima/hooks';
import ProveedorDeDatosClimatico from '@/src/clima/proveedores';
import { renderHook, waitFor } from '@testing-library/react-native';

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () =>
      Promise.resolve({
        location: {
          name: 'Quilmes',
          region: 'Ile-de-France',
          country: 'France',
          lat: 48.8667,
          lon: 2.3333,
          tz_id: 'Europe/Paris',
          localtime_epoch: 1759287395,
          localtime: '2025-10-01 04:56',
        },
        current: {
          last_updated_epoch: 1759286700,
          last_updated: '2025-10-01 04:45',
          temp_c: 9.2,
          temp_f: 48.6,
          is_day: 0,
          condition: {
            text: 'Clear',
            icon: '//cdn.weatherapi.com/weather/64x64/night/113.png',
            code: 1000,
          },
          wind_mph: 3.8,
          wind_kph: 6.1,
          wind_degree: 21,
          wind_dir: 'NNE',
          pressure_mb: 1027.0,
          pressure_in: 30.33,
          precip_mm: 0.0,
          precip_in: 0.0,
          humidity: 93,
          cloud: 0,
          feelslike_c: 8.5,
          feelslike_f: 47.3,
          windchill_c: 11.1,
          windchill_f: 52.0,
          heatindex_c: 11.5,
          heatindex_f: 52.6,
          dewpoint_c: 6.2,
          dewpoint_f: 43.1,
          vis_km: 10.0,
          vis_miles: 6.0,
          uv: 0.0,
          gust_mph: 6.9,
          gust_kph: 11.1,
        },
      }),
  })
) as jest.Mock;

describe('Yo como usuario, quiero ver el nombre de la ciudad para asegurarme que los datos climaticos estan ligados a mi zona', () => {
  beforeAll(() => jest.useFakeTimers());
  afterAll(() => jest.useRealTimers());
  test('El primer dato a visualizar en la aplicación debe ser el nombre de la ciudad: Quilmes', async () => {
    const resultado = renderHook(
      () =>
        usarPronosticoClimatico({
          fecha: new Date(),
          latitud: -30,
          longitud: -60,
          clave_de_api: 'api_key_123',
        }),
      {
        wrapper: ProveedorDeDatosClimatico,
      }
    );

    expect(resultado.result.current.ciudad()).toBe('');

    await waitFor(() => {
      expect(resultado.result.current.ciudad()).toEqual('Quilmes');
    });
  });
});
