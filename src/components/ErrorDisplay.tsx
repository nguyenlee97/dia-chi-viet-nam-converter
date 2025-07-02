// src/components/ErrorDisplay.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Clock, Shield, HelpCircle } from 'lucide-react';
import { Badge } from './ui/badge';

// Define the shape of a potential new ward
interface PotentialWard {
  new_ward_name: string;
  new_province_name: string;
}

// Define the shape of the error object we expect
interface ErrorInfo {
  message: string;
  potentialNewWards?: PotentialWard[];
}

interface ErrorDisplayProps {
  error: ErrorInfo;
  type?: 'error' | 'warning' | 'info';
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, type = 'error' }) => {
  const { t } = useTranslation();

  if (!error || !error.message) return null;

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

  return (
    <Alert variant={type === 'error' ? 'destructive' : 'default'} className="w-full max-w-2xl mx-auto mt-6">
      {getIcon()}
      <AlertTitle>{t('errorTitle') || 'Thông báo'}</AlertTitle>
      <AlertDescription className="font-medium">
        {error.message}
      </AlertDescription>

      {/* Conditionally render the list of potential wards */}
      {error.potentialNewWards && error.potentialNewWards.length > 0 && (
        <div className="mt-4 pt-3 border-t border-destructive/20">
          <div className="flex items-center gap-2 mb-2">
             <HelpCircle className="h-4 w-4" />
             <p className="text-sm font-semibold">{t('potentialWardsTitle')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* --- MODIFICATION START --- */}
            {/* Map over the array of objects and display the full address */}
            {error.potentialNewWards.map((ward, index) => (
              <Badge key={index} variant="secondary">
                {`${ward.new_ward_name}, ${ward.new_province_name}`}
              </Badge>
            ))}
            {/* --- MODIFICATION END --- */}
          </div>
        </div>
      )}
    </Alert>
  );
};

export default ErrorDisplay;