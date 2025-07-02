// src/components/AddressForm.tsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RotateCcw, Search } from 'lucide-react';
import { SearchableSelect } from './SearchableSelect'; // Import the new component

interface AddressFormProps {
  selectionTree: any;
  onSubmit: (address: { streetInfo: string; province: string; district: string; ward: string }) => void;
  isLoading: boolean;
}

// Define a type for our select options
type SelectOption = { value: string; label: string };

const AddressForm: React.FC<AddressFormProps> = ({ selectionTree, onSubmit, isLoading }) => {
  const { t } = useTranslation();
  const [streetInfo, setStreetInfo] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedWard, setSelectedWard] = useState('');

  // The lists will now be stored in the { value, label } format
  const [provinces, setProvinces] = useState<SelectOption[]>([]);
  const [districts, setDistricts] = useState<SelectOption[]>([]);
  const [wards, setWards] = useState<SelectOption[]>([]);

  // Effect to sort and set provinces on initial load
  useEffect(() => {
    if (selectionTree) {
      const provinceList = Object.keys(selectionTree)
        .sort((a, b) => a.localeCompare(b, 'vi')) // Alphabetical sort
        .map(p => ({ value: p, label: p }));
      setProvinces(provinceList);
    }
  }, [selectionTree]);

  // Effect to update districts when a province is selected
  useEffect(() => {
    if (selectedProvince && selectionTree[selectedProvince]) {
      const districtList = Object.keys(selectionTree[selectedProvince])
        .sort((a, b) => a.localeCompare(b, 'vi')) // Alphabetical sort
        .map(d => ({ value: d, label: d }));
      setDistricts(districtList);
    } else {
      setDistricts([]);
    }
    setSelectedDistrict('');
    setSelectedWard('');
    setWards([]);
  }, [selectedProvince, selectionTree]);

  // Effect to update wards when a district is selected
  useEffect(() => {
    if (selectedDistrict && selectionTree[selectedProvince] && selectionTree[selectedProvince][selectedDistrict]) {
      const wardList = selectionTree[selectedProvince][selectedDistrict]
        .slice() // Create a copy before sorting
        .sort((a: string, b: string) => a.localeCompare(b, 'vi')) // Alphabetical sort
        .map((w: string) => ({ value: w, label: w }));
      setWards(wardList);
    } else {
      setWards([]);
    }
    setSelectedWard('');
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
              <SearchableSelect
                value={selectedProvince}
                onValueChange={setSelectedProvince}
                options={provinces}
                placeholder={t('provincePlaceholder')}
                searchPlaceholder={t('provinceSearchPlaceholder')}
                emptyText={t('searchEmpty')}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                {t('districtLabel')}
              </Label>
              <SearchableSelect
                value={selectedDistrict}
                onValueChange={setSelectedDistrict}
                options={districts}
                placeholder={t('districtPlaceholder')}
                searchPlaceholder={t('districtSearchPlaceholder')}
                emptyText={t('searchEmpty')}
                disabled={!selectedProvince}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                {t('wardLabel')}
              </Label>
              <SearchableSelect
                value={selectedWard}
                onValueChange={setSelectedWard}
                options={wards}
                placeholder={t('wardPlaceholder')}
                searchPlaceholder={t('wardSearchPlaceholder')}
                emptyText={t('searchEmpty')}
                disabled={!selectedDistrict}
              />
            </div>
          </div>

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