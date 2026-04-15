-- KRM Rent Car
-- Datos minimos para arrancar el sistema
-- Este seed no publica credenciales por defecto.
-- Crea tu usuario administrador manualmente o vuelve a exportar con SEED_ADMIN_PASSWORD en backend/.env.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM `roles`;
INSERT INTO `roles` (`rol_id`, `nombre`, `descripcion`, `estado`) VALUES
(1, 'Administrador', 'Acceso total al sistema', 1),
(2, 'Empleado', 'Gestiona alquileres, pagos y devoluciones', 1),
(3, 'Supervisor', 'Supervisa operaciones y reportes', 1);

DELETE FROM `permisos`;
INSERT INTO `permisos` (`permiso_id`, `nombre`, `modulo`) VALUES
(1, 'Gestionar usuarios', 'Usuarios'),
(2, 'Gestionar roles', 'Seguridad'),
(3, 'Gestionar permisos', 'Seguridad'),
(4, 'Registrar clientes', 'Clientes'),
(5, 'Editar clientes', 'Clientes'),
(6, 'Registrar vehiculos', 'Vehiculos'),
(7, 'Editar vehiculos', 'Vehiculos'),
(8, 'Configurar precios', 'Precios'),
(9, 'Registrar alquileres', 'Alquileres'),
(10, 'Cancelar alquileres', 'Alquileres'),
(11, 'Procesar devoluciones', 'Devoluciones'),
(12, 'Registrar pagos', 'Pagos'),
(13, 'Consultar reportes', 'Reportes'),
(14, 'Registrar penalidades', 'Penalidades');

DELETE FROM `rol_permisos`;
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`) VALUES
(1, 1),
(1, 2),
(1, 3),
(3, 3),
(1, 4),
(2, 4),
(3, 4),
(1, 5),
(2, 5),
(1, 6),
(1, 7),
(1, 8),
(2, 8),
(3, 8),
(1, 9),
(2, 9),
(3, 9),
(1, 10),
(2, 10),
(1, 11),
(2, 11),
(3, 11),
(1, 12),
(2, 12),
(3, 12),
(1, 13),
(2, 13),
(3, 13),
(1, 14),
(2, 14),
(3, 14);

DELETE FROM `tipo_dia`;
INSERT INTO `tipo_dia` (`tipo_dia_id`, `nombre`, `estado`) VALUES
(1, 'Normal', 1),
(2, 'FinSemana', 1),
(3, 'Feriado', 1);

-- No se incluyo usuario administrador inicial.
-- Ejemplo opcional:
-- INSERT INTO `usuarios` (`usuario_id`, `rol_id`, `nombre`, `apellido`, `username`, `password`, `imagen_url`, `estado`) VALUES
-- (1, 1, 'Admin', 'Principal', 'admin', 'TU_PASSWORD_SEGURA', NULL, 1);

SET FOREIGN_KEY_CHECKS = 1;
