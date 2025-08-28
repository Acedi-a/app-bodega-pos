import { useState, useEffect } from 'react'
import { 
  TrendingUp,
  TrendingDown,
  Package,
  Users,
  Download,
  Search,
  Filter,
  Calendar,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { inventarioService } from '../services/InventarioService'
import MovimientoDetailModal from '../components/inventario/MovimientoDetailModal'
import type { 
  MovimientoInventario,
  TipoMovimientoInventario, 
  InventarioFilter,
  GetMovimientosInventarioResponse
} from '../types/inventario'

interface InventarioPageProps {}

export default function InventarioPage({}: InventarioPageProps) {
  // Estados principales
  const [movimientos, setMovimientos] = useState<GetMovimientosInventarioResponse>({
    data: [],
    count: 0,
    totalPages: 0,
    currentPage: 1,
    stats: {
      total_movimientos: 0,
      movimientos_entrada: 0,
      movimientos_salida: 0,
      productos_afectados: 0
    }
  })
  const [tiposMovimiento, setTiposMovimiento] = useState<TipoMovimientoInventario[]>([])
  const [referencias, setReferencias] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Estados para el modal de detalle
  const [selectedMovimiento, setSelectedMovimiento] = useState<MovimientoInventario | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // Estados de filtros
  const [filtros, setFiltros] = useState<InventarioFilter>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)

  // Cargar datos iniciales
  useEffect(() => {
    loadData()
    loadCatalogos()
  }, [])

  // Cargar datos cuando cambian los filtros o la página
  useEffect(() => {
    loadData()
  }, [filtros, currentPage])

  const loadData = async () => {
    setLoading(true)
    try {
      const response = await inventarioService.getMovimientos(currentPage, pageSize, filtros)
      setMovimientos(response)
    } catch (error) {
      console.error('Error cargando movimientos:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCatalogos = async () => {
    try {
      const [tiposResponse, referenciasResponse] = await Promise.all([
        inventarioService.getTiposMovimiento(),
        inventarioService.getReferenciasUnicas()
      ])
      
      setTiposMovimiento(tiposResponse.data)
      setReferencias(referenciasResponse.data)
    } catch (error) {
      console.error('Error cargando catálogos:', error)
    }
  }

  const handleExportCSV = async () => {
    try {
      const csv = await inventarioService.exportarMovimientos(filtros)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `inventario_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      console.error('Error exportando:', error)
      alert('Error al exportar los datos')
    }
  }

  const clearFilters = () => {
    setFiltros({})
    setCurrentPage(1)
  }

  const handleMovimientoClick = (movimiento: MovimientoInventario) => {
    setSelectedMovimiento(movimiento)
    setShowDetailModal(true)
  }

  const handleCloseDetailModal = () => {
    setShowDetailModal(false)
    setSelectedMovimiento(null)
  }

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCantidad = (cantidad: number, incrementa: boolean) => {
    const signo = incrementa ? '+' : '-'
    const color = incrementa ? 'text-green-600' : 'text-red-600'
    return (
      <span className={`font-semibold ${color}`}>
        {signo}{cantidad.toLocaleString()}
      </span>
    )
  }

  const getTipoBadgeColor = (tipo: TipoMovimientoInventario) => {
    const colors: Record<string, string> = {
      'entrada': 'bg-green-100 text-green-800 border-green-200',
      'salida': 'bg-red-100 text-red-800 border-red-200',
      'ajuste': 'bg-blue-100 text-blue-800 border-blue-200',
      'perdida': 'bg-orange-100 text-orange-800 border-orange-200',
      'devolucion': 'bg-purple-100 text-purple-800 border-purple-200'
    }
    return colors[tipo.clave] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getReferenciaBadgeColor = (referencia: string) => {
    const colors: Record<string, string> = {
      'venta': 'bg-blue-50 text-blue-700 border-blue-200',
      'venta_editada': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'ajuste_manual': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'perdida': 'bg-red-50 text-red-700 border-red-200'
    }
    return colors[referencia] || 'bg-gray-50 text-gray-700 border-gray-200'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
          <p className="text-gray-600 mt-1">
            Historial completo de movimientos de stock
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filtros
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Movimientos</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {movimientos.stats.total_movimientos.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Entradas</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {movimientos.stats.movimientos_entrada.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Salidas</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {movimientos.stats.movimientos_salida.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Productos Afectados</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {movimientos.stats.productos_afectados.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Panel de Filtros */}
      {showFilters && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Limpiar filtros
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Búsqueda
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Producto, SKU o notas..."
                  value={filtros.search || ''}
                  onChange={(e) => setFiltros({...filtros, search: e.target.value})}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Tipo de Movimiento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Movimiento
              </label>
              <select
                value={filtros.tipo_id || ''}
                onChange={(e) => setFiltros({...filtros, tipo_id: e.target.value ? Number(e.target.value) : undefined})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los tipos</option>
                {tiposMovimiento.map(tipo => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Referencia */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referencia
              </label>
              <select
                value={filtros.referencia_tipo || ''}
                onChange={(e) => setFiltros({...filtros, referencia_tipo: e.target.value || undefined})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas las referencias</option>
                {referencias.map(ref => (
                  <option key={ref} value={ref}>
                    {ref.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha Desde */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Desde
              </label>
              <input
                type="date"
                value={filtros.fecha_desde || ''}
                onChange={(e) => setFiltros({...filtros, fecha_desde: e.target.value || undefined})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tabla de Movimientos */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Movimientos de Inventario
            </h2>
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Cargando movimientos...</p>
          </div>
        ) : (
          <>
            {movimientos.data.length > 0 && (
              <div className="p-4 bg-blue-50 border-b border-blue-200">
                <p className="text-sm text-blue-700 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Haz clic en cualquier fila para ver los detalles completos del movimiento
                </p>
              </div>
            )}
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Referencia
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notas
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {movimientos.data.map((movimiento) => (
                    <tr 
                      key={movimiento.id} 
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleMovimientoClick(movimiento)}
                      title="Haz clic para ver detalles completos"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {formatFecha(movimiento.fecha)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {movimiento.productos?.nombre || 'Producto eliminado'}
                          </div>
                          {movimiento.productos?.sku && (
                            <div className="text-sm text-gray-500">
                              SKU: {movimiento.productos.sku}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {movimiento.tipos_movimiento_inventario && (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTipoBadgeColor(movimiento.tipos_movimiento_inventario)}`}>
                            {movimiento.tipos_movimiento_inventario.nombre}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {movimiento.tipos_movimiento_inventario ? 
                          formatCantidad(movimiento.cantidad, movimiento.tipos_movimiento_inventario.incrementa_stock) :
                          movimiento.cantidad.toLocaleString()
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {movimiento.referencia_tipo && (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getReferenciaBadgeColor(movimiento.referencia_tipo)}`}>
                            {movimiento.referencia_tipo.replace('_', ' ').toUpperCase()}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movimiento.usuarios ? 
                          `${movimiento.usuarios.nombre} ${movimiento.usuarios.apellido || ''}`.trim() :
                          'Sistema'
                        }
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                        <div className="truncate" title={movimiento.notas || ''}>
                          {movimiento.notas || '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {movimientos.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, movimientos.count)} de {movimientos.count} movimientos
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Anterior
                    </button>
                    <span className="text-sm text-gray-700">
                      Página {currentPage} de {movimientos.totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(movimientos.totalPages, currentPage + 1))}
                      disabled={currentPage === movimientos.totalPages}
                      className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {!loading && movimientos.data.length === 0 && (
          <div className="p-8 text-center">
            <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron movimientos
            </h3>
            <p className="text-gray-500">
              {Object.keys(filtros).some(key => filtros[key as keyof InventarioFilter]) 
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Aún no hay movimientos de inventario registrados'
              }
            </p>
          </div>
        )}
      </div>

      {/* Modal de detalle */}
      {selectedMovimiento && (
        <MovimientoDetailModal
          movimiento={selectedMovimiento}
          isOpen={showDetailModal}
          onClose={handleCloseDetailModal}
        />
      )}
    </div>
  )
}
