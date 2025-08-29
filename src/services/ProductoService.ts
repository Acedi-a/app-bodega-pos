import { supabase } from '../lib/supabase'
import type { 
  Producto, 
  CreateProductoData, 
  UpdateProductoData, 
  ProductoStats,
  ProductoMovimiento,
  ProductoReceta,
  ProductoVenta,
  GetProductosResponse,
  Categoria,
  UnidadMedida,
  ProductoFilter
} from '../types/productos'

class ProductoService {
  // ========================================
  // CRUD BÁSICO
  // ========================================
  
  // Obtener todos los productos con información relacionada
  async getProductos(
    page: number = 1, 
    limit: number = 10, 
    filter: ProductoFilter = {}
  ): Promise<GetProductosResponse> {
    try {
      let query = supabase
        .from('productos')
        .select(`
          *,
          categorias!categoria_id (
            id,
            nombre,
            descripcion
          ),
          unidades_medida!unidad_medida_id (
            id,
            clave,
            nombre
          )
        `)

      // Aplicar filtros
      if (filter.search?.trim()) {
        query = query.or(`nombre.ilike.%${filter.search}%,descripcion.ilike.%${filter.search}%,sku.ilike.%${filter.search}%,codigo_barras.ilike.%${filter.search}%`)
      }

      if (filter.categoria_id) {
        query = query.eq('categoria_id', filter.categoria_id)
      }

      if (filter.activo !== undefined) {
        query = query.eq('activo', filter.activo)
      }

      // TODO: Implementar con vista productos_con_alerta en el futuro
      // Por ahora filtramos en el cliente
      // if (filter.stock_bajo) {
      //   query = query.filter('stock', 'lte', 'stock_minimo')
      // }

      if (filter.precio_min) {
        query = query.gte('precio', filter.precio_min)
      }

      if (filter.precio_max) {
        query = query.lte('precio', filter.precio_max)
      }

      // Contar total de registros con los mismos filtros
      let countQuery = supabase
        .from('productos')
        .select('*', { count: 'exact', head: true })

      if (filter.search?.trim()) {
        countQuery = countQuery.or(`nombre.ilike.%${filter.search}%,descripcion.ilike.%${filter.search}%,sku.ilike.%${filter.search}%,codigo_barras.ilike.%${filter.search}%`)
      }

      if (filter.categoria_id) {
        countQuery = countQuery.eq('categoria_id', filter.categoria_id)
      }

      if (filter.activo !== undefined) {
        countQuery = countQuery.eq('activo', filter.activo)
      }

      // TODO: Implementar con vista productos_con_alerta en el futuro
      // Por ahora filtramos en el cliente
      // if (filter.stock_bajo) {
      //   countQuery = countQuery.filter('stock', 'lte', 'stock_minimo')
      // }

      if (filter.precio_min) {
        countQuery = countQuery.gte('precio', filter.precio_min)
      }

      if (filter.precio_max) {
        countQuery = countQuery.lte('precio', filter.precio_max)
      }

      const { count } = await countQuery

      // Obtener datos paginados
      const { data, error } = await query
        .order('nombre', { ascending: true })
        .range((page - 1) * limit, page * limit - 1)

      if (error) throw error

      const totalPages = Math.ceil((count || 0) / limit)

      return {
        data: data as Producto[],
        totalPages,
        currentPage: page,
        totalCount: count || 0
      }
    } catch (error) {
      console.error('Error obteniendo productos:', error)
      return {
        data: [],
        totalPages: 0,
        currentPage: 1,
        totalCount: 0
      }
    }
  }

  // Obtener un producto por ID
  async getProductoById(id: number): Promise<{ data: Producto | null, error?: any }> {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select(`
          *,
          categorias!categoria_id (
            id,
            nombre,
            descripcion
          ),
          unidades_medida!unidad_medida_id (
            id,
            clave,
            nombre
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      return { data: data as Producto }
    } catch (error) {
      console.error('Error obteniendo producto por ID:', error)
      return { data: null, error }
    }
  }

  // Crear un nuevo producto
  async createProducto(productoData: CreateProductoData): Promise<{ data: any, error: any }> {
    try {
      const { data, error } = await supabase
        .from('productos')
        .insert({
          nombre: productoData.nombre,
          descripcion: productoData.descripcion,
          precio: productoData.precio,
          costo: productoData.costo,
          categoria_id: productoData.categoria_id,
          sku: productoData.sku,
          codigo_barras: productoData.codigo_barras,
          unidad_medida_id: productoData.unidad_medida_id,
          stock: productoData.stock,
          stock_minimo: productoData.stock_minimo,
          foto_url: productoData.foto_url,
          activo: true
        })
        .select()
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('Error creando producto:', error)
      return { data: null, error }
    }
  }

  // Actualizar un producto
  async updateProducto(id: number, productoData: UpdateProductoData) {
    try {
      const { data, error } = await supabase
        .from('productos')
        .update({
          nombre: productoData.nombre,
          descripcion: productoData.descripcion,
          precio: productoData.precio,
          costo: productoData.costo,
          categoria_id: productoData.categoria_id,
          sku: productoData.sku,
          codigo_barras: productoData.codigo_barras,
          unidad_medida_id: productoData.unidad_medida_id,
          stock: productoData.stock,
          stock_minimo: productoData.stock_minimo,
          foto_url: productoData.foto_url,
          activo: productoData.activo
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('Error actualizando producto:', error)
      return { data: null, error }
    }
  }

  // Eliminar un producto (soft delete)
  async deleteProducto(id: number) {
    try {
      const { error } = await supabase
        .from('productos')
        .update({ activo: false })
        .eq('id', id)

      if (error) throw error

      return { error: null }
    } catch (error) {
      console.error('Error eliminando producto:', error)
      return { error }
    }
  }

  // ========================================
  // ESTADÍSTICAS
  // ========================================
  
  async getProductoStats(): Promise<{ data: ProductoStats }> {
    try {
      // Total de productos
      const { count: totalProductos } = await supabase
        .from('productos')
        .select('*', { count: 'exact', head: true })


      // Productos con stock bajo
      // TODO: Implementar con vista productos_con_alerta en el futuro
      // const { count: productosStockBajo } = await supabase
      //   .from('productos')
      //   .select('*', { count: 'exact', head: true })
      //   .filter('stock', 'lte', 'stock_minimo')
      //   .eq('activo', true)
      
      // Por ahora filtramos en el cliente
      const { data: productosActivos } = await supabase
        .from('productos')
        .select('stock, stock_minimo')
        .eq('activo', true)
      
      const productosStockBajo = productosActivos?.filter(
        producto => producto.stock <= (producto.stock_minimo || 0)
      ).length || 0

      // Valor total del inventario
      const { data: inventarioData } = await supabase
        .from('productos')
        .select('stock, precio')
        .eq('activo', true)

      const valorInventario = inventarioData?.reduce((total, producto) => {
        return total + (producto.stock * producto.precio)
      }, 0) || 0

      // Categorías principales
      const { data: categoriasData } = await supabase
        .from('productos')
        .select(`
          categoria_id,
          categorias!categoria_id (
            nombre
          )
        `)
        .eq('activo', true)
        .not('categoria_id', 'is', null)

      const categoriasPrincipales = categoriasData?.reduce((acc: any[], item: any) => {
        const categoria = item.categorias?.nombre || 'Sin categoría'
        const existing = acc.find(c => c.categoria === categoria)
        if (existing) {
          existing.count++
        } else {
          acc.push({ categoria, count: 1 })
        }
        return acc
      }, []).sort((a: any, b: any) => b.count - a.count).slice(0, 5) || []

      const stats: ProductoStats = {
        totalProductos: totalProductos || 0,
        productosActivos: productosActivos?.length || 0,
        productosStockBajo: productosStockBajo || 0,
        valorInventario: Math.round(valorInventario * 100) / 100,
        categoriasPrincipales
      }

      return { data: stats }
    } catch (error) {
      console.error('Error al obtener estadísticas:', error)
      throw error
    }
  }

  // ========================================
  // MOVIMIENTOS DE INVENTARIO
  // ========================================

  async getProductoMovimientos(productoId: number): Promise<{ data: ProductoMovimiento[] }> {
  try {
    const { data, error } = await supabase
      .from('movimientos_inventario')
      .select(`
        id,
        producto_id,
        tipo_id,
        cantidad,
        fecha,
        notas,
        referencia_id,
        referencia_tipo,
        creado_en,
        tipos_movimiento_inventario!tipo_id (
          id,
          nombre,
          incrementa_stock
        ),
        usuarios!usuario_id (
          id,
          nombre
        )
      `)
      .eq('producto_id', productoId)
      .order('fecha', { ascending: false })
      .limit(20)

    if (error) throw error

    const movimientos: ProductoMovimiento[] = data?.map((mov: any) => ({
      id: mov.id,
      producto_id: mov.producto_id,
      tipo_movimiento_inventario_id: mov.tipo_id,
      cantidad: mov.cantidad,
      fecha: mov.fecha,
      observaciones: mov.notas,
      usuario_id: mov.usuario_id,
      referencia_tipo: mov.referencia_tipo,
      referencia_id: mov.referencia_id,
      creado_en: mov.creado_en,
      tipos_movimiento_inventario: mov.tipos_movimiento_inventario ? {
        id: mov.tipos_movimiento_inventario.id,
        nombre: mov.tipos_movimiento_inventario.nombre,
        descripcion: mov.tipos_movimiento_inventario.descripcion,
        incrementa_stock: mov.tipos_movimiento_inventario.incrementa_stock
      } : undefined,
      usuarios: mov.usuarios ? {
        id: mov.usuarios.id,
        nombre: mov.usuarios.nombre,
        email: mov.usuarios.email
      } : undefined
    })) || []

    return { data: movimientos }
  } catch (error) {
    console.error('Error obteniendo movimientos:', error)
    return { data: [] }
  }
}

  // ========================================
  // RECETAS
  // ========================================

  async getProductoRecetas(productoId: number): Promise<{ data: ProductoReceta[] }> {
    try {
        const { data, error } = await supabase
        .from('receta_insumos')
        .select(`
            id,
            producto_id,
            insumo_id,
            cantidad_por_unidad,
            obligatorio,
            creado_en,
            insumos!insumo_id (
            id,
            nombre,
            descripcion,
            unidades_medida!unidad_medida_id (
                id,
                clave,
                nombre
            )
            )
        `)
        .eq('producto_id', productoId)
        .order('obligatorio', { ascending: false })

        if (error) throw error

        const recetas: ProductoReceta[] = data?.map((receta: any) => ({
        id: receta.id,
        producto_id: receta.producto_id,
        insumo_id: receta.insumo_id,
        cantidad_por_unidad: receta.cantidad_por_unidad,
        obligatorio: receta.obligatorio,
  creado_en: receta.creado_en,
        insumos: receta.insumos ? {
            id: receta.insumos.id,
            nombre: receta.insumos.nombre,
            descripcion: receta.insumos.descripcion,
            unidades_medida: receta.insumos.unidades_medida ? {
            id: receta.insumos.unidades_medida.id,
            clave: receta.insumos.unidades_medida.clave,
            nombre: receta.insumos.unidades_medida.nombre
            } : undefined
        } : undefined
        })) || []

        return { data: recetas }
    } catch (error) {
        console.error('Error obteniendo recetas:', error)
        return { data: [] }
    }
    }

  // ========================================
  // HISTORIAL DE VENTAS
  // ========================================

  async getProductoVentas(productoId: number): Promise<{ data: ProductoVenta[] }> {
    try {
        const { data, error } = await supabase
        .from('venta_items')
        .select(`
            id,
            venta_id,
            producto_id,
            cantidad,
            precio_unitario,
            subtotal,
            ventas!venta_id (
            id,
            fecha,
            terceros!tercero_id (
                id,
                nombre
            )
            )
        `)
        .eq('producto_id', productoId)
        .order('id', { ascending: false })
        .limit(20)

        if (error) throw error

        const ventas: ProductoVenta[] = data?.map((venta: any) => ({
        id: venta.id,
        venta_id: venta.venta_id,
        producto_id: venta.producto_id,
        cantidad: venta.cantidad,
        precio_unitario: venta.precio_unitario,
        subtotal: venta.subtotal,
        ventas: venta.ventas ? {
            id: venta.ventas.id,
            fecha: venta.ventas.fecha,
            clientes: venta.ventas.terceros ? {
            id: venta.ventas.terceros.id,
            nombre: venta.ventas.terceros.nombre
            } : undefined
        } : undefined
        })) || []

        return { data: ventas }
    } catch (error) {
        console.error('Error obteniendo ventas:', error)
        return { data: [] }
    }
    }

  // ========================================
  // CATÁLOGOS AUXILIARES
  // ========================================

  async getCategorias(): Promise<{ data: Categoria[] }> {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('id, nombre, descripcion')
        .order('nombre')

      if (error) throw error

      return { data: data || [] }
    } catch (error) {
      console.error('Error obteniendo categorías:', error)
      return { data: [] }
    }
  }

  async getUnidadesMedida(): Promise<{ data: UnidadMedida[] }> {
    try {
      const { data, error } = await supabase
        .from('unidades_medida')
        .select('id, clave, nombre')
        .order('nombre')

      if (error) throw error

      return { data: data || [] }
    } catch (error) {
      console.error('Error obteniendo unidades de medida:', error)
      return { data: [] }
    }
  }

  // ========================================
  // UTILIDADES
  // ========================================

  // Actualizar stock de un producto
  async actualizarStock(productoId: number, nuevoCantidad: number, motivo: string = 'Ajuste manual') {
    try {
      // Usar transacción para consistencia
      const { data: producto, error: getError } = await supabase
        .from('productos')
        .select('stock')
        .eq('id', productoId)
        .single()

      if (getError) throw getError

      const stockAnterior = producto.stock
      const diferencia = nuevoCantidad - stockAnterior

      // Actualizar stock en productos
      const { error: updateError } = await supabase
        .from('productos')
        .update({ stock: nuevoCantidad })
        .eq('id', productoId)

      if (updateError) throw updateError

      // Registrar movimiento
      const tipoMovimiento = diferencia > 0 ? 'entrada' : 'salida'
      const { data: tipoData } = await supabase
        .from('tipos_movimiento_inventario')
        .select('id')
        .eq('clave', tipoMovimiento)
        .single()

      if (tipoData) {
        // En la función actualizarStock, cambia:
        await supabase
        .from('movimientos_inventario')
        .insert({
            producto_id: productoId,
            tipo_id: tipoData.id,
            cantidad: Math.abs(diferencia),
            observaciones: motivo, // Cambiado de 'notas' a 'observaciones'
            referencia_tipo: 'ajuste_manual'
        })
      }

      return { error: null }
    } catch (error) {
      console.error('Error actualizando stock:', error)
      return { error }
    }
  }

  // ========================================
  // MOVIMIENTOS DE INVENTARIO
  // ========================================

  // Registrar movimiento de inventario y actualizar stock
  async registrarMovimientoInventario(
    productoId: number,
    tipoMovimiento: 'entrada' | 'salida',
    cantidad: number,
    referenciaId?: number,
    referenciaTipo?: string,
    usuarioId?: string,
    notas?: string
  ): Promise<{ error: any }> {
    try {
      console.log('📦 Registrando movimiento de inventario:', {
        productoId,
        tipoMovimiento,
        cantidad,
        referenciaId,
        referenciaTipo
      })

      // Obtener el ID del tipo de movimiento
      const { data: tipoData, error: tipoError } = await supabase
        .from('tipos_movimiento_inventario')
        .select('id, incrementa_stock')
        .eq('clave', tipoMovimiento)
        .single()

      if (tipoError || !tipoData) {
        console.error('Error obteniendo tipo de movimiento:', tipoError)
        throw new Error(`Tipo de movimiento '${tipoMovimiento}' no encontrado`)
      }

      // Obtener stock actual del producto
      const { data: producto, error: productoError } = await supabase
        .from('productos')
        .select('stock')
        .eq('id', productoId)
        .single()

      if (productoError) throw productoError

      const stockAnterior = producto.stock || 0
      const incrementa = tipoData.incrementa_stock
      let nuevoStock = stockAnterior

      if (incrementa) {
        nuevoStock = stockAnterior + cantidad
      } else {
        nuevoStock = stockAnterior - cantidad
      }

      // Validar que el stock no sea negativo
      if (nuevoStock < 0) {
        throw new Error(`Stock insuficiente. Stock actual: ${stockAnterior}, intentando restar: ${cantidad}`)
      }

      // Actualizar stock del producto
      const { error: updateError } = await supabase
        .from('productos')
        .update({ stock: nuevoStock })
        .eq('id', productoId)

      if (updateError) throw updateError

      // Registrar el movimiento
      const { error: movimientoError } = await supabase
        .from('movimientos_inventario')
        .insert({
          producto_id: productoId,
          tipo_id: tipoData.id,
          cantidad: cantidad,
          referencia_id: referenciaId,
          referencia_tipo: referenciaTipo,
          usuario_id: usuarioId,
          notas: notas,
          fecha: new Date().toISOString()
        })

      if (movimientoError) throw movimientoError

      console.log('✅ Movimiento registrado exitosamente:', {
        stockAnterior,
        nuevoStock,
        diferencia: nuevoStock - stockAnterior
      })

      return { error: null }
    } catch (error) {
      console.error('❌ Error registrando movimiento de inventario:', error)
      return { error }
    }
  }

  // Verificar productos con stock bajo
  // TODO: Implementar con vista productos_con_alerta en el futuro
  async getProductosStockBajo(): Promise<{ data: Producto[] }> {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select(`
          *,
          categorias!categoria_id (
            id,
            nombre,
            descripcion
          ),
          unidades_medida!unidad_medida_id (
            id,
            clave,
            nombre
          )
        `)
        .eq('activo', true)
        .order('stock', { ascending: true })

      if (error) throw error

      // Filtrar productos con stock bajo en el cliente
      const productosStockBajo = data?.filter(producto => 
        producto.stock <= (producto.stock_minimo || 0)
      ) || []

      return { data: productosStockBajo }
    } catch (error) {
      console.error('Error obteniendo productos con stock bajo:', error)
      return { data: [] }
    }
  }
}

export const productoService = new ProductoService()
