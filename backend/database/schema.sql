-- KRM Rent Car
-- Esquema exportado desde la base local

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `alquiler_detalle`;
CREATE TABLE `alquiler_detalle` (
  `detalle_alquiler_id` int NOT NULL AUTO_INCREMENT,
  `alquiler_id` int NOT NULL,
  `vehiculo_id` int NOT NULL,
  `precio_dia` decimal(10,2) NOT NULL,
  `cantidad_dias` int NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `estado` enum('ACTIVO','DEVUELTO','CANCELADO') NOT NULL DEFAULT 'ACTIVO',
  PRIMARY KEY (`detalle_alquiler_id`),
  KEY `fk_alquiler_detalle_alquiler` (`alquiler_id`),
  KEY `fk_alquiler_detalle_vehiculo` (`vehiculo_id`),
  CONSTRAINT `fk_alquiler_detalle_alquiler` FOREIGN KEY (`alquiler_id`) REFERENCES `alquileres` (`alquiler_id`),
  CONSTRAINT `fk_alquiler_detalle_vehiculo` FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos` (`vehiculo_id`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `alquileres`;
CREATE TABLE `alquileres` (
  `alquiler_id` int NOT NULL AUTO_INCREMENT,
  `cliente_id` int NOT NULL,
  `usuario_id` int NOT NULL,
  `fecha_alquiler` date NOT NULL,
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date NOT NULL,
  `monto_total` decimal(10,2) NOT NULL DEFAULT '0.00',
  `observacion` varchar(255) DEFAULT NULL,
  `estado` enum('PENDIENTE','ACTIVO','FINALIZADO','CANCELADO') NOT NULL DEFAULT 'PENDIENTE',
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`alquiler_id`),
  KEY `fk_alquileres_clientes` (`cliente_id`),
  KEY `fk_alquileres_usuarios` (`usuario_id`),
  CONSTRAINT `fk_alquileres_clientes` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`cliente_id`),
  CONSTRAINT `fk_alquileres_usuarios` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`usuario_id`),
  CONSTRAINT `chk_fechas_alquiler` CHECK ((`fecha_fin` > `fecha_inicio`))
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `bitacora_usuarios`;
CREATE TABLE `bitacora_usuarios` (
  `bitacora_id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `accion` varchar(100) NOT NULL,
  `descripcion` text,
  `fecha` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ip_origen` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`bitacora_id`),
  KEY `fk_bitacora_usuarios` (`usuario_id`),
  CONSTRAINT `fk_bitacora_usuarios` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`usuario_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `clientes`;
CREATE TABLE `clientes` (
  `cliente_id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `cedula` varchar(20) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `imagen_url` varchar(255) DEFAULT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`cliente_id`),
  UNIQUE KEY `cedula` (`cedula`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `devolucion_detalle`;
CREATE TABLE `devolucion_detalle` (
  `detalle_devolucion_id` int NOT NULL AUTO_INCREMENT,
  `devolucion_id` int NOT NULL,
  `vehiculo_id` int NOT NULL,
  `combustible_devuelto` decimal(10,2) DEFAULT NULL,
  `kilometraje_devuelto` int DEFAULT NULL,
  `danos` varchar(255) DEFAULT NULL,
  `cargo_extra` decimal(10,2) NOT NULL DEFAULT '0.00',
  `estado` enum('ACTIVO','ANULADO') NOT NULL DEFAULT 'ACTIVO',
  PRIMARY KEY (`detalle_devolucion_id`),
  KEY `fk_devolucion_detalle_devolucion` (`devolucion_id`),
  KEY `fk_devolucion_detalle_vehiculo` (`vehiculo_id`),
  CONSTRAINT `fk_devolucion_detalle_devolucion` FOREIGN KEY (`devolucion_id`) REFERENCES `devoluciones` (`devolucion_id`),
  CONSTRAINT `fk_devolucion_detalle_vehiculo` FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos` (`vehiculo_id`)
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `devoluciones`;
CREATE TABLE `devoluciones` (
  `devolucion_id` int NOT NULL AUTO_INCREMENT,
  `alquiler_id` int NOT NULL,
  `usuario_id` int NOT NULL,
  `fecha_devolucion` date NOT NULL,
  `observaciones` varchar(255) DEFAULT NULL,
  `imagen_evidencia_url` varchar(255) DEFAULT NULL,
  `estado` enum('REGISTRADA','ANULADA') NOT NULL DEFAULT 'REGISTRADA',
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`devolucion_id`),
  KEY `fk_devoluciones_alquileres` (`alquiler_id`),
  KEY `fk_devoluciones_usuarios` (`usuario_id`),
  CONSTRAINT `fk_devoluciones_alquileres` FOREIGN KEY (`alquiler_id`) REFERENCES `alquileres` (`alquiler_id`),
  CONSTRAINT `fk_devoluciones_usuarios` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`usuario_id`)
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `feriados`;
CREATE TABLE `feriados` (
  `feriado_id` int NOT NULL AUTO_INCREMENT,
  `fecha` date NOT NULL,
  `descripcion` varchar(100) NOT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`feriado_id`),
  UNIQUE KEY `fecha` (`fecha`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `gamas`;
CREATE TABLE `gamas` (
  `gama_id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`gama_id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `pago_detalle`;
CREATE TABLE `pago_detalle` (
  `detalle_pago_id` int NOT NULL AUTO_INCREMENT,
  `pago_id` int NOT NULL,
  `tipo_cargo` enum('ALQUILER','PENALIDAD') NOT NULL,
  `referencia_id` int NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `estado` enum('ACTIVO','ANULADO') NOT NULL DEFAULT 'ACTIVO',
  PRIMARY KEY (`detalle_pago_id`),
  KEY `fk_pago_detalle_pagos` (`pago_id`),
  CONSTRAINT `fk_pago_detalle_pagos` FOREIGN KEY (`pago_id`) REFERENCES `pagos` (`pago_id`)
) ENGINE=InnoDB AUTO_INCREMENT=68 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `pagos`;
CREATE TABLE `pagos` (
  `pago_id` int NOT NULL AUTO_INCREMENT,
  `alquiler_id` int NOT NULL,
  `usuario_id` int NOT NULL,
  `fecha_pago` date NOT NULL,
  `metodo_pago` enum('EFECTIVO','TARJETA','TRANSFERENCIA') NOT NULL,
  `total_recibo` decimal(10,2) NOT NULL DEFAULT '0.00',
  `estado` enum('REGISTRADO','ANULADO') NOT NULL DEFAULT 'REGISTRADO',
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`pago_id`),
  KEY `fk_pagos_alquileres` (`alquiler_id`),
  KEY `fk_pagos_usuarios` (`usuario_id`),
  CONSTRAINT `fk_pagos_alquileres` FOREIGN KEY (`alquiler_id`) REFERENCES `alquileres` (`alquiler_id`),
  CONSTRAINT `fk_pagos_usuarios` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`usuario_id`)
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `penalidades`;
CREATE TABLE `penalidades` (
  `penalidad_id` int NOT NULL AUTO_INCREMENT,
  `alquiler_id` int NOT NULL,
  `vehiculo_id` int DEFAULT NULL,
  `tipo` enum('RETRASO','DANO','COMBUSTIBLE','OTRO') NOT NULL,
  `descripcion` varchar(255) NOT NULL,
  `imagen_dano_url` varchar(255) DEFAULT NULL,
  `dias_retraso` int NOT NULL DEFAULT '0',
  `monto` decimal(10,2) NOT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `estado` enum('PENDIENTE','PAGADA','ANULADA') NOT NULL DEFAULT 'PENDIENTE',
  PRIMARY KEY (`penalidad_id`),
  KEY `fk_penalidades_alquileres` (`alquiler_id`),
  KEY `fk_penalidades_vehiculos` (`vehiculo_id`),
  CONSTRAINT `fk_penalidades_alquileres` FOREIGN KEY (`alquiler_id`) REFERENCES `alquileres` (`alquiler_id`),
  CONSTRAINT `fk_penalidades_vehiculos` FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos` (`vehiculo_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `permisos`;
CREATE TABLE `permisos` (
  `permiso_id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `modulo` varchar(50) NOT NULL,
  PRIMARY KEY (`permiso_id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `precios_vehiculo`;
CREATE TABLE `precios_vehiculo` (
  `precio_id` int NOT NULL AUTO_INCREMENT,
  `vehiculo_id` int NOT NULL,
  `tipo_dia_id` int NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`precio_id`),
  UNIQUE KEY `uq_precios_vehiculo` (`vehiculo_id`,`tipo_dia_id`),
  KEY `fk_precios_tipo_dia` (`tipo_dia_id`),
  CONSTRAINT `fk_precios_tipo_dia` FOREIGN KEY (`tipo_dia_id`) REFERENCES `tipo_dia` (`tipo_dia_id`),
  CONSTRAINT `fk_precios_vehiculo` FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos` (`vehiculo_id`)
) ENGINE=InnoDB AUTO_INCREMENT=58 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `recepcion_detalle`;
CREATE TABLE `recepcion_detalle` (
  `detalle_recepcion_id` int NOT NULL AUTO_INCREMENT,
  `recepcion_id` int NOT NULL,
  `vehiculo_id` int NOT NULL,
  `combustible_devuelto` decimal(5,2) DEFAULT NULL,
  `kilometraje_devuelto` int DEFAULT NULL,
  `danos` varchar(100) DEFAULT NULL,
  `estado` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`detalle_recepcion_id`),
  KEY `recepcion_id` (`recepcion_id`),
  CONSTRAINT `recepcion_detalle_ibfk_1` FOREIGN KEY (`recepcion_id`) REFERENCES `recepciones` (`recepcion_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `recepciones`;
CREATE TABLE `recepciones` (
  `recepcion_id` int NOT NULL AUTO_INCREMENT,
  `reserva_id` int NOT NULL,
  `usuario_id` int NOT NULL,
  `fecha_recepcion` datetime DEFAULT NULL,
  `observaciones` varchar(100) DEFAULT NULL,
  `estado` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`recepcion_id`),
  KEY `reserva_id` (`reserva_id`),
  CONSTRAINT `recepciones_ibfk_1` FOREIGN KEY (`reserva_id`) REFERENCES `reservas` (`reserva_id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `reserva_vehiculos`;
CREATE TABLE `reserva_vehiculos` (
  `detalle_id` int NOT NULL AUTO_INCREMENT,
  `reserva_id` int NOT NULL,
  `vehiculo_id` int NOT NULL,
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `dias` int NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `estado` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`detalle_id`),
  KEY `reserva_id` (`reserva_id`),
  KEY `vehiculo_id` (`vehiculo_id`),
  CONSTRAINT `reserva_vehiculos_ibfk_1` FOREIGN KEY (`reserva_id`) REFERENCES `reservas` (`reserva_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `reserva_vehiculos_ibfk_2` FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos` (`vehiculo_id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `reservas`;
CREATE TABLE `reservas` (
  `reserva_id` int NOT NULL AUTO_INCREMENT,
  `cliente_id` int NOT NULL,
  `usuario_id` int NOT NULL,
  `fecha_reserva` datetime DEFAULT NULL,
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date NOT NULL,
  `monto_total` decimal(10,2) DEFAULT '0.00',
  `estado` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`reserva_id`),
  KEY `cliente_id` (`cliente_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `reservas_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`cliente_id`) ON UPDATE CASCADE,
  CONSTRAINT `reservas_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`usuario_id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `rol_permisos`;
CREATE TABLE `rol_permisos` (
  `rol_id` int NOT NULL,
  `permiso_id` int NOT NULL,
  PRIMARY KEY (`rol_id`,`permiso_id`),
  KEY `fk_rol_permisos_permiso` (`permiso_id`),
  CONSTRAINT `fk_rol_permisos_permiso` FOREIGN KEY (`permiso_id`) REFERENCES `permisos` (`permiso_id`),
  CONSTRAINT `fk_rol_permisos_rol` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`rol_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `rol_id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`rol_id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `tipo_dia`;
CREATE TABLE `tipo_dia` (
  `tipo_dia_id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`tipo_dia_id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE `usuarios` (
  `usuario_id` int NOT NULL AUTO_INCREMENT,
  `rol_id` int NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `imagen_url` varchar(255) DEFAULT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`usuario_id`),
  UNIQUE KEY `username` (`username`),
  KEY `fk_usuarios_roles` (`rol_id`),
  CONSTRAINT `fk_usuarios_roles` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`rol_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `vehiculos`;
CREATE TABLE `vehiculos` (
  `vehiculo_id` int NOT NULL AUTO_INCREMENT,
  `gama_id` int NOT NULL,
  `marca` varchar(50) NOT NULL,
  `modelo` varchar(50) NOT NULL,
  `anio` int NOT NULL,
  `placa` varchar(20) NOT NULL,
  `tipo` varchar(50) NOT NULL,
  `imagen_url` varchar(255) DEFAULT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`vehiculo_id`),
  UNIQUE KEY `placa` (`placa`),
  KEY `fk_vehiculos_gamas` (`gama_id`),
  CONSTRAINT `fk_vehiculos_gamas` FOREIGN KEY (`gama_id`) REFERENCES `gamas` (`gama_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET FOREIGN_KEY_CHECKS = 1;
