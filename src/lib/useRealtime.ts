/**
 * Hooks para suscripciones en tiempo real con Supabase
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from './supabase';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type ChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface RealtimeOptions {
  event?: ChangeEvent;
  filter?: string;
  enabled?: boolean;
}

interface RealtimeData<T> {
  data: T[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para suscribirse a cambios en tiempo real de una tabla
 */
export function useRealtimeTable<T extends { id: string }>(
  tableName: string,
  options: RealtimeOptions = {}
): RealtimeData<T> {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  const { event = '*', filter, enabled = true } = options;

  // Función para cargar datos iniciales
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      let query = supabase.from(tableName).select('*');
      
      if (filter) {
        const [column, value] = filter.split('=');
        query = query.eq(column.trim(), value.trim());
      }
      
      const { data: result, error: fetchError } = await query;
      
      if (fetchError) throw fetchError;
      setData(result as T[] || []);
      setError(null);
    } catch (err) {
      console.error(`Error fetching ${tableName}:`, err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [tableName, filter]);

  useEffect(() => {
    if (!enabled) return;

    // Cargar datos iniciales
    fetchData();

    // Configurar suscripción realtime
    const channel = supabase
      .channel(`${tableName}-changes`)
      .on(
        'postgres_changes',
        {
          event: event as any,
          schema: 'public',
          table: tableName,
          filter: filter,
        },
        (payload: RealtimePostgresChangesPayload<T>) => {
          console.log(`📡 Realtime ${tableName}:`, payload.eventType);
          
          setData(current => {
            switch (payload.eventType) {
              case 'INSERT':
                return [...current, payload.new as T];
              case 'UPDATE':
                return current.map(item => 
                  item.id === (payload.new as T).id ? (payload.new as T) : item
                );
              case 'DELETE':
                return current.filter(item => 
                  item.id !== (payload.old as { id: string }).id
                );
              default:
                return current;
            }
          });
        }
      )
      .subscribe((status) => {
        console.log(`📡 Suscripción ${tableName}: ${status}`);
      });

    channelRef.current = channel;

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [tableName, event, filter, enabled, fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

/**
 * Hook para suscribirse a presencia (usuarios conectados)
 */
export function useRealtimePresence(roomId: string = 'global') {
  const [users, setUsers] = useState<Map<string, { userId: string; lastSeen: string }>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const channel = supabase.channel(`presence-${roomId}`, {
      config: {
        presence: {
          key: 'user_id',
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const newUsers = new Map<string, { userId: string; lastSeen: string }>();
        
        Object.entries(state).forEach(([, presences]) => {
          (presences as any[]).forEach((presence: any) => {
            if (presence.userId) {
              newUsers.set(presence.userId, {
                userId: presence.userId,
                lastSeen: presence.lastSeen || new Date().toISOString(),
              });
            }
          });
        });
        
        setUsers(newUsers);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('👋 Usuario conectado:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('👋 Usuario desconectado:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          
          // Trackear usuario actual
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            await channel.track({
              userId: session.user.id,
              lastSeen: new Date().toISOString(),
            });
          }
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [roomId]);

  return {
    users: Array.from(users.values()),
    onlineCount: users.size,
    isConnected,
    isUserOnline: (userId: string) => users.has(userId),
  };
}

/**
 * Hook para broadcast de mensajes en tiempo real
 */
export function useRealtimeBroadcast<T = any>(channelName: string) {
  const [lastMessage, setLastMessage] = useState<T | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'message' }, (payload) => {
        setLastMessage(payload.payload as T);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [channelName]);

  const broadcast = useCallback(async (message: T) => {
    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'message',
        payload: message,
      });
    }
  }, []);

  return { lastMessage, broadcast };
}

/**
 * Hook para notificaciones en tiempo real
 */
export function useRealtimeNotifications(userId: string) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    // Suscribirse a nuevas inscripciones
    const empresasChannel = supabase
      .channel('nuevas-inscripciones')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'empresas' },
        (payload) => {
          const newNotification = {
            id: Date.now().toString(),
            type: 'nueva_inscripcion',
            message: `Nueva inscripción: ${payload.new.nombre_empresa}`,
            timestamp: new Date().toISOString(),
            read: false,
            data: payload.new,
          };
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    // Suscribirse a nuevas muestras
    const muestrasChannel = supabase
      .channel('nuevas-muestras')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'muestras' },
        (payload) => {
          const newNotification = {
            id: Date.now().toString(),
            type: 'nueva_muestra',
            message: `Nueva muestra registrada: ${payload.new.nombre}`,
            timestamp: new Date().toISOString(),
            read: false,
            data: payload.new,
          };
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(empresasChannel);
      supabase.removeChannel(muestrasChannel);
    };
  }, [userId]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };
}

/**
 * Hook simplificado para detectar cambios en una tabla
 */
export function useTableChanges(tableName: string, callback: (payload: any) => void) {
  useEffect(() => {
    const channel = supabase
      .channel(`${tableName}-listener`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tableName },
        callback
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName, callback]);
}
