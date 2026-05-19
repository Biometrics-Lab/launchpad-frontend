# CLAUDE.md

@/Users/romanvakulenko/runlife/claude-config/launchpad/CLAUDE.md

## Template docs

https://demos.themeselection.com/materio-mui-nextjs-admin-template/documentation/

## Commands

```bash
# Dev server (Turbopack)
npm run dev

# Production build
npm run build

# Lint / auto-fix
npm run lint
npm run lint:fix

# Format (Prettier)
npm run format

# Rebuild bundled Iconify CSS (required after adding new icon sets)
npm run build:icons
```

## Backend

This frontend is the UI for the `launchpad` Spring Boot backend (sibling directory `../launchpad/`).

- API base: `http://localhost:8080/api/v1/**`
- Auth: HTTP Basic — username `biolab`, password `biolab`
- No Swagger — read controllers at `../launchpad/src/.../web/controller/` directly (`@GetMapping`, `@PostMapping`, `@RequestBody` annotations define the contract)
- Error envelope: `{ status: number, message: string }`

## Architecture

### Route groups

| Group | Layout |
|---|---|
| `src/app/(dashboard)/` | Full sidebar + navbar shell |
| `src/app/(blank-layout-pages)/` | No chrome (login, 404) |

### Page → View split

Pages in `src/app/(dashboard)/[route]/page.tsx` are thin Server Components — they fetch data and hand it to a View. All UI logic lives in `src/views/`.

### Layout system

`LayoutWrapper` (`src/@layouts/`) switches between `VerticalLayout` and `HorizontalLayout` at runtime based on a cookie. Theme settings (mode, skin, layout, navbar style, etc.) are **cookie-driven** — changes to `src/configs/themeConfig.ts` won't be visible until the cookie `materio-mui-next-demo` is cleared or the Customizer is reset.

Provider tree (applied in `src/components/Providers.tsx`):
`VerticalNavProvider` → `SettingsProvider` → `ThemeProvider`

### Path aliases

| Alias | Resolves to |
|---|---|
| `@/` | `src/` |
| `@core/` | `src/@core/` |
| `@layouts/` | `src/@layouts/` |
| `@menu/` | `src/@menu/` |
| `@assets/` | `src/assets/` |
| `@components/` | `src/components/` |
| `@configs/` | `src/configs/` |
| `@views/` | `src/views/` |

### Navigation

Menu items are hardcoded as JSX in `src/components/layout/vertical/VerticalMenu.tsx`. The `src/data/navigation/` files exist but are not wired up. Add new sidebar entries directly to `VerticalMenu.tsx`. Icons use Remix Icon keys (`ri-*`).

### Tables

TanStack React Table (`useReactTable`) with fuzzy filtering via `@tanstack/match-sorter-utils`. Standard setup: `createColumnHelper`, `getCoreRowModel`, `getFilteredRowModel`, `getSortedRowModel`, `getPaginationRowModel`. See `src/views/assessments/players/PlayersTable.tsx` as the reference pattern.

### Forms

`react-hook-form` with `Controller` for validated fields. Side-panel add/edit forms use MUI `Drawer` (right-anchored, `PerfectScrollbar` inside). See `src/views/assessments/measurements/AddMeasurementDrawer.tsx`.

### Icons

Use Remix Icons: `<i className='ri-icon-name' />`. The CSS bundle is at `src/assets/iconify-icons/generated-icons.css` (auto-imported in root layout). Run `npm run build:icons` only when adding a new icon family.

### Domain types

Defined in `src/types/app/` and `src/types/menuTypes.ts`. Core backend-aligned types:

```ts
PlayerType      { id, name, graduationYear, team?, dob? }
TeamType        { id, name, sport, description, Organisation? }
OrganisationType { id, name }
MeasurementType { id, name }
```

