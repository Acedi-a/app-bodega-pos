import React, { useEffect, useState } from 'react'
import { Calendar, Edit3, Trash2, Package, Clock, AlertTriangle, RefreshCw } from 'lucide-react'
import { pedidoService } from '../../services/PedidoService'

interface Props {
  onEdit: (pedido: any) => void
  onRefresh: () => void
  refreshTrigger: number
}

export const ListadoPedidos: React.FC<Props> = ({ onEdit, onRefresh, refreshTrigger }) => {
  const [data, setData] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await pedidoService.getPedidos(page, 10)
      setData(res.data)
      setTotalPages(res.totalPages)
    } catch (error) {
      console.error('Error cargando pedidos:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page, refreshTrigger])

  const diasRestantes = (fechaEntrega?: string | null) => {
    if (!fechaEntrega) return null
    const hoy = new Date()
    const entrega = new Date(fechaEntrega)
    const diff = Math.ceil((entrega.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const getEstadoBadge = (estado: any) => {
    if (!estado) return <span className="inline-flex px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">Sin estado</span>
    
    const colors = {
      pendiente: 'bg-amber-100 text-amber-800 border-amber-200',
      confirmado: 'bg-blue-100 text-blue-800 border-blue-200', 
      en_proceso: 'bg-purple-100 text-purple-800 border-purple-200',
      entregado: 'bg-green-100 text-green-800 border-green-200',
      cancelado: 'bg-red-100 text-red-800 border-red-200'
    }
    
    const colorClass = colors[estado.clave as keyof typeof colors] || 'bg-gray-100 text-gray-700'
    
    return (
      <span className={`inline-flex px-2 py-1 rounded-full text-xs border font-medium ${colorClass}`}>
        {estado.nombre}
      </span>
    )
  }

  const getDiasRestantesBadge = (dias: number | null) => {
    if (dias === null) return <span className="text-gray-400">-</span>
    
    if (dias < 0) {
      return (
        <div className="inline-flex items-center gap-1 text-red-700 bg-red-50 border border-red-200 px-2 py-1 rounded-full text-xs">
          <AlertTriangle className="w-3 h-3"/>
          Hace {Math.abs(dias)} días
        </div>
      )
    } else if (dias === 0) {
      return (
        <div className="inline-flex items-center gap-1 text-orange-700 bg-orange-50 border border-orange-200 px-2 py-1 rounded-full text-xs">
          <Clock className="w-3 h-3"/>
          Hoy
        </div>
      )
    } else if (dias <= 3) {
      return (
        <div className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full text-xs">
          <Clock className="w-3 h-3"/>
          {dias} días
        </div>
      )
    } else {
      return (
        <div className="inline-flex items-center gap-1 text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-full text-xs">
          <Calendar className="w-3 h-3"/>
          {dias} días
        </div>
      )
    }
  }

  const handleDelete = async (pedidoId: number) => {
    if (!confirm('¿Estás seguro de que deseas cancelar este pedido? Se liberarán todas las reservas.')) return
    
    try {
      const res = await pedidoService.cancelarPedido(pedidoId)
      if (res.ok) {
        load()
        onRefresh()
      } else {
        alert('Error: ' + (res.error || 'No se pudo cancelar el pedido'))
      }
    } catch (error) {
      console.error('Error cancelando pedido:', error)
      alert('Error cancelando pedido')
    }
  }

  if (loading && data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border p-8 shadow-sm">
        <div className="flex items-center justify-center">
          <div className="text-gray-500 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Cargando pedidos...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Listado de Pedidos</h2>
        <button 
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg border disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>
      
      {data.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pedidos registrados</h3>
          <p className="text-gray-500">Los pedidos aparecerán aquí cuando se creen</p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Pedido</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Entrega</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiempo</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{p.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{p.terceros?.nombre || 'Sin cliente'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{getEstadoBadge(p.estados)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(p.fecha_pedido).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{p.fecha_entrega ? new Date(p.fecha_entrega).toLocaleDateString() : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{getDiasRestantesBadge(diasRestantes(p.fecha_entrega))}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => onEdit(p)}
                          className="inline-flex items-center gap-1 px-3 py-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                        >
                          <Edit3 className="w-4 h-4"/>
                          Editar
                        </button>
                        {p.estados?.clave !== 'cancelado' && (
                          <button 
                            onClick={() => handleDelete(p.id)}
                            className="inline-flex items-center gap-1 px-3 py-2 text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="w-4 h-4"/>
                            Cancelar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Mostrando página {page} de {totalPages}
              </div>
              <div className="flex gap-2">
                <button 
                  disabled={page <= 1} 
                  onClick={() => setPage(p => Math.max(1, p - 1))} 
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
                >
                  Anterior
                </button>
                <button 
                  disabled={page >= totalPages} 
                  onClick={() => setPage(p => p + 1)} 
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
