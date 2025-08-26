export interface TipoTercero {
  id: number
  clave: string
  nombre: string
  descripcion?: string
}

export interface Tercero {
  id: number
  tipo_id: number
  nombre: string
  nit?: string
  ci?: string
  email?: string
  telefono?: string
  direccion?: string
  usuario_id?: string
  activo: boolean
  creado_en: string
  actualizado_en: string
  // Relaciones
  tipos_tercero?: TipoTercero
  cliente_info?: ClienteInfo
}

export interface ClienteInfo {
  tercero_id: number
  deuda_actual: number
  limite_credito: number
  condiciones_pago?: string
}

export interface Cliente extends Tercero {
  cliente_info: ClienteInfo
}

export interface CreateClienteData {
  nombre: string
  nit?: string
  ci?: string
  email?: string
  telefono?: string
  direccion?: string
  limite_credito?: number
  condiciones_pago?: string
}

export interface UpdateClienteData extends Partial<CreateClienteData> {
  activo?: boolean
}

export interface ClienteStats {
  total_clientes: number
  clientes_activos: number
  clientes_con_deuda: number
  deuda_total: number
  limite_credito_total: number
  cliente_top: {
    nombre: string
    total_compras: number
  } | null
}

export interface ClienteVenta {
  id: number
  fecha: string
  monto_total: number
  estado: string
  productos_count: number
}
