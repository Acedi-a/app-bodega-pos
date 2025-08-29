import React, { useEffect, useState } from 'react'
import { X, Minus, Plus, Save, Trash2 } from 'lucide-react'
import { pedidoService } from '../../services/PedidoService'

interface Props {
  open: boolean
  onClose: () => void
  pedidoId: number
}

export const EditarPedidoModal: React.FC<Props> = ({ open, onClose, pedidoId }) => {
  const [pedido, setPedido] = useState<any | null>(null)
  const [lineas, setLineas] = useState<Array<{ producto_id: number; cantidad: number }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    (async () => {
      const { data } = await pedidoService.getPedidoById(pedidoId)
      setPedido(data)
      setLineas((data?.items || []).map((it: any) => ({ producto_id: it.producto_id, cantidad: Number(it.cantidad) })))
    })()
  }, [open, pedidoId])

  const inc = (idx: number) => setLineas(prev => prev.map((l, i) => i === idx ? { ...l, cantidad: l.cantidad + 1 } : l))
  const dec = (idx: number) => setLineas(prev => prev.map((l, i) => i === idx ? { ...l, cantidad: Math.max(0, l.cantidad - 1) } : l))

  const guardar = async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await pedidoService.ajustarPedido(pedidoId, lineas)
      if (!res.ok) throw new Error(res.error || 'No se pudo guardar')
      onClose()
    } catch (e: any) {
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  const cancelar = async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await pedidoService.cancelarPedido(pedidoId)
      if (!res.ok) throw new Error(res.error || 'No se pudo cancelar')
      onClose()
    } catch (e: any) {
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold">Editar Pedido #{pedidoId}</h3>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-5 space-y-3 max-h-[70vh] overflow-auto">
          {(pedido?.items || []).map((it: any, idx: number) => (
            <div key={it.id} className="flex items-center justify-between border rounded p-3">
              <div>
                <div className="font-medium">{it.productos?.nombre || `Producto ${it.producto_id}`}</div>
                <div className="text-xs text-gray-500">Solicitado originalmente: {it.cantidad}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => dec(idx)} className="p-2 rounded bg-gray-100"><Minus className="w-4 h-4"/></button>
                <input type="number" className="w-20 text-right border rounded px-2 py-1" value={lineas[idx]?.cantidad || 0} onChange={e => setLineas(prev => prev.map((l, i) => i === idx ? { ...l, cantidad: Math.max(0, Number(e.target.value) || 0) } : l))} />
                <button onClick={() => inc(idx)} className="p-2 rounded bg-gray-100"><Plus className="w-4 h-4"/></button>
              </div>
            </div>
          ))}

          {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">{error}</div>}
        </div>
        <div className="flex justify-between gap-3 p-5 border-t bg-gray-50">
          <button onClick={cancelar} disabled={loading} className="inline-flex items-center gap-2 px-4 py-2 text-red-700 bg-red-50 border border-red-200 rounded"><Trash2 className="w-4 h-4"/>Cancelar pedido</button>
          <button onClick={guardar} disabled={loading} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded"><Save className="w-4 h-4"/>Guardar cambios</button>
        </div>
      </div>
    </div>
  )
}
