import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import AddressForm from '../components/AddressForm';
import ResultDisplay from '../components/ResultDisplay';
import ErrorDisplay from '../components/ErrorDisplay';
import LoadingSpinner from '../components/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Calendar } from 'lucide-react';

const Index = () => {
  const { t } = useTranslation();
  const [selectionTree, setSelectionTree] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [result, setResult] = useState(null);
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

  const handleAddressSubmit = async (address) => {
    setIsLoading(true);
    setError('');
    setNotification('');
    setResult(null);

    try {
      // Initial lookup request
      const initialResponse = await axios.post('/api/lookup', {
        oldProvince: address.province,
        oldDistrict: address.district,
        oldWard: address.ward,
      });
      
      const initialData = initialResponse.data;

      if (initialData.type === 'MERGED') {
        setResult(initialData);
      } else if (initialData.type === 'SPLITTED_REQUIRES_COORDS') {
        setNotification(t(initialData.messageKey));
        
        if (address.streetInfo.trim()) {
          setNotification(t('geocoding_in_progress'));
          
          // Attempt geocoding
          const fullAddressString = `${address.streetInfo}, ${address.ward}, ${address.district}, ${address.province}, Vietnam`;
          const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddressString)}`;
          
          try {
            const geoResponse = await axios.get(geoUrl);
            
            if (geoResponse.data && geoResponse.data.length > 0) {
              const { lat, lon } = geoResponse.data[0];
              
              // Final lookup with coordinates
              const finalResponse = await axios.post('/api/lookup', {
                oldProvince: address.province,
                oldDistrict: address.district,
                oldWard: address.ward,
                userCoordinates: { lat: parseFloat(lat), lon: parseFloat(lon) }
              });
              
              setResult(finalResponse.data);
              setNotification('');
            } else {
              setError(t('ERROR_GEOCODING_FAILED'));
            }
          } catch (geoError) {
            console.error('Geocoding error:', geoError);
            setError(t('ERROR_GEOCODING_FAILED'));
          }
        }
      }
    } catch (err) {
      console.error('Lookup error:', err);
      const errData = err.response?.data;
      if (errData && errData.messageKey) {
        setError(t(errData.messageKey, { meta: errData.meta || {} }));
      } else if (err.response?.status === 429) {
        setError(t('ERROR_RATE_LIMIT'));
      } else if (err.code === 'NETWORK_ERROR') {
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
      <div className="min-h-screen bg-gradient-to-br from-professional-blue/5 to-accent/5 flex items-center justify-center p-4">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-professional-blue/5 to-accent/5">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-primary rounded-full">
              <MapPin className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-primary">
              {t('appTitle')}
            </h1>
          </div>
          <p className="text-lg text-government-gray max-w-2xl mx-auto">
            {t('appSubtitle')}
          </p>
        </div>

        {/* Main Form */}
        <AddressForm
          selectionTree={selectionTree}
          onSubmit={handleAddressSubmit}
          isLoading={isLoading}
        />

        {/* Notification */}
        {notification && (
          <ErrorDisplay error={notification} type="info" />
        )}

        {/* Error Display */}
        {error && (
          <ErrorDisplay error={error} type="error" />
        )}

        {/* Result Display */}
        {result && (
          <ResultDisplay result={result} />
        )}

        {/* Footer */}
        <Card className="w-full max-w-2xl mx-auto mt-8 border-border/30">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-government-gray">
              <Calendar className="h-4 w-4" />
              <span>{t('footerText')}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {t('lastUpdated')} 2025
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
