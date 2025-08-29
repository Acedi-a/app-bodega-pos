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
    <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Insumo</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad por unidad</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Obligatorio</th>
            <th className="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((it) => (
            <tr key={it.id} className="hover:bg-gray-50 transition">
              <td className="px-6 py-4">
                <div className="font-medium text-gray-900">{it.insumos?.nombre}</div>
                {it.insumos?.unidades_medida?.nombre && (
                  <div className="text-sm text-gray-500">{it.insumos.unidades_medida.nombre}</div>
                )}
              </td>
              <td className="px-6 py-4">
                <input
                  type="number"
                  className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                  value={it.cantidad_por_unidad}
                  onChange={(e) => onChangeCantidad(it.id, Number(e.target.value))}
                  min={0}
                  step={0.01}
                />
              </td>
              <td className="px-6 py-4">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 h-5 w-5"
                    checked={it.obligatorio}
                    onChange={(e) => onToggleObligatorio(it.id, e.target.checked)}
                  />
                  <span className="text-sm text-gray-700">Obligatorio</span>
                </label>
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => onRemove(it.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Quitar"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
