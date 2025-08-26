import React, { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { ClienteStatsCards } from '../components/clientes/ClienteStatsCards'
import { ClienteTable } from '../components/clientes/ClienteTable'
import { ClienteModal } from '../components/clientes/ClienteModal'
import { ClienteDetailModal } from '../components/clientes/ClienteDetailModal'
import { clienteService } from '../services/ClienteService'
import type { Cliente } from '../types/clientes'

export const ClientesPage: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Estados de modales
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)

  useEffect(() => {
    loadClientes()
  }, [])

  useEffect(() => {
    filterClientes()
  }, [clientes, searchTerm])

  const loadClientes = async () => {
    setLoading(true)
    try {
      const { data } = await clienteService.getClientes()
      setClientes(data)
    } catch (error) {
      console.error('Error cargando clientes:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterClientes = () => {
    if (!searchTerm.trim()) {
      setFilteredClientes(clientes)
      return
    }

    const filtered = clientes.filter(cliente =>
      cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.nit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.ci?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.telefono?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredClientes(filtered)
  }

  const handleCreateCliente = async (clienteData: any) => {
    try {
      const { error } = await clienteService.createCliente(clienteData)
      if (error) throw error
      
      await loadClientes()
      setShowCreateModal(false)
    } catch (error) {
      console.error('Error creando cliente:', error)
      throw error
    }
  }

  const handleEditCliente = async (id: number, clienteData: any) => {
    try {
      const { error } = await clienteService.updateCliente(id, clienteData)
      if (error) throw error
      
      await loadClientes()
      setShowEditModal(false)
      setSelectedCliente(null)
    } catch (error) {
      console.error('Error actualizando cliente:', error)
      throw error
    }
  }

  const handleDeleteCliente = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
      return
    }

    try {
      const { error } = await clienteService.deleteCliente(id)
      if (error) throw error
      
      await loadClientes()
    } catch (error) {
      console.error('Error eliminando cliente:', error)
    }
  }

  const openEditModal = (cliente: Cliente) => {
    setSelectedCliente(cliente)
    setShowEditModal(true)
  }

  const openDetailModal = (cliente: Cliente) => {
    setSelectedCliente(cliente)
    setShowDetailModal(true)
  }

  const closeModals = () => {
    setShowCreateModal(false)
    setShowEditModal(false)
    setShowDetailModal(false)
    setSelectedCliente(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600 mt-1">
            Gestiona la información de tus clientes y su historial de compras
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Cliente
        </button>
      </div>

      {/* Estadísticas */}
      <ClienteStatsCards />

      {/* Barra de búsqueda */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar clientes por nombre, NIT, CI, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          <div className="text-sm text-gray-500">
            {filteredClientes.length} de {clientes.length} clientes
          </div>
        </div>
      </div>

      {/* Tabla de clientes */}
      <div className="bg-white rounded-lg border border-gray-200">
        <ClienteTable
          clientes={filteredClientes}
          onEdit={openEditModal}
          onDelete={handleDeleteCliente}
          onViewDetails={openDetailModal}
        />
      </div>

      {/* Modales */}
      <ClienteModal
        isOpen={showCreateModal}
        onClose={closeModals}
        onSubmit={handleCreateCliente}
        title="Crear Nuevo Cliente"
      />

      <ClienteModal
        isOpen={showEditModal}
        onClose={closeModals}
        onSubmit={(data) => handleEditCliente(selectedCliente!.id, data)}
        cliente={selectedCliente}
        title="Editar Cliente"
      />

      <ClienteDetailModal
        isOpen={showDetailModal}
        onClose={closeModals}
        cliente={selectedCliente}
      />
    </div>
  )
}
