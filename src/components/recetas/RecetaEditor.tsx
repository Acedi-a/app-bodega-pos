import React from 'react'
import { Trash2 } from 'lucide-react'
import type { ProductoReceta } from '../../types/productos'

interface Props {
  items: ProductoReceta[]
  onChangeCantidad: (id: number, cantidad: number) => void
  onToggleObligatorio: (id: number, obligatorio: boolean) => void
  onRemove: (id: number) => void
}

export const RecetaEditor: React.FC<Props> = ({ items, onChangeCantidad, onToggleObligatorio, onRemove }) => {
  return (
    <div className="overflow-x-auto border rounded-xl">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Insumo</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cantidad por unidad</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Obligatorio</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map((it) => (
            <tr key={it.id}>
              <td className="px-4 py-2">
                <div className="font-medium text-gray-900">{it.insumos?.nombre}</div>
                {it.insumos?.unidades_medida?.nombre && (
                  <div className="text-xs text-gray-500">{it.insumos.unidades_medida.nombre}</div>
                )}
              </td>
              <td className="px-4 py-2">
                <input
                  type="number"
                  className="w-32 px-3 py-2 border rounded-lg"
                  value={it.cantidad_por_unidad}
                  onChange={(e) => onChangeCantidad(it.id, Number(e.target.value))}
                  min={0}
                  step={0.01}
                />
              </td>
              <td className="px-4 py-2">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    checked={it.obligatorio}
                    onChange={(e) => onToggleObligatorio(it.id, e.target.checked)}
                  />
                  Obligatorio
                </label>
              </td>
              <td className="px-4 py-2 text-right">
                <button
                  onClick={() => onRemove(it.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  title="Quitar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
