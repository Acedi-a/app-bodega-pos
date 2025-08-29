// ======================================
// TIPOS PARA PRODUCTOS
// ======================================

export interface Producto {
  id: number
  nombre: string
  descripcion?: string
  precio: number // precio de venta
  costo: number // precio de costo
  categoria_id?: number
  sku?: string
  codigo_barras?: string
  unidad_medida_id?: number
  stock: number // stock actual
  stock_minimo: number
  foto_url?: string
  activo: boolean
  creado_en: string
  actualizado_en: string
  
  // Relaciones
  categorias?: {
    id: number
    nombre: string
    descripcion?: string
  }
  unidades_medida?: {
    id: number
    clave: string
    nombre: string
    simbolo?: string
  }
}

export interface CreateProductoData {
  nombre: string
  descripcion?: string
  precio: number
  costo: number
  categoria_id?: number
  sku?: string
  codigo_barras?: string
  unidad_medida_id?: number
  stock: number
  stock_minimo: number
  foto_url?: string
}

export interface UpdateProductoData {
  nombre: string
  descripcion?: string
  precio: number
  costo: number
  categoria_id?: number
  sku?: string
  codigo_barras?: string
  unidad_medida_id?: number
  stock: number
  stock_minimo: number
  foto_url?: string
  activo?: boolean // Hacer opcional para compatibilidad con modal
}

export interface ProductoStats {
  totalProductos: number
  productosActivos: number
  productosStockBajo: number
  valorInventario: number
  categoriasPrincipales: Array<{
    categoria: string
    count: number
  }>
}

export interface ProductoMovimiento {
  id: number
  producto_id: number
  tipo_movimiento_inventario_id: number
  cantidad: number
  fecha: string
  observaciones?: string
  usuario_id?: number
  referencia_tipo?: string
  referencia_id?: number
  creado_en: string
  
  // Relaciones
  tipos_movimiento_inventario?: {
    id: number
    nombre: string
    descripcion?: string
    incrementa_stock: boolean
  }
  usuarios?: {
    id: number
    nombre: string
    email: string
  }
}

export interface ProductoReceta {
  id: number
  producto_id: number
  insumo_id: number
  cantidad_por_unidad: number
  obligatorio: boolean
  creado_en: string
  
  // Relaciones
  insumos?: {
    id: number
    nombre: string
    descripcion?: string
    unidades_medida?: {
      id: number
      clave: string
      nombre: string
    }
  }
}

export interface ProductoVenta {
  id: number
  venta_id: number
  producto_id: number
  cantidad: number
  precio_unitario: number
  subtotal: number
  
  // Relaciones
  ventas?: {
    id: number
    fecha: string
    clientes?: {
      id: number
      nombre: string
    }
  }
}

export interface GetProductosResponse {
  data: Producto[]
  totalPages: number
  currentPage: number
  totalCount: number
}

export interface Categoria {
  id: number
  nombre: string
  descripcion?: string
}

export interface UnidadMedida {
  id: number
  clave: string
  nombre: string
}

// Filtros para búsqueda
export interface ProductoFilter {
  search?: string
  categoria_id?: number
  activo?: boolean
  stock_bajo?: boolean
  precio_min?: number
  precio_max?: number
}
