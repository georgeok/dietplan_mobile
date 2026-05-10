import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import { Check, Camera, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner-native';
import { useTheme } from '@/providers/ThemeProvider';
import type { SnapshotRecipe } from '@/lib/plans/snapshot';
import type { Tick, TickStatus } from '@/lib/database.types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusPill, type DisplayStatus } from './StatusPill';

export type TickSheetSubmit = {
  status: TickStatus;
  snapshotAlternativeId: string | null;
  ingredientsEaten: string[] | null;
  note: string | null;
  photoUrl: string | null;
};

export type TickSheetRef = {
  present: (recipe: SnapshotRecipe, existing: Tick | null) => void;
};

export function useTickSheet() {
  return useRef<TickSheetRef>(null);
}

function macroLine(r: { kcal: number | null; quantity: number | null; unit: string | null }): string {
  const parts: string[] = [];
  if (r.quantity !== null) parts.push(`${r.quantity}${r.unit ? ` ${r.unit}` : ''}`);
  if (r.kcal !== null) parts.push(`${Math.round(r.kcal)} kcal`);
  return parts.join(' · ');
}

export function TickSheet({
  sheetRef,
  editable,
  onSubmit,
  onClear,
  onPickPhoto,
}: {
  sheetRef: React.RefObject<TickSheetRef | null>;
  editable: boolean;
  onSubmit: (recipe: SnapshotRecipe, payload: TickSheetSubmit) => Promise<void> | void;
  onClear: (recipe: SnapshotRecipe) => Promise<void> | void;
  onPickPhoto: (recipe: SnapshotRecipe) => Promise<string | null>;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const modalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['60%', '92%'], []);

  const [recipe, setRecipe] = useState<SnapshotRecipe | null>(null);
  const [status, setStatus] = useState<TickStatus | null>(null);
  const [altId, setAltId] = useState<string | null>(null);
  const [eatenIds, setEatenIds] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // expose imperative present()
  if (sheetRef && 'current' in sheetRef) {
    (sheetRef as React.MutableRefObject<TickSheetRef>).current = {
      present: (r, existing) => {
        setRecipe(r);
        setStatus(existing?.status ?? null);
        setAltId(existing?.snapshot_alternative_id ?? null);
        setEatenIds(existing?.ingredients_eaten ?? []);
        setNote(existing?.note ?? '');
        setPhotoUrl(existing?.photo_url ?? null);
        modalRef.current?.present();
      },
    };
  }

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    [],
  );

  const toggleIngredient = (id: string) => {
    setEatenIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      // derive status from ingredient selection when the recipe has ingredients
      if (recipe && recipe.ingredients.length > 0) {
        if (next.length === 0) setStatus('skipped');
        else if (next.length === recipe.ingredients.length) setStatus('eaten');
        else setStatus('partial');
      }
      return next;
    });
  };

  const pickAlt = (id: string | null) => {
    setAltId(id);
    if (id) setStatus('eaten');
  };

  const onAddPhoto = async () => {
    if (!recipe) return;
    try {
      const path = await onPickPhoto(recipe);
      if (path) {
        setPhotoUrl(path);
        toast.success(t('tick.photoSelected'));
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('common.genericError'));
    }
  };

  const save = async () => {
    if (!recipe) return;
    const finalStatus: TickStatus = status ?? 'eaten';
    setSaving(true);
    try {
      await onSubmit(recipe, {
        status: finalStatus,
        snapshotAlternativeId: altId,
        ingredientsEaten:
          finalStatus === 'partial' && recipe.ingredients.length > 0 ? eatenIds : null,
        note: note.trim() ? note.trim() : null,
        photoUrl,
      });
      toast.success(t('tick.saved'));
      modalRef.current?.dismiss();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('common.genericError'));
    } finally {
      setSaving(false);
    }
  };

  const clear = async () => {
    if (!recipe) return;
    setSaving(true);
    try {
      await onClear(recipe);
      modalRef.current?.dismiss();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('common.genericError'));
    } finally {
      setSaving(false);
    }
  };

  const STATUS_OPTIONS: TickStatus[] = ['eaten', 'partial', 'skipped'];

  return (
    <BottomSheetModal
      ref={modalRef}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: colors.border }}
      backgroundStyle={{ backgroundColor: colors.card }}
    >
      <BottomSheetScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {recipe ? (
          <>
            <View>
              <Text className="text-lg font-bold text-foreground">{recipe.name}</Text>
              {macroLine(recipe) ? (
                <Text className="mt-0.5 text-sm text-muted-foreground">{macroLine(recipe)}</Text>
              ) : null}
            </View>

            <View className="flex-row gap-2">
              {STATUS_OPTIONS.map((s) => {
                const active = status === s;
                return (
                  <Pressable
                    key={s}
                    onPress={editable ? () => { setStatus(s); if (s !== 'partial') setAltId(altId); } : undefined}
                    className={`flex-1 rounded-lg border px-2 py-2 ${
                      active ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950' : 'border-border bg-background'
                    }`}
                  >
                    <Text
                      className={`text-center text-xs font-semibold ${
                        active ? 'text-emerald-700 dark:text-emerald-300' : 'text-foreground'
                      }`}
                    >
                      {t(`tick.${s}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {recipe.alternatives.length > 0 ? (
              <View className="gap-2">
                <Text className="text-sm font-medium text-foreground">{t('tick.chooseAlternative')}</Text>
                <View className="gap-1.5">
                  <AltRow
                    label={recipe.name}
                    detail={macroLine(recipe)}
                    selected={altId === null}
                    onPress={editable ? () => pickAlt(null) : undefined}
                  />
                  {recipe.alternatives.map((a) => (
                    <AltRow
                      key={a.snapshotAlternativeId}
                      label={a.name}
                      detail={macroLine(a)}
                      selected={altId === a.snapshotAlternativeId}
                      onPress={editable ? () => pickAlt(a.snapshotAlternativeId) : undefined}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {recipe.ingredients.length > 0 ? (
              <View className="gap-2">
                <Text className="text-sm font-medium text-foreground">{t('tick.ingredientsEaten')}</Text>
                <View className="gap-1.5">
                  {recipe.ingredients.map((ing) => {
                    const checked = eatenIds.includes(ing.snapshotIngredientId);
                    return (
                      <Pressable
                        key={ing.snapshotIngredientId}
                        onPress={editable ? () => toggleIngredient(ing.snapshotIngredientId) : undefined}
                        className="flex-row items-center gap-2 rounded-lg border border-border bg-background px-3 py-2"
                      >
                        <View
                          className={`h-5 w-5 items-center justify-center rounded border ${
                            checked ? 'border-emerald-500 bg-emerald-500' : 'border-border'
                          }`}
                        >
                          {checked ? <Check size={14} color="#fff" /> : null}
                        </View>
                        <Text className="flex-1 text-sm text-foreground">{ing.name}</Text>
                        {ing.quantity !== null ? (
                          <Text className="text-xs text-muted-foreground">
                            {ing.quantity}{ing.unit ? ` ${ing.unit}` : ''}
                          </Text>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">{t('meal.addNote')}</Text>
              <Input
                value={note}
                onChangeText={setNote}
                placeholder={t('tick.notePlaceholder')}
                editable={editable}
                multiline
                style={{ minHeight: 64, paddingTop: 10 }}
              />
            </View>

            <Pressable
              onPress={editable ? onAddPhoto : undefined}
              className="flex-row items-center gap-2 rounded-lg border border-border bg-background px-3 py-2"
            >
              <Camera size={16} color={colors.mutedForeground} />
              <Text className="text-sm text-foreground">
                {photoUrl ? t('tick.photoSelected') : t('tick.addPhoto')}
              </Text>
            </Pressable>

            {editable ? (
              <View className="gap-2">
                <Button onPress={save} loading={saving} fullWidth>
                  {t('common.save')}
                </Button>
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Button onPress={clear} variant="outline" disabled={saving} fullWidth>
                      {t('common.clear')}
                    </Button>
                  </View>
                  <View className="flex-1">
                    <Button onPress={() => modalRef.current?.dismiss()} variant="ghost" disabled={saving} fullWidth>
                      {t('common.cancel')}
                    </Button>
                  </View>
                </View>
              </View>
            ) : (
              <Text className="text-center text-xs text-muted-foreground">{t('week.readOnly')}</Text>
            )}
          </>
        ) : null}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

function AltRow({
  label,
  detail,
  selected,
  onPress,
}: {
  label: string;
  detail: string;
  selected: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-2 rounded-lg border px-3 py-2 ${
        selected ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950' : 'border-border bg-background'
      }`}
    >
      <View
        className={`h-4 w-4 rounded-full border-2 ${
          selected ? 'border-emerald-500 bg-emerald-500' : 'border-border'
        }`}
      />
      <Text className="flex-1 text-sm text-foreground">{label}</Text>
      {detail ? <Text className="text-xs text-muted-foreground">{detail}</Text> : null}
    </Pressable>
  );
}
