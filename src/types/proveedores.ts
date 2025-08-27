// Tipos para el módulo de proveedores

export interface Proveedor {
  id: number
  nombre: string
  nit?: string
  ci?: string
  email?: string
  telefono?: string
  direccion?: string
  activo: boolean
  creado_en: string
  actualizado_en: string
  proveedor_info?: ProveedorInfo
}

export interface ProveedorInfo {
  tercero_id: number
  contacto?: string
  condicion_pago?: string
}

export interface CreateProveedorData {
  nombre: string
  nit?: string
  ci?: string
  email?: string
  telefono?: string
  direccion?: string
  contacto?: string
  condicion_pago?: string
}

export interface UpdateProveedorData {
  nombre: string
  nit?: string
  ci?: string
  email?: string
  telefono?: string
  direccion?: string
  activo: boolean
  contacto?: string
  condicion_pago?: string
}

export interface ProveedorStats {
  totalProveedores: number
  proveedoresActivos: number
  nuevosEsteMes: number
  totalCompras: number
  promedioEntrega: number
}

export interface ProveedorCompra {
  id: number
  fecha: string
  monto_total: number
  estado: string
  productos_count: number
}

export interface GetProveedoresResponse {
  data: Proveedor[]
  totalPages: number
  currentPage: number
  totalCount: number
}
