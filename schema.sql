-- ======================================================
-- ESQUEMA POS e INVENTARIO (desde cero)
-- - IDs compactos (BIGSERIAL) para tablas de volumen
-- - UUID sólo en usuarios para integrarse con auth.users (Supabase)
-- - Sin tabla marcas (producción propia de vinos)
-- - Tabla unificada: estados (venta/pedido/cuenta)
-- - Añadida tabla articulos_pedidos para controlar pedidos de productos/insumos
-- ======================================================

-- 0) Extensiones (solo si usás UUIDs / funciones uuid_generate_v4)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1) Función helper: actualizar timestamp "actualizado_en"
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ======================================
-- CATÁLOGOS / LOOKUPS (enteros)
-- ======================================
CREATE TABLE roles (
  id BIGSERIAL PRIMARY KEY,
  clave VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE categorias (
  id BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(150) UNIQUE NOT NULL,
  descripcion TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE unidades_medida (
  id BIGSERIAL PRIMARY KEY,
  clave VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE metodos_pago (
  id BIGSERIAL PRIMARY KEY,
  clave VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla unificada de estados (venta/pedido/cuenta)
CREATE TABLE estados (
  id BIGSERIAL PRIMARY KEY,
  categoria VARCHAR(50) NOT NULL, -- 'venta', 'pedido', 'cuenta'
  clave VARCHAR(50) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (categoria, clave)
);

CREATE TABLE tipos_movimiento_inventario (
  id BIGSERIAL PRIMARY KEY,
  clave VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tipos_movimiento_insumos (
  id BIGSERIAL PRIMARY KEY,
  clave VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tipos_tercero (
  id BIGSERIAL PRIMARY KEY,
  clave VARCHAR(30) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT
);


-- ======================================
-- USUARIOS (vinculados a auth.users en Supabase)
-- ======================================
-- Si no usás auth.users, convertí id UUID -> BIGSERIAL y ajustá FKs (ver nota al final)
CREATE TABLE usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    rol_id BIGINT REFERENCES roles(id) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    apellido VARCHAR(150),
    ci VARCHAR(50),
    nit VARCHAR(50),
    telefono VARCHAR(50),
    direccion TEXT,
    fecha_nacimiento DATE,
    foto_url TEXT,
    correo VARCHAR(255),
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX ux_usuarios_correo ON usuarios(correo) WHERE correo IS NOT NULL;

CREATE TRIGGER trg_usuarios_updated
BEFORE UPDATE ON usuarios
FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();


-- ======================================
-- TERCEROS (clientes / proveedores / distribuidores)
-- ======================================
CREATE TABLE terceros (
  id BIGSERIAL PRIMARY KEY,
  tipo_id BIGINT NOT NULL REFERENCES tipos_tercero(id),
  nombre VARCHAR(255) NOT NULL,
  nit VARCHAR(50),
  ci VARCHAR(50),
  email VARCHAR(255),
  telefono VARCHAR(50),
  direccion TEXT,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  activo BOOLEAN DEFAULT TRUE,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX ux_terceros_nit ON terceros(nit) WHERE nit IS NOT NULL;
CREATE INDEX idx_terceros_nombre ON terceros(nombre);

CREATE TRIGGER trg_terceros_updated
BEFORE UPDATE ON terceros
FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();


CREATE TABLE cliente_info (
  tercero_id BIGINT PRIMARY KEY REFERENCES terceros(id) ON DELETE CASCADE,
  deuda_actual DECIMAL(12,2) DEFAULT 0,
  limite_credito DECIMAL(12,2) DEFAULT 0,
  condiciones_pago TEXT
);

CREATE TABLE proveedor_info (
  tercero_id BIGINT PRIMARY KEY REFERENCES terceros(id) ON DELETE CASCADE,
  contacto TEXT,
  condicion_pago TEXT
);


-- ======================================
-- EMPLEADOS, HORARIOS, ASISTENCIAS
-- ======================================
CREATE TABLE empleados (
  id BIGSERIAL PRIMARY KEY,
  usuario_id UUID UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
  fecha_contratacion DATE,
  tipo_contrato VARCHAR(50),
  salario_hora NUMERIC(12,2),
  salario_mensual NUMERIC(12,2),
  cuenta_bancaria TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_empleados_updated
BEFORE UPDATE ON empleados
FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TABLE horarios_plantilla (
  id BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  hora_entrada TIME,
  hora_salida TIME,
  dias_semana VARCHAR(100),
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE empleado_horario (
  id BIGSERIAL PRIMARY KEY,
  empleado_id BIGINT REFERENCES empleados(id) ON DELETE CASCADE,
  plantilla_id BIGINT REFERENCES horarios_plantilla(id) ON DELETE SET NULL,
  fecha_inicio DATE,
  fecha_fin DATE,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE asistencias (
  id BIGSERIAL PRIMARY KEY,
  empleado_id BIGINT REFERENCES empleados(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  hora_entrada TIMESTAMPTZ,
  hora_salida TIMESTAMPTZ,
  horas_trabajadas NUMERIC(6,2),
  creado_en TIMESTAMPTZ DEFAULT NOW()
);


-- ======================================
-- PRODUCTOS (stock total en productos.stock)
-- - No hay marcas (producen sus propios vinos)
-- ======================================
CREATE TABLE productos (
  id BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(12,2) NOT NULL,
  costo DECIMAL(12,2) NOT NULL,
  categoria_id BIGINT REFERENCES categorias(id) ON DELETE SET NULL,
  sku VARCHAR(100),
  codigo_barras VARCHAR(100),
  unidad_medida_id BIGINT REFERENCES unidades_medida(id) ON DELETE SET NULL,
  stock NUMERIC(14,4) DEFAULT 0,
  stock_minimo NUMERIC(14,4) DEFAULT 0,
  foto_url TEXT,
  activo BOOLEAN DEFAULT TRUE,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (sku),
  UNIQUE (codigo_barras)
);

CREATE INDEX idx_productos_nombre ON productos(nombre);
CREATE INDEX idx_productos_sku ON productos(sku);
CREATE INDEX idx_productos_codigo_barras ON productos(codigo_barras);

CREATE TRIGGER trg_productos_updated
BEFORE UPDATE ON productos
FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();


-- ======================================
-- MOVIMIENTOS DE INVENTARIO
-- ======================================
CREATE TABLE movimientos_inventario (
  id BIGSERIAL PRIMARY KEY,
  producto_id BIGINT REFERENCES productos(id) ON DELETE CASCADE,
  tipo_id BIGINT REFERENCES tipos_movimiento_inventario(id) NOT NULL,
  referencia_id BIGINT,            -- referencia polimórfica a tablas locales (pedido/venta/orden)
  referencia_tipo VARCHAR(50),
  cantidad NUMERIC(14,4) NOT NULL,
  usuario_id UUID REFERENCES usuarios(id),
  fecha TIMESTAMPTZ DEFAULT NOW(),
  notas TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mov_inv_producto ON movimientos_inventario(producto_id);
CREATE INDEX idx_mov_inv_fecha ON movimientos_inventario(fecha);


-- ======================================
-- INSUMOS, RECETAS, MOVIMIENTOS
-- ======================================
CREATE TABLE insumos (
  id BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  unidad_medida_id BIGINT REFERENCES unidades_medida(id) ON DELETE SET NULL,
  stock NUMERIC(14,4) DEFAULT 0,
  stock_minimo NUMERIC(14,4) DEFAULT 0,
  foto_url TEXT,
  activo BOOLEAN DEFAULT TRUE,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_insumos_updated
BEFORE UPDATE ON insumos
FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TABLE movimientos_insumos (
  id BIGSERIAL PRIMARY KEY,
  insumo_id BIGINT REFERENCES insumos(id) ON DELETE CASCADE,
  tipo_id BIGINT REFERENCES tipos_movimiento_insumos(id) NOT NULL,
  referencia_id BIGINT,
  referencia_tipo VARCHAR(50),
  cantidad NUMERIC(14,4) NOT NULL,
  usuario_id UUID REFERENCES usuarios(id),
  fecha TIMESTAMPTZ DEFAULT NOW(),
  notas TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE receta_insumos (
  id BIGSERIAL PRIMARY KEY,
  producto_id BIGINT REFERENCES productos(id) ON DELETE CASCADE,
  insumo_id BIGINT REFERENCES insumos(id) ON DELETE RESTRICT,
  cantidad_por_unidad NUMERIC(18,6) NOT NULL,
  obligatorio BOOLEAN DEFAULT TRUE,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (producto_id, insumo_id)
);


-- ======================================
-- PRODUCCIÓN
-- ======================================
CREATE TABLE producciones (
  id BIGSERIAL PRIMARY KEY,
  producto_id BIGINT REFERENCES productos(id) ON DELETE RESTRICT,
  cantidad_producida NUMERIC(14,4) NOT NULL,
  usuario_id UUID REFERENCES usuarios(id),
  fecha TIMESTAMPTZ DEFAULT NOW(),
  notas TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE produccion_insumos (
  id BIGSERIAL PRIMARY KEY,
  produccion_id BIGINT REFERENCES producciones(id) ON DELETE CASCADE,
  insumo_id BIGINT REFERENCES insumos(id) ON DELETE RESTRICT,
  cantidad_consumida NUMERIC(14,4) NOT NULL,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);


-- ======================================
-- VENTAS y ITEMS
-- ======================================
CREATE TABLE ventas (
  id BIGSERIAL PRIMARY KEY,
  tercero_id BIGINT REFERENCES terceros(id),
  usuario_id UUID REFERENCES usuarios(id) NOT NULL,
  pedido_id BIGINT REFERENCES pedidos(id),
  fecha TIMESTAMPTZ DEFAULT NOW(),
  monto_total DECIMAL(12,2) NOT NULL,
  descuento DECIMAL(12,2) DEFAULT 0,
  impuesto DECIMAL(12,2) DEFAULT 0,
  metodo_pago_id BIGINT REFERENCES metodos_pago(id) NOT NULL,
  estado_id BIGINT REFERENCES estados(id),
  notas TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_ventas_updated
BEFORE UPDATE ON ventas
FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TABLE venta_items (
  id BIGSERIAL PRIMARY KEY,
  venta_id BIGINT REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id BIGINT REFERENCES productos(id),
  cantidad NUMERIC(14,4) NOT NULL,
  precio_unitario DECIMAL(12,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);


-- ======================================
-- PEDIDOS y ITEMS
-- ======================================
CREATE TABLE pedidos (
  id BIGSERIAL PRIMARY KEY,
  tercero_id BIGINT REFERENCES terceros(id),
  usuario_id UUID REFERENCES usuarios(id),
  fecha_pedido TIMESTAMPTZ DEFAULT NOW(),
  fecha_entrega DATE,
  estado_id BIGINT REFERENCES estados(id),
  notas TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_pedidos_updated
BEFORE UPDATE ON pedidos
FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TABLE pedido_items (
  id BIGSERIAL PRIMARY KEY,
  pedido_id BIGINT REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id BIGINT REFERENCES productos(id),
  cantidad NUMERIC(14,4) NOT NULL,
  precio_unitario DECIMAL(12,2),
  subtotal DECIMAL(12,2),
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE modificaciones_pedidos (
  id BIGSERIAL PRIMARY KEY,
  pedido_id BIGINT REFERENCES pedidos(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id),
  item_id BIGINT,
  cantidad_anterior NUMERIC(14,4),
  cantidad_nueva NUMERIC(14,4),
  motivo TEXT,
  fecha TIMESTAMPTZ DEFAULT NOW()
);


-- ======================================
-- NUEVA: ARTÍCULOS PEDIDOS (producto o insumo pedido)
-- - Registra pedidos tanto de productos (cliente) como insumos/productos pedidos a proveedor.
-- - Útil para reconciliar recepciones y controlar pérdidas/faltantes.
-- ======================================
CREATE TABLE articulos_pedidos (
  id BIGSERIAL PRIMARY KEY,
  -- tipo redundante para consultas rápidas
  tipo_item VARCHAR(20) NOT NULL CHECK (tipo_item IN ('producto','insumo')),
  producto_id BIGINT REFERENCES productos(id),
  insumo_id BIGINT REFERENCES insumos(id),
  -- obligar que solo uno de producto_id o insumo_id esté presente
  CHECK (
    (producto_id IS NOT NULL AND insumo_id IS NULL)
    OR
    (producto_id IS NULL AND insumo_id IS NOT NULL)
  ),
  -- referencia a pedido (cliente) o orden de compra (proveedor)
  pedido_id BIGINT REFERENCES pedidos(id),
  orden_compra_id BIGINT REFERENCES ordenes_compra(id),
  cantidad_pedida NUMERIC(14,4) NOT NULL,
  cantidad_recibida NUMERIC(14,4) DEFAULT 0,
  cantidad_perdida NUMERIC(14,4) DEFAULT 0,
  estado_id BIGINT REFERENCES estados(id), -- normalmente categoría 'pedido'
  usuario_id UUID REFERENCES usuarios(id),
  fecha_pedido TIMESTAMPTZ DEFAULT NOW(),
  fecha_recepcion TIMESTAMPTZ,
  notas TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- índice para búsquedas y reconciliación rápida
CREATE INDEX idx_artped_producto ON articulos_pedidos(producto_id);
CREATE INDEX idx_artped_insumo ON articulos_pedidos(insumo_id);
CREATE INDEX idx_artped_pedido ON articulos_pedidos(pedido_id);
CREATE INDEX idx_artped_orden ON articulos_pedidos(orden_compra_id);
CREATE INDEX idx_artped_fecha ON articulos_pedidos(fecha_pedido);

-- validar que el estado que se asigne a articulos_pedidos sea de categoria 'pedido'
DROP TRIGGER IF EXISTS trg_validar_estado_articulos_pedidos ON articulos_pedidos;
CREATE TRIGGER trg_validar_estado_articulos_pedidos
BEFORE INSERT OR UPDATE ON articulos_pedidos
FOR EACH ROW EXECUTE FUNCTION validar_estado_categoria('pedido');


-- ======================================
-- ÓRDENES DE COMPRA (proveedores) y ITEMS
-- ======================================
CREATE TABLE ordenes_compra (
  id BIGSERIAL PRIMARY KEY,
  tercero_id BIGINT REFERENCES terceros(id), -- proveedor
  usuario_id UUID REFERENCES usuarios(id) NOT NULL,
  monto_total DECIMAL(12,2) NOT NULL,
  estado_id BIGINT REFERENCES estados(id),
  fecha_orden TIMESTAMPTZ DEFAULT NOW(),
  fecha_prevista TIMESTAMPTZ,
  fecha_recepcion TIMESTAMPTZ,
  notas TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_ordenes_compra_updated
BEFORE UPDATE ON ordenes_compra
FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TABLE orden_items (
  id BIGSERIAL PRIMARY KEY,
  orden_id BIGINT REFERENCES ordenes_compra(id) ON DELETE CASCADE,
  producto_id BIGINT REFERENCES productos(id),
  cantidad NUMERIC(14,4) NOT NULL,
  costo_unitario DECIMAL(12,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  cantidad_recibida NUMERIC(14,4) DEFAULT 0,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);


-- ======================================
-- FINANZAS: transacciones, cuentas por cobrar/pagar, deudas
-- ======================================
CREATE TABLE transacciones (
  id BIGSERIAL PRIMARY KEY,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ingreso','gasto')),
  categoria VARCHAR(100),
  monto DECIMAL(12,2) NOT NULL,
  descripcion TEXT,
  referencia_id BIGINT,    -- referencia local
  referencia_tipo VARCHAR(50),
  metodo_pago_id BIGINT REFERENCES metodos_pago(id),
  usuario_id UUID REFERENCES usuarios(id),
  fecha_transaccion TIMESTAMPTZ DEFAULT NOW(),
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_transacciones_updated
BEFORE UPDATE ON transacciones
FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TABLE cuentas_cobrar (
  id BIGSERIAL PRIMARY KEY,
  tercero_id BIGINT REFERENCES terceros(id),
  venta_id BIGINT REFERENCES ventas(id),
  monto DECIMAL(12,2) NOT NULL,
  monto_pagado DECIMAL(12,2) DEFAULT 0,
  fecha_vencimiento DATE,
  estado_id BIGINT REFERENCES estados(id),
  notas TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_cuentas_cobrar_updated
BEFORE UPDATE ON cuentas_cobrar
FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TABLE cuentas_pagar (
  id BIGSERIAL PRIMARY KEY,
  tercero_id BIGINT REFERENCES terceros(id),
  orden_id BIGINT REFERENCES ordenes_compra(id),
  monto DECIMAL(12,2) NOT NULL,
  monto_pagado DECIMAL(12,2) DEFAULT 0,
  fecha_vencimiento DATE,
  estado_id BIGINT REFERENCES estados(id),
  notas TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_cuentas_pagar_updated
BEFORE UPDATE ON cuentas_pagar
FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TABLE deudas_generales (
  id BIGSERIAL PRIMARY KEY,
  descripcion TEXT NOT NULL,
  monto_total DECIMAL(14,2) NOT NULL,
  monto_pagado DECIMAL(14,2) DEFAULT 0,
  fecha_inicio DATE,
  fecha_vencimiento DATE,
  frecuencia_pago VARCHAR(50),
  proximo_pago DATE,
  estado_id BIGINT REFERENCES estados(id),
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_deudas_generales_updated
BEFORE UPDATE ON deudas_generales
FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();


-- ======================================
-- PÉRDIDAS
-- ======================================
CREATE TABLE perdidas (
  id BIGSERIAL PRIMARY KEY,
  tipo_item VARCHAR(20) NOT NULL CHECK (tipo_item IN ('insumo','producto')),
  insumo_id BIGINT REFERENCES insumos(id) ON DELETE SET NULL,
  producto_id BIGINT REFERENCES productos(id) ON DELETE SET NULL,
  cantidad NUMERIC(14,4) NOT NULL,
  valor_unitario DECIMAL(12,2),
  valor_total DECIMAL(14,2) GENERATED ALWAYS AS (cantidad * COALESCE(valor_unitario,0)) STORED,
  motivo TEXT,
  usuario_id UUID REFERENCES usuarios(id),
  fecha TIMESTAMPTZ DEFAULT NOW(),
  creado_en TIMESTAMPTZ DEFAULT NOW()
);


-- ======================================
-- NOTIFICACIONES / CONFIGURACIÓN
-- ======================================
CREATE TABLE notificaciones (
  id BIGSERIAL PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id),
  tipo VARCHAR(50),
  titulo VARCHAR(255) NOT NULL,
  mensaje TEXT NOT NULL,
  prioridad VARCHAR(20) DEFAULT 'media' CHECK (prioridad IN ('baja','media','alta')),
  leido BOOLEAN DEFAULT FALSE,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE configuracion (
  id BIGSERIAL PRIMARY KEY,
  clave VARCHAR(150) UNIQUE NOT NULL,
  valor TEXT NOT NULL,
  descripcion TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_configuracion_updated
BEFORE UPDATE ON configuracion
FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();


-- ======================================
-- ÍNDICES ADICIONALES SUGERIDOS
-- ======================================
CREATE INDEX IF NOT EXISTS idx_insumos_nombre ON insumos(nombre);
CREATE INDEX IF NOT EXISTS idx_terceros_tipo_nombre ON terceros(tipo_id, nombre);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_estado ON ordenes_compra(estado_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos_inventario(fecha);
CREATE INDEX IF NOT EXISTS idx_movimientos_insumos_fecha ON movimientos_insumos(fecha);


-- ======================================
-- Función de validación: asegurar que el estado pertenece a la categoría esperada
-- Uso: crear trigger que llame a esta función pasando la categoría esperada como argumento
-- ======================================
CREATE OR REPLACE FUNCTION validar_estado_categoria() RETURNS TRIGGER AS $$
DECLARE
  cat TEXT;
  esperado TEXT := TG_ARGV[0];
BEGIN
  IF NEW.estado_id IS NULL THEN
    RETURN NEW; -- permitir NULL si negocio lo permite
  END IF;
  SELECT categoria INTO cat FROM estados WHERE id = NEW.estado_id;
  IF cat IS NULL THEN
    RAISE EXCEPTION 'estado id % no encontrado en tabla estados', NEW.estado_id;
  END IF;
  IF esperado IS NOT NULL AND cat <> esperado THEN
    RAISE EXCEPTION 'estado inválido: se esperaba categoría %, se obtuvo % (estado_id=%)', esperado, cat, NEW.estado_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Crear triggers que validen categoría para las tablas que usan estados
DROP TRIGGER IF EXISTS trg_validar_estado_ventas ON ventas;
CREATE TRIGGER trg_validar_estado_ventas
BEFORE INSERT OR UPDATE ON ventas
FOR EACH ROW EXECUTE FUNCTION validar_estado_categoria('venta');

DROP TRIGGER IF EXISTS trg_validar_estado_pedidos ON pedidos;
CREATE TRIGGER trg_validar_estado_pedidos
BEFORE INSERT OR UPDATE ON pedidos
FOR EACH ROW EXECUTE FUNCTION validar_estado_categoria('pedido');

DROP TRIGGER IF EXISTS trg_validar_estado_ordenes ON ordenes_compra;
CREATE TRIGGER trg_validar_estado_ordenes
BEFORE INSERT OR UPDATE ON ordenes_compra
FOR EACH ROW EXECUTE FUNCTION validar_estado_categoria('pedido');

DROP TRIGGER IF EXISTS trg_validar_estado_cuentas_cobrar ON cuentas_cobrar;
CREATE TRIGGER trg_validar_estado_cuentas_cobrar
BEFORE INSERT OR UPDATE ON cuentas_cobrar
FOR EACH ROW EXECUTE FUNCTION validar_estado_categoria('cuenta');

DROP TRIGGER IF EXISTS trg_validar_estado_cuentas_pagar ON cuentas_pagar;
CREATE TRIGGER trg_validar_estado_cuentas_pagar
BEFORE INSERT OR UPDATE ON cuentas_pagar
FOR EACH ROW EXECUTE FUNCTION validar_estado_categoria('cuenta');

DROP TRIGGER IF EXISTS trg_validar_estado_deudas ON deudas_generales;
CREATE TRIGGER trg_validar_estado_deudas
BEFORE INSERT OR UPDATE ON deudas_generales
FOR EACH ROW EXECUTE FUNCTION validar_estado_categoria('cuenta');


-- ======================================
-- POBLAR CATÁLOGOS BÁSICOS (valores iniciales)
-- ======================================
-- Roles
INSERT INTO roles (clave, nombre) VALUES
  ('administrador', 'Administrador'),
  ('empleado', 'Empleado'),
  ('proveedor', 'Proveedor'),
  ('distribuidor', 'Distribuidor')
ON CONFLICT (clave) DO NOTHING;

-- Tipos de tercero
INSERT INTO tipos_tercero (clave, nombre) VALUES
  ('cliente', 'Cliente'),
  ('proveedor', 'Proveedor'),
  ('distribuidor', 'Distribuidor'),
  ('otro', 'Otro')
ON CONFLICT (clave) DO NOTHING;

-- Métodos de pago
INSERT INTO metodos_pago (clave, nombre) VALUES
  ('efectivo', 'Efectivo'),
  ('tarjeta', 'Tarjeta'),
  ('transferencia', 'Transferencia'),
  ('credito', 'Crédito'),
  ('cheque', 'Cheque')
ON CONFLICT (clave) DO NOTHING;

-- Tipos de movimiento inventario
INSERT INTO tipos_movimiento_inventario (clave, nombre) VALUES
  ('entrada', 'Entrada'),
  ('salida', 'Salida'),
  ('ajuste', 'Ajuste'),
  ('perdida', 'Pérdida'),
  ('devolucion', 'Devolución')
ON CONFLICT (clave) DO NOTHING;

-- Tipos de movimiento insumos
INSERT INTO tipos_movimiento_insumos (clave, nombre) VALUES
  ('entrada', 'Entrada'),
  ('salida', 'Salida'),
  ('consumo', 'Consumo'),
  ('ajuste', 'Ajuste'),
  ('perdida', 'Pérdida'),
  ('devolucion', 'Devolución')
ON CONFLICT (clave) DO NOTHING;

-- Estados (unificados)
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
  ('cuenta', 'vencido', 'Vencido'
)
ON CONFLICT (categoria, clave) DO NOTHING;


-- Algunas unidades de medida comunes (opcional)
INSERT INTO unidades_medida (clave, nombre) VALUES
  ('unidad', 'Unidad'),
  ('litro', 'Litro'),
  ('mililitro', 'Mililitro'),
  ('kilogramo', 'Kilogramo'),
  ('gramo', 'Gramo'),
  ('botella', 'Botella')
ON CONFLICT (clave) DO NOTHING;


-- ======================================
-- NOTAS OPERATIVAS (breves)
-- ======================================
/*
- Para actualizar stock evita race conditions: usa TRANSACTION y SELECT ... FOR UPDATE sobre la fila producto.
- Flujo sugerido cuando recibís una orden de compra:
    1) Registrar orden_items y articulos_pedidos (cantidad_pedida).
    2) Al recibir, actualizar articulos_pedidos.cantidad_recibida, crear movimientos_inventario / movimientos_insumos y actualizar productos.stock / insumos.stock.
    3) Si hay diferencia (cantidad_pedida > cantidad_recibida), registrar en 'perdidas' si corresponde y actualizar articulos_pedidos.cantidad_perdida.
- Reconciliación automática: podés crear jobs que comparen (orden_items / articulos_pedidos) vs movimientos_* y generen alertas si hay discrepancias.
- Implementa RLS en Supabase para restringir acceso según rol.
- Considerar tabla audit_logs con cambios importantes (ventas, pedidos, cuentas).
*/

-- ======================================================
-- FIN
-- ======================================================
