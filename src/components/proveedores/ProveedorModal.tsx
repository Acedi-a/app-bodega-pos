import React, { useState, useEffect } from 'react'
import { X, Save, Loader2 } from 'lucide-react'
import type { Proveedor, CreateProveedorData } from '../../types/proveedores'

interface ProveedorModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateProveedorData) => Promise<void>
  proveedor?: Proveedor | null
  title: string
}

export const ProveedorModal: React.FC<ProveedorModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  proveedor,
  title
}) => {
  const [formData, setFormData] = useState<CreateProveedorData>({
    nombre: '',
    nit: '',
    ci: '',
    email: '',
    telefono: '',
    direccion: '',
    contacto: '',
    condicion_pago: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen) {
      if (proveedor) {
        setFormData({
          nombre: proveedor.nombre || '',
          nit: proveedor.nit || '',
          ci: proveedor.ci || '',
          email: proveedor.email || '',
          telefono: proveedor.telefono || '',
          direccion: proveedor.direccion || '',
          contacto: proveedor.proveedor_info?.contacto || '',
          condicion_pago: proveedor.proveedor_info?.condicion_pago || ''
        })
      } else {
        setFormData({
          nombre: '',
          nit: '',
          ci: '',
          email: '',
          telefono: '',
          direccion: '',
          contacto: '',
          condicion_pago: ''
        })
      }
      setErrors({})
    }
  }, [isOpen, proveedor])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido'
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido'
    }

    if (formData.nit && formData.nit.length < 7) {
      newErrors.nit = 'El NIT debe tener al menos 7 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Error al guardar proveedor:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Limpiar error si existe
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre *
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.nombre ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Nombre del proveedor"
                disabled={loading}
              />
              {errors.nombre && (
                <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
              )}
            </div>

            {/* NIT */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NIT
              </label>
              <input
                type="text"
                name="nit"
                value={formData.nit}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.nit ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Número de NIT"
                disabled={loading}
              />
              {errors.nit && (
                <p className="mt-1 text-sm text-red-600">{errors.nit}</p>
              )}
            </div>

            {/* CI */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CI
              </label>
              <input
                type="text"
                name="ci"
                value={formData.ci}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Cédula de identidad"
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="correo@ejemplo.com"
                disabled={loading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Número de teléfono"
                disabled={loading}
              />
            </div>

            {/* Dirección */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección
              </label>
              <textarea
                name="direccion"
                value={formData.direccion}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Dirección completa"
                disabled={loading}
              />
            </div>

            {/* Contacto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contacto
              </label>
              <input
                type="text"
                name="contacto"
                value={formData.contacto}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nombre del contacto"
                disabled={loading}
              />
            </div>

            {/* Condición de pago */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Condición de Pago
              </label>
              <select
                name="condicion_pago"
                value={formData.condicion_pago}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                <option value="">Seleccionar condición</option>
                <option value="contado">Contado</option>
                <option value="credito_15">Crédito 15 días</option>
                <option value="credito_30">Crédito 30 días</option>
                <option value="credito_45">Crédito 45 días</option>
                <option value="credito_60">Crédito 60 días</option>
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}