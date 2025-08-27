import React, { createContext, useContext, useEffect, useState } from 'react'
import { authService } from '../services/AuthService'
import { dbService } from '../services/DatabaseService'
import type { AuthUser } from '../types/auth'

interface AuthContextType extends AuthUser {
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser['user']>(null)
  const [role, setRole] = useState<AuthUser['role']>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeApp = async () => {
      setLoading(true);
      try {
        // Primero, intentar obtener el usuario.
        const { user: authUser, userProfile, error } = await authService.getCurrentUser();

        if (error && typeof error === 'object' && 'message' in error && (error as any).message !== 'Auth session missing!') {
          console.error("Error en la sesión inicial:", error);
        }

        if (authUser && userProfile) {
          setUser(userProfile);
          setRole(userProfile.roles);
        } else {
          setUser(null);
          setRole(null);
        }
      } catch (e) {
        console.error("Error inesperado en la inicialización:", e);
        setUser(null);
        setRole(null);
      } finally {
        // Asegurar que el estado de carga se desactiva sin importar el resultado
        setLoading(false);
      }
    };

    initializeApp();
    dbService.initializeBasicData(); // Ejecutar en segundo plano

    // Escuchar cambios de autenticación para el futuro (login/logout)
    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setLoading(true);
        const { user: authUser, userProfile } = await authService.getCurrentUser();
        if (authUser && userProfile) {
          setUser(userProfile);
          setRole(userProfile.roles);
        }
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setRole(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await authService.signIn({ email, password });
      // El listener onAuthStateChange se encargará de actualizar el estado del usuario
      if (error) {
        setLoading(false); // Detener la carga si el inicio de sesión falla
      }
      return { error };
    } catch (e) {
      setLoading(false);
      return { error: e };
    }
  };

  const signOut = async () => {
    setLoading(true)
    try {
      await authService.signOut()
    } finally {
      // El listener onAuthStateChange se encargará de limpiar el estado
      setLoading(false)
    }
  }

  const refreshUser = async () => {
    setLoading(true);
    try {
      const { user: authUser, userProfile } = await authService.getCurrentUser();
      if (authUser && userProfile) {
        setUser(userProfile);
        setRole(userProfile.roles);
      } else {
        setUser(null);
        setRole(null);
      }
    } finally {
      setLoading(false);
    }
  }

  const value: AuthContextType = {
    user,
    role,
    loading,
    signIn,
    signOut,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
