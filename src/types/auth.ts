export interface User {
  id: string
  rol_id: number
  nombre: string
  apellido?: string
  ci?: string
  nit?: string
  telefono?: string
  direccion?: string
  fecha_nacimiento?: string
  foto_url?: string
  correo?: string
  activo: boolean
  creado_en: string
  actualizado_en: string
}

export interface Role {
  id: number
  clave: string
  nombre: string
  descripcion?: string
  creado_en: string
}

export interface AuthUser {
  user: User | null
  role: Role | null
  loading: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignUpData {
  email: string
  password: string
  nombre: string
  apellido?: string
  rol_id: number
}
