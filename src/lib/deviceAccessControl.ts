/**
 * Device Access Control Service
 * Handles device registration, validation, and access control
 */

import { supabase } from './supabase';
import { getOrCreateFingerprint, getDeviceInfo, clearDeviceFingerprint } from './deviceFingerprint';
import type { Device, Usuario } from './supabase';

export type DeviceAccessResult = {
  allowed: boolean;
  device?: Device;
  reason?: string;
};

export type UserRoleData = {
  user: Usuario;
  device: Device;
};

/**
 * Checks if device is registered and active
 * Includes first admin login bypass for system bootstrapping
 */
export async function checkDeviceAccess(userId: string): Promise<DeviceAccessResult> {
  try {
    // Ensure fingerprint is generated and stored first
    const fingerprint = await getOrCreateFingerprint();
    
    // Check if device exists
    const { data: device, error } = await supabase
      .from('dispositivos')
      .select('*')
      .eq('device_fingerprint', fingerprint)
      .maybeSingle();

    if (error) {
      console.error('Error checking device:', error);
      return { allowed: false, reason: 'Error al verificar dispositivo' };
    }

    // Device not registered
    if (!device) {
      // ===== FIRST ADMIN LOGIN BYPASS =====
      // Check if there are ANY active devices in the system
      // If none exist, this is the first login - auto-approve as admin
      const { data: activeDevices, error: countError } = await supabase
        .from('dispositivos')
        .select('id', { count: 'exact', head: true })
        .eq('activo', true);

      if (countError) {
        console.error('Error checking active devices:', countError);
      }

      const isFirstDevice = !countError && (!activeDevices || activeDevices.length === 0);

      if (isFirstDevice) {
        console.log('🎉 FIRST ADMIN LOGIN BYPASS: No active devices found, auto-approving...');
        
        // Auto-register device as ACTIVE with admin privileges
        const deviceInfo = getDeviceInfo();
        const { data: newDevice, error: insertError } = await supabase
          .from('dispositivos')
          .insert({
            device_fingerprint: fingerprint,
            user_id: userId,
            device_info: deviceInfo,
            activo: true, // Auto-approve first device
            tablet_number: 1, // Assign first tablet number
            nombre_asignado: 'Admin Primer Login',
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error registering first admin device:', insertError);
          return { allowed: false, reason: 'Error al registrar dispositivo de administrador' };
        }

        // Ensure user has admin role in usuarios table
        // First check if user exists
        const { data: existingUser } = await supabase
          .from('usuarios')
          .select('id, rol')
          .eq('id', userId)
          .single();

        if (existingUser) {
          // Update existing user to admin
          const { error: userUpdateError } = await supabase
            .from('usuarios')
            .update({ rol: 'Administrador', activo: true })
            .eq('id', userId);

          if (userUpdateError) {
            console.warn('Warning: Could not update user role to Administrador:', userUpdateError);
          } else {
            console.log('✅ Updated existing user to Administrador role');
          }
        } else {
          // Get user email from auth
          const { data: { user: authUser } } = await supabase.auth.getUser();
          
          // Create new user record as admin
          const { error: userInsertError } = await supabase
            .from('usuarios')
            .insert({
              id: userId,
              email: authUser?.email || '',
              rol: 'Administrador',
              activo: true,
            });

          if (userInsertError) {
            console.warn('Warning: Could not create user as Administrador:', userInsertError);
          } else {
            console.log('✅ Created new user with Administrador role');
          }
        }

        console.log('✅ First admin device registered and activated:', newDevice.id);
        return { allowed: true, device: newDevice };
      }
      // ===== END FIRST ADMIN LOGIN BYPASS =====

      // Normal flow: register device but require admin approval
      const deviceInfo = getDeviceInfo();
      const { data: newDevice, error: insertError } = await supabase
        .from('dispositivos')
        .insert({
          device_fingerprint: fingerprint,
          user_id: userId,
          device_info: deviceInfo,
          activo: false, // Needs admin approval
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error registering device:', insertError);
        return { allowed: false, reason: 'Error al registrar dispositivo' };
      }

      return {
        allowed: false,
        device: newDevice,
        reason: 'Dispositivo pendiente de aprobación por el administrador',
      };
    }

    // Device exists but not active
    if (!device.activo) {
      return {
        allowed: false,
        device,
        reason: 'Dispositivo no autorizado. Contacta al administrador.',
      };
    }

    // Update last_seen
    await supabase
      .from('dispositivos')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', device.id);

    // Device is active
    return { allowed: true, device };
  } catch (error) {
    console.error('Error in checkDeviceAccess:', error);
    return { allowed: false, reason: 'Error al validar acceso' };
  }
}

/**
 * Loads user role and related data
 */
export async function loadUserRole(userId: string): Promise<UserRoleData | null> {
  try {
    const fingerprint = await getOrCreateFingerprint();

    // Get user data
    const { data: user, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (userError || !user) {
      console.error('❌ Error loading user:', {
        code: userError?.code,
        message: userError?.message,
        details: userError?.details,
        hint: userError?.hint
      });
      return null;
    }

    // Get device data (optional in bypass mode)
    const { data: device, error: deviceError } = await supabase
      .from('dispositivos')
      .select('*')
      .eq('device_fingerprint', fingerprint)
      .eq('user_id', userId)
      .maybeSingle();

    if (deviceError) {
      console.error('❌ Error loading device:', {
        code: deviceError?.code,
        message: deviceError?.message,
        details: deviceError?.details
      });
    }

    // In bypass mode, device may not exist - return user only
    if (!device) {
      console.warn('⚠️ No device found for user, creating mock device');
      return {
        user,
        device: {
          id: 'mock-device',
          device_fingerprint: fingerprint,
          user_id: userId,
          activo: true,
          first_registered_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        } as any
      };
    }

    return { user, device };
  } catch (error) {
    console.error('Error in loadUserRole:', error);
    return null;
  }
}

/**
 * Forces logout and clears device fingerprint
 */
export async function forceLogoutAndClearDevice(): Promise<void> {
  try {
    await supabase.auth.signOut();
    clearDeviceFingerprint();
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('userRole');
  } catch (error) {
    console.error('Error during logout:', error);
  }
}

/**
 * Validates if current device fingerprint matches stored one
 * If changed, forces logout
 */
export async function validateDeviceConsistency(): Promise<boolean> {
  try {
    const currentFingerprint = await getOrCreateFingerprint();
    const storedFingerprint = localStorage.getItem('virtus_device_fingerprint');

    if (storedFingerprint && storedFingerprint !== currentFingerprint) {
      console.warn('Device fingerprint changed, forcing logout');
      await forceLogoutAndClearDevice();
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error validating device consistency:', error);
    return false;
  }
}
