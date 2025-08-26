import { supabase } from '../lib/supabase'
import type { LoginCredentials, SignUpData, User } from '../types/auth'

class AuthService {
  async signIn({ email, password }: LoginCredentials) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('Error en signIn:', error)
      return { data: null, error }
    }
  }

  async signUp({ email, password, nombre, apellido, rol_id }: SignUpData) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre,
            apellido,
            rol_id,
          },
        },
      })

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('Error en signUp:', error)
      return { data: null, error }
    }
  }

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Error en signOut:', error)
      return { error }
    }
  }

  async getCurrentUser() {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) throw authError
      if (!user) return { user: null, userProfile: null, error: null }

      // Obtener perfil del usuario desde la tabla usuarios
      const { data: userProfile, error: profileError } = await supabase
        .from('usuarios')
        .select(`
          *,
          roles (
            id,
            clave,
            nombre,
            descripcion
          )
        `)
        .eq('id', user.id)
        .maybeSingle() // Cambio: usar maybeSingle en lugar de single

      if (profileError) throw profileError

      // Si no existe perfil, crear uno básico
      if (!userProfile) {
        console.log('Perfil no encontrado, creando perfil básico...')
        
        // Primero obtener el rol de administrador por defecto
        const { data: adminRole } = await supabase
          .from('roles')
          .select('id')
          .eq('clave', 'administrador')
          .single()

        if (!adminRole) {
          throw new Error('Rol de administrador no encontrado')
        }

        // Crear perfil básico
        const { data: newProfile, error: createError } = await supabase
          .from('usuarios')
          .insert({
            id: user.id,
            rol_id: adminRole.id,
            nombre: user.user_metadata?.nombre || user.email?.split('@')[0] || 'Usuario',
            apellido: user.user_metadata?.apellido || '',
            correo: user.email,
            activo: true
          })
          .select(`
            *,
            roles (
              id,
              clave,
              nombre,
              descripcion
            )
          `)
          .single()

        if (createError) throw createError

        return { user, userProfile: newProfile, error: null }
      }

      return { user, userProfile, error: null }
    } catch (error) {
      console.error('Error obteniendo usuario actual:', error)
      return { user: null, userProfile: null, error }
    }
  }

  async updateUserProfile(updates: Partial<User>) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      const { data, error } = await supabase
        .from('usuarios')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('Error actualizando perfil:', error)
      return { data: null, error }
    }
  }

  // Escuchar cambios en la autenticación
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

export const authService = new AuthService()
