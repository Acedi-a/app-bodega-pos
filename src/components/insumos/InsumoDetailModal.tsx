import React, { useEffect, useState } from 'react'
import type { Insumo, InsumoDetailData } from '../../types/insumos'
import { insumoService } from '../../services/InsumoService'
import { X, Clock, Activity, BookOpen } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  insumo: Insumo
}

export const InsumoDetailModal: React.FC<Props> = ({ isOpen, onClose, insumo }) => {
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<InsumoDetailData | null>(null)
  const [tab, setTab] = useState<'mov' | 'recetas'>('mov')

  useEffect(() => {
    if (!isOpen) return
    const load = async () => {
      setLoading(true)
      const { data } = await insumoService.getInsumoDetail(insumo.id)
      setDetail(data)
      setLoading(false)
    }
    load()
  }, [isOpen, insumo.id])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{insumo.nombre}</h3>
            <p className="text-sm text-gray-500">Detalle del insumo</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="animate-pulse">
              <div className="h-24 bg-gray-100 rounded-lg mb-4" />
              <div className="h-64 bg-gray-100 rounded-lg" />
            </div>
          ) : !detail ? (
            <div className="text-center text-gray-500">No se pudo cargar el detalle</div>
          ) : (
            <div className="space-y-6">
              {/* Resumen */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-gradient-to-br from-amber-50 to-red-50 border border-amber-100">
                  <div className="text-sm text-gray-500">Stock actual</div>
                  <div className="text-2xl font-semibold text-gray-900">{detail.insumo.stock}</div>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-br from-amber-50 to-red-50 border border-amber-100">
                  <div className="text-sm text-gray-500">Consumido</div>
                  <div className="text-2xl font-semibold text-gray-900">{detail.estadisticas.total_consumido}</div>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-br from-amber-50 to-red-50 border border-amber-100">
                  <div className="text-sm text-gray-500">Recibido</div>
                  <div className="text-2xl font-semibold text-gray-900">{detail.estadisticas.total_recibido}</div>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-br from-amber-50 to-red-50 border border-amber-100">
                  <div className="text-sm text-gray-500">Asociado a</div>
                  <div className="text-2xl font-semibold text-gray-900">{detail.estadisticas.productos_asociados}</div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 border-b border-gray-200">
                <button onClick={() => setTab('mov')} className={`px-4 py-2 -mb-px border-b-2 ${tab==='mov'?'border-amber-600 text-amber-700':'border-transparent text-gray-500'} flex items-center gap-2`}>
                  <Activity className="w-4 h-4" /> Movimientos
                </button>
                <button onClick={() => setTab('recetas')} className={`px-4 py-2 -mb-px border-b-2 ${tab==='recetas'?'border-amber-600 text-amber-700':'border-transparent text-gray-500'} flex items-center gap-2`}>
                  <BookOpen className="w-4 h-4" /> Recetas
                </button>
              </div>

              {tab === 'mov' ? (
                <div className="space-y-3 max-h-80 overflow-auto pr-2">
                  {detail.movimientos.length === 0 ? (
                    <div className="text-sm text-gray-500">Sin movimientos recientes</div>
                  ) : (
                    detail.movimientos.map(m => (
                      <div key={m.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{m.tipos_movimiento_insumos?.nombre}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {new Date(m.fecha || m.creado_en).toLocaleString()}
                          </div>
                          {m.notas && (
                            <div className="text-xs text-gray-600 mt-1">{m.notas}</div>
                          )}
                        </div>
                        <div className={`text-sm font-semibold ${m.tipos_movimiento_insumos?.clave === 'entrada' ? 'text-green-700' : 'text-red-700'}`}>{m.cantidad}</div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-auto pr-2">
                  {detail.recetas.length === 0 ? (
                    <div className="text-sm text-gray-500">No está asociado a recetas</div>
                  ) : (
                    detail.recetas.map(r => (
                      <div key={r.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{r.productos?.nombre}</div>
                          <div className="text-xs text-gray-500">Cantidad: {r.cantidad_por_unidad} por unidad</div>
                        </div>
                        {r.productos?.precio !== undefined && (
                          <div className="text-sm text-gray-700">${r.productos?.precio.toLocaleString()}</div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
