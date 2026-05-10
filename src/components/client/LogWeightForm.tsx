import { useState } from 'react';
import { View } from 'react-native';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const kgSchema = z.coerce.number().positive().lt(500);

export function LogWeightForm({ onSubmit }: { onSubmit: (kg: number) => Promise<void> | void }) {
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const parsed = kgSchema.safeParse(value.replace(',', '.'));
    if (!parsed.success) {
      toast.error(t('weight.invalidKg'));
      return;
    }
    setBusy(true);
    try {
      await onSubmit(parsed.data);
      setValue('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('common.genericError'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="flex-row gap-2">
      <View className="flex-1">
        <Input
          value={value}
          onChangeText={setValue}
          placeholder={t('weight.logKg')}
          keyboardType="decimal-pad"
          inputMode="decimal"
        />
      </View>
      <Button onPress={submit} loading={busy}>
        {t('weight.logCta')}
      </Button>
    </View>
  );
}
