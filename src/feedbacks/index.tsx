import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ErrorBoundaryProps } from 'expo-router';
import { AlertCircleIcon } from 'lucide-react-native';
import { View } from 'react-native';

export const FeedbackDeErrorPorDefecto = ({ error, retry }: ErrorBoundaryProps) => {
  return (
    <View className="flex-1 justify-center p-4">
      <Alert variant="destructive" icon={AlertCircleIcon}>
        <AlertTitle>Ooooops!</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    </View>
  );
};

export default FeedbackDeErrorPorDefecto;
