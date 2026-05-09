// Mobile-side categorization. No Gemini fallback — mobile reads cached
// rows + seed dictionary, returns 'other' for anything still unresolved.
// The web app keeps populating dp.food_categories via its own server-side
// categorize.ts; mobile is a pure consumer.

import { supabase } from '@/lib/supabase';
import type { FoodCategory } from '@/lib/database.types';
import { normalizeFoodName } from '@/lib/plans/normalize';

const SEED: Record<string, FoodCategory> = {
  // grains
  ψωμι: 'grains',
  'ψωμι ολικης': 'grains',
  ζυμαρικα: 'grains',
  μακαρονια: 'grains',
  ρυζι: 'grains',
  πληγουρι: 'grains',
  βρωμη: 'grains',
  κουλουρι: 'grains',
  παξιμαδι: 'grains',
  φρυγανια: 'grains',
  τοστ: 'grains',
  bread: 'grains',
  pasta: 'grains',
  rice: 'grains',
  oats: 'grains',
  oatmeal: 'grains',
  rusk: 'grains',
  toast: 'grains',
  // dairy
  γαλα: 'dairy',
  γιαουρτι: 'dairy',
  τυρι: 'dairy',
  φετα: 'dairy',
  ανθοτυρο: 'dairy',
  γραβιερα: 'dairy',
  κασερι: 'dairy',
  μυζηθρα: 'dairy',
  βουτυρο: 'dairy',
  κρεμα: 'dairy',
  milk: 'dairy',
  yogurt: 'dairy',
  cheese: 'dairy',
  feta: 'dairy',
  butter: 'dairy',
  cream: 'dairy',
  // produce
  μηλο: 'produce',
  μπανανα: 'produce',
  πορτοκαλι: 'produce',
  λεμονι: 'produce',
  ντοματα: 'produce',
  αγγουρι: 'produce',
  μαρουλι: 'produce',
  σπανακι: 'produce',
  καροτο: 'produce',
  κρεμμυδι: 'produce',
  σκορδο: 'produce',
  πατατα: 'produce',
  αρακας: 'produce',
  φραουλα: 'produce',
  αχλαδι: 'produce',
  ροδακινο: 'produce',
  σταφυλι: 'produce',
  καρπουζι: 'produce',
  πεπονι: 'produce',
  apple: 'produce',
  banana: 'produce',
  orange: 'produce',
  lemon: 'produce',
  tomato: 'produce',
  cucumber: 'produce',
  lettuce: 'produce',
  spinach: 'produce',
  carrot: 'produce',
  onion: 'produce',
  garlic: 'produce',
  potato: 'produce',
  pepper: 'produce',
  pear: 'produce',
  peach: 'produce',
  // protein
  κοτοπουλο: 'protein',
  γαλοπουλα: 'protein',
  ψαρι: 'protein',
  κρεας: 'protein',
  μοσχαρι: 'protein',
  χοιρινο: 'protein',
  αυγο: 'protein',
  σολομος: 'protein',
  τονος: 'protein',
  φακες: 'protein',
  φασολια: 'protein',
  ρεβιθια: 'protein',
  chicken: 'protein',
  turkey: 'protein',
  fish: 'protein',
  beef: 'protein',
  pork: 'protein',
  egg: 'protein',
  salmon: 'protein',
  tuna: 'protein',
  lentils: 'protein',
  beans: 'protein',
  chickpeas: 'protein',
  // other
  ελαιολαδο: 'other',
  ταχινι: 'other',
  μελι: 'other',
  κανελα: 'other',
  τσαι: 'other',
  καφες: 'other',
  ζαχαρη: 'other',
  αλατι: 'other',
  πιπερι: 'other',
  'olive oil': 'other',
  oil: 'other',
  honey: 'other',
  tahini: 'other',
  cinnamon: 'other',
  tea: 'other',
  coffee: 'other',
  sugar: 'other',
  salt: 'other',
};

export async function categorizeFoods(
  names: string[],
  dietitianId: string | null,
): Promise<Map<string, FoodCategory>> {
  const result = new Map<string, FoodCategory>();
  if (names.length === 0) return result;

  const distinctNorm = new Map<string, string>();
  for (const original of names) {
    const norm = normalizeFoodName(original);
    if (!norm || distinctNorm.has(norm)) continue;
    distinctNorm.set(norm, original);
  }
  const norms = [...distinctNorm.keys()];
  const resolved = new Map<string, FoodCategory>();

  if (dietitianId) {
    const { data: overrides } = await supabase
      .from('food_category_overrides')
      .select('item_name_normalized, category')
      .eq('dietitian_id', dietitianId)
      .in('item_name_normalized', norms);
    for (const o of overrides ?? []) resolved.set(o.item_name_normalized, o.category);
  }

  for (const norm of norms) {
    if (resolved.has(norm)) continue;
    const seed = SEED[norm];
    if (seed) resolved.set(norm, seed);
  }

  const missing = norms.filter((n) => !resolved.has(n));
  if (missing.length > 0) {
    const { data: cached } = await supabase
      .from('food_categories')
      .select('item_name_normalized, category')
      .in('item_name_normalized', missing);
    for (const c of cached ?? []) resolved.set(c.item_name_normalized, c.category);
  }

  for (const [norm, original] of distinctNorm) {
    result.set(original, resolved.get(norm) ?? 'other');
  }
  return result;
}
