import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Clock, Shield } from 'lucide-react';

const ErrorDisplay = ({ error, type = 'error' }) => {
  const { t } = useTranslation();

  if (!error) return null;

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <Clock className="h-4 w-4" />;
      case 'info':
        return <Shield className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getVariant = () => {
    switch (type) {
      case 'warning':
        return 'default';
      case 'info':
        return 'default';
      default:
        return 'destructive';
    }
  };

  return (
    <Alert variant={getVariant()} className="w-full max-w-2xl mx-auto mt-4">
      {getIcon()}
      <AlertDescription className="font-medium">
        {error}
      </AlertDescription>
    </Alert>
  );
};

export default ErrorDisplay;