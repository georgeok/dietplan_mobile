import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner-native';
import { Pencil } from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function MealNoteInput({
  initial,
  editable,
  onSave,
}: {
  initial: string;
  editable: boolean;
  onSave: (body: string) => Promise<void> | void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [saving, setSaving] = useState(false);

  const commit = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      setSaved(draft.trim());
      setOpen(false);
      toast.success(t('meal.noteSaved'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('common.genericError'));
    } finally {
      setSaving(false);
    }
  };

  if (!editable && !saved) return null;

  return (
    <View className="mt-2">
      {saved ? (
        <Pressable
          onPress={editable ? () => { setDraft(saved); setOpen(true); } : undefined}
          className="flex-row items-start gap-2 rounded-lg bg-muted px-3 py-2"
        >
          <Text className="flex-1 text-xs text-muted-foreground">{saved}</Text>
          {editable ? <Pencil size={12} color={colors.mutedForeground} /> : null}
        </Pressable>
      ) : editable ? (
        <Pressable onPress={() => { setDraft(''); setOpen(true); }}>
          <Text className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
            + {t('meal.addNote')}
          </Text>
        </Pressable>
      ) : null}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View className="flex-1 justify-end bg-black/40">
          <View className="gap-3 rounded-t-2xl bg-card p-4">
            <Text className="text-base font-semibold text-foreground">{t('meal.addNote')}</Text>
            <Input
              value={draft}
              onChangeText={setDraft}
              placeholder={t('meal.notePlaceholder')}
              multiline
              autoFocus
              style={{ minHeight: 80, paddingTop: 10 }}
            />
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Button onPress={commit} loading={saving} fullWidth>
                  {t('common.save')}
                </Button>
              </View>
              <View className="flex-1">
                <Button onPress={() => setOpen(false)} variant="ghost" disabled={saving} fullWidth>
                  {t('common.cancel')}
                </Button>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
