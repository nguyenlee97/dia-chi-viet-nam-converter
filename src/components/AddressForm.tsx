// src/components/AddressForm.tsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, RotateCcw, Search } from 'lucide-react';

interface AddressFormProps {
  selectionTree: any;
  onSubmit: (address: { streetInfo: string; province: string; district: string; ward: string }) => void;
  isLoading: boolean;
}

const AddressForm: React.FC<AddressFormProps> = ({ selectionTree, onSubmit, isLoading }) => {
  const { t } = useTranslation();
  const [streetInfo, setStreetInfo] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedWard, setSelectedWard] = useState('');

  const [districts, setDistricts] = useState<string[]>([]);
  const [wards, setWards] = useState<string[]>([]);

  useEffect(() => {
    if (selectedProvince && selectionTree[selectedProvince]) {
      setDistricts(Object.keys(selectionTree[selectedProvince]));
      setSelectedDistrict('');
      setSelectedWard('');
      setWards([]);
    }
  }, [selectedProvince, selectionTree]);

  useEffect(() => {
    if (selectedDistrict && selectionTree[selectedProvince] && selectionTree[selectedProvince][selectedDistrict]) {
      setWards(selectionTree[selectedProvince][selectedDistrict]);
      setSelectedWard('');
    }
  }, [selectedDistrict, selectedProvince, selectionTree]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvince || !selectedDistrict || !selectedWard) {
      return;
    }
    onSubmit({
      streetInfo,
      province: selectedProvince,
      district: selectedDistrict,
      ward: selectedWard
    });
  };

  const handleReset = () => {
    setStreetInfo('');
    setSelectedProvince('');
    setSelectedDistrict('');
    setSelectedWard('');
    setDistricts([]);
    setWards([]);
  };

  const isFormValid = selectedProvince && selectedDistrict && selectedWard;

  return (
    <Card className="w-full max-w-2xl mx-auto border-border/50 shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          {t('addressInputTitle')}
        </CardTitle>
        <CardDescription className="text-government-gray">
          {t('addressInputDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="street" className="text-sm font-medium text-foreground">
              {t('streetInfoLabel')}
            </Label>
            <Input
              id="street"
              type="text"
              value={streetInfo}
              onChange={(e) => setStreetInfo(e.target.value)}
              placeholder={t('streetInfoPlaceholder')}
              className="border-border/60 focus:border-primary transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                {t('provinceLabel')}
              </Label>
              <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                <SelectTrigger className="border-border/60 focus:border-primary">
                  <SelectValue placeholder={t('provincePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {selectionTree && Object.keys(selectionTree).map((province) => (
                    <SelectItem key={province} value={province}>
                      {province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                {t('districtLabel')}
              </Label>
              <Select 
                value={selectedDistrict} 
                onValueChange={setSelectedDistrict}
                disabled={!selectedProvince}
              >
                <SelectTrigger className="border-border/60 focus:border-primary">
                  <SelectValue placeholder={t('districtPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((district) => (
                    <SelectItem key={district} value={district}>
                      {district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                {t('wardLabel')}
              </Label>
              <Select 
                value={selectedWard} 
                onValueChange={setSelectedWard}
                disabled={!selectedDistrict}
              >
                <SelectTrigger className="border-border/60 focus:border-primary">
                  <SelectValue placeholder={t('wardPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {wards.map((ward) => (
                    <SelectItem key={ward} value={ward}>
                      {ward}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* UI FIX: Increased top padding from pt-2 to pt-6 */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            <Button 
              type="submit" 
              disabled={!isFormValid || isLoading}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            >
              {isLoading ? (
                <>{t('submittingButton')}</>
              ) : (
                <><Search className="mr-2 h-4 w-4" /> {t('submitButton')}</>
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleReset}
              disabled={isLoading}
              className="border-border/60 hover:bg-secondary"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {t('resetForm')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddressForm;