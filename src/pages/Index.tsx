// src/pages/Index.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import AddressForm from '../components/AddressForm';
import ResultDisplay from '../components/ResultDisplay';
import ErrorDisplay from '../components/ErrorDisplay';
import LoadingSpinner from '../components/LoadingSpinner';

// Define the shape of the error state
interface ErrorState {
  message: string;
  potentialNewWards?: any[]; // Keep as any for simplicity with the modified error shape
}

const Index = () => {
  const { t } = useTranslation();
  const [selectionTree, setSelectionTree] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await axios.get('/api/selection-data');
        setSelectionTree(response.data);
      } catch (err) {
        setError({ message: t('ERROR_NETWORK') });
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadData();
  }, [t]);

  const handleAddressSubmit = async (address: {
    streetInfo: string;
    province: string;
    district: string;
    ward: string;
  }) => {
    setIsLoading(true);
    setError(null);
    setNotification('');
    setResult(null);

    try {
      const payload = {
        oldProvince: address.province,
        oldDistrict: address.district,
        oldWard: address.ward,
        streetInfo: address.streetInfo,
      };

      const response = await axios.post('/api/lookup', payload);
      setResult(response.data);

    } catch (err: any) {
      console.error('Lookup error:', err);
      const errData = err.response?.data;
      if (errData && errData.messageKey) {
        setError({
          message: t(errData.messageKey, { meta: errData.meta || {} }),
          potentialNewWards: errData.potentialNewWards
        });
      } else if (err.code === 'ERR_NETWORK') {
        setError({ message: t('ERROR_NETWORK') });
      } else {
        setError({ message: t('ERROR_UNKNOWN') });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <LoadingSpinner message={t('loadingData')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
        <header className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 tracking-tight">
            {t('appTitle')}
          </h1>
          <p className="mt-3 text-lg text-gray-500 max-w-2xl mx-auto">
            {t('appSubtitle')}
          </p>
        </header>

        <main className="space-y-6">
          <AddressForm
            selectionTree={selectionTree}
            onSubmit={handleAddressSubmit}
            isLoading={isLoading}
          />
          {notification && (
            <ErrorDisplay error={{ message: notification }} type="info" />
          )}
          {error && (
            <ErrorDisplay error={error} type="error" />
          )}
          {result && (
            <ResultDisplay result={result} />
          )}
        </main>
        
        <footer className="text-center mt-12 space-y-2 text-sm text-gray-400">
            <p>{t('footerText')}</p>

            {/* --- MODIFICATION START --- */}
            <a 
              href="https://github.com/nguyenlee97" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 pt-2 text-gray-500 hover:text-primary transition-colors cursor-pointer group"
            >
                <span>Created by Momolita</span>
                <img 
                    src="https://s3.getstickerpack.com/storage/uploads/sticker-pack/genshin-impact-hutao/tray_large.png?2c9966a5520fdab6c03fda5ca193f388&d=200x200" 
                    alt="Hu Tao"
                    className="h-8 w-8 transition-transform group-hover:scale-110" // Image is now larger (32x32) with a hover effect
                />
            </a>
            {/* --- MODIFICATION END --- */}
        </footer>
      </div>
    </div>
  );
};

export default Index;