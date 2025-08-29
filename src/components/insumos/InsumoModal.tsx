import React, { useEffect, useState } from 'react'
import type { Insumo, CreateInsumoData, UpdateInsumoData, UnidadMedida } from '../../types/insumos'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (data: CreateInsumoData | UpdateInsumoData) => Promise<void>
  insumo?: Insumo | null
  unidades: UnidadMedida[]
  loading?: boolean
}

export const InsumoModal: React.FC<Props> = ({ isOpen, onClose, onSave, insumo, unidades, loading }) => {
  const [form, setForm] = useState<CreateInsumoData | UpdateInsumoData>({
    nombre: '',
    descripcion: '',
    unidad_medida_id: undefined,
    stock: 0,
    stock_minimo: 0,
    foto_url: '',
    activo: true
  })

  useEffect(() => {
    if (insumo) {
      setForm({
        nombre: insumo.nombre,
        descripcion: insumo.descripcion,
        unidad_medida_id: insumo.unidad_medida_id,
        stock: insumo.stock,
        stock_minimo: insumo.stock_minimo,
        foto_url: insumo.foto_url,
        activo: insumo.activo
      })
    } else {
      setForm({
        nombre: '',
        descripcion: '',
        unidad_medida_id: undefined,
        stock: 0,
        stock_minimo: 0,
        foto_url: '',
        activo: true
      })
    }
  }, [insumo])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">{insumo ? 'Editar Insumo' : 'Nuevo Insumo'}</h3>
          <p className="text-gray-500 text-sm">Completa los campos para {insumo ? 'editar' : 'crear'} el insumo</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                type="text"
                required
                value={form.nombre || ''}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidad de medida</label>
              <select
                value={form.unidad_medida_id || ''}
                onChange={(e) => setForm({ ...form, unidad_medida_id: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                <option value="">Seleccione</option>
                {unidades.map(u => (
                  <option key={u.id} value={u.id}>{u.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={form.descripcion || ''}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
              <input
                type="number"
                value={form.stock ?? 0}
                onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock mínimo</label>
              <input
                type="number"
                value={form.stock_minimo ?? 0}
                onChange={(e) => setForm({ ...form, stock_minimo: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2 mt-6">
              <input
                id="activo"
                type="checkbox"
                checked={form.activo ?? true}
                onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <label htmlFor="activo" className="text-sm font-medium text-gray-700">Activo</label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Foto URL</label>
            <input
              type="url"
              value={form.foto_url || ''}
              onChange={(e) => setForm({ ...form, foto_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors" disabled={loading}>Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
