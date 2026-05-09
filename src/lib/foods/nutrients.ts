// Mobile-side nutrient registry. Trimmed to the keys the client UI actually
// references (kcal + macros + a few headline extras). The web app uses the
// full 36-nutrient registry; mobile only renders kcal/P/C/F so we keep this
// small but compatible with snapshot bags emitted by the web.

export type NutrientKey =
  | 'kcal'
  | 'proteinG'
  | 'carbsG'
  | 'fatG'
  | 'fiberG'
  | 'sugarsG'
  | 'sodiumMg';

export const NUTRIENT_KEYS: ReadonlyArray<NutrientKey> = [
  'kcal',
  'proteinG',
  'carbsG',
  'fatG',
  'fiberG',
  'sugarsG',
  'sodiumMg',
];

export const PRIMARY_NUTRIENT_KEYS = ['kcal', 'proteinG', 'carbsG', 'fatG'] as const;
