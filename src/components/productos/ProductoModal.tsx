import React, { useState, useEffect } from 'react'
import { X, Package, Save, AlertCircle } from 'lucide-react'
import type { Producto, CreateProductoData, UpdateProductoData } from '../../types/productos'

interface Categoria {
  id: number
  nombre: string
}

interface UnidadMedida {
  id: number
  nombre: string
  simbolo: string
}

interface ProductoModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: CreateProductoData | UpdateProductoData) => Promise<void>
  producto?: Producto | null
  categorias: Categoria[]
  unidadesMedida: UnidadMedida[]
  loading?: boolean
}

export const ProductoModal: React.FC<ProductoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  producto,
  categorias,
  unidadesMedida,
  loading = false
}) => {
  const [formData, setFormData] = useState<CreateProductoData>({
    nombre: '',
    descripcion: '',
    precio: 0,
    costo: 0,
    categoria_id: undefined,
    sku: '',
    codigo_barras: '',
    unidad_medida_id: undefined,
    stock: 0,
    stock_minimo: 0,
    foto_url: ''
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (producto) {
      setFormData({
        nombre: producto.nombre,
        descripcion: producto.descripcion || '',
        precio: producto.precio,
        costo: producto.costo,
        categoria_id: producto.categoria_id,
        sku: producto.sku || '',
        codigo_barras: producto.codigo_barras || '',
        unidad_medida_id: producto.unidad_medida_id,
        stock: producto.stock,
        stock_minimo: producto.stock_minimo,
        foto_url: producto.foto_url || ''
      })
    } else {
      setFormData({
        nombre: '',
        descripcion: '',
        precio: 0,
        costo: 0,
        categoria_id: undefined,
        sku: '',
        codigo_barras: '',
        unidad_medida_id: undefined,
        stock: 0,
        stock_minimo: 0,
        foto_url: ''
      })
    }
    setErrors({})
  }, [producto, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido'
    }

    if (formData.precio <= 0) {
      newErrors.precio = 'El precio debe ser mayor a 0'
    }

    if (formData.costo < 0) {
      newErrors.costo = 'El costo no puede ser negativo'
    }

    if (formData.stock < 0) {
      newErrors.stock = 'El stock no puede ser negativo'
    }

    if (formData.stock_minimo < 0) {
      newErrors.stock_minimo = 'El stock mínimo no puede ser negativo'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Error guardando producto:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('_id') && value === '' 
        ? undefined 
        : ['precio', 'costo', 'stock', 'stock_minimo'].includes(name)
        ? parseFloat(value) || 0
        : value
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {producto ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Producto *
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.nombre ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ingrese el nombre del producto"
                disabled={isSubmitting}
              />
              {errors.nombre && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.nombre}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-2">
                SKU
              </label>
              <input
                type="text"
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Código único del producto"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="codigo_barras" className="block text-sm font-medium text-gray-700 mb-2">
                Código de Barras
              </label>
              <input
                type="text"
                id="codigo_barras"
                name="codigo_barras"
                value={formData.codigo_barras}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Código de barras"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="categoria_id" className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <select
                id="categoria_id"
                name="categoria_id"
                value={formData.categoria_id || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isSubmitting}
              >
                <option value="">Seleccione una categoría</option>
                {categorias.length > 0 ? (
                  categorias.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nombre}
                    </option>
                  ))
                ) : (
                  <option disabled>No hay categorías disponibles</option>
                )}
              </select>
            </div>

            <div>
              <label htmlFor="unidad_medida_id" className="block text-sm font-medium text-gray-700 mb-2">
                Unidad de Medida
              </label>
              <select
                id="unidad_medida_id"
                name="unidad_medida_id"
                value={formData.unidad_medida_id || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isSubmitting}
              >
                <option value="">Seleccione una unidad</option>
                {unidadesMedida.length > 0 ? (
                  unidadesMedida.map((unidad) => (
                    <option key={unidad.id} value={unidad.id}>
                      {unidad.nombre} ({unidad.simbolo})
                    </option>
                  ))
                ) : (
                  <option disabled>No hay unidades disponibles</option>
                )}
              </select>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Descripción del producto"
              disabled={isSubmitting}
            />
          </div>

          {/* Precios */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="precio" className="block text-sm font-medium text-gray-700 mb-2">
                Precio de Venta *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  id="precio"
                  name="precio"
                  value={formData.precio}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.precio ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                  disabled={isSubmitting}
                />
              </div>
              {errors.precio && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.precio}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="costo" className="block text-sm font-medium text-gray-700 mb-2">
                Costo *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  id="costo"
                  name="costo"
                  value={formData.costo}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.costo ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                  disabled={isSubmitting}
                />
              </div>
              {errors.costo && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.costo}
                </p>
              )}
            </div>
          </div>

          {/* Stock */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-2">
                Stock Actual *
              </label>
              <input
                type="number"
                id="stock"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.stock ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0"
                disabled={isSubmitting}
              />
              {errors.stock && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.stock}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="stock_minimo" className="block text-sm font-medium text-gray-700 mb-2">
                Stock Mínimo *
              </label>
              <input
                type="number"
                id="stock_minimo"
                name="stock_minimo"
                value={formData.stock_minimo}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.stock_minimo ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0"
                disabled={isSubmitting}
              />
              {errors.stock_minimo && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.stock_minimo}
                </p>
              )}
            </div>
          </div>

          {/* URL de Foto */}
          <div>
            <label htmlFor="foto_url" className="block text-sm font-medium text-gray-700 mb-2">
              URL de la Foto
            </label>
            <input
              type="url"
              id="foto_url"
              name="foto_url"
              value={formData.foto_url}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="https://ejemplo.com/imagen.jpg"
              disabled={isSubmitting}
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {producto ? 'Actualizar' : 'Crear'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
