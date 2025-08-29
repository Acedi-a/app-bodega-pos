import React, { useEffect, useState } from 'react'
import { recetaService } from '../services/RecetaService'
import { productoService } from '../services/ProductoService'
import type { Producto } from '../types/productos'
import type { ProductoReceta } from '../types/productos'
import { RecetaEditor } from '../components/recetas/RecetaEditor'
import { AgregarInsumoForm } from '../components/recetas/AgregarInsumoForm'
import { RefreshCw } from 'lucide-react'

const RecetasPage: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([])
  const [productoId, setProductoId] = useState<number | ''>('')
  const [items, setItems] = useState<ProductoReceta[]>([])
  // no loading state required here
  const [producibles, setProducibles] = useState<number>(0)

  useEffect(() => {
    const load = async () => {
      const { data } = await productoService.getProductos(1, 500, { activo: true })
      setProductos(data)
    }
    load()
  }, [])

  useEffect(() => {
    if (!productoId) return
  const load = async () => {
      const { data } = await recetaService.getRecetaByProducto(Number(productoId))
      setItems(data)
      const { unidades } = await recetaService.getUnidadesProducibles(Number(productoId))
      setProducibles(unidades)
    }
    load()
  }, [productoId])

  const refresh = async () => {
    if (!productoId) return
    const { data } = await recetaService.getRecetaByProducto(Number(productoId))
    setItems(data)
    const { unidades } = await recetaService.getUnidadesProducibles(Number(productoId))
    setProducibles(unidades)
  }

  const handleAdd = async (insumo: any, cantidad: number, obligatorio: boolean) => {
    if (!productoId) return
    await recetaService.addInsumoToReceta({ producto_id: Number(productoId), insumo_id: insumo.id, cantidad_por_unidad: cantidad, obligatorio })
    await refresh()
  }

  const handleChangeCantidad = async (id: number, cantidad: number) => {
    await recetaService.updateRecetaItem(id, { cantidad_por_unidad: cantidad })
    await refresh()
  }

  const handleToggleObligatorio = async (id: number, obligatorio: boolean) => {
    await recetaService.updateRecetaItem(id, { obligatorio })
    await refresh()
  }

  const handleRemove = async (id: number) => {
    await recetaService.removeRecetaItem(id)
    await refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recetas</h1>
          <p className="text-gray-600 mt-1">Define los insumos por producto</p>
        </div>
        <div className="flex gap-3">
          <button onClick={refresh} className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <select
            value={productoId}
            onChange={(e) => setProductoId(e.target.value ? Number(e.target.value) : '')}
            className="px-3 py-2 border rounded-lg bg-white"
          >
            <option value="">Selecciona un producto</option>
            {productos.map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>

          {productoId && (
            <div className="text-sm text-gray-600">Unidades producibles con stock actual: <span className="font-semibold text-amber-700">{producibles}</span></div>
          )}
        </div>

        {productoId && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Agregar Insumo</h3>
              <AgregarInsumoForm onAdd={handleAdd} />
            </div>
            <RecetaEditor
              items={items}
              onChangeCantidad={handleChangeCantidad}
              onToggleObligatorio={handleToggleObligatorio}
              onRemove={handleRemove}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default RecetasPage
