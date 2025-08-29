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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar insumo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
          />
        </div>
        <div className="flex gap-3">
          <input
            type="number"
            value={cantidad}
            min={0}
            step={0.01}
            onChange={(e) => setCantidad(Number(e.target.value))}
            className="w-32 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
          />
          <label className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg bg-white cursor-pointer hover:bg-gray-50 transition">
            <input 
              type="checkbox" 
              checked={obligatorio} 
              onChange={(e) => setObligatorio(e.target.checked)} 
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <span className="text-gray-700">Obligatorio</span>
          </label>
        </div>
      </div>
      
      <div className="max-h-60 overflow-auto border border-gray-200 rounded-lg bg-white shadow-sm">
        {loading ? (
          <div className="p-4 text-center text-gray-500">
            <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-amber-500 mr-2"></div>
            Buscando...
          </div>
        ) : results.length === 0 ? (
          <div className="p-4 text-center text-gray-500">Sin resultados</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {results.map(r => (
              <li key={r.id}>
                <button
                  onClick={() => onAdd(r as any, cantidad, obligatorio)}
                  className="w-full text-left p-4 hover:bg-amber-50 flex items-center justify-between transition"
                >
                  <div>
                    <div className="font-medium text-gray-900">{r.nombre}</div>
                    <div className="text-sm text-gray-500">Stock: {r.stock} {r.unidades_medida?.nombre || ''}</div>
                  </div>
                  <div className="text-sm text-amber-600 font-medium">Añadir</div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
