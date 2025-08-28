import React, { useState, useEffect, useCallback } from 'react'
import { Plus, RefreshCw, AlertTriangle } from 'lucide-react'
import { productoService } from '../services/ProductoService'
import { ProductoStatsCards } from '../components/productos/ProductoStatsCards'
import { ProductoTable } from '../components/productos/ProductoTable'
import { ProductoModal } from '../components/productos/ProductoModal'
import { ProductoDetailModal } from '../components/productos/ProductoDetailModal'
import type { 
  Producto, 
  CreateProductoData, 
  UpdateProductoData, 
  ProductoFilter 
} from '../types/productos'

interface Categoria {
  id: number
  nombre: string
}

interface UnidadMedida {
  id: number
  nombre: string
  simbolo: string
}

export const ProductosPage: React.FC = () => {
  // Estados principales
  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedida[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Estados de filtros
  const [filter, setFilter] = useState<ProductoFilter>({
    search: '',
    activo: undefined,
    stock_bajo: false,
    precio_min: undefined,
    precio_max: undefined
  })

  // Estados de modales
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null)
  const [modalLoading, setModalLoading] = useState(false)

  // Estado de confirmación de eliminación
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Producto | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadProductos(),
        loadCategorias(),
        loadUnidadesMedida()
      ])
    } catch (error) {
      console.error('Error cargando datos iniciales:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadProductos = useCallback(async () => {
    try {
      const { data } = await productoService.getProductos(1, 100, filter) // Cargar primeras 100
      setProductos(data)
    } catch (error) {
      console.error('Error cargando productos:', error)
    }
  }, [filter])

  const loadCategorias = async () => {
    try {
      const { data } = await productoService.getCategorias()
      setCategorias(data)
    } catch (error) {
      console.error('Error cargando categorías:', error)
      // Fallback con datos básicos si no hay categorías
      setCategorias([])
    }
  }

  const loadUnidadesMedida = async () => {
    try {
      const { data } = await productoService.getUnidadesMedida()
      setUnidadesMedida(data.map(unidad => ({
        id: unidad.id,
        nombre: unidad.nombre,
        simbolo: unidad.clave // Usar clave como símbolo por compatibilidad
      })))
    } catch (error) {
      console.error('Error cargando unidades de medida:', error)
      // Fallback con datos básicos si no hay unidades
      setUnidadesMedida([])
    }
  }

  // Recargar productos cuando cambian los filtros
  useEffect(() => {
    if (!loading) {
      loadProductos()
    }
  }, [filter, loadProductos, loading])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await loadProductos()
    } catch (error) {
      console.error('Error refrescando productos:', error)
    } finally {
      setRefreshing(false)
    }
  }

  // Handlers de productos
  const handleCreateProducto = async (data: CreateProductoData) => {
    setModalLoading(true)
    try {
      await productoService.createProducto(data)
      await loadProductos()
      setShowCreateModal(false)
    } catch (error) {
      console.error('Error creando producto:', error)
      throw error
    } finally {
      setModalLoading(false)
    }
  }

  const handleUpdateProducto = async (data: UpdateProductoData) => {
    if (!selectedProducto) return
    
    setModalLoading(true)
    try {
      await productoService.updateProducto(selectedProducto.id, data)
      await loadProductos()
      setShowEditModal(false)
      setSelectedProducto(null)
    } catch (error) {
      console.error('Error actualizando producto:', error)
      throw error
    } finally {
      setModalLoading(false)
    }
  }

  const handleDeleteProducto = async () => {
    if (!productToDelete) return
    
    setDeleting(true)
    try {
      await productoService.deleteProducto(productToDelete.id)
      await loadProductos()
      setShowDeleteConfirm(false)
      setProductToDelete(null)
    } catch (error) {
      console.error('Error eliminando producto:', error)
    } finally {
      setDeleting(false)
    }
  }

  // Handlers de modales
  const handleView = (producto: Producto) => {
    setSelectedProducto(producto)
    setShowDetailModal(true)
  }

  const handleEdit = (producto: Producto) => {
    setSelectedProducto(producto)
    setShowEditModal(true)
  }

  const handleDelete = (producto: Producto) => {
    setProductToDelete(producto)
    setShowDeleteConfirm(true)
  }

  const handleCloseModals = () => {
    setShowCreateModal(false)
    setShowEditModal(false)
    setShowDetailModal(false)
    setShowDeleteConfirm(false)
    setSelectedProducto(null)
    setProductToDelete(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-600 mt-1">
            Gestiona el inventario y catálogo de productos
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <ProductoStatsCards />

      {/* Tabla de Productos */}
      <ProductoTable
        productos={productos}
        loading={loading}
        filter={filter}
        onFilterChange={setFilter}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Modal de Crear/Editar Producto */}
      {(showCreateModal || showEditModal) && (
        <ProductoModal
          isOpen={showCreateModal || showEditModal}
          onClose={handleCloseModals}
          onSave={showCreateModal ? handleCreateProducto : handleUpdateProducto}
          producto={showEditModal ? selectedProducto : null}
          categorias={categorias}
          unidadesMedida={unidadesMedida}
          loading={modalLoading}
        />
      )}

      {/* Modal de Detalle del Producto */}
      {showDetailModal && selectedProducto && (
        <ProductoDetailModal
          isOpen={showDetailModal}
          onClose={handleCloseModals}
          producto={selectedProducto}
        />
      )}

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteConfirm && productToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Confirmar Eliminación
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Esta acción no se puede deshacer
                  </p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                ¿Estás seguro de que quieres eliminar el producto{' '}
                <span className="font-semibold">{productToDelete.nombre}</span>?
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                  disabled={deleting}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteProducto}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Eliminando...
                    </>
                  ) : (
                    'Eliminar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
