import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Package, Users, Download, Search, Filter, Calendar, RefreshCw, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { inventarioInsumosService } from '../services/InventarioInsumosService'
import MovimientoInsumoDetailModal from '../components/inventarioInsumos/MovimientoInsumoDetailModal'
import type { GetMovimientosInsumosResponse, InventarioInsumosFilter, MovimientoInsumo, TipoMovimientoInsumo } from '../types/inventarioInsumos'

export default function InventarioInsumosPage() {
  const [movimientos, setMovimientos] = useState<GetMovimientosInsumosResponse>({
    data: [], count: 0, totalPages: 0, currentPage: 1,
    stats: { total_movimientos: 0, movimientos_entrada: 0, movimientos_salida: 0, insumos_afectados: 0 }
  })
  const [tiposMovimiento, setTiposMovimiento] = useState<TipoMovimientoInsumo[]>([])
  const [referencias, setReferencias] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const [selectedMovimiento, setSelectedMovimiento] = useState<MovimientoInsumo | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const [filtros, setFiltros] = useState<InventarioInsumosFilter>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)

  useEffect(() => { loadData(); loadCatalogos() }, [])
  useEffect(() => { loadData() }, [filtros, currentPage])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await inventarioInsumosService.getMovimientos(currentPage, pageSize, filtros)
      setMovimientos(res)
    } finally { setLoading(false) }
  }

  const loadCatalogos = async () => {
    const [tipos, refs] = await Promise.all([
      inventarioInsumosService.getTiposMovimiento(),
      inventarioInsumosService.getReferenciasUnicas()
    ])
    setTiposMovimiento(tipos.data)
    setReferencias(refs.data)
  }

  const handleExportCSV = async () => {
    const csv = await inventarioInsumosService.exportarMovimientos(filtros)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `inventario_insumos_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const clearFilters = () => { setFiltros({}); setCurrentPage(1) }
  const handleMovimientoClick = (m: MovimientoInsumo) => { setSelectedMovimiento(m); setShowDetailModal(true) }
  const handleCloseDetailModal = () => { setShowDetailModal(false); setSelectedMovimiento(null) }

  const formatFecha = (fecha: string) => new Date(fecha).toLocaleString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  const getTipoBadgeColor = (clave?: string) => {
    const map: Record<string, string> = {
      entrada: 'bg-green-100 text-green-800 border-green-200',
      salida: 'bg-red-100 text-red-800 border-red-200',
      consumo: 'bg-orange-100 text-orange-800 border-orange-200',
      ajuste: 'bg-blue-100 text-blue-800 border-blue-200'
    }
    return clave ? (map[clave] || 'bg-gray-100 text-gray-800 border-gray-200') : 'bg-gray-100 text-gray-800 border-gray-200'
  }
  const getReferenciaBadgeColor = (ref: string) => {
    const map: Record<string, string> = {
      produccion: 'bg-purple-50 text-purple-700 border-purple-200',
      ajuste_manual: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      compra: 'bg-blue-50 text-blue-700 border-blue-200'
    }
    return map[ref] || 'bg-gray-50 text-gray-700 border-gray-200'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventario de Insumos</h1>
          <p className="text-gray-600 mt-1">Historial de movimientos de insumos</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" /> Filtros
          </button>
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Movimientos</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{movimientos.stats.total_movimientos.toLocaleString()}</p>
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
              <p className="text-2xl font-bold text-green-600 mt-1">{movimientos.stats.movimientos_entrada.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Salidas/Consumo</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{movimientos.stats.movimientos_salida.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Insumos Afectados</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{movimientos.stats.insumos_afectados.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
            <button onClick={clearFilters} className="text-sm text-blue-600 hover:text-blue-700">Limpiar filtros</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Búsqueda</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input type="text" placeholder="Insumo o notas..." value={filtros.search || ''} onChange={(e) => setFiltros({ ...filtros, search: e.target.value })} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Movimiento</label>
              <select value={filtros.tipo_id || ''} onChange={(e) => setFiltros({ ...filtros, tipo_id: e.target.value ? Number(e.target.value) : undefined })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">Todos los tipos</option>
                {tiposMovimiento.map(tipo => (<option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Referencia</label>
              <select value={filtros.referencia_tipo || ''} onChange={(e) => setFiltros({ ...filtros, referencia_tipo: e.target.value || undefined })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">Todas las referencias</option>
                {referencias.map(ref => (<option key={ref} value={ref}>{ref.replace('_', ' ').toUpperCase()}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Desde</label>
              <input type="date" value={filtros.fecha_desde || ''} onChange={(e) => setFiltros({ ...filtros, fecha_desde: e.target.value || undefined })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Movimientos de Insumos</h2>
          <button onClick={loadData} disabled={loading} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualizar
          </button>
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
                <p className="text-sm text-blue-700 flex items-center gap-2"><Eye className="w-4 h-4" /> Haz clic en una fila para ver detalles</p>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Insumo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referencia</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notas</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {movimientos.data.map(mov => {
                    const clave = mov.tipos_movimiento_insumos?.clave
                    const incrementa = clave === 'entrada'
                    return (
                      <tr key={mov.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => handleMovimientoClick(mov)}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" />{formatFecha(mov.fecha)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{mov.insumos?.nombre || 'Insumo eliminado'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTipoBadgeColor(clave)}`}>{mov.tipos_movimiento_insumos?.nombre}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`font-semibold ${incrementa ? 'text-green-600' : 'text-red-600'}`}>{incrementa ? '+' : '-'}{mov.cantidad.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {mov.referencia_tipo && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getReferenciaBadgeColor(mov.referencia_tipo)}`}>{mov.referencia_tipo.replace('_', ' ').toUpperCase()}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{mov.usuarios ? `${mov.usuarios.nombre} ${mov.usuarios.apellido || ''}`.trim() : 'Sistema'}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs"><div className="truncate" title={mov.notas || ''}>{mov.notas || '-'}</div></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {movimientos.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, movimientos.count)} de {movimientos.count} movimientos</div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                      <ChevronLeft className="w-4 h-4" /> Anterior
                    </button>
                    <span className="text-sm text-gray-700">Página {currentPage} de {movimientos.totalPages}</span>
                    <button onClick={() => setCurrentPage(Math.min(movimientos.totalPages, currentPage + 1))} disabled={currentPage === movimientos.totalPages} className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                      Siguiente <ChevronRight className="w-4 h-4" />
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron movimientos</h3>
            <p className="text-gray-500">{Object.keys(filtros).some(k => (filtros as any)[k]) ? 'Intenta ajustar los filtros de búsqueda' : 'Aún no hay movimientos de insumos registrados'}</p>
          </div>
        )}
      </div>

      {selectedMovimiento && (
        <MovimientoInsumoDetailModal movimiento={selectedMovimiento} isOpen={showDetailModal} onClose={handleCloseDetailModal} />
      )}
    </div>
  )
}
