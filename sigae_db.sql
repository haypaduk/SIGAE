/*
SQLyog Community v13.3.0 (64 bit)
MySQL - 10.4.32-MariaDB : Database - sigae_db
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE /*!32312 IF NOT EXISTS*/`sigae_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;

USE `sigae_db`;

/*Table structure for table `aulas` */

DROP TABLE IF EXISTS `aulas`;

CREATE TABLE `aulas` (
  `id_aula` int(11) NOT NULL AUTO_INCREMENT,
  `id_edificio` int(11) NOT NULL,
  `id_tipo_aula` int(11) NOT NULL,
  `identificador` varchar(20) NOT NULL,
  `piso` enum('Planta Baja','Planta Alta') NOT NULL,
  `capacidad` int(11) NOT NULL,
  `id_carrera_asignada` int(11) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id_aula`),
  KEY `id_edificio` (`id_edificio`),
  KEY `id_tipo_aula` (`id_tipo_aula`),
  KEY `id_carrera_asignada` (`id_carrera_asignada`),
  CONSTRAINT `aulas_ibfk_1` FOREIGN KEY (`id_edificio`) REFERENCES `edificios` (`id_edificio`),
  CONSTRAINT `aulas_ibfk_2` FOREIGN KEY (`id_tipo_aula`) REFERENCES `tipos_aula` (`id_tipo_aula`),
  CONSTRAINT `aulas_ibfk_3` FOREIGN KEY (`id_carrera_asignada`) REFERENCES `carreras` (`id_carrera`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `aulas` */

insert  into `aulas`(`id_aula`,`id_edificio`,`id_tipo_aula`,`identificador`,`piso`,`capacidad`,`id_carrera_asignada`,`activo`) values 
(2,3,1,'A101','Planta Alta',40,1,1),
(3,4,1,'A102','Planta Baja',60,2,1),
(4,5,1,'E116','Planta Alta',50,3,1);

/*Table structure for table `bloques_horarios` */

DROP TABLE IF EXISTS `bloques_horarios`;

CREATE TABLE `bloques_horarios` (
  `id_bloque` int(11) NOT NULL AUTO_INCREMENT,
  `id_turno` int(11) NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL,
  `orden_dia` int(11) NOT NULL,
  PRIMARY KEY (`id_bloque`),
  KEY `id_turno` (`id_turno`),
  CONSTRAINT `bloques_horarios_ibfk_1` FOREIGN KEY (`id_turno`) REFERENCES `turnos` (`id_turno`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `bloques_horarios` */

insert  into `bloques_horarios`(`id_bloque`,`id_turno`,`hora_inicio`,`hora_fin`,`orden_dia`) values 
(1,1,'07:00:00','07:50:00',1),
(2,1,'07:50:00','08:40:00',2),
(3,1,'08:40:00','09:30:00',3),
(4,1,'09:30:00','10:20:00',4),
(5,1,'10:20:00','11:10:00',5),
(6,1,'11:10:00','12:00:00',6),
(7,1,'12:00:00','12:50:00',7),
(8,1,'12:50:00','13:40:00',8),
(9,1,'13:40:00','14:30:00',9),
(10,1,'14:30:00','15:20:00',10),
(11,2,'15:20:00','16:10:00',1),
(12,2,'16:10:00','17:00:00',2),
(13,2,'17:00:00','17:50:00',3),
(14,2,'17:50:00','18:40:00',4),
(15,2,'18:40:00','19:30:00',5),
(16,2,'19:30:00','20:20:00',6),
(17,2,'20:20:00','21:10:00',7);

/*Table structure for table `carreras` */

DROP TABLE IF EXISTS `carreras`;

CREATE TABLE `carreras` (
  `id_carrera` int(11) NOT NULL AUTO_INCREMENT,
  `clave_carrera` varchar(10) NOT NULL,
  `nombre_carrera` varchar(100) NOT NULL,
  `activo` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id_carrera`),
  UNIQUE KEY `clave_carrera` (`clave_carrera`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `carreras` */

insert  into `carreras`(`id_carrera`,`clave_carrera`,`nombre_carrera`,`activo`) values 
(1,'IDS','Ingeniería en Desarrollo y Gestión de Software',1),
(2,'RIC','Ingeniería en Redes Inteligentes y Ciberseguridad',1),
(3,'ENF','Enfermería',1),
(4,'TC','The Coalition',1);

/*Table structure for table `dashboard_cache` */

DROP TABLE IF EXISTS `dashboard_cache`;

CREATE TABLE `dashboard_cache` (
  `id_cache` int(11) NOT NULL AUTO_INCREMENT,
  `id_edificio` int(11) NOT NULL,
  `fecha_calculo` date NOT NULL,
  `porcentaje_ocupacion` decimal(5,2) DEFAULT NULL,
  `total_aulas` int(11) DEFAULT NULL,
  `aulas_ocupadas_total` int(11) DEFAULT NULL,
  `aulas_parcial` int(11) DEFAULT NULL,
  `aulas_libres` int(11) DEFAULT NULL,
  `ultima_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_cache`),
  UNIQUE KEY `uk_cache_edificio_fecha` (`id_edificio`,`fecha_calculo`),
  CONSTRAINT `dashboard_cache_ibfk_1` FOREIGN KEY (`id_edificio`) REFERENCES `edificios` (`id_edificio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `dashboard_cache` */

/*Table structure for table `dias_semana` */

DROP TABLE IF EXISTS `dias_semana`;

CREATE TABLE `dias_semana` (
  `id_dia` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_dia` varchar(10) NOT NULL,
  `orden` int(11) NOT NULL,
  `activo_sabado` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id_dia`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `dias_semana` */

insert  into `dias_semana`(`id_dia`,`nombre_dia`,`orden`,`activo_sabado`) values 
(1,'Lunes',1,1),
(2,'Martes',2,1),
(3,'Miércoles',3,1),
(4,'Jueves',4,1),
(5,'Viernes',5,1),
(6,'Sábado',6,1);

/*Table structure for table `edificios` */

DROP TABLE IF EXISTS `edificios`;

CREATE TABLE `edificios` (
  `id_edificio` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  `tipo_edificio` enum('Docencia','Pesados') NOT NULL,
  `ubicacion` varchar(100) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_edificio`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `edificios` */

insert  into `edificios`(`id_edificio`,`nombre`,`tipo_edificio`,`ubicacion`,`activo`,`creado_en`) values 
(3,'Docencia #1','Docencia','Zona Sur',1,'2026-06-25 13:00:33'),
(4,'Docencia #2','Docencia','Zona Norte',1,'2026-06-29 18:56:21'),
(5,'Docencia #4','Docencia','UTVT',1,'2026-06-30 11:00:42');

/*Table structure for table `logs_auditoria` */

DROP TABLE IF EXISTS `logs_auditoria`;

CREATE TABLE `logs_auditoria` (
  `id_log` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `accion` varchar(50) NOT NULL,
  `tabla_afectada` varchar(50) NOT NULL,
  `registro_id` int(11) NOT NULL,
  `datos_previos` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`datos_previos`)),
  `datos_nuevos` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`datos_nuevos`)),
  `ip_origen` varchar(45) DEFAULT NULL,
  `fecha_hora` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_log`),
  KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `logs_auditoria_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `logs_auditoria` */

/*Table structure for table `materias` */

DROP TABLE IF EXISTS `materias`;

CREATE TABLE `materias` (
  `id_materia` int(11) NOT NULL AUTO_INCREMENT,
  `clave` varchar(10) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `id_carrera` int(11) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_materia`),
  UNIQUE KEY `clave` (`clave`),
  KEY `id_carrera` (`id_carrera`),
  CONSTRAINT `materias_ibfk_1` FOREIGN KEY (`id_carrera`) REFERENCES `carreras` (`id_carrera`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `materias` */

insert  into `materias`(`id_materia`,`clave`,`nombre`,`id_carrera`,`activo`,`creado_en`) values 
(1,'DWI','Desarrollo Web Integral',1,1,'2026-06-25 17:33:02'),
(3,'BIO','Bioquímica',3,1,'2026-06-30 11:26:46');

/*Table structure for table `notificaciones` */

DROP TABLE IF EXISTS `notificaciones`;

CREATE TABLE `notificaciones` (
  `id_notificacion` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `id_solicitud` int(11) DEFAULT NULL,
  `titulo` varchar(100) NOT NULL,
  `mensaje` text NOT NULL,
  `leida` tinyint(1) DEFAULT 0,
  `tipo` enum('solicitud','sistema') DEFAULT 'solicitud',
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_notificacion`),
  KEY `id_usuario` (`id_usuario`),
  KEY `id_solicitud` (`id_solicitud`),
  CONSTRAINT `notificaciones_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `notificaciones_ibfk_2` FOREIGN KEY (`id_solicitud`) REFERENCES `solicitudes` (`id_solicitud`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `notificaciones` */

/*Table structure for table `profesores` */

DROP TABLE IF EXISTS `profesores`;

CREATE TABLE `profesores` (
  `id_profesor` int(11) NOT NULL AUTO_INCREMENT,
  `clave` varchar(10) NOT NULL,
  `nombre_completo` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_profesor`),
  UNIQUE KEY `clave` (`clave`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `profesores` */

insert  into `profesores`(`id_profesor`,`clave`,`nombre_completo`,`email`,`activo`,`creado_en`) values 
(1,'RVCM','Roberto Vinicio Camacho Mendoza','rcamacho@utvto.edu.mx',1,'2026-06-25 17:05:27'),
(2,'I','Isabel','isabel@utvto.edu.mx',1,'2026-06-30 11:52:54');

/*Table structure for table `reservas` */

DROP TABLE IF EXISTS `reservas`;

CREATE TABLE `reservas` (
  `id_reserva` int(11) NOT NULL AUTO_INCREMENT,
  `id_aula` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `id_dia` int(11) NOT NULL,
  `id_bloque` int(11) NOT NULL,
  `fecha_reserva` date NOT NULL,
  `fecha_asignacion` date NOT NULL,
  `grupo` varchar(20) NOT NULL,
  `estado` enum('activa','cancelada','reasignada') DEFAULT 'activa',
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `modificado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `id_materia` int(11) DEFAULT NULL,
  `id_profesor` int(11) DEFAULT NULL,
  `tipo_reserva` enum('clase','evento') DEFAULT 'clase',
  `evento_nombre` varchar(100) DEFAULT NULL,
  `evento_descripcion` text DEFAULT NULL,
  PRIMARY KEY (`id_reserva`),
  UNIQUE KEY `unique_reserva_aula_dia_bloque` (`id_aula`,`id_dia`,`id_bloque`,`fecha_asignacion`),
  KEY `id_usuario` (`id_usuario`),
  KEY `id_dia` (`id_dia`),
  KEY `id_bloque` (`id_bloque`),
  KEY `id_materia` (`id_materia`),
  KEY `id_profesor` (`id_profesor`),
  CONSTRAINT `reservas_ibfk_1` FOREIGN KEY (`id_aula`) REFERENCES `aulas` (`id_aula`),
  CONSTRAINT `reservas_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `reservas_ibfk_3` FOREIGN KEY (`id_dia`) REFERENCES `dias_semana` (`id_dia`),
  CONSTRAINT `reservas_ibfk_4` FOREIGN KEY (`id_bloque`) REFERENCES `bloques_horarios` (`id_bloque`),
  CONSTRAINT `reservas_ibfk_5` FOREIGN KEY (`id_materia`) REFERENCES `materias` (`id_materia`),
  CONSTRAINT `reservas_ibfk_6` FOREIGN KEY (`id_profesor`) REFERENCES `profesores` (`id_profesor`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `reservas` */

insert  into `reservas`(`id_reserva`,`id_aula`,`id_usuario`,`id_dia`,`id_bloque`,`fecha_reserva`,`fecha_asignacion`,`grupo`,`estado`,`creado_en`,`modificado_en`,`id_materia`,`id_profesor`,`tipo_reserva`,`evento_nombre`,`evento_descripcion`) values 
(1,2,1,1,1,'2026-06-25','0000-00-00','IDGS-91','activa','2026-06-25 19:21:09','2026-07-06 16:32:46',1,1,'clase',NULL,NULL),
(3,2,5,3,1,'2026-07-02','2026-07-01','General','activa','2026-07-02 13:09:48','2026-07-02 13:09:48',NULL,NULL,'evento','Hola.','Hola.'),
(4,4,1,6,1,'2026-07-02','2026-07-02','General','activa','2026-07-02 18:12:46','2026-07-02 18:12:46',NULL,NULL,'evento','Q me ve Ramirez.','Q me ve Ramirez.');

/*Table structure for table `solicitudes` */

DROP TABLE IF EXISTS `solicitudes`;

CREATE TABLE `solicitudes` (
  `id_solicitud` int(11) NOT NULL AUTO_INCREMENT,
  `id_aula` int(11) NOT NULL,
  `id_solicitante` int(11) NOT NULL,
  `id_destinatario` int(11) NOT NULL,
  `fecha_solicitud` date NOT NULL,
  `fecha_uso` date NOT NULL,
  `id_turno` int(11) NOT NULL,
  `motivo` text DEFAULT NULL,
  `materia_solicitada` varchar(100) DEFAULT NULL,
  `profesor_solicitado` varchar(100) DEFAULT NULL,
  `grupo_solicitado` varchar(20) DEFAULT NULL,
  `estado` enum('pendiente','aprobada','rechazada') DEFAULT 'pendiente',
  `respuesta_fecha` timestamp NULL DEFAULT NULL,
  `respuesta_comentario` text DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `id_dia` int(11) DEFAULT NULL,
  `id_bloque` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_solicitud`),
  KEY `id_aula` (`id_aula`),
  KEY `id_solicitante` (`id_solicitante`),
  KEY `id_destinatario` (`id_destinatario`),
  KEY `id_turno` (`id_turno`),
  KEY `id_dia` (`id_dia`),
  KEY `id_bloque` (`id_bloque`),
  CONSTRAINT `solicitudes_ibfk_1` FOREIGN KEY (`id_aula`) REFERENCES `aulas` (`id_aula`),
  CONSTRAINT `solicitudes_ibfk_2` FOREIGN KEY (`id_solicitante`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `solicitudes_ibfk_3` FOREIGN KEY (`id_destinatario`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `solicitudes_ibfk_4` FOREIGN KEY (`id_turno`) REFERENCES `turnos` (`id_turno`),
  CONSTRAINT `solicitudes_ibfk_5` FOREIGN KEY (`id_dia`) REFERENCES `dias_semana` (`id_dia`),
  CONSTRAINT `solicitudes_ibfk_6` FOREIGN KEY (`id_bloque`) REFERENCES `bloques_horarios` (`id_bloque`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `solicitudes` */

insert  into `solicitudes`(`id_solicitud`,`id_aula`,`id_solicitante`,`id_destinatario`,`fecha_solicitud`,`fecha_uso`,`id_turno`,`motivo`,`materia_solicitada`,`profesor_solicitado`,`grupo_solicitado`,`estado`,`respuesta_fecha`,`respuesta_comentario`,`creado_en`,`id_dia`,`id_bloque`) values 
(1,2,1,1,'2026-06-30','2026-06-30',2,'Hola.','Evento','Evento','General','rechazada','2026-06-30 14:31:21','','2026-06-30 14:31:02',NULL,NULL),
(2,2,5,1,'2026-06-30','2026-07-01',1,'Hola.','Evento','Evento','General','aprobada','2026-07-02 13:09:48','','2026-06-30 14:57:48',NULL,NULL),
(3,4,1,3,'2026-07-02','0000-00-00',1,'Q me ve Ramirez.','Evento','Evento','General','aprobada','2026-07-02 18:12:46','','2026-07-02 18:10:41',6,1);

/*Table structure for table `tipos_aula` */

DROP TABLE IF EXISTS `tipos_aula`;

CREATE TABLE `tipos_aula` (
  `id_tipo_aula` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_tipo` varchar(30) NOT NULL,
  `descripcion` text DEFAULT NULL,
  PRIMARY KEY (`id_tipo_aula`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `tipos_aula` */

insert  into `tipos_aula`(`id_tipo_aula`,`nombre_tipo`,`descripcion`) values 
(1,'Aula','Aula regular para clases teóricas'),
(2,'Laboratorio','Laboratorio con equipo especializado'),
(3,'Auditorio','Espacio para eventos y conferencias');

/*Table structure for table `turnos` */

DROP TABLE IF EXISTS `turnos`;

CREATE TABLE `turnos` (
  `id_turno` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_turno` varchar(20) NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL,
  PRIMARY KEY (`id_turno`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `turnos` */

insert  into `turnos`(`id_turno`,`nombre_turno`,`hora_inicio`,`hora_fin`) values 
(1,'Matutino','07:00:00','15:20:00'),
(2,'Vespertino','15:20:00','21:10:00');

/*Table structure for table `usuarios` */

DROP TABLE IF EXISTS `usuarios`;

CREATE TABLE `usuarios` (
  `id_usuario` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `nombre_completo` varchar(100) NOT NULL,
  `rol` enum('admin','director') NOT NULL,
  `id_carrera` int(11) DEFAULT NULL,
  `foto_perfil` varchar(255) DEFAULT '/img/gobierno.jpg',
  `activo` tinyint(1) DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `email` (`email`),
  KEY `id_carrera` (`id_carrera`),
  CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`id_carrera`) REFERENCES `carreras` (`id_carrera`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `usuarios` */

insert  into `usuarios`(`id_usuario`,`email`,`password`,`nombre_completo`,`rol`,`id_carrera`,`foto_perfil`,`activo`,`creado_en`) values 
(1,'informatica@utvtol.edu.mx','Mill4nH1noj0sa2026!','CARLOS MILLÁN HINOJOSA','director',1,'/img/directores/carlos_millan.jpg',1,'2026-06-16 16:33:51'),
(2,'admin@utvtol.edu.mx','AdminSIGAE2026!','Administrador del Sistema','admin',NULL,'/img/admin.jpg',1,'2026-06-16 16:33:51'),
(3,'salud.publica@utvtol.edu.mx','Sandra2026!','Sandra Cecilia Vindel Alemán','director',NULL,'/img/directores/20260630_120118_f2dc9f6c.jpg',1,'2026-06-30 11:09:28'),
(5,'paduk@utvtol.edu.mx','123456','Josef Benjamin Colin Martinez','director',NULL,'/img/directores/20260630_122228_41e786e4.jpg',1,'2026-06-30 12:22:28');

/*Table structure for table `usuarios_carreras` */

DROP TABLE IF EXISTS `usuarios_carreras`;

CREATE TABLE `usuarios_carreras` (
  `id_usuario` int(11) NOT NULL,
  `id_carrera` int(11) NOT NULL,
  PRIMARY KEY (`id_usuario`,`id_carrera`),
  KEY `id_carrera` (`id_carrera`),
  CONSTRAINT `usuarios_carreras_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `usuarios_carreras_ibfk_2` FOREIGN KEY (`id_carrera`) REFERENCES `carreras` (`id_carrera`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `usuarios_carreras` */

insert  into `usuarios_carreras`(`id_usuario`,`id_carrera`) values 
(1,1),
(1,2),
(3,3),
(5,4);

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
