# DietPlan Mobile — Phase 1 Plan (Client-only)

## Context

`georgeok/dietplan` is a production Next.js 16 + Supabase web app that connects dietitians with clients. Clients receive invitations, then use a 4-screen portal to track meals, weight, shopping, and settings. The companion repo `georgeok/dietplan_mobile` is empty.

This plan ports the **client-facing portion** of the web app to a React Native mobile app. Sign-up is intentionally excluded — clients on mobile are invitation-only, just like on the web. Phase 1 covers only client functionality; once the user has tested it on a real device via Expo Go and approved, Phase 2 (dietitian screens) will be planned separately.

The styling, terminology, and UX must visually match the web app (oklch palette, emerald/lime accents, Inter font, 0.625rem-base radius scale, status pill colors). The Supabase backend is reused as-is; mobile talks to it directly with the user's JWT under the existing RLS policies. Two new security-definer RPCs are added (covered below) so the mobile binary doesn't need a service-role key.

User decisions:
- Add the RPCs to dietplan repo via a new migration
- Full parity with web for tick UX (status + alternatives + ingredients + note + photo)
- Greek + English from day one
- Test via Expo Go on real devices (no EAS / TestFlight / Play this phase)

---

## Stack

| Concern | Choice |
|---|---|
| Framework | Expo SDK 54+ (managed) |
| Routing | Expo Router v4 (file-based) |
| Styling | NativeWind v4 (CSS vars + oklch directly from web's `globals.css`) |
| Server state | TanStack Query v5 |
| Auth/DB client | `@supabase/supabase-js` v2 (with expo-secure-store adapter) |
| Forms / validation | react-hook-form + zod (matches web) |
| i18n | i18next + react-i18next + expo-localization |
| Charts (weight) | victory-native v40 (Skia) |
| Bottom sheets | `@gorhom/bottom-sheet` |
| Toasts | sonner-native |
| Icons | lucide-react-native |
| Image picker / upload | expo-image-picker → Supabase Storage |
| Auth deep-link | expo-linking + expo-web-browser + expo-auth-session |
| Secure token storage | expo-secure-store |

All chosen libraries are Expo Go compatible (no custom native code).

---

## Repository layout (to create on branch `claude/plan-diet-mobile-app-rEDfJ`)

```
dietplan_mobile/
├── app.json, eas.json, package.json, tsconfig.json
├── babel.config.js, metro.config.js
├── tailwind.config.ts, global.css, nativewind-env.d.ts
├── .env.example, .gitignore
├── assets/{icon,splash,adaptive-icon}.png
└── src/
    ├── app/                          # Expo Router routes
    │   ├── _layout.tsx               # Root providers
    │   ├── index.tsx                 # Boot redirect
    │   ├── (auth)/_layout.tsx
    │   ├── (auth)/sign-in.tsx
    │   ├── (auth)/account-archived.tsx
    │   ├── auth/callback.tsx         # Magic-link + OAuth landing
    │   ├── (client)/_layout.tsx      # Tabs + role guard
    │   ├── (client)/week.tsx
    │   ├── (client)/weight.tsx
    │   ├── (client)/shopping.tsx
    │   └── (client)/settings.tsx
    ├── components/
    │   ├── ui/                       # Button, Input, Card, Badge, EmptyState, PageHeader
    │   ├── auth/SignInForm.tsx
    │   └── client/                   # CombinedDayCard, DayPager, DaySelector,
    │                                 # MealSection, TickSheet, MealNoteInput,
    │                                 # DailyMacrosRow, TrackAllButton,
    │                                 # UpcomingPlanBanner, ComplianceRing, StatusPill,
    │                                 # MealIcon, ShoppingPanel, ShoppingRow,
    │                                 # ShoppingPlanTabs, WeightChart, WeightStatCard,
    │                                 # LogWeightForm, DeleteWeightButton, SettingsForm,
    │                                 # LocalePicker, TimezonePicker, ExportDataButton,
    │                                 # DeleteAccountButton, LogoutButton
    ├── lib/
    │   ├── supabase.ts               # Singleton client + SecureStore adapter
    │   ├── database.types.ts         # Copied verbatim from web
    │   ├── auth/role.ts              # Ported getCurrentRole (client-side)
    │   ├── plans/                    # cycle.ts, snapshot.ts, macros.ts, compliance.ts,
    │   │                             # shopping.ts, normalize.ts, lifecycle.ts, kcal.ts
    │   │                             # — copied verbatim from web (replace node:crypto)
    │   ├── plans/categorize.ts       # Mobile rewrite: seed dict + cached read, no Gemini
    │   ├── theme/colors.ts           # oklch→hex fallback for chart/status-bar libs
    │   ├── deeplink.ts               # Linking.createURL helpers
    │   └── format.ts                 # Date/number formatters (locale-driven)
    ├── hooks/                        # one file per query/mutation (see §6)
    ├── i18n/{index.ts, el.json, en.json}   # Filtered subset of web messages
    └── providers/{AuthProvider, QueryProvider, ThemeProvider, I18nProvider}.tsx
```

---

## Theme — match the web exactly

`global.css` is a near-verbatim copy of `dietplan/src/app/globals.css`. NativeWind v4 supports CSS vars and `oklch()`, so the same `--background / --foreground / --primary / ...` block works.

`tailwind.config.ts` maps tokens to Tailwind colors (`bg-background`, `text-muted-foreground`, etc.) and the radius scale (`rounded-2xl` = 18px from `calc(var(--radius) * 1.8)`).

`src/lib/theme/colors.ts` holds pre-computed hex equivalents for libraries that can't read CSS vars (victory-native chart strokes, expo-status-bar, splash/icon background).

ThemeProvider wraps the tree with `className="dark"` based on Appearance + AsyncStorage override, matching the web's dark mode toggle.

---

## Auth flow

### Supabase client (`src/lib/supabase.ts`)
Singleton `createClient<Database, "dp">` configured with:
- `db.schema = "dp"` (same as web)
- `auth.storage = ExpoSecureStoreAdapter` (encrypted JWT on device)
- `auth.detectSessionInUrl = false` (we route deep-links manually)
- `autoRefreshToken: true`, `persistSession: true`

### Magic link
1. `SignInForm` → `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: Linking.createURL("auth/callback") } })`. **In Expo Go this is `exp://<dev-host>:8081/--/auth/callback`; that URL must be added to Supabase Auth > URL Configuration > Redirect URLs.**
2. User taps email link → app opens at `app/auth/callback.tsx`.
3. Callback parses `code` (PKCE) or `token_hash`+`type` and calls either `exchangeCodeForSession` or `verifyOtp`.
4. Calls new RPC `dp.bind_invited_client(p_email)` to bind first-time invitees (replaces web's service-role update).
5. Resolves role via `getCurrentRole()` and `router.replace`s to `/(client)/week` | `/(auth)/account-archived` | `/(auth)/sign-in?error=no_invitation_found`.

### Google OAuth
`supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo, skipBrowserRedirect: true } })` → `WebBrowser.openAuthSessionAsync(data.url, redirectTo)`. The returned `?code=...` is handled by the same callback screen. Reuses Supabase's existing Google client (no new native config).

### Dietitian on mobile (Phase 1)
If `getCurrentRole()` returns `dietitian`, the client tab layout redirects to `/(auth)/sign-in?error=client_only_app`. Phase 1 explicitly blocks dietitians from the mobile app.

### Account-archived
`(client)/_layout.tsx` redirects archived clients to `/(auth)/account-archived`, which displays the explanatory message + a logout button.

---

## Backend additions (in `dietplan` repo, not mobile)

One additive migration `dietplan/supabase/migrations/<ts>_mobile_rpc_helpers.sql`:

1. `dp.bind_invited_client(p_email text) RETURNS void` — security-definer; finds `dp.clients` row with matching email and NULL `user_id`, sets `user_id = auth.uid()` and `activated_at = now()`. Granted to `authenticated`. Mirrors web `/auth/callback` logic.
2. `dp.delete_my_client_account() RETURNS void` — security-definer; anonymizes the calling user's `dp.clients` row (placeholder email/name, `archived_at = now()`) and calls `auth.users` delete via the `service_role` privilege the function inherits. Granted to `authenticated`.

The web flow is unchanged. The mobile app calls these RPCs instead of needing a service-role key.

---

## Data access — replacing server actions with TanStack Query hooks

### Pure helper reuse (verbatim copy)
Files in web `src/lib/plans/` are pure: `cycle.ts`, `snapshot.ts`, `macros.ts`, `compliance.ts`, `shopping.ts`, `normalize.ts`, `lifecycle.ts`, `kcal.ts`. Copy unchanged. Only swap: `import { randomUUID } from "node:crypto"` → `import { randomUUID } from "expo-crypto"` in `snapshot.ts`. `categorize.ts` is rewritten to drop the `server-only` import and Gemini fallback — mobile uses seed dict + cached read of `dp.food_categories`, returns `"other"` if uncached.

### Query keys + invalidation
| Hook | Key | Invalidates |
|---|---|---|
| `useClientProfile(clientId)` | `["clientProfile", clientId]` | — |
| `useActivePlan(clientId)` | `["activePlan", clientId]` | by useTickItem, useTrackAllUntracked |
| `useTicks(planId)` | `["ticks", planId]` | by tick mutations |
| `useMealNotes(planId)` | `["mealNotes", planId]` | by useSetMealNote |
| `useWeightLogs(clientId)` | `["weightLogs", clientId]` | by useLogWeight, useDeleteWeight |
| `useShoppingList(planId)` | `["shoppingList", planId]` | by tick mutations, useToggleShoppingOverride |
| `useShoppingOverrides(clientId)` | `["shoppingOverrides", clientId]` | by useToggleShoppingOverride |
| `useFoodCategories(dietitianId, names)` | `["foodCategories", names]` | — |

Mutations: `useTickItem`, `useClearTick`, `useTrackAllUntracked`, `useSetMealNote`, `useLogWeight`, `useDeleteWeight`, `useToggleShoppingOverride`, `useUpdateProfile`, `useExportData`, `useDeleteAccount`, `useSignOut`, `useSetLastViewedDay`, `usePickAndUploadPhoto`.

48-hour edit window enforced both client-side (`isDateEditable(cycleDayDateISO, tz)` from `lifecycle.ts`) and by existing RLS server-side.

### Image upload (full parity)
`expo-image-picker` → optional `expo-image-manipulator` resize to ≤1280px → `supabase.storage.from("tick-photos").upload(path, blob)`. Path scheme matches web: `<client_plan_id>/<cycle_day>/<recipe_id>-<timestamp>.jpg`. Tick row's `photo_url` updated in same mutation.

### Data export
Phase 1 doesn't reuse the web's `/api/me/export`. Instead `useExportData` runs the same Supabase queries client-side, builds the JSON in memory, writes to `expo-file-system` cache, then `Sharing.shareAsync(uri)` opens the native share sheet.

---

## Screen-by-screen

### `/(auth)/sign-in`
- `SignInForm`: email Input → Continue button (magic link); separator; Continue with Google button.
- After magic-link send: success card "Check your inbox".
- Errors via sonner-native toasts.

### `/(auth)/account-archived`
- Static message + Logout button.

### `/(client)/_layout.tsx` (tabs)
- Bottom tabs (Week / Weight / Shopping / Settings) using lucide icons.
- Active tab styling matches web: emerald-700 / dark:emerald-400 text + thin gradient bar.
- Role guard at the top: `anonymous → /sign-in`, `archived_client → /account-archived`, `dietitian → /sign-in?error=client_only_app`.

### `/(client)/week.tsx` (the heart of the app)
- `useClientProfile`, `useActivePlan`, `useTicks`, `useMealNotes`.
- Components: `UpcomingPlanBanner`, `DaySelector` (horizontal pill row, auto-scrolls to selected, compliance dots), `DayPager` (horizontal FlatList with `pagingEnabled` + snap), `CombinedDayCard` (gradient header + ComplianceRing + DailyMacrosRow + TrackAllButton + collapsible `MealSection`s), `TickSheet` (`@gorhom/bottom-sheet`, snapPoints `["55%","90%"]`), `MealNoteInput` (modal sheet).
- Inline tap on status pill: cycles `null → eaten → skipped → null`; long-press (200ms, haptic) opens TickSheet.
- TickSheet contains: status row, alternative picker, ingredient checklist (auto-derives partial), note textarea, photo button (camera/library action sheet), Save/Clear/Cancel.
- 48h read-only state: dim card, disable buttons, banner at top.

### `/(client)/weight.tsx`
- `WeightStatCard`: current kg, delta badge, days elapsed, start date.
- `WeightChart`: victory-native CartesianChart Line. Empty state if <2 entries.
- `LogWeightForm`: RHF + zod, decimal-pad keyboard.
- History list with `Swipeable` swipe-to-delete row (`react-native-gesture-handler`).

### `/(client)/shopping.tsx`
- Segmented control (current / next plan tabs) — only shown when both exist.
- `ShoppingPanel` groups by category (produce/dairy/grains/protein/other), each with colored dot + count.
- "Already have" toggle on each row → moves to collapsed bottom section.
- Print button replaced with **Share** button: builds plain text shopping list and calls `Share.share({ message })`.

### `/(client)/settings.tsx`
- `SettingsForm`: name input, locale picker (el/en), timezone picker (common EU + en zones modal, with manual entry fallback).
- `ExportDataButton` → `useExportData`.
- `DeleteAccountButton` → confirmation alert → `useDeleteAccount` (calls RPC).
- `LogoutButton` → `supabase.auth.signOut()` → `/(auth)/sign-in`.
- PWA install card from web is dropped (irrelevant on a real native app).

---

## i18n

`src/i18n/{el,en}.json` are filtered copies of the web messages, keeping only:
- `auth.*`, `common.*`
- `nav.*`
- `clientToday.*`, `clientPlan.*`, `clientWeight.*`, `clientShopping.*`
- `settings.*`, `accountArchived.*`

Marketing/landing/legal/dietitian keys excluded — keeps bundle size down.

i18next init: device locale via `expo-localization`, override key `app.locale` in AsyncStorage, fallback `el` to match web. Settings locale change writes `clients.locale` (server) + AsyncStorage (cold-start) + `i18next.changeLanguage()` (live UI).

---

## Critical files to create

Listed in build order. Stage A bootstraps Expo + theme; Stage B brings auth alive; Stage C copies pure helpers; Stages D–F implement the four client screens.

### Stage A — Bootstrap
- `dietplan_mobile/package.json`, `app.json`, `eas.json`, `tsconfig.json`
- `dietplan_mobile/babel.config.js`, `metro.config.js`
- `dietplan_mobile/tailwind.config.ts`, `global.css`, `nativewind-env.d.ts`
- `dietplan_mobile/.env.example`, `.gitignore`, `assets/*`
- `dietplan_mobile/src/app/_layout.tsx`, `src/app/index.tsx`

### Stage B — Auth + Backend RPCs
- `dietplan_mobile/src/lib/supabase.ts`
- `dietplan_mobile/src/lib/database.types.ts`
- `dietplan_mobile/src/lib/auth/role.ts`
- `dietplan_mobile/src/lib/deeplink.ts`
- `dietplan_mobile/src/providers/{AuthProvider,QueryProvider,ThemeProvider,I18nProvider}.tsx`
- `dietplan_mobile/src/i18n/{index.ts,el.json,en.json}`
- `dietplan_mobile/src/app/(auth)/{_layout,sign-in,account-archived}.tsx`
- `dietplan_mobile/src/app/auth/callback.tsx`
- `dietplan_mobile/src/components/auth/SignInForm.tsx`
- `dietplan_mobile/src/components/ui/{Button,Input,Label,Card,Badge,EmptyState,PageHeader}.tsx`
- `dietplan/supabase/migrations/<ts>_mobile_rpc_helpers.sql` ← **only file in the web repo**

### Stage C — Pure helpers + tab shell
- `dietplan_mobile/src/lib/plans/{cycle,snapshot,macros,compliance,shopping,normalize,lifecycle,kcal,categorize}.ts`
- `dietplan_mobile/src/lib/theme/colors.ts`, `format.ts`
- `dietplan_mobile/src/app/(client)/_layout.tsx`
- `dietplan_mobile/src/hooks/{useSession,useRole,useClientProfile}.ts`

### Stage D — Week screen
- `dietplan_mobile/src/app/(client)/week.tsx`
- `dietplan_mobile/src/components/client/{CombinedDayCard,DayPager,DaySelector,MealSection,TickSheet,MealNoteInput,DailyMacrosRow,TrackAllButton,UpcomingPlanBanner,ComplianceRing,StatusPill,MealIcon}.tsx`
- `dietplan_mobile/src/hooks/{useActivePlan,useTicks,useMealNotes,useTickItem,useClearTick,useTrackAllUntracked,useSetMealNote,usePickAndUploadPhoto,useSetLastViewedDay}.ts`

### Stage E — Weight + Shopping
- `dietplan_mobile/src/app/(client)/{weight,shopping}.tsx`
- `dietplan_mobile/src/components/client/{WeightChart,WeightStatCard,LogWeightForm,DeleteWeightButton,ShoppingPanel,ShoppingRow,ShoppingPlanTabs,ShoppingShareButton}.tsx`
- `dietplan_mobile/src/hooks/{useWeightLogs,useLogWeight,useDeleteWeight,useShoppingList,useFoodCategories,useShoppingOverrides,useToggleShoppingOverride}.ts`

### Stage F — Settings
- `dietplan_mobile/src/app/(client)/settings.tsx`
- `dietplan_mobile/src/components/client/{SettingsForm,LocalePicker,TimezonePicker,ExportDataButton,DeleteAccountButton,LogoutButton}.tsx`
- `dietplan_mobile/src/hooks/{useUpdateProfile,useExportData,useDeleteAccount,useSignOut}.ts`
- `dietplan_mobile/README.md`

### Reference files (web app, do not modify)
- `dietplan/src/app/globals.css` — design tokens
- `dietplan/src/lib/plans/snapshot.ts` — verbatim port target
- `dietplan/src/app/[locale]/client/_actions.ts` — every mutation we replicate
- `dietplan/src/app/auth/callback/route.ts` — the auth flow we mirror
- `dietplan/src/components/client/tick-action-sheet.tsx` — most complex UI to translate

---

## Verification (manual end-to-end via Expo Go)

Pre-reqs:
- `npm install -g expo`, install Expo Go on iOS/Android device on the same Wi-Fi.
- Add the dev URL `exp://<host>:8081/--/auth/callback` to Supabase Auth > URL Configuration > Redirect URLs (alongside the production web URL).
- `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` set in `.env`.
- Run the migration in `dietplan/supabase/migrations/` against the Supabase project.

Test plan as an invited client (from a dietitian web session):
1. `npx expo start` → scan QR with Expo Go.
2. Receive the invitation email on the test device → tap the magic link → app opens via custom scheme → lands on `/(client)/week`. (If the link bounces to Safari instead of Expo Go, verify the redirect URL was added to Supabase config.)
3. On Week tab: swipe between days, expand a meal, tap inline tick → eaten with green pill + haptic.
4. Open TickSheet for a recipe with alternatives + ingredients: pick alternative, mark partial, check 2 of 4 ingredients, add note, attach photo (camera or library), Save. Re-open sheet → values persist.
5. Tap a meal-note input, save text, kill app, reopen → note still there.
6. "Track all untracked" → all remaining items eaten; macro row updates.
7. Weight tab: log 75.4 kg → appears in chart; swipe-delete works; re-log.
8. Shopping tab: see categorized list; toggle "already have" → moves to bottom; tap Share → native share sheet shows formatted plain-text list.
9. If dietitian has scheduled an upcoming plan, switch tabs and verify items differ.
10. Settings: change locale el→en → UI re-renders English; save name; save timezone.
11. Settings: Export data → share sheet with `dietplan-export.json`; open it; verify `clients`, `client_plans`, `ticks`, `weight_logs`, `meal_notes` arrays present.
12. Logout → land on sign-in. Continue with Google → land on `/(client)/week`.
13. As dietitian on web: archive this client. Reopen mobile → land on `/(auth)/account-archived`.
14. 48-hour window check: in DB, set a tick's `eaten_at` to 49 hours ago, reopen day → buttons disabled, read-only banner shown.

If all 14 checks pass, Phase 1 is done. Then we plan and build Phase 2 (dietitian portal).

---

## Out of Phase 1 scope (do not implement)

- Dietitian portal (dashboard, clients, templates, recipes, dietitian settings) — Phase 2.
- Sign-up flow of any kind on mobile.
- Push notifications.
- Offline mode / queueing.
- EAS Build / TestFlight / Play Internal release pipelines (testing only via Expo Go this phase).
- PWA install hint card (irrelevant for native).
- Web's print-to-PDF shopping list (replaced by native share).
- Gemini food categorization (read cache only; dietitian's web session populates).