import React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ message }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-government-gray font-medium">
        {message || t('loadingData')}
      </p>
    </div>
  );
};

export default LoadingSpinner;