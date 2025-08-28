-- ======================================
-- DATOS BÁSICOS PARA EL SISTEMA
-- ======================================

-- Insertar categorías básicas
INSERT INTO categorias (nombre, descripcion) VALUES
('Vinto tinto', 'Productos en base a vino tinto'),
('Vino blanco', 'Productos en base vino blanco'),
('Singani', 'Productos en base a singani'),
('Otros', 'Otras categorias')

-- Insertar unidades de medida básicas
INSERT INTO unidades_medida (clave, nombre) VALUES
('bot', 'Botella'),
('l', 'Litro'),
('ml', 'Mililitro'),
('ud', 'Unidad'),
('caja', 'Caja'),
('paq', 'Paquete'),
('kg', 'Kilogramo'),
('g', 'Gramo')
ON CONFLICT (clave) DO NOTHING;
