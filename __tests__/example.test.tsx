import { render } from '@testing-library/react-native';

import HomeScreen from '@/example/example';

describe('<HomeScreen />', () => {
  test('Text renders correctly on HomeScreen', () => {
    const { getByText } = render(<HomeScreen />);

    expect(getByText('Welcome!')).toBeOnTheScreen();
  });
});
