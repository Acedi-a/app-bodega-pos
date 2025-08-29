import React, { useEffect, useState } from 'react'
import { insumoService } from '../../services/InsumoService'
import type { Insumo } from '../../types/insumos'

interface Props {
  onAdd: (insumo: Insumo, cantidad: number, obligatorio: boolean) => void
}

export const AgregarInsumoForm: React.FC<Props> = ({ onAdd }) => {
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Insumo[]>([])
  const [cantidad, setCantidad] = useState<number>(1)
  const [obligatorio, setObligatorio] = useState<boolean>(true)

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true)
      const { data } = await insumoService.buscarInsumosParaReceta(search)
      setResults(data as any)
      setLoading(false)
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Buscar insumo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-lg"
        />
        <input
          type="number"
          value={cantidad}
          min={0}
          step={0.01}
          onChange={(e) => setCantidad(Number(e.target.value))}
          className="w-28 px-3 py-2 border rounded-lg"
        />
        <label className="inline-flex items-center gap-2 text-sm text-gray-700 px-3 py-2 border rounded-lg bg-white">
          <input type="checkbox" checked={obligatorio} onChange={(e) => setObligatorio(e.target.checked)} />
          Obligatorio
        </label>
      </div>
      <div className="max-h-44 overflow-auto border rounded-lg">
        {loading ? (
          <div className="p-3 text-sm text-gray-500">Buscando...</div>
        ) : results.length === 0 ? (
          <div className="p-3 text-sm text-gray-500">Sin resultados</div>
        ) : (
          results.map(r => (
            <button
              key={r.id}
              onClick={() => onAdd(r as any, cantidad, obligatorio)}
              className="w-full text-left p-3 hover:bg-gray-50 flex items-center justify-between"
            >
              <div>
                <div className="text-sm font-medium text-gray-900">{r.nombre}</div>
                <div className="text-xs text-gray-500">Stock: {r.stock} {r.unidades_medida?.nombre || ''}</div>
              </div>
              <div className="text-xs text-gray-500">Añadir</div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
