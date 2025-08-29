import React, { useEffect, useMemo, useState } from 'react'
import { X, Beaker, AlertTriangle } from 'lucide-react'
import { recetaService } from '../../services/RecetaService'
import type { ProductoReceta } from '../../types/productos'
import { productionService } from '../../services/ProductionService'

interface ProduccionModalProps {
  open: boolean
  onClose: () => void
  productoId: number
  productoNombre?: string
  onDone?: () => void
}

export const ProduccionModal: React.FC<ProduccionModalProps> = ({ open, onClose, productoId, productoNombre, onDone }) => {
  const [items, setItems] = useState<ProductoReceta[]>([])
  const [cantidad, setCantidad] = useState<number>(1)
  const [notas, setNotas] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const load = async () => {
      const { data } = await recetaService.getRecetaByProducto(productoId)
      setItems(data)
    }
    load()
  }, [open, productoId])

  const resumen = useMemo(() => {
    const req = items.map(i => {
      const stock = Number((i.insumos as any)?.stock || 0)
      const porUnidad = Number(i.cantidad_por_unidad || 0)
      const requerido = porUnidad * (Number(cantidad) || 0)
      const faltante = i.obligatorio ? Math.max(0, requerido - stock) : 0
      return {
        id: i.id,
        insumo_id: i.insumo_id,
        nombre: i.insumos?.nombre || `Insumo ${i.insumo_id}`,
        obligatorio: i.obligatorio,
        porUnidad,
        stock,
        requerido,
        faltante,
      }
    })
    const faltantes = req.filter(r => r.obligatorio && r.faltante > 0)
    const puedeProducir = faltantes.length === 0
    return { req, faltantes, puedeProducir }
  }, [items, cantidad])

  const handleConfirm = async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await productionService.producirProducto(productoId, Number(cantidad), null, notas)
      if (!res.ok) {
        const falt = res.faltantes?.map(f => `- ${f.nombre || f.insumo_id}: req ${f.requerido}, stock ${f.stock}`).join('\n')
        throw new Error(`${res.error || 'No se pudo producir'}${falt ? '\n\nFaltantes:\n' + falt : ''}`)
      }
      onDone?.()
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
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-3">
            <Beaker className="w-6 h-6 text-amber-700" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Producir {productoNombre ? `“${productoNombre}”` : ''}</h3>
              <p className="text-xs text-gray-500">Resumen de insumos requeridos</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidades a producir</label>
              <input type="number" min={1} value={cantidad} onChange={e => setCantidad(Math.max(1, Number(e.target.value) || 1))} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
              <input type="text" value={notas} onChange={e => setNotas(e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="Comentario de producción" />
            </div>
          </div>

          {resumen.faltantes.length > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
              <AlertTriangle className="w-4 h-4 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Faltan insumos obligatorios para producir</p>
                <ul className="mt-1 text-sm list-disc list-inside">
                  {resumen.faltantes.map(f => (
                    <li key={f.insumo_id}>{f.nombre}: faltan {f.faltante.toLocaleString()}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Insumo</th>
                  <th className="px-4 py-2 text-right">Por unidad</th>
                  <th className="px-4 py-2 text-right">Requerido</th>
                  <th className="px-4 py-2 text-right">Stock</th>
                  <th className="px-4 py-2 text-right">Estado</th>
                </tr>
              </thead>
              <tbody>
                {resumen.req.map(r => {
                  const ok = r.requerido <= r.stock || !r.obligatorio
                  return (
                    <tr key={r.insumo_id} className="border-t">
                      <td className="px-4 py-2">{r.nombre}{!r.obligatorio && <span className="ml-2 text-xs text-gray-500">(opcional)</span>}</td>
                      <td className="px-4 py-2 text-right">{r.porUnidad}</td>
                      <td className="px-4 py-2 text-right">{r.requerido}</td>
                      <td className="px-4 py-2 text-right">{r.stock}</td>
                      <td className="px-4 py-2 text-right">
                        {ok ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">OK</span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">Falta {r.faltante}</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-5 border-t bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
          <button onClick={handleConfirm} disabled={loading || resumen.faltantes.length > 0} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
            {loading ? 'Produciendo...' : 'Confirmar producción'}
          </button>
        </div>
      </div>
    </div>
  )
}
