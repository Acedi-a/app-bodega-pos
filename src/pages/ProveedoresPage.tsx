import React, { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { ProveedorStatsCards } from '../components/proveedores/ProveedorStatsCards'
import { ProveedorTable } from '../components/proveedores/ProveedorTable'
import { ProveedorModal } from '../components/proveedores/ProveedorModal'
import { ProveedorDetailModal } from '../components/proveedores/ProveedorDetailModal'
import { proveedorService } from '../services/ProveedorService'
import type { Proveedor } from '../types/proveedores'

export const ProveedoresPage: React.FC = () => {
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [filteredProveedores, setFilteredProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Estados de modales
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null)

  useEffect(() => {
    loadProveedores()
  }, [])

  useEffect(() => {
    filterProveedores()
  }, [proveedores, searchTerm])

  const loadProveedores = async () => {
    setLoading(true)
    try {
      const response = await proveedorService.getProveedores(1, 1000) // Carga todos los proveedores
      setProveedores(response.data)
    } catch (error) {
      console.error('Error cargando proveedores:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterProveedores = () => {
    if (!searchTerm.trim()) {
      setFilteredProveedores(proveedores)
      return
    }

    const filtered = proveedores.filter(proveedor =>
      proveedor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proveedor.nit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proveedor.ci?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proveedor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proveedor.telefono?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredProveedores(filtered)
  }

  const handleCreateProveedor = async (proveedorData: any) => {
    try {
      const { error } = await proveedorService.createProveedor(proveedorData)
      if (error) throw error
      
      await loadProveedores()
      setShowCreateModal(false)
    } catch (error) {
      console.error('Error creando proveedor:', error)
      throw error
    }
  }

  const handleEditProveedor = async (id: number, proveedorData: any) => {
    try {
      const { error } = await proveedorService.updateProveedor(id, proveedorData)
      if (error) throw error
      
      await loadProveedores()
      setShowEditModal(false)
      setSelectedProveedor(null)
    } catch (error) {
      console.error('Error actualizando proveedor:', error)
      throw error
    }
  }

  const handleDeleteProveedor = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este proveedor?')) {
      return
    }

    try {
      const { error } = await proveedorService.deleteProveedor(id)
      if (error) throw error
      
      await loadProveedores()
    } catch (error) {
      console.error('Error eliminando proveedor:', error)
    }
  }

  const openEditModal = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor)
    setShowEditModal(true)
  }

  const openDetailModal = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor)
    setShowDetailModal(true)
  }

  const closeModals = () => {
    setShowCreateModal(false)
    setShowEditModal(false)
    setShowDetailModal(false)
    setSelectedProveedor(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
          <p className="text-gray-600 mt-1">
            Gestiona la información de tus proveedores y su historial comercial
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Proveedor
        </button>
      </div>

      {/* Estadísticas */}
      <ProveedorStatsCards />

      {/* Barra de búsqueda */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar proveedores por nombre, NIT, CI, email, teléfono o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="text-sm text-gray-500">
            {filteredProveedores.length} de {proveedores.length} proveedores
          </div>
        </div>
      </div>

      {/* Tabla de proveedores */}
      <div className="bg-white rounded-lg border border-gray-200">
        <ProveedorTable
          proveedores={filteredProveedores}
          onEdit={openEditModal}
          onDelete={handleDeleteProveedor}
          onViewDetails={openDetailModal}
        />
      </div>

      {/* Modales */}
      <ProveedorModal
        isOpen={showCreateModal}
        onClose={closeModals}
        onSubmit={handleCreateProveedor}
        title="Crear Nuevo Proveedor"
      />

      <ProveedorModal
        isOpen={showEditModal}
        onClose={closeModals}
        onSubmit={(data) => handleEditProveedor(selectedProveedor!.id, data)}
        proveedor={selectedProveedor}
        title="Editar Proveedor"
      />

      <ProveedorDetailModal
        isOpen={showDetailModal}
        onClose={closeModals}
        proveedor={selectedProveedor}
      />
    </div>
  )
}
