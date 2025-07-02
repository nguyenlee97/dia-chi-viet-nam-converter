// src/pages/Index.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import AddressForm from '../components/AddressForm';
import ResultDisplay from '../components/ResultDisplay';
import ErrorDisplay from '../components/ErrorDisplay';
import LoadingSpinner from '../components/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Calendar, GitBranch } from 'lucide-react';

const Index = () => {
  const { t } = useTranslation();
  const [selectionTree, setSelectionTree] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [result, setResult] = useState<any>(null); // Use 'any' for simplicity, can be typed later
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await axios.get('/api/selection-data');
        setSelectionTree(response.data);
      } catch (err) {
        console.error('Error loading selection data:', err);
        setError(t('ERROR_NETWORK'));
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
    setError('');
    setNotification('');
    setResult(null);

    try {
      const payload = {
        oldProvince: address.province,
        oldDistrict: address.district,
        oldWard: address.ward,
        userCoordinates: null, // Start with null coordinates
      };

      const initialResponse = await axios.post('/api/lookup', payload);
      const initialData = initialResponse.data;

      if (initialData.type === 'MERGED') {
        setResult(initialData);
      } else if (initialData.type === 'SPLITTED_REQUIRES_COORDS') {
        setNotification(t(initialData.messageKey));
        
        if (address.streetInfo.trim()) {
          setNotification(t('geocoding_in_progress'));
          
          const fullAddressString = `${address.streetInfo}, ${address.ward}, ${address.district}, ${address.province}, Vietnam`;
          const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddressString)}`;
          
          const geoResponse = await axios.get(geoUrl);
          
          if (geoResponse.data && geoResponse.data.length > 0) {
            const { lat, lon } = geoResponse.data[0];
            
            const finalPayload = { ...payload, userCoordinates: { lat: parseFloat(lat), lon: parseFloat(lon) }};
            const finalResponse = await axios.post('/api/lookup', finalPayload);
            
            setResult(finalResponse.data);
            setNotification(''); // Clear notification on success
          } else {
            setError(t('ERROR_GEOCODING_FAILED'));
            setNotification(''); // Clear notification on failure
          }
        } else {
            // If street info is missing for a split ward, show an error.
            setError(t('ERROR_STREET_INFO_NEEDED'));
            setNotification('');
        }
      }
    } catch (err: any) {
      console.error('Lookup error:', err);
      const errData = err.response?.data;
      if (errData && errData.messageKey) {
        setError(t(errData.messageKey, { meta: errData.meta || {} }));
      } else if (err.code === 'ERR_NETWORK') {
        setError(t('ERROR_NETWORK'));
      } else {
        setError(t('ERROR_UNKNOWN'));
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
            <ErrorDisplay error={notification} type="info" />
          )}
          {error && (
            <ErrorDisplay error={error} type="error" />
          )}
          {result && (
            <ResultDisplay result={result} />
          )}
        </main>
        
        <footer className="text-center mt-12 text-sm text-gray-400">
            <p>{t('footerText')}</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;