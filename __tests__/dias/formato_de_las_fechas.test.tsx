import { render } from '@testing-library/react-native';

import NavEntreDias from '@/src/dias';

describe('Yo como usuario, deseo navegar entre los dias para conocer predicciones o datos historicos del clima', () => {
  test('Para el 21 de septiembre del 2025, deben aparecer 20/09, 21/09 y 22/09 como fechas en la barra de navegación', () => {
    const hoy = new Date('september 21, 2025');
    const ayer = new Date('september 20, 2025');
    const maniana = new Date('september 22, 2025');
    const screen = render(<NavEntreDias hoy={hoy} maniana={maniana} ayer={ayer} />);

    expect(screen.getByText('20/09')).toBeOnTheScreen();
    expect(screen.getByText('21/09')).toBeOnTheScreen();
    expect(screen.getByText('22/09')).toBeOnTheScreen();
  });
});
