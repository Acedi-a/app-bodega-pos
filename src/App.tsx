import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { PublicRoute } from './components/PublicRoute'
import { MainLayout } from './components/dashboard/MainLayout'
import { LoginPage } from './pages/login/LoginPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { ClientesPage } from './pages/ClientesPage'
import { ProveedoresPage } from './pages/ProveedoresPage'
import { ProductosPage } from './pages/ProductosPage'
import { VentasPage } from './pages/VentasPage'
import InventarioPage from './pages/InventarioPage'
import InsumosPage from './pages/InsumosPage'
import RecetasPage from './pages/RecetasPage'
import { DatabaseDebug } from './components/DatabaseDebug'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rutas públicas (solo accesibles cuando NO está logueado) */}
          <Route path="/login" element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } />
          
          {/* Ruta de debug temporal */}
          <Route path="/debug" element={<DatabaseDebug />} />
          
          {/* Rutas protegidas */}
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="clientes" element={<ClientesPage />} />
            <Route path="proveedores" element={<ProveedoresPage />} />
            <Route path='productos' element={<ProductosPage />} />
            <Route path='ventas' element={<VentasPage />} />
            <Route path='inventario' element={<InventarioPage />} />
            <Route path='insumos' element={<InsumosPage />} />
            <Route path='recetas' element={<RecetasPage />} />
            {/* Aquí se agregarán más rutas */}
          </Route>

          {/* Ruta de fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
