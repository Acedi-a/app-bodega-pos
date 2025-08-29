import React, { useEffect, useState, useCallback } from 'react'
import { Plus, RefreshCw, AlertTriangle } from 'lucide-react'
import { insumoService } from '../services/InsumoService'
import type { Insumo, CreateInsumoData, UpdateInsumoData, InsumoFilter, UnidadMedida } from '../types/insumos'
import { InsumoTable } from '../components/insumos/InsumoTable'
import { InsumoModal } from '../components/insumos/InsumoModal'
import { InsumoDetailModal } from '../components/insumos/InsumoDetailModal'

const InsumosPage: React.FC = () => {
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [unidades, setUnidades] = useState<UnidadMedida[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [filter, setFilter] = useState<InsumoFilter>({ search: '', activo: undefined, stock_bajo: false, unidad_medida_id: undefined })

  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [selected, setSelected] = useState<Insumo | null>(null)
  const [modalLoading, setModalLoading] = useState(false)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const loadInitial = async () => {
    setLoading(true)
    try {
      await Promise.all([loadInsumos(), loadUnidades()])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInitial()
  }, [])

  const loadInsumos = useCallback(async () => {
    const { data } = await insumoService.getInsumos(1, 200, filter)
    setInsumos(data)
  }, [filter])

  const loadUnidades = async () => {
    const { data } = await insumoService.getUnidadesMedida()
    setUnidades(data)
  }

  useEffect(() => {
    if (!loading) loadInsumos()
  }, [filter, loadInsumos, loading])

  const handleRefresh = async () => {
    setRefreshing(true)
    try { await loadInsumos() } finally { setRefreshing(false) }
  }

  const handleCreate = async (data: CreateInsumoData) => {
    setModalLoading(true)
    try {
      await insumoService.createInsumo(data)
      await loadInsumos()
      setShowCreate(false)
    } finally { setModalLoading(false) }
  }

  const handleUpdate = async (data: UpdateInsumoData) => {
    if (!selected) return
    setModalLoading(true)
    try {
      await insumoService.updateInsumo(selected.id, data)
      await loadInsumos()
      setShowEdit(false)
      setSelected(null)
    } finally { setModalLoading(false) }
  }

  const handleDelete = async () => {
    if (!selected) return
    setDeleting(true)
    try {
      await insumoService.deleteInsumo(selected.id)
      await loadInsumos()
      setShowDeleteConfirm(false)
      setSelected(null)
    } finally { setDeleting(false) }
  }

  const handleAdjustStock = async (insumo: Insumo) => {
    const nueva = window.prompt('Nueva cantidad de stock para ' + insumo.nombre, String(insumo.stock))
    if (nueva === null) return
    const cantidad = Number(nueva)
    if (Number.isNaN(cantidad)) return
    const motivo = window.prompt('Motivo del ajuste (opcional)', '') || ''
    const { error } = await insumoService.actualizarStock(insumo.id, cantidad, motivo)
    if (!error) await loadInsumos()
  }

  const closeModals = () => {
    setShowCreate(false)
    setShowEdit(false)
    setShowDetail(false)
    setShowDeleteConfirm(false)
    setSelected(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Insumos</h1>
          <p className="text-gray-600 mt-1">Administra insumos y existencias</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">
            <Plus className="w-4 h-4" />
            Nuevo Insumo
          </button>
        </div>
      </div>

      <InsumoTable
        insumos={insumos}
        loading={loading}
        filter={filter}
        unidades={unidades}
        onFilterChange={setFilter}
        onView={(i) => { setSelected(i); setShowDetail(true) }}
        onEdit={(i) => { setSelected(i); setShowEdit(true) }}
        onDelete={(i) => { setSelected(i); setShowDeleteConfirm(true) }}
        onAdjustStock={handleAdjustStock}
      />

      {(showCreate || showEdit) && (
        <InsumoModal
          isOpen={showCreate || showEdit}
          onClose={closeModals}
          onSave={(data) => showCreate ? handleCreate(data as CreateInsumoData) : handleUpdate(data as UpdateInsumoData)}
          insumo={showEdit ? selected : null}
          unidades={unidades}
          loading={modalLoading}
        />
      )}

      {showDetail && selected && (
        <InsumoDetailModal isOpen={showDetail} onClose={closeModals} insumo={selected} />
      )}

      {showDeleteConfirm && selected && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Confirmar Eliminación</h3>
                  <p className="text-gray-600 text-sm">Esta acción no se puede deshacer</p>
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                ¿Eliminar el insumo <span className="font-semibold">{selected.nombre}</span>?
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors" disabled={deleting}>Cancelar</button>
                <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">{deleting ? 'Eliminando...' : 'Eliminar'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InsumosPage
