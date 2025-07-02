import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, MapPin, Navigation } from 'lucide-react';

const ResultDisplay = ({ result }) => {
  const { t } = useTranslation();

  if (!result) return null;

  const formatAddress = (addressData) => {
    if (typeof addressData === 'string') return addressData;
    if (addressData.new_ward_name && addressData.new_province_name) {
      return `${addressData.new_ward_name}, ${addressData.new_province_name}`;
    }
    return JSON.stringify(addressData);
  };

  const formatOldAddress = (oldAddr) => {
    return `${oldAddr.oldWard}, ${oldAddr.oldDistrict}, ${oldAddr.oldProvince}`;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-6 border-success/20 shadow-card">
      <CardHeader className="bg-gradient-to-r from-success/5 to-info/5 border-b border-success/20">
        <CardTitle className="flex items-center gap-2 text-success">
          <CheckCircle className="h-5 w-5" />
          {t('resultTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-government-gray" />
              <span className="text-sm font-medium text-government-gray">
                {t('oldAddressLabel')}
              </span>
            </div>
            <p className="text-foreground font-medium bg-muted p-3 rounded-md">
              {formatOldAddress(result.oldAddress)}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {t('newAddressLabel')}
              </span>
            </div>
            <p className="text-foreground font-medium bg-primary/5 p-3 rounded-md border border-primary/20">
              {formatAddress(result.newAddress)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {result.type === 'MERGED' && (
            <Badge variant="secondary" className="bg-info/10 text-info border-info/20">
              {t('mergedResult')}
            </Badge>
          )}
          {(result.type === 'SPLITTED_MATCH_FOUND' || result.type === 'SPLITTED_REQUIRES_COORDS') && (
            <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">
              {t('splittedResult')}
            </Badge>
          )}
          {result.type === 'SPLITTED_MATCH_FOUND' && result.geoDetails && (
            <Badge variant="outline" className="border-professional-blue/30 text-professional-blue">
              {t('geocoding_success')}
            </Badge>
          )}
        </div>

        {result.geoDetails && result.geoDetails.centroid && (
          <div className="mt-4 p-3 bg-professional-blue/5 rounded-md border border-professional-blue/20">
            <p className="text-sm text-professional-blue">
              <strong>{t('coordinatesUsed')}</strong> {result.geoDetails.centroid[1].toFixed(6)}, {result.geoDetails.centroid[0].toFixed(6)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResultDisplay;