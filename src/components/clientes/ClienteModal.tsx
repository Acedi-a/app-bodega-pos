import React, { useState, useEffect } from 'react'
import { X, Save, User } from 'lucide-react'
import type { Cliente, CreateClienteData, UpdateClienteData } from '../../types/clientes'

interface ClienteModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateClienteData | UpdateClienteData) => Promise<void>
  cliente?: Cliente | null
  title: string
}

export const ClienteModal: React.FC<ClienteModalProps> = ({ 
  isOpen, 
  onClose, 
  cliente,
  onSubmit,
  title
}) => {
  const [formData, setFormData] = useState<CreateClienteData>({
    nombre: '',
    nit: '',
    ci: '',
    email: '',
    telefono: '',
    direccion: '',
    limite_credito: 0,
    condiciones_pago: ''
  })
  const [loading, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditing = Boolean(cliente)

  useEffect(() => {
    if (cliente) {
      setFormData({
        nombre: cliente.nombre,
        nit: cliente.nit || '',
        ci: cliente.ci || '',
        email: cliente.email || '',
        telefono: cliente.telefono || '',
        direccion: cliente.direccion || '',
        limite_credito: cliente.cliente_info?.limite_credito || 0,
        condiciones_pago: cliente.cliente_info?.condiciones_pago || ''
      })
    } else {
      setFormData({
        nombre: '',
        nit: '',
        ci: '',
        email: '',
        telefono: '',
        direccion: '',
        limite_credito: 0,
        condiciones_pago: ''
      })
    }
    setErrors({})
  }, [cliente, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido'
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    if ((formData.limite_credito || 0) < 0) {
      newErrors.limite_credito = 'El límite de crédito no puede ser negativo'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setSaving(true)

    try {
      if (isEditing && cliente) {
        const updateData: UpdateClienteData = {
          ...formData,
          activo: cliente.activo
        }
        await onSubmit(updateData)
      } else {
        await onSubmit(formData)
      }

      onClose()
    } catch (error) {
      console.error('Error guardando cliente:', error)
      alert('Error al guardar el cliente')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof CreateClienteData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {title}
              </h2>
              <p className="text-sm text-gray-600">
                {isEditing ? 'Actualizar información del cliente' : 'Crear un nuevo cliente'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre *
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                  errors.nombre ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Nombre del cliente"
              />
              {errors.nombre && (
                <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NIT
              </label>
              <input
                type="text"
                value={formData.nit}
                onChange={(e) => handleInputChange('nit', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Número de NIT"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CI
              </label>
              <input
                type="text"
                value={formData.ci}
                onChange={(e) => handleInputChange('ci', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Cédula de identidad"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="correo@ejemplo.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => handleInputChange('telefono', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="+591 XXXXXXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Límite de Crédito (Bs.)
              </label>
              <input
                type="number"
                value={formData.limite_credito}
                onChange={(e) => handleInputChange('limite_credito', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                  errors.limite_credito ? 'border-red-300' : 'border-gray-300'
                }`}
                min="0"
                step="0.01"
                placeholder="0.00"
              />
              {errors.limite_credito && (
                <p className="mt-1 text-sm text-red-600">{errors.limite_credito}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dirección
            </label>
            <textarea
              value={formData.direccion}
              onChange={(e) => handleInputChange('direccion', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Dirección completa del cliente"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Condiciones de Pago
            </label>
            <textarea
              value={formData.condiciones_pago}
              onChange={(e) => handleInputChange('condiciones_pago', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Condiciones especiales de pago (ej: 30 días, contado, etc.)"
            />
          </div>

          {/* Botones */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Guardando...' : 'Guardar Cliente'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
