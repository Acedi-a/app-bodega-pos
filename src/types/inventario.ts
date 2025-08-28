export interface TipoMovimientoInventario {
  id: number
  clave: string
  nombre: string
  incrementa_stock: boolean
  creado_en: string
}

export interface MovimientoInventario {
  id: number
  producto_id: number
  tipo_id: number
  referencia_id?: number
  referencia_tipo?: string
  cantidad: number
  usuario_id?: string
  fecha: string
  notas?: string
  creado_en: string
  
  // Relaciones
  productos?: {
    id: number
    nombre: string
    sku?: string
    precio: number
    stock: number
  }
  tipos_movimiento_inventario?: TipoMovimientoInventario
  usuarios?: {
    id: string
    nombre: string
    apellido?: string
  }
}

export interface InventarioFilter {
  search?: string
  producto_id?: number
  tipo_id?: number
  referencia_tipo?: string
  fecha_desde?: string
  fecha_hasta?: string
  usuario_id?: string
}

export interface InventarioStats {
  total_movimientos: number
  movimientos_entrada: number
  movimientos_salida: number
  productos_afectados: number
}

export interface GetMovimientosInventarioResponse {
  data: MovimientoInventario[]
  count: number
  totalPages: number
  currentPage: number
  stats: InventarioStats
}
