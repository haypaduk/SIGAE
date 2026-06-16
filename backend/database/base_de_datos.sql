-- =====================================================
-- SIGAE - Sistema de Gestión de Aulas y Espacios
-- Universidad Tecnológica del Valle de Toluca (UTVT)
-- BASE DE DATOS - SOLO ESTRUCTURA (sin datos de ejemplo)
-- =====================================================
-- VERSIÓN: 1.0
-- FECHA: Junio 2026
-- =====================================================

-- =====================================================
-- 1. CREAR Y SELECCIONAR BASE DE DATOS
-- =====================================================

CREATE DATABASE IF NOT EXISTS sigae_db;
USE sigae_db;

-- =====================================================
-- 2. TABLAS CATÁLOGO (Datos maestros)
-- =====================================================

-- -----------------------------------------------------
-- edificios: Catálogo de edificios del campus
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS edificios (
    id_edificio INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    tipo_edificio ENUM('Docencia', 'Pesados') NOT NULL,
    ubicacion VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------
-- tipos_aula: Clasificación de tipos de espacios
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS tipos_aula (
    id_tipo_aula INT PRIMARY KEY AUTO_INCREMENT,
    nombre_tipo VARCHAR(30) NOT NULL,
    descripcion TEXT
);

-- -----------------------------------------------------
-- carreras: Catálogo de carreras de la universidad
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS carreras (
    id_carrera INT PRIMARY KEY AUTO_INCREMENT,
    clave_carrera VARCHAR(10) UNIQUE NOT NULL,
    nombre_carrera VARCHAR(100) NOT NULL,
    activo BOOLEAN DEFAULT TRUE
);

-- -----------------------------------------------------
-- aulas: Catálogo de todas las aulas y auditorios
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS aulas (
    id_aula INT PRIMARY KEY AUTO_INCREMENT,
    id_edificio INT NOT NULL,
    id_tipo_aula INT NOT NULL,
    identificador VARCHAR(20) NOT NULL,
    piso ENUM('Planta Baja', 'Planta Alta') NOT NULL,
    capacidad INT NOT NULL,
    id_carrera_asignada INT,
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (id_edificio) REFERENCES edificios(id_edificio),
    FOREIGN KEY (id_tipo_aula) REFERENCES tipos_aula(id_tipo_aula),
    FOREIGN KEY (id_carrera_asignada) REFERENCES carreras(id_carrera)
);

-- -----------------------------------------------------
-- turnos: Turnos académicos (Matutino/Vespertino)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS turnos (
    id_turno INT PRIMARY KEY AUTO_INCREMENT,
    nombre_turno VARCHAR(20) NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL
);

-- -----------------------------------------------------
-- dias_semana: Días de la semana (Lunes a Sábado)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS dias_semana (
    id_dia INT PRIMARY KEY AUTO_INCREMENT,
    nombre_dia VARCHAR(10) NOT NULL,
    orden INT NOT NULL,
    activo_sabado BOOLEAN DEFAULT TRUE
);

-- -----------------------------------------------------
-- bloques_horarios: Franjas horarias de 50 minutos
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS bloques_horarios (
    id_bloque INT PRIMARY KEY AUTO_INCREMENT,
    id_turno INT NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    orden_dia INT NOT NULL,
    FOREIGN KEY (id_turno) REFERENCES turnos(id_turno)
);

-- =====================================================
-- 3. TABLAS DE USUARIOS Y SEGURIDAD
-- =====================================================

-- -----------------------------------------------------
-- usuarios: Todos los usuarios del sistema
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(100) NOT NULL,
    rol ENUM('admin', 'director') NOT NULL,
    id_carrera INT NULL,
    foto_perfil VARCHAR(255) DEFAULT '/img/avatar.png',
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_carrera) REFERENCES carreras(id_carrera)
);

-- =====================================================
-- 4. TABLAS DE NEGOCIO (RESERVAS Y SOLICITUDES)
-- =====================================================

-- -----------------------------------------------------
-- reservas: Asignaciones de aulas a materias
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS reservas (
    id_reserva INT PRIMARY KEY AUTO_INCREMENT,
    id_aula INT NOT NULL,
    id_usuario INT NOT NULL,
    id_dia INT NOT NULL,
    id_bloque INT NOT NULL,
    fecha_reserva DATE NOT NULL,
    fecha_asignacion DATE NOT NULL,
    materia VARCHAR(100) NOT NULL,
    profesor VARCHAR(100) NOT NULL,
    grupo VARCHAR(20) NOT NULL,
    estado ENUM('activa', 'cancelada', 'reasignada') DEFAULT 'activa',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modificado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_aula) REFERENCES aulas(id_aula),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_dia) REFERENCES dias_semana(id_dia),
    FOREIGN KEY (id_bloque) REFERENCES bloques_horarios(id_bloque),
    UNIQUE KEY uk_reserva_unica (id_aula, fecha_asignacion, id_dia, id_bloque)
);

-- -----------------------------------------------------
-- solicitudes: Peticiones entre directores
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS solicitudes (
    id_solicitud INT PRIMARY KEY AUTO_INCREMENT,
    id_aula INT NOT NULL,
    id_solicitante INT NOT NULL,
    id_destinatario INT NOT NULL,
    fecha_solicitud DATE NOT NULL,
    fecha_uso DATE NOT NULL,
    id_turno INT NOT NULL,
    motivo TEXT,
    materia_solicitada VARCHAR(100),
    profesor_solicitado VARCHAR(100),
    grupo_solicitado VARCHAR(20),
    estado ENUM('pendiente', 'aprobada', 'rechazada') DEFAULT 'pendiente',
    respuesta_fecha TIMESTAMP NULL,
    respuesta_comentario TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_aula) REFERENCES aulas(id_aula),
    FOREIGN KEY (id_solicitante) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_destinatario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_turno) REFERENCES turnos(id_turno)
);

-- =====================================================
-- 5. TABLAS AUXILIARES
-- =====================================================

-- -----------------------------------------------------
-- notificaciones: Para WebSockets (tiempo real)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS notificaciones (
    id_notificacion INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    id_solicitud INT NULL,
    titulo VARCHAR(100) NOT NULL,
    mensaje TEXT NOT NULL,
    leida BOOLEAN DEFAULT FALSE,
    tipo ENUM('solicitud', 'sistema') DEFAULT 'solicitud',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_solicitud) REFERENCES solicitudes(id_solicitud)
);

-- -----------------------------------------------------
-- logs_auditoria: Auditoría de acciones (RNF-03)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS logs_auditoria (
    id_log INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    accion VARCHAR(50) NOT NULL,
    tabla_afectada VARCHAR(50) NOT NULL,
    registro_id INT NOT NULL,
    datos_previos JSON,
    datos_nuevos JSON,
    ip_origen VARCHAR(45),
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

-- -----------------------------------------------------
-- dashboard_cache: Cache para rendimiento (RNF-01)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS dashboard_cache (
    id_cache INT PRIMARY KEY AUTO_INCREMENT,
    id_edificio INT NOT NULL,
    fecha_calculo DATE NOT NULL,
    porcentaje_ocupacion DECIMAL(5,2),
    total_aulas INT,
    aulas_ocupadas_total INT,
    aulas_parcial INT,
    aulas_libres INT,
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_edificio) REFERENCES edificios(id_edificio),
    UNIQUE KEY uk_cache_edificio_fecha (id_edificio, fecha_calculo)
);

-- =====================================================
-- 6. DATOS BÁSICOS OBLIGATORIOS (Catálogos mínimos)
-- =====================================================

-- Insertar tipos de aula (obligatorios)
INSERT INTO tipos_aula (nombre_tipo, descripcion) VALUES
('Docencia', 'Aula regular para clases teóricas'),
('Laboratorio Pesado', 'Laboratorio con equipo especializado'),
('Auditorio', 'Espacio para eventos y conferencias');

-- Insertar turnos (obligatorios)
INSERT INTO turnos (nombre_turno, hora_inicio, hora_fin) VALUES
('Matutino', '07:00:00', '15:20:00'),
('Vespertino', '15:20:00', '21:10:00');

-- Insertar días de semana (obligatorios)
INSERT INTO dias_semana (nombre_dia, orden, activo_sabado) VALUES
('Lunes', 1, TRUE),
('Martes', 2, TRUE),
('Miércoles', 3, TRUE),
('Jueves', 4, TRUE),
('Viernes', 5, TRUE),
('Sábado', 6, FALSE);

-- Insertar bloques horarios (obligatorios)
-- Matutino: 10 bloques
INSERT INTO bloques_horarios (id_turno, hora_inicio, hora_fin, orden_dia) VALUES
(1, '07:00:00', '07:50:00', 1),
(1, '07:50:00', '08:40:00', 2),
(1, '08:40:00', '09:30:00', 3),
(1, '09:30:00', '10:20:00', 4),
(1, '10:20:00', '11:10:00', 5),
(1, '11:10:00', '12:00:00', 6),
(1, '12:00:00', '12:50:00', 7),
(1, '12:50:00', '13:40:00', 8),
(1, '13:40:00', '14:30:00', 9),
(1, '14:30:00', '15:20:00', 10);

-- Vespertino: 7 bloques
INSERT INTO bloques_horarios (id_turno, hora_inicio, hora_fin, orden_dia) VALUES
(2, '15:20:00', '16:10:00', 1),
(2, '16:10:00', '17:00:00', 2),
(2, '17:00:00', '17:50:00', 3),
(2, '17:50:00', '18:40:00', 4),
(2, '18:40:00', '19:30:00', 5),
(2, '19:30:00', '20:20:00', 6),
(2, '20:20:00', '21:10:00', 7);

-- =====================================================
-- FIN DEL SCRIPT DE ESTRUCTURA
-- =====================================================



USE sigae_db;

-- =====================================================
-- 1. VERIFICAR QUE EXISTAN LAS CARRERAS
-- =====================================================

-- Verificar si ya existen las carreras
SELECT * FROM carreras WHERE clave_carrera IN ('IDS', 'RIC');

-- Si NO existen, insertarlas:
INSERT INTO carreras (clave_carrera, nombre_carrera) VALUES
('IDS', 'Ingeniería en Desarrollo y Gestión de Software'),
('RIC', 'Ingeniería en Redes Inteligentes y Ciberseguridad');

-- =====================================================
-- 2. CREAR DIRECTOR DE CARRERA
-- =====================================================

-- Para asignar ambas carreras al mismo director, 
-- primero creamos el usuario y luego lo asociamos a las carreras

-- Insertar director
INSERT INTO usuarios (email, password, nombre_completo, rol, activo) 
VALUES (
    'informatica@utvtol.edu.mx', 
    'Mill4nH1noj0sa2026!', 
    'CARLOS MILLÁN HINOJOSA', 
    'director', 
    1
);

-- Obtener el ID del director recién creado
SET @director_id = LAST_INSERT_ID();

-- Asociar el director a las dos carreras
-- NOTA: Como un usuario solo puede tener una carrera en la tabla usuarios,
-- creamos una tabla de relación si es necesario, o asignamos una principal

-- Opción 1: Si solo puede tener una carrera principal (recomendado)
UPDATE usuarios SET id_carrera = (SELECT id_carrera FROM carreras WHERE clave_carrera = 'IDS') 
WHERE id_usuario = @director_id;

-- Opción 2: Si necesitas que tenga ambas, crea una tabla intermedia
-- (esto solo si el sistema lo requiere, por ahora asignamos IDS como principal)

-- =====================================================
-- 3. CREAR ADMINISTRADOR
-- =====================================================

INSERT INTO usuarios (email, password, nombre_completo, rol, activo) 
VALUES (
    'admin@utvtol.edu.mx', 
    'AdminSIGAE2026!', 
    'Administrador del Sistema', 
    'admin', 
    1
);

-- =====================================================
-- 4. VERIFICAR USUARIOS CREADOS
-- =====================================================

SELECT u.id_usuario, u.email, u.nombre_completo, u.rol, c.clave_carrera, c.nombre_carrera
FROM usuarios u
LEFT JOIN carreras c ON u.id_carrera = c.id_carrera
WHERE u.email IN ('informatica@utvtol.edu.mx', 'admin@utvtol.edu.mx');

-- Crear tabla intermedia (si no existe)
CREATE TABLE IF NOT EXISTS usuarios_carreras (
    id_usuario INT NOT NULL,
    id_carrera INT NOT NULL,
    PRIMARY KEY (id_usuario, id_carrera),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_carrera) REFERENCES carreras(id_carrera)
);

-- Asociar director a ambas carreras
INSERT INTO usuarios_carreras (id_usuario, id_carrera) VALUES
(@director_id, (SELECT id_carrera FROM carreras WHERE clave_carrera = 'IDS')),
(@director_id, (SELECT id_carrera FROM carreras WHERE clave_carrera = 'RIC'));