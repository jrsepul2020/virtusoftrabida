# GitHub Copilot Instructions - International Virtus La Rábida

## Project Overview
Wine/olive oil competition management system with bilingual public inscription flow (ES/EN) and Spanish-only admin/taster dashboards. Stack: React + TypeScript + Vite + Supabase + Tailwind + Vercel serverless.

## Architecture Patterns

### Dual Inscription Flow
- **Public flow**: `UnifiedInscriptionForm` - 3-step wizard (empresa → muestras → confirmación) with localStorage auto-save (`STORAGE_KEY = 'virtus_inscription_draft'`)
- **Admin flow**: Same component with `isAdmin={true}` - enables manual code assignment (1-999 range) vs auto codes (1000-9999)
- Sample codes: Manual inscriptions get codes 1-999, auto inscriptions 1000-9999 via Supabase trigger `assign_muestra_codigo`

### I18n Pattern
- Custom provider in `src/lib/i18n.tsx` with `useI18n()` hook
- **Critical**: Admin/catador screens use ES only - do NOT add `t()` calls; public screens (inscription, landing, reglamento) are bilingual
- Add new keys to both `es` and `en` objects in `i18n.tsx` - structure: `'section.subsection.key'`

### Authentication & Roles
- Supabase Auth for admin/catador login (`LoginForm.tsx`)
- Role hierarchy: `Administrador` > `Presidente` > `Supervisor` > `Catador`
- **Admin access (production)**: Magic link system - URL `https://domain.com/?admin_token=SECRET` validates server-side and creates auto session (no manual login)
- Admin access alternatives: hash `#admin` shows traditional login; dev-only button in `Header` (visible via `import.meta.env.DEV`)
- Magic link endpoint: `api/admin-auth.ts` validates `ADMIN_ACCESS_TOKEN` and generates Supabase session via Service Role
- Creating admin users: Use `crear-admin.mjs` script or Supabase Dashboard (see `ACCESO_ADMIN.md`)
- No public auth - inscription is anonymous with email confirmation

### Form Validation
- Zod schemas in `src/lib/validationSchemas.ts` - extend existing schemas, don't duplicate
- Phone validation: permissive regex `/^[+()0-9\s.\-]{7,20}$/` (supports international formats)
- Category-conditional fields: `isAceite()` requires `tipo_aceituna`, `isVino()` requires `tipo_uva`, `requiresGrado()` checks if `grado_alcoholico` needed
- Email confirmation field required (separate from main email) - validated on step advance

### Data Flow
1. **Inscription**: `UnifiedInscriptionForm` → Supabase `empresas` + `muestras` → Brevo email via `api/send-inscription-email.ts`
2. **Tasting**: Catador logs in → `CatadorDashboard` → sees assigned `tandas` → `CataForm` → saves to `puntuaciones`
3. **Results**: Admin sees aggregated scores in `ResultadosPublicos` (medals assigned by average: >90 Oro, >85 Plata, >80 Bronce)

## Critical Workflows

### Development
```bash
npm run dev          # Vite dev server on :3000 (auto-switches if occupied)
npm run typecheck    # TSC validation (no emit)
npm test             # Vitest watch mode
```

### Database Queries
- Use `src/lib/supabaseQueries.ts` helpers - never raw SQL in components
- Example: `getAllCatadores()`, `getMuestrasByEmpresa(empresaId)`
- RLS enabled - queries auto-filtered by auth context

### Email System
- **Production**: Brevo API via `api/send-inscription-email.ts` (requires `BREVO_API_KEY`, `SENDER_EMAIL=info@internationalvirtus.es`)
- **Dev**: Mock endpoint in `dev-email-server.js` logs payload - no actual send
- Admin email subject: `Pedido ${pedido} - Nueva inscripción: ${empresa}` (pedido prepended per recent change)

### Serverless Functions (`api/`)
- TypeScript Vercel functions - auto-deployed from `api/*.ts`
- Rate limiting: in-memory map (5 req/min per IP) in `send-inscription-email.ts`
- Admin unlock: `admin-unlock.ts` validates `ADMIN_ACCESS_SECRET` header/body

## Component Conventions

### Screen Components
- Suffix `Screen` for wizard steps: `EmpresaScreen`, `MuestrasScreen` (props: `company`, `onChange`, `onNext`, `validationErrors`)
- Suffix `Manager` for CRUD dashboards: `CatadoresManager`, `MesasManager`
- Suffix `Dashboard` for role-specific home: `AdminDashboard`, `CatadorDashboard`

### State Management
- No global store - lift state to nearest common ancestor
- Form state in parent (e.g., `UnifiedInscriptionForm`), validation errors passed down
- `localStorage` for draft persistence - wrap in try/catch (Safari private mode fails)

### Modal Pattern
- Use `Modal.tsx` component - recently fixed to use `useId()` instead of random IDs (prevents React hydration errors)
- Props: `isOpen`, `onClose`, `title`, `message`, `type: 'error' | 'success' | 'info'`

### Styling
- Tailwind utility-first - avoid inline styles except dynamic values
- Primary color: `#66462e` (brown/olive theme), buttons use `from-primary-600 to-primary-700` gradients
- Responsive: mobile-first, use `sm:`, `md:`, `lg:` breakpoints
- Dev-only elements: wrap in `{import.meta.env.DEV ? ... : null}`

## Gotchas

### Sample Code Assignment
- Manual inscriptions: call `generateUniqueCode()` to find next available 1-999
- Auto inscriptions: leave `codigo` null - Supabase trigger assigns 1000+
- Never hard-code ranges - system assumes manual=1-999, auto=1000-9999

### Supabase Column Naming
- Database uses snake_case: `nombre_empresa`, `persona_contacto`
- Map to camelCase in forms: `company.nombre_empresa` (keep DB naming in state)
- Insert payloads use snake_case keys matching DB schema

### Email SENDER_EMAIL
- **Must** use `info@internationalvirtus.es` (not Gmail) - Brevo sender domain verified
- Local `.env.local` updated to use this - Vercel env must match
- SPF/DKIM configured in DNS (Strato) - Apple Mail warning resolved when DNS propagates

### Phone Input Pattern
- Split prefix (black box) + number inputs in `EmpresaScreen`
- Store as `+XX NNNNNN` in single field
- Handlers: `setTelefonoPrefijo()` and `setTelefonoNumero()` parse/rebuild

### Admin Button (Dev-Only)
- `Header.tsx` shows "Admin local" button only in `import.meta.env.DEV`
- Calls `localStorage.setItem('admin_unlocked', '1')` and reloads
- Production uses secret-protected `admin-unlock.html` page

## Testing
- Vitest for unit tests - colocate with components: `src/test/*.test.ts`
- `@testing-library/react` for component tests
- Run `npm test` before PRs - coverage tracked but not enforced

## Deployment
- Vercel auto-deploys `main` branch
- Environment variables: `BREVO_API_KEY`, `SENDER_EMAIL`, `ADMIN_ACCESS_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- PWA enabled - `public/sw.js` caches assets, `UpdateNotification.tsx` prompts on new version
