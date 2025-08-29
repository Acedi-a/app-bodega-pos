import React, { useEffect, useState } from 'react'
import { Calendar, Edit3, Trash2, Package, Clock, AlertTriangle } from 'lucide-react'
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
    if (!estado) return <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">Sin estado</span>
    
    const colors = {
      pendiente: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      confirmado: 'bg-blue-100 text-blue-700 border-blue-200', 
      en_proceso: 'bg-purple-100 text-purple-700 border-purple-200',
      entregado: 'bg-green-100 text-green-700 border-green-200',
      cancelado: 'bg-red-100 text-red-700 border-red-200'
    }
    
    const colorClass = colors[estado.clave as keyof typeof colors] || 'bg-gray-100 text-gray-700'
    
    return (
      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs border ${colorClass}`}>
        {estado.nombre}
      </span>
    )
  }

  const getDiasRestantesBadge = (dias: number | null) => {
    if (dias === null) return <span className="text-gray-400">-</span>
    
    if (dias < 0) {
      return (
        <div className="inline-flex items-center gap-1 text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded text-xs">
          <AlertTriangle className="w-3 h-3"/>
          Hace {Math.abs(dias)} días
        </div>
      )
    } else if (dias === 0) {
      return (
        <div className="inline-flex items-center gap-1 text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded text-xs">
          <Clock className="w-3 h-3"/>
          Hoy
        </div>
      )
    } else if (dias <= 3) {
      return (
        <div className="inline-flex items-center gap-1 text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded text-xs">
          <Clock className="w-3 h-3"/>
          {dias} días
        </div>
      )
    } else {
      return (
        <div className="inline-flex items-center gap-1 text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded text-xs">
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
      <div className="bg-white rounded-xl border p-8 shadow-sm">
        <div className="flex items-center justify-center">
          <div className="text-gray-500">Cargando pedidos...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Listado de Pedidos</h2>
        <button 
          onClick={load}
          disabled={loading}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded border disabled:opacity-50"
        >
          {loading ? 'Cargando...' : 'Actualizar'}
        </button>
      </div>
      
      {data.length === 0 ? (
        <div className="text-center py-8">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 mb-2">No hay pedidos registrados</p>
          <p className="text-gray-400 text-sm">Los pedidos aparecerán aquí cuando se creen</p>
        </div>
      ) : (
        <>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Cliente</th>
                  <th className="px-3 py-2 text-left">Estado</th>
                  <th className="px-3 py-2 text-left">Fecha Pedido</th>
                  <th className="px-3 py-2 text-left">Fecha Entrega</th>
                  <th className="px-3 py-2 text-left">Tiempo</th>
                  <th className="px-3 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.map(p => (
                  <tr key={p.id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium">#{p.id}</td>
                    <td className="px-3 py-2">{p.terceros?.nombre || 'Sin cliente'}</td>
                    <td className="px-3 py-2">{getEstadoBadge(p.estados)}</td>
                    <td className="px-3 py-2">{new Date(p.fecha_pedido).toLocaleDateString()}</td>
                    <td className="px-3 py-2">{p.fecha_entrega ? new Date(p.fecha_entrega).toLocaleDateString() : '-'}</td>
                    <td className="px-3 py-2">{getDiasRestantesBadge(diasRestantes(p.fecha_entrega))}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => onEdit(p)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-amber-700 bg-amber-50 border border-amber-200 rounded hover:bg-amber-100 transition-colors"
                        >
                          <Edit3 className="w-3 h-3"/>
                          Editar
                        </button>
                        {p.estados?.clave !== 'cancelado' && (
                          <button 
                            onClick={() => handleDelete(p.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="w-3 h-3"/>
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
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Página {page} de {totalPages}
              </div>
              <div className="flex gap-2">
                <button 
                  disabled={page <= 1} 
                  onClick={() => setPage(p => Math.max(1, p - 1))} 
                  className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50 transition-colors"
                >
                  Anterior
                </button>
                <button 
                  disabled={page >= totalPages} 
                  onClick={() => setPage(p => p + 1)} 
                  className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50 transition-colors"
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
