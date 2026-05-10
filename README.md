# DietPlan Mobile

React Native (Expo) port of the **client-facing** part of the DietPlan web app
(`georgeok/dietplan`). Phase 1 scope: client login, meal-plan tracking, weight
logging, shopping list, settings. No sign-up (clients are invitation-only),
no dietitian screens (Phase 2).

## Stack

- Expo SDK 54 + Expo Router v4 (file-based routes under `src/app/`)
- NativeWind v4 — design tokens ported verbatim from the web's `globals.css`
- TanStack Query v5 for server state; mutations invalidate query keys instead
  of the web's `revalidatePath`
- `@supabase/supabase-js` v2 talking directly to the existing Supabase backend
  (RLS-protected; no service-role key on device)
- i18next + expo-localization (Greek default + English)
- victory-style SVG weight chart, `@gorhom/bottom-sheet` tick sheet

## Setup

```bash
npm install
cp .env.example .env   # fill in EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
npx expo start
```

Scan the QR code with **Expo Go** on a physical iOS/Android device.

### Backend prerequisites

1. Apply the migration `supabase/migrations/20260509000000_mobile_rpc_helpers.sql`
   from the `dietplan` repo (PR #42) — it adds two security-definer RPCs:
   `bind_invited_client(email)` (invitation acceptance) and
   `delete_my_client_account()` (GDPR delete). The mobile binary cannot ship a
   service-role key, so these are the boundary.
2. In the Supabase dashboard → Authentication → URL Configuration → Redirect
   URLs, add the Expo Go dev URL so magic-link emails open the app:
   `exp://<your-lan-ip>:8081/--/auth/callback` (printed by `npx expo start`).
   Keep the production web URL there too.
3. A `tick-photos` storage bucket must exist with client read/write RLS
   (already present from the web app).

## Auth flow

- **Magic link**: `signInWithOtp({ emailRedirectTo: Linking.createURL('auth/callback') })`
  → user taps email link → `src/app/auth/callback.tsx` exchanges the code,
  calls `bind_invited_client`, resolves the role, and routes to `/(client)/week`.
- **Google OAuth**: `signInWithOAuth({ provider: 'google', skipBrowserRedirect: true })`
  + `WebBrowser.openAuthSessionAsync` → same callback screen.
- Sessions persist via `expo-secure-store` (falls back to AsyncStorage for
  tokens >2KB).
- Dietitian accounts are bounced from the mobile app (Phase 1 is client-only).

## Project layout

```
src/
  app/                 expo-router routes
    (auth)/            sign-in, account-archived
    auth/callback.tsx  deep-link landing
    (client)/          tabs: week, weight, shopping, settings
  components/ui/        Button, Input, Card, ...
  components/client/    DayCard, TickSheet, ShoppingPanel, WeightChart, ...
  hooks/               TanStack Query hooks (one per query/mutation)
  lib/plans/           pure helpers ported from web (snapshot, cycle, macros,
                       compliance, shopping, normalize) + mobile categorize
  lib/supabase.ts      singleton client
  i18n/                el.json / en.json
  providers/           Auth, Query, Theme, I18n
```

## Notes / known limitations (Phase 1, Expo Go target)

- Magic-link deep links use the `exp://` scheme in Expo Go; for a production
  build you'd switch to the `dietplan://` scheme + universal links and use an
  EAS Build (out of Phase 1 scope).
- Food categorization on mobile is read-only: it consults the seed dictionary
  and the cached `dp.food_categories` rows the web app populates; anything
  uncached shows under "Other". No Gemini call from the device.
- Print-to-PDF (web) is replaced by the native share sheet on the shopping tab.
