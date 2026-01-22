# Device-Based Access Control System

This document describes the secure device-based access control system with role-based UI implemented in the Virtus La Rábida application.

## Overview

The system ensures that users can only access the application from approved devices, with different UI views based on their assigned roles.

## Architecture

### 1. Device Fingerprinting (`src/lib/deviceFingerprint.ts`)

Generates a stable, unique fingerprint for each device using:
- User Agent
- Platform (OS)
- Screen dimensions (width, height, color depth)
- Timezone
- Browser language
- Hardware concurrency (CPU cores)

The fingerprint is hashed using SHA-256 and persisted in localStorage.

**Key Functions:**
- `getDeviceInfo()`: Collects device characteristics
- `generateDeviceFingerprint()`: Creates SHA-256 hash
- `getOrCreateFingerprint()`: Gets stored or generates new fingerprint
- `clearDeviceFingerprint()`: Clears stored fingerprint

### 2. Supabase Client with Fingerprint Header (`src/lib/supabase.ts`)

The Supabase client automatically injects the device fingerprint in all requests via the `x-device-fingerprint` header. This header is used for:
- Device registration
- Access validation
- Backend RLS policies

### 3. Device Access Control Service (`src/lib/deviceAccessControl.ts`)

Manages device registration, validation, and access control.

**Key Functions:**

#### `checkDeviceAccess(userId: string): Promise<DeviceAccessResult>`
- Checks if device is registered and active
- Auto-registers new devices with `activo=false` (needs admin approval)
- Updates `last_seen_at` timestamp for active devices
- Returns access status and reason

#### `loadUserRole(userId: string): Promise<UserRoleData | null>`
- Loads user role data from `usuarios` table
- Includes `rol`, `mesa`, and `tandaencurso` fields
- Used for role-based UI rendering

#### `validateDeviceConsistency(): Promise<boolean>`
- Validates if current fingerprint matches stored one
- Forces logout if fingerprint changed
- Prevents session hijacking

#### `forceLogoutAndClearDevice(): Promise<void>`
- Clears auth session
- Removes device fingerprint
- Clears localStorage state

## Database Schema

### `dispositivos` Table

```sql
CREATE TABLE public.dispositivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_fingerprint TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_info JSONB,
  nombre_asignado TEXT,
  activo BOOLEAN DEFAULT false,
  first_registered_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Columns:**
- `device_fingerprint`: SHA-256 hash of device characteristics (unique)
- `user_id`: Reference to authenticated user
- `device_info`: JSON object with device details (userAgent, platform, screen, etc.)
- `nombre_asignado`: Admin-assigned device name
- `activo`: Whether device is approved for access (default: false)
- `first_registered_at`: When device was first registered
- `last_seen_at`: Last activity timestamp
- `created_at`: Record creation timestamp

### Row Level Security (RLS)

**Policies:**
- **INSERT**: Users can insert their own devices
- **SELECT**: Users see their devices; admins see all
- **UPDATE**: Users update their last_seen; admins update all fields
- **DELETE**: Only admins can delete devices

See migration: `supabase/migrations/20260121_add_user_id_to_dispositivos.sql`

## Login Flow

### User Login Process (LoginForm.tsx)

1. **Authenticate with Supabase Auth**
   ```ts
   const { data: authData, error } = await supabase.auth.signInWithPassword({
     email, password
   });
   ```

2. **Check Device Access**
   ```ts
   const deviceAccess = await checkDeviceAccess(authData.user.id);
   ```
   
   Possible outcomes:
   - **New Device**: Auto-registers with `activo=false`, shows "Device pending approval"
   - **Inactive Device**: Shows "Device not authorized"
   - **Active Device**: Proceeds to step 3

3. **Load User Role**
   ```ts
   const roleData = await loadUserRole(authData.user.id);
   ```

4. **Store Role Data**
   ```ts
   localStorage.setItem('userRole', normalizedRole);
   localStorage.setItem('userRoleData', JSON.stringify({
     rol, mesa, tandaencurso
   }));
   ```

5. **Redirect Based on Role**
   - **Admin/Presidente/Supervisor**: AdminDashboard
   - **Catador**: CatadorDashboard

## Role-Based UI

### Roles Hierarchy
1. **Administrador** (highest privilege)
2. **Presidente**
3. **Supervisor**
4. **Catador** (lowest privilege)

### UI Components by Role

#### Admin Roles (Administrador, Presidente, Supervisor)
- Full AdminDashboard access
- Can manage dispositivos (approve/revoke devices)
- Can manage users, empresas, muestras, tandas, etc.

#### Catador Role
- CatadorDashboard only
- Can view assigned muestras
- Can submit puntuaciones
- Limited to assigned mesa

### Hook: `useRoleAccess`

Custom hook for role-based logic:

```tsx
import { useRoleAccess } from '../hooks/useRoleAccess';

function MyComponent() {
  const { roleData, isAdmin, isCatador, hasRole } = useRoleAccess();
  
  if (isAdmin) {
    // Admin-only features
  }
  
  if (hasRole(['Presidente', 'Supervisor'])) {
    // Specific role check
  }
}
```

## Admin Device Management

### DispositivosManager Component

Located in: `src/components/DispositivosManager.tsx`

**Features:**
- Lists all registered devices with details
- Shows device status (active/inactive)
- Displays user info and role
- Shows last_seen_at and first_registered_at timestamps
- Device info details (userAgent, platform, screen, timezone, fingerprint)

**Actions:**
- **Activate/Deactivate**: Toggle `activo` field
- **Delete**: Remove device (with confirmation)

**Access:**
Admin Dashboard → "Catas y Evaluaciones" → "Dispositivos"

## Session Management

### App.tsx Integration

On app initialization:
1. Get Supabase session
2. **Validate device consistency** (checks fingerprint hasn't changed)
3. Load user role
4. Redirect to appropriate dashboard

### Logout Flow
- Calls `supabase.auth.signOut()`
- Clears device fingerprint
- Removes localStorage auth state
- Redirects to home

## Security Features

### 1. Device Fingerprint Persistence
- Stored in localStorage
- Regenerated if missing or invalid
- Validated on every session check

### 2. Automatic Device Registration
- New devices auto-register on first login
- Default `activo=false` (needs approval)
- Stores device info for admin review

### 3. Fingerprint Change Detection
- Validates fingerprint consistency in App.tsx
- Forces logout if changed
- Prevents session hijacking from different device

### 4. RLS Backend Enforcement
- Database-level access control
- Users can only see/update their devices
- Admins have full access
- Prevents unauthorized data access

## Development Notes

### Testing Device Registration

1. **Clear fingerprint:**
   ```js
   localStorage.removeItem('virtus_device_fingerprint');
   ```

2. **Force new device:**
   - Clear fingerprint (above)
   - Logout
   - Login again (will create new device record)

3. **Check device info:**
   ```js
   import { getDeviceInfo } from './lib/deviceFingerprint';
   console.log(getDeviceInfo());
   ```

### Debugging

Enable console logs to track:
- Device fingerprint generation
- Access checks
- Role loading
- Session validation

Key log prefixes:
- `✅` Success
- `❌` Error
- `🔐` Auth events
- `📋` Data loading

## Migration Instructions

### Apply Database Migration

Run in Supabase SQL Editor:

```bash
# File: supabase/migrations/20260121_add_user_id_to_dispositivos.sql
```

This migration:
- Adds `user_id` column to `dispositivos`
- Creates index on `user_id`
- Enables RLS
- Creates access policies

### Verify Migration

```sql
-- Check table structure
\d dispositivos

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'dispositivos';
```

## Future Enhancements

Potential improvements:
- Device naming UI for users
- Device trust expiry (require re-approval after X days)
- Multi-factor authentication
- Device location tracking
- Suspicious device alerts
- Batch device approval
- Device usage analytics

## Troubleshooting

### Issue: User stuck in "Device pending approval"

**Solution:**
1. Admin logs in
2. Go to Dispositivos tab
3. Find user's device
4. Click "Activar"

### Issue: "Device fingerprint changed" error

**Cause:** Browser settings changed (e.g., timezone, language) or user switched browsers

**Solution:**
1. Device will auto-register as new
2. Admin must approve new device
3. Old device can be deactivated

### Issue: Can't access after login

**Checks:**
1. Verify device is active in `dispositivos` table
2. Check user has valid role in `usuarios` table
3. Verify RLS policies are enabled
4. Check browser console for errors

## API Reference

### deviceFingerprint.ts

```ts
getDeviceInfo(): DeviceInfo
generateDeviceFingerprint(): Promise<string>
storeFingerprint(fingerprint: string): void
getStoredFingerprint(): string | null
getOrCreateFingerprint(): Promise<string>
clearDeviceFingerprint(): void
validateDeviceFingerprint(): Promise<boolean>
```

### deviceAccessControl.ts

```ts
checkDeviceAccess(userId: string): Promise<DeviceAccessResult>
loadUserRole(userId: string): Promise<UserRoleData | null>
forceLogoutAndClearDevice(): Promise<void>
validateDeviceConsistency(): Promise<boolean>
```

### useRoleAccess Hook

```ts
interface UseRoleAccessReturn {
  roleData: RoleData | null;
  loading: boolean;
  isAdmin: boolean;
  isPresidente: boolean;
  isCatador: boolean;
  hasRole: (roles: UserRole[]) => boolean;
  refresh: () => Promise<void>;
}
```

## Conclusion

This device-based access control system provides:
- ✅ Secure device fingerprinting
- ✅ Automatic device registration
- ✅ Admin approval workflow
- ✅ Role-based UI rendering
- ✅ Session hijacking prevention
- ✅ Backend RLS enforcement
- ✅ Comprehensive device management

All requirements from the original specification have been implemented with production-ready code and clear separation of concerns.
