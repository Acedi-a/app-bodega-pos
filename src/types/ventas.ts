// ======================================
// TIPOS PARA VENTAS
// ======================================

export interface Venta {
  id: number
  tercero_id?: number
  usuario_id: string // UUID
  pedido_id?: number
  fecha: string
  monto_total: number
  descuento: number
  impuesto: number
  metodo_pago_id: number
  estado_id?: number
  notas?: string
  creado_en: string
  actualizado_en: string
  
  // Relaciones
  terceros?: {
    id: number
    nombre: string
    nit?: string
    email?: string
    telefono?: string
  }
  usuarios?: {
    id: string
    nombre: string
    apellido?: string
  }
  pedidos?: {
    id: number
    fecha_pedido: string
    notas?: string
  }
  metodos_pago?: {
    id: number
    clave: string
    nombre: string
  }
  estados?: {
    id: number
    categoria: string
    clave: string
    nombre: string
  }
  venta_items?: VentaItem[]
}

export interface VentaItem {
  id: number
  venta_id: number
  producto_id?: number
  cantidad: number
  precio_unitario: number
  subtotal: number
  creado_en: string
  
  // Relaciones
  productos?: {
    id: number
    nombre: string
    sku?: string
    precio: number
    stock: number
    unidades_medida?: {
      id: number
      nombre: string
      clave: string
    }
  }
}

export interface CreateVentaData {
  tercero_id?: number
  usuario_id: string
  pedido_id?: number
  fecha?: string
  monto_total: number
  descuento: number
  impuesto: number
  metodo_pago_id: number
  estado_id?: number
  notas?: string
  items: CreateVentaItemData[]
}

export interface CreateVentaItemData {
  producto_id: number
  cantidad: number
  precio_unitario: number
  subtotal: number
}

export interface UpdateVentaData {
  tercero_id?: number
  fecha?: string
  monto_total: number
  descuento: number
  impuesto: number
  metodo_pago_id: number
  estado_id?: number
  notas?: string
  items?: UpdateVentaItemData[]
}

export interface UpdateVentaItemData {
  id?: number // Si tiene ID es update, sino es create
  producto_id: number
  cantidad: number
  precio_unitario: number
  subtotal: number
  _delete?: boolean // Para marcar items a eliminar
}

export interface VentaStats {
  totalVentas: number
  ventasHoy: number
  ventasSemana: number
  ventasMes: number
  montoTotalHoy: number
  montoTotalSemana: number
  montoTotalMes: number
  ventasPorEstado: Array<{
    estado: string
    count: number
    monto: number
  }>
  ventasPorMetodoPago: Array<{
    metodo: string
    count: number
    monto: number
  }>
  productosPopulares: Array<{
    producto: string
    cantidad: number
    ingresos: number
  }>
}

export interface GetVentasResponse {
  data: Venta[]
  totalPages: number
  currentPage: number
  totalCount: number
}

// Interfaces auxiliares
export interface MetodoPago {
  id: number
  clave: string
  nombre: string
}

export interface EstadoVenta {
  id: number
  categoria: string
  clave: string
  nombre: string
}

export interface Cliente {
  id: number
  nombre: string
  nit?: string
  email?: string
  telefono?: string
}

// Filtros para búsqueda
export interface VentaFilter {
  search?: string
  tercero_id?: number
  usuario_id?: string
  metodo_pago_id?: number
  estado_id?: number
  fecha_desde?: string
  fecha_hasta?: string
  monto_min?: number
  monto_max?: number
}

// Para el carrito de ventas
export interface CarritoItem {
  producto_id: number
  nombre: string
  precio_unitario: number
  cantidad: number
  stock_disponible: number
  subtotal: number
  sku?: string
  unidad_medida?: string
}

export interface CarritoVenta {
  items: CarritoItem[]
  subtotal: number
  descuento: number
  impuesto: number
  total: number
  tercero_id?: number
  metodo_pago_id: number
  notas?: string
}

/* 
SUGERENCIAS PARA FUTURAS MEJORAS:
- Agregar campo 'folio' o 'numero_factura' en tabla ventas para numeración secuencial
- Considerar agregar 'tipo_comprobante' (factura, nota de venta, etc.)
- Campo 'direccion_entrega' para delivery
- Tabla 'descuentos_aplicados' para trackear descuentos por promoción
- Campo 'comision_vendedor' en venta_items para cálculo de comisiones
- Integración con inventario: trigger para actualizar stock automáticamente
*/
