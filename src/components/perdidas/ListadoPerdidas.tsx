import React, { useEffect, useState } from 'react'
import { perdidaService } from '../../services/PerdidaService'
import type { Perdida, FiltrosPerdidas } from '../../types/perdidas'
import { 
  AlertTriangle, 
  Package, 
  Calendar, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  FileText,
  User
} from 'lucide-react'

// Función helper para formatear fechas relativas
const formatearTiempoTranscurrido = (fecha: string): string => {
  const ahora = new Date()
  const fechaPerdida = new Date(fecha)
  const diffMs = ahora.getTime() - fechaPerdida.getTime()
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHoras = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutos = Math.floor(diffMs / (1000 * 60))

  if (diffDias > 0) {
    return `hace ${diffDias} día${diffDias === 1 ? '' : 's'}`
  } else if (diffHoras > 0) {
    return `hace ${diffHoras} hora${diffHoras === 1 ? '' : 's'}`
  } else if (diffMinutos > 0) {
    return `hace ${diffMinutos} minuto${diffMinutos === 1 ? '' : 's'}`
  } else {
    return 'hace un momento'
  }
}

interface Props {
  onEdit?: (perdida: Perdida) => void
  onView?: (perdida: Perdida) => void
  refreshTrigger?: number
}

export const ListadoPerdidas: React.FC<Props> = ({ onEdit, onView, refreshTrigger }) => {
  const [perdidas, setPerdidas] = useState<Perdida[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  
  // Filtros
  const [filtros, setFiltros] = useState<FiltrosPerdidas>({})
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  
  // Búsqueda
  const [busqueda, setBusqueda] = useState('')

  const cargarPerdidas = async (page: number = 1) => {
    setLoading(true)
    setError(null)
    
    try {
      const filtrosAplicados = { ...filtros }
      
      if (busqueda.trim()) {
        filtrosAplicados.motivo = busqueda.trim()
      }
      
      const result = await perdidaService.getPerdidas(page, 20, filtrosAplicados)
      
      setPerdidas(result.data)
      setCurrentPage(result.currentPage)
      setTotalPages(result.totalPages)
      setTotal(result.total)
    } catch (err: any) {
      setError(err.message || 'Error cargando pérdidas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarPerdidas(1)
  }, [refreshTrigger, filtros])

  const handleBuscar = () => {
    setCurrentPage(1)
    cargarPerdidas(1)
  }

  const handleEliminar = async (perdida: Perdida) => {
    if (!confirm(`¿Está seguro de eliminar la pérdida de ${perdida.cantidad} ${getItemNombre(perdida)}?`)) return
    
    try {
      const result = await perdidaService.eliminarPerdida(perdida.id)
      if (result.ok) {
        cargarPerdidas(currentPage)
      } else {
        alert(result.error || 'Error eliminando pérdida')
      }
    } catch (err: any) {
      alert(err.message || 'Error eliminando pérdida')
    }
  }

  const getItemNombre = (perdida: Perdida): string => {
    if (perdida.tipo_item === 'producto' && perdida.productos) {
      return perdida.productos.nombre
    } else if (perdida.tipo_item === 'insumo' && perdida.insumos) {
      return perdida.insumos.nombre
    }
    return `${perdida.tipo_item} #${perdida.producto_id || perdida.insumo_id || 'N/A'}`
  }

  const getUnidadMedida = (perdida: Perdida): string => {
    const unidad = perdida.tipo_item === 'producto' 
      ? perdida.productos?.unidades_medida?.clave 
      : perdida.insumos?.unidades_medida?.clave
    return unidad || 'ud'
  }

  const formatearMoneda = (valor: number) => {
    return new Intl.NumberFormat('es-BO', { 
      style: 'currency', 
      currency: 'BOB',
      minimumFractionDigits: 2
    }).format(valor)
  }

  const getIconoTipo = (tipo: 'insumo' | 'producto') => {
    return tipo === 'producto' ? (
      <Package className="w-4 h-4 text-blue-600" />
    ) : (
      <BarChart3 className="w-4 h-4 text-green-600" />
    )
  }

  const getTipoColor = (tipo: 'insumo' | 'producto') => {
    return tipo === 'producto' 
      ? 'bg-blue-100 text-blue-800 border-blue-200'
      : 'bg-green-100 text-green-800 border-green-200'
  }

  if (loading && perdidas.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-8 shadow-sm">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <span className="ml-3 text-gray-600">Cargando pérdidas...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Encabezado con filtros y búsqueda */}
      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-700" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Registro de Pérdidas</h2>
              <p className="text-gray-600">
                {total} pérdidas registradas • Valor total: {formatearMoneda(perdidas.reduce((sum, p) => sum + (p.valor_total || 0), 0))}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filtros
          </button>
        </div>

        {/* Búsqueda */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por motivo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleBuscar()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <button
            onClick={handleBuscar}
            disabled={loading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            Buscar
          </button>
        </div>

        {/* Filtros expandibles */}
        {mostrarFiltros && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Item</label>
                <select
                  value={filtros.tipo_item || ''}
                  onChange={(e) => setFiltros(prev => ({ ...prev, tipo_item: e.target.value as 'insumo' | 'producto' || undefined }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Todos los tipos</option>
                  <option value="producto">Productos</option>
                  <option value="insumo">Insumos</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha desde</label>
                <input
                  type="date"
                  value={filtros.fecha_desde || ''}
                  onChange={(e) => setFiltros(prev => ({ ...prev, fecha_desde: e.target.value || undefined }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha hasta</label>
                <input
                  type="date"
                  value={filtros.fecha_hasta || ''}
                  onChange={(e) => setFiltros(prev => ({ ...prev, fecha_hasta: e.target.value || undefined }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
            
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setFiltros({})}
                className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabla de pérdidas */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4 font-medium text-gray-900">Fecha</th>
                <th className="text-left p-4 font-medium text-gray-900">Tipo/Item</th>
                <th className="text-right p-4 font-medium text-gray-900">Cantidad</th>
                <th className="text-right p-4 font-medium text-gray-900">Valor Unit.</th>
                <th className="text-right p-4 font-medium text-gray-900">Valor Total</th>
                <th className="text-left p-4 font-medium text-gray-900">Motivo</th>
                <th className="text-left p-4 font-medium text-gray-900">Usuario</th>
                <th className="text-center p-4 font-medium text-gray-900">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {perdidas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p>No se encontraron pérdidas registradas</p>
                    {Object.keys(filtros).length > 0 && (
                      <button
                        onClick={() => setFiltros({})}
                        className="mt-2 text-red-600 hover:text-red-700 text-sm underline"
                      >
                        Limpiar filtros
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                perdidas.map((perdida) => (
                  <tr key={perdida.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(perdida.fecha).toLocaleDateString('es-BO')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatearTiempoTranscurrido(perdida.fecha)}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {getIconoTipo(perdida.tipo_item)}
                        <div>
                          <div className="font-medium text-gray-900">
                            {getItemNombre(perdida)}
                          </div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getTipoColor(perdida.tipo_item)}`}>
                            {perdida.tipo_item === 'producto' ? 'Producto' : 'Insumo'}
                          </span>
                        </div>
                      </div>
                    </td>
                    
                    <td className="p-4 text-right">
                      <span className="font-mono text-sm">
                        {perdida.cantidad} {getUnidadMedida(perdida)}
                      </span>
                    </td>
                    
                    <td className="p-4 text-right">
                      <span className="text-gray-600">
                        {perdida.valor_unitario ? formatearMoneda(perdida.valor_unitario) : '-'}
                      </span>
                    </td>
                    
                    <td className="p-4 text-right">
                      <span className="font-medium text-red-700">
                        {perdida.valor_total ? formatearMoneda(perdida.valor_total) : '-'}
                      </span>
                    </td>
                    
                    <td className="p-4">
                      <div className="flex items-center gap-2 max-w-xs">
                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-700 truncate" title={perdida.motivo || ''}>
                          {perdida.motivo || 'Sin especificar'}
                        </span>
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">
                          {perdida.usuarios ? 
                            `${perdida.usuarios.nombre} ${perdida.usuarios.apellido || ''}`.trim() : 
                            'Sistema'
                          }
                        </span>
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        {onView && (
                          <button
                            onClick={() => onView(perdida)}
                            className="p-2 text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        
                        {onEdit && (
                          <button
                            onClick={() => onEdit(perdida)}
                            className="p-2 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleEliminar(perdida)}
                          className="p-2 text-gray-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="border-t bg-gray-50 px-4 py-3 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Mostrando {Math.min((currentPage - 1) * 20 + 1, total)} al {Math.min(currentPage * 20, total)} de {total} pérdidas
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => cargarPerdidas(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded">
                {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => cargarPerdidas(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Error:</span>
          </div>
          <p className="text-red-600 mt-1">{error}</p>
        </div>
      )}
    </div>
  )
}
