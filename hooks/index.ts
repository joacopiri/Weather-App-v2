import { useColorScheme } from 'nativewind';

export const useTema = () => {
  const { colorScheme } = useColorScheme();
  return {
    modo: () => colorScheme ?? 'light',
  };
};
