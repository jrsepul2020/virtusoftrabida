/**
 * useRoleAccess Hook
 * Provides role-based access control utilities
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Usuario } from '../lib/supabase';

export type UserRole = 'Administrador' | 'Presidente' | 'Supervisor' | 'Catador';

export interface RoleData {
  rol: UserRole;
  mesa?: number;
  tandaencurso?: number;
}

export function useRoleAccess() {
  const [roleData, setRoleData] = useState<RoleData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoleData();
  }, []);

  const loadRoleData = async () => {
    try {
      const stored = localStorage.getItem('userRoleData');
      if (stored) {
        setRoleData(JSON.parse(stored));
        setLoading(false);
        return;
      }

      // Fetch from database if not in localStorage
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('usuarios')
        .select('rol, mesa, tandaencurso')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading role data:', error);
        setLoading(false);
        return;
      }

      const roleData: RoleData = {
        rol: data.rol as UserRole,
        mesa: data.mesa,
        tandaencurso: data.tandaencurso,
      };

      setRoleData(roleData);
      localStorage.setItem('userRoleData', JSON.stringify(roleData));
    } catch (error) {
      console.error('Error in loadRoleData:', error);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = () => {
    return roleData?.rol === 'Administrador' || 
           roleData?.rol === 'Presidente' || 
           roleData?.rol === 'Supervisor';
  };

  const isPresidente = () => {
    return roleData?.rol === 'Presidente';
  };

  const isCatador = () => {
    return roleData?.rol === 'Catador';
  };

  const hasRole = (roles: UserRole[]) => {
    return roleData ? roles.includes(roleData.rol) : false;
  };

  return {
    roleData,
    loading,
    isAdmin: isAdmin(),
    isPresidente: isPresidente(),
    isCatador: isCatador(),
    hasRole,
    refresh: loadRoleData,
  };
}
