-- Script para inicializar datos básicos en Supabase
-- Ejecuta este script en el SQL Editor de Supabase Dashboard

-- 1. Insertar roles básicos
INSERT INTO roles (clave, nombre, descripcion) VALUES
  ('administrador', 'Administrador', 'Acceso completo al sistema'),
  ('empleado', 'Empleado', 'Acceso limitado para empleados'),
  ('distribuidor', 'Distribuidor', 'Acceso para distribuidores')
ON CONFLICT (clave) DO NOTHING;

-- 2. Insertar tipos de tercero
INSERT INTO tipos_tercero (clave, nombre, descripcion) VALUES
  ('cliente', 'Cliente', 'Clientes de la bodega'),
  ('proveedor', 'Proveedor', 'Proveedores de insumos'),
  ('distribuidor', 'Distribuidor', 'Distribuidores de productos')
ON CONFLICT (clave) DO NOTHING;

-- 3. Insertar métodos de pago
INSERT INTO metodos_pago (clave, nombre) VALUES
  ('efectivo', 'Efectivo'),
  ('tarjeta', 'Tarjeta'),
  ('transferencia', 'Transferencia'),
  ('credito', 'Crédito'),
  ('cheque', 'Cheque')
ON CONFLICT (clave) DO NOTHING;

-- 4. Insertar estados
INSERT INTO estados (categoria, clave, nombre) VALUES
  ('venta', 'pendiente', 'Pendiente'),
  ('venta', 'completada', 'Completada'),
  ('venta', 'cancelada', 'Cancelada'),
  ('venta', 'reembolsada', 'Reembolsada'),
  ('pedido', 'pendiente', 'Pendiente'),
  ('pedido', 'confirmado', 'Confirmado'),
  ('pedido', 'en_proceso', 'En proceso'),
  ('pedido', 'entregado', 'Entregado'),
  ('pedido', 'cancelado', 'Cancelado'),
  ('cuenta', 'pendiente', 'Pendiente'),
  ('cuenta', 'parcial', 'Parcial'),
  ('cuenta', 'pagado', 'Pagado'),
  ('cuenta', 'vencido', 'Vencido')
ON CONFLICT (categoria, clave) DO NOTHING;

-- 5. Insertar tipos de movimiento de inventario
INSERT INTO tipos_movimiento_inventario (clave, nombre) VALUES
  ('entrada', 'Entrada'),
  ('salida', 'Salida'),
  ('ajuste', 'Ajuste'),
  ('perdida', 'Pérdida'),
  ('devolucion', 'Devolución')
ON CONFLICT (clave) DO NOTHING;

-- 6. Insertar tipos de movimiento de insumos
INSERT INTO tipos_movimiento_insumos (clave, nombre) VALUES
  ('entrada', 'Entrada'),
  ('salida', 'Salida'),
  ('consumo', 'Consumo'),
  ('ajuste', 'Ajuste'),
  ('perdida', 'Pérdida'),
  ('devolucion', 'Devolución')
ON CONFLICT (clave) DO NOTHING;

-- 7. Insertar unidades de medida
INSERT INTO unidades_medida (clave, nombre) VALUES
  ('unidad', 'Unidad'),
  ('litro', 'Litro'),
  ('mililitro', 'Mililitro'),
  ('kilogramo', 'Kilogramo'),
  ('gramo', 'Gramo'),
  ('botella', 'Botella'),
  ('caja', 'Caja'),
  ('docena', 'Docena')
ON CONFLICT (clave) DO NOTHING;

-- 8. Verificar que se crearon correctamente
SELECT 'Roles' as tabla, count(*) as registros FROM roles
UNION ALL
SELECT 'Tipos de tercero', count(*) FROM tipos_tercero
UNION ALL
SELECT 'Métodos de pago', count(*) FROM metodos_pago
UNION ALL
SELECT 'Estados', count(*) FROM estados
UNION ALL
SELECT 'Tipos mov. inventario', count(*) FROM tipos_movimiento_inventario
UNION ALL
SELECT 'Tipos mov. insumos', count(*) FROM tipos_movimiento_insumos
UNION ALL
SELECT 'Unidades medida', count(*) FROM unidades_medida;

-- 9. Configurar políticas RLS básicas (ejecutar si las tablas no tienen políticas)
-- Nota: Ajusta estas políticas según tu necesidad de seguridad

-- Política para roles (solo lectura para usuarios autenticados)
DROP POLICY IF EXISTS "Los usuarios autenticados pueden leer roles" ON roles;
CREATE POLICY "Los usuarios autenticados pueden leer roles" ON roles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política para usuarios (los usuarios pueden ver y actualizar su propio perfil)
DROP POLICY IF EXISTS "Los usuarios pueden ver su propio perfil" ON usuarios;
CREATE POLICY "Los usuarios pueden ver su propio perfil" ON usuarios
  FOR ALL USING (auth.uid() = id);

-- Habilitar RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Para desarrollo, puedes desactivar RLS temporalmente:
-- ALTER TABLE roles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
