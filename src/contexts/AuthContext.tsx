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

  const loadUser = async () => {
    try {
      const { user: authUser, userProfile } = await authService.getCurrentUser()
      
      if (authUser && userProfile) {
        setUser(userProfile)
        setRole(userProfile.roles)
      } else {
        setUser(null)
        setRole(null)
      }
    } catch (error) {
      console.error('Error cargando usuario:', error)
      setUser(null)
      setRole(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Inicializar datos básicos
    const initializeApp = async () => {
      await dbService.initializeBasicData()
      // Cargar usuario inicial
      await loadUser()
    }

    initializeApp()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = authService.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN') {
        await loadUser()
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setRole(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      const { error } = await authService.signIn({ email, password })
      if (!error) {
        await loadUser()
      }
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      await authService.signOut()
    } finally {
      setLoading(false)
    }
  }

  const refreshUser = async () => {
    await loadUser()
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
